import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { CookieService } from './cookie.service';
import { JwtService } from './jwt.service';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface ConfirmRegistrationData {
  email: string;
  confirmationCode: string;
}

export interface ConfirmForgotPasswordData {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export interface ProfileUpdateData {
  name?: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthError {
  message: string;
  field?: string;
  code?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  private jwtService = inject(JwtService);
  
  // Cookie names
  private readonly ACCESS_TOKEN_COOKIE = 'access_token';
  private readonly REFRESH_TOKEN_COOKIE = 'refresh_token';
  
  // API endpoint - replace with your actual API URL
  private readonly API_URL = '/api/auth';
  
  // State management
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  
  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  
  // Signals for modern Angular state
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<User | null>(null);

  constructor() {
    // Check for existing session on service initialization
    this.checkExistingSession();
  }

  /**
   * POST /auth/register - Register new user
   */
  register(userData: RegisterData): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * POST /auth/confirm - Confirm user registration
   */
  confirmRegistration(confirmData: ConfirmRegistrationData): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/confirm`, confirmData).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * POST /auth/login - User login
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.handleAuthSuccess(response, credentials.remember);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * POST /auth/refresh - Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        this.logout();
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * POST /auth/forgot-password - Initiate password reset
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, { email }).pipe(
      tap(() => {
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * POST /auth/confirm-forgot-password - Confirm password reset
   */
  confirmForgotPassword(confirmData: ConfirmForgotPasswordData): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<{ message: string }>(`${this.API_URL}/confirm-forgot-password`, confirmData).pipe(
      tap(() => {
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * GET /auth/profile - Get user profile (requires auth)
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.currentUser.set(user);
      }),
      catchError(error => {
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * PUT /auth/profile - Update user profile (requires auth)
   */
  updateProfile(profileData: ProfileUpdateData): Observable<User> {
    this.isLoadingSubject.next(true);
    
    return this.http.put<User>(`${this.API_URL}/profile`, profileData).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.currentUser.set(user);
        this.isLoadingSubject.next(false);
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * POST /auth/verify - Verify access token
   */
  verifyToken(): Observable<{ valid: boolean; user?: User }> {
    const token = this.getAccessToken();
    
    if (!token) {
      return of({ valid: false });
    }

    return this.http.post<{ valid: boolean; user?: User }>(`${this.API_URL}/verify`, { token }).pipe(
      tap(response => {
        if (response.valid && response.user) {
          this.currentUserSubject.next(response.user);
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
        } else {
          this.logout();
        }
      }),
      catchError(error => {
        this.logout();
        return this.handleAuthError(error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear cookies
    this.cookieService.delete(this.ACCESS_TOKEN_COOKIE);
    this.cookieService.delete(this.REFRESH_TOKEN_COOKIE);
    
    // Clear state
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isLoadingSubject.next(false);
    
    // Navigate to login and refresh the page
    this.router.navigate(['/login']).then(() => {
      // Force a page refresh to clear any remaining state
      window.location.reload();
    });
  }

  /**
   * Get access token from cookie
   */
  getAccessToken(): string | null {
    return this.cookieService.get(this.ACCESS_TOKEN_COOKIE);
  }

  /**
   * Get refresh token from cookie
   */
  getRefreshToken(): string | null {
    return this.cookieService.get(this.REFRESH_TOKEN_COOKIE);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Get current authentication status
   */
  isLoggedIn(): boolean {
    // Check if we have a valid access token
    const token = this.getAccessToken();
    return token ? this.jwtService.isTokenValid(token) : false;
  }

  /**
   * Demo login for development (remove in production)
   */
  demoLogin(): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    
    // Simulate API call with demo data
    const demoUser = {
      id: 'demo-user-1',
      email: 'demo@example.com',
      name: 'Demo User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
    };

    // Create demo JWT token
    const demoToken = this.jwtService.createDemoToken(demoUser, false);
    const refreshToken = this.jwtService.createDemoToken(demoUser, true);

    const demoResponse: AuthResponse = {
      user: demoUser,
      token: demoToken,
      refreshToken: refreshToken
    };

    // Simulate network delay
    return new Observable(observer => {
      setTimeout(() => {
        this.handleAuthSuccess(demoResponse);
        observer.next(demoResponse);
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Google OAuth login
   */
  loginWithGoogle(): void {
    // Implement Google OAuth flow
    console.log('Google OAuth login - implement with your OAuth provider');
    // For now, use demo login
    this.demoLogin().subscribe({
      next: () => {
        console.log('Demo Google login successful');
      },
      error: (error) => {
        console.error('Google login failed:', error);
      }
    });
  }

  private handleAuthSuccess(response: AuthResponse, remember: boolean = false): void {
    // Determine cookie expiration based on remember option
    const tokenExpiry = remember ? 30 : 1; // 30 days if remember, 1 day otherwise
    const refreshExpiry = 30; // Refresh token always lasts 30 days

    // Store tokens in HTTP-only cookies (in production, these should be set by the server)
    this.cookieService.set(this.ACCESS_TOKEN_COOKIE, response.token, {
      expires: tokenExpiry,
      secure: true, // Only over HTTPS in production
      sameSite: 'strict'
    });
    
    if (response.refreshToken) {
      this.cookieService.set(this.REFRESH_TOKEN_COOKIE, response.refreshToken, {
        expires: refreshExpiry,
        secure: true, // Only over HTTPS in production
        sameSite: 'strict'
      });
    }

    // Update state
    this.currentUserSubject.next(response.user);
    this.currentUser.set(response.user);
    this.isAuthenticated.set(true);
    this.isLoadingSubject.next(false);

    // Navigate to dashboard
    this.router.navigate(['/dashboard']);
  }

  private handleAuthError(error: any): Observable<never> {
    let authError: AuthError;

    if (error.error && error.error.message) {
      authError = {
        message: error.error.message,
        field: error.error.field,
        code: error.error.code
      };
    } else if (error.message) {
      authError = { message: error.message };
    } else {
      authError = { message: 'An unexpected error occurred. Please try again.' };
    }

    return throwError(() => authError);
  }

  private checkExistingSession(): void {
    const token = this.getAccessToken();
    
    if (token) {
      // Use the verify endpoint to check token validity
      this.verifyToken().subscribe({
        next: (response) => {
          if (response.valid && response.user) {
            console.log('Token verified successfully');
          } else {
            this.logout();
          }
        },
        error: () => {
          // Token verification failed, try to refresh
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            this.refreshToken().subscribe({
              next: () => {
                console.log('Token refreshed successfully');
              },
              error: () => {
                // Refresh failed, logout user
                this.logout();
              }
            });
          } else {
            // No refresh token, logout
            this.logout();
          }
        }
      });
    }
  }
}
