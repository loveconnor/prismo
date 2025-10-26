import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { JwtService } from '../../services/jwt.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <div class="bg-card border border-border rounded-lg p-8">
          <div class="text-center mb-6">
            <h2 class="text-3xl font-bold text-foreground">Verify your email</h2>
            <p class="mt-3 text-sm text-muted-foreground">
              We've sent a verification email@if (email()) { to <span class="font-medium text-foreground">{{ email() }}</span>}. Please enter the verification code below.
            </p>
          </div>

          @if (errorMessage()) {
            <div class="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p class="text-sm text-destructive">{{ errorMessage() }}</p>
            </div>
          }

          @if (successMessage()) {
            <div class="mb-4 rounded-md bg-green-500/10 border border-green-500/20 p-3">
              <p class="text-sm text-green-600">{{ successMessage() }}</p>
            </div>
          }

          <div class="space-y-4">
            <div>
              <label for="code" class="block text-sm font-medium text-foreground mb-2">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                [(ngModel)]="verificationCode"
                placeholder="Enter 6-digit code"
                maxlength="6"
                class="w-full px-4 py-2.5 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="isVerifying()"
                (keyup.enter)="verifyCode()"
              />
            </div>

            <button
              type="button"
              (click)="verifyCode()"
              [disabled]="isVerifying() || !verificationCode.trim() || !email()"
              class="w-full inline-flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {{ isVerifying() ? 'Verifying...' : 'Verify Email' }}
            </button>

            <div class="text-center pt-2">
              <button
                type="button"
                (click)="resendCode()"
                [disabled]="isResending() || !email()"
                class="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isResending() ? 'Resending...' : 'Resend verification code' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class VerifyComponent {
  email = signal('');
  verificationCode = '';
  isVerifying = signal(false);
  isResending = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private jwtService: JwtService
  ) {
    // Listen for query params (support common aliases)
    this.route.queryParamMap.subscribe((params) => {
      const qpEmail = params.get('email') || params.get('e');
      if (qpEmail) {
        this.email.set(qpEmail);
      }
    });

    // React to auth state: fill from currentUser when it becomes available
    effect(() => {
      const user = this.authService.getCurrentUser();
      if (user?.email && !this.email()) {
        this.email.set(user.email);
      }
    });

    // Final fallback: decode email from JWT if present
    const token = this.authService.getAccessToken?.() as string | null;
    if (token && !this.email()) {
      const payloadUser = this.jwtService.getUserFromToken(token);
      if (payloadUser?.email) {
        this.email.set(payloadUser.email);
      }
    }
  }

  verifyCode(): void {
    const email = this.email();
    const code = this.verificationCode.trim();
    
    if (!email) {
      this.errorMessage.set("We couldn't determine your email. Please log in again.");
      return;
    }

    if (!code) {
      this.errorMessage.set('Please enter the verification code.');
      return;
    }

    this.isVerifying.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.verifyEmail(email, code).subscribe({
      next: (response) => {
        this.isVerifying.set(false);
        this.successMessage.set('Email verified successfully! Redirecting...');
        
        setTimeout(() => {
          this.toastService.show({
            title: 'Success!',
            description: 'Your email has been verified.',
            type: 'success',
          });
        }, 0);

        // Redirect to login or dashboard after a short delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        this.isVerifying.set(false);
        const message = error.error?.error || error.error?.message || 'Verification failed. Please try again.';
        this.errorMessage.set(message);
      },
    });
  }

  resendCode(): void {
    const email = this.email();
    if (!email) {
      this.errorMessage.set("We couldn't determine your email. Please log in again.");
      return;
    }

    this.isResending.set(true);
    this.errorMessage.set('');

    this.authService.resendVerificationCode(email).subscribe({
      next: (response) => {
        this.isResending.set(false);
        this.toastService.show({
          title: 'Code Sent',
          description:
            'A new verification code has been sent to your email.',
          type: 'success',
        });
      },
      error: (error) => {
        this.isResending.set(false);
        this.errorMessage.set(
          error.error || 'Failed to resend code. Please try again.'
        );
      },
    });
  }
}