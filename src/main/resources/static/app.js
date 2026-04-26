const AUTH_TOKEN_KEY = "asociacion-token"; // JWT completo "Bearer ..."
const AUTH_ROLE_KEY  = "asociacion-role";  // "admin" | "operador" | "socio"
const AUTH_SOCIO_KEY = "asociacion-socio"; // JSON {id,nombre,apellido}

const state = {
    socios: [], puestos: [], motivos: [], deudas: [], pagos: [], usuarios: [],
    socioPuestos: [], socioDeudas: [], socioPagos: [],
};
let deudaItemBuffer = [];

const PAGE_SIZE = 10;
const pageState = {
    socios: 1, puestos: 1, motivos: 1, deudas: 1, pagos: 1, usuarios: 1,
    socioPuestos: 1, socioDeudas: 1, socioPagos: 1,
};
const reporteState = { cajaDiaria: null, cajaRango: null, deudaPorSocio: null };

// ── Paginación ────────────────────────────────────────────────────────────────

function paginate(data, key) {
    const sorted = [...data].sort((a, b) => (b.id || 0) - (a.id || 0));
    const page   = pageState[key] || 1;
    return sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

function renderPaginator(containerId, total, key) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const pages = Math.ceil(total / PAGE_SIZE);
    if (pages <= 1) { el.innerHTML = ""; return; }
    const cur = pageState[key] || 1;
    const range = new Set([1, pages]);
    for (let i = Math.max(2, cur - 2); i <= Math.min(pages - 1, cur + 2); i++) range.add(i);
    const sorted = [...range].sort((a, b) => a - b);
    let html = `<div class="paginator">`;
    html += `<button type="button" class="secondary-btn" ${cur === 1 ? "disabled" : ""} onclick="goPage('${key}',${cur - 1})">&#8249;</button>`;
    let prev = 0;
    for (const p of sorted) {
        if (p - prev > 1) html += `<span class="paginator-ellipsis">&#8230;</span>`;
        html += `<button type="button" ${p === cur ? "" : "class='secondary-btn'"} onclick="goPage('${key}',${p})">${p}</button>`;
        prev = p;
    }
    html += `<button type="button" class="secondary-btn" ${cur === pages ? "disabled" : ""} onclick="goPage('${key}',${cur + 1})">&#8250;</button>`;
    html += `<span class="paginator-info">${(cur - 1) * PAGE_SIZE + 1}–${Math.min(cur * PAGE_SIZE, total)} de ${total}</span>`;
    html += `</div>`;
    el.innerHTML = html;
}

function goPage(key, page) {
    pageState[key] = page;
    const map = {
        socios: renderSocios, puestos: renderPuestos, motivos: renderMotivos,
        deudas: renderDeudas, pagos: renderPagos, usuarios: renderUsuarios,
        socioPuestos: renderSocioPuestos, socioDeudas: renderSocioDeudas, socioPagos: renderSocioPagos,
    };
    if (map[key]) map[key]();
}

// ── Arranque ──────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    if (isLoginPage()) { initLoginPage(); return; }
    guardProtectedPage();
    wireCommonEvents();
    wireAutoErrorClear();
    initCurrentPage().catch(handlePageError);
});

// ── Auth ──────────────────────────────────────────────────────────────────────

function isLoginPage() {
    const p = window.location.pathname;
    return p === "/" || p.endsWith("/index.html");
}

function decodeToken() {
    const raw = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw) return null;
    try {
        const payload = raw.replace("Bearer ", "").split(".")[1];
        const json    = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json);
    } catch { return null; }
}

function isAuthenticated() {
    const claims = decodeToken();
    if (!claims) return false;
    return claims.exp * 1000 > Date.now();
}

function getRole()  { return localStorage.getItem(AUTH_ROLE_KEY); }

function getSocioData() {
    try { return JSON.parse(localStorage.getItem(AUTH_SOCIO_KEY)); } catch { return null; }
}

function isSocioPage() {
    return (document.body.dataset.page || "").startsWith("socio-");
}

function guardProtectedPage() {
    if (!isAuthenticated()) { window.location.href = "/index.html"; return; }
    const role = getRole();
    if (isSocioPage() && role !== "socio") {
        window.location.href = "/dashboard.html";
    } else if (!isSocioPage() && role === "socio") {
        window.location.href = "/socio-dashboard.html";
    }
}

async function initLoginPage() {
    if (isAuthenticated()) {
        window.location.href = getRole() === "socio" ? "/socio-dashboard.html" : "/dashboard.html";
        return;
    }
    const form = document.getElementById("loginForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value;
        const msg      = document.getElementById("loginMessage");
        msg.className  = "inline-message hidden";

        try {
            const response = await fetch("/api/auth/login", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ username, password }),
            });
            const data = await response.json();

            if (!response.ok) {
                msg.textContent = data.error || "Credenciales incorrectas.";
                msg.className   = "inline-message error";
                return;
            }

            // Guardar token y datos de sesion
            localStorage.setItem(AUTH_TOKEN_KEY, data.token);
            localStorage.setItem(AUTH_ROLE_KEY,  data.role);
            localStorage.setItem("asociacion-user", data.nombre);

            if (data.role === "socio" && data.socioId) {
                const partes = (data.nombre || "").split(" ");
                localStorage.setItem(AUTH_SOCIO_KEY, JSON.stringify({
                    id:       data.socioId,
                    nombre:   partes[0]  || "",
                    apellido: partes.slice(1).join(" ") || "",
                }));
            }

            window.location.href = data.role === "socio" ? "/socio-dashboard.html" : "/dashboard.html";

        } catch (_) {
            msg.textContent = "Error al conectar con el servidor.";
            msg.className   = "inline-message error";
        }
    });
}

function wireCommonEvents() {
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    const userEl = document.getElementById("sidebarUser");
    if (userEl) userEl.textContent = localStorage.getItem("asociacion-user") || "";
}

function logout() {
    [AUTH_TOKEN_KEY, AUTH_ROLE_KEY, AUTH_SOCIO_KEY, "asociacion-user"].forEach(k => localStorage.removeItem(k));
    window.location.href = "/index.html";
}

// ── Enrutamiento ──────────────────────────────────────────────────────────────

async function initCurrentPage() {
    const page = document.body.dataset.page;
    switch (page) {
        case "dashboard":       wireDashboardEvents();      await loadDashboard(); break;
        case "socios":          wireSociosEvents();         await loadSocios(false); break;
        case "puestos":         wirePuestosEvents();        await Promise.all([loadSocios(false), loadPuestos(false)]); break;
        case "motivos":         wireMotivosEvents();        await loadMotivos(false); break;
        case "deudas":          wireDeudasEvents();         setToday(); await Promise.all([loadSocios(false), loadMotivos(false), loadDeudas(false)]); break;
        case "pagos":           wirePagosEvents();          await Promise.all([loadSocios(false), loadDeudas(false), loadPagos(false)]); updatePagoItems(); break;
        case "reportes":        wireReportesEvents();       setToday(); break;
        case "usuarios":        wireUsuariosEvents();       await loadUsuarios(false); break;
        case "socio-dashboard": wireSocioDashboardEvents(); await loadSocioDashboard(); break;
        case "socio-puestos":   wireSocioPuestosEvents();   await loadSocioPuestos(false); break;
        case "socio-deudas":    wireSocioDeudasEvents();    await loadSocioDeudas(false); break;
        case "socio-pagos":     wireSocioPagosEvents();     await loadSocioPagos(false); break;
        default: break;
    }
}

