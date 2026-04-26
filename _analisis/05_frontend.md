# Frontend — app.js y páginas HTML

## Cómo funciona el frontend

- Todo el JS está en **un solo archivo**: `static/app.js`
- Cada página HTML tiene `<body data-page="socios">` (u otro nombre)
- Al cargar, `app.js` lee ese atributo y ejecuta el `wire*Events()` + `load*()` correspondiente
- No hay router — cada página es un HTML separado
- El estado se guarda en el objeto `state` (en memoria, se pierde al recargar)

---

## Objeto `state` — estado global en memoria

```javascript
const state = {
    socios:      [],   // List<SocioResponseDTO>
    puestos:     [],   // List<PuestoResponseDTO>
    motivos:     [],   // List<MotivoCobroResponseDTO>
    deudas:      [],   // List<DeudaResponseDTO>
    pagos:       [],   // List<PagoResponseDTO>
    usuarios:    [],   // List<UsuarioResponseDTO>
    socioPuestos: [],  // puestos del socio logueado (portal)
    socioDeudas:  [],  // deudas del socio logueado (portal)
    socioPagos:   [],  // pagos del socio logueado (portal)
};
```

---

## Paginación

```javascript
const PAGE_SIZE = 10;

const pageState = {
    socios: 1, puestos: 1, motivos: 1, deudas: 1, pagos: 1, usuarios: 1,
    socioPuestos: 1, socioDeudas: 1, socioPagos: 1,
};

function paginate(data, key) {
    // Ordena por id DESC (más reciente primero) y devuelve la página actual
    const sorted = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));
    const page   = pageState[key] || 1;
    return sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

function goPage(key, page) {
    pageState[key] = page;
    map[key]();   // vuelve a renderizar la sección correspondiente
}
```

`goPage` está exportado a `window.goPage` para poder llamarlo desde el HTML generado dinámicamente.

---

## Búsqueda en base de datos

```javascript
function wireSearchBtn(inputId, loadFn) {
    // Agrega un botón "Buscar" después del input
    // Al hacer clic (o Enter) llama a loadFn(term)
    // loadFn es: term => loadSocios(false, term)
}
```

Cada `load*` acepta `buscar = ""` como segundo parámetro:
```javascript
async function loadSocios(notify = true, buscar = "") {
    const url = buscar ? `/api/socios?buscar=${encodeURIComponent(buscar)}` : "/api/socios";
    state.socios = await apiFetch(url);
    pageState.socios = 1;   // resetea a página 1 al buscar
    renderSocios();
}
```

---

## Estructura de cada sección

Cada sección tiene un patrón idéntico:

| Función | Propósito |
|---|---|
| `wire*Events()` | Conecta botones, forms y search del HTML |
| `load*()` | Llama a la API, guarda en `state`, llama a `render*()` |
| `render*()` | Genera el HTML de las filas + llama a `renderPaginator()` |
| `submit*Form()` | POST o PUT según haya ID en el form |
| `edit*(id)` | Rellena el form con datos existentes |
| `delete*(id)` | Confirma con SweetAlert + DELETE a la API |

---

## Formulario de Deuda — buffer de ítems

```javascript
let deudaItemBuffer = [];  // ítems acumulados antes de enviar

function addDeudaItem() {
    // Lee motivoCobroId + monto + observacion del form
    // Agrega al buffer y llama renderDeudaItemsPreview()
}

function removeDeudaItem(index) {
    deudaItemBuffer.splice(index, 1);
    renderDeudaItemsPreview();
}

function submitDeudaForm(e) {
    // Usa deudaItemBuffer como el array "items" en el payload
    // POST /api/deudas con { socioId, descripcion, items: deudaItemBuffer }
}
```

---

## Modal para agregar ítems a deuda existente

```javascript
async function openAddItemsModal(deudaId) {
    // Abre un SweetAlert2 con select de motivo + input de monto
    // Al confirmar → POST /api/deudas/{deudaId}/items
    // Luego recarga loadDeudas(false)
}
```

---

## Funciones exportadas a window

Las siguientes funciones se llaman desde HTML dinámico (onclick en filas de tabla) y deben estar en `window`:

```javascript
window.editSocio         window.deleteSocio
window.editPuesto        window.deletePuesto
window.editMotivo        window.deleteMotivo
window.editUsuario       window.deleteUsuario
window.goPage
window.removeDeudaItem
window.openAddItemsModal
```

---

## Comunicación con la API

```javascript
async function apiFetch(url, options = {}) {
    // Agrega el header Authorization automáticamente desde localStorage
    // Si responde 401 → llama a logout()
    // Si no es OK → lanza Error con el mensaje del servidor
}
```

---

## Páginas y su `data-page`

| Archivo HTML | data-page | Funciones wire/load |
|---|---|---|
| dashboard.html | dashboard | wireDashboardEvents / loadDashboard |
| socios.html | socios | wireSociosEvents / loadSocios |
| puestos.html | puestos | wirePuestosEvents / loadPuestos |
| motivos.html | motivos | wireMotivosEvents / loadMotivos |
| deudas.html | deudas | wireDeudasEvents / loadDeudas |
| pagos.html | pagos | wirePagosEvents / loadPagos |
| reportes.html | reportes | wireReportesEvents |
| usuarios.html | usuarios | wireUsuariosEvents / loadUsuarios |
| socio-dashboard.html | socio-dashboard | wireSocioDashboardEvents / loadSocioDashboard |
| socio-puestos.html | socio-puestos | wireSocioPuestosEvents / loadSocioPuestos |
| socio-deudas.html | socio-deudas | wireSocioDeudasEvents / loadSocioDeudas |
| socio-pagos.html | socio-pagos | wireSocioPagosEvents / loadSocioPagos |

---

## CSS — clases importantes

| Clase | Uso |
|---|---|
| `.section-title-right` | Flex row: contiene el paginador + la barra de búsqueda |
| `.search-bar` | Flex row: input + botón "Buscar" |
| `.btn-buscar` | Botón naranja de búsqueda (color accent del tema) |
| `.paginator` | Contenedor del paginador |
| `.paginator button` | Botones de número de página |
| `.paginator button:disabled` | Página actualmente seleccionada |
| `.items-preview-list` | Lista de ítems en el form de deuda |
| `.item-preview-row` | Cada fila del buffer de ítems |
