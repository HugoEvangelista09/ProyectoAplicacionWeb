const AUTH_KEY = "asociacion-auth";
const DEMO_CREDENTIALS = {
    username: "admin",
    password: "admin123",
    name: "Administrador"
};

const state = {
    socios: [],
    puestos: [],
    motivos: [],
    deudas: [],
    pagos: []
};

document.addEventListener("DOMContentLoaded", () => {
    if (isLoginPage()) {
        initLoginPage();
        return;
    }

    guardProtectedPage();
    wireCommonEvents();
    initCurrentPage().catch(handlePageError);
});

function isLoginPage() {
    return window.location.pathname === "/" || window.location.pathname.endsWith("/index.html");
}

function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === "true";
}

function guardProtectedPage() {
    if (!isAuthenticated()) {
        window.location.href = "/index.html";
    }
}

function initLoginPage() {
    if (isAuthenticated()) {
        window.location.href = "/dashboard.html";
        return;
    }

    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");

        if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
            localStorage.setItem(AUTH_KEY, "true");
            localStorage.setItem("asociacion-user", DEMO_CREDENTIALS.name);
            window.location.href = "/dashboard.html";
            return;
        }

        message.textContent = "Credenciales incorrectas. Usa admin / admin123.";
        message.className = "inline-message error";
    });
}

function wireCommonEvents() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
}

async function initCurrentPage() {
    const page = document.body.dataset.page;

    switch (page) {
        case "dashboard":
            wireDashboardEvents();
            await loadDashboard();
            break;
        case "socios":
            wireSociosEvents();
            await loadSocios();
            break;
        case "puestos":
            wirePuestosEvents();
            await Promise.all([loadSocios(false), loadPuestos()]);
            break;
        case "motivos":
            wireMotivosEvents();
            await loadMotivos();
            break;
        case "deudas":
            wireDeudasEvents();
            setToday();
            await Promise.all([loadSocios(false), loadMotivos(false), loadDeudas()]);
            break;
        case "pagos":
            wirePagosEvents();
            await Promise.all([loadSocios(false), loadDeudas(false), loadPagos()]);
            updatePagoItems();
            break;
        case "reportes":
            wireReportesEvents();
            setToday();
            break;
        default:
            break;
    }
}

function wireDashboardEvents() {
    document.getElementById("refreshDashboardBtn")?.addEventListener("click", () => {
        loadDashboard().catch(handlePageError);
    });
}

function wireSociosEvents() {
    document.getElementById("loadSociosBtn")?.addEventListener("click", () => loadSocios().catch(handlePageError));
    document.getElementById("socioForm")?.addEventListener("submit", submitSocioForm);
    document.getElementById("resetSocioBtn")?.addEventListener("click", resetSocioForm);
}

function wirePuestosEvents() {
    document.getElementById("loadPuestosBtn")?.addEventListener("click", () => loadPuestos().catch(handlePageError));
    document.getElementById("puestoForm")?.addEventListener("submit", submitPuestoForm);
    document.getElementById("resetPuestoBtn")?.addEventListener("click", resetPuestoForm);
}

function wireMotivosEvents() {
    document.getElementById("loadMotivosBtn")?.addEventListener("click", () => loadMotivos().catch(handlePageError));
    document.getElementById("motivoForm")?.addEventListener("submit", submitMotivoForm);
    document.getElementById("resetMotivoBtn")?.addEventListener("click", resetMotivoForm);
}

function wireDeudasEvents() {
    document.getElementById("loadDeudasBtn")?.addEventListener("click", () => loadDeudas().catch(handlePageError));
    document.getElementById("deudaForm")?.addEventListener("submit", submitDeudaForm);
}

function wirePagosEvents() {
    document.getElementById("loadPagosBtn")?.addEventListener("click", () => loadPagos().catch(handlePageError));
    document.getElementById("pagoForm")?.addEventListener("submit", submitPagoForm);
    document.getElementById("pagoSocioId")?.addEventListener("change", updatePagoItems);
}

function wireReportesEvents() {
    document.getElementById("reporteCajaForm")?.addEventListener("submit", loadReporteCaja);
    document.getElementById("reporteRangoForm")?.addEventListener("submit", loadReporteRango);
    document.getElementById("reporteDeudaForm")?.addEventListener("submit", loadReporteDeudaSocio);
}

