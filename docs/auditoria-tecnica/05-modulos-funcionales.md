# 05 — Módulos funcionales y estado real

## 1. Criterio de estado

- **IMPLEMENTADO:** existe interfaz, endpoint, lógica y persistencia, y se encontró conexión entre capas.
- **PARCIAL:** existe parte del flujo o solo una representación limitada.
- **NO IMPLEMENTADO:** no hay código funcional.
- **SOLO BACKEND:** hay lógica/endpoint, pero no se encontró uso en la interfaz.
- **PLANIFICADO:** solo aparece en documentación o tareas.

## 2. Matriz de módulos

| Módulo | Funcionalidad encontrada | Frontend | Backend | Base de datos | Estado | Observaciones |
|---|---|---|---|---|---|---|
| Autenticación y acceso | Login, logout, sesión, CSRF, cambio de contraseña | `features/auth`, `/login`, `/cambiar-password` | `AuthController`, `AuthService` | `users` | IMPLEMENTADO | Cookie HttpOnly; sin JWT/OAuth |
| Registro de ojeador | Registro público y aprobación/rechazo | `/registro/ojeador`, `/admin/solicitudes-ojeador` | `ScoutRegistrationService`, `ScoutRegistrationAdminService` | `users` | IMPLEMENTADO | La cuenta pública queda pendiente |
| Usuarios y roles | Alta, edición, asignación, estado, reset de contraseña | `/admin/usuarios`, `/usuarios/nuevo` | `AdminUserController`, `UserManagementService` | `users`, `user_organizations` | IMPLEMENTADO | PLAYER ya no se crea desde Usuarios |
| Academias | Alta, edición, estados, verificación y consulta | `/admin/academias`, `/academias` | `AdminAcademyController`, `AcademyService` | `academies` | IMPLEMENTADO | La verificación solo la cambia ADMIN |
| Sedes de academias | Campo textual `headquarters` | Formulario de academia | `Academy` | `academies.headquarters` | PARCIAL | No hay entidad de múltiples sedes |
| Profesores | Cuentas con rol PROFESSOR y asignación a academia | Creación por Director | `AcademyUserController`, `UserManagementService` | `users`, `user_organizations` | IMPLEMENTADO | No existe perfil académico independiente |
| Clubes | Alta, edición, estados, verificación y consulta | `/admin/clubes`, `/clubes` | `AdminClubController`, `ClubService` | `clubs` | IMPLEMENTADO | Responsables derivados de `UserOrganization` |
| Responsables de club | Cuenta CLUB_MANAGER, club y cargo | `/mi-club` | `ClubScopeController` | `users`, `user_organizations` | IMPLEMENTADO | Un responsable por cuenta; un club puede tener varios |
| Aspirantes | No existe entidad ni módulo específico | No | No | No | NO IMPLEMENTADO | `Prospect` es seguimiento de ojeador, no un aspirante |
| Jugadores | Alta cuenta + perfil, edición, estados y consulta | `/jugadores`, `/jugadores/nuevo` | `PlayerController`, `PlayerAccountService`, `PlayerProfileService` | `users`, `player_profiles`, `user_organizations` | IMPLEMENTADO | Alta transaccional desde el módulo Jugadores |
| Historial deportivo | Actividades, métricas, ratings, video URL, revisiones | Ficha → Trayectoria | `PlayerHistoryController`, `PlayerHistoryService` | `player_history_entries`, `player_history_metrics`, `player_history_revisions` | IMPLEMENTADO | Historial append-only y correcciones auditadas |
| Tutor y consentimiento | Datos restringidos y eventos de consentimiento | `/jugadores/[id]/tutor` | `PlayerGuardianController`, `PlayerGuardianService` | `player_guardians`, `player_guardian_consent_events` | IMPLEMENTADO | Admin/Player no acceden a tutor por servicio |
| Búsqueda de jugadores | Filtros por nombre, posición, edad, ubicación y academia | `/jugadores` | `PlayerController.list` | `player_profiles`, `user_organizations` | IMPLEMENTADO | Tarjetas y paginación |
| Ojeadores | Cuenta SCOUT, prospección privada | `/prospecciones` | `ProspectService` | `prospects` | IMPLEMENTADO | No hay tabla `Ojeador` separada |
| Scouting / seguimiento | Estados FOLLOWING, PAUSED, CLOSED; notas privadas | `/prospecciones/[id]` | `ProspectController` | `prospects` | IMPLEMENTADO | Contenido solo del autor |
| Evaluación deportiva | Ratings 1–5, fortalezas, mejoras, nota privada y video | `/prospecciones/[id]/evaluaciones/nueva` | `ProspectController` | `prospect_evaluations` | IMPLEMENTADO | Registros inmutables |
| Envío de prospectos a clubes | Carta, selección, snapshot y respuesta | `/prospecciones/[id]/recomendaciones/nueva`, `/mi-club/recomendaciones` | `RecommendationService` | `recommendations`, joins y `recommendation_responses` | IMPLEMENTADO | ADMIN solo ve metadatos |
| Gestión de fotografías y videos | URL de foto/logo/video | Formularios y fichas | No hay upload | Campos URL | PARCIAL | No hay almacenamiento binario ni borrado |
| Directorio de organizaciones | Consulta de academias/clubes activos y verificados | `/academias`, `/clubes` | `OrganizationDirectoryController` | `academies`, `clubs` | IMPLEMENTADO | Solo lectura; sin datos sensibles |
| Estadísticas deportivas | Agregados por actividad, posición y año | Ficha → Estadísticas | `PlayerStatsController`, `PlayerStatsService` | `player_history_entries` y métricas | IMPLEMENTADO | No se inventan datos desconocidos |
| Catálogo UBIGEO | Departamentos, provincias y distritos | Selectores de ubicación | `UbigeoController` | CSV local, no tabla | IMPLEMENTADO | No hay servicio externo en runtime |
| Recomendaciones: auditoría | Metadatos para Admin | `/admin/recomendaciones` | `AdminRecommendationController` | `recommendations` | IMPLEMENTADO | Sin carta, snapshot ni notas privadas |
| Configuración | Cambio de contraseña aislado | `/cambiar-password` | `AuthController` | `users` | PARCIAL | No existe módulo de configuración general |
| Reportes / analítica | No hay módulo | No | No | No | NO IMPLEMENTADO | Solo estadísticas deportivas del jugador |
| Notificaciones / correo | No hay servicio | No | No | No | NO IMPLEMENTADO | No hay SMTP ni bandeja de avisos |
| Auditoría de accesos | No hay tabla o panel | No | No | No | NO IMPLEMENTADO | Existen snapshots y revisiones de negocio |
| IA / scoring automático | No hay implementación | No | No | No | NO IMPLEMENTADO | No hay modelos ni servicios |

