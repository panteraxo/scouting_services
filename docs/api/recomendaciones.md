# Contrato de API - recomendaciones a clubes (SCP-007)

Prefijo: `/api/v1`. Todas las respuestas son JSON. La identidad, el rol y el
club del actor se obtienen del contexto de seguridad; ningun request acepta
`scoutId`, `clubId` como autoridad, autor, fechas ni estado.

Implementacion: Java 21, Spring Boot, Spring Data JPA, Bean Validation y MySQL.
Sin Flyway. Sin dependencias nuevas. No hay carga binaria de archivos.

## Alcance

Incluye:

- Envio de una recomendacion de un ojeador autor a un club activo y verificado.
- Seleccion explicita de historiales y evaluaciones.
- Snapshot inmutable de lo compartido al momento del envio.
- Bandeja del Responsable de club y respuestas append-only.
- Metadatos de auditoria para ADMIN.

No incluye:

- Edicion o borrado de recomendaciones.
- Conversaciones adicionales despues de una respuesta.
- Acceso del jugador a recomendaciones.
- Acceso de otros ojeadores, profesores, directores o clubes ajenos.
- Carta, snapshot, notas privadas o evaluaciones no seleccionadas para ADMIN.
- Carga binaria de archivos; solo URLs http/https existentes en los datos
  seleccionados.

## Roles y permisos

| Ruta | Rol efectivo | Alcance |
|---|---|---|
| `GET /prospects/{prospectId}/recommendations` | `SCOUT` | Solo prospect del autor. |
| `POST /prospects/{prospectId}/recommendations` | `SCOUT` | Crea recomendacion para su prospect. |
| `GET /recommendations/{id}` | `SCOUT` | Solo recomendacion creada por el autor. |
| `GET /clubs/me/recommendations` | `CLUB_MANAGER` | Solo el club asignado a la sesion. |
| `GET /clubs/me/recommendations/{id}` | `CLUB_MANAGER` | Solo recomendaciones de su club. |
| `POST /clubs/me/recommendations/{id}/responses` | `CLUB_MANAGER` | Responde solo por su club. |
| `GET /admin/recommendations` | `ADMIN` | Metadatos de auditoria. |
| `GET /admin/recommendations/{id}` | `ADMIN` | Metadatos de auditoria. |
| Cualquier `DELETE` | Ninguno | `405`, salvo `403` previo por CSRF. |
| Otras rutas/roles | — | `403 ACCESS_DENIED`. |

- Otro ojeador recibe `404 RECOMMENDATION_NOT_FOUND` o
  `404 PROSPECT_NOT_FOUND` sin revelar existencia.
- Un Responsable de club nunca puede indicar `clubId`; se deriva de
  `UserOrganization`.
- ADMIN nunca recibe `message`, `snapshot`, notas privadas ni evaluaciones.

## Estados

### Recomendacion

- `SENT`: enviada, sin respuesta.
- `RESPONDED`: al menos una respuesta del club.

### Respuesta de club

- `INTERESTED`
- `INFO_REQUESTED`
- `NOT_INTERESTED`

Las respuestas son append-only. La vigente es la ultima por
`respondedAt`/`id`. No se editan ni eliminan respuestas.

### Autorizacion

- Menor: `GUARDIAN_CONSENT`, con consentimiento vigente `GRANTED`.
- Adulto: `SCOUT_SEND`, registrado al enviar.
- `authorizedAt` se fija en servidor.
- No se exige aceptacion del jugador.

## Reglas de envio

- El prospect debe pertenecer al ojeador autenticado.
- El jugador debe estar:
  - perfil `ACTIVE` y `COMPLETE`;
  - cuenta `ACTIVE`;
  - academia operativamente `ACTIVE`.
- El club debe estar `operationalStatus = ACTIVE` y
  `verificationStatus = VERIFIED`; si no, `409 CLUB_NOT_ELIGIBLE`.
- No puede existir otra recomendacion para el mismo `(prospect, club)`:
  `409 RECOMMENDATION_ALREADY_EXISTS`.
