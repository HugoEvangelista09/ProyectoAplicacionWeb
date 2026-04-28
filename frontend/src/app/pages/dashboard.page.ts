import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Deuda, MotivoCobro, Pago, Puesto, Socio } from '../shared/models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css'
})
export class DashboardPageComponent implements OnInit {
  socios: Socio[] = [];
  puestos: Puesto[] = [];
  motivos: MotivoCobro[] = [];
  deudas: Deuda[] = [];
  pagos: Pago[] = [];
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get motivosActivos(): number {
    return this.motivos.filter((item) => item.activo).length;
  }

  get deudasPendientes(): number {
    return this.deudas.filter((item) => item.estado !== 'PAGADA').length;
  }

  get pagosRecientes(): Pago[] {
    return this.pagos.slice(0, 5);
  }

  get deudasRecientes(): Deuda[] {
    return this.deudas.slice(0, 5);
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    const results = await Promise.allSettled([
      firstValueFrom(this.api.listarSocios()),
      firstValueFrom(this.api.listarPuestos()),
      firstValueFrom(this.api.listarMotivos()),
      firstValueFrom(this.api.listarDeudas()),
      firstValueFrom(this.api.listarPagos())
    ]);

    this.socios = this.fulfilledValue(results[0]);
    this.puestos = this.fulfilledValue(results[1]);
    this.motivos = this.fulfilledValue(results[2]);
    this.deudas = this.fulfilledValue(results[3]);
    this.pagos = this.fulfilledValue(results[4]);
    this.cdr.detectChanges();

    const rejected = results.filter((result) => result.status === 'rejected');
    if (rejected.length) {
      const firstError = rejected[0] as PromiseRejectedResult;
      this.flash(`Se cargaron datos parciales. ${this.errorMessage(firstError.reason)}`, 'error');
      this.cdr.detectChanges();
      return;
    }

    this.flash('Resumen actualizado.', 'success');
    this.cdr.detectChanges();
  }

  money(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value || 0));
  }

  private flash(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private fulfilledValue<T>(result: PromiseSettledResult<T>): T | [] {
    return result.status === 'fulfilled' ? result.value : [];
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.message || 'No se pudo cargar el dashboard.';
    }
    return error instanceof Error ? error.message : 'No se pudo cargar el dashboard.';
  }
}
