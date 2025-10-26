import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface OAuthConfig {
  cognito_domain: string;
  hosted_ui_url: string;
  client_id: string;
  callback_url: string;
  region: string;
  authorize_endpoint: string;
  token_endpoint: string;
  logout_endpoint: string;
}

export interface TokenExchangeRequest {
  code: string;
  redirect_uri: string;
}

export interface TokenExchangeResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  user_data: any;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class OAuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private readonly API_URL = 'http://localhost:5000/auth';
  private oauthConfig: OAuthConfig | null = null;

  /**
   * Get OAuth configuration from backend
   */
  getOAuthConfig(): Observable<OAuthConfig> {
    if (this.oauthConfig) {
      return of(this.oauthConfig);
    }

    return this.http.get<OAuthConfig>(`${this.API_URL}/oauth/config`).pipe(
      map((config) => {
        this.oauthConfig = config;
        return config;
      }),
      catchError((error) => {
        console.error('Failed to get OAuth config:', error);
        throw error;
      })
    );
  }

  /**
   * Initiate Google login by redirecting to Cognito Hosted UI
   */
  initiateGoogleLogin(): void {
    if (!this.isBrowser) {
      console.log('SSR: Skipping OAuth redirect');
      return;
    }

    this.getOAuthConfig().subscribe({
      next: (config) => {
        const authUrl = this.buildAuthorizationUrl(config);
        console.log('Redirecting to Cognito Hosted UI:', authUrl);
        window.location.href = authUrl;
      },
      error: (error) => {
        console.error('Failed to initiate Google login:', error);
        throw error;
      },
    });
  }

  /**
   * Build Cognito authorization URL
   */
  private buildAuthorizationUrl(config: OAuthConfig): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.client_id,
      redirect_uri: config.callback_url,
      identity_provider: 'Google',
      scope: 'email openid profile',
    });

    return `${config.authorize_endpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Observable<TokenExchangeResponse> {
    const request: TokenExchangeRequest = {
      code,
      redirect_uri: redirectUri,
    };

    return this.http
      .post<TokenExchangeResponse>(`${this.API_URL}/oauth/callback`, request)
      .pipe(
        map((response) => {
          console.log('Token exchange successful');
          return response;
        }),
        catchError((error) => {
          console.error('Token exchange failed:', error);
          throw error;
        })
      );
  }

  /**
   * Handle OAuth callback from URL
   */
  handleCallback(): Observable<{
    code: string | null;
    error: string | null;
  }> {
    if (!this.isBrowser) {
      return of({ code: null, error: 'Not in browser' });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return of({ code: null, error: errorDescription || error });
    }

    if (!code) {
      return of({ code: null, error: 'No authorization code found' });
    }

    return of({ code, error: null });
  }
}

