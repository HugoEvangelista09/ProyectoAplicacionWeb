import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
        <label>Numero<input [(ngModel)]="form.numero" name="numero" required /></label>
        <label>Descripcion<input [(ngModel)]="form.descripcion" name="descripcion" /></label>
        <label>
          Socio asignado
          <select [(ngModel)]="form.socioId" name="socioId">
            <option [ngValue]="null">Pertenece a la asociacion</option>
            <option *ngFor="let socio of sociosActivos" [ngValue]="socio.id">{{ fullName(socio) }}</option>
          </select>
        </label>
        <div class="actions">
          <button type="submit">{{ form.id ? 'Actualizar puesto' : 'Guardar puesto' }}</button>
          <button type="button" class="secondary-btn" (click)="reset()">Limpiar</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Numero</th>
              <th>Descripcion</th>
              <th>Socio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let puesto of puestos">
              <td>{{ puesto.id }}</td>
              <td>{{ puesto.numero }}</td>
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
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class PuestosPageComponent implements OnInit {
  puestos: Puesto[] = [];
  socios: Socio[] = [];
  form: { id?: number; numero: string; descripcion: string; socioId: number | null } = this.emptyForm();
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private readonly api: ApiService) {}

  get sociosActivos(): Socio[] {
    return this.socios.filter((item) => item.activo);
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    try {
      const [socios, puestos] = await Promise.all([
        firstValueFrom(this.api.listarSocios()),
        firstValueFrom(this.api.listarPuestos())
      ]);

      this.socios = socios;
      this.puestos = puestos;
      this.flash('Puestos cargados.', 'success');
    } catch (error) {
      this.flash(this.errorMessage(error), 'error');
    }
  }

  async save(): Promise<void> {
    try {
      await firstValueFrom(this.api.guardarPuesto({
        numero: this.form.numero,
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
      numero: puesto.numero,
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

  private emptyForm(): { id?: number; numero: string; descripcion: string; socioId: number | null } {
    return { numero: '', descripcion: '', socioId: null };
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
  }
}
