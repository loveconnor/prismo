import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'components', loadComponent: () => import('./components-page/components-page').then(m => m.ComponentsPage) },
  { path: 'labs', loadComponent: () => import('./labs/labs').then(m => m.LabsComponent) },
  { path: 'widget-lab', loadComponent: () => import('./widget-lab/widget-lab').then(m => m.WidgetLabComponent) }
];
