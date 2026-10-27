# 04 — Estructura del backend y API

## 1. Punto de entrada y organización

Punto de entrada: `backend/scouting/src/main/java/com/scouting/scouting/ScoutingApplication.java`.

Paquetes principales:

| Paquete | Responsabilidad |
|---|---|
| `auth` | Login, logout, CSRF, registro de ojeador, cambio de contraseña y bootstrap |
| `security` | Configuración de Spring Security, principal, filtro de estado y errores de seguridad |
| `user` | Cuentas, roles, asignaciones y contraseñas temporales |
| `organization` | Academias, clubes, ubicación, verificación y consulta |
| `player` | Perfil, tutor, consentimiento, historial, métricas y estadísticas |
| `prospecting` | Prospección privada y evaluaciones |
| `recommendation` | Recomendaciones, snapshot y respuestas |
| `admin` | Aprobación/rechazo de solicitudes de ojeador |
| `ubigeo` | Catálogo local de departamentos, provincias y distritos |
| `exception` | Manejo uniforme de errores |
| `validation` | Validadores personalizados, por ejemplo URL HTTP |
| `config` | Propiedades de bootstrap y CORS |

## 2. Configuración principal

Archivo: `backend/scouting/src/main/resources/application.properties`.

- MySQL como datasource.
- `ddl-auto` configurable; valor por defecto `update`.
- `open-in-view=false`.
- Cookie HttpOnly, `SameSite=Lax`, timeout de 30 minutos.
- `SESSION_COOKIE_SECURE` configurable.
- CORS con orígenes configurables.
- Mensajes y stack traces deshabilitados en respuestas de error.
- Logging SQL de Hibernate en nivel debug.

Archivo `application-prod.properties`: refuerza `server.servlet.session.cookie.secure=true`.

## 3. Endpoints identificados

Convenciones:

- “Sesión” significa cookie de sesión válida.
- “+ CSRF” significa que la escritura requiere token CSRF.
- La autorización se aplica en `SecurityConfig`, con `@PreAuthorize` y, en varios casos, con validaciones adicionales de alcance en servicios.

