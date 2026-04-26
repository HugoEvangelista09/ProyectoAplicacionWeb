# Arquitectura del Proyecto

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | Java 21 |
| Framework backend | Spring Boot 3.2 |
| ORM | Spring Data JPA + Hibernate |
| Base de datos | MySQL |
| Seguridad | Spring Security + JWT (jjwt) |
| Build | Maven (pom.xml) |
| Frontend | HTML5 / CSS3 / JavaScript puro (vanilla JS) |
| Librerías frontend | SweetAlert2 (modales), jsPDF + jspdf-autotable (PDF), Chart.js (gráficos en dashboard) |
| Contenerización | Docker + docker-compose |

---

## Estructura de carpetas del backend

```
src/main/java/com/asociacion/
├── AsociacionApplication.java          # Punto de entrada Spring Boot
├── config/
│   └── DataInitializer.java            # Carga datos de prueba al iniciar
├── controller/
│   ├── AuthController.java             # POST /api/auth/login y /logout
│   ├── DeudaController.java            # CRUD de deudas
│   ├── MotivoCobroController.java      # CRUD de motivos de cobro
│   ├── PagoController.java             # Registro de pagos
│   ├── PuestoController.java           # CRUD de puestos
│   ├── ReporteController.java          # Reportes PDF/CSV
│   ├── SocioController.java            # CRUD de socios
│   ├── UsuarioController.java          # CRUD de usuarios admin/operador
│   └── GlobalExceptionHandler.java     # Manejo centralizado de errores
├── dto/                                # Data Transfer Objects (request y response)
│   ├── DeudaItemRequestDTO.java
│   ├── DeudaItemResponseDTO.java
│   ├── DeudaMasivaRequestDTO.java
│   ├── DeudaRequestDTO.java
│   ├── DeudaResponseDTO.java
│   ├── LoginRequestDTO.java / LoginResponseDTO.java
│   ├── MotivoCobroRequestDTO.java / MotivoCobroResponseDTO.java
│   ├── PagoRequestDTO.java / PagoResponseDTO.java
│   ├── PuestoRequestDTO.java / PuestoResponseDTO.java
│   ├── SocioRequestDTO.java / SocioResponseDTO.java
│   └── UsuarioRequestDTO.java / UsuarioResponseDTO.java
├── mapper/                             # Conversión Model ↔ DTO (manual, sin MapStruct)
│   ├── DeudaMapper.java
│   ├── MotivoCobroMapper.java
│   ├── PagoMapper.java
│   ├── PuestoMapper.java
│   ├── SocioMapper.java
│   └── UsuarioMapper.java
├── model/                              # Entidades JPA
│   ├── Deuda.java
│   ├── DeudaItem.java
│   ├── EstadoItem.java                 # enum: PENDIENTE | PAGADO
│   ├── MotivoCobro.java
│   ├── Pago.java
│   ├── Puesto.java
│   ├── Socio.java
│   └── Usuario.java
├── repository/                         # Interfaces JpaRepository + queries JPQL
│   ├── DeudaItemRepository.java
│   ├── DeudaRepository.java
│   ├── MotivoCobroRepository.java
│   ├── PagoRepository.java
│   ├── PuestoRepository.java
│   ├── SocioRepository.java
│   └── UsuarioRepository.java
├── security/
│   ├── Constants.java                  # SUPER_SECRET_KEY, TOKEN_BEARER_PREFIX, etc.
│   ├── JWTAuthenticationConfig.java    # Generación del token JWT en login
│   ├── JWTAuthorizationFilter.java     # Filtro que valida el JWT en cada request
│   └── WebSecurityConfig.java          # Configuración de rutas públicas vs protegidas
└── service/
    ├── AuthService.java
    ├── DeudaService.java
    ├── MotivoCobroService.java
    ├── PagoService.java
    ├── PuestoService.java
    ├── ReporteService.java
    ├── SocioService.java
    └── UsuarioService.java
```

---

## Estructura del frontend

```
src/main/resources/static/
├── index.html          # Login (página pública)
├── dashboard.html      # Panel administrador (page=dashboard)
├── socios.html         # Gestión de socios (page=socios)
├── puestos.html        # Gestión de puestos (page=puestos)
├── motivos.html        # Motivos de cobro (page=motivos)
├── deudas.html         # Gestión de deudas (page=deudas)
├── pagos.html          # Registro de pagos (page=pagos)
├── reportes.html       # Reportes PDF/CSV (page=reportes)
├── usuarios.html       # Gestión de usuarios admin (page=usuarios)
├── socio-dashboard.html  # Portal socio - inicio (page=socio-dashboard)
├── socio-puestos.html    # Portal socio - puestos (page=socio-puestos)
├── socio-deudas.html     # Portal socio - deudas (page=socio-deudas)
├── socio-pagos.html      # Portal socio - pagos (page=socio-pagos)
├── app.js              # Toda la lógica JavaScript del frontend
└── styles.css          # Estilos globales con variables CSS
```

---

## Seguridad y autenticación

- El login acepta **dos tipos de usuario**:
  - `Usuario` (administrador u operador) → tabla `usuarios`
  - `Socio` → tabla `socios` (portal de socio, solo lectura de sus propios datos)
- Al hacer login, el backend devuelve un **JWT** que el frontend guarda en `localStorage` con la clave `apromec_token`.
- Todas las peticiones a `/api/**` incluyen el header `Authorization: Bearer <token>`.
- Rutas públicas (sin JWT): `/api/auth/**`, `/`, `/index.html`, y todos los recursos estáticos.
- Si el servidor responde `401`, el frontend llama automáticamente a `logout()` y redirige al login.

---

## Configuración de la base de datos

En `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/apromec
spring.datasource.username=root
spring.datasource.password=...
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Con Docker: `docker-compose up` levanta MySQL en el puerto 3306 y la app en el 8080.
