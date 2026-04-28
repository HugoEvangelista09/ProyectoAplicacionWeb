import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Socio } from '../shared/models';

@Component({
  selector: 'app-socios-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>Socios</h1>
      </div>
      <button type="button" (click)="load()">Actualizar lista</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section class="card">
      <div class="section-title">
        <div>
          <p class="eyebrow">Formulario</p>
          <h2>Registrar o editar socio</h2>
        </div>
      </div>

      <form class="form-grid" (ngSubmit)="save()">
        <label>Nombre<input [(ngModel)]="form.nombre" name="nombre" required /></label>
        <label>Apellido<input [(ngModel)]="form.apellido" name="apellido" required /></label>
        <label>DNI<input [(ngModel)]="form.dni" name="dni" required /></label>
        <label>Telefono<input [(ngModel)]="form.telefono" name="telefono" /></label>
        <label>Email<input [(ngModel)]="form.email" name="email" type="email" /></label>
        <div class="actions full-width">
          <button type="submit">{{ form.id ? 'Actualizar socio' : 'Guardar socio' }}</button>
          <button type="button" class="secondary-btn" (click)="reset()">Limpiar</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="list-toolbar">
        <input [(ngModel)]="searchTerm" (ngModelChange)="page = 1" name="searchSocios" placeholder="Buscar por nombre, DNI, telefono o email" />
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
              <th>DNI</th>
              <th>Telefono</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let socio of visibleSocios">
              <td>{{ socio.id }}</td>
              <td>{{ fullName(socio) }}</td>
              <td>{{ socio.dni }}</td>
              <td>{{ socio.telefono || '-' }}</td>
              <td>{{ socio.email || '-' }}</td>
              <td>{{ socio.activo ? 'Activo' : 'Inactivo' }}</td>
              <td>
                <div class="table-actions">
                  <button type="button" (click)="edit(socio)">Editar</button>
                  <button type="button" class="danger-btn" (click)="remove(socio.id)">Desactivar</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!visibleSocios.length">
              <td colspan="7" class="muted">No hay socios para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class SociosPageComponent implements OnInit {
  socios: Socio[] = [];
  form: Partial<Socio> = this.emptyForm();
  searchTerm = '';
  page = 1;
  readonly pageSize = 6;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredSocios(): Socio[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.socios;

    return this.socios.filter((socio) =>
      `${socio.nombre} ${socio.apellido} ${socio.dni} ${socio.telefono ?? ''} ${socio.email ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }

  get visibleSocios(): Socio[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredSocios.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSocios.length / this.pageSize));
  }

  async load(): Promise<void> {
    try {
      this.socios = await firstValueFrom(this.api.listarSocios());
      this.page = 1;
      this.flash('Socios cargados.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  async save(): Promise<void> {
    try {
      await firstValueFrom(this.api.guardarSocio(this.form, this.form.id));
      this.reset();
      await this.load();
      this.flash('Socio guardado correctamente.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  edit(socio: Socio): void {
    this.form = { ...socio };
  }

  async remove(id: number): Promise<void> {
    if (!confirm('Se desactivara este socio. Deseas continuar?')) return;

    try {
      await firstValueFrom(this.api.desactivarSocio(id));
      await this.load();
      this.flash('Socio desactivado.', 'success');
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

  private emptyForm(): Partial<Socio> {
    return { nombre: '', apellido: '', dni: '', telefono: '', email: '' };
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
  }
}
