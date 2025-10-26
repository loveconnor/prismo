import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  BehaviorSubject,
  throwError,
  of,
  defer,
  tap,
  catchError,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { CookieService } from './cookie.service';
import { JwtService } from './jwt.service';
import { TokenStorageService } from './token-storage.service';
import { AuthHttpService } from './auth-http.service';

// Unified interfaces
export interface User {
  id: string;
  email: string;
  username?: string; // from HEAD variant
  name?: string; // from other variant
  avatar?: string;
  profile?: any;
  preferences?: any;
  is_active?: boolean;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  username?: string;
  name?: string;
  password: string;
  confirmPassword?: string;
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
  username?: string;
  avatar?: string;
  profile?: any;
  preferences?: any;
}

export interface AuthResponse {
  user?: User;
  user_data?: User; // Backend returns user_data
  access_token?: string; // HEAD variant
  token?: string; // other variant
  refresh_token?: string; // HEAD variant
  refreshToken?: string; // other variant
}

export interface VerifyResponse {
  valid: boolean;
  user?: User;
}

export interface AuthError {
  message: string;
  field?: string;
  code?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  private jwtService = inject(JwtService);
  private tokenStorage = inject(TokenStorageService);
  private authHttp = inject(AuthHttpService);

  // Cookie names (if you prefer localStorage, swap implementations below)
  private readonly ACCESS_TOKEN_COOKIE = 'access_token';
  private readonly REFRESH_TOKEN_COOKIE = 'refresh_token';

  // API base - pointing to Flask backend
  private readonly API_URL = 'http://localhost:5000/auth';

  // Subjects for Rx interop
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  // Public observables
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoading$ = this.isLoadingSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Signals for modern Angular
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<User | null>(null);
  public sessionCheckComplete = signal<boolean>(false);

  // Promise to wait for session check completion
  private sessionCheckPromise: Promise<boolean> | null = null;

  constructor() {
    this.initializeSessionCheck();
  }

  private initializeSessionCheck(): void {
    this.sessionCheckPromise = new Promise<boolean>((resolve) => {
      const checkComplete = () => {
        const isComplete = this.sessionCheckComplete();
        if (isComplete) {
          resolve(this.isAuthenticated());
        } else {
          // Wait a bit and check again
          setTimeout(checkComplete, 50);
        }
      };
      checkComplete();
    });
    
    this.checkExistingSession();
  }

  /**
   * Wait for session check to complete and return authentication status
   */
  async waitForSessionCheck(): Promise<boolean> {
    // If session check is already complete, return immediately
    if (this.sessionCheckComplete()) {
      return this.isAuthenticated();
    }
    
    // Otherwise, wait for the session check to complete
    if (this.sessionCheckPromise) {
      return await this.sessionCheckPromise;
    }
    
    // Fallback: wait for session check to complete
    return new Promise<boolean>((resolve) => {
      const checkComplete = () => {
        if (this.sessionCheckComplete()) {
          resolve(this.isAuthenticated());
        } else {
          setTimeout(checkComplete, 50);
        }
      };
      checkComplete();
    });
  }

