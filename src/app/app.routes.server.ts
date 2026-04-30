import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'home', renderMode: RenderMode.Client },
  { path: 'profile/me', renderMode: RenderMode.Client },
  { path: 'profile/:id', renderMode: RenderMode.Client },
  { path: 'friends/requests', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
