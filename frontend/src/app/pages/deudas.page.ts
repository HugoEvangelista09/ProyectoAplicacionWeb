import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Deuda, MotivoCobro, Socio } from '../shared/models';

@Component({
  selector: 'app-deudas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>{{ isSocioView ? 'Mis deudas' : 'Deudas' }}</h1>
      </div>
      <button type="button" (click)="load()">Actualizar lista</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section *ngIf="canRegisterDeudas" class="card">
      <form class="form-grid" (ngSubmit)="save()">
        <label>
          Socio
          <select [(ngModel)]="form.socioId" (ngModelChange)="onSocioChange($event)" name="socioId" [disabled]="loading" required>
            <option [ngValue]="null">{{ loading ? 'Cargando socios...' : 'Seleccione' }}</option>
            <option *ngFor="let socio of sociosActivos" [ngValue]="socio.id">{{ fullName(socio) }}</option>
          </select>
        </label>
        <label>Fecha<input [(ngModel)]="form.fecha" name="fecha" type="date" /></label>
        <label class="full-width">Descripcion<input [(ngModel)]="form.descripcion" name="descripcion" placeholder="Ej. cuota mensual de abril" /></label>
        <label>
          Motivo
          <select [(ngModel)]="form.motivoCobroId" (ngModelChange)="onMotivoChange($event)" name="motivoCobroId" [disabled]="loading" required>
            <option [ngValue]="null">{{ loading ? 'Cargando motivos...' : 'Seleccione' }}</option>
            <option *ngFor="let motivo of motivosActivos" [ngValue]="motivo.id">{{ motivo.nombre }}</option>
          </select>
        </label>
        <label>Monto<input [(ngModel)]="form.monto" name="monto" min="0.01" step="0.01" type="number" required /></label>
        <label class="full-width">Observacion<input [(ngModel)]="form.observacion" name="observacion" /></label>
        <div class="actions full-width">
          <button type="submit" [disabled]="loading">Registrar deuda</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="list-toolbar">
        <input [(ngModel)]="searchTerm" (ngModelChange)="page = 1" name="searchDeudas" placeholder="Buscar por socio, fecha, descripcion o estado" />
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
              <th>Descripcion</th>
              <th>Estado</th>
              <th>Total pendiente</th>
              <th>Observaciones</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let deuda of visibleDeudas">
              <td>{{ deuda.id }}</td>
              <td>{{ deuda.socioNombre || deuda.socioId }}</td>
              <td>{{ deuda.fecha || '-' }}</td>
              <td>{{ deuda.descripcion || '-' }}</td>
              <td>{{ deuda.estado }}</td>
              <td>{{ money(deuda.totalPendiente) }}</td>
              <td>{{ observaciones(deuda) }}</td>
              <td>
                <div *ngFor="let item of deuda.items">
                  <strong>{{ item.motivoCobroNombre }}</strong> - {{ money(item.monto) }} - {{ item.estado }}
                </div>
                <span *ngIf="!deuda.items.length" class="muted">Sin items</span>
              </td>
            </tr>
            <tr *ngIf="!visibleDeudas.length">
              <td colspan="8" class="muted">{{ loading ? 'Cargando deudas...' : 'No hay deudas para mostrar.' }}</td>
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

  get canRegisterDeudas(): boolean {
    return !this.isSocioView;
  }

  get sociosActivos(): Socio[] {
    return this.socios.filter((item) => item.activo);
  }

  get motivosActivos(): MotivoCobro[] {
    return this.motivos.filter((item) => item.activo);
  }

  get filteredDeudas(): Deuda[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.deudas;

    return this.deudas.filter((deuda) =>
      `${deuda.socioNombre ?? deuda.socioId} ${deuda.fecha ?? ''} ${deuda.descripcion ?? ''} ${deuda.estado} ${
        (deuda.items || []).map((item) => item.motivoCobroNombre).join(' ')
      }`
        .toLowerCase()
        .includes(term)
    );
  }

  get visibleDeudas(): Deuda[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredDeudas.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDeudas.length / this.pageSize));
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
        this.motivos = [];
        this.deudas = await firstValueFrom(this.api.listarDeudas(socioId));
      } else {
        const [socios, motivos, deudas] = await Promise.all([
          firstValueFrom(this.api.listarSocios()),
          firstValueFrom(this.api.listarMotivos()),
          firstValueFrom(this.api.listarDeudas())
        ]);
        this.socios = socios;
        this.motivos = motivos;
        this.deudas = deudas;
      }
      this.page = 1;
      this.flash(this.isSocioView ? 'Tus deudas fueron cargadas.' : 'Deudas cargadas.', 'success');
      this.cdr.detectChanges();
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async save(): Promise<void> {
    if (!this.canRegisterDeudas) {
      this.flash('Este perfil solo puede consultar deudas.', 'error');
      return;
    }

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

  observaciones(deuda: Deuda): string {
    const values = (deuda.items || [])
      .map((item) => item.observacion?.trim())
      .filter((item): item is string => !!item);
    return values.length ? values.join(' | ') : '-';
  }

  fullName(socio: Socio): string {
    return `${socio.nombre} ${socio.apellido}`.trim();
  }

  onSocioChange(value: number | null): void {
    this.form.socioId = value;
    this.cdr.detectChanges();
  }

  onMotivoChange(value: number | null): void {
    this.form.motivoCobroId = value;
    this.cdr.detectChanges();
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
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