  // Register
  register(userData: RegisterData): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap((res) => this.handleAuthSuccess(res)),
        catchError((err) => this.handleLoadingError(err))
      );
  }

  // Confirm registration
  confirmRegistration(
    confirmData: ConfirmRegistrationData
  ): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<AuthResponse>(`${this.API_URL}/confirm`, confirmData)
      .pipe(
        tap((res) => this.handleAuthSuccess(res)),
        catchError((err) => this.handleLoadingError(err))
      );
  }

  // Login (supports email or username)
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('AuthService.login called with credentials:', credentials);
    this.isLoadingSubject.next(true);
    return this.authHttp.login(credentials)
      .pipe(
        tap((res) => {
          console.log('Login response received in AuthService:', res);
          this.handleAuthSuccess(res, credentials.remember);
        }),
        catchError((err) => {
          console.error('Login error in AuthService:', err);
          return this.handleLoadingError(err);
        })
      );
  }

  // Refresh token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    const username = this.tokenStorage.getUsername();
    
    if (!refreshToken) {
      console.log('No refresh token available');
      return throwError(() => new Error('No refresh token available'));
    }
    
    console.log('Refreshing token with username:', username);
    
    return this.authHttp.refreshToken(refreshToken, username)
      .pipe(
        tap((res) => this.handleAuthSuccess(res)),
        catchError((err) => {
          console.log('Token refresh failed:', err);
          // Don't call logout here to avoid circular dependency
          return this.handleAuthError(err);
        })
      );
  }

  // Forgot password
  forgotPassword(email: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ message: string }>(`${this.API_URL}/forgot-password`, { email })
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError((err) => this.handleLoadingError(err))
      );
  }

  // Confirm forgot password
  confirmForgotPassword(
    confirmData: ConfirmForgotPasswordData
  ): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ message: string }>(
        `${this.API_URL}/confirm-forgot-password`,
        confirmData
      )
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError((err) => this.handleLoadingError(err))
      );
  }

  // Profile
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        this.currentUser.set(user);
      }),
      catchError((err) => this.handleAuthError(err))
    );
  }

  updateProfile(profileData: ProfileUpdateData): Observable<User> {
    this.isLoadingSubject.next(true);
    return this.http.put<User>(`${this.API_URL}/profile`, profileData).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        this.currentUser.set(user);
        this.isLoadingSubject.next(false);
      }),
      catchError((err) => this.handleLoadingError(err))
    );
  }

  // Verify token with backend
  verifyToken(): Observable<VerifyResponse> {
    const token = this.getAccessToken();
    if (!token) return of({ valid: false });
    return this.authHttp.verifyToken(token)
      .pipe(
        tap((resp) => {
          if (resp.valid && resp.user) {
            this.currentUserSubject.next(resp.user);
            this.currentUser.set(resp.user);
            this.isAuthenticated.set(true);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError((err) => {
          console.log('Token verification error:', err);
          // Return a failed verification response instead of throwing
          return of({ valid: false, error: err.message });
        })
      );
  }

  // Verify email with confirmation code
  verifyEmail(email: string, code: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http
      .post(`${this.API_URL}/confirm`, { email, confirmation_code: code })
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError((err) => this.handleLoadingError(err))
      );
  }

  // Resend verification code
  resendVerificationCode(email: string): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.http
      .post(`${this.API_URL}/resend`, { email })
      .pipe(
        tap(() => this.isLoadingSubject.next(false)),
        catchError((err) => this.handleLoadingError(err))
      );
  }

  // Logout
  logout(): void {
    // Clear tokens
    this.tokenStorage.clearTokens();

    // Clear state
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isAuthenticatedSubject.next(false);
    this.isLoadingSubject.next(false);
    this.sessionCheckComplete.set(false);

    // Clear stored user data
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('current_user');
    }

    // Navigate
    this.router.navigate(['/login']);
    // If you must hard refresh, uncomment:
    // window.location.reload();
  }

  // Tokens
  getAccessToken(): string | null {
    const token = this.tokenStorage.getAccessToken();
    console.log('Retrieving access token:', token ? token.substring(0, 20) + '...' : 'null');
    return token;
  }

  getRefreshToken(): string | null {
    const token = this.tokenStorage.getRefreshToken();
    console.log('Retrieving refresh token:', token ? token.substring(0, 20) + '...' : 'null');
    return token;
  }

  // State getters
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  isLoggedIn(): boolean {
    const sessionComplete = this.sessionCheckComplete();
    const token = this.getAccessToken();
    const isAuthenticated = this.isAuthenticated();
    
    // For JWT tokens, check if they're valid locally
    // For other tokens (like Cognito), assume they're valid if they exist
    const hasValidToken = token ? (
      token.includes('.') ? this.jwtService.isTokenValid(token) : true
    ) : false;
    
    console.log('AuthService.isLoggedIn() - Debug:', {
      sessionComplete,
      hasToken: !!token,
      hasValidToken,
      isAuthenticated,
      result: sessionComplete && hasValidToken && isAuthenticated
    });
    
    // If session check hasn't completed yet, assume not logged in to be safe
    if (!sessionComplete) {
      console.log('Session check not complete, returning false');
      return false;
    }
    
    // User is logged in if they have a valid token AND the auth state is set
    const result = hasValidToken && isAuthenticated;
    console.log('Final auth result:', result);
    return result;
  }

  // Demo login (dev only)
  demoLogin(): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);
    const demoUser: User = {
      id: 'demo-user-1',
      email: 'demo@example.com',
      name: 'Demo User',
      username: 'demo',
      avatar: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1473',
      is_active: true,
    };

    // Type assertion since we know demo user has required properties
    const userForToken = demoUser as Required<Pick<User, 'id' | 'email' | 'name'>> & Pick<User, 'avatar'>;
    const demoToken = this.jwtService.createDemoToken(userForToken, false);
    const refreshToken = this.jwtService.createDemoToken(userForToken, true);

    const demoResponse: AuthResponse = {
      user: demoUser,
      token: demoToken,
      refreshToken,
      access_token: demoToken,
      refresh_token: refreshToken,
    };

    return defer(() => {
      return new Observable<AuthResponse>((observer) => {
        setTimeout(() => {
          this.handleAuthSuccess(demoResponse);
          observer.next(demoResponse);
          observer.complete();
        }, 800);
      });
    });
  }

  // OAuth placeholder
  loginWithGoogle(): void {
    // Implement real OAuth redirect or PKCE flow here
    console.log('Google OAuth login - implement with your provider');
    // Temporary: demo
    this.demoLogin().subscribe({
      next: () => console.log('Demo Google login successful'),
      error: (e) => console.error('Google login failed:', e),
    });
  }

  // Helpers
  private handleAuthSuccess(
    response: AuthResponse,
    remember: boolean = false
  ): void {
    console.log('handleAuthSuccess called with response:', response);
    
    // Normalize token property names
    const access =
      response.access_token || response.token || this.getAccessToken();
    const refresh =
      response.refresh_token || response.refreshToken || this.getRefreshToken();

    console.log('Token extraction:', {
      accessToken: access ? access.substring(0, 20) + '...' : 'null',
      refreshToken: refresh ? refresh.substring(0, 20) + '...' : 'null',
      hasAccess: !!access,
      hasRefresh: !!refresh
    });

    // Cookie expirations
    const tokenExpiryDays = remember ? 30 : 1;
    const refreshExpiryDays = 30;

    if (access) {
      console.log('Storing access token:', access.substring(0, 20) + '...');
      this.tokenStorage.setAccessToken(access);
      console.log('Access token stored successfully');
    } else {
      console.warn('No access token found in response');
    }
    if (refresh) {
      console.log('Storing refresh token:', refresh.substring(0, 20) + '...');
      this.tokenStorage.setRefreshToken(refresh);
      console.log('Refresh token stored successfully');
    } else {
      console.warn('No refresh token found in response');
    }

    // Update state - handle both user and user_data from backend
    const userData = response.user || response.user_data;
    console.log('User data:', userData);
    
    if (userData) {
      this.currentUserSubject.next(userData);
      this.currentUser.set(userData);
      // Store user data in localStorage for persistence
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('current_user', JSON.stringify(userData));
      }
      
      // Store username for SECRET_HASH calculation during token refresh
      if (userData.username) {
        this.tokenStorage.setUsername(userData.username);
        console.log('Stored username for token refresh:', userData.username);
      }
      
      console.log('User data set successfully');
    } else {
      console.warn('No user data found in response');
    }
    
    this.isAuthenticated.set(true);
    this.isAuthenticatedSubject.next(true);
    this.isLoadingSubject.next(false);
    this.sessionCheckComplete.set(true);

    console.log('Auth state after handleAuthSuccess:', {
      isAuthenticated: this.isAuthenticated(),
      sessionComplete: this.sessionCheckComplete(),
      hasToken: !!this.getAccessToken(),
      hasRefreshToken: !!this.getRefreshToken(),
      hasUsername: !!this.tokenStorage.getUsername()
    });

    // Navigation is now handled by the login component
    console.log('Auth service: Login successful, state updated');
  }

  private handleAuthError(error: any) {
    const authError: AuthError =
      error?.error?.message
        ? {
            message: error.error.message,
            field: error.error.field,
            code: error.error.code,
          }
        : error?.message
          ? { message: error.message }
          : { message: 'An unexpected error occurred. Please try again.' };

    return throwError(() => authError);
  }

  private handleLoadingError(error: any) {
    this.isLoadingSubject.next(false);
    return this.handleAuthError(error);
  }

  private checkExistingSession(): void {
    console.log('Starting session check...');
    const token = this.getAccessToken();
    console.log('Token found:', !!token);
    
    if (!token) {
      console.log('No token found, marking session check complete');
      this.sessionCheckComplete.set(true);
      return;
    }

    // Check if token is expired locally first (only for JWT tokens)
    if (token.includes('.') && !this.jwtService.isTokenValid(token)) {
      console.log('Token is expired locally, attempting refresh...');
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        this.refreshToken().subscribe({
          next: () => {
            console.log('Token refresh successful');
            this.sessionCheckComplete.set(true);
            console.log('Session check complete (refresh success)');
          },
          error: (refreshError) => {
            console.log('Token refresh failed:', refreshError);
            this.clearSessionState();
            this.sessionCheckComplete.set(true);
            console.log('Session check complete (refresh failed)');
          },
        });
      } else {
        console.log('No refresh token, clearing session');
        this.clearSessionState();
        this.sessionCheckComplete.set(true);
        console.log('Session check complete (no refresh token)');
      }
      return;
    }

    // For now, skip backend verification during session check to avoid circular dependency
    // The token is already validated locally, so we can trust it
    console.log('Token is valid locally, skipping backend verification to avoid circular dependency');
    
    // Try to restore user data from localStorage
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Restoring user from localStorage:', userData);
          this.currentUserSubject.next(userData);
          this.currentUser.set(userData);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
    }
    
    // If no user data found, try to get from token
    if (!this.currentUser()) {
      const userFromToken = this.jwtService.getUserFromToken(token);
      if (userFromToken) {
        console.log('Restoring user from token:', userFromToken);
        this.currentUserSubject.next(userFromToken);
        this.currentUser.set(userFromToken);
      } else {
        console.log('No user data found, using default user');
        // Create a default user object if we can't extract from token
        const defaultUser = {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          username: 'user'
        };
        this.currentUserSubject.next(defaultUser);
        this.currentUser.set(defaultUser);
      }
    }
    
    this.isAuthenticated.set(true);
    this.isAuthenticatedSubject.next(true);
    this.sessionCheckComplete.set(true);
    console.log('Session check complete (local validation)');
  }

  private clearSessionState(): void {
    // Clear session without calling logout to avoid circular dependency
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isAuthenticatedSubject.next(false);
    this.tokenStorage.clearTokens();
    
    // Clear stored user data
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('current_user');
    }
  }
}
