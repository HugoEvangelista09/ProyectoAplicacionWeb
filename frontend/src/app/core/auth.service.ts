import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authKey = 'asociacion-auth';
  private readonly userKey = 'asociacion-user';

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem(this.authKey, 'true');
      localStorage.setItem(this.userKey, 'Administrador');
      return true;
    }

    return false;
  }

  logout(): void {
    localStorage.removeItem(this.authKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return localStorage.getItem(this.authKey) === 'true';
  }

  currentUser(): string {
    return localStorage.getItem(this.userKey) || 'Administrador';
  }
}
