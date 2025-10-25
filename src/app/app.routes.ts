import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/auth').then(m => m.AuthComponent) },
  { path: 'register', loadComponent: () => import('./register/register').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'labs', loadComponent: () => import('./labs/labs').then(m => m.LabsComponent) },
  { path: 'widget-lab', loadComponent: () => import('./widget-lab/widget-lab').then(m => m.WidgetLabComponent) },
  { path: 'widget-showcase', loadComponent: () => import('./widget-showcase/widget-showcase.component').then(m => m.WidgetShowcaseComponent) }
];
