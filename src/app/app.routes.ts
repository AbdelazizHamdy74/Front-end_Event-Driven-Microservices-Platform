import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login-page.component').then((m) => m.LoginPageComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home-page.component').then((m) => m.HomePageComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'home' },
];
