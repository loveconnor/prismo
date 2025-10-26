import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  // Skip interceptor for auth endpoints to avoid infinite loops
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  // Get the access token
  const token = authService.getAccessToken();
  
  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      // If we get a 401 (Unauthorized), try to refresh the token
      if (error.status === 401 && token) {
        return handle401Error(req, next, authService);
      }
      
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> {
  console.log('Interceptor: Handling 401 error for request:', req.url);
  
  // Don't try to refresh if this IS the refresh endpoint
  if (req.url.includes('/auth/refresh')) {
    console.log('Interceptor: 401 on refresh endpoint, logging out');
    authService.logout();
    return throwError(() => new Error('Refresh token expired'));
  }
  
  // Try to refresh the token
  return authService.refreshToken().pipe(
    switchMap(() => {
      console.log('Interceptor: Token refresh successful, retrying request');
      // Retry the original request with the new token
      const newToken = authService.getAccessToken();
      console.log('Interceptor: New access token (first 30 chars):', newToken?.substring(0, 30));
      console.log('Interceptor: Retrying original request to:', req.url);
      if (newToken) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          }
        });
        console.log('Interceptor: Authorization header set, sending retry request');
        return next(authReq);
      }
      
      // If no token after refresh, logout
      console.log('Interceptor: No token after refresh, logging out');
      authService.logout();
      return throwError(() => new Error('Authentication failed'));
    }),
    catchError(error => {
      console.error('Interceptor: Token refresh failed, logging out');
      // Refresh failed, logout user
      authService.logout();
      return throwError(() => error);
    })
  );
}

function isAuthEndpoint(url: string): boolean {
  const authEndpoints = [
    '/api/auth/login', 
    '/api/auth/register', 
    '/api/auth/refresh', 
    '/api/auth/forgot-password',
    '/auth/login',
    '/auth/register', 
    '/auth/refresh', 
    '/auth/forgot-password',
    '/auth/verify',
    '/auth/confirm',
    '/auth/resend',
    '/api/claude/'  // Skip all Claude AI endpoints
  ];
  return authEndpoints.some(endpoint => url.includes(endpoint));
}
