import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LogoComponent } from '../../components/ui/logo/logo';
import { ButtonComponent } from '../../components/ui/button/button';
import { CheckboxComponent } from '../../components/ui/checkbox/checkbox';
import { FieldComponent } from '../../components/ui/field/field';
import { HeadingComponent } from '../../components/ui/heading/heading';
import { InputComponent } from '../../components/ui/input/input';
import { LabelComponent } from '../../components/ui/label/label';
import { PasswordInputComponent } from '../../components/ui/password-input/password-input';
import { TextComponent, TextLinkComponent, StrongComponent } from '../../components/ui/text/text';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LogoComponent,
    ButtonComponent,
    CheckboxComponent,
    FieldComponent,
    HeadingComponent,
    InputComponent,
    LabelComponent,
    PasswordInputComponent,
    TextComponent,
    TextLinkComponent,
    StrongComponent
  ],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-white px-4 py-12 dark:bg-zinc-950">
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="grid w-full max-w-sm grid-cols-1 gap-8">
        <app-logo className="h-6 text-zinc-950 dark:text-white" />
        <app-heading>Sign in to your account</app-heading>
        
        <!-- Error message display -->
        @if (errorMessage()) {
          <div class="rounded-md bg-red-50 p-4 dark:bg-red-950/20">
            <div class="text-sm text-red-700 dark:text-red-400">
              {{ errorMessage() }}
            </div>
          </div>
        }
        
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
              @if (loginForm.get('email')?.hasError('required')) {
                Email is required
              }
              @if (loginForm.get('email')?.hasError('email')) {
                Please enter a valid email address
              }
            </div>
          }
        </app-field>
        
        <app-field>
          <app-label for="password">Password</app-label>
          <app-password-input 
            id="password" 
            name="password" 
            placeholder="Enter your password"
            formControlName="password"
            [class.border-red-500]="isFieldInvalid('password')"
          />
          @if (isFieldInvalid('password')) {
            <div class="mt-1 text-sm text-red-600 dark:text-red-400">
              @if (loginForm.get('password')?.hasError('required')) {
                Password is required
              }
              @if (loginForm.get('password')?.hasError('minlength')) {
                Password must be at least 6 characters long
              }
            </div>
          }
        </app-field>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <app-checkbox id="remember" formControlName="remember" />
            <app-label for="remember" className="!mb-0">Remember me</app-label>
          </div>
          <app-text className="!mb-0">
            <app-text-link href="/forgot-password">
              <app-strong>Forgot password?</app-strong>
            </app-text-link>
          </app-text>
        </div>
        
        <app-button 
          type="submit" 
          color="blue" 
          className="w-full"
          [disabled]="loginForm.invalid || isLoading()"
        >
          @if (isLoading()) {
            <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          } @else {
            Sign in
          }
        </app-button>
        
        <div class="text-center text-sm text-zinc-600 dark:text-zinc-400">Or continue with</div>
        
        <app-button 
          type="button" 
          variant="outline" 
          className="w-full"
          (click)="onGoogleLogin()"
          [disabled]="isLoading()"
        >
          <svg
            data-slot="icon"
            class="mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </app-button>
        
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
export class AuthComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Reactive form
  loginForm: FormGroup;

  // State signals
  isLoading = signal(false);
  errorMessage = signal<string>('');

  constructor() {
    // Initialize reactive form with validation
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });

    // Check if user is already authenticated
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        remember: this.loginForm.value.remember
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login successful, response:', response);
          console.log('Login response details:', {
            hasAccessToken: !!(response.access_token || response.token),
            hasRefreshToken: !!(response.refresh_token || response.refreshToken),
            hasUser: !!(response.user || response.user_data),
            accessToken: response.access_token || response.token,
            refreshToken: response.refresh_token || response.refreshToken,
            user: response.user || response.user_data
          });
          
          this.isLoading.set(false);
          const userData = response.user || response.user_data;
          const userName = userData?.name || userData?.username || 'User';
          
          // Wrap toast in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.toastService.show({
              title: 'Success!',
              description: `Welcome back, ${userName}!`,
              type: 'success'
            });
          }, 0);
          
          // Check authentication state after login
          setTimeout(() => {
            console.log('Auth state after login:', {
              isLoggedIn: this.authService.isLoggedIn(),
              hasToken: !!this.authService.getAccessToken(),
              isAuthenticated: this.authService['isAuthenticated']?.(),
              sessionComplete: this.authService['sessionCheckComplete']?.()
            });
          }, 100);
          
          // Handle navigation directly in the component
          console.log('Login component: Navigating to dashboard');
          this.router.navigate(['/dashboard']).then(success => {
            console.log('Navigation result:', success);
            if (!success) {
              console.error('Failed to navigate to dashboard');
            }
          }).catch(error => {
            console.error('Navigation error:', error);
          });
        },
        error: (error) => {
          console.error('Login error:', error);
          console.error('Login error details:', {
            message: error.message,
            status: error.status,
            error: error.error,
            fullError: error
          });
          
          this.isLoading.set(false);
          this.errorMessage.set(error.message || 'Login failed. Please try again.');
          
          // Show field-specific errors if available
          if (error.field) {
            const control = this.loginForm.get(error.field);
            if (control) {
              control.setErrors({ serverError: error.message });
            }
          }

          this.toastService.show({
            title: 'Login Failed',
            description: error.message || 'Please check your credentials and try again.',
            type: 'error'
          });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Handle Google login
   */
  onGoogleLogin(): void {
    this.toastService.show({
      title: 'Google Login',
      description: 'Google login is not implemented yet. Please use email/password login.',
      type: 'info'
    });
  }


  /**
   * Check if a form field is invalid and has been touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get validation error message for a field
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['serverError']) {
        return field.errors['serverError'];
      }
    }
    return '';
  }
}

