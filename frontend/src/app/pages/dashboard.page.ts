import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Deuda, MotivoCobro, Pago, Puesto, Socio } from '../shared/models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Vista general</p>
        <h1>Panel principal</h1>
      </div>
      <button type="button" (click)="load()">Actualizar resumen</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">
      {{ message }}
    </div>

    <section class="hero-banner">
      <div>
        <p class="eyebrow">Hoy</p>
        <h2>Control rapido del sistema</h2>
        <p>Revisa el estado general y entra a cada modulo desde Angular.</p>
      </div>
      <div class="hero-actions">
        <a class="button-link" routerLink="/socios">Registrar socio</a>
        <a class="button-link secondary-btn" routerLink="/pagos">Registrar pago</a>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Socios</span>
        <strong>{{ socios.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Puestos</span>
        <strong>{{ puestos.length }}</strong>
      </article>
      <article class="stat-card">
        <span>Motivos activos</span>
        <strong>{{ motivosActivos }}</strong>
      </article>
      <article class="stat-card">
        <span>Deudas pendientes</span>
        <strong>{{ deudasPendientes }}</strong>
      </article>
    </section>

    <section class="content-grid">
      <article class="card">
        <div class="section-title">
          <div>
            <p class="eyebrow">Actividad</p>
            <h2>Ultimos pagos</h2>
          </div>
          <a class="button-link secondary-btn" routerLink="/pagos">Ver modulo</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Socio</th>
                <th>Fecha</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pago of pagosRecientes">
                <td>{{ pago.id }}</td>
                <td>{{ pago.socioNombre || pago.socioId }}</td>
                <td>{{ pago.fecha || '-' }}</td>
                <td>{{ money(pago.montoTotal) }}</td>
              </tr>
              <tr *ngIf="!pagosRecientes.length">
                <td colspan="4" class="muted">No hay pagos registrados.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="card">
        <div class="section-title">
          <div>
            <p class="eyebrow">Pendientes</p>
            <h2>Deudas recientes</h2>
          </div>
          <a class="button-link secondary-btn" routerLink="/deudas">Ver modulo</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Socio</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let deuda of deudasRecientes">
                <td>{{ deuda.id }}</td>
                <td>{{ deuda.socioNombre || deuda.socioId }}</td>
                <td>{{ deuda.estado }}</td>
                <td>{{ money(deuda.totalPendiente) }}</td>
              </tr>
              <tr *ngIf="!deudasRecientes.length">
                <td colspan="4" class="muted">No hay deudas registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `
})
export class DashboardPageComponent implements OnInit {
  socios: Socio[] = [];
  puestos: Puesto[] = [];
  motivos: MotivoCobro[] = [];
  deudas: Deuda[] = [];
  pagos: Pago[] = [];
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  get motivosActivos(): number {
    return this.motivos.filter((item) => item.activo).length;
  }

  get deudasPendientes(): number {
    return this.deudas.filter((item) => item.estado !== 'PAGADA').length;
  }

  get pagosRecientes(): Pago[] {
    return this.pagos.slice(0, 5);
  }

  get deudasRecientes(): Deuda[] {
    return this.deudas.slice(0, 5);
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    try {
      const [socios, puestos, motivos, deudas, pagos] = await Promise.all([
        firstValueFrom(this.api.listarSocios()),
        firstValueFrom(this.api.listarPuestos()),
        firstValueFrom(this.api.listarMotivos()),
        firstValueFrom(this.api.listarDeudas()),
        firstValueFrom(this.api.listarPagos())
      ]);

      this.socios = socios;
      this.puestos = puestos;
      this.motivos = motivos;
      this.deudas = deudas;
      this.pagos = pagos;
      this.flash('Resumen actualizado.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value || 0));
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo cargar el dashboard.';
  }
}
