# 08 — Integraciones y servicios externos

## 1. Integraciones de negocio

No se encontraron integraciones externas de negocio en el código:

| Integración | Estado | Evidencia |
|---|---|---|
| Correo electrónico / SMTP | No implementada | Sin dependencia, configuración ni servicio de correo |
| Autenticación externa (Google, Microsoft, etc.) | No implementada | Solo login local con Spring Security |
| Pasarela de pagos | No implementada | Sin dependencias ni endpoints |
| Mensajería / WhatsApp | No implementada | Sin dependencias ni endpoints |
| Almacenamiento de archivos | No implementado | Solo URLs en campos de texto |
| Servicios cloud | No implementados | Sin SDK ni configuración cloud |
| Analítica / BI | No implementada | Sin herramientas ni tableros |
| IA / ML | No implementada | Sin modelos, APIs ni dependencias |
| Federaciones / calendarios deportivos | No implementados | Sin integraciones |
| Servicios de video | Solo enlaces externos | El navegador abre URLs de video; el backend no se integra con el proveedor |

## 2. Catálogo UBIGEO

- No es una integración externa en tiempo de ejecución.
- Se carga desde un CSV local incluido en el backend.
- El archivo se encuentra en `backend/scouting/src/main/resources/ubigeo/`.
- Los endpoints `/api/v1/ubigeo/departments`, `/provinces` y `/districts` sirven el catálogo.
- No hay llamada a INEI ni a un proveedor externo durante la ejecución.

## 3. Recursos por URL

- Logos de academia/club: `logoUrl`.
- Foto de jugador: `photoUrl`.
- Foto/logo en respuestas: URLs.
- Video de historial: `videoUrl`, `videoTimestampSeconds`, `videoDescription`.
- Video de evaluación: `videoUrl`.

El backend no descarga ni almacena esos archivos. El navegador los solicita directamente al dominio externo. Esto implica:

- dependencia de disponibilidad y políticas del tercero;
- posibles problemas de CORS solo para recursos que se consuman por JavaScript, no para etiquetas `<img>` o enlaces;
- ausencia de control de acceso al archivo subyacente;
- ausencia de borrado o retención gestionada por la aplicación.

## 4. Infraestructura actual

No hay evidencia de infraestructura productiva en el repositorio.

| Elemento | Estado |
|---|---|
| Dockerfile | No existe |
| Docker Compose | No existe |
| Kubernetes | No existe |
| Proxy inverso | No existe |
| Dominio | No configurado |
| HTTPS/TLS | No configurado en el repositorio |
| CI/CD | No existe |
| Backups | No documentados |
| Monitoreo/APM | No existe |
| Gestor de secretos | No existe |
| Migraciones | No existen (sin Flyway/Liquibase) |

## 5. Ejecución local

Según `README.md` y la configuración:

```text
Frontend:  Next.js, por defecto en 3000
Backend:   Spring Boot, puerto actual configurado en 9193
Base:      MySQL local, 3306
```

El frontend obtiene la URL de la API desde `NEXT_PUBLIC_API_BASE_URL`. Si no se define, usa un valor por defecto que debe coincidir con el puerto del backend.

## 6. Build y artefactos

| Componente | Comando | Artefacto |
|---|---|---|
| Backend | `.\mvnw.cmd package` | `target/scouting-0.0.1-SNAPSHOT.jar` |
| Backend tests | `.\mvnw.cmd test` | Reportes Surefire en `target/surefire-reports/` |
| Frontend dev | `npm run dev` | Servidor de desarrollo Next.js |
| Frontend build | `npm run build` | Carpeta `.next/` |
| Frontend producción | `npm start` | Servidor Next.js sobre la build |
| Frontend lint | `npm run lint` | ESLint |
| Frontend typecheck | `npm run typecheck` | TypeScript |

## 7. Variables de entorno

No se incluyen valores.

| Variable | Componente |
|---|---|
| `DB_URL` | Backend / MySQL |
| `DB_USERNAME` | Backend / MySQL |
| `DB_PASSWORD` | Backend / MySQL |
| `SERVER_PORT` | Backend |
| `SESSION_COOKIE_SECURE` | Backend |
| `APP_CORS_ALLOWED_ORIGINS` | Backend |
| `JPA_DDL_AUTO` | Backend |
| `BOOTSTRAP_ADMIN_ENABLED` | Bootstrap |
| `BOOTSTRAP_ADMIN_EMAIL` | Bootstrap |
| `BOOTSTRAP_ADMIN_PASSWORD` | Bootstrap |
| `BOOTSTRAP_ADMIN_FIRST_NAME` | Bootstrap |
| `BOOTSTRAP_ADMIN_LAST_NAME` | Bootstrap |
| `BOOTSTRAP_ADMIN_USERNAME` | Bootstrap |
| `BOOTSTRAP_ADMIN_DOCUMENT_TYPE` | Bootstrap |
| `BOOTSTRAP_ADMIN_DOCUMENT_NUMBER` | Bootstrap |
| `BOOTSTRAP_ADMIN_PHONE` | Bootstrap |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend |

## 8. Infraestructura propuesta para producción

Lo siguiente **no está implementado** y debe presentarse como propuesta:

- proxy inverso con TLS;
- despliegue de Next.js y Spring Boot en contenedores o VMs;
- MySQL gestionado con backups;
- almacenamiento de objetos para archivos;
- correo transaccional;
- gestor de secretos;
- sesión compartida (Redis o Spring Session JDBC);
- observabilidad y alertas;
- CI/CD con pruebas y migraciones Flyway/Liquibase;
- WAF/CDN opcional.

## 9. Conclusión

El sistema actual no depende de servicios cloud ni de APIs de terceros para funcionar, salvo los enlaces de imágenes y videos que el navegador abre. La infraestructura es local y no hay un diseño de despliegue productivo verificable en el repositorio.
