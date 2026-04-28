import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Deuda, DeudaItem, Pago, Socio } from '../shared/models';

@Component({
  selector: 'app-pagos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>{{ isSocioView ? 'Mis pagos' : 'Pagos' }}</h1>
      </div>
      <button type="button" (click)="load()">Actualizar lista</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section *ngIf="canRegisterPagos" class="card">
      <form class="form-grid" (ngSubmit)="save()">
        <label>
          Socio
          <select [(ngModel)]="selectedSocioId" (ngModelChange)="onSocioChange($event)" name="selectedSocioId" [disabled]="loading" required>
            <option [ngValue]="null">{{ loading ? 'Cargando socios...' : 'Seleccione un socio' }}</option>
            <option *ngFor="let socio of sociosActivos" [ngValue]="socio.id">{{ fullName(socio) }}</option>
          </select>
        </label>

        <label class="full-width">Observacion<input [(ngModel)]="observacion" name="observacion" /></label>

        <fieldset class="full-width">
          <legend>Items pendientes del socio</legend>
          <div class="checkbox-list">
            <label *ngFor="let item of pendingItemsList" class="checkbox-item">
              <input type="checkbox" [ngModel]="selectedItemIds.has(item.id)" (ngModelChange)="toggleItem(item.id, $event)" [name]="'item-' + item.id" />
              <span>
                <strong>{{ item.motivoCobroNombre }}</strong><br />
                {{ money(item.monto) }} | {{ item.deudaFecha || '-' }} | {{ item.deudaDescripcion || '-' }}
              </span>
            </label>
            <p *ngIf="!pendingItemsList.length" class="muted">{{ loading ? 'Cargando items pendientes...' : 'Este socio no tiene items pendientes.' }}</p>
          </div>
        </fieldset>

        <div class="actions full-width">
          <button type="submit" [disabled]="loading">Registrar pago</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="list-toolbar">
        <input [(ngModel)]="searchTerm" (ngModelChange)="page = 1" name="searchPagos" placeholder="Buscar por socio, fecha, observacion o items pagados" />
        <div class="pagination">
          <span>Pagina {{ page }} de {{ totalPages }}</span>
          <button type="button" class="secondary-btn" (click)="prevPage()" [disabled]="page === 1">Anterior</button>
          <button type="button" class="secondary-btn" (click)="nextPage()" [disabled]="page === totalPages">Siguiente</button>
        </div>
      </div>
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
            <tr *ngFor="let pago of visiblePagos">
              <td>{{ pago.id }}</td>
              <td>{{ pago.socioNombre || pago.socioId }}</td>
              <td>{{ pago.fecha || '-' }}</td>
              <td>{{ money(pago.montoTotal) }}</td>
              <td>{{ pago.observacion || '-' }}</td>
              <td>{{ paidItems(pago) }}</td>
            </tr>
            <tr *ngIf="!visiblePagos.length">
              <td colspan="6" class="muted">{{ loading ? 'Cargando pagos...' : 'No hay pagos para mostrar.' }}</td>
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
  pendingItemsList: Array<DeudaItem & { deudaFecha?: string; deudaDescripcion?: string }> = [];
  selectedSocioId: number | null = null;
  observacion = '';
  selectedItemIds = new Set<number>();
  searchTerm = '';
  page = 1;
  readonly pageSize = 6;
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private readonly api: ApiService,
    public readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get isSocioView(): boolean {
    return this.auth.isSocio();
  }

  get canRegisterPagos(): boolean {
    return !this.isSocioView;
  }

  get sociosActivos(): Socio[] {
    return this.socios.filter((item) => item.activo);
  }

  get filteredPagos(): Pago[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.pagos;

    return this.pagos.filter((pago) =>
      `${pago.socioNombre ?? pago.socioId} ${pago.fecha ?? ''} ${pago.observacion ?? ''} ${this.paidItems(pago)}`
        .toLowerCase()
        .includes(term)
    );
  }

  get visiblePagos(): Pago[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredPagos.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPagos.length / this.pageSize));
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      if (this.isSocioView) {
        const socioId = this.auth.currentSocioId();
        this.socios = [];
        this.deudas = await firstValueFrom(this.api.listarDeudas(socioId));
        this.pagos = await firstValueFrom(this.api.listarPagos(socioId));
      } else {
        const [socios, deudas, pagos] = await Promise.all([
          firstValueFrom(this.api.listarSocios()),
          firstValueFrom(this.api.listarDeudas()),
          firstValueFrom(this.api.listarPagos())
        ]);
        this.socios = socios;
        this.deudas = deudas;
        this.pagos = pagos;
      }
      this.page = 1;
      this.refreshPendingItems();
      this.flash(this.isSocioView ? 'Tus pagos fueron cargados.' : 'Pagos cargados.', 'success');
      this.cdr.detectChanges();
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
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
    if (!this.canRegisterPagos) {
      this.flash('Este perfil solo puede consultar pagos.', 'error');
      return;
    }

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
      this.selectedSocioId = null;
      this.pendingItemsList = [];
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

  onSocioChange(value: number | null): void {
    this.selectedSocioId = value;
    this.selectedItemIds.clear();
    this.refreshPendingItems();
    this.cdr.detectChanges();
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  private refreshPendingItems(): void {
    if (!this.selectedSocioId) {
      this.pendingItemsList = [];
      return;
    }

    this.pendingItemsList = this.deudas
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

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
  }
}
