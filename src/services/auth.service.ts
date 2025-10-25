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
  user: User;
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

  constructor() {
    this.checkExistingSession();
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
    this.isLoadingSubject.next(true);
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap((res) => this.handleAuthSuccess(res, credentials.remember)),
        catchError((err) => this.handleLoadingError(err))
      );
  }

  // Refresh token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http
      .post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap((res) => this.handleAuthSuccess(res)),
        catchError((err) => {
          this.logout();
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
    return this.http
      .post<VerifyResponse>(`${this.API_URL}/verify`, { token })
      .pipe(
        tap((resp) => {
          if (resp.valid && resp.user) {
            this.currentUserSubject.next(resp.user);
            this.currentUser.set(resp.user);
            this.isAuthenticated.set(true);
            this.isAuthenticatedSubject.next(true);
          } else {
            this.logout();
          }
        }),
        catchError((err) => {
          this.logout();
          return this.handleAuthError(err);
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
    // Clear cookies
    this.cookieService.delete(this.ACCESS_TOKEN_COOKIE);
    this.cookieService.delete(this.REFRESH_TOKEN_COOKIE);

    // Clear state
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isAuthenticatedSubject.next(false);
    this.isLoadingSubject.next(false);

    // Navigate
    this.router.navigate(['/login']);
    // If you must hard refresh, uncomment:
    // window.location.reload();
  }

  // Tokens
  getAccessToken(): string | null {
    return this.cookieService.get(this.ACCESS_TOKEN_COOKIE);
  }

  getRefreshToken(): string | null {
    return this.cookieService.get(this.REFRESH_TOKEN_COOKIE);
  }

  // State getters
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    return token ? this.jwtService.isTokenValid(token) : false;
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
    // Normalize token property names
    const access =
      response.access_token || response.token || this.getAccessToken();
    const refresh =
      response.refresh_token || response.refreshToken || this.getRefreshToken();

    // Cookie expirations
    const tokenExpiryDays = remember ? 30 : 1;
    const refreshExpiryDays = 30;

    if (access) {
      this.cookieService.set(this.ACCESS_TOKEN_COOKIE, access, {
        expires: tokenExpiryDays,
        secure: true,
        sameSite: 'strict',
      });
    }
    if (refresh) {
      this.cookieService.set(this.REFRESH_TOKEN_COOKIE, refresh, {
        expires: refreshExpiryDays,
        secure: true,
        sameSite: 'strict',
      });
    }

    // Update state
    if (response.user) {
      this.currentUserSubject.next(response.user);
      this.currentUser.set(response.user);
    }
    this.isAuthenticated.set(true);
    this.isAuthenticatedSubject.next(true);
    this.isLoadingSubject.next(false);

    // Navigate
    this.router.navigate(['/dashboard']);
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
    const token = this.getAccessToken();
    if (!token) return;

    this.verifyToken().subscribe({
      next: (resp) => {
        if (resp.valid && resp.user) {
          // already handled in verifyToken tap
        } else {
          this.logout();
        }
      },
      error: () => {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
          this.refreshToken().subscribe({
            next: () => {},
            error: () => this.logout(),
          });
        } else {
          this.logout();
        }
      },
    });
  }
}
