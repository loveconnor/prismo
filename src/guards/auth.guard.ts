import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Guard to protect routes that require authentication
 */
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Checking authentication...');
  
  // Wait for session check to complete before making a decision
  return toObservable(authService.sessionCheckComplete).pipe(
    filter(sessionComplete => {
      console.log('AuthGuard: Session check complete =', sessionComplete);
      return sessionComplete === true; // Only proceed when session check is complete
    }),
    take(1), // Only take the first emission when session check is complete
    map(() => {
      const isLoggedIn = authService.isLoggedIn();
      console.log('AuthGuard: isLoggedIn =', isLoggedIn);

      if (isLoggedIn) {
        console.log('AuthGuard: User is authenticated, allowing access');
        return true;
      } else {
        console.log('AuthGuard: User not authenticated, redirecting to login');
        router.navigate(['/login']);
        return false;
      }
    })
  );
};

/**
 * Guard to redirect authenticated users away from auth pages
 */
export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('GuestGuard: Checking authentication...');
  
  // Wait for session check to complete before making a decision
  return toObservable(authService.sessionCheckComplete).pipe(
    filter(sessionComplete => {
      console.log('GuestGuard: Session check complete =', sessionComplete);
      return sessionComplete === true;
    }),
    take(1),
    map(() => {
      const isLoggedIn = authService.isLoggedIn();
      console.log('GuestGuard: isLoggedIn =', isLoggedIn);
      
      if (!isLoggedIn) {
        console.log('GuestGuard: User not authenticated, allowing access to guest page');
        return true;
      } else {
        console.log('GuestGuard: User is authenticated, redirecting to dashboard');
        router.navigate(['/dashboard']);
        return false;
      }
    })
  );
};