function wireDashboardEvents() {
    document.getElementById("refreshDashboardBtn")?.addEventListener("click", () => loadDashboard().catch(handlePageError));
}
function wireSociosEvents() {
    document.getElementById("loadSociosBtn")?.addEventListener("click", () => loadSocios().catch(handlePageError));
    document.getElementById("socioForm")?.addEventListener("submit", submitSocioForm);
    document.getElementById("resetSocioBtn")?.addEventListener("click", resetSocioForm);
    wireDniInput("socioDni");
    wireSearchBtn("searchSocios", term => loadSocios(false, term));
}
function wirePuestosEvents() {
    document.getElementById("loadPuestosBtn")?.addEventListener("click", () => loadPuestos().catch(handlePageError));
    document.getElementById("puestoForm")?.addEventListener("submit", submitPuestoForm);
    document.getElementById("resetPuestoBtn")?.addEventListener("click", resetPuestoForm);
    wireSearchBtn("searchPuestos", term => loadPuestos(false, term));
}
function wireMotivosEvents() {
    document.getElementById("loadMotivosBtn")?.addEventListener("click", () => loadMotivos().catch(handlePageError));
    document.getElementById("motivoForm")?.addEventListener("submit", submitMotivoForm);
    document.getElementById("resetMotivoBtn")?.addEventListener("click", resetMotivoForm);
    wireSearchBtn("searchMotivos", term => loadMotivos(false, term));
}
function wireDeudasEvents() {
    document.getElementById("loadDeudasBtn")?.addEventListener("click", () => loadDeudas().catch(handlePageError));
    document.getElementById("deudaForm")?.addEventListener("submit", submitDeudaForm);
    document.getElementById("addItemBtn")?.addEventListener("click", addDeudaItem);
    wireSearchBtn("searchDeudas", term => loadDeudas(false, term));
}
function wirePagosEvents() {
    document.getElementById("loadPagosBtn")?.addEventListener("click", () => loadPagos().catch(handlePageError));
    document.getElementById("pagoForm")?.addEventListener("submit", submitPagoForm);
    document.getElementById("pagoSocioId")?.addEventListener("change", updatePagoItems);
    wireSearchBtn("searchPagos", term => loadPagos(false, term));
}
function wireReportesEvents() {
    document.getElementById("reporteCajaForm")?.addEventListener("submit", loadReporteCaja);
    document.getElementById("reporteRangoForm")?.addEventListener("submit", loadReporteRango);
    document.getElementById("reporteDeudaForm")?.addEventListener("submit", loadReporteDeudaSocio);
    document.getElementById("btnPdfCaja")?.addEventListener("click",  () => exportPdf("cajaDiaria"));
    document.getElementById("btnCsvCaja")?.addEventListener("click",  () => exportCsv("cajaDiaria"));
    document.getElementById("btnPdfRango")?.addEventListener("click", () => exportPdf("cajaRango"));
    document.getElementById("btnCsvRango")?.addEventListener("click", () => exportCsv("cajaRango"));
    document.getElementById("btnPdfDeuda")?.addEventListener("click", () => exportPdf("deudaPorSocio"));
    document.getElementById("btnCsvDeuda")?.addEventListener("click", () => exportCsv("deudaPorSocio"));
}
function wireUsuariosEvents() {
    document.getElementById("loadUsuariosBtn")?.addEventListener("click", () => loadUsuarios().catch(handlePageError));
    document.getElementById("usuarioForm")?.addEventListener("submit", submitUsuarioForm);
    document.getElementById("resetUsuarioBtn")?.addEventListener("click", resetUsuarioForm);
    wireDniInput("usuarioDni");
    wireSearchBtn("searchUsuarios", term => loadUsuarios(false, term));
}
function wireSocioDashboardEvents() {
    document.getElementById("refreshSocioDashBtn")?.addEventListener("click", () => loadSocioDashboard().catch(handlePageError));
}
function wireSocioPuestosEvents() {
    document.getElementById("refreshSocioPuestosBtn")?.addEventListener("click", () => loadSocioPuestos().catch(handlePageError));
    wireSearchBtn("searchSocioPuestos", term => loadSocioPuestos(false, term));
}
function wireSocioDeudasEvents() {
    document.getElementById("refreshSocioDeudasBtn")?.addEventListener("click", () => loadSocioDeudas().catch(handlePageError));
    wireSearchBtn("searchSocioDeudas", term => loadSocioDeudas(false, term));
}
function wireSocioPagosEvents() {
    document.getElementById("refreshSocioPagosBtn")?.addEventListener("click", () => loadSocioPagos().catch(handlePageError));
    wireSearchBtn("searchSocioPagos", term => loadSocioPagos(false, term));
}

// ── Motor de validacion ───────────────────────────────────────────────────────

function wireAutoErrorClear() {
    document.addEventListener("input",  (e) => clearFieldState(e.target));
    document.addEventListener("change", (e) => clearFieldState(e.target));
}

function clearFieldState(el) {
    if (!el || !el.classList) return;
    el.classList.remove("input-error");
    el.parentNode?.querySelector(".error-msg")?.remove();
}

function clearErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
    form.querySelectorAll(".error-msg").forEach(el => el.remove());
}

function setFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.add("input-error");
    el.parentNode?.querySelector(".error-msg")?.remove();
    const span = document.createElement("span");
    span.className   = "error-msg";
    span.textContent = message;
    el.insertAdjacentElement("afterend", span);
}

function validateFields(rules) {
    let ok = true;
    for (const { id, checks } of rules) {
        const el = document.getElementById(id);
        if (!el) continue;
        const val = el.value.trim();
        for (const { test, msg } of checks) {
            if (!test(val)) { setFieldError(id, msg); ok = false; break; }
        }
    }
    return ok;
}

const V = {
    notEmpty:  (msg = "Este campo es obligatorio")      => ({ test: v => v !== "",                                     msg }),
    minLen:    (n, msg)                                  => ({ test: v => !v || v.length >= n,                          msg: msg || `Minimo ${n} caracteres` }),
    maxLen:    (n, msg)                                  => ({ test: v => !v || v.length <= n,                          msg: msg || `Maximo ${n} caracteres` }),
    exactLen:  (n, msg)                                  => ({ test: v => !v || v.length === n,                         msg: msg || `Debe tener exactamente ${n} caracteres` }),
    digits:    (msg = "Solo se permiten numeros")        => ({ test: v => !v || /^\d+$/.test(v),                        msg }),
    email:     (msg = "Correo electronico no valido")    => ({ test: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg }),
    positive:  (msg = "Debe ser mayor a 0")              => ({ test: v => !v || Number(v) > 0,                          msg }),
    notSelect: (msg = "Seleccione una opcion")           => ({ test: v => v !== "",                                     msg }),
};

// ── Buscador ──────────────────────────────────────────────────────────────────

function wireDniInput(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("maxlength", "8");
    el.addEventListener("input", () => {
        const clean = el.value.replace(/\D/g, "").slice(0, 8);
        if (el.value !== clean) el.value = clean;
    });
}

function wireSearchBtn(inputId, loadFn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-buscar";
    btn.textContent = "Buscar";
    const doSearch = () => loadFn(input.value.trim()).catch(handlePageError);
    btn.addEventListener("click", doSearch);
    input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });
    input.insertAdjacentElement("afterend", btn);
}

// ── API ───────────────────────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": token } : {}),
        ...(options.headers || {}),
    };
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        logout();
        return;
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
        const message = typeof data === "string"
            ? data
            : (data.error || Object.values(data).join(" | ") || "Ocurrio un error en la solicitud.");
        throw new Error(message);
    }
    return data;
}

