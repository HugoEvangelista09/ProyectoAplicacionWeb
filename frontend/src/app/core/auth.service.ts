import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

export type UserRole = 'admin' | 'operador' | 'socio';
export type AppSection = 'dashboard' | 'socios' | 'puestos' | 'motivos' | 'deudas' | 'pagos' | 'reportes' | 'usuarios';

type LoginResponse = {
  token: string;
  role?: UserRole;
  nombre?: string;
  socioId?: number | null;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'asociacion-token';
  private readonly userKey = 'asociacion-user';
  private readonly roleKey = 'asociacion-role';
  private readonly socioIdKey = 'asociacion-socio-id';
  private readonly permissions: Record<AppSection, UserRole[]> = {
    dashboard: ['admin'],
    socios: ['admin', 'operador'],
    puestos: ['admin', 'operador'],
    motivos: ['admin'],
    deudas: ['admin', 'operador', 'socio'],
    pagos: ['admin', 'operador', 'socio'],
    reportes: ['admin', 'operador'],
    usuarios: ['admin']
  };

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { username, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        localStorage.setItem(this.userKey, res.nombre || username);
        localStorage.setItem(this.roleKey, res.role || 'admin');
        if (typeof res.socioId === 'number') {
          localStorage.setItem(this.socioIdKey, String(res.socioId));
        } else {
          localStorage.removeItem(this.socioIdKey);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.socioIdKey);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  currentUser(): string {
    return localStorage.getItem(this.userKey) || 'Administrador';
  }

  token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  currentRole(): UserRole | null {
    const role = localStorage.getItem(this.roleKey);
    return role === 'admin' || role === 'operador' || role === 'socio' ? role : null;
  }

  currentSocioId(): number | null {
    const value = localStorage.getItem(this.socioIdKey);
    return value ? Number(value) : null;
  }

  isAdmin(): boolean {
    return this.currentRole() === 'admin';
  }

  isOperador(): boolean {
    return this.currentRole() === 'operador';
  }

  isSocio(): boolean {
    return this.currentRole() === 'socio';
  }

  canAccess(section: AppSection): boolean {
    const role = this.currentRole();
    return !!role && this.permissions[section].includes(role);
  }

  landingRoute(): string {
    if (this.isAdmin()) return '/dashboard';
    if (this.isOperador()) return '/socios';
    return '/deudas';
  }

  roleLabel(): string {
    if (this.isAdmin()) return 'Administrador';
    if (this.isOperador()) return 'Operador';
    if (this.isSocio()) return 'Socio';
    return 'Invitado';
  }
}
