# Contrato de API - prospecciones y evaluaciones (SCP-006)

Prefijo: `/api/v1`. Todas las respuestas son JSON. La identidad y el rol del
actor se obtienen del contexto de seguridad; el `scoutId`, autor, timestamps y
propietario nunca se aceptan desde el request.

Implementacion: Java 21, Spring Boot, Spring Data JPA, Bean Validation y MySQL.
Sin Flyway. Sin dependencias nuevas.

## Alcance

Incluye:

- Prospeccion privada de un jugador por un ojeador autenticado.
- Estados de seguimiento y notas privadas del autor.
- Evaluaciones historicas inmutables, append-only.
- Listado propio con filtros y paginacion.

No incluye:

- Agregados o listados para `ADMIN`.
- Acceso de `PROFESSOR`, `ACADEMY_DIRECTOR`, `CLUB_MANAGER` o `PLAYER`.
- Acceso de otros ojeadores a prospecciones ajenas.
- Recomendaciones, respuestas de club ni endpoints de SCP-007.
- Edicion o borrado de evaluaciones.
- Carga binaria de archivos.

## Reglas generales

- Solo un usuario `SCOUT` activo puede usar estas rutas. El filtro de estado de
  cuenta existente invalida sesiones no activas.
- Cada prospeccion pertenece a un unico ojeador y a un unico jugador.
- Unique `(scout_id, player_id)`: un ojeador no puede seguir dos veces al mismo
  jugador. Varios ojeadores pueden seguir al mismo jugador.
- Un ojeador solo ve y modifica sus propias prospecciones y evaluaciones.
- Admin, staff de academia, club y jugador reciben `403 ACCESS_DENIED`.
- Otro ojeador recibe `404 PROSPECT_NOT_FOUND` sin revelar existencia.
- No existe `DELETE`. Las rutas `DELETE` responden `405 METHOD_NOT_ALLOWED`
  cuando superan el filtro CSRF; sin CSRF pueden responder `403` antes.
- Todos los `POST` y `PATCH` requieren CSRF (`X-CSRF-TOKEN`).
- Todas las respuestas, incluidas las respuestas de error de SCP-006, usan
  `Cache-Control: no-store`.
- No se incluyen `birthDate`, distrito de residencia, tutor, documento, correo
  ni telefono de la cuenta del jugador. El resumen del jugador solo muestra id,
  nombre, `photoUrl` (URL de la foto del perfil, puede ser `null`), edad,
  posicion, grupo y academia con verificacion.

## Estados y transiciones

`ProspectStatus`:

- `FOLLOWING`: en seguimiento.
- `PAUSED`: pausada.
- `CLOSED`: cerrada.

Transiciones permitidas:

| Desde | Hacia |
|---|---|
| `FOLLOWING` | `PAUSED`, `CLOSED` |
| `PAUSED` | `FOLLOWING`, `CLOSED` |
| `CLOSED` | `FOLLOWING` (reabrir) |

- La misma transicion de estado responde `409 INVALID_STATUS_TRANSITION`.
- Cerrar conserva todas las evaluaciones.
- `closedAt` se fija al cerrar y se limpia al reabrir.
- `startedAt` es inmutable.
- `lastActivityAt` se actualiza al editar notas, cambiar estado o crear una
  evaluacion.
- Crear una evaluacion incrementa la version de la prospeccion. El cliente debe
  volver a leer la prospeccion para obtener la version nueva antes de un
  `PATCH`; usar la version anterior responde `409 STALE_PROSPECT`.
- No hay borrado fisico ni logico.

## Permisos por ruta

| Metodo y ruta | Rol efectivo | Alcance |
|---|---|---|
| `GET /prospects` | `SCOUT` | Solo prospecciones propias; filtros. |
| `POST /prospects` | `SCOUT` | Crea para un jugador elegible. |
| `GET /prospects/{id}` | `SCOUT` | Solo propia; ajena responde `404`. |
| `PATCH /prospects/{id}` | `SCOUT` | Notas privadas propias + version. |
| `PATCH /prospects/{id}/status` | `SCOUT` | Estado propio + version. |
| `GET /prospects/{id}/evaluations` | `SCOUT` | Evaluaciones propias paginadas. |
| `POST /prospects/{id}/evaluations` | `SCOUT` | Nueva evaluacion append-only. |
| `GET /prospects/{id}/evaluations/{evaluationId}` | `SCOUT` | Solo propia. |
| `DELETE` en cualquier ruta SCP-006 | Ninguno | `405`, salvo `403` previo por CSRF. |
| Cualquier ruta SCP-006 | Otros roles | `403 ACCESS_DENIED`. |

