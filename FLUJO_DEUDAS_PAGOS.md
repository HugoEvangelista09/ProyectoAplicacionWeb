# Flujo de Deudas y Pagos

Sistema de gestión de deudas y pagos para la Asociación de Comerciantes.  
Backend: Spring Boot 3.2 / Java 21 / JPA + MySQL. Frontend: Angular standalone.

---

## Tablas involucradas

| Tabla | Descripción |
|---|---|
| `socios` | Miembro de la asociación. Puede tener deudas y realizar pagos. |
| `motivos_cobro` | Catálogo de conceptos de cobro (Cuota, Multa, Estacionamiento, etc.). |
| `deudas` | Cabecera de una deuda asignada a un socio. |
| `deuda_items` | Líneas de detalle de una deuda. Cada ítem tiene su propio monto y estado. |
| `pagos` | Registro de un acto de pago realizado por un socio. |
| `pago_items` | Tabla de unión (M:N). Relaciona cada pago con los ítems que canceló. |

---

## Relaciones entre tablas

```
socios (1) ──────────────────────────────── (N) deudas
socios (1) ──────────────────────────────── (N) pagos
deudas (1) ──────────────────────────────── (N) deuda_items
motivos_cobro (1) ───────────────────────── (N) deuda_items
pagos (M) ───── pago_items (join table) ─── (N) deuda_items
```

### Columnas clave por tabla

**`socios`**
```
id (PK) | nombre | apellido | dni (UNIQUE) | email | activo
```

**`motivos_cobro`**
```
id (PK) | nombre (UNIQUE) | descripcion | activo
```

**`deudas`**
```
id (PK) | socio_id (FK→socios) | fecha | descripcion | estado (PENDIENTE | PAGADA)
```

**`deuda_items`**
```
id (PK) | deuda_id (FK→deudas) | motivo_cobro_id (FK→motivos_cobro)
        | monto (DECIMAL 10,2) | observacion | estado (PENDIENTE | PAGADO)
```

**`pagos`**
```
id (PK) | socio_id (FK→socios) | fecha | monto_total (DECIMAL 10,2) | observacion
```

**`pago_items`** *(join table)*
```
pago_id (FK→pagos) | deuda_item_id (FK→deuda_items)
```

---

## Estados y sus transiciones

### Estado de `deuda_items`

```
PENDIENTE ──── (al registrar un pago que incluye este ítem) ───→ PAGADO
```

Un ítem nunca vuelve a PENDIENTE una vez marcado como PAGADO.

### Estado de `deudas`

El estado de la deuda se recalcula automáticamente cada vez que se paga uno de sus ítems:

```
PENDIENTE ──── (cuando TODOS sus ítems pasan a PAGADO) ────→ PAGADA
PAGADA    ──── (no puede volver a PENDIENTE)
```

Lógica de recálculo en `DeudaService.recalcularEstado()`:
```
si (cantidad de ítems PAGADOS) == (total de ítems de la deuda)
    → deuda.estado = PAGADA
si no
    → deuda.estado = PENDIENTE
```

---

## Flujo 1: Creación de una deuda

**Endpoint:** `POST /api/deudas`  
**Payload:**
```json
{
  "socioId": 5,
  "descripcion": "Cuota mensual abril",
  "items": [
    { "motivoCobroId": 1, "monto": 100.00 },
    { "motivoCobroId": 3, "monto": 50.00, "observacion": "Multa por atraso" }
  ]
}
```

**Pasos internos (`DeudaService.crear`):**

```
1. Validar que el socio exista (socioId obligatorio)
2. Validar que llegue al menos 1 ítem
3. Crear registro en deudas:
     fecha = hoy, estado = PENDIENTE
4. Para cada ítem del payload:
     - Validar que el motivoCobro exista y esté activo
     - Crear registro en deuda_items:
         estado = PENDIENTE
5. Guardar todo en una sola transacción
6. Devolver DeudaResponseDTO con el total pendiente calculado
```

**Resultado en base de datos:**

```
deudas:
  id=10 | socio_id=5 | fecha=2026-04-26 | descripcion="Cuota mensual abril" | estado=PENDIENTE

deuda_items:
  id=101 | deuda_id=10 | motivo_cobro_id=1 | monto=100.00 | estado=PENDIENTE
  id=102 | deuda_id=10 | motivo_cobro_id=3 | monto=50.00  | estado=PENDIENTE
```

### Variante: Creación masiva

**Endpoint:** `POST /api/deudas/masivo`

Permite asignar la misma deuda (misma descripción e ítems) a múltiples socios a la vez.

```json
{
  "socioIds": [5, 6, 7],
  "descripcion": "Cuota mensual abril",
  "items": [{ "motivoCobroId": 1, "monto": 100.00 }]
}
```

Internamente ejecuta `crear()` una vez por cada socio de la lista dentro de la misma transacción.

---

## Flujo 2: Registro de un pago

**Endpoint:** `POST /api/pagos`  
**Payload:**
```json
{
  "socioId": 5,
  "deudaItemIds": [101, 102],
  "observacion": "Pago en efectivo"
}
```

**Pasos internos (`PagoService.registrarPago`) — todo dentro de `@Transactional`:**

