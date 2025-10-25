import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    // Redirect to login page
    router.navigate(['/login']);
    return false;
  }
};

/**
 * Guard to redirect authenticated users away from auth pages
 */
export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  } else {
    // Redirect to dashboard if already logged in
    router.navigate(['/dashboard']);
    return false;
  }
};
