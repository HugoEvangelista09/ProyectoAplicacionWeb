import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Puesto, Socio } from '../shared/models';

@Component({
  selector: 'app-puestos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>Puestos</h1>
      </div>
      <button type="button" (click)="load()">Actualizar lista</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section class="card">
      <div class="section-title">
        <div>
          <p class="eyebrow">Formulario</p>
          <h2>Registrar o editar puesto</h2>
        </div>
      </div>

      <form class="form-grid" (ngSubmit)="save()">
        <label>
          Categoria
          <select [(ngModel)]="form.categoria" name="categoria" required>
            <option [ngValue]="null">Seleccionar categoria</option>
            <option *ngFor="let categoria of categorias" [ngValue]="categoria.id">{{ categoria.nombre }}</option>
          </select>
        </label>
        <label>Descripcion<input [(ngModel)]="form.descripcion" name="descripcion" /></label>
        <label>
          Socio asignado
          <select [(ngModel)]="form.socioId" name="socioId">
            <option [ngValue]="null">Pertenece a la asociacion</option>
            <option *ngFor="let socio of sociosActivos" [ngValue]="socio.id">{{ fullName(socio) }}</option>
          </select>
        </label>
        <div class="actions full-width">
          <button type="submit">{{ form.id ? 'Actualizar puesto' : 'Guardar puesto' }}</button>
          <button type="button" class="secondary-btn" (click)="reset()">Limpiar</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="list-toolbar">
        <input [(ngModel)]="searchTerm" (ngModelChange)="page = 1" name="searchPuestos" placeholder="Buscar por numero, categoria, descripcion o socio" />
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
              <th>Numero</th>
              <th>Categoria</th>
              <th>Descripcion</th>
              <th>Socio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let puesto of visiblePuestos">
              <td>{{ puesto.id }}</td>
              <td>{{ puesto.numero }}</td>
              <td>{{ puesto.categoriaNombre || '-' }}</td>
              <td>{{ puesto.descripcion || '-' }}</td>
              <td>{{ puesto.esDeAsociacion ? 'Asociacion' : (puesto.socioNombre || '-') }}</td>
              <td>{{ puesto.activo ? 'Activo' : 'Inactivo' }}</td>
              <td>
                <div class="table-actions">
                  <button type="button" (click)="edit(puesto)">Editar</button>
                  <button type="button" class="danger-btn" (click)="remove(puesto.id)">Desactivar</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!visiblePuestos.length">
              <td colspan="7" class="muted">No hay puestos registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class PuestosPageComponent implements OnInit {
  puestos: Puesto[] = [];
  socios: Socio[] = [];
  searchTerm = '';
  page = 1;
  readonly pageSize = 6;
  readonly categorias = [
    { id: 1, nombre: 'Naturista' },
    { id: 2, nombre: 'Abarrotes' },
    { id: 3, nombre: 'Plasticos' },
    { id: 4, nombre: 'Pollos' },
    { id: 5, nombre: 'Carnes' },
    { id: 6, nombre: 'Ferreteria' },
    { id: 7, nombre: 'Ropa' },
    { id: 8, nombre: 'Verduras' },
    { id: 9, nombre: 'Pescados' },
    { id: 10, nombre: 'Restaurantes' }
  ];
  form: { id?: number; categoria: number | null; descripcion: string; socioId: number | null } = this.emptyForm();
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  get sociosActivos(): Socio[] {
    return this.socios.filter((item) => item.activo);
  }

  ngOnInit(): void {
    this.load();
  }

  get filteredPuestos(): Puesto[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.puestos;

    return this.puestos.filter((puesto) =>
      `${puesto.numero} ${puesto.categoriaNombre ?? ''} ${puesto.descripcion ?? ''} ${puesto.socioNombre ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }

  get visiblePuestos(): Puesto[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredPuestos.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPuestos.length / this.pageSize));
  }

  async load(): Promise<void> {
    const [sociosResult, puestosResult] = await Promise.allSettled([
      firstValueFrom(this.api.listarSocios()),
      firstValueFrom(this.api.listarPuestos())
    ]);

    this.socios = sociosResult.status === 'fulfilled' ? sociosResult.value : [];
    this.puestos = puestosResult.status === 'fulfilled' ? puestosResult.value : [];
    this.page = 1;

    if (sociosResult.status === 'rejected' || puestosResult.status === 'rejected') {
      const failure = sociosResult.status === 'rejected'
        ? sociosResult.reason
        : puestosResult.status === 'rejected'
          ? puestosResult.reason
          : null;
      this.flash(
        `Se cargaron datos parciales. ${this.errorMessage(failure)}`,
        'error'
      );
      return;
    }

    this.flash('Puestos cargados.', 'success');
  }

  async save(): Promise<void> {
    try {
      await firstValueFrom(this.api.guardarPuesto({
        categoria: this.form.categoria ?? 0,
        descripcion: this.form.descripcion,
        socioId: this.form.socioId
      }, this.form.id));

      this.reset();
      await this.load();
      this.flash('Puesto guardado.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  edit(puesto: Puesto): void {
    this.form = {
      id: puesto.id,
      categoria: puesto.categoria ?? null,
      descripcion: puesto.descripcion || '',
      socioId: puesto.socioId || null
    };
  }

  async remove(id: number): Promise<void> {
    if (!confirm('Se desactivara este puesto. Deseas continuar?')) return;

    try {
      await firstValueFrom(this.api.desactivarPuesto(id));
      await this.load();
      this.flash('Puesto desactivado.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  reset(): void {
    this.form = this.emptyForm();
  }

  fullName(socio: Socio): string {
    return `${socio.nombre} ${socio.apellido}`.trim();
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  private emptyForm(): { id?: number; categoria: number | null; descripcion: string; socioId: number | null } {
    return { categoria: null, descripcion: '', socioId: null };
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.message || 'No se pudo procesar la solicitud.';
    }
    return error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
  }
}
