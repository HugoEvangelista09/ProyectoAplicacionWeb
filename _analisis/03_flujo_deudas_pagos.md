# Flujo de Deudas y Pagos

## Máquina de estados

```
DeudaItem:   PENDIENTE ──────────────────► PAGADO
                                   (al registrar un Pago)

Deuda:       PENDIENTE ──────────────────► PAGADA
                          (cuando TODOS sus ítems están PAGADO)
                          (vuelve a PENDIENTE si se agregan ítems nuevos)
```

---

## Flujo 1: Crear una deuda individual

1. El administrador va a `deudas.html`
2. Selecciona un socio del dropdown
3. Agrega uno o más ítems: cada ítem tiene **MotivoCobro + Monto + Observación opcional**
4. Los ítems se acumulan en el buffer `deudaItemBuffer[]` del frontend
5. Al enviar el formulario → `POST /api/deudas` con payload:
   ```json
   {
     "socioId": 3,
     "descripcion": "Cobros marzo 2025",
     "items": [
       { "motivoCobroId": 1, "monto": 50.00, "observacion": "" },
       { "motivoCobroId": 2, "monto": 20.00, "observacion": "mantenimiento" }
     ]
   }
   ```
6. El backend crea la `Deuda` + sus `DeudaItem` todos en estado `PENDIENTE`

---

## Flujo 2: Carga masiva de deudas

- `POST /api/deudas/masivo` → mismos ítems para **múltiples socios a la vez**
- Payload incluye `socioIds: [1, 2, 3, ...]` en lugar de un solo `socioId`
- El backend crea una `Deuda` independiente por cada socio

---

## Flujo 3: Agregar ítems a una deuda existente

- `POST /api/deudas/{id}/items` → lista de `DeudaItemRequestDTO`
- El backend agrega los nuevos ítems como PENDIENTE y fuerza el estado de la deuda a PENDIENTE (aunque estuviera PAGADA)
- En el frontend se abre con `openAddItemsModal(deudaId)` usando SweetAlert2

---

## Flujo 4: Registrar un pago

1. El administrador va a `pagos.html`
2. Selecciona el socio → el sistema carga todos los ítems PENDIENTE de ese socio
3. El usuario marca los ítems que quiere pagar en esa transacción
4. `POST /api/pagos` con payload:
   ```json
   {
     "socioId": 3,
     "deudaItemIds": [5, 6],
     "observacion": "pago en efectivo"
   }
   ```
5. **En el backend (`PagoService.registrarPago`):**
   - Verifica que todos los ítem IDs existan y estén en estado PENDIENTE
   - Calcula el `montoTotal` sumando los montos de los ítems
   - Marca cada ítem → PAGADO
   - Para cada `Deuda` afectada, llama a `recalcularEstado()`:
     - Si todos sus ítems son PAGADO → Deuda = PAGADA
   - Crea el registro `Pago` con la lista de ítems y lo guarda
6. La tabla `pago_items` registra la relación Pago ↔ DeudaItem

---

## Ejemplo concreto completo

```
Socio: Juan Pérez (id=3)

DEUDA #5 (PENDIENTE)
├── DeudaItem #10: Cuota enero  S/50  → PENDIENTE
├── DeudaItem #11: Mantenimiento S/20 → PENDIENTE
└── DeudaItem #12: Cuota febrero S/50 → PENDIENTE

── Juan paga ítems #10 y #11 ──

PAGO #1:
  socio: Juan Pérez
  montoTotal: S/70
  itemsPagados: [#10, #11]

pago_items: (1,10), (1,11)

DeudaItem #10 → PAGADO
DeudaItem #11 → PAGADO
DeudaItem #12 → PENDIENTE (no se pagó)

DEUDA #5 → sigue PENDIENTE (el ítem #12 aún está sin pagar)

── Juan paga el ítem #12 ──

PAGO #2:
  montoTotal: S/50
  itemsPagados: [#12]

DeudaItem #12 → PAGADO
DEUDA #5 → PAGADA (todos sus ítems están PAGADO)
```

---

## Reglas de negocio importantes

1. Un ítem solo puede pagarse **una vez** — el sistema filtra por `estado = PENDIENTE` al buscar ítems para pagar.
2. La deuda **no se puede pagar parcialmente a nivel de ítem** — si el usuario selecciona un ítem, lo paga completo.
3. El `montoTotal` del pago se calcula en el backend (no se confía en el frontend).
4. Un pago puede cubrir ítems de **distintas deudas** del mismo socio.
5. Al agregar ítems nuevos a una deuda PAGADA, esta vuelve automáticamente a PENDIENTE.
