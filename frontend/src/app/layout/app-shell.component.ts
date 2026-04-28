import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppSection, AuthService } from '../core/auth.service';

type NavigationItem = {
  label: string;
  path: string;
  section: AppSection;
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent {
  readonly navigation: NavigationItem[] = [
    { label: 'Resumen', path: '/dashboard', section: 'dashboard' },
    { label: 'Socios', path: '/socios', section: 'socios' },
    { label: 'Puestos', path: '/puestos', section: 'puestos' },
    { label: 'Motivos', path: '/motivos', section: 'motivos' },
    { label: 'Deudas', path: '/deudas', section: 'deudas' },
    { label: 'Pagos', path: '/pagos', section: 'pagos' },
    { label: 'Reportes', path: '/reportes', section: 'reportes' },
    { label: 'Usuarios', path: '/usuarios', section: 'usuarios' }
  ];

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router
  ) {}

  get visibleNavigation(): NavigationItem[] {
    return this.navigation.filter((item) => this.auth.canAccess(item.section));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
