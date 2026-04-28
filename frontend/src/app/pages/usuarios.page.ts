import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Usuario, UsuarioForm } from '../shared/models';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div>
        <p class="eyebrow">Modulo</p>
        <h1>Usuarios</h1>
      </div>
      <button type="button" (click)="load()">Actualizar lista</button>
    </header>

    <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">{{ message }}</div>

    <section class="card">
      <div class="section-title">
        <div>
          <p class="eyebrow">Formulario</p>
          <h2>Registrar o editar usuario</h2>
        </div>
      </div>

      <form class="form-grid" (ngSubmit)="save()">
        <label>Username<input [(ngModel)]="form.username" name="username" required /></label>
        <label>
          {{ form.id ? 'Nueva contrasena (dejar en blanco para no cambiar)' : 'Contrasena' }}
          <input [(ngModel)]="form.password" name="password" type="password" [required]="!form.id" />
        </label>
        <label>Nombre completo<input [(ngModel)]="form.nombreCompleto" name="nombreCompleto" required /></label>
        <label>DNI<input [(ngModel)]="form.dni" name="dni" required maxlength="8" /></label>
        <label>RUC<input [(ngModel)]="form.ruc" name="ruc" required maxlength="11" /></label>
        <label>Email<input [(ngModel)]="form.email" name="email" type="email" /></label>
        <label>Telefono<input [(ngModel)]="form.telefono" name="telefono" /></label>
        <label>Direccion<input [(ngModel)]="form.direccion" name="direccion" /></label>
        <label>Rol
          <select [(ngModel)]="form.rol" name="rol" required>
            <option [ngValue]="null" disabled>Seleccionar rol</option>
            <option [ngValue]="1">Administrador</option>
            <option [ngValue]="2">Operador</option>
          </select>
        </label>
        <div class="actions full-width">
          <button type="submit">{{ form.id ? 'Actualizar usuario' : 'Guardar usuario' }}</button>
          <button type="button" class="secondary-btn" (click)="reset()">Limpiar</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="list-toolbar">
        <input [(ngModel)]="searchTerm" (ngModelChange)="page = 1" name="searchUsuarios" placeholder="Buscar por username, nombre, DNI, RUC o email" />
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
              <th>Username</th>
              <th>Nombre Completo</th>
              <th>DNI</th>
              <th>RUC</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let usuario of visibleUsuarios">
              <td>{{ usuario.id }}</td>
              <td>{{ usuario.username }}</td>
              <td>{{ usuario.nombreCompleto }}</td>
              <td>{{ usuario.dni }}</td>
              <td>{{ usuario.ruc }}</td>
              <td>{{ usuario.email || '-' }}</td>
              <td>{{ usuario.telefono || '-' }}</td>
              <td>{{ rolLabel(usuario.rol) }}</td>
              <td>{{ usuario.activo ? 'Activo' : 'Inactivo' }}</td>
              <td>
                <div class="table-actions">
                  <button type="button" (click)="edit(usuario)">Editar</button>
                  <button type="button" class="danger-btn" (click)="remove(usuario.id)">Desactivar</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!visibleUsuarios.length">
              <td colspan="10" class="muted">No hay usuarios para mostrar.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class UsuariosPageComponent implements OnInit {
  usuarios: Usuario[] = [];
  form: UsuarioForm = this.emptyForm();
  searchTerm = '';
  page = 1;
  readonly pageSize = 6;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredUsuarios(): Usuario[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.usuarios;

    return this.usuarios.filter((usuario) =>
      `${usuario.username} ${usuario.nombreCompleto} ${usuario.dni} ${usuario.ruc} ${usuario.email ?? ''} ${usuario.telefono ?? ''}`
        .toLowerCase()
        .includes(term)
    );
  }

  get visibleUsuarios(): Usuario[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredUsuarios.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsuarios.length / this.pageSize));
  }

  async load(): Promise<void> {
    try {
      this.usuarios = await firstValueFrom(this.api.listarUsuarios());
      this.page = 1;
      this.flash('Usuarios cargados.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  async save(): Promise<void> {
    try {
      await firstValueFrom(this.api.guardarUsuario(this.form, this.form.id));
      this.reset();
      await this.load();
      this.flash('Usuario guardado correctamente.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  edit(usuario: Usuario): void {
    this.form = {
      id: usuario.id,
      username: usuario.username,
      password: '',
      nombreCompleto: usuario.nombreCompleto,
      dni: usuario.dni,
      ruc: usuario.ruc,
      email: usuario.email ?? '',
      telefono: usuario.telefono ?? '',
      direccion: usuario.direccion ?? '',
      rol: usuario.rol
    };
  }

  async remove(id: number): Promise<void> {
    if (!confirm('Se desactivara este usuario. Deseas continuar?')) return;

    try {
      await firstValueFrom(this.api.desactivarUsuario(id));
      await this.load();
      this.flash('Usuario desactivado.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  reset(): void {
    this.form = this.emptyForm();
  }

  rolLabel(rol: number): string {
    return rol === 1 ? 'Administrador' : 'Operador';
  }

  prevPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  private emptyForm(): UsuarioForm {
    return { username: '', password: '', nombreCompleto: '', dni: '', ruc: '', email: '', telefono: '', direccion: '', rol: null };
  }

  private flash(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
  }
}
