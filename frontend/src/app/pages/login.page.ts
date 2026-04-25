import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="login-body">
      <section class="login-shell">
        <article class="login-panel login-copy">
          <p class="eyebrow">Angular + Spring Boot</p>
          <h1>Asociacion de Comerciantes</h1>
          <p class="subtitle">
            Frontend construido con Angular y conectado a tu backend Spring Boot por medio de los endpoints REST.
          </p>

          <div class="login-tips">
            <div class="tip-card">
              <strong>Usuario demo</strong>
              <span>admin</span>
            </div>
            <div class="tip-card">
              <strong>Clave demo</strong>
              <span>admin123</span>
            </div>
          </div>
        </article>

        <article class="login-panel">
          <form class="login-form" (ngSubmit)="submit()">
            <p class="eyebrow">Acceso</p>
            <h2>Iniciar sesion</h2>

            <label>
              Usuario
              <input [(ngModel)]="username" name="username" required placeholder="admin" />
            </label>

            <label>
              Contrasena
              <input [(ngModel)]="password" name="password" required type="password" placeholder="admin123" />
            </label>

            <button type="submit">Entrar al sistema</button>
            <p *ngIf="message" class="inline-error">{{ message }}</p>
          </form>
        </article>
      </section>
    </main>
  `
})
export class LoginPageComponent {
  username = 'admin';
  password = 'admin123';
  message = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    const ok = this.auth.login(this.username.trim(), this.password);
    if (ok) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    this.message = 'Credenciales incorrectas. Usa admin / admin123.';
  }
}