## Elegibilidad del jugador

Se puede crear una prospeccion solo si el `PlayerProfile`:

- esta `operationalStatus = ACTIVE`;
- esta `profileStatus = COMPLETE`;
- pertenece a una cuenta `User` `ACTIVE`;
- tiene `UserOrganization` con academia `operationalStatus = ACTIVE`.

La verificacion de la academia puede ser `PENDING_VERIFICATION`, `VERIFIED` o
`REJECTED`; no se filtra por verificacion. Si el jugador no existe o no es
elegible al crear, responde `404 PLAYER_NOT_FOUND`.

Para crear una evaluacion, el jugador debe seguir siendo elegible. Si dejo de
serlo, responde `409 PLAYER_NOT_ELIGIBLE`.

## DTOs

### `ProspectPlayerSummaryResponse`

```json
{
  "id": 42,
  "firstName": "Luis",
  "lastName": "Quispe",
  "photoUrl": "https://cdn.example.com/players/42.png",
  "age": 16,
  "position": "ATTACKING_MIDFIELDER",
  "positionGroup": "MIDFIELDER",
  "academy": {
    "id": 3,
    "code": "ACA-000003",
    "name": "Academia Ejemplo",
    "logoUrl": "https://...",
    "operationalStatus": "ACTIVE",
    "verificationStatus": "PENDING_VERIFICATION"
  }
}
```

No incluye fecha de nacimiento, residencia, tutor, documento, correo, telefono
ni datos de la cuenta. `photoUrl` es unicamente la URL de la foto del perfil
deportivo (puede ser `null`); no habilita acceso a documentos ni archivos
privados.

### `ProspectResponse`

```json
{
  "id": 7,
  "player": { "...": "ProspectPlayerSummaryResponse" },
  "status": "FOLLOWING",
  "privateNotes": "Seguimiento inicial",
  "startedAt": "2026-10-20T10:00:00Z",
  "lastActivityAt": "2026-10-20T10:00:00Z",
  "closedAt": null,
  "createdAt": "2026-10-20T10:00:00Z",
  "updatedAt": "2026-10-20T10:00:00Z",
  "version": 0
}
```

No incluye `scoutId` ni datos de autor.

### `ProspectCreateRequest`

```json
{
  "playerId": 42,
  "privateNotes": "Seguimiento inicial"
}
```

- `playerId`: obligatorio, positivo.
- `privateNotes`: opcional, maximo 2000 caracteres.
- Campos de autor, estado, timestamps o version se ignoran.

### `ProspectNotesUpdateRequest`

```json
{
  "privateNotes": "Nota actualizada",
  "version": 1
}
```

- `privateNotes`: opcional; `null`/vacio limpia la nota.
- `version`: obligatoria y debe coincidir con la version actual.
- Version desactualizada: `409 STALE_PROSPECT`.

### `ProspectStatusUpdateRequest`

```json
{
  "status": "PAUSED",
  "version": 1
}
```

- `status`: `FOLLOWING`, `PAUSED` o `CLOSED`.
- `version`: obligatoria.
- Transicion invalida: `409 INVALID_STATUS_TRANSITION`.
- Version desactualizada: `409 STALE_PROSPECT`.

### `ProspectEvaluationCreateRequest`

```json
{
  "evaluatedAt": "2026-10-15",
  "technicalRating": 4,
  "tacticalRating": 4,
  "physicalRating": 4,
  "mentalRating": 4,
  "overallRating": 4,
  "strengths": "Buena lectura",
  "improvements": "Mejorar definicion",
  "recommendation": "Seguir",
  "privateNotes": "Nota privada del ojeador",
  "videoUrl": "https://example.com/video"
}
```