async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof data === "string"
            ? data
            : Object.values(data).join(" | ") || "Ocurrio un error en la solicitud.";
        throw new Error(message);
    }

    return data;
}

function handlePageError(error) {
    showMessage(error.message, "error");
}

function getMessageBox() {
    return document.getElementById("messageBox");
}

function showMessage(message, type = "success") {
    const box = getMessageBox();
    if (!box) return;

    box.textContent = message;
    box.className = `message ${type}`;
    setTimeout(() => {
        box.className = "message hidden";
    }, 3000);
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem("asociacion-user");
    window.location.href = "/index.html";
}

function setToday() {
    const today = new Date().toISOString().split("T")[0];
    setValueIfExists("deudaFecha", today);
    setValueIfExists("reporteCajaFecha", today);
    setValueIfExists("reporteDesde", today);
    setValueIfExists("reporteHasta", today);
}

function setValueIfExists(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

function formatMoney(value) {
    const amount = Number(value || 0);
    return amount.toLocaleString("es-PE", {
        style: "currency",
        currency: "PEN"
    });
}

function socioFullName(socio) {
    return `${socio.nombre} ${socio.apellido}`.trim();
}

function renderSelect(selectId, items, formatter, includeEmptyOption = false, emptyLabel = "Seleccione") {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = includeEmptyOption ? `<option value="">${emptyLabel}</option>` : "";

    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = formatter(item);
        select.appendChild(option);
    });

    if ([...select.options].some((option) => option.value === currentValue)) {
        select.value = currentValue;
    }
}

async function loadDashboard() {
    await Promise.all([
        loadSocios(false),
        loadPuestos(false),
        loadMotivos(false),
        loadDeudas(false),
        loadPagos(false)
    ]);

    document.getElementById("statSocios").textContent = state.socios.length;
    document.getElementById("statPuestos").textContent = state.puestos.length;
    document.getElementById("statMotivos").textContent = state.motivos.filter((item) => item.activo).length;
    document.getElementById("statDeudasPendientes").textContent = state.deudas.filter((item) => item.estado !== "PAGADA").length;

    renderDashboardPagos();
    renderDashboardDeudas();
    showMessage("Resumen actualizado.", "success");
}

function renderDashboardPagos() {
    const tbody = document.getElementById("dashboardPagosTable");
    if (!tbody) return;

    const items = state.pagos.slice(0, 5);
    tbody.innerHTML = items.length
        ? items.map((pago) => `
            <tr>
                <td>${pago.id}</td>
                <td>${pago.socioNombre || pago.socioId}</td>
                <td>${pago.fecha || "-"}</td>
                <td>${formatMoney(pago.montoTotal)}</td>
            </tr>
        `).join("")
        : "<tr><td colspan='4' class='muted'>No hay pagos registrados.</td></tr>";
}

function renderDashboardDeudas() {
    const tbody = document.getElementById("dashboardDeudasTable");
    if (!tbody) return;

    const items = state.deudas.slice(0, 5);
    tbody.innerHTML = items.length
        ? items.map((deuda) => `
            <tr>
                <td>${deuda.id}</td>
                <td>${deuda.socioNombre || deuda.socioId}</td>
                <td>${deuda.estado}</td>
                <td>${formatMoney(deuda.totalPendiente)}</td>
            </tr>
        `).join("")
        : "<tr><td colspan='4' class='muted'>No hay deudas registradas.</td></tr>";
}

async function loadSocios(notify = true) {
    state.socios = await apiFetch("/api/socios");
    renderSocios();
    renderSelect("puestoSocioId", state.socios.filter((item) => item.activo), socioFullName, true, "Pertenece a la asociacion");
    renderSelect("deudaSocioId", state.socios.filter((item) => item.activo), socioFullName);
    renderSelect("pagoSocioId", state.socios.filter((item) => item.activo), socioFullName, true, "Seleccione un socio");
    if (notify) showMessage("Socios cargados.", "success");
}

