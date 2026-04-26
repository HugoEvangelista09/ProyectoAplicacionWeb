# Modelos y Base de Datos

## Diagrama de relaciones

```
Socio ──────────────────────────────────────────────────────────┐
  │                                                             │
  │ 1:N                                                         │ 1:N
  ▼                                                             ▼
Puesto                                                        Pago
                                                               │
Socio ──1:N──► Deuda ──1:N──► DeudaItem ◄──M:N──── pago_items─┘
                                  │
                                  │ N:1
                                  ▼
                             MotivoCobro

Usuario  (tabla separada, solo para admins/operadores)
```

---

## Entidad: `Socio` → tabla `socios`

| Campo | Tipo | Notas |
|---|---|---|
| id | Long (PK) | Auto-generado |
| nombre | String | |
| apellido | String | |
| dni | String | Único |
| telefono | String | |
| direccion | String | |
| username | String | Único, para login como socio |
| password | String | Plano (sin hash en esta versión) |
| activo | boolean | Baja lógica |

**Relaciones:**
- Un socio tiene muchos `Puesto` (1:N)
- Un socio tiene muchas `Deuda` (1:N)
- Un socio tiene muchos `Pago` (1:N)

---

## Entidad: `Puesto` → tabla `puestos`

| Campo | Tipo | Notas |
|---|---|---|
| id | Long (PK) | |
| numero | String | Auto-generado: prefijo + secuencia (ej. `NAT-001`) |
| categoria | Integer | 1=Natural, 2=Procesado, 3=Servicios |
| descripcion | String | |
| activo | boolean | |
| socio | Socio (FK) | Nullable — null = pertenece a la asociación |

**Lógica del número:** `getPrefijo(categoria)` devuelve `NAT`, `PRO` o `SER`. El número se genera automáticamente al crear.

---

## Entidad: `MotivoCobro` → tabla `motivos_cobro`

| Campo | Tipo | Notas |
|---|---|---|
| id | Long (PK) | |
| nombre | String | Único |
| descripcion | String | |
| activo | boolean | |

Ejemplos: "Cuota mensual", "Mantenimiento", "Multa por tardanza".

---

## Entidad: `Deuda` → tabla `deudas`

| Campo | Tipo | Notas |
|---|---|---|
| id | Long (PK) | |
| socio | Socio (FK) | NOT NULL |
| fecha | LocalDate | Fecha de emisión |
| descripcion | String | |
| estado | EstadoDeuda | enum: `PENDIENTE` \| `PAGADA` |
| items | List\<DeudaItem\> | Cascada ALL, orphanRemoval=true |

**Estado se recalcula automáticamente** en `DeudaService.recalcularEstado()`:
- Si TODOS los ítems están PAGADO → Deuda = PAGADA
- Si al menos uno está PENDIENTE → Deuda = PENDIENTE

Un socio **puede tener múltiples deudas** activas al mismo tiempo.

---

## Entidad: `DeudaItem` → tabla `deuda_items`

| Campo | Tipo | Notas |
|---|---|---|
| id | Long (PK) | |
| deuda | Deuda (FK) | NOT NULL |
| motivoCobro | MotivoCobro (FK) | NOT NULL |
| monto | BigDecimal | |
| observacion | String | |
| estado | EstadoItem | enum: `PENDIENTE` \| `PAGADO` |

**Un ítem representa una línea de cobro dentro de una deuda.**
Ejemplo: Deuda #5 puede tener ítems: "Cuota enero S/50" + "Mantenimiento S/20".

---

## Entidad: `Pago` → tabla `pagos`

| Campo | Tipo | Notas |
|---|---|---|
| id | Long (PK) | |
| socio | Socio (FK) | NOT NULL |
| fecha | LocalDate | Fecha del pago |
| montoTotal | BigDecimal | Suma de montos de los ítems pagados |
| observacion | String | |
| itemsPagados | List\<DeudaItem\> | @ManyToMany vía tabla `pago_items` |

**Tabla intermedia `pago_items`:**
```
pago_id  |  deuda_item_id
---------+-----------------
1        |  5
1        |  6     ← el pago #1 cubrió 2 ítems
2        |  7
```

---

## Entidad: `Usuario` → tabla `usuarios`

| Campo | Tipo | Notas |
|---|---|---|
| id | Long (PK) | |
| username | String | Único |
| password | String | |
| nombreCompleto | String | |
| dni | String | Único |
| ruc | String | Único |
| email | String | |
| rol | String | `ADMIN` \| `OPERADOR` |
| activo | boolean | |
| flg | boolean | Eliminación lógica total |

**Diferencia con Socio:** El `Usuario` es personal interno de la asociación (administrador, tesorero). El `Socio` es el comerciante afiliado.

---

## Enum: `EstadoItem` → `model/EstadoItem.java`

```java
public enum EstadoItem {
    PENDIENTE,
    PAGADO
}
```

Usado en: `DeudaItem` (campo), `DeudaService` (lógica), `PagoService` (transición), `DeudaItemRepository` (queries), `Deuda` (cálculo), `DataInitializer` (datos de prueba).

---

## Enum: `EstadoDeuda` → dentro de `Deuda.java`

```java
public enum EstadoDeuda {
    PENDIENTE,
    PAGADA
}
```

---

## Queries JPQL de búsqueda (en cada Repository)

Todos los repositorios tienen un método `buscar(@Param("term") String term)` que hace búsqueda LIKE case-insensitive. Patrón usado:

```java
LOWER(campo) LIKE LOWER(CONCAT('%',:term,'%'))
```

`DeudaRepository` y `PagoRepository` tienen además `buscarPorSocio(socioId, term)` para el portal del socio.
