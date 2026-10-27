# 01 — Inventario tecnológico

## 1. Criterio

Se distingue entre:

- **Declarado:** aparece en `pom.xml`, `package.json` o configuración.
- **Utilizado:** se encontró código que lo usa.
- **Verificado:** se ejecutó una comprobación durante esta auditoría.

No se incluyen valores de variables de entorno ni credenciales.

## 2. Inventario

| Componente | Tecnología o herramienta | Versión verificable | Uso dentro del proyecto | Evidencia |
|---|---|---|---|---|
| Frontend | Next.js App Router | `^16.4.2` | Rutas, páginas, layouts, build y servidor de producción | `frontend/package.json`, `frontend/src/app/` |
| Frontend | React | `^19.3.1` | Componentes y estado local | `frontend/package.json` |
| Frontend | TypeScript | `^5.9` | Tipado estricto; `strict: true` | `frontend/package.json`, `frontend/tsconfig.json` |
| Frontend | CSS propio | No aplica versión | Estilos globales, responsive, tarjetas y tablas | `frontend/src/app/globals.css` |
| Frontend | ESLint | `^10.13.0` | Análisis estático | `frontend/package.json`, `frontend/eslint.config.mjs` |
| Backend | Java | 21 | Lenguaje del backend | `backend/scouting/pom.xml` (`java.version`) |
| Backend | Spring Boot | 4.1.1 | Aplicación, configuración, web, seguridad y tests | `backend/scouting/pom.xml` |
| Backend | Spring Web MVC | Incluido en Spring Boot 4.1.1 | API REST | `spring-boot-starter-webmvc` |
| Backend | Spring Security | Incluido en Spring Boot 4.1.1 | Autenticación, autorización, CSRF, sesión | `SecurityConfig`, `pom.xml` |
| Backend | Spring Data JPA / Hibernate | Hibernate ORM 7.4.5 | Persistencia y repositorios | Dependencia `spring-boot-starter-data-jpa`; log de Hibernate |
| Backend | Bean Validation | Incluido en Spring Boot | Validación de DTOs | `jakarta.validation` en DTOs |
| Backend | Lombok | 1.18.46 en el classpath de build | Getter/setter/constructores de entidades | `pom.xml`, `mvnw` build |
| Backend | Maven Wrapper | Incluido en el repo | Compilación, tests y empaquetado | `backend/scouting/mvnw`, `mvnw.cmd` |
| Base de datos | MySQL | 8.0.36 observado en la instancia local | Persistencia principal | `application.properties`; conexión local verificada |
| Base de datos | MySQL Connector/J | 9.7.0 en dependencias | Driver JDBC | `pom.xml`, classpath de Spring Boot |
| Base de datos | H2 | 2.4.240 en pruebas | Base en memoria en modo MySQL | `application-test.properties` |
| Seguridad | BCrypt | `BCryptPasswordEncoder(12)` | Hash de contraseñas | `SecurityConfig.java` |
| Seguridad | Sesión HTTP | Cookie HttpOnly, `SameSite=Lax`, timeout 30m | Autenticación de sesión | `application.properties`, `SecurityConfig` |
| Seguridad | CSRF | `HttpSessionCsrfTokenRepository` | Protección de escrituras | `SecurityConfig`, `api-client.ts` |
| API | JSON | Jackson/Spring Boot | DTOs de entrada y salida | Controllers y DTOs |
| Catálogo | UBIGEO INEI | CSV local | Departamentos, provincias y distritos | `backend/scouting/src/main/resources/ubigeo/` |
| Pruebas | JUnit 5 / Spring Boot Test | Incluido en Spring Boot | Pruebas unitarias e integración | `src/test/java` |
| Pruebas | MockMvc | Incluido en Spring Boot Test | Pruebas de API | `*ApiIntegrationTest` |
| Build frontend | npm | No se fija versión de Node/npm en el repo | Instalación, lint, typecheck, build | `frontend/package.json` |
| Servidor frontend | `next start` / `next dev` | Next.js 16.4.2 | Desarrollo y producción | Scripts `dev` y `start` |
| Servidor backend | Tomcat embebido | 11.0.24 en logs de Spring Boot 4.1.1 | Servidor HTTP | Arranque de `ScoutingApplication` |
| Documentación | Markdown | No aplica | Contratos, arquitectura y tareas | `docs/` |
| Repositorio | Git | No se fija versión | Control de versiones | `.git/` |

## 3. Tecnologías declaradas y no utilizadas

| Tecnología | Estado | Evidencia |
|---|---|---|
| Docker / Docker Compose | No existe | No se encontraron `Dockerfile` ni `docker-compose.yml` |
| Kubernetes | No existe | Sin manifiestos ni configuración |
| Flyway / Liquibase | No existe | Sin dependencias ni migraciones |
| Redis / Spring Session JDBC | No existe | Sesión en memoria de Tomcat |
| JWT / OAuth2 / OpenID Connect | No existe | Autenticación por sesión y contraseña |
| SMTP / correo transaccional | No existe | Sin dependencias de correo ni servicio |
| Almacenamiento de objetos | No existe | Solo URLs de imágenes/videos |
| Analítica / BI | No existe | Sin herramientas ni tableros |
| IA / ML | No existe | Sin modelos, servicios ni dependencias |
| Docker/CI/CD | No existe | Sin pipelines ni configuración de despliegue |

## 4. Variables de entorno identificadas

Solo se listan nombres; los valores no se incluyen.

| Nombre | Uso |
|---|---|
| `DB_URL` | URL JDBC de MySQL |
| `DB_USERNAME` | Usuario de base de datos |
| `DB_PASSWORD` | Contraseña de base de datos |
| `SERVER_PORT` | Puerto del backend; valor por defecto en configuración actual: 9193 |
| `SESSION_COOKIE_SECURE` | Fuerza cookie Secure |
| `APP_CORS_ALLOWED_ORIGINS` | Orígenes CORS permitidos |
| `JPA_DDL_AUTO` | Estrategia de esquema de Hibernate |
| `BOOTSTRAP_ADMIN_*` | Datos del administrador inicial |
| `NEXT_PUBLIC_API_BASE_URL` | URL pública de la API consumida por el frontend |

## 5. Conclusión del inventario

El proyecto es una aplicación web de dos capas lógicas principales:

1. **Next.js/React** en el navegador.
2. **Spring Boot** como API y capa de negocio.
3. **MySQL** como persistencia.

No es una arquitectura de microservicios ni una aplicación cloud-native en el estado actual. Los componentes de infraestructura y servicios externos que no tienen evidencia deben presentarse como propuestas futuras, no como parte de la solución implementada.
