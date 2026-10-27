# 10 — Brechas, decisiones pendientes y recomendaciones

## 1. Diferencias entre documentación y código

| Tema | Documentación existente | Código actual | Conclusión |
|---|---|---|---|
| Ojeador | `docs/modelo-datos.md` propone entidad `Ojeador` y `OjeadorClub` | El ojeador es `users.role = SCOUT`; no hay tablas separadas | Documentación desactualizada |
| Evidencia | `docs/modelo-datos.md` menciona `Evidencia` | Evidencia es URL en historial/evaluación; no hay tabla | No existe entidad |
| Aspirantes | Se mencionan en conteos/documentación inicial | No hay módulo ni entidad de aspirantes | No implementado |
| Sedes | Se menciona “sede” | Solo `academies.headquarters` | Parcial |
| Grupos formativos | Aparecen en documentación/entidad | La UI ya no los captura; la tabla de colección sigue existiendo | Deuda técnica / UI retirada |
| Representante | Documentación inicial hablaba de nombre registrado | Se deriva del Director activo; `representative_name` es legacy | Documentación parcialmente actualizada |
| Configuración | Se ha discutido una sección | Solo existe `/cambiar-password` | No implementado |
| Reportes / notificaciones / IA | No forman parte del MVP | No existen | Correctamente fuera de alcance |
| Docker/cloud | No forman parte del repo | No existen | No deben declararse como implementados |
| Migraciones | `database/README.md` menciona JPA/Hibernate | No hay Flyway/Liquibase | Brecha de producción |
| Esquema local | — | `snapshot_json` requirió `LONGTEXT` manual | Inconsistencia de esquema |

## 2. Funcionalidades documentadas que no existen

- Módulo de aspirantes.
- Entidad `Ojeador` / `OjeadorClub`.
- Entidad `Evidencia` separada.
- Configuración general.
- Reportes.
- Notificaciones.
- Analítica/IA.
- Docker/CI/CD/cloud.
- Carga de archivos.

## 3. Funcionalidades implementadas que no siempre aparecen en documentación

- Alta transaccional de cuenta PLAYER + perfil (`POST /players/with-account`).
- Rechazo de PLAYER desde la creación general de usuarios.
- Catálogo UBIGEO local.
- Snapshot de recomendación y respuestas append-only.
- Metadatos de auditoría para Admin.
- Revisión de historial con snapshot JSON.
- Vistas de solo lectura de academias/clubes.
- Tarjetas de jugadores y prospección.

## 4. Decisiones que requiere confirmar el responsable

### Arquitectura y alcance

1. ¿El alcance del Capítulo 2 incluye únicamente el MVP implementado o también configuración, reportes, notificaciones y analítica?
2. ¿Se presentará el sistema como monolito backend + frontend desacoplado, o se planteará una evolución a servicios?
3. ¿La arquitectura académica debe describir solo lo implementado o también el despliegue productivo propuesto?

### Modelo de datos

4. ¿Se eliminarán formalmente las entidades propuestas `Ojeador`, `OjeadorClub` y `Evidencia` de la documentación?
5. ¿Se mantendrá `academy_training_groups` o se retirará al no usarse en la UI?
6. ¿Se adoptará Flyway/Liquibase para versionar el esquema?
7. ¿Cómo se gestionarán los cambios de tipo de columnas JSON en bases existentes?

### Roles y permisos

8. ¿Profesor debe poder crear algún usuario o solo gestionar jugadores de su academia?
9. ¿El Administrador debe seguir sin acceso a carta/snapshot/notas privadas?
10. ¿Se implementará una vinculación persistida entre ojeadores y clubes?
11. ¿Se agregará un rol o flujo de “representante de academia” separado del Director?

### Privacidad y datos de menores

12. ¿Qué política de retención y anonimización se aplicará a datos de tutores?
13. ¿Cómo se gestionará el consentimiento al cumplir 18 años?
14. ¿Los enlaces de video/foto podrán ser públicos o requerirán control de acceso?
15. ¿Se permitirá carga binaria de documentos de consentimiento?

### Comunicación y despliegue

16. ¿Se implementará correo transaccional para cuentas temporales y notificaciones?
17. ¿Se usará HTTPS/TLS con proxy inverso?
18. ¿Se desplegará en cloud, VPS o infraestructura institucional?
19. ¿Se requiere sesión compartida para múltiples instancias?
20. ¿Se implementará CI/CD y backups?

## 5. Recomendaciones técnicas

### Prioridad alta — necesarias antes de producción

| Recomendación | Motivo |
|---|---|
| Introducir Flyway o Liquibase | Evitar diferencias como `snapshot_json` TINYTEXT/LONGTEXT y cambios manuales |
| Desactivar SQL debug en producción | Evitar logs verbosos y posible exposición de datos |
| Implementar sesión compartida | La sesión en memoria no escala ni sobrevive reinicios |
| Implementar rate limiting y bloqueo de intentos | SCP-008; protege login/registro |
| Configurar HTTPS/TLS y cookie Secure | Proteger credenciales y sesión |
| Añadir backups y restauración probada | Recuperación ante fallos |
| Revisar privacidad de datos de menores | Tutor, consentimiento, retención y acceso |
| Prueba de integración contra MySQL real | H2 no detecta diferencias de tipos y restricciones |

### Prioridad media — mejora de mantenibilidad y operación

| Recomendación | Motivo |
|---|---|
| CI con tests, lint y build | Evitar regresiones |
| Pruebas E2E del flujo principal | Login, alta de jugador, historial, prospección y recomendación |
| Documento OpenAPI/Swagger | Contrato verificable para frontend y terceros |
| Observabilidad y alertas | Detectar errores y latencia |
| Optimizar consultas N+1 de organizaciones | Listados más rápidos |
| Caché de catálogo UBIGEO en frontend | Menos solicitudes repetidas |
| Definir almacenamiento de archivos | Si se requiere carga de fotos/videos/documentos |
| Correo transaccional | Contraseñas temporales y notificaciones |
| Módulo de configuración | Preferencias, seguridad y datos de cuenta |

### Prioridad baja — evolución funcional

| Recomendación | Motivo |
|---|---|
| Analítica/BI | Indicadores agregados y reportes |
| IA asistiva | Apoyo al scouting, siempre con revisión humana |
| Preferencias de tema/densidad | Mejora de experiencia |
| Catálogos administrables | Posiciones, categorías y niveles |
| Exportaciones CSV/PDF | Reportes operativos |
| Accesibilidad formal | Cumplimiento y usabilidad |

## 6. Qué no debe implementarse sin una decisión previa

- Cambio de rol automático de jugador al cumplir 18 años.
- Borrado físico de historiales, recomendaciones o cuentas.
- Exposición de notas privadas o evaluaciones a clubes.
- Compartición automática de datos de menores.
- Almacenamiento de archivos sin política de acceso y retención.
- IA que tome decisiones automáticas de selección.
- Configuración de secretos desde la interfaz.

## 7. Conclusión

El proyecto tiene un núcleo funcional sólido y una suite de pruebas backend amplia. Las principales brechas no están en las funcionalidades del MVP, sino en **migraciones, despliegue, sesión compartida, privacidad operativa, observabilidad y pruebas frontend**. La documentación académica debe separar claramente lo implementado de lo propuesto y registrar las decisiones pendientes antes de afirmar que el sistema está listo para producción.