function renderSocios() {
    const tbody = document.getElementById("sociosTable");
    if (!tbody) return;

    tbody.innerHTML = state.socios.map((socio) => `
        <tr>
            <td>${socio.id}</td>
            <td>${socioFullName(socio)}</td>
            <td>${socio.dni}</td>
            <td>${socio.telefono || "-"}</td>
            <td>${socio.email || "-"}</td>
            <td>${socio.activo ? "Activo" : "Inactivo"}</td>
            <td>
                <div class="table-actions">
                    <button type="button" onclick="editSocio(${socio.id})">Editar</button>
                    <button type="button" class="danger-btn" onclick="deleteSocio(${socio.id})">Desactivar</button>
                </div>
            </td>
        </tr>
    `).join("");
}

async function submitSocioForm(event) {
    event.preventDefault();
    const id = document.getElementById("socioId").value;
    const payload = {
        nombre: document.getElementById("socioNombre").value,
        apellido: document.getElementById("socioApellido").value,
        dni: document.getElementById("socioDni").value,
        telefono: document.getElementById("socioTelefono").value,
        email: document.getElementById("socioEmail").value
    };

    try {
        await apiFetch(id ? `/api/socios/${id}` : "/api/socios", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        resetSocioForm();
        await loadSocios(false);
        showMessage(id ? "Socio actualizado." : "Socio registrado.", "success");
    } catch (error) {
        handlePageError(error);
    }
}

function editSocio(id) {
    const socio = state.socios.find((item) => item.id === id);
    if (!socio) return;

    setValueIfExists("socioId", socio.id);
    setValueIfExists("socioNombre", socio.nombre);
    setValueIfExists("socioApellido", socio.apellido);
    setValueIfExists("socioDni", socio.dni);
    setValueIfExists("socioTelefono", socio.telefono || "");
    setValueIfExists("socioEmail", socio.email || "");
}

async function deleteSocio(id) {
    if (!confirm("Se desactivara este socio. Deseas continuar?")) return;
    try {
        await apiFetch(`/api/socios/${id}`, { method: "DELETE" });
        await loadSocios(false);
        showMessage("Socio desactivado.", "success");
    } catch (error) {
        handlePageError(error);
    }
}

function resetSocioForm() {
    document.getElementById("socioForm")?.reset();
    setValueIfExists("socioId", "");
}

async function loadPuestos(notify = true) {
    state.puestos = await apiFetch("/api/puestos");
    renderPuestos();
    if (notify) showMessage("Puestos cargados.", "success");
}

function renderPuestos() {
    const tbody = document.getElementById("puestosTable");
    if (!tbody) return;

    tbody.innerHTML = state.puestos.map((puesto) => `
        <tr>
            <td>${puesto.id}</td>
            <td>${puesto.numero}</td>
            <td>${puesto.descripcion || "-"}</td>
            <td>${puesto.esDeAsociacion ? "Asociacion" : (puesto.socioNombre || "-")}</td>
            <td>${puesto.activo ? "Activo" : "Inactivo"}</td>
            <td>
                <div class="table-actions">
                    <button type="button" onclick="editPuesto(${puesto.id})">Editar</button>
                    <button type="button" class="danger-btn" onclick="deletePuesto(${puesto.id})">Desactivar</button>
                </div>
            </td>
        </tr>
    `).join("");
}

async function submitPuestoForm(event) {
    event.preventDefault();
    const id = document.getElementById("puestoId").value;
    const socioId = document.getElementById("puestoSocioId").value;
    const payload = {
        numero: document.getElementById("puestoNumero").value,
        descripcion: document.getElementById("puestoDescripcion").value,
        socioId: socioId ? Number(socioId) : null
    };

    try {
        await apiFetch(id ? `/api/puestos/${id}` : "/api/puestos", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        resetPuestoForm();
        await loadPuestos(false);
        showMessage(id ? "Puesto actualizado." : "Puesto registrado.", "success");
    } catch (error) {
        handlePageError(error);
    }
}

function editPuesto(id) {
    const puesto = state.puestos.find((item) => item.id === id);
    if (!puesto) return;

    setValueIfExists("puestoId", puesto.id);
    setValueIfExists("puestoNumero", puesto.numero);
    setValueIfExists("puestoDescripcion", puesto.descripcion || "");
    setValueIfExists("puestoSocioId", puesto.socioId || "");
}

async function deletePuesto(id) {
    if (!confirm("Se desactivara este puesto. Deseas continuar?")) return;
    try {
        await apiFetch(`/api/puestos/${id}`, { method: "DELETE" });
        await loadPuestos(false);
        showMessage("Puesto desactivado.", "success");
    } catch (error) {
        handlePageError(error);
    }
}

function resetPuestoForm() {
    document.getElementById("puestoForm")?.reset();
    setValueIfExists("puestoId", "");
}

async function loadMotivos(notify = true) {
    state.motivos = await apiFetch("/api/motivos-cobro?soloActivos=false");
    renderMotivos();
    renderSelect("deudaMotivoId", state.motivos.filter((item) => item.activo), (item) => item.nombre);
    if (notify) showMessage("Motivos cargados.", "success");
}

function renderMotivos() {
    const tbody = document.getElementById("motivosTable");
    if (!tbody) return;

    tbody.innerHTML = state.motivos.map((motivo) => `
        <tr>
            <td>${motivo.id}</td>
            <td>${motivo.nombre}</td>
            <td>${motivo.descripcion || "-"}</td>
            <td>${motivo.activo ? "Activo" : "Inactivo"}</td>
            <td>
                <div class="table-actions">
                    <button type="button" onclick="editMotivo(${motivo.id})">Editar</button>
                    <button type="button" class="danger-btn" onclick="deleteMotivo(${motivo.id})">Desactivar</button>
                </div>
            </td>
        </tr>
    `).join("");
}

async function submitMotivoForm(event) {
    event.preventDefault();
    const id = document.getElementById("motivoId").value;
    const payload = {
        nombre: document.getElementById("motivoNombre").value,
        descripcion: document.getElementById("motivoDescripcion").value
    };

    try {
        await apiFetch(id ? `/api/motivos-cobro/${id}` : "/api/motivos-cobro", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        resetMotivoForm();
        await loadMotivos(false);
        showMessage(id ? "Motivo actualizado." : "Motivo registrado.", "success");
    } catch (error) {
        handlePageError(error);
    }
}

function editMotivo(id) {
    const motivo = state.motivos.find((item) => item.id === id);
    if (!motivo) return;

    setValueIfExists("motivoId", motivo.id);
    setValueIfExists("motivoNombre", motivo.nombre);
    setValueIfExists("motivoDescripcion", motivo.descripcion || "");
}

async function deleteMotivo(id) {
    if (!confirm("Se desactivara este motivo. Deseas continuar?")) return;
    try {
        await apiFetch(`/api/motivos-cobro/${id}`, { method: "DELETE" });
        await loadMotivos(false);
        showMessage("Motivo desactivado.", "success");
    } catch (error) {
        handlePageError(error);
    }
}

function resetMotivoForm() {
    document.getElementById("motivoForm")?.reset();
    setValueIfExists("motivoId", "");
}

async function loadDeudas(notify = true) {
    state.deudas = await apiFetch("/api/deudas");
    renderDeudas();
    updatePagoItems();
    if (notify) showMessage("Deudas cargadas.", "success");
}

function renderDeudas() {
    const tbody = document.getElementById("deudasTable");
    if (!tbody) return;

    tbody.innerHTML = state.deudas.map((deuda) => `
        <tr>
            <td>${deuda.id}</td>
            <td>${deuda.socioNombre || deuda.socioId}</td>
            <td>${deuda.fecha || "-"}</td>
            <td>${deuda.descripcion || "-"}</td>
            <td>${deuda.estado}</td>
            <td>${formatMoney(deuda.totalPendiente)}</td>
            <td>${renderDeudaItems(deuda.items)}</td>
        </tr>
    `).join("");
}

function renderDeudaItems(items = []) {
    if (!items.length) {
        return "<span class='muted'>Sin items</span>";
    }

    return items.map((item) => `
        <div>
            <strong>${item.motivoCobroNombre}</strong> - ${formatMoney(item.monto)} - ${item.estado}
        </div>
    `).join("");
}

async function submitDeudaForm(event) {
    event.preventDefault();
    const payload = {
        socioId: Number(document.getElementById("deudaSocioId").value),
        fecha: document.getElementById("deudaFecha").value || null,
        descripcion: document.getElementById("deudaDescripcion").value,
        items: [
            {
                motivoCobroId: Number(document.getElementById("deudaMotivoId").value),
                monto: Number(document.getElementById("deudaMonto").value),
                observacion: document.getElementById("deudaObservacion").value
            }
        ]
    };

    try {
        await apiFetch("/api/deudas", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        document.getElementById("deudaForm")?.reset();
        setToday();
        await loadDeudas(false);
        showMessage("Deuda registrada.", "success");
    } catch (error) {
        handlePageError(error);
    }
}

async function loadPagos(notify = true) {
    state.pagos = await apiFetch("/api/pagos");
    renderPagos();
    if (notify) showMessage("Pagos cargados.", "success");
}

function renderPagos() {
    const tbody = document.getElementById("pagosTable");
    if (!tbody) return;

    tbody.innerHTML = state.pagos.map((pago) => `
        <tr>
            <td>${pago.id}</td>
            <td>${pago.socioNombre || pago.socioId}</td>
            <td>${pago.fecha || "-"}</td>
            <td>${formatMoney(pago.montoTotal)}</td>
            <td>${pago.observacion || "-"}</td>
            <td>${(pago.itemsPagados || []).map((item) => item.motivoCobroNombre).join(", ") || "-"}</td>
        </tr>
    `).join("");
}

function updatePagoItems() {
    const container = document.getElementById("pagoItemsContainer");
    const select = document.getElementById("pagoSocioId");
    if (!container || !select) return;

    const socioId = Number(select.value);
    if (!socioId) {
        container.innerHTML = "<p class='muted'>Selecciona un socio para ver los items pendientes.</p>";
        return;
    }

    const deudasSocio = state.deudas.filter((deuda) => deuda.socioId === socioId);
    const pendientes = deudasSocio.flatMap((deuda) =>
        (deuda.items || []).filter((item) => item.estado === "PENDIENTE").map((item) => ({
            ...item,
            deudaDescripcion: deuda.descripcion,
            deudaFecha: deuda.fecha
        }))
    );

    if (!pendientes.length) {
        container.innerHTML = "<p class='muted'>Este socio no tiene items pendientes.</p>";
        return;
    }

    container.innerHTML = pendientes.map((item) => `
        <label class="checkbox-item">
            <input type="checkbox" value="${item.id}">
            <span>
                <strong>${item.motivoCobroNombre}</strong><br>
                ${formatMoney(item.monto)} | ${item.deudaFecha || "-"} | ${item.deudaDescripcion || "-"}
            </span>
        </label>
    `).join("");
}

async function submitPagoForm(event) {
    event.preventDefault();
    const socioId = Number(document.getElementById("pagoSocioId").value);
    const container = document.getElementById("pagoItemsContainer");
    const deudaItemIds = [...container.querySelectorAll("input:checked")].map((input) => Number(input.value));

    const payload = {
        socioId,
        deudaItemIds,
        observacion: document.getElementById("pagoObservacion").value
    };

    try {
        await apiFetch("/api/pagos", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        document.getElementById("pagoForm")?.reset();
        await Promise.all([loadPagos(false), loadDeudas(false)]);
        updatePagoItems();
        showMessage("Pago registrado.", "success");
    } catch (error) {
        handlePageError(error);
    }
}

async function loadReporteCaja(event) {
    event.preventDefault();
    const fecha = document.getElementById("reporteCajaFecha").value;
    await renderReport(`/api/reportes/caja?fecha=${fecha}`);
}

async function loadReporteRango(event) {
    event.preventDefault();
    const desde = document.getElementById("reporteDesde").value;
    const hasta = document.getElementById("reporteHasta").value;
    await renderReport(`/api/reportes/caja/rango?desde=${desde}&hasta=${hasta}`);
}

async function loadReporteDeudaSocio(event) {
    event.preventDefault();
    await renderReport("/api/reportes/deudas-por-socio");
}

async function renderReport(url) {
    try {
        const data = await apiFetch(url);
        const output = document.getElementById("reportesOutput");
        if (output) {
            output.textContent = JSON.stringify(data, null, 2);
        }
    } catch (error) {
        handlePageError(error);
    }
}

window.editSocio = editSocio;
window.deleteSocio = deleteSocio;
window.editPuesto = editPuesto;
window.deletePuesto = deletePuesto;
window.editMotivo = editMotivo;
window.deleteMotivo = deleteMotivo;