| Método | Ruta | Controlador | Función | Autenticación | Roles autorizados | Estado |
|---|---|---|---|---|---|---|
| GET | `/api/v1/auth/csrf` | `AuthController` | Obtener token CSRF | Público | Todos | IMPLEMENTADO |
| POST | `/api/v1/auth/login` | `AuthController` | Iniciar sesión | Público + CSRF | Todos | IMPLEMENTADO |
| POST | `/api/v1/auth/register/scout` | `AuthController` | Registro público de ojeador | Público + CSRF | Todos | IMPLEMENTADO |
| GET | `/api/v1/auth/me` | `AuthController` | Usuario autenticado | Sesión | Todos | IMPLEMENTADO |
| POST | `/api/v1/auth/change-password` | `AuthController` | Cambiar contraseña | Sesión + CSRF | Todos | IMPLEMENTADO |
| POST | `/api/v1/auth/logout` | `AuthController` | Cerrar sesión | Sesión + CSRF | Todos | IMPLEMENTADO |
| GET | `/api/v1/admin/scout-registrations` | `ScoutRegistrationAdminController` | Listar solicitudes de ojeador | Sesión | ADMIN | IMPLEMENTADO |
| POST | `/api/v1/admin/scout-registrations/{id}/approve` | `ScoutRegistrationAdminController` | Aprobar solicitud | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| POST | `/api/v1/admin/scout-registrations/{id}/reject` | `ScoutRegistrationAdminController` | Rechazar solicitud | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| GET | `/api/v1/admin/academies` | `AdminAcademyController` | Listar academias | Sesión | ADMIN | IMPLEMENTADO |
| POST | `/api/v1/admin/academies` | `AdminAcademyController` | Crear academia | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| GET | `/api/v1/admin/academies/{id}` | `AdminAcademyController` | Detalle de academia | Sesión | ADMIN | IMPLEMENTADO |
| PUT | `/api/v1/admin/academies/{id}` | `AdminAcademyController` | Editar academia | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| PATCH | `/api/v1/admin/academies/{id}/deactivate` | `AdminAcademyController` | Inhabilitar academia | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| PATCH | `/api/v1/admin/academies/{id}/reactivate` | `AdminAcademyController` | Reactivar academia | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| PATCH | `/api/v1/admin/academies/{id}/verification` | `AdminAcademyController` | Cambiar verificación | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| GET | `/api/v1/admin/clubs` | `AdminClubController` | Listar clubes | Sesión | ADMIN | IMPLEMENTADO |
| POST | `/api/v1/admin/clubs` | `AdminClubController` | Crear club | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| GET | `/api/v1/admin/clubs/{id}` | `AdminClubController` | Detalle de club | Sesión | ADMIN | IMPLEMENTADO |
| PUT | `/api/v1/admin/clubs/{id}` | `AdminClubController` | Editar club | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| PATCH | `/api/v1/admin/clubs/{id}/deactivate` | `AdminClubController` | Inhabilitar club | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| PATCH | `/api/v1/admin/clubs/{id}/reactivate` | `AdminClubController` | Reactivar club | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| PATCH | `/api/v1/admin/clubs/{id}/verification` | `AdminClubController` | Cambiar verificación | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| GET | `/api/v1/academies/me` | `AcademyScopeController` | Academia propia | Sesión | ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO |
| PUT | `/api/v1/academies/me` | `AcademyScopeController` | Editar academia propia | Sesión + CSRF | ACADEMY_DIRECTOR | IMPLEMENTADO |
| PATCH | `/api/v1/academies/me/deactivate` | `AcademyScopeController` | Inhabilitar academia propia | Sesión + CSRF | ACADEMY_DIRECTOR | IMPLEMENTADO |
| GET | `/api/v1/clubs/me` | `ClubScopeController` | Club propio | Sesión | CLUB_MANAGER | IMPLEMENTADO |
| PUT | `/api/v1/clubs/me` | `ClubScopeController` | Editar club propio | Sesión + CSRF | CLUB_MANAGER | IMPLEMENTADO |
| PATCH | `/api/v1/clubs/me/deactivate` | `ClubScopeController` | Inhabilitar club propio | Sesión + CSRF | CLUB_MANAGER | IMPLEMENTADO |
| GET | `/api/v1/directory/academies` | `OrganizationDirectoryController` | Consultar academias activas/verificadas | Sesión | ADMIN, SCOUT | IMPLEMENTADO |
| GET | `/api/v1/directory/academies/{id}` | `OrganizationDirectoryController` | Detalle de academia | Sesión | ADMIN, SCOUT | IMPLEMENTADO |
| GET | `/api/v1/directory/clubs` | `OrganizationDirectoryController` | Consultar clubes activos/verificados | Sesión | ADMIN, SCOUT | IMPLEMENTADO |
| GET | `/api/v1/directory/clubs/{id}` | `OrganizationDirectoryController` | Detalle de club | Sesión | ADMIN, SCOUT | IMPLEMENTADO |
| GET | `/api/v1/players` | `PlayerController` | Listar/buscar jugadores | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR, SCOUT | IMPLEMENTADO |
| GET | `/api/v1/players/account-candidates` | `PlayerController` | Cuentas PLAYER sin perfil | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO — sin uso frontend actual |
| POST | `/api/v1/players` | `PlayerController` | Crear perfil para cuenta existente | Sesión + CSRF | ADMIN, ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO |
| POST | `/api/v1/players/with-account` | `PlayerController` | Crear cuenta PLAYER + perfil | Sesión + CSRF | ADMIN, ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO |
| GET | `/api/v1/players/me` | `PlayerController` | Perfil propio | Sesión | PLAYER | IMPLEMENTADO |
| GET | `/api/v1/players/{id}` | `PlayerController` | Detalle según rol | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR, SCOUT, PLAYER | IMPLEMENTADO |
| PUT | `/api/v1/players/{id}` | `PlayerController` | Editar perfil | Sesión + CSRF | ADMIN, ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO |
| PATCH | `/api/v1/players/{id}/status` | `PlayerController` | Cambiar estado del perfil | Sesión + CSRF | ADMIN, ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO |
| GET | `/api/v1/players/{playerId}/guardian` | `PlayerGuardianController` | Consultar tutor | Sesión | ACADEMY_DIRECTOR, PROFESSOR, SCOUT; la anotación también incluye ADMIN y PLAYER, pero el servicio los deniega | IMPLEMENTADO |
| PUT | `/api/v1/players/{playerId}/guardian` | `PlayerGuardianController` | Registrar/editar tutor | Sesión + CSRF | ACADEMY_DIRECTOR, PROFESSOR; anotación amplia, servicio restrictivo | IMPLEMENTADO |
| PUT | `/api/v1/players/{playerId}/guardian/consent` | `PlayerGuardianController` | Registrar consentimiento | Sesión + CSRF | ACADEMY_DIRECTOR, PROFESSOR; anotación amplia, servicio restrictivo | IMPLEMENTADO |
| GET | `/api/v1/players/{playerId}/history` | `PlayerHistoryController` | Listar historial | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR, SCOUT, PLAYER | IMPLEMENTADO |
| POST | `/api/v1/players/{playerId}/history` | `PlayerHistoryController` | Nueva entrada | Sesión + CSRF | ADMIN, ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO |
| GET | `/api/v1/players/{playerId}/history/{historyId}` | `PlayerHistoryController` | Detalle de entrada | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR, SCOUT, PLAYER | IMPLEMENTADO |
| PUT | `/api/v1/players/{playerId}/history/{historyId}` | `PlayerHistoryController` | Corregir entrada | Sesión + CSRF | ADMIN, ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO |
| GET | `/api/v1/players/{playerId}/history/{historyId}/revisions` | `PlayerHistoryController` | Ver revisiones | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO — sin uso frontend identificado |
| GET | `/api/v1/players/{playerId}/stats` | `PlayerStatsController` | Estadísticas | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR, SCOUT, PLAYER | IMPLEMENTADO |
| GET | `/api/v1/prospects` | `ProspectController` | Listar prospecciones propias | Sesión | SCOUT | IMPLEMENTADO |
| POST | `/api/v1/prospects` | `ProspectController` | Iniciar prospección | Sesión + CSRF | SCOUT | IMPLEMENTADO |
| GET | `/api/v1/prospects/{id}` | `ProspectController` | Detalle | Sesión | SCOUT | IMPLEMENTADO |
| PATCH | `/api/v1/prospects/{id}` | `ProspectController` | Actualizar notas privadas | Sesión + CSRF | SCOUT | IMPLEMENTADO |
| PATCH | `/api/v1/prospects/{id}/status` | `ProspectController` | Cambiar estado | Sesión + CSRF | SCOUT | IMPLEMENTADO |
| GET | `/api/v1/prospects/{id}/evaluations` | `ProspectController` | Listar evaluaciones | Sesión | SCOUT | IMPLEMENTADO |
| POST | `/api/v1/prospects/{id}/evaluations` | `ProspectController` | Crear evaluación | Sesión + CSRF | SCOUT | IMPLEMENTADO |
| GET | `/api/v1/prospects/{id}/evaluations/{evaluationId}` | `ProspectController` | Detalle de evaluación | Sesión | SCOUT | IMPLEMENTADO — sin uso frontend identificado |
| GET | `/api/v1/prospects/{prospectId}/recommendations` | `ProspectRecommendationController` | Listar recomendaciones del prospecto | Sesión | SCOUT | IMPLEMENTADO |
| POST | `/api/v1/prospects/{prospectId}/recommendations` | `ProspectRecommendationController` | Enviar recomendación | Sesión + CSRF | SCOUT | IMPLEMENTADO |
| GET | `/api/v1/recommendations/{id}` | `ScoutRecommendationController` | Detalle para el ojeador autor | Sesión | SCOUT | IMPLEMENTADO |
| GET | `/api/v1/clubs/me/recommendations` | `ClubRecommendationController` | Bandeja del club | Sesión | CLUB_MANAGER | IMPLEMENTADO |
| GET | `/api/v1/clubs/me/recommendations/{id}` | `ClubRecommendationController` | Detalle para el club | Sesión | CLUB_MANAGER | IMPLEMENTADO |
| POST | `/api/v1/clubs/me/recommendations/{id}/responses` | `ClubRecommendationController` | Responder recomendación | Sesión + CSRF | CLUB_MANAGER | IMPLEMENTADO |
| GET | `/api/v1/admin/recommendations` | `AdminRecommendationController` | Metadatos de auditoría | Sesión | ADMIN | IMPLEMENTADO |
| GET | `/api/v1/admin/recommendations/{id}` | `AdminRecommendationController` | Metadatos de una recomendación | Sesión | ADMIN | IMPLEMENTADO |
| GET | `/api/v1/admin/users` | `AdminUserController` | Listar usuarios | Sesión | ADMIN | IMPLEMENTADO |
| GET | `/api/v1/admin/users/{id}` | `AdminUserController` | Detalle de usuario | Sesión | ADMIN | IMPLEMENTADO |
| POST | `/api/v1/admin/users` | `AdminUserController` | Crear usuario interno | Sesión + CSRF | ADMIN | IMPLEMENTADO — PLAYER rechazado |
| PUT | `/api/v1/admin/users/{id}` | `AdminUserController` | Editar identidad | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| PATCH | `/api/v1/admin/users/{id}/assignment` | `AdminUserController` | Cambiar rol/organización | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| PATCH | `/api/v1/admin/users/{id}/status` | `AdminUserController` | Activar/inhabilitar | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| POST | `/api/v1/admin/users/{id}/reset-password` | `AdminUserController` | Reset de contraseña temporal | Sesión + CSRF | ADMIN | IMPLEMENTADO |
| POST | `/api/v1/academies/me/users` | `AcademyUserController` | Crear usuario en academia propia | Sesión + CSRF | ACADEMY_DIRECTOR, PROFESSOR | IMPLEMENTADO — PLAYER rechazado; Profesor sin roles creables |
| GET | `/api/v1/ubigeo/departments` | `UbigeoController` | Departamentos | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR, CLUB_MANAGER, SCOUT | IMPLEMENTADO |
| GET | `/api/v1/ubigeo/provinces` | `UbigeoController` | Provincias por departamento | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR, CLUB_MANAGER, SCOUT | IMPLEMENTADO |
| GET | `/api/v1/ubigeo/districts` | `UbigeoController` | Distritos por provincia | Sesión | ADMIN, ACADEMY_DIRECTOR, PROFESSOR, CLUB_MANAGER, SCOUT | IMPLEMENTADO |

