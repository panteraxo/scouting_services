# Auditoría técnica integral — Scouting.pe

**Fecha de auditoría:** 27 de octubre de 2026  
**Alcance:** código fuente del repositorio, configuración, pruebas y documentación existente.  
**Naturaleza:** auditoría de solo lectura. No se modificó código de aplicación ni se ejecutaron operaciones destructivas.

**Nota posterior (28-oct-2026):** esta auditoria es un snapshot de su fecha. Desde entonces se agregaron Dockerfiles, Docker Compose y la guia de Aiven; consultar `docs/despliegue/docker-aiven.md` y SCP-017 en `docs/tasks/queue.md` para el estado actual.

## 1. Qué es Scouting.pe según el código

Scouting.pe es una aplicación web para la gestión de talento futbolístico en Perú. El código implementa:

- autenticación por correo y sesión;
- roles y permisos;
- academias y clubes;
- cuentas de usuario y asignaciones organizacionales;
- perfiles de jugadores y tutores;
- historial deportivo;
- prospección privada por ojeadores;
- evaluaciones privadas;
- recomendaciones a clubes y respuestas;
- consultas de directorio y estadísticas.

No se encontró un módulo de pagos, mensajería, notificaciones automáticas, aplicación móvil, analítica avanzada ni inteligencia artificial.

## 2. Tecnologías realmente encontradas

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16.4.2, React 19.3.1, TypeScript 5.9, CSS propio |
| Backend | Spring Boot 4.1.1, Java 21, Spring Security, Spring Data JPA/Hibernate, Bean Validation |
| Base de datos | MySQL 8; H2 en modo MySQL para pruebas |
| Seguridad | Sesión de servidor, cookie HttpOnly, CSRF, BCrypt, autorización por rol y alcance |
| Build | Maven Wrapper y npm |
| Pruebas backend | JUnit 5, MockMvc, H2 |
| Pruebas frontend | No hay framework de pruebas; solo lint, typecheck y build |
| Infraestructura | No hay Docker, CI/CD, cloud, proxy ni configuración de dominio en el repositorio |

## 3. Organización general

```text
scouting-pe-opencode-starter/
├── backend/scouting/     API REST Spring Boot
├── frontend/             Aplicación Next.js
├── database/             Notas y correcciones de base de datos
├── docs/                 Arquitectura, contratos API y tareas
├── .opencode/            Configuración de agentes
└── tmp/                  Artefactos locales ignorados por Git
```

Flujo principal:

```text
Navegador → Next.js → API REST /api/v1 → Spring Security
          → servicios de dominio → repositorios JPA → MySQL
```

## 4. Estado general de implementación

### Implementado y conectado de extremo a extremo

- Login, logout, sesión, CSRF y cambio de contraseña.
- Registro público de ojeador y aprobación/rechazo por Administrador.
- Gestión de usuarios, roles y asignaciones.
- Academias y clubes: alta, edición, estados y verificación.
- Alta conjunta de cuenta PLAYER y perfil deportivo.
- Perfil de jugador, residencia, tutor y consentimiento.
- Historial deportivo, métricas, ratings, videos por URL y revisiones auditadas.
- Prospección privada, notas y evaluaciones inmutables.
- Recomendaciones a clubes con snapshot y respuestas append-only.
- Vistas de solo lectura de academias, clubes y jugadores.
- Estadísticas deportivas y catálogo UBIGEO local.

### Parcialmente implementado

- Sedes de academia: solo existe el campo textual `headquarters`; no hay entidad de múltiples sedes.
- Profesores: existen como cuentas con rol PROFESSOR; no hay un perfil académico independiente.
- Gestión de archivos: solo se admiten URLs para logos, fotos y videos; no hay carga, almacenamiento ni borrado de archivos.
- Auditoría: existen snapshots y revisiones, pero no un módulo general de auditoría de accesos o cambios.
- Perfil de ojeador: es una cuenta con rol SCOUT; no existe una entidad separada `Ojeador` ni una vinculación persistida con clubes.

### No implementado

- Configuración general del sistema o preferencias de usuario.
- Reportes y tableros analíticos.
- Notificaciones automáticas o correo transaccional.
- Autenticación de dos factores, OAuth o JWT.
- Rate limiting y bloqueo por intentos fallidos; figura como tarea SCP-008.
- Docker, CI/CD, HTTPS/TLS, backups, monitoreo y despliegue cloud.
- Inteligencia artificial, scoring automático o recomendaciones algorítmicas.
- Carga binaria de archivos.

## 5. Hallazgos principales

1. **La arquitectura es un monolito backend + frontend desacoplado**, no microservicios.
2. **No hay integraciones externas en tiempo de ejecución**; las imágenes y videos son URLs que el navegador abre directamente.
3. **El catálogo UBIGEO es local**, cargado desde un CSV del INEI; no hay llamada a un proveedor externo.
4. **La seguridad se valida en backend** con Spring Security, filtros de estado de cuenta, CSRF y comprobaciones de alcance; ocultar botones en frontend no es la autorización real.
5. **La base de datos tiene 18 tablas** gestionadas por JPA/Hibernate. No hay Flyway ni scripts de migración versionados.
6. **El esquema local presentó desviaciones** en columnas `snapshot_json` que debieron ampliarse manualmente a `LONGTEXT`; esto evidencia la necesidad de migraciones controladas.
7. **La suite backend ejecutada en esta auditoría reportó 123 pruebas, 0 fallos.**
8. **El frontend no tiene pruebas automatizadas**; solo se ejecutaron lint, typecheck y build correctamente.
9. **No hay evidencia de despliegue productivo**: no existen Docker, Compose, pipeline CI/CD, proxy inverso ni configuración TLS en el repositorio.

## 6. Documentos de esta auditoría

- `01-inventario-tecnologico.md`
- `02-arquitectura-actual.md`
- `03-frontend.md`
- `04-backend-y-api.md`
- `05-modulos-funcionales.md`
- `06-modelo-de-datos.md`
- `07-seguridad.md`
- `08-integraciones-e-infraestructura.md`
- `09-pruebas-y-calidad.md`
- `10-brechas-y-recomendaciones.md`
- `diagramas/arquitectura-actual.mmd`
- `diagramas/modelo-datos-actual.mmd`
