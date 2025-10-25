import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '../guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./auth/auth').then(m => m.AuthComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'register', 
    loadComponent: () => import('./register/register').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'verify', 
    loadComponent: () => import('./verify/verify').then(m => m.VerifyComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'components', 
    loadComponent: () => import('./components-page/components-page').then(m => m.ComponentsPage),
    canActivate: [authGuard]
  },
  { 
    path: 'labs', 
    loadComponent: () => import('./labs/labs').then(m => m.LabsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'labs/demo', 
    loadComponent: () => import('./labs/demo-lab/demo-lab').then(m => m.DemoLabComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'widget-lab', 
    loadComponent: () => import('./widget-lab/widget-lab').then(m => m.WidgetLabComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'widget-showcase', 
    loadComponent: () => import('./widget-showcase/widget-showcase.component').then(m => m.WidgetShowcaseComponent),
    canActivate: [authGuard]
  }
];
