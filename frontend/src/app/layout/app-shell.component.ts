import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div>
          <p class="eyebrow">Sistema</p>
          <h2>Asociacion</h2>
          <p class="muted">Usuario: {{ auth.currentUser() }}</p>
        </div>

        <nav class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active">Resumen</a>
          <a routerLink="/socios" routerLinkActive="active">Socios</a>
          <a routerLink="/puestos" routerLinkActive="active">Puestos</a>
          <a routerLink="/motivos" routerLinkActive="active">Motivos</a>
          <a routerLink="/deudas" routerLinkActive="active">Deudas</a>
          <a routerLink="/pagos" routerLinkActive="active">Pagos</a>
          <a routerLink="/reportes" routerLinkActive="active">Reportes</a>
          <a routerLink="/usuarios" routerLinkActive="active">Usuarios</a>
        </nav>

        <button type="button" class="secondary-btn" (click)="logout()">Cerrar sesion</button>
      </aside>

      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `
})
export class AppShellComponent {
  constructor(
    public readonly auth: AuthService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