## 3. Flujos conectados de extremo a extremo

1. **Login y sesión:** formulario → `AuthController` → `AuthService` → `users`.
2. **Alta de jugador:** formulario → `POST /players/with-account` → `PlayerAccountService` → `UserManagementService` + `PlayerProfileService` → `users`, `user_organizations`, `player_profiles`.
3. **Historial:** ficha → formulario → `PlayerHistoryService` → `player_history_entries` + métricas + revisión.
4. **Prospección:** ficha de jugador → “Seguir” → `POST /prospects` → `prospects`.
5. **Evaluación:** detalle de prospección → formulario → `POST /prospects/{id}/evaluations` → `prospect_evaluations`.
6. **Recomendación:** prospección → selección de club/historial/evaluaciones → backend valida y congela snapshot → `recommendations`.
7. **Respuesta de club:** bandeja → formulario → `POST /clubs/me/recommendations/{id}/responses` → `recommendation_responses`.

## 4. Componentes parciales o no conectados

- `GET /players/account-candidates`: endpoint y servicio existen, pero la pantalla de Nuevo jugador ya no usa la selección de cuentas candidatas.
- `GET /players/{playerId}/history/{historyId}/revisions`: endpoint disponible, sin pantalla específica identificada.
- `GET /prospects/{id}/evaluations/{evaluationId}`: endpoint disponible, sin uso frontend identificado.
- Sedes: solo un campo de texto, no una gestión de sedes.
- Archivos: solo URLs; no carga ni almacenamiento.
- Configuración general: no existe; solo cambio de contraseña.

## 5. Conclusión

El núcleo funcional del MVP está implementado de extremo a extremo: autenticación, usuarios, organizaciones, jugadores, historial, prospección, evaluación y recomendaciones. Los módulos de configuración, reportes, notificaciones, analítica, IA y almacenamiento de archivos no forman parte de la implementación actual.