- `evaluatedAt`: obligatoria, no futura y no anterior a `birthDate`.
- `technicalRating`, `tacticalRating`, `physicalRating`, `mentalRating`:
  obligatorios 1-5.
- `overallRating`: opcional 1-5.
- `strengths`, `improvements`, `recommendation`, `privateNotes`: opcionales,
  maximo 2000 caracteres.
- `videoUrl`: opcional, URL http/https, maximo 500.
- No acepta autor, timestamps, `prospectId` ni ids de sesion.
- La evaluacion se agrega; no existe PUT/PATCH/DELETE.

### `ProspectEvaluationResponse`

```json
{
  "id": 12,
  "prospectId": 7,
  "evaluatedAt": "2026-10-15",
  "technicalRating": 4,
  "tacticalRating": 4,
  "physicalRating": 4,
  "mentalRating": 4,
  "overallRating": 4,
  "strengths": "Buena lectura",
  "improvements": "Mejorar definicion",
  "recommendation": "Seguir",
  "privateNotes": "Nota privada del ojeador",
  "videoUrl": "https://example.com/video",
  "createdAt": "2026-10-20T10:00:00Z"
}
```

No incluye datos de cuenta ni PII del jugador.

## Endpoints

### `GET /api/v1/prospects`

Parametros:

- `page`: defecto `0`.
- `size`: defecto `20`, maximo `100`.
- `sort`: defecto `lastActivityAt,desc`. Permitidos: `startedAt`,
  `lastActivityAt`, `status`, `playerName`. `playerName` ordena por apellido.
- `status`: filtro exacto.
- `playerId`: id de `PlayerProfile`.
- `q`: busqueda literal por nombres/apellidos, maximo 100, escapando `%`, `_`
  y `!`.

Respuesta `200` con `PageResponse<ProspectResponse>`, solo del ojeador
autenticado.

### `POST /api/v1/prospects`

- Requiere CSRF.
- Request: `ProspectCreateRequest`.
- Respuesta `201` con `ProspectResponse`.
- Duplicado: `409 PROSPECT_ALREADY_EXISTS`.
- Jugador no elegible o inexistente: `404 PLAYER_NOT_FOUND`.

### `GET /api/v1/prospects/{id}`

- Solo autor.
- Respuesta `200` con `ProspectResponse`.
- Ajena/inexistente: `404 PROSPECT_NOT_FOUND`.

### `PATCH /api/v1/prospects/{id}`

- Requiere CSRF.
- Request: `ProspectNotesUpdateRequest`.
- Respuesta `200` con `ProspectResponse`.
- Actualiza `privateNotes`, `lastActivityAt` y `updatedAt`.

### `PATCH /api/v1/prospects/{id}/status`

- Requiere CSRF.
- Request: `ProspectStatusUpdateRequest`.
- Respuesta `200` con `ProspectResponse`.
- Actualiza `status`, `lastActivityAt`, `closedAt` y `updatedAt`.

### `GET /api/v1/prospects/{id}/evaluations`

- Solo autor.
- Paginado con `page` y `size`; orden fijo `evaluatedAt desc, id desc`.
- Respuesta `200` con `PageResponse<ProspectEvaluationResponse>`.

### `POST /api/v1/prospects/{id}/evaluations`

- Requiere CSRF.
- Request: `ProspectEvaluationCreateRequest`.
- Respuesta `201` con `ProspectEvaluationResponse`.
- Solo si la prospeccion es del autor, no esta `CLOSED` y el jugador sigue
  elegible.
- Actualiza `lastActivityAt` e incrementa `Prospect.version`.
- Prospeccion cerrada: `409 PROSPECT_CLOSED`.
- Jugador no elegible: `409 PLAYER_NOT_ELIGIBLE`.
- Fecha invalida: `400 INVALID_EVALUATION_DATE`.
- Ratings fuera de 1-5 o URL invalida: `400 VALIDATION_ERROR`.

### `GET /api/v1/prospects/{id}/evaluations/{evaluationId}`

- Solo autor.
- Respuesta `200` con `ProspectEvaluationResponse`.
- Evaluacion de otra prospeccion: `404 PROSPECT_EVALUATION_NOT_FOUND`.

