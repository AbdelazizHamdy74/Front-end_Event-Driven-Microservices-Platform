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
      import('./pages/feed/feed-page.component').then((m) => m.FeedPageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile/me',
    loadComponent: () =>
      import('./pages/profile/profile-me-page.component').then(
        (m) => m.ProfileMePageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile/:id',
    loadComponent: () =>
      import('./pages/profile/profile-user-page.component').then(
        (m) => m.ProfileUserPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'friends/requests',
    loadComponent: () =>
      import('./pages/friends/friend-requests-page.component').then(
        (m) => m.FriendRequestsPageComponent,
      ),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'home' },
];
