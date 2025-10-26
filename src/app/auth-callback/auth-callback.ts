import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OAuthService } from '../../services/oauth.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <div class="text-center">
        @if (isProcessing()) {
          <div class="mb-4">
            <svg
              class="mx-auto h-12 w-12 animate-spin text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-white">
            Completing sign in...
          </h2>
          <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please wait while we log you in
          </p>
        }
        
        @if (errorMessage()) {
          <div class="rounded-md bg-red-50 p-4 dark:bg-red-950/20">
            <div class="text-sm text-red-700 dark:text-red-400">
              {{ errorMessage() }}
            </div>
            <button
              (click)="redirectToLogin()"
              class="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Return to Login
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class AuthCallbackComponent implements OnInit {
  private oauthService = inject(OAuthService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  isProcessing = signal(true);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  private handleOAuthCallback(): void {
    console.log('Handling OAuth callback...');

    this.oauthService.handleCallback().subscribe({
      next: (result) => {
        if (result.error) {
          this.isProcessing.set(false);
          this.errorMessage.set(result.error);
          this.toastService.show({
            title: 'Authentication Failed',
            description: result.error,
            type: 'error',
          });
          return;
        }

        if (!result.code) {
          this.isProcessing.set(false);
          this.errorMessage.set('No authorization code received');
          return;
        }

        // Exchange code for tokens
        this.exchangeCodeForTokens(result.code);
      },
      error: (error) => {
        console.error('Error handling callback:', error);
        this.isProcessing.set(false);
        this.errorMessage.set('Failed to process authentication');
      },
    });
  }

  private exchangeCodeForTokens(code: string): void {
    console.log('Exchanging authorization code for tokens...');

    // Get the redirect URI from config
    this.oauthService.getOAuthConfig().subscribe({
      next: (config) => {
        const redirectUri = config.callback_url;

        this.oauthService.exchangeCodeForTokens(code, redirectUri).subscribe({
          next: (response) => {
            console.log('Token exchange successful:', response);

            // Store tokens and user data using the existing auth service
            const authResponse = {
              access_token: response.access_token,
              refresh_token: response.refresh_token,
              id_token: response.id_token,
              user_data: response.user_data,
            };

            // Manually trigger the auth success handler
            this.authService['handleAuthSuccess'](authResponse);

            this.toastService.show({
              title: 'Login Successful',
              description: 'Welcome back!',
              type: 'success',
            });

            // Navigate to dashboard
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 500);
          },
          error: (error) => {
            console.error('Token exchange failed:', error);
            this.isProcessing.set(false);
            this.errorMessage.set(
              error.error?.error || 'Failed to complete authentication'
            );
            this.toastService.show({
              title: 'Authentication Failed',
              description:
                error.error?.error || 'Failed to complete authentication',
              type: 'error',
            });
          },
        });
      },
      error: (error) => {
        console.error('Failed to get OAuth config:', error);
        this.isProcessing.set(false);
        this.errorMessage.set('Configuration error');
      },
    });
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}

