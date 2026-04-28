import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppSection, AuthService } from './auth.service';

function redirectByRole(auth: AuthService, router: Router) {
  return router.createUrlTree([auth.landingRoute()]);
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? redirectByRole(auth, router) : true;
};

export const sectionGuard = (section: AppSection): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return auth.canAccess(section) ? true : redirectByRole(auth, router);
};
