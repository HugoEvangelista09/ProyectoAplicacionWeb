import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Deuda, MotivoCobro, Pago, Puesto, Socio, Usuario, UsuarioForm } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  listarSocios(): Observable<Socio[]> {
    return this.http.get<Socio[]>('/api/socios');
  }

  guardarSocio(payload: Partial<Socio>, id?: number | null): Observable<Socio> {
    return id
      ? this.http.put<Socio>(`/api/socios/${id}`, payload)
      : this.http.post<Socio>('/api/socios', payload);
  }

  desactivarSocio(id: number): Observable<void> {
    return this.http.delete<void>(`/api/socios/${id}`);
  }

  listarPuestos(): Observable<Puesto[]> {
    return this.http.get<Puesto[]>('/api/puestos');
  }

  guardarPuesto(payload: { categoria: number; descripcion?: string; socioId?: number | null }, id?: number | null): Observable<Puesto> {
    return id
      ? this.http.put<Puesto>(`/api/puestos/${id}`, payload)
      : this.http.post<Puesto>('/api/puestos', payload);
  }

  desactivarPuesto(id: number): Observable<void> {
    return this.http.delete<void>(`/api/puestos/${id}`);
  }

  listarMotivos(): Observable<MotivoCobro[]> {
    return this.http.get<MotivoCobro[]>('/api/motivos-cobro?soloActivos=false');
  }

  guardarMotivo(payload: { nombre: string; descripcion?: string }, id?: number | null): Observable<MotivoCobro> {
    return id
      ? this.http.put<MotivoCobro>(`/api/motivos-cobro/${id}`, payload)
      : this.http.post<MotivoCobro>('/api/motivos-cobro', payload);
  }

  desactivarMotivo(id: number): Observable<void> {
    return this.http.delete<void>(`/api/motivos-cobro/${id}`);
  }

  listarDeudas(socioId?: number | null): Observable<Deuda[]> {
    const params = typeof socioId === 'number' ? new HttpParams().set('socioId', socioId) : undefined;
    return this.http.get<Deuda[]>('/api/deudas', { params });
  }

  crearDeuda(payload: unknown): Observable<Deuda> {
    return this.http.post<Deuda>('/api/deudas', payload);
  }

  listarPagos(socioId?: number | null): Observable<Pago[]> {
    const params = typeof socioId === 'number' ? new HttpParams().set('socioId', socioId) : undefined;
    return this.http.get<Pago[]>('/api/pagos', { params });
  }

  crearPago(payload: unknown): Observable<Pago> {
    return this.http.post<Pago>('/api/pagos', payload);
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>('/api/usuarios');
  }

  guardarUsuario(payload: Partial<UsuarioForm>, id?: number | null): Observable<Usuario> {
    return id
      ? this.http.put<Usuario>(`/api/usuarios/${id}`, payload)
      : this.http.post<Usuario>('/api/usuarios', payload);
  }

  desactivarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`/api/usuarios/${id}`);
  }

  reporteCaja(fecha: string): Observable<unknown> {
    return this.http.get(`/api/reportes/caja?fecha=${fecha}`);
  }

  reporteCajaRango(desde: string, hasta: string): Observable<unknown> {
    return this.http.get(`/api/reportes/caja/rango?desde=${desde}&hasta=${hasta}`);
  }

  reporteDeudaPorSocio(): Observable<unknown> {
    return this.http.get('/api/reportes/deudas-por-socio');
  }
}