- La carta/mensaje es obligatoria, maximo 4000 caracteres.
- `historyEntryIds` y `evaluationIds` pueden ser vacios. Si se informan, deben
  existir y pertenecer al jugador del prospect y al prospect respectivamente;
  ids duplicados se deduplican. IDs invalidos: `400 INVALID_SELECTION`.
- El contenido no se puede editar despues del envio. No hay `PUT`, `PATCH` ni
  `DELETE` de recomendacion.
- El snapshot se congela al enviar; cambios posteriores del perfil, historial o
  evaluaciones no alteran lo que el club ya recibio.
- La lectura del consentimiento vigente y el envio se serializan mediante un
  bloqueo del perfil del jugador. La revocacion del tutor usa el mismo bloqueo,
  de modo que una recomendacion nunca se registra despues de una revocacion
  confirmada.

## Snapshot compartido

El snapshot incluye solo:

- Jugador:
  - nombres y apellidos;
  - edad calculada;
  - posicion y grupo;
  - mejor posicion y grupo;
  - pie dominante;
  - talla y peso;
  - resumen;
  - foto URL;
  - academia con estado de verificacion.
- Residencia:
  - departamento y provincia;
  - **sin distrito**.
- Historiales seleccionados:
  - tipo/fecha de actividad, competencia, rival, categoria, nivel, posicion,
    participacion, minutos, resultado, goles, asistencias, tarjetas,
    observaciones, video, metricas, ratings, fortalezas, mejoras y
    recomendaciones historicas.
- Evaluaciones seleccionadas:
  - fecha, ratings tecnico/tactico/fisico/mental/general, fortalezas, mejoras,
    recomendacion y video URL.

Nunca incluye:

- `birthDate`;
- distrito de residencia;
- tutor o consentimiento;
- cuenta, correo, documento o telefono;
- `Prospect.privateNotes`;
- `ProspectEvaluation.privateNotes`;
- elementos no seleccionados.

## DTOs

### `RecommendationCreateRequest`

```json
{
  "clubId": 4,
  "message": "Carta de recomendacion",
  "historyEntryIds": [10, 11],
  "evaluationIds": [20]
}
```

- `clubId`: obligatorio, positivo.
- `message`: obligatorio, maximo 4000.
- Arrays: opcionales, maximo 100 cada uno.

### `RecommendationDetailResponse`

Usado por el ojeador autor y por el club destinatario:

```json
{
  "id": 1,
  "prospectId": 9,
  "player": {
    "id": 42,
    "firstName": "Luis",
    "lastName": "Quispe",
    "age": 16,
    "position": "STRIKER",
    "positionGroup": "FORWARD"
  },
  "scout": { "id": 7, "firstName": "Ana", "lastName": "Torres" },
  "club": { "id": 4, "code": "CLU-000004", "name": "Club Ejemplo", "logoUrl": "https://...", "operationalStatus": "ACTIVE", "verificationStatus": "VERIFIED" },
  "status": "SENT",
  "message": "Carta de recomendacion",
  "snapshot": { "...": "RecommendationSnapshot" },
  "responses": [],
  "sentAt": "2026-10-20T10:00:00Z",
  "createdAt": "2026-10-20T10:00:00Z",
  "updatedAt": "2026-10-20T10:00:00Z",
  "version": 0
}
```

### `RecommendationSummaryResponse`

Para listados de ojeador y club:

- `id`, `prospectId`.
- `player` resumen minimo.
- `scout` nombre.
- `club` referencia.
- `status`.
- `sentAt`.
- `lastResponseStatus`.
- `lastResponseAt`.

No incluye snapshot ni carta.

### `RecommendationClubReplyRequest`

```json
{
  "status": "INTERESTED",
  "message": "Nos interesa el jugador."
}
```

- `status`: `INTERESTED`, `INFO_REQUESTED` o `NOT_INTERESTED`.
- `message`: obligatorio, maximo 4000.
- `respondedBy` y `respondedAt` los fija el servidor.

### `RecommendationResponseEntry`

```json
{
  "id": 3,
  "status": "INTERESTED",
  "message": "Nos interesa el jugador.",
  "respondedAt": "2026-10-20T11:00:00Z"
}
```

### `RecommendationAdminResponse`

Solo metadatos:

- `id`, `prospectId`.
- `playerId`, nombres del jugador.
- `scoutId`, nombres del ojeador.
- `clubId`, codigo y nombre del club.
- `status`.
- `lastResponseStatus`, `lastResponseAt`.
- `sentAt`, `createdAt`.

No incluye `message`, `snapshot`, notas privadas ni evaluaciones.

## Endpoints

### `GET /api/v1/prospects/{prospectId}/recommendations`

- Solo autor del prospect.
- `page` defecto 0; `size` defecto 20, maximo 100.
- Orden fijo `sentAt desc`.
- Respuesta `200` con `PageResponse<RecommendationSummaryResponse>`.
- Prospect ajeno/inexistente: `404 PROSPECT_NOT_FOUND`.

### `POST /api/v1/prospects/{prospectId}/recommendations`

- Requiere CSRF.
- Request: `RecommendationCreateRequest`.
- Respuesta `201` con `RecommendationDetailResponse`.
- Errores:
  - prospect ajeno: `404 PROSPECT_NOT_FOUND`;
  - jugador no elegible: `409 PLAYER_NOT_ELIGIBLE`;
  - club inexistente: `404 CLUB_NOT_FOUND`;
  - club no activo/verificado: `409 CLUB_NOT_ELIGIBLE`;
  - menor sin consentimiento vigente: `409 GUARDIAN_CONSENT_REQUIRED`;
  - seleccion invalida: `400 INVALID_SELECTION`;
  - duplicado: `409 RECOMMENDATION_ALREADY_EXISTS`.

### `GET /api/v1/recommendations/{id}`

- Solo ojeador autor.
- Respuesta `200` con `RecommendationDetailResponse`.
- Ajena/inexistente: `404 RECOMMENDATION_NOT_FOUND`.

### `GET /api/v1/clubs/me/recommendations`

- Solo `CLUB_MANAGER`; club derivado de la sesion.
- `page`, `size`; orden fijo `sentAt desc`.
- Respuesta `200` con `PageResponse<RecommendationSummaryResponse>`.

### `GET /api/v1/clubs/me/recommendations/{id}`

- Solo club asignado.
- Respuesta `200` con `RecommendationDetailResponse`.
- Otra club/inexistente: `404 RECOMMENDATION_NOT_FOUND`.

### `POST /api/v1/clubs/me/recommendations/{id}/responses`

- Requiere CSRF.
- Request: `RecommendationClubReplyRequest`.
- Respuesta `201` con `RecommendationDetailResponse`.
- La recomendacion pasa a `RESPONDED`.
- Cada POST agrega una respuesta; no sobrescribe anteriores.
- El club asignado debe estar `operationalStatus = ACTIVE`; si esta inhabilitado,
  responde `409 CLUB_INACTIVE`.
- La lectura historica de la recomendacion sigue permitida aunque el club este
  inhabilitado; solo se bloquean nuevas respuestas.
- Otra club/inexistente: `404 RECOMMENDATION_NOT_FOUND`.

### `GET /api/v1/admin/recommendations`

- Solo `ADMIN`.
- `page`, `size`; orden fijo `sentAt desc`.
- Respuesta `200` con `PageResponse<RecommendationAdminResponse>`.
- Sin carta ni snapshot.

### `GET /api/v1/admin/recommendations/{id}`

- Solo `ADMIN`.
- Respuesta `200` con `RecommendationAdminResponse`.
- Sin carta ni snapshot.

## Errores principales

