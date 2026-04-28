import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { MotivoCobro } from '../shared/models';

@Component({
  selector: 'app-motivos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>Motivos de cobro</h1>
      </div>
      <button type="button" (click)="load()">Actualizar lista</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section class="card">
      <form class="form-grid" (ngSubmit)="save()">
        <label>Nombre<input [(ngModel)]="form.nombre" name="nombre" required /></label>
        <label class="full-width">Descripcion<input [(ngModel)]="form.descripcion" name="descripcion" /></label>
        <div class="actions full-width">
          <button type="submit">{{ form.id ? 'Actualizar motivo' : 'Guardar motivo' }}</button>
          <button type="button" class="secondary-btn" (click)="reset()">Limpiar</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="list-toolbar">
        <input [(ngModel)]="searchTerm" (ngModelChange)="page = 1" name="searchMotivos" placeholder="Buscar por nombre o descripcion" />
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
              <th>Nombre</th>
              <th>Descripcion</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let motivo of visibleMotivos">
              <td>{{ motivo.id }}</td>
              <td>{{ motivo.nombre }}</td>
              <td>{{ motivo.descripcion || '-' }}</td>
              <td>{{ motivo.activo ? 'Activo' : 'Inactivo' }}</td>
              <td>
                <div class="table-actions">
                  <button type="button" (click)="edit(motivo)">Editar</button>
                  <button type="button" class="danger-btn" (click)="remove(motivo.id)">Desactivar</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!visibleMotivos.length">
              <td colspan="5" class="muted">No hay motivos para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class MotivosPageComponent implements OnInit {
  motivos: MotivoCobro[] = [];
  form: { id?: number; nombre: string; descripcion: string } = this.emptyForm();
  searchTerm = '';
  page = 1;
  readonly pageSize = 6;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredMotivos(): MotivoCobro[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.motivos;

    return this.motivos.filter((motivo) =>
      `${motivo.nombre} ${motivo.descripcion ?? ''}`.toLowerCase().includes(term)
    );
  }

  get visibleMotivos(): MotivoCobro[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredMotivos.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredMotivos.length / this.pageSize));
  }

  async load(): Promise<void> {
    try {
      this.motivos = await firstValueFrom(this.api.listarMotivos());
      this.page = 1;
      this.flash('Motivos cargados.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  async save(): Promise<void> {
    try {
      await firstValueFrom(this.api.guardarMotivo(this.form, this.form.id));
      this.reset();
      await this.load();
      this.flash('Motivo guardado.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  edit(motivo: MotivoCobro): void {
    this.form = {
      id: motivo.id,
      nombre: motivo.nombre,
      descripcion: motivo.descripcion || ''
    };
  }

  async remove(id: number): Promise<void> {
    if (!confirm('Se desactivara este motivo. Deseas continuar?')) return;

    try {
      await firstValueFrom(this.api.desactivarMotivo(id));
      await this.load();
      this.flash('Motivo desactivado.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  reset(): void {
    this.form = this.emptyForm();
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  private emptyForm(): { id?: number; nombre: string; descripcion: string } {
    return { nombre: '', descripcion: '' };
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
  }
}
