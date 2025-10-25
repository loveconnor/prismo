import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  username: string;
  profile?: any;
  preferences?: any;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.checkAuthStatus();
  }

  // Check if user is authenticated on app initialization
  private checkAuthStatus(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.verifyToken(token);
    }
  }

  // Register a new user
  register(userData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Observable<any> {
    return this.apiService.register(userData);
  }

  // Login user
  login(credentials: {
    username: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.apiService.login(credentials);
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    this.router.navigate(['/login']);
  }

  // Verify token
  private verifyToken(token: string): void {
    this.apiService.verifyToken(token).subscribe({
      next: (response: any) => {
        if (response.valid) {
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        } else {
          this.logout();
        }
      },
      error: () => {
        this.logout();
      }
    });
  }

  // Refresh token
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }
    
    return this.apiService.refreshToken(refreshToken);
  }

  // Forgot password
  forgotPassword(email: string): Observable<any> {
    return this.apiService.forgotPassword(email);
  }

  // Confirm forgot password
  confirmForgotPassword(email: string, code: string, newPassword: string): Observable<any> {
    return this.apiService.confirmForgotPassword(email, code, newPassword);
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Set authentication state
  setAuthState(user: User, tokens: { access_token: string; refresh_token: string }): void {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  // Get stored tokens
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Handle login success
  handleLoginSuccess(response: AuthResponse): void {
    this.setAuthState(response.user, {
      access_token: response.access_token,
      refresh_token: response.refresh_token
    });
    
    this.router.navigate(['/dashboard']);
  }

  // Handle registration success
  handleRegistrationSuccess(): void {
    this.router.navigate(['/login'], {
      queryParams: { message: 'Registration successful. Please check your email for confirmation.' }
    });
  }
}
