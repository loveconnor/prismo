import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthHttpService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:5000/auth';

  /**
   * Verify token with backend (bypasses interceptor)
   */
  verifyToken(token: string): Observable<any> {
    return this.http.post(`${this.API_URL}/verify`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Refresh token (bypasses interceptor)
   */
  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post(`${this.API_URL}/refresh`, { refresh_token: refreshToken });
  }

  /**
   * Login (bypasses interceptor)
   */
  login(credentials: any): Observable<any> {
    console.log('AuthHttpService.login called with:', credentials);
    console.log('Making request to:', `${this.API_URL}/login`);
    return this.http.post(`${this.API_URL}/login`, credentials);
  }

  /**
   * Register (bypasses interceptor)
   */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }
}
