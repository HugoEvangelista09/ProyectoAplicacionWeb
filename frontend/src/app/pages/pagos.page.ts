import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Deuda, DeudaItem, Pago, Socio } from '../shared/models';

@Component({
  selector: 'app-pagos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>Pagos</h1>
      </div>
      <button type="button" (click)="load()">Actualizar lista</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section class="card">
      <form class="form-grid" (ngSubmit)="save()">
        <label>
          Socio
          <select [(ngModel)]="selectedSocioId" name="selectedSocioId" required>
            <option [ngValue]="null">Seleccione un socio</option>
            <option *ngFor="let socio of sociosActivos" [ngValue]="socio.id">{{ fullName(socio) }}</option>
          </select>
        </label>

        <label class="full-width">Observacion<input [(ngModel)]="observacion" name="observacion" /></label>

        <fieldset class="full-width">
          <legend>Items pendientes del socio</legend>
          <div class="checkbox-list">
            <label *ngFor="let item of pendingItems" class="checkbox-item">
              <input type="checkbox" [ngModel]="selectedItemIds.has(item.id)" (ngModelChange)="toggleItem(item.id, $event)" [name]="'item-' + item.id" />
              <span>
                <strong>{{ item.motivoCobroNombre }}</strong><br />
                {{ money(item.monto) }} | {{ item.deudaFecha || '-' }} | {{ item.deudaDescripcion || '-' }}
              </span>
            </label>
            <p *ngIf="!pendingItems.length" class="muted">Este socio no tiene items pendientes.</p>
          </div>
        </fieldset>

        <div class="actions">
          <button type="submit">Registrar pago</button>
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
              <th>Monto total</th>
              <th>Observacion</th>
              <th>Items pagados</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pago of pagos">
              <td>{{ pago.id }}</td>
              <td>{{ pago.socioNombre || pago.socioId }}</td>
              <td>{{ pago.fecha || '-' }}</td>
              <td>{{ money(pago.montoTotal) }}</td>
              <td>{{ pago.observacion || '-' }}</td>
              <td>{{ paidItems(pago) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class PagosPageComponent implements OnInit {
  socios: Socio[] = [];
  deudas: Deuda[] = [];
  pagos: Pago[] = [];
  selectedSocioId: number | null = null;
  observacion = '';
  selectedItemIds = new Set<number>();
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  get sociosActivos(): Socio[] {
    return this.socios.filter((item) => item.activo);
  }

  get pendingItems(): Array<DeudaItem & { deudaFecha?: string; deudaDescripcion?: string }> {
    if (!this.selectedSocioId) return [];

    return this.deudas
      .filter((deuda) => deuda.socioId === this.selectedSocioId)
      .flatMap((deuda) =>
        (deuda.items || [])
          .filter((item) => item.estado === 'PENDIENTE')
          .map((item) => ({
            ...item,
            deudaFecha: deuda.fecha,
            deudaDescripcion: deuda.descripcion
          }))
      );
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    try {
      const [socios, deudas, pagos] = await Promise.all([
        firstValueFrom(this.api.listarSocios()),
        firstValueFrom(this.api.listarDeudas()),
        firstValueFrom(this.api.listarPagos())
      ]);
      this.socios = socios;
      this.deudas = deudas;
      this.pagos = pagos;
      this.flash('Pagos cargados.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  toggleItem(id: number, checked: boolean): void {
    if (checked) {
      this.selectedItemIds.add(id);
    } else {
      this.selectedItemIds.delete(id);
    }
  }

  async save(): Promise<void> {
    if (!this.selectedSocioId) {
      this.flash('Selecciona un socio.', 'error');
      return;
    }

    try {
      await firstValueFrom(this.api.crearPago({
        socioId: Number(this.selectedSocioId),
        deudaItemIds: Array.from(this.selectedItemIds),
        observacion: this.observacion
      }));

      this.selectedItemIds.clear();
      this.observacion = '';
      await this.load();
      this.flash('Pago registrado.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  paidItems(pago: Pago): string {
    return (pago.itemsPagados || []).map((item) => item.motivoCobroNombre).join(', ') || '-';
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value || 0));
  }

  fullName(socio: Socio): string {
    return `${socio.nombre} ${socio.apellido}`.trim();
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
  }
}
