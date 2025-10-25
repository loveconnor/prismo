import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Checking authentication...');
  
  // Wait for session check to complete
  return authService.waitForSessionCheck().then(isLoggedIn => {
    console.log('AuthGuard: waitForSessionCheck result =', isLoggedIn);
    console.log('AuthGuard: Current auth state:', {
      hasToken: !!authService.getAccessToken(),
      isLoggedInDirect: authService.isLoggedIn()
    });

    if (isLoggedIn) {
      console.log('AuthGuard: User is authenticated, allowing access');
      return true;
    } else {
      console.log('AuthGuard: User not authenticated, redirecting to login');
      // Redirect to login page
      router.navigate(['/login']);
      return false;
    }
  });
};

/**
 * Guard to redirect authenticated users away from auth pages
 */
export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for session check to complete
  return authService.waitForSessionCheck().then(isLoggedIn => {
    if (!isLoggedIn) {
      return true;
    } else {
      // Redirect to dashboard if already logged in
      router.navigate(['/dashboard']);
      return false;
    }
  });
};