| Codigo | HTTP | Caso |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Campos, ratings o longitudes invalidas. |
| `INVALID_SELECTION` | 400 | Historial/evaluacion inexistente o de otro jugador/prospect. |
| `INVALID_REQUEST` | 400 | JSON invalido. |
| `AUTHENTICATION_REQUIRED` | 401 | Sin sesion. |
| `CSRF_INVALID` | 403 | Falta o no coincide CSRF. |
| `ACCESS_DENIED` | 403 | Rol sin permiso. |
| `PROSPECT_NOT_FOUND` | 404 | Prospect inexistente o ajeno. |
| `CLUB_NOT_FOUND` | 404 | Club inexistente. |
| `RECOMMENDATION_NOT_FOUND` | 404 | Recomendacion inexistente o fuera de alcance. |
| `PLAYER_NOT_ELIGIBLE` | 409 | Jugador dejo de ser elegible. |
| `CLUB_NOT_ELIGIBLE` | 409 | Club no activo o no verificado al recomendar. |
| `CLUB_INACTIVE` | 409 | Club inhabilitado intenta responder una recomendacion. |
| `GUARDIAN_CONSENT_REQUIRED` | 409 | Menor sin consentimiento vigente. |
| `RECOMMENDATION_ALREADY_EXISTS` | 409 | Duplicado `(prospect, club)`. |
| `DATA_CONFLICT` | 409 | Conflicto de concurrencia/integridad. |
| `METHOD_NOT_ALLOWED` | 405 | DELETE o metodo no permitido. |

No se devuelven notas privadas, tutor, cuenta, fecha de nacimiento, distrito ni
elementos no seleccionados en errores o logs.

## Persistencia

- `recommendations`:
  - `prospect_id`, `club_id`, `scout_id`;
  - `status`, `message`, `snapshot_json`;
  - `authorization_type`, `authorized_at`, `sent_at`;
  - `version`, timestamps.
  - Unique `(prospect_id, club_id)`.
  - Indices `(club_id, sent_at)` y `(scout_id, sent_at)`.
- `recommendation_history_entries`: join unico por recomendacion/historial.
- `recommendation_evaluations`: join unico por recomendacion/evaluacion.
- `recommendation_responses`: respuesta, club, respondedor, estado, mensaje y
  fecha; append-only, sin version ni update.
- `snapshot_json` es un snapshot serializado; nunca contiene PII no compartida.
- La unique `(prospect_id, club_id)` se traduce a
  `RECOMMENDATION_ALREADY_EXISTS`; otras violaciones de integridad se traducen a
  `DATA_CONFLICT`.
- La clasificacion de la unique depende de que el motor exponga el nombre de la
  constraint o las columnas `prospect_id` y `club_id`. Si no lo hace, una carrera
  de duplicado puede caer en `DATA_CONFLICT`; el precheck normal sigue
  devolviendo `RECOMMENDATION_ALREADY_EXISTS`.
- No hay borrado de recomendaciones, respuestas ni joins.

## Pruebas cubiertas

- Creacion y lectura por ojeador autor; otro ojeador `404`.
- Admin, profesor, director, jugador y otros clubes sin acceso.
- Menor sin consentimiento/revocado `409`; consentimiento `GRANTED` `200`.
- Adulto con autorizacion `SCOUT_SEND`.
- Club inactivo/no verificado `409`; club valido.
- Seleccion invalida y arrays vacios permitidos.
- Snapshot sin notas privadas, `birthDate`, distrito, tutor, cuenta ni elementos
  no seleccionados; inmutable ante cambios posteriores.
- Duplicado `409`.
- Respuestas append-only, estado `RESPONDED`, ultima respuesta vigente.
- Club inhabilitado no responde (`409 CLUB_INACTIVE`), pero conserva lectura.
- Mensaje de respuesta vacio o mayor a 4000: `400 VALIDATION_ERROR`.
- Admin solo metadatos, sin carta ni snapshot.
- `403` en `/admin/recommendations` y `/clubs/me/recommendations` para roles no
  autorizados.
- CSRF, no-store en exito y error, `401`, no DELETE.
- Listados propios del ojeador y del club: contenido, aislamiento entre
  ojeadores/clubes, orden `sentAt desc`, paginacion y ultima respuesta.
- Elegibilidad: perfil incompleto, cuenta inactiva, academia inactiva y club
  rechazado.
- Consentimiento `GRANTED` seguido de `REVOKED`, y prueba de concurrencia que
  verifica que la revocacion bloquea un envio simultaneo.
- Validacion de carta vacia/sobrelongitud, club obligatorio y deduplicacion de
  historiales/evaluaciones.
- CSRF y `no-store` en la respuesta del club; `DELETE` no permitido tambien en
  las rutas de club y Admin.
- Recomendacion inexistente devuelve `404` aunque el club este inhabilitado.
- Regresiones SCP-002 a SCP-006.
