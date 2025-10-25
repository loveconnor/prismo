import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatar?: string;
  profile?: any;
  is_active?: boolean;
}

export interface AuthResponse {
  user?: User;
  user_data?: User;
  access_token?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimpleAuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Simple state management
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  // Signals
  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);
  public sessionCheckComplete = signal<boolean>(false);
  
  // API URL
  private readonly API_URL = 'https://localhost:5000/auth';
  
  constructor() {
    this.initializeAuth();
  }
  
  private initializeAuth(): void {
    console.log('Initializing authentication...');
    const token = this.getStoredToken();
    
    if (!token) {
      console.log('No stored token found');
      this.sessionCheckComplete.set(true);
      return;
    }
    
    console.log('Found stored token, verifying...');
    this.verifyStoredToken(token);
  }
  
  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('access_token');
  }
  
  private setStoredToken(token: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('access_token', token);
  }
  
  private removeStoredToken(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('access_token');
  }
  
  private verifyStoredToken(token: string): void {
    // Simple token validation - just check if it's not expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp > now) {
        console.log('Token is valid, setting user as authenticated');
        // Create a simple user object from token
        const user: User = {
          id: payload.sub || 'user-1',
          email: payload.email || 'user@example.com',
          name: payload.name || 'User',
          username: payload.username || 'user'
        };
        
        this.setAuthenticatedUser(user);
        this.sessionCheckComplete.set(true);
      } else {
        console.log('Token is expired, clearing session');
        this.clearSession();
        this.sessionCheckComplete.set(true);
      }
    } catch (error) {
      console.log('Token validation failed:', error);
      this.clearSession();
      this.sessionCheckComplete.set(true);
    }
  }
  
  private setAuthenticatedUser(user: User): void {
    this.currentUserSubject.next(user);
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.isAuthenticatedSubject.next(true);
  }
  
  private clearSession(): void {
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isAuthenticatedSubject.next(false);
    this.removeStoredToken();
  }
  
  // Public methods
  login(credentials: any): Observable<AuthResponse> {
    console.log('Attempting login...');
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap((response) => {
          console.log('Login successful:', response);
          const token = response.access_token || response.token;
          if (token) {
            this.setStoredToken(token);
            const user = response.user || response.user_data;
            if (user) {
              this.setAuthenticatedUser(user);
            }
          }
        }),
        catchError((error) => {
          console.log('Login failed:', error);
          return throwError(() => error);
        })
      );
  }
  
  logout(): void {
    console.log('Logging out...');
    this.clearSession();
    this.router.navigate(['/login']);
  }
  
  isLoggedIn(): boolean {
    const sessionComplete = this.sessionCheckComplete();
    const isAuth = this.isAuthenticated();
    
    console.log('SimpleAuthService.isLoggedIn() - Debug:', {
      sessionComplete,
      isAuth,
      result: sessionComplete && isAuth
    });
    
    return sessionComplete && isAuth;
  }
  
  getCurrentUser(): User | null {
    return this.currentUser();
  }
  
  getAccessToken(): string | null {
    return this.getStoredToken();
  }
}