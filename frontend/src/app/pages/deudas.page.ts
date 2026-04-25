import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Deuda, MotivoCobro, Socio } from '../shared/models';

@Component({
  selector: 'app-deudas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>Deudas</h1>
      </div>
      <button type="button" (click)="load()">Actualizar lista</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section class="card">
      <form class="form-grid" (ngSubmit)="save()">
        <label>
          Socio
          <select [(ngModel)]="form.socioId" name="socioId" required>
            <option [ngValue]="null">Seleccione</option>
            <option *ngFor="let socio of sociosActivos" [ngValue]="socio.id">{{ fullName(socio) }}</option>
          </select>
        </label>
        <label>Fecha<input [(ngModel)]="form.fecha" name="fecha" type="date" /></label>
        <label class="full-width">Descripcion<input [(ngModel)]="form.descripcion" name="descripcion" placeholder="Ej. cuota mensual de abril" /></label>
        <label>
          Motivo
          <select [(ngModel)]="form.motivoCobroId" name="motivoCobroId" required>
            <option [ngValue]="null">Seleccione</option>
            <option *ngFor="let motivo of motivosActivos" [ngValue]="motivo.id">{{ motivo.nombre }}</option>
          </select>
        </label>
        <label>Monto<input [(ngModel)]="form.monto" name="monto" min="0.01" step="0.01" type="number" required /></label>
        <label class="full-width">Observacion<input [(ngModel)]="form.observacion" name="observacion" /></label>
        <div class="actions">
          <button type="submit">Registrar deuda</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Socio</th>
              <th>Fecha</th>
              <th>Descripcion</th>
              <th>Estado</th>
              <th>Total pendiente</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let deuda of deudas">
              <td>{{ deuda.id }}</td>
              <td>{{ deuda.socioNombre || deuda.socioId }}</td>
              <td>{{ deuda.fecha || '-' }}</td>
              <td>{{ deuda.descripcion || '-' }}</td>
              <td>{{ deuda.estado }}</td>
              <td>{{ money(deuda.totalPendiente) }}</td>
              <td>
                <div *ngFor="let item of deuda.items">
                  <strong>{{ item.motivoCobroNombre }}</strong> - {{ money(item.monto) }} - {{ item.estado }}
                </div>
                <span *ngIf="!deuda.items.length" class="muted">Sin items</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class DeudasPageComponent implements OnInit {
  socios: Socio[] = [];
  motivos: MotivoCobro[] = [];
  deudas: Deuda[] = [];
  form = this.emptyForm();
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  get sociosActivos(): Socio[] {
    return this.socios.filter((item) => item.activo);
  }

  get motivosActivos(): MotivoCobro[] {
    return this.motivos.filter((item) => item.activo);
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    try {
      const [socios, motivos, deudas] = await Promise.all([
        firstValueFrom(this.api.listarSocios()),
        firstValueFrom(this.api.listarMotivos()),
        firstValueFrom(this.api.listarDeudas())
      ]);
      this.socios = socios;
      this.motivos = motivos;
      this.deudas = deudas;
      this.flash('Deudas cargadas.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  async save(): Promise<void> {
    try {
      await firstValueFrom(this.api.crearDeuda({
        socioId: Number(this.form.socioId),
        fecha: this.form.fecha || null,
        descripcion: this.form.descripcion,
        items: [
          {
            motivoCobroId: Number(this.form.motivoCobroId),
            monto: Number(this.form.monto),
            observacion: this.form.observacion
          }
        ]
      }));

      this.form = this.emptyForm();
      await this.load();
      this.flash('Deuda registrada.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value || 0));
  }

  fullName(socio: Socio): string {
    return `${socio.nombre} ${socio.apellido}`.trim();
  }

  private emptyForm() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      socioId: null as number | null,
      fecha: today,
      descripcion: '',
      motivoCobroId: null as number | null,
      monto: null as number | null,
      observacion: ''
    };
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
  }
}