function handlePageError(error) { showMessage(error.message, "error"); }

function showMessage(message, type = "success") {
    if (type === "success") {
        Swal.fire({ icon: "success", title: "Operacion exitosa", text: message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } else {
        Swal.fire({ icon: "error", title: "Ocurrio un error", text: message });
    }
}

async function confirmAction(title, text) {
    const result = await Swal.fire({ title, text, icon: "warning", showCancelButton: true, confirmButtonText: "Si, continuar", cancelButtonText: "Cancelar", confirmButtonColor: "#d33" });
    return result.isConfirmed;
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function setToday() {
    const today = new Date().toISOString().split("T")[0];
    setValueIfExists("deudaFecha",       today);
    setValueIfExists("reporteCajaFecha", today);
    setValueIfExists("reporteDesde",     today);
    setValueIfExists("reporteHasta",     today);
}

function setValueIfExists(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString("es-PE", { style: "currency", currency: "PEN" });
}

function socioFullName(socio) { return `${socio.nombre} ${socio.apellido}`.trim(); }
function rolLabel(rol)        { return rol === 1 ? "Administrador" : "Operador"; }

function renderSelect(selectId, items, formatter, includeEmptyOption = false, emptyLabel = "Seleccione") {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML   = includeEmptyOption ? `<option value="">${emptyLabel}</option>` : "";
    items.forEach(item => {
        const opt      = document.createElement("option");
        opt.value      = item.id;
        opt.textContent = formatter(item);
        select.appendChild(opt);
    });
    if ([...select.options].some(o => o.value === currentValue)) select.value = currentValue;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

async function loadDashboard() {
    await Promise.all([loadSocios(false), loadPuestos(false), loadMotivos(false), loadDeudas(false), loadPagos(false)]);
    document.getElementById("statSocios").textContent           = state.socios.length;
    document.getElementById("statPuestos").textContent          = state.puestos.length;
    document.getElementById("statMotivos").textContent          = state.motivos.filter(m => m.activo).length;
    document.getElementById("statDeudasPendientes").textContent = state.deudas.filter(d => d.estado !== "PAGADA").length;
    renderDashboardPagos();
    renderDashboardDeudas();
}

function renderDashboardPagos() {
    const tbody = document.getElementById("dashboardPagosTable");
    if (!tbody) return;
    const items = state.pagos.slice(0, 5);
    tbody.innerHTML = items.length
        ? items.map(p => `<tr><td>${p.id}</td><td>${p.socioNombre || p.socioId}</td><td>${p.fecha || "-"}</td><td>${formatMoney(p.montoTotal)}</td></tr>`).join("")
        : "<tr><td colspan='4' class='muted'>No hay pagos registrados.</td></tr>";
}

function renderDashboardDeudas() {
    const tbody = document.getElementById("dashboardDeudasTable");
    if (!tbody) return;
    const items = state.deudas.slice(0, 5);
    tbody.innerHTML = items.length
        ? items.map(d => `<tr><td>${d.id}</td><td>${d.socioNombre || d.socioId}</td><td>${d.estado}</td><td>${formatMoney(d.totalPendiente)}</td></tr>`).join("")
        : "<tr><td colspan='4' class='muted'>No hay deudas registradas.</td></tr>";
}

// ── Socios ────────────────────────────────────────────────────────────────────

async function loadSocios(notify = true, buscar = "") {
    const url = buscar ? `/api/socios?buscar=${encodeURIComponent(buscar)}` : "/api/socios";
    state.socios = await apiFetch(url);
    pageState.socios = 1;
    renderSocios();
    renderSelect("puestoSocioId", state.socios.filter(s => s.activo), socioFullName, true, "Pertenece a la asociacion");
    renderSelect("deudaSocioId",  state.socios.filter(s => s.activo), socioFullName);
    renderSelect("pagoSocioId",   state.socios.filter(s => s.activo), socioFullName, true, "Seleccione un socio");
    if (notify) showMessage("Socios cargados.", "success");
}

function renderSocios() {
    const tbody = document.getElementById("sociosTable");
    if (!tbody) return;
    const page = paginate(state.socios, "socios");
    tbody.innerHTML = page.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${socioFullName(s)}</td>
            <td>${s.dni}</td>
            <td>${s.telefono || "-"}</td>
            <td>${s.email || "-"}</td>
            <td>${s.username || "-"}</td>
            <td>${s.tieneLogin ? "<span style='color:var(--success);font-weight:700'>Si</span>" : "<span class='muted'>No</span>"}</td>
            <td>${s.activo ? "Activo" : "Inactivo"}</td>
            <td><div class="table-actions">
                <button type="button" onclick="editSocio(${s.id})">Editar</button>
                <button type="button" class="danger-btn" onclick="deleteSocio(${s.id})">Desactivar</button>
            </div></td>
        </tr>`).join("") || "<tr><td colspan='9' class='muted' style='text-align:center'>Sin registros.</td></tr>";
    renderPaginator("sociosPage", state.socios.length, "socios");
}

async function submitSocioForm(event) {
    event.preventDefault();
    clearErrors("socioForm");
    const valid = validateFields([
        { id: "socioNombre",   checks: [V.notEmpty("El nombre es obligatorio"),   V.minLen(2)] },
        { id: "socioApellido", checks: [V.notEmpty("El apellido es obligatorio"), V.minLen(2)] },
        { id: "socioDni",      checks: [V.notEmpty("El DNI es obligatorio"), V.digits(), V.exactLen(8, "El DNI debe tener 8 digitos")] },
        { id: "socioTelefono", checks: [V.digits("Solo numeros en el telefono"), V.maxLen(15)] },
        { id: "socioEmail",    checks: [V.email()] },
    ]);
    if (!valid) return;
    const id = document.getElementById("socioId").value;
    const payload = {
        nombre:   document.getElementById("socioNombre").value.trim(),
        apellido: document.getElementById("socioApellido").value.trim(),
        dni:      document.getElementById("socioDni").value.trim(),
        telefono: document.getElementById("socioTelefono").value.trim() || null,
        email:    document.getElementById("socioEmail").value.trim() || null,
        username: document.getElementById("socioUsername")?.value.trim() || null,
        password: document.getElementById("socioPassword")?.value || null,
    };
    try {
        await apiFetch(id ? `/api/socios/${id}` : "/api/socios", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
        resetSocioForm();
        await loadSocios(false);
        showMessage(id ? "Socio actualizado." : "Socio registrado.", "success");
    } catch (error) { handlePageError(error); }
}

function editSocio(id) {
    const s = state.socios.find(x => x.id === id);
    if (!s) return;
    setValueIfExists("socioId",       s.id);
    setValueIfExists("socioNombre",   s.nombre);
    setValueIfExists("socioApellido", s.apellido);
    setValueIfExists("socioDni",      s.dni);
    setValueIfExists("socioTelefono", s.telefono || "");
    setValueIfExists("socioEmail",    s.email || "");
    setValueIfExists("socioUsername", s.username || "");
    setValueIfExists("socioPassword", "");
}

async function deleteSocio(id) {
    if (!await confirmAction("Desactivar socio", "Esta accion marcara el socio como inactivo.")) return;
    try {
        await apiFetch(`/api/socios/${id}`, { method: "DELETE" });
        await loadSocios(false);
        showMessage("Socio desactivado.", "success");
    } catch (error) { handlePageError(error); }
}

function resetSocioForm() {
    document.getElementById("socioForm")?.reset();
    setValueIfExists("socioId", "");
    clearErrors("socioForm");
}

// ── Puestos ───────────────────────────────────────────────────────────────────

async function loadPuestos(notify = true, buscar = "") {
    const url = buscar ? `/api/puestos?buscar=${encodeURIComponent(buscar)}` : "/api/puestos";
    state.puestos = await apiFetch(url);
    pageState.puestos = 1;
    renderPuestos();
    if (notify) showMessage("Puestos cargados.", "success");
}

function renderPuestos() {
    const tbody = document.getElementById("puestosTable");
    if (!tbody) return;
    const page = paginate(state.puestos, "puestos");
    tbody.innerHTML = page.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><strong>${p.numero}</strong></td>
            <td>${p.categoriaNombre || "-"}</td>
            <td>${p.descripcion || "-"}</td>
            <td>${p.esDeAsociacion ? "Asociacion" : (p.socioNombre || "-")}</td>
            <td>${p.activo ? "Activo" : "Inactivo"}</td>
            <td><div class="table-actions">
                <button type="button" onclick="editPuesto(${p.id})">Editar</button>
                <button type="button" class="danger-btn" onclick="deletePuesto(${p.id})">Desactivar</button>
            </div></td>
        </tr>`).join("") || "<tr><td colspan='7' class='muted' style='text-align:center'>Sin registros.</td></tr>";
    renderPaginator("puestosPage", state.puestos.length, "puestos");
}

async function submitPuestoForm(event) {
    event.preventDefault();
    clearErrors("puestoForm");
    const valid = validateFields([
        { id: "puestoCategoria", checks: [V.notSelect("Seleccione una categoria")] },
    ]);
    if (!valid) return;
    const id      = document.getElementById("puestoId").value;
    const socioId = document.getElementById("puestoSocioId").value;
    const payload = {
        categoria:   Number(document.getElementById("puestoCategoria").value),
        descripcion: document.getElementById("puestoDescripcion").value.trim() || null,
        socioId:     socioId ? Number(socioId) : null,
    };
    try {
        await apiFetch(id ? `/api/puestos/${id}` : "/api/puestos", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
        resetPuestoForm();
        await loadPuestos(false);
        showMessage(id ? "Puesto actualizado." : "Puesto registrado.", "success");
    } catch (error) { handlePageError(error); }
}

function editPuesto(id) {
    const p = state.puestos.find(x => x.id === id);
    if (!p) return;
    setValueIfExists("puestoId",          p.id);
    setValueIfExists("puestoCategoria",   p.categoria);
    setValueIfExists("puestoDescripcion", p.descripcion || "");
    setValueIfExists("puestoSocioId",     p.socioId || "");
    const catSel = document.getElementById("puestoCategoria");
    if (catSel) catSel.disabled = true;
    const info = document.getElementById("puestoNumeroInfo");
    if (info) { info.textContent = `Codigo: ${p.numero}`; info.style.display = "block"; }
}

async function deletePuesto(id) {
    if (!await confirmAction("Desactivar puesto", "Esta accion marcara el puesto como inactivo.")) return;
    try {
        await apiFetch(`/api/puestos/${id}`, { method: "DELETE" });
        await loadPuestos(false);
        showMessage("Puesto desactivado.", "success");
    } catch (error) { handlePageError(error); }
}

function resetPuestoForm() {
    document.getElementById("puestoForm")?.reset();
    setValueIfExists("puestoId", "");
    clearErrors("puestoForm");
    const catSel = document.getElementById("puestoCategoria");
    if (catSel) catSel.disabled = false;
    const info = document.getElementById("puestoNumeroInfo");
    if (info) info.style.display = "none";
}

// ── Motivos ───────────────────────────────────────────────────────────────────

async function loadMotivos(notify = true, buscar = "") {
    const url = buscar
        ? `/api/motivos-cobro?soloActivos=false&buscar=${encodeURIComponent(buscar)}`
        : "/api/motivos-cobro?soloActivos=false";
    state.motivos = await apiFetch(url);
    pageState.motivos = 1;
    renderMotivos();
    renderSelect("deudaMotivoId", state.motivos.filter(m => m.activo), m => m.nombre);
    if (notify) showMessage("Motivos cargados.", "success");
}

function renderMotivos() {
    const tbody = document.getElementById("motivosTable");
    if (!tbody) return;
    const page = paginate(state.motivos, "motivos");
    tbody.innerHTML = page.map(m => `
        <tr>
            <td>${m.id}</td>
            <td>${m.nombre}</td>
            <td>${m.descripcion || "-"}</td>
            <td>${m.activo ? "Activo" : "Inactivo"}</td>
            <td><div class="table-actions">
                <button type="button" onclick="editMotivo(${m.id})">Editar</button>
                <button type="button" class="danger-btn" onclick="deleteMotivo(${m.id})">Desactivar</button>
            </div></td>
        </tr>`).join("") || "<tr><td colspan='5' class='muted' style='text-align:center'>Sin registros.</td></tr>";
    renderPaginator("motivosPage", state.motivos.length, "motivos");
}

async function submitMotivoForm(event) {
    event.preventDefault();
    clearErrors("motivoForm");
    const valid = validateFields([
        { id: "motivoNombre", checks: [V.notEmpty("El nombre es obligatorio"), V.minLen(3), V.maxLen(120)] },
    ]);
    if (!valid) return;
    const id = document.getElementById("motivoId").value;
    const payload = {
        nombre:      document.getElementById("motivoNombre").value.trim(),
        descripcion: document.getElementById("motivoDescripcion").value.trim() || null,
    };
    try {
        await apiFetch(id ? `/api/motivos-cobro/${id}` : "/api/motivos-cobro", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
        resetMotivoForm();
        await loadMotivos(false);
        showMessage(id ? "Motivo actualizado." : "Motivo registrado.", "success");
    } catch (error) { handlePageError(error); }
}

function editMotivo(id) {
    const m = state.motivos.find(x => x.id === id);
    if (!m) return;
    setValueIfExists("motivoId",          m.id);
    setValueIfExists("motivoNombre",      m.nombre);
    setValueIfExists("motivoDescripcion", m.descripcion || "");
}

async function deleteMotivo(id) {
    if (!await confirmAction("Desactivar motivo", "Esta accion marcara el motivo como inactivo.")) return;
    try {
        await apiFetch(`/api/motivos-cobro/${id}`, { method: "DELETE" });
        await loadMotivos(false);
        showMessage("Motivo desactivado.", "success");
    } catch (error) { handlePageError(error); }
}

function resetMotivoForm() {
    document.getElementById("motivoForm")?.reset();
    setValueIfExists("motivoId", "");
    clearErrors("motivoForm");
}

// ── Deudas ────────────────────────────────────────────────────────────────────

async function loadDeudas(notify = true, buscar = "") {
    const url = buscar ? `/api/deudas?buscar=${encodeURIComponent(buscar)}` : "/api/deudas";
    state.deudas = await apiFetch(url);
    pageState.deudas = 1;
    renderDeudas();
    updatePagoItems();
    if (notify) showMessage("Deudas cargadas.", "success");
}

function renderDeudas() {
    const tbody = document.getElementById("deudasTable");
    if (!tbody) return;
    const page = paginate(state.deudas, "deudas");
    tbody.innerHTML = page.map(d => `
        <tr>
            <td>${d.id}</td>
            <td>${d.socioNombre || d.socioId}</td>
            <td>${d.fecha || "-"}</td>
            <td>${d.descripcion || "-"}</td>
            <td>${d.estado}</td>
            <td>${formatMoney(d.totalPendiente)}</td>
            <td>${renderDeudaItems(d.items)}</td>
            <td class="table-actions">
                <button type="button" class="secondary-btn" onclick="openAddItemsModal(${d.id})">+ Ítem</button>
            </td>
        </tr>`).join("") || "<tr><td colspan='8' class='muted' style='text-align:center'>Sin registros.</td></tr>";
    renderPaginator("deudasPage", state.deudas.length, "deudas");
}

async function openAddItemsModal(deudaId) {
    const motivos = state.motivos.filter(m => m.activo);
    const options = motivos.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("");
    const { value: item } = await Swal.fire({
        title: `Añadir ítem — Deuda #${deudaId}`,
        html: `
            <div style="display:grid;gap:0.75rem;text-align:left">
                <label style="font-size:0.8rem;font-weight:700;color:#617076;text-transform:uppercase;letter-spacing:.07em">Motivo
                    <select id="swal-motivo" style="display:block;width:100%;margin-top:0.4rem;padding:0.7rem 1rem;border:1.5px solid #dccfc4;border-radius:8px;font-size:0.95rem">
                        <option value="">Seleccione...</option>${options}
                    </select>
                </label>
                <label style="font-size:0.8rem;font-weight:700;color:#617076;text-transform:uppercase;letter-spacing:.07em">Monto
                    <input id="swal-monto" type="number" min="0.01" step="0.01" placeholder="0.00"
                        style="display:block;width:100%;margin-top:0.4rem;padding:0.7rem 1rem;border:1.5px solid #dccfc4;border-radius:8px;font-size:0.95rem">
                </label>
                <label style="font-size:0.8rem;font-weight:700;color:#617076;text-transform:uppercase;letter-spacing:.07em">Observación
                    <input id="swal-obs" type="text" placeholder="Opcional"
                        style="display:block;width:100%;margin-top:0.4rem;padding:0.7rem 1rem;border:1.5px solid #dccfc4;border-radius:8px;font-size:0.95rem">
                </label>
            </div>`,
        confirmButtonText: "Añadir ítem",
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        preConfirm: () => {
            const motivoId = Number(document.getElementById("swal-motivo").value);
            const monto    = Number(document.getElementById("swal-monto").value);
            const obs      = document.getElementById("swal-obs").value.trim();
            if (!motivoId) { Swal.showValidationMessage("Seleccione un motivo de cobro"); return false; }
            if (!monto || monto <= 0) { Swal.showValidationMessage("Ingrese un monto válido mayor a 0"); return false; }
            return { motivoCobroId: motivoId, monto, observacion: obs || null };
        },
    });
    if (!item) return;
    try {
        await apiFetch(`/api/deudas/${deudaId}/items`, { method: "POST", body: JSON.stringify([item]) });
        await loadDeudas(false);
        showMessage("Ítem añadido correctamente.", "success");
    } catch (error) { handlePageError(error); }
}

function renderDeudaItems(items = []) {
    if (!items.length) return "<span class='muted'>Sin items</span>";
    return items.map(i => `<div><strong>${i.motivoCobroNombre}</strong> - ${formatMoney(i.monto)} - ${i.estado}</div>`).join("");
}

function addDeudaItem() {
    const motivoId = Number(document.getElementById("deudaMotivoId").value);
    const monto    = Number(document.getElementById("deudaMonto").value);
    const obs      = document.getElementById("deudaObservacion").value.trim();
    if (!motivoId) {
        Swal.fire({ icon: "warning", title: "Motivo requerido", text: "Seleccione un motivo de cobro." });
        return;
    }
    if (!monto || monto <= 0) {
        Swal.fire({ icon: "warning", title: "Monto inválido", text: "Ingrese un monto mayor a 0." });
        return;
    }
    const motivo = state.motivos.find(m => m.id === motivoId);
    deudaItemBuffer.push({ motivoCobroId: motivoId, motivoNombre: motivo?.nombre || "", monto, observacion: obs });
    document.getElementById("deudaMotivoId").value  = "";
    document.getElementById("deudaMonto").value     = "";
    document.getElementById("deudaObservacion").value = "";
    renderDeudaItemsPreview();
}

function removeDeudaItem(index) {
    deudaItemBuffer.splice(index, 1);
    renderDeudaItemsPreview();
}

function renderDeudaItemsPreview() {
    const el = document.getElementById("deudaItemsList");
    if (!el) return;
    const countMsg = document.getElementById("itemsCountMsg");
    if (!deudaItemBuffer.length) {
        el.innerHTML = "<p class='muted' style='font-size:0.85rem;margin:0'>Sin ítems añadidos aún.</p>";
        if (countMsg) countMsg.textContent = "";
        return;
    }
    el.innerHTML = `<div class="items-preview-list">${deudaItemBuffer.map((item, i) => `
        <div class="item-preview-row">
            <span><strong>${item.motivoNombre}</strong> — ${formatMoney(item.monto)}${item.observacion ? ` <em class="muted">(${item.observacion})</em>` : ""}</span>
            <button type="button" class="danger-btn" onclick="removeDeudaItem(${i})">✕</button>
        </div>`).join("")}</div>`;
    if (countMsg) countMsg.textContent = `${deudaItemBuffer.length} ítem${deudaItemBuffer.length !== 1 ? "s" : ""} añadido${deudaItemBuffer.length !== 1 ? "s" : ""}`;
}

async function submitDeudaForm(event) {
    event.preventDefault();
    clearErrors("deudaForm");
    const valid = validateFields([
        { id: "deudaSocioId",     checks: [V.notSelect("Seleccione un socio")] },
        { id: "deudaFecha",       checks: [V.notEmpty("La fecha es obligatoria")] },
        { id: "deudaDescripcion", checks: [V.notEmpty("La descripcion es obligatoria"), V.minLen(3)] },
    ]);
    if (!valid) return;
    if (!deudaItemBuffer.length) {
        Swal.fire({ icon: "warning", title: "Sin ítems", text: "Añada al menos un ítem antes de registrar la deuda." });
        return;
    }
    const payload = {
        socioId:     Number(document.getElementById("deudaSocioId").value),
        fecha:       document.getElementById("deudaFecha").value || null,
        descripcion: document.getElementById("deudaDescripcion").value.trim(),
        items:       deudaItemBuffer.map(i => ({ motivoCobroId: i.motivoCobroId, monto: i.monto, observacion: i.observacion || null })),
    };
    try {
        await apiFetch("/api/deudas", { method: "POST", body: JSON.stringify(payload) });
        document.getElementById("deudaForm")?.reset();
        clearErrors("deudaForm");
        deudaItemBuffer = [];
        renderDeudaItemsPreview();
        setToday();
        await loadDeudas(false);
        showMessage("Deuda registrada.", "success");
    } catch (error) { handlePageError(error); }
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

async function loadPagos(notify = true, buscar = "") {
    const url = buscar ? `/api/pagos?buscar=${encodeURIComponent(buscar)}` : "/api/pagos";
    state.pagos = await apiFetch(url);
    pageState.pagos = 1;
    renderPagos();
    if (notify) showMessage("Pagos cargados.", "success");
}

function renderPagos() {
    const tbody = document.getElementById("pagosTable");
    if (!tbody) return;
    const page = paginate(state.pagos, "pagos");
    tbody.innerHTML = page.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.socioNombre || p.socioId}</td>
            <td>${p.fecha || "-"}</td>
            <td>${formatMoney(p.montoTotal)}</td>
            <td>${p.observacion || "-"}</td>
            <td>${(p.itemsPagados || []).map(i => i.motivoCobroNombre).join(", ") || "-"}</td>
        </tr>`).join("") || "<tr><td colspan='6' class='muted' style='text-align:center'>Sin registros.</td></tr>";
    renderPaginator("pagosPage", state.pagos.length, "pagos");
}

function updatePagoItems() {
    const container = document.getElementById("pagoItemsContainer");
    const select    = document.getElementById("pagoSocioId");
    if (!container || !select) return;
    const socioId = Number(select.value);
    if (!socioId) { container.innerHTML = "<p class='muted'>Selecciona un socio para ver los items pendientes.</p>"; return; }
    const pendientes = state.deudas
        .filter(d => d.socioId === socioId)
        .flatMap(d => (d.items || []).filter(i => i.estado === "PENDIENTE").map(i => ({ ...i, deudaDescripcion: d.descripcion, deudaFecha: d.fecha })));
    if (!pendientes.length) { container.innerHTML = "<p class='muted'>Este socio no tiene items pendientes.</p>"; return; }
    container.innerHTML = pendientes.map(i => `
        <label class="checkbox-item">
            <input type="checkbox" value="${i.id}">
            <span><strong>${i.motivoCobroNombre}</strong><br>
            ${formatMoney(i.monto)} | ${i.deudaFecha || "-"} | ${i.deudaDescripcion || "-"}</span>
        </label>`).join("");
}

async function submitPagoForm(event) {
    event.preventDefault();
    clearErrors("pagoForm");
    if (!validateFields([{ id: "pagoSocioId", checks: [V.notSelect("Seleccione un socio")] }])) return;
    const container    = document.getElementById("pagoItemsContainer");
    const deudaItemIds = [...(container?.querySelectorAll("input:checked") || [])].map(i => Number(i.value));
    if (!deudaItemIds.length) {
        Swal.fire({ icon: "warning", title: "Seleccion requerida", text: "Debe marcar al menos un item pendiente." });
        return;
    }
    const payload = {
        socioId:     Number(document.getElementById("pagoSocioId").value),
        deudaItemIds,
        observacion: document.getElementById("pagoObservacion").value.trim() || null,
    };
    try {
        await apiFetch("/api/pagos", { method: "POST", body: JSON.stringify(payload) });
        document.getElementById("pagoForm")?.reset();
        await Promise.all([loadPagos(false), loadDeudas(false)]);
        updatePagoItems();
        showMessage("Pago registrado.", "success");
    } catch (error) { handlePageError(error); }
}

// ── Reportes ──────────────────────────────────────────────────────────────────

async function loadReporteCaja(event) {
    event.preventDefault();
    const fecha = document.getElementById("reporteCajaFecha").value;
    try {
        const data = await apiFetch(`/api/reportes/caja?fecha=${fecha}`);
        reporteState.cajaDiaria = data;
        renderReporteCaja(data);
        toggleReporteBtns("Caja", true);
    } catch (error) { handlePageError(error); }
}

async function loadReporteRango(event) {
    event.preventDefault();
    const desde = document.getElementById("reporteDesde").value;
    const hasta = document.getElementById("reporteHasta").value;
    try {
        const data = await apiFetch(`/api/reportes/caja/rango?desde=${desde}&hasta=${hasta}`);
        reporteState.cajaRango = data;
        renderReporteRango(data);
        toggleReporteBtns("Rango", true);
    } catch (error) { handlePageError(error); }
}

async function loadReporteDeudaSocio(event) {
    event.preventDefault();
    try {
        const data = await apiFetch("/api/reportes/deudas-por-socio");
        reporteState.deudaPorSocio = data;
        renderReporteDeuda(data);
        toggleReporteBtns("Deuda", true);
    } catch (error) { handlePageError(error); }
}

function toggleReporteBtns(suffix, enabled) {
    ["Pdf", "Csv"].forEach(t => {
        const btn = document.getElementById(`btn${t}${suffix}`);
        if (btn) btn.disabled = !enabled;
    });
}

function renderReporteCaja(data) {
    const out = document.getElementById("reportesCajaOutput");
    if (!out) return;
    const rows = (data.pagos || []).map(p =>
        `<tr><td>${p.id}</td><td>${p.socioNombre || "-"}</td><td>${p.fecha || "-"}</td><td>${formatMoney(p.montoTotal)}</td><td>${p.observacion || "-"}</td></tr>`
    ).join("") || "<tr><td colspan='5' class='muted'>Sin pagos en esta fecha.</td></tr>";
    out.innerHTML = `
        <div class="report-summary">
            <span>Fecha: <strong>${data.fecha}</strong></span>
            <span>Total recaudado: <strong>${formatMoney(data.totalRecaudado)}</strong></span>
            <span>Cantidad de pagos: <strong>${data.cantidadPagos}</strong></span>
        </div>
        <div class="table-wrap"><table>
            <thead><tr><th>ID</th><th>Socio</th><th>Fecha</th><th>Monto</th><th>Observacion</th></tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    out.classList.remove("hidden");
}

function renderReporteRango(data) {
    const out = document.getElementById("reportesRangoOutput");
    if (!out) return;
    const rows = (data.pagos || []).map(p =>
        `<tr><td>${p.id}</td><td>${p.socioNombre || "-"}</td><td>${p.fecha || "-"}</td><td>${formatMoney(p.montoTotal)}</td><td>${p.observacion || "-"}</td></tr>`
    ).join("") || "<tr><td colspan='5' class='muted'>Sin pagos en este rango.</td></tr>";
    out.innerHTML = `
        <div class="report-summary">
            <span>Desde: <strong>${data.desde}</strong></span>
            <span>Hasta: <strong>${data.hasta}</strong></span>
            <span>Total recaudado: <strong>${formatMoney(data.totalRecaudado)}</strong></span>
            <span>Cantidad de pagos: <strong>${data.cantidadPagos}</strong></span>
        </div>
        <div class="table-wrap"><table>
            <thead><tr><th>ID</th><th>Socio</th><th>Fecha</th><th>Monto</th><th>Observacion</th></tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    out.classList.remove("hidden");
}

function renderReporteDeuda(data) {
    const out = document.getElementById("reportesDeudaOutput");
    if (!out) return;
    const porSocio = data.deudaPorSocio || {};
    const rows = Object.entries(porSocio).flatMap(([socio, deudas]) =>
        deudas.map((d, i) => `<tr>
            ${i === 0 ? `<td rowspan="${deudas.length}">${socio}</td>` : ""}
            <td>${d.id}</td><td>${d.fecha || "-"}</td><td>${d.descripcion || "-"}</td><td>${d.estado}</td><td>${formatMoney(d.totalPendiente)}</td>
        </tr>`)
    ).join("") || "<tr><td colspan='6' class='muted'>Sin deudas pendientes.</td></tr>";
    out.innerHTML = `
        <div class="report-summary">
            <span>Total general pendiente: <strong>${formatMoney(data.totalGeneral)}</strong></span>
        </div>
        <div class="table-wrap"><table>
            <thead><tr><th>Socio</th><th>ID Deuda</th><th>Fecha</th><th>Descripcion</th><th>Estado</th><th>Total Pendiente</th></tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    out.classList.remove("hidden");
}

// ── PDF y CSV ─────────────────────────────────────────────────────────────────

function exportPdf(tipo) {
    if (!window.jspdf) { showMessage("Libreria PDF no disponible.", "error"); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    if (tipo === "cajaDiaria") {
        const d = reporteState.cajaDiaria; if (!d) return;
        doc.setFontSize(14); doc.text("Reporte: Caja Diaria", 14, 16);
        doc.setFontSize(10); doc.text(`Fecha: ${d.fecha}  |  Total: ${formatMoney(d.totalRecaudado)}  |  Pagos: ${d.cantidadPagos}`, 14, 24);
        doc.autoTable({ startY: 30,
            head: [["ID", "Socio", "Fecha", "Monto", "Observacion"]],
            body: (d.pagos || []).map(p => [p.id, p.socioNombre || "-", p.fecha || "-", formatMoney(p.montoTotal), p.observacion || "-"]) });
        doc.save(`caja-diaria-${d.fecha}.pdf`);

    } else if (tipo === "cajaRango") {
        const d = reporteState.cajaRango; if (!d) return;
        doc.setFontSize(14); doc.text("Reporte: Caja por Rango", 14, 16);
        doc.setFontSize(10); doc.text(`Desde: ${d.desde}  Hasta: ${d.hasta}  |  Total: ${formatMoney(d.totalRecaudado)}`, 14, 24);
        doc.autoTable({ startY: 30,
            head: [["ID", "Socio", "Fecha", "Monto", "Observacion"]],
            body: (d.pagos || []).map(p => [p.id, p.socioNombre || "-", p.fecha || "-", formatMoney(p.montoTotal), p.observacion || "-"]) });
        doc.save(`caja-rango-${d.desde}-${d.hasta}.pdf`);

    } else if (tipo === "deudaPorSocio") {
        const d = reporteState.deudaPorSocio; if (!d) return;
        const porSocio = d.deudaPorSocio || {};
        const body = Object.entries(porSocio).flatMap(([socio, deudas]) =>
            deudas.map(deu => [socio, deu.id, deu.fecha || "-", deu.descripcion || "-", deu.estado, formatMoney(deu.totalPendiente)]));
        doc.setFontSize(14); doc.text("Reporte: Deuda por Socio", 14, 16);
        doc.setFontSize(10); doc.text(`Total general: ${formatMoney(d.totalGeneral)}`, 14, 24);
        doc.autoTable({ startY: 30,
            head: [["Socio", "ID Deuda", "Fecha", "Descripcion", "Estado", "Total Pendiente"]],
            body });
        doc.save("deuda-por-socio.pdf");
    }
}

function exportCsv(tipo) {
    let headers, rows, filename;
    if (tipo === "cajaDiaria") {
        const d = reporteState.cajaDiaria; if (!d) return;
        headers  = ["ID", "Socio", "Fecha", "Monto", "Observacion"];
        rows     = (d.pagos || []).map(p => [p.id, p.socioNombre || "", p.fecha || "", p.montoTotal, p.observacion || ""]);
        filename = `caja-diaria-${d.fecha}.csv`;
    } else if (tipo === "cajaRango") {
        const d = reporteState.cajaRango; if (!d) return;
        headers  = ["ID", "Socio", "Fecha", "Monto", "Observacion"];
        rows     = (d.pagos || []).map(p => [p.id, p.socioNombre || "", p.fecha || "", p.montoTotal, p.observacion || ""]);
        filename = `caja-rango-${d.desde}-${d.hasta}.csv`;
    } else if (tipo === "deudaPorSocio") {
        const d = reporteState.deudaPorSocio; if (!d) return;
        headers  = ["Socio", "ID Deuda", "Fecha", "Descripcion", "Estado", "Total Pendiente"];
        rows     = Object.entries(d.deudaPorSocio || {}).flatMap(([socio, deudas]) =>
            deudas.map(deu => [socio, deu.id, deu.fecha || "", deu.descripcion || "", deu.estado, deu.totalPendiente]));
        filename = "deuda-por-socio.csv";
    } else { return; }

    const lines = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))];
    const blob  = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url   = URL.createObjectURL(blob);
    const a     = Object.assign(document.createElement("a"), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
}

// ── Usuarios ──────────────────────────────────────────────────────────────────

async function loadUsuarios(notify = true, buscar = "") {
    const url = buscar ? `/api/usuarios?buscar=${encodeURIComponent(buscar)}` : "/api/usuarios";
    state.usuarios = await apiFetch(url);
    pageState.usuarios = 1;
    renderUsuarios();
    if (notify) showMessage("Usuarios cargados.", "success");
}

function renderUsuarios() {
    const tbody = document.getElementById("usuariosTable");
    if (!tbody) return;
    const page = paginate(state.usuarios, "usuarios");
    tbody.innerHTML = page.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.username}</td>
            <td>${u.nombreCompleto}</td>
            <td>${u.dni}</td>
            <td>${u.ruc}</td>
            <td>${u.email || "-"}</td>
            <td>${u.telefono || "-"}</td>
            <td>${rolLabel(u.rol)}</td>
            <td>${u.activo ? "Activo" : "Inactivo"}</td>
            <td><div class="table-actions">
                <button type="button" onclick="editUsuario(${u.id})">Editar</button>
                <button type="button" class="danger-btn" onclick="deleteUsuario(${u.id})">Desactivar</button>
            </div></td>
        </tr>`).join("") || "<tr><td colspan='10' class='muted' style='text-align:center'>Sin registros.</td></tr>";
    renderPaginator("usuariosPage", state.usuarios.length, "usuarios");
}

async function submitUsuarioForm(event) {
    event.preventDefault();
    clearErrors("usuarioForm");
    const isNew          = !document.getElementById("usuarioId").value;
    const passwordChecks = isNew
        ? [V.notEmpty("La contrasena es obligatoria"), V.minLen(6)]
        : [V.minLen(6, "Minimo 6 caracteres si desea cambiarla")];
    const valid = validateFields([
        { id: "usuarioUsername",       checks: [V.notEmpty(), V.minLen(4), V.maxLen(60)] },
        { id: "usuarioPassword",       checks: passwordChecks },
        { id: "usuarioNombreCompleto", checks: [V.notEmpty("El nombre completo es obligatorio"), V.minLen(4)] },
        { id: "usuarioDni",            checks: [V.notEmpty("El DNI es obligatorio"), V.digits(), V.exactLen(8, "El DNI debe tener 8 digitos")] },
        { id: "usuarioRuc",            checks: [V.notEmpty("El RUC es obligatorio"), V.digits(), V.exactLen(11, "El RUC debe tener 11 digitos")] },
        { id: "usuarioEmail",          checks: [V.email()] },
        { id: "usuarioRol",            checks: [V.notSelect("Seleccione un rol")] },
    ]);
    if (!valid) return;
    const id       = document.getElementById("usuarioId").value;
    const password = document.getElementById("usuarioPassword").value;
    const payload  = {
        username:       document.getElementById("usuarioUsername").value.trim(),
        nombreCompleto: document.getElementById("usuarioNombreCompleto").value.trim(),
        dni:            document.getElementById("usuarioDni").value.trim(),
        ruc:            document.getElementById("usuarioRuc").value.trim(),
        email:          document.getElementById("usuarioEmail").value.trim() || null,
        telefono:       document.getElementById("usuarioTelefono").value.trim() || null,
        direccion:      document.getElementById("usuarioDireccion").value.trim() || null,
        rol:            Number(document.getElementById("usuarioRol").value),
    };
    if (password) payload.password = password;
    try {
        await apiFetch(id ? `/api/usuarios/${id}` : "/api/usuarios", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
        resetUsuarioForm();
        await loadUsuarios(false);
        showMessage(id ? "Usuario actualizado." : "Usuario registrado.", "success");
    } catch (error) { handlePageError(error); }
}

function editUsuario(id) {
    const u = state.usuarios.find(x => x.id === id);
    if (!u) return;
    setValueIfExists("usuarioId",            u.id);
    setValueIfExists("usuarioUsername",      u.username);
    setValueIfExists("usuarioPassword",      "");
    setValueIfExists("usuarioNombreCompleto",u.nombreCompleto);
    setValueIfExists("usuarioDni",           u.dni);
    setValueIfExists("usuarioRuc",           u.ruc);
    setValueIfExists("usuarioEmail",         u.email || "");
    setValueIfExists("usuarioTelefono",      u.telefono || "");
    setValueIfExists("usuarioDireccion",     u.direccion || "");
    setValueIfExists("usuarioRol",           u.rol);
}

async function deleteUsuario(id) {
    if (!await confirmAction("Desactivar usuario", "Esta accion marcara el usuario como inactivo.")) return;
    try {
        await apiFetch(`/api/usuarios/${id}`, { method: "DELETE" });
        await loadUsuarios(false);
        showMessage("Usuario desactivado.", "success");
    } catch (error) { handlePageError(error); }
}

function resetUsuarioForm() {
    document.getElementById("usuarioForm")?.reset();
    setValueIfExists("usuarioId", "");
    clearErrors("usuarioForm");
}

// ── Portal Socio ──────────────────────────────────────────────────────────────

async function loadSocioDashboard() {
    const socio = getSocioData();
    if (!socio) return;
    setValueIfExists("socioNombreHeader", `${socio.nombre} ${socio.apellido}`);
    try {
        const [puestos, deudas, pagos] = await Promise.all([
            apiFetch(`/api/puestos?socioId=${socio.id}`),
            apiFetch(`/api/deudas?socioId=${socio.id}`),
            apiFetch(`/api/pagos?socioId=${socio.id}`),
        ]);
        const pendientes = deudas.filter(d => d.estado !== "PAGADA");
        setValueIfExists("socioStatPuestos", puestos.length);
        setValueIfExists("socioStatDeudas",  pendientes.length);
        setValueIfExists("socioStatPagos",   pagos.length);
        const tbodyD = document.getElementById("socioDashDeudas");
        if (tbodyD) tbodyD.innerHTML = pendientes.slice(0, 5).map(d =>
            `<tr><td>${d.id}</td><td>${d.fecha || "-"}</td><td>${d.descripcion || "-"}</td><td>${formatMoney(d.totalPendiente)}</td></tr>`
        ).join("") || "<tr><td colspan='4' class='muted'>Sin deudas pendientes.</td></tr>";
        const tbodyP = document.getElementById("socioDashPagos");
        if (tbodyP) tbodyP.innerHTML = pagos.slice(0, 5).map(p =>
            `<tr><td>${p.id}</td><td>${p.fecha || "-"}</td><td>${formatMoney(p.montoTotal)}</td></tr>`
        ).join("") || "<tr><td colspan='3' class='muted'>Sin pagos registrados.</td></tr>";
    } catch (error) { handlePageError(error); }
}

async function loadSocioPuestos(notify = true, buscar = "") {
    const socio = getSocioData(); if (!socio) return;
    try {
        const base = `/api/puestos?socioId=${socio.id}`;
        const url = buscar ? `${base}&buscar=${encodeURIComponent(buscar)}` : base;
        state.socioPuestos = await apiFetch(url);
        pageState.socioPuestos = 1;
        renderSocioPuestos();
        if (notify) showMessage("Puestos cargados.", "success");
    } catch (error) { handlePageError(error); }
}

function renderSocioPuestos() {
    const tbody = document.getElementById("socioPuestosTable");
    if (!tbody) return;
    const page = paginate(state.socioPuestos, "socioPuestos");
    tbody.innerHTML = page.map(p => `
        <tr>
            <td>${p.id}</td>
            <td><strong>${p.numero}</strong></td>
            <td>${p.categoriaNombre || "-"}</td>
            <td>${p.descripcion || "-"}</td>
            <td>${p.activo ? "Activo" : "Inactivo"}</td>
        </tr>`).join("") || "<tr><td colspan='5' class='muted' style='text-align:center'>Sin puestos asignados.</td></tr>";
    renderPaginator("socioPuestosPage", state.socioPuestos.length, "socioPuestos");
}

async function loadSocioDeudas(notify = true, buscar = "") {
    const socio = getSocioData(); if (!socio) return;
    try {
        const base = `/api/deudas?socioId=${socio.id}`;
        const url = buscar ? `${base}&buscar=${encodeURIComponent(buscar)}` : base;
        state.socioDeudas = await apiFetch(url);
        pageState.socioDeudas = 1;
        renderSocioDeudas();
        if (notify) showMessage("Deudas cargadas.", "success");
    } catch (error) { handlePageError(error); }
}

function renderSocioDeudas() {
    const tbody = document.getElementById("socioDeudasTable");
    if (!tbody) return;
    const page = paginate(state.socioDeudas, "socioDeudas");
    tbody.innerHTML = page.map(d => `
        <tr>
            <td>${d.id}</td>
            <td>${d.fecha || "-"}</td>
            <td>${d.descripcion || "-"}</td>
            <td>${d.estado}</td>
            <td>${formatMoney(d.totalPendiente)}</td>
            <td>${renderDeudaItems(d.items)}</td>
        </tr>`).join("") || "<tr><td colspan='6' class='muted' style='text-align:center'>Sin deudas registradas.</td></tr>";
    renderPaginator("socioDeudasPage", state.socioDeudas.length, "socioDeudas");
}

async function loadSocioPagos(notify = true, buscar = "") {
    const socio = getSocioData(); if (!socio) return;
    try {
        const base = `/api/pagos?socioId=${socio.id}`;
        const url = buscar ? `${base}&buscar=${encodeURIComponent(buscar)}` : base;
        state.socioPagos = await apiFetch(url);
        pageState.socioPagos = 1;
        renderSocioPagos();
        if (notify) showMessage("Pagos cargados.", "success");
    } catch (error) { handlePageError(error); }
}

function renderSocioPagos() {
    const tbody = document.getElementById("socioPagosTable");
    if (!tbody) return;
    const page = paginate(state.socioPagos, "socioPagos");
    tbody.innerHTML = page.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.fecha || "-"}</td>
            <td>${formatMoney(p.montoTotal)}</td>
            <td>${p.observacion || "-"}</td>
            <td>${(p.itemsPagados || []).map(i => i.motivoCobroNombre).join(", ") || "-"}</td>
        </tr>`).join("") || "<tr><td colspan='5' class='muted' style='text-align:center'>Sin pagos registrados.</td></tr>";
    renderPaginator("socioPagosPage", state.socioPagos.length, "socioPagos");
}

// ── Exports globales ──────────────────────────────────────────────────────────

window.editSocio          = editSocio;
window.deleteSocio        = deleteSocio;
window.editPuesto         = editPuesto;
window.deletePuesto       = deletePuesto;
window.editMotivo         = editMotivo;
window.deleteMotivo       = deleteMotivo;
window.editUsuario        = editUsuario;
window.deleteUsuario      = deleteUsuario;
window.goPage             = goPage;
window.removeDeudaItem    = removeDeudaItem;
window.openAddItemsModal  = openAddItemsModal;
