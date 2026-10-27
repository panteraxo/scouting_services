# 07 — Autenticación, autorización y seguridad

## 1. Autenticación

- Método: correo y contraseña.
- Implementación: Spring Security con `DaoAuthenticationProvider`.
- Login: `POST /api/v1/auth/login`.
- La sesión se guarda en el servidor y el navegador recibe una cookie HttpOnly.
- No se usa JWT, OAuth2, OpenID Connect ni autenticación externa.
- El usuario se recarga desde la base de datos en cada petición autenticada.

### Contraseñas

- Hash BCrypt con coste 12: `BCryptPasswordEncoder(12)` en `SecurityConfig`.
- Nunca se devuelve el hash en DTOs.
- Las cuentas internas nuevas reciben una contraseña temporal generada por el servidor.
- `mustChangePassword` obliga al cambio en el primer acceso.
- La contraseña temporal tiene vencimiento de 24 horas.
- No hay política configurable de longitud ni bloqueo por intentos fallidos.

## 2. Sesión y CSRF

Archivo principal: `backend/scouting/src/main/java/com/scouting/scouting/security/SecurityConfig.java`.

| Medida | Configuración |
|---|---|
| Cookie | HttpOnly; `SameSite=Lax`; `Secure` configurable |
| Timeout | 30 minutos |
| Tracking | Solo cookie |
| CSRF | `HttpSessionCsrfTokenRepository` |
| Token en frontend | Memoria; no localStorage |
| Reintento | Solo si el código es `CSRF_INVALID` |
| Logout | Invalida la sesión |

`AccountStateFilter` revisa en cada petición:

- que la cuenta exista;
- que esté `ACTIVE`;
- que la contraseña temporal no haya expirado;
- que, si `mustChangePassword` está activo, solo acceda a rutas de autenticación permitidas.

## 3. Autorización

La autorización tiene tres capas:

1. `SecurityConfig`: reglas por prefijo de URL.
2. `@PreAuthorize`: rol a nivel de controller o método.
3. Servicios de alcance: academia/club del actor y pertenencia del recurso.

### Matriz de roles

| Rol | Alcance principal |
|---|---|
| ADMIN | Usuarios, academias, clubes, jugadores, recomendaciones (solo metadatos), solicitudes de ojeador |
| ACADEMY_DIRECTOR | Su academia, jugadores de su academia, creación de profesores |
| PROFESSOR | Consulta de su academia y gestión de jugadores de su academia; no crea usuarios desde la UI |
| SCOUT | Consulta de jugadores y organizaciones activas/verificadas; prospección, evaluaciones y recomendaciones propias |
| CLUB_MANAGER | Su club y la bandeja de recomendaciones de ese club |
| PLAYER | Su propio perfil deportivo, sin edición |

### Reglas relevantes

- El club o academia nunca se toman de un `clubId`/`academyId` enviado por el navegador en rutas de alcance propio.
- Un ojeador no puede ver notas privadas ni evaluaciones de otro ojeador.
- Un Administrador no accede a la carta, snapshot, notas privadas ni evaluaciones no seleccionadas de una recomendación.
- El tutor solo se expone a Director/Profesor y, con datos reducidos, a Ojeador.
- El jugador no accede a datos de tutor ni a prospecciones.
- El Responsable de club no accede a jugadores ni a prospección.

## 4. Protección de rutas del frontend

- `DashboardLayout` redirige a `/login` si no hay sesión.
- Si `mustChangePassword` es verdadero, redirige a `/cambiar-password`.
- El menú lateral y las tarjetas de inicio se filtran por rol.
- Esto es solo usabilidad: la seguridad efectiva se valida en backend.
- No hay `middleware.ts` de Next.js.

## 5. Validación y errores

- DTOs con Bean Validation.
- `@Valid` en controllers.
- Reglas adicionales en servicios.
- `GlobalExceptionHandler` devuelve errores uniformes sin stack trace.
- `server.error.include-message=never`, `include-stacktrace=never`, `include-exception=false`.
- Los errores de autenticación no distinguen si el correo existe.
- El login de cuentas pendientes/inactivas devuelve un error genérico.

## 6. CORS

- Configuración en `CorsConfig` y `application.properties`.
- Orígenes permitidos mediante `APP_CORS_ALLOWED_ORIGINS`.
- Valor local por defecto orientado a `localhost:3000`.
- No se encontró una configuración de dominio productivo.

## 7. Protección de información personal

| Dato | Control |
|---|---|
| Contraseña | Hash BCrypt; nunca en DTOs |
| Documento/teléfono de cuenta | Solo ADMIN en detalle |
| Tutor | Entidad separada; acceso restringido |
| Consentimiento | Eventos append-only; no se expone al jugador ni al club |
| Notas privadas de ojeador | Solo autor |
| Evaluaciones privadas | Solo autor |
| Snapshot de recomendación | Excluye fecha de nacimiento, distrito, tutor, cuenta, documento y notas privadas |
| Logotipos/fotos/videos | URLs; no archivos binarios |

## 8. Medidas ausentes o no verificadas

| Tema | Estado |
|---|---|
| Rate limiting en login/registro | No implementado; SCP-008 planificado |
| Bloqueo por intentos fallidos | No implementado |
| 2FA | No implementado |
| Recuperación de contraseña por correo | No implementado |
| Sesión compartida para múltiples instancias | No implementado; sesión en memoria |
| HTTPS/TLS en el repositorio | No configurado; solo cookie Secure del perfil prod |
| Auditoría de accesos | No implementada como tabla/panel |
| Escaneo de dependencias/SAST | No evidenciado |
| Cifrado de datos sensibles en reposo | No evidenciado |
| Borrado/anonimización de datos | No implementado |
| Carga segura de archivos | No aplica: solo URLs |

## 9. Riesgos técnicos observados

1. **Sesión en memoria:** no escala horizontalmente ni sobrevive reinicios.
2. **SQL debug en configuración por defecto:** puede generar logs muy verbosos; desactivar en producción.
3. **`ddl-auto=update`:** no es una estrategia de migración segura.
4. **Ausencia de rate limiting:** expuesta a fuerza bruta y abuso.
5. **Sin 2FA ni verificación de correo:** depende solo de contraseña.
6. **Sin política de retención/anonimización:** relevante por datos de menores.
7. **URLs externas de video/foto:** el contenido lo sirve un tercero; no hay validación de disponibilidad ni control de privacidad del enlace.
8. **No hay auditoría general de accesos:** solo snapshots de negocio.

## 10. Conclusión

La seguridad del MVP está bien encaminada para un entorno académico/local: autenticación por sesión, BCrypt, CSRF, roles, alcance y filtros de estado. No está lista para producción abierta sin rate limiting, TLS, sesión compartida, migraciones, monitoreo y una revisión de privacidad de datos de menores.
