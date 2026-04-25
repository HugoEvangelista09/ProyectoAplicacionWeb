export interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface Puesto {
  id: number;
  numero: string;
  descripcion?: string;
  activo: boolean;
  socioId?: number | null;
  socioNombre?: string;
  esDeAsociacion: boolean;
}

export interface MotivoCobro {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface DeudaItem {
  id: number;
  motivoCobroId: number;
  motivoCobroNombre: string;
  monto: number;
  observacion?: string;
  estado: 'PENDIENTE' | 'PAGADO';
}

export interface Deuda {
  id: number;
  socioId: number;
  socioNombre?: string;
  fecha?: string;
  descripcion?: string;
  estado: 'PENDIENTE' | 'PAGADA_PARCIAL' | 'PAGADA';
  totalPendiente: number;
  items: DeudaItem[];
}

export interface Pago {
  id: number;
  socioId: number;
  socioNombre?: string;
  fecha?: string;
  montoTotal: number;
  observacion?: string;
  itemsPagados: DeudaItem[];
}