## 4. Servicios de negocio

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Login, usuario actual, cambio de contraseña y logout |
| `BootstrapAdminService` | Crear el administrador inicial desde variables de entorno |
| `ScoutRegistrationService` | Registro público de ojeador |
| `ScoutRegistrationAdminService` | Aprobación/rechazo de solicitudes |
| `UserManagementService` | CRUD de identidad, roles, asignaciones y contraseñas temporales |
| `AcademyService` / `ClubService` | Creación, edición, estados y verificación |
| `OrganizationDirectoryService` | Consulta de organizaciones activas/verificadas |
| `OrganizationScopeService` | Resolver academia/club desde la sesión |
| `PlayerAccessService` | Alcance y permisos sobre perfiles |
| `PlayerAccountService` | Alta transaccional de cuenta PLAYER + perfil |
| `PlayerProfileService` | Perfil, búsqueda, detalle y estado |
| `PlayerGuardianService` | Tutor y consentimiento |
| `PlayerHistoryService` | Historial, validaciones, correcciones y revisiones |
| `PlayerStatsService` | Estadísticas derivadas |
| `ProspectService` | Prospección privada y evaluaciones |
| `RecommendationService` | Recomendaciones, snapshot y respuestas |
| `OrganizationMapper` / `PlayerMapper` / `RecommendationMapper` | Conversión a DTOs |

