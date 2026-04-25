import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>Reportes</h1>
      </div>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section class="card">
      <div class="reports-grid">
        <form class="mini-card" (ngSubmit)="loadCaja()">
          <h3>Caja diaria</h3>
          <label>Fecha<input [(ngModel)]="fechaCaja" name="fechaCaja" type="date" /></label>
          <button type="submit">Consultar</button>
        </form>

        <form class="mini-card" (ngSubmit)="loadRango()">
          <h3>Caja por rango</h3>
          <label>Desde<input [(ngModel)]="desde" name="desde" required type="date" /></label>
          <label>Hasta<input [(ngModel)]="hasta" name="hasta" required type="date" /></label>
          <button type="submit">Consultar</button>
        </form>

        <form class="mini-card" (ngSubmit)="loadDeudaSocio()">
          <h3>Deuda por socio</h3>
          <p>Consulta el consolidado actual.</p>
          <button type="submit">Consultar</button>
        </form>
      </div>

      <pre class="report-output">{{ output }}</pre>
    </section>
  `
})
export class ReportesPageComponent {
  fechaCaja = new Date().toISOString().slice(0, 10);
  desde = this.fechaCaja;
  hasta = this.fechaCaja;
  output = 'Aqui apareceran los resultados de reportes.';
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  async loadCaja(): Promise<void> {
    await this.render(() => firstValueFrom(this.api.reporteCaja(this.fechaCaja)));
  }

  async loadRango(): Promise<void> {
    await this.render(() => firstValueFrom(this.api.reporteCajaRango(this.desde, this.hasta)));
  }

  async loadDeudaSocio(): Promise<void> {
    await this.render(() => firstValueFrom(this.api.reporteDeudaPorSocio()));
  }

  private async render(factory: () => Promise<unknown>): Promise<void> {
    try {
      const data = await factory();
      this.output = JSON.stringify(data, null, 2);
      this.flash('Reporte generado.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo generar el reporte.';
  }
}
