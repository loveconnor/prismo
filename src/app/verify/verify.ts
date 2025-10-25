import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            We've sent a verification code to your email address. Please enter it below.
          </p>
        </div>
        
        <form class="mt-8 space-y-6" [formGroup]="verifyForm" (ngSubmit)="onSubmit()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email" class="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                formControlName="email"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                readonly
              />
            </div>
            <div>
              <label for="code" class="sr-only">Verification code</label>
              <input
                id="code"
                name="code"
                type="text"
                formControlName="code"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Verification code"
              />
            </div>
          </div>

          @if (errorMessage()) {
            <div class="rounded-md bg-red-50 p-4">
              <div class="text-sm text-red-700">
                {{ errorMessage() }}
              </div>
            </div>
          }

          <div>
            <button
              type="submit"
              [disabled]="!verifyForm.valid || isLoading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isLoading()) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              {{ isLoading() ? 'Verifying...' : 'Verify Email' }}
            </button>
          </div>

          <div class="text-center">
            <button
              type="button"
              (click)="resendCode()"
              [disabled]="isResending()"
              class="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              {{ isResending() ? 'Resending...' : "Didn't receive the code? Resend" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class VerifyComponent {
  verifyForm: FormGroup;
  isLoading = signal(false);
  isResending = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get email from query params if available
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.verifyForm.patchValue({ email: params['email'] });
      }
    });
  }

  onSubmit(): void {
    if (this.verifyForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const { email, code } = this.verifyForm.value;

      this.authService.verifyEmail(email, code).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.toastService.show({
            title: 'Success!',
            description: 'Your email has been verified. You can now log in.',
            type: 'success'
          });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.error || 'Verification failed. Please try again.');
        }
      });
    }
  }

  resendCode(): void {
    const email = this.verifyForm.get('email')?.value;
    if (!email) {
      this.errorMessage.set('Please enter your email address first.');
      return;
    }

    this.isResending.set(true);
    this.errorMessage.set('');

    this.authService.resendVerificationCode(email).subscribe({
      next: (response) => {
        this.isResending.set(false);
        this.toastService.show({
          title: 'Code Sent',
          description: 'A new verification code has been sent to your email.',
          type: 'success'
        });
      },
      error: (error) => {
        this.isResending.set(false);
        this.errorMessage.set(error.error || 'Failed to resend code. Please try again.');
      }
    });
  }
}
