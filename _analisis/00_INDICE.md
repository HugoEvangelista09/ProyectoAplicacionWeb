# Análisis del Proyecto — APROMEC
**Asociación de Comerciantes del Mercado**

Carpeta de análisis técnico completo del proyecto. Leer en este orden para retomar trabajo sin re-explorar el código.

---

## Archivos en esta carpeta

| Archivo | Contenido |
|---|---|
| `01_arquitectura.md` | Stack, estructura de carpetas, configuración, seguridad |
| `02_modelos_base_datos.md` | Entidades, campos, relaciones entre tablas |
| `03_flujo_deudas_pagos.md` | Flujo completo de deudas, ítems y pagos con máquina de estados |
| `04_api_endpoints.md` | Todos los endpoints REST disponibles con parámetros |
| `05_frontend.md` | Páginas HTML, funciones clave de app.js, estado global |
| `06_cambios_realizados.md` | Historial detallado de todos los cambios hechos en el proyecto |

---

## Resumen rápido del proyecto

- **Nombre**: APROMEC (Asociación de Comerciantes)
- **Tipo**: Aplicación web de gestión interna (socios, puestos, cobros, pagos)
- **Backend**: Spring Boot 3.2 + Java 21 + JPA + MySQL
- **Frontend**: HTML/CSS/JS puro (sin framework), servido como recursos estáticos
- **Autenticación**: JWT (token en `localStorage`)
- **Puerto local**: `http://localhost:8080`
- **Rama de trabajo**: `dany-1`

---

## Estado actual del proyecto (al 2026-04-26)

Todos los cambios listados en `06_cambios_realizados.md` están **implementados y commiteados**.
No hay tareas pendientes críticas; el proyecto compila y corre correctamente.