## Errores principales

| Codigo | HTTP | Caso |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Bean Validation, rating o URL invalidos. |
| `INVALID_SORT` | 400 | Campo de orden no permitido. |
| `INVALID_REQUEST` | 400 | JSON invalido. |
| `INVALID_EVALUATION_DATE` | 400 | Fecha futura o anterior al nacimiento. |
| `AUTHENTICATION_REQUIRED` | 401 | Sin sesion. |
| `CSRF_INVALID` | 403 | Falta o no coincide CSRF. |
| `ACCESS_DENIED` | 403 | Rol distinto de SCOUT. |
| `PLAYER_NOT_FOUND` | 404 | Jugador inexistente o no elegible al crear. |
| `PROSPECT_NOT_FOUND` | 404 | Prospeccion inexistente o de otro ojeador. |
| `PROSPECT_EVALUATION_NOT_FOUND` | 404 | Evaluacion inexistente o de otra prospeccion. |
| `PROSPECT_ALREADY_EXISTS` | 409 | El ojeador ya sigue a ese jugador. |
| `STALE_PROSPECT` | 409 | Version desactualizada. |
| `INVALID_STATUS_TRANSITION` | 409 | Transicion no permitida. |
| `PROSPECT_CLOSED` | 409 | Evaluacion sobre prospeccion cerrada. |
| `PLAYER_NOT_ELIGIBLE` | 409 | Jugador dejo de ser elegible. |
| `DATA_CONFLICT` | 409 | Conflicto de concurrencia o integridad distinto de la unique scout-player. |
| `METHOD_NOT_ALLOWED` | 405 | DELETE o metodo no permitido. |

## Persistencia

- `prospects`: `scout_id`, `player_id`, `status`, `private_notes`,
  `started_at`, `last_activity_at`, `closed_at`, `version`, timestamps.
  Unique `(scout_id, player_id)`.
  Indices: `(scout_id, status)`, `(scout_id, last_activity_at)` y
  `(player_id)`.
- La unique `(scout_id, player_id)` se traduce a `PROSPECT_ALREADY_EXISTS`.
  Otras violaciones de integridad se traducen a `DATA_CONFLICT`.
- La distincion usa el nombre de la constraint o las columnas `scout_id` y
  `player_id`. Si el proveedor de base de datos no expone esa informacion, la
  carrera de duplicado cae en `DATA_CONFLICT`; el precheck normal sigue
  devolviendo `PROSPECT_ALREADY_EXISTS`.
- `prospect_evaluations`: `prospect_id`, `created_by_user_id`, `evaluated_at`,
  ratings, textos, `video_url`, `created_at`. Sin version ni update.
- No hay tabla de archivos.
- No hay entidades de recomendaciones ni club.
- Sin Flyway; esquema gestionado por JPA/Hibernate.

## Agregados y calculos

No existen endpoints de agregados, conteos, rankings ni promedios para
prospecciones o evaluaciones. `ADMIN` no recibe ningun agregado de SCP-006. El
listado devuelve solo las prospecciones del ojeador autenticado, paginadas.

## Pruebas cubiertas

- SCOUT crea, lee y actualiza solo su prospeccion.
- Otro SCOUT recibe `404`; otros roles reciben `403`.
- Unique por `(scout, player)` y varios ojeadores por jugador.
- Transiciones validas/invalidas, cierre y reapertura.
- Evaluaciones append-only, sin PUT/DELETE, validacion de ratings, fecha, URL,
  ownership, cierre y jugador inactivo.
- PII no expuesta; `player.photoUrl` se devuelve cuando el perfil tiene foto.
- Filtros, paginacion, orden real por `playerName`, `q` literal con `%`, `_` y
  `!`, CSRF y `no-store`.
- `lastActivityAt` y version incrementados por evaluacion; version anterior
  produce `409 STALE_PROSPECT`.
- `401` sin sesion, transiciones invalidas, evaluacion de otra prospeccion,
  jugador inexistente/INCOMPLETE/cuenta inactiva/academia inactiva.
- Errores de SCP-006 con `Cache-Control: no-store`.
- Regresiones SCP-002 a SCP-005.