```
PASO 1 — Obtener ítems
  SELECT * FROM deuda_items
  WHERE id IN (101, 102) AND estado = 'PENDIENTE'

  Si la cantidad devuelta ≠ cantidad enviada:
    → ERROR: "Algunos ítems no existen o ya fueron pagados"

PASO 2 — Calcular total del pago
  monto_total = SUM(monto de cada ítem obtenido)
  Ejemplo: 100.00 + 50.00 = 150.00

PASO 3 — Marcar ítems como PAGADOS
  UPDATE deuda_items SET estado = 'PAGADO'
  WHERE id IN (101, 102)

PASO 4 — Recalcular estado de las deudas afectadas
  Para cada deuda única referenciada por los ítems:
    contar ítems PAGADOS vs total de ítems
    si todos PAGADOS → UPDATE deudas SET estado = 'PAGADA' WHERE id = X
    si no            → deuda sigue PENDIENTE

PASO 5 — Guardar el registro de pago
  INSERT INTO pagos (socio_id, fecha, monto_total, observacion)
    VALUES (5, 2026-04-26, 150.00, 'Pago en efectivo')

  INSERT INTO pago_items (pago_id, deuda_item_id)
    VALUES (50, 101), (50, 102)
```

**Resultado en base de datos:**

```
deuda_items (actualizados):
  id=101 | estado=PAGADO
  id=102 | estado=PAGADO

deudas (recalculado, si todos sus ítems quedaron PAGADOS):
  id=10 | estado=PAGADA

pagos (nuevo registro):
  id=50 | socio_id=5 | fecha=2026-04-26 | monto_total=150.00

pago_items (nuevos registros):
  pago_id=50 | deuda_item_id=101
  pago_id=50 | deuda_item_id=102
```

---

## Cálculo del total pendiente de una deuda

El total pendiente no se almacena; se calcula en tiempo real a partir de los ítems:

```java
// Deuda.getTotalDeuda()
items.stream()
     .filter(i -> i.getEstado() == EstadoItem.PENDIENTE)  // solo los no pagados
     .map(DeudaItem::getMonto)
     .reduce(BigDecimal.ZERO, BigDecimal::add);
```

**Ejemplo con pago parcial:**

```
Deuda #10 — "Cuota mensual abril"
  Ítem 101: Cuota  = $100.00  → PAGADO   ← NO se suma
  Ítem 102: Multa  = $50.00   → PENDIENTE ← SÍ se suma
  Ítem 103: Otros  = $25.00   → PENDIENTE ← SÍ se suma

getTotalDeuda() = $75.00
estado deuda    = PENDIENTE  (no todos los ítems están pagados)
```

---

## Endpoints disponibles

### Deudas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/deudas` | Listar todas las deudas |
| `GET` | `/api/deudas?socioId=5` | Deudas de un socio |
| `GET` | `/api/deudas?socioId=5&soloPendientes=true` | Solo deudas pendientes de un socio |
| `GET` | `/api/deudas/{id}` | Detalle de una deuda específica |
| `POST` | `/api/deudas` | Crear deuda individual |
| `POST` | `/api/deudas/masivo` | Crear la misma deuda para varios socios |

### Pagos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/pagos` | Listar todos los pagos |
| `GET` | `/api/pagos?socioId=5` | Pagos realizados por un socio |
| `GET` | `/api/pagos/{id}` | Detalle de un pago específico |
| `POST` | `/api/pagos` | Registrar un nuevo pago |

### Reportes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/reportes/caja?fecha=2026-04-26` | Recaudación del día |
| `GET` | `/api/reportes/caja/rango?desde=X&hasta=Y` | Recaudación por rango de fechas |
| `GET` | `/api/reportes/deudas-por-socio` | Deuda pendiente agrupada por socio |

---

## Diagrama de secuencia — Pago completo

```
Frontend          PagoController      PagoService         DeudaService         BD
   │                    │                   │                    │               │
   │─ POST /api/pagos ─→│                   │                   │               │
   │                    │─ registrarPago() ─→│                   │               │
   │                    │                   │─ findByIdInAndEstado(PENDIENTE) ──→│
   │                    │                   │←─────────── List<DeudaItem> ───────│
   │                    │                   │─ saveAll(estado=PAGADO) ──────────→│
   │                    │                   │─ recalcularEstado(deuda) ─→│       │
   │                    │                   │                   │─ save(deuda) ─→│
   │                    │                   │─ save(pago + pago_items) ─────────→│
   │                    │←── PagoResponseDTO│                   │               │
   │←── 201 Created ────│                   │                   │               │
```

---

## Reglas de negocio

1. **Un pago cancela ítems, no deudas completas.** El operador elige qué ítems pagar; puede ser un pago parcial.
2. **Los ítems solo se pueden pagar si están PENDIENTES.** Si algún ID enviado ya está PAGADO, el pago completo se rechaza.
3. **El estado de la deuda se recalcula automáticamente** tras cada pago; nunca se actualiza manualmente.
4. **El monto total del pago** se calcula en el backend sumando los montos de los ítems recibidos; el cliente no envía el total.
5. **Todo el proceso de pago es atómico** (`@Transactional`): si falla cualquier paso, ningún cambio persiste en la base de datos.
6. **Los registros de pago son inmutables.** No existe endpoint de edición ni eliminación de pagos.
