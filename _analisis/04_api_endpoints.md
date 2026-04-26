# API Endpoints REST

Base URL: `http://localhost:8080/api`

Todos los endpoints requieren header `Authorization: Bearer <token>` excepto `/auth/**`.

---

## Autenticación — `/api/auth`

| Método | URL | Body | Respuesta |
|---|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` | `{ token, rol, socioId?, nombre }` |
| POST | `/api/auth/logout` | — | 200 OK |

---

## Socios — `/api/socios`

| Método | URL | Parámetros | Descripción |
|---|---|---|---|
| GET | `/api/socios` | `soloActivos=false`, `buscar=term` | Lista todos (o busca en BD) |
| GET | `/api/socios/{id}` | — | Obtiene un socio por ID |
| POST | `/api/socios` | body: `SocioRequestDTO` | Crea socio |
| PUT | `/api/socios/{id}` | body: `SocioRequestDTO` | Actualiza socio |
| DELETE | `/api/socios/{id}` | — | Baja lógica (activo=false) |

---

## Puestos — `/api/puestos`

| Método | URL | Parámetros | Descripción |
|---|---|---|---|
| GET | `/api/puestos` | `socioId=N`, `soloAsociacion=true`, `buscar=term` | Lista / filtra |
| GET | `/api/puestos/{id}` | — | Obtiene un puesto |
| POST | `/api/puestos` | body: `PuestoRequestDTO` | Crea puesto (número auto) |
| PUT | `/api/puestos/{id}` | body: `PuestoRequestDTO` | Actualiza puesto |
| DELETE | `/api/puestos/{id}` | — | Baja lógica |

---

## Motivos de cobro — `/api/motivos-cobro`

| Método | URL | Parámetros | Descripción |
|---|---|---|---|
| GET | `/api/motivos-cobro` | `soloActivos=true`, `buscar=term` | Lista motivos |
| POST | `/api/motivos-cobro` | body: `MotivoCobroRequestDTO` | Crea motivo |
| PUT | `/api/motivos-cobro/{id}` | body: `MotivoCobroRequestDTO` | Actualiza |
| DELETE | `/api/motivos-cobro/{id}` | — | Baja lógica |

---

## Deudas — `/api/deudas`

| Método | URL | Parámetros | Descripción |
|---|---|---|---|
| GET | `/api/deudas` | `socioId=N`, `soloPendientes=true`, `buscar=term` | Lista / filtra |
| GET | `/api/deudas/{id}` | — | Obtiene una deuda |
| POST | `/api/deudas` | body: `DeudaRequestDTO` | Crea deuda individual |
| POST | `/api/deudas/masivo` | body: `DeudaMasivaRequestDTO` | Carga masiva para N socios |
| POST | `/api/deudas/{id}/items` | body: `List<DeudaItemRequestDTO>` | Agrega ítems a deuda existente |

**Lógica del GET:**
- `buscar` presente → llama a `buscar()` o `buscarPorSocio()` según haya `socioId`
- `socioId + soloPendientes` → solo deudas PENDIENTE del socio
- Solo `socioId` → todas las deudas del socio
- Sin params → todas las deudas

---

## Pagos — `/api/pagos`

| Método | URL | Parámetros | Descripción |
|---|---|---|---|
| GET | `/api/pagos` | `socioId=N`, `buscar=term` | Lista pagos |
| GET | `/api/pagos/{id}` | — | Obtiene un pago |
| POST | `/api/pagos` | body: `PagoRequestDTO` | Registra un pago |

**`PagoRequestDTO`:**
```json
{
  "socioId": 3,
  "deudaItemIds": [10, 11],
  "observacion": "efectivo"
}
```

---

## Usuarios — `/api/usuarios`

| Método | URL | Parámetros | Descripción |
|---|---|---|---|
| GET | `/api/usuarios` | `soloActivos=false`, `buscar=term` | Lista usuarios |
| GET | `/api/usuarios/{id}` | — | Obtiene un usuario |
| POST | `/api/usuarios` | body: `UsuarioRequestDTO` | Crea usuario |
| PUT | `/api/usuarios/{id}` | body: `UsuarioRequestDTO` | Actualiza |
| DELETE | `/api/usuarios/{id}` | — | Baja lógica (activo=false) |

---

## Reportes — `/api/reportes`

| Método | URL | Parámetros | Descripción |
|---|---|---|---|
| GET | `/api/reportes/caja-diaria` | `fecha=YYYY-MM-DD` | Resumen de pagos del día |
| GET | `/api/reportes/caja-rango` | `desde=`, `hasta=` | Pagos en rango de fechas |
| GET | `/api/reportes/deuda-por-socio` | — | Deudas pendientes agrupadas por socio |

---

## Parámetro `buscar` — comportamiento general

Cuando se envía `?buscar=term`:
- El backend ignora otros filtros (como `soloActivos`)
- Hace búsqueda LIKE case-insensitive en los campos relevantes de cada entidad
- El frontend lo envía codificado: `encodeURIComponent(term)`
- Si el campo está vacío, el frontend recarga todos los registros (sin `buscar`)
