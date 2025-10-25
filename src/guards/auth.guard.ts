import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SimpleAuthService } from '../services/simple-auth.service';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard = () => {
  const authService = inject(SimpleAuthService);
  const router = inject(Router);

  console.log('AuthGuard: Checking authentication...');
  const isLoggedIn = authService.isLoggedIn();
  console.log('AuthGuard: isLoggedIn =', isLoggedIn);

  if (isLoggedIn) {
    console.log('AuthGuard: User is authenticated, allowing access');
    return true;
  } else {
    console.log('AuthGuard: User not authenticated, redirecting to login');
    // Redirect to login page
    router.navigate(['/login']);
    return false;
  }
};

/**
 * Guard to redirect authenticated users away from auth pages
 */
export const guestGuard = () => {
  const authService = inject(SimpleAuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  } else {
    // Redirect to dashboard if already logged in
    router.navigate(['/dashboard']);
    return false;
  }
};
