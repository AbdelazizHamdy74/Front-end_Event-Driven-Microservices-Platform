import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

const PUBLIC_AUTH_SUFFIXES = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

function isPublicAuthRequest(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return PUBLIC_AUTH_SUFFIXES.some(
      (suffix) => pathname === suffix || pathname.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (isPublicAuthRequest(req.url)) {
    return next(req);
  }
  const token = auth.getToken();
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
