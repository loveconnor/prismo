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
      },
      withCredentials: true // Ensure cookies are sent with requests
    });
  } else {
    // If no token, still send the request with credentials
    // Some endpoints might work without auth
    authReq = req.clone({
      withCredentials: true
    });
    console.log('Interceptor: No token available for request:', req.url);
  }

  return next(authReq).pipe(
    catchError(error => {
      // If we get a 401 (Unauthorized), try to refresh the token
      // But only if we actually have a token to refresh
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
    console.log('Interceptor: 401 on refresh endpoint - refresh token is invalid');
    // Refresh token is invalid, need to logout
    authService.logout();
    return throwError(() => new Error('Refresh token expired or invalid'));
  }
  
  // Check if we have a refresh token before attempting refresh
  const refreshToken = authService.getRefreshToken();
  console.log('Interceptor: Checking for refresh token:', !!refreshToken);
  
  if (!refreshToken) {
    console.log('Interceptor: No refresh token available - user needs to log in');
    // No refresh token means the user needs to log in
    authService.logout();
    return throwError(() => ({
      ...new Error('Authentication required'),
      status: 401,
      message: 'No valid authentication token. Please log in.'
    }));
  }
  
  // Try to refresh the token
  console.log('Interceptor: Attempting token refresh...');
  return authService.refreshToken().pipe(
    switchMap(() => {
      console.log('Interceptor: Token refresh successful, retrying request');
      // Retry the original request with the new token
      const newToken = authService.getAccessToken();
      console.log('Interceptor: New access token available:', !!newToken);
      
      if (newToken) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          },
          withCredentials: true
        });
        console.log('Interceptor: Retrying request to:', req.url);
        return next(authReq);
      }
      
      // If no token after refresh, something went wrong
      console.error('Interceptor: No token after successful refresh - unexpected state');
      authService.logout();
      return throwError(() => ({
        ...new Error('Authentication failed'),
        status: 401,
        message: 'Unable to authenticate. Please log in again.'
      }));
    }),
    catchError(refreshError => {
      console.error('Interceptor: Token refresh failed:', refreshError);
      
      // If refresh failed, clear the session and require fresh login
      console.log('Interceptor: Refresh failed, logging out user');
      authService.logout();
      
      // Return the original error to let the component handle it
      return throwError(() => refreshError);
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
