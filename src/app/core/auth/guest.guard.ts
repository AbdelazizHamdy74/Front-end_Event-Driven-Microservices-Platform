import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.getToken()) {
    return true;
  }
  return auth.ensureSession().pipe(
    map((result) => (result === true ? router.createUrlTree(['/home']) : result)),
  );
};
