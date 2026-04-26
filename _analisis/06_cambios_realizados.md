# Historial de Cambios Realizados

Todos estos cambios están implementados en la rama `dany-1`.
Última actualización: 2026-04-26.

---

## Cambio 1 — Documento de flujo de deudas/pagos

**Archivo creado:** `FLUJO_DEUDAS_PAGOS.md` (en la raíz del proyecto)
**Contenido:** Explicación del flujo completo de deudas, ítems y pagos, relaciones entre tablas.

---

## Cambio 2 — Múltiples ítems al crear una deuda

**Problema:** El formulario de deudas solo permitía seleccionar un motivo y un monto.
**Solución:** Se reemplazó el campo único por un buffer de ítems acumulable.

### Backend
- `DeudaController.java` — Agregado endpoint:
  ```
  POST /api/deudas/{id}/items  →  agregarItems(id, List<DeudaItemRequestDTO>)
  ```
- `DeudaService.java` — Agregado método `agregarItems()`:
  - Crea nuevos DeudaItem en estado PENDIENTE
  - Fuerza el estado de la Deuda a PENDIENTE (aunque estuviera PAGADA)

### Frontend
- `app.js` — Agregadas funciones:
  - `let deudaItemBuffer = []` — buffer de ítems del formulario
  - `addDeudaItem()` — agrega al buffer y renderiza preview
  - `removeDeudaItem(index)` — elimina del buffer
  - `renderDeudaItemsPreview()` — muestra la lista de ítems acumulados
  - `submitDeudaForm()` — refactorizado para usar el buffer en lugar de campos únicos
  - `openAddItemsModal(deudaId)` — SweetAlert2 para agregar ítems a deuda existente
- `deudas.html` — Reemplazado form simple por fieldset con sub-form dinámico
- `window.removeDeudaItem` y `window.openAddItemsModal` exportados

---

## Cambio 3 — Paginación en todas las vistas

**Problema:** Las tablas mostraban todos los registros sin límite.
**Solución:** Paginación de 10 registros, ordenados por ID descendente (más reciente primero).

### Frontend — `app.js`
- Constante `PAGE_SIZE = 10`
- Objeto `pageState` con página actual por sección
- Función `paginate(data, key)` — ordena y recorta
- Función `renderPaginator(containerId, total, key)` — paginador con elipsis inteligente
- Función `goPage(key, page)` — cambia página y re-renderiza
- Todos los `render*()` actualizados para usar `paginate()` + `renderPaginator()`
- `loadSocioPuestos/Deudas/Pagos` refactorizados para guardar en `state.*` y tener `render*()` separados

### CSS — `styles.css`
- Agregadas clases: `.paginator`, `.paginator button`, `.paginator button:disabled`, `.paginator-ellipsis`, `.paginator-info`

---

## Cambio 4 — Paginador al mismo nivel que el buscador

**Problema:** El paginador aparecía debajo de la tabla.
**Solución:** Moverlo a la misma línea que el input de búsqueda.

### HTML — los 9 archivos afectados:
`socios.html`, `puestos.html`, `motivos.html`, `deudas.html`, `pagos.html`, `usuarios.html`, `socio-puestos.html`, `socio-deudas.html`, `socio-pagos.html`

Estructura en cada uno:
```html
<div class="section-title">
    <h2>Título</h2>
    <div class="section-title-right">
        <div id="*Page"></div>          <!-- paginador -->
        <div class="search-bar">
            <input type="search" id="search*" placeholder="...">
        </div>
    </div>
</div>
```

### CSS — `styles.css`
- Agregada clase `.section-title-right { display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap; }`

---

## Cambio 5 — Búsqueda en base de datos con botón "Buscar"

**Problema:** La búsqueda filtraba el DOM del cliente (solo los 10 registros visibles).
**Solución:** Búsqueda real en BD via API, disparada por botón o tecla Enter.

### Backend — Repositories (6 archivos)
Cada repository tiene ahora método `buscar(@Param("term") String term)` con JPQL LIKE:

| Repository | Campos que busca |
|---|---|
| SocioRepository | nombre, apellido, dni |
| PuestoRepository | numero, descripcion, socio.nombre, socio.apellido |
| MotivoCobroRepository | nombre, descripcion |
| DeudaRepository | descripcion, socio.nombre, socio.apellido |
| PagoRepository | socio.nombre, socio.apellido, observacion |
| UsuarioRepository | username, nombreCompleto, dni, ruc, email |

`DeudaRepository` y `PagoRepository` tienen además `buscarPorSocio(socioId, term)`.

### Backend — Services (6 archivos)
Cada service tiene método `buscar(String term)`.
`PagoService` tiene además `listarTodos()` (corrige bug donde null-socioId hacía `findBySocioId(null)`).
`DeudaService` y `PagoService` tienen `buscarPorSocio(socioId, term)`.

### Backend — Controllers (6 archivos)
Todos los GET tienen nuevo parámetro opcional `?buscar=term`:
- Si `buscar` viene con valor → llama al método `buscar()` del service
- Si está vacío → comportamiento original

`DeudaController` y `PagoController` combinan `socioId + buscar` para el portal del socio.

### Frontend — `app.js`
- Reemplazado `wireSearch(inputId, tbodyId)` (filtrado DOM) por `wireSearchBtn(inputId, loadFn)`:
  - Inserta un botón `<button class="btn-buscar">Buscar</button>` después del input
  - Al click o Enter → llama a `loadFn(term)`
- Todos los `wire*Events()` actualizados para usar `wireSearchBtn`
- Todos los `load*()` actualizados con parámetro `buscar = ""` y URL dinámica
- Portal: `loadSocioPuestos/Deudas/Pagos` combinan `socioId + buscar`
- Al buscar, `pageState[key] = 1` se resetea a la primera página

### CSS — `styles.css`
- `.search-bar` ahora es `display: flex` con `gap: 0.4rem`
- Nueva clase `.btn-buscar` con color naranja del tema (`var(--accent)`)

---

## Archivos modificados — resumen total

### Java (Backend)
```
repository/SocioRepository.java         + buscar()
repository/PuestoRepository.java        + buscar()
repository/MotivoCobroRepository.java   + buscar()
repository/DeudaRepository.java         + buscar(), buscarPorSocio()
repository/PagoRepository.java          + buscar(), buscarPorSocio()
repository/UsuarioRepository.java       + buscar()

service/SocioService.java               + buscar()
service/PuestoService.java              + buscar()
service/MotivoCobroService.java         + buscar()
service/DeudaService.java               + buscar(), buscarPorSocio(), agregarItems()
service/PagoService.java                + listarTodos(), buscar(), buscarPorSocio()
service/UsuarioService.java             + buscar()

controller/SocioController.java         + param buscar
controller/PuestoController.java        + param buscar
controller/MotivoCobroController.java   + param buscar
controller/DeudaController.java         + param buscar, endpoint POST /{id}/items
controller/PagoController.java          + param buscar, refactor listar()
controller/UsuarioController.java       + param buscar
```

### Frontend
```
static/app.js          wireSearch→wireSearchBtn, todos los load*(), paginación, buffer ítems
static/styles.css      .section-title-right, .paginator*, .btn-buscar, .search-bar flex
static/socios.html     sección-title-right con paginador
static/puestos.html    ídem
static/motivos.html    ídem
static/deudas.html     ídem + fieldset multi-ítems
static/pagos.html      ídem
static/usuarios.html   ídem
static/socio-puestos.html  ídem
static/socio-deudas.html   ídem
static/socio-pagos.html    ídem
```