## 5. Persistencia

- Spring Data JPA con Hibernate.
- Repositorios por agregado.
- Entidades con `@Version` para bloqueo optimista.
- Bloqueos pesimistas en operaciones sensibles (`findByIdForUpdate`, etc.).
- `ddl-auto=update` en configuración local.
- No hay Flyway/Liquibase.
- Los snapshots JSON requieren columnas `LONGTEXT`; una base antigua puede conservar tipos cortos si no se migra manualmente.

## 6. Validación y errores

- Bean Validation en DTOs (`@NotNull`, `@NotBlank`, `@Size`, `@Pattern`, `@Min`, `@Max`, `@HttpUrl`).
- `@Valid` en controllers.
- Reglas de negocio adicionales en servicios.
- `GlobalExceptionHandler` transforma errores en un cuerpo uniforme con `timestamp`, `status`, `code`, `message`, `path` y `fieldErrors`.
- Respuestas de seguridad sin stack trace.
- No hay OpenAPI/Swagger.

## 7. Dependencias externas del backend

- `spring-boot-starter-security`
- `spring-boot-starter-webmvc`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`
- `mysql-connector-j`
- `lombok`
- pruebas: `spring-boot-starter-security-test`, `spring-boot-starter-webmvc-test`, `h2`

No hay cliente de correo, SDK cloud, librería de almacenamiento, analítica ni IA.
