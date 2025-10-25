import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { JwtService } from '../../services/jwt.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <div class="bg-card border border-border rounded-lg p-8 text-center">
          <h2 class="text-3xl font-bold text-foreground">Verify your email</h2>
          <p class="mt-3 text-sm text-muted-foreground">
            We've sent a verification email@if (email()) { to <span class="font-medium text-foreground">{{ email() }}</span>}. Please check your inbox and click the link to verify your account.
          </p>

          @if (errorMessage()) {
            <div class="mt-4 rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <p class="text-sm text-destructive">{{ errorMessage() }}</p>
            </div>
          }

          <div class="mt-6">
            <button
              type="button"
              (click)="resendCode()"
              [disabled]="isResending() || !email()"
              class="inline-flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {{ isResending() ? 'Resending...' : 'Resend verification email' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class VerifyComponent {
  email = signal('');
  isResending = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
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