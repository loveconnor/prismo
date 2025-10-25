import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogoComponent } from '../../components/ui/logo/logo';
import { ButtonComponent } from '../../components/ui/button/button';
import { FieldComponent } from '../../components/ui/field/field';
import { HeadingComponent } from '../../components/ui/heading/heading';
import { InputComponent } from '../../components/ui/input/input';
import { LabelComponent } from '../../components/ui/label/label';
import { TextComponent, TextLinkComponent, StrongComponent } from '../../components/ui/text/text';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LogoComponent,
    ButtonComponent,
    FieldComponent,
    HeadingComponent,
    InputComponent,
    LabelComponent,
    TextComponent,
    TextLinkComponent,
    StrongComponent
  ],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-white px-4 py-12 dark:bg-zinc-950">
      <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" class="grid w-full max-w-sm grid-cols-1 gap-8">
        <app-logo className="h-6 text-zinc-950 dark:text-white" />
        <app-heading>Reset your password</app-heading>
        
        @if (!emailSent()) {
          <app-text>Enter your email and we'll send you a link to reset your password.</app-text>
        } @else {
          <div class="rounded-md bg-green-50 p-4 dark:bg-green-950/20">
            <div class="text-sm text-green-700 dark:text-green-400">
              Password reset link sent! Check your email for instructions.
            </div>
          </div>
        }
        
        <!-- Error message display -->
        @if (errorMessage()) {
          <div class="rounded-md bg-red-50 p-4 dark:bg-red-950/20">
            <div class="text-sm text-red-700 dark:text-red-400">
              {{ errorMessage() }}
            </div>
          </div>
        }
        
        @if (!emailSent()) {
          <app-field>
            <app-label for="email">Email</app-label>
            <app-input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="Enter your email"
              formControlName="email"
              [class.border-red-500]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <div class="mt-1 text-sm text-red-600 dark:text-red-400">
                @if (forgotPasswordForm.get('email')?.hasError('required')) {
                  Email is required
                }
                @if (forgotPasswordForm.get('email')?.hasError('email')) {
                  Please enter a valid email address
                }
              </div>
            }
          </app-field>
          
          <app-button 
            type="submit" 
            color="blue" 
            className="w-full"
            [disabled]="forgotPasswordForm.invalid || isLoading()"
          >
            @if (isLoading()) {
              <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending reset link...
            } @else {
              Reset password
            }
          </app-button>
        } @else {
          <app-button 
            type="button" 
            color="blue" 
            className="w-full"
            (click)="resendEmail()"
            [disabled]="isLoading()"
          >
            @if (isLoading()) {
              <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resending...
            } @else {
              Resend email
            }
          </app-button>
        }
        
        <app-text className="text-center">
          Remember your password?
          <app-text-link href="/login">
            <app-strong>Sign in</app-strong>
          </app-text-link>
        </app-text>
        
        <app-text className="text-center">
          Don't have an account?
          <app-text-link href="/register">
            <app-strong>Sign up</app-strong>
          </app-text-link>
        </app-text>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Reactive form
  forgotPasswordForm: FormGroup;

  // State signals
  isLoading = signal(false);
  errorMessage = signal<string>('');
  emailSent = signal(false);

  constructor() {
    // Initialize reactive form with validation
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const email = this.forgotPasswordForm.value.email;

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.emailSent.set(true);
          this.toastService.show({
            title: 'Email Sent!',
            description: 'Password reset link sent to your email.',
            type: 'success'
          });
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Failed to send reset email. Please try again.');
          
          // Show field-specific errors if available
          if (error.field) {
            const control = this.forgotPasswordForm.get(error.field);
            if (control) {
              control.setErrors({ serverError: error.message });
            }
          }

          this.toastService.show({
            title: 'Reset Failed',
            description: error.message || 'Failed to send reset email. Please try again.',
            type: 'error'
          });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Resend password reset email
   */
  resendEmail(): void {
    this.emailSent.set(false);
    this.onSubmit();
  }

  /**
   * Check if a form field is invalid and has been touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get validation error message for a field
   */
  getFieldError(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['serverError']) {
        return field.errors['serverError'];
      }
    }
    return '';
  }
}

