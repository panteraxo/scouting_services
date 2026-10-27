# Contrato de API - jugadores e historial deportivo (SCP-005)

Prefijo: `/api/v1`. Todas las respuestas son JSON. La identidad, el rol y la
academia del actor se obtienen del contexto de seguridad del servidor. Ningun
request acepta `actorId`, `academyId` como autoridad ni autoría.

Implementacion: Java 21, Spring Boot, Spring Data JPA, Bean Validation y MySQL.
Sin Flyway. Las URLs de foto, video y evidencia usan el validador `@HttpUrl`;
no hay carga binaria.

## Alcance

Incluye:

- Perfil deportivo 1:1 con una cuenta `PLAYER`.
- Alta conjunta de cuenta `PLAYER` y perfil desde el modulo Jugadores.
- Academia actual derivada de `UserOrganization`; no existe `academy_id` en el perfil.
- Residencia propia del jugador por UBIGEO de distrito.
- Tutor y consentimiento del tutor para menores.
- Historial deportivo append-only, correcciones auditadas y revisiones.
- Estadisticas anuales, por tipo de actividad, por posicion y por grupo.
- Directorio con filtros de residencia, edad, posicion y academia.

No incluye:

- `Prospeccion` ni `Evaluacion` privada del ojeador (SCP-006).
- `Recomendacion` ni respuesta de club (SCP-007).
- Carga binaria de archivos.
- Borrado fisico o logico de perfiles, historial o tutor.

## Reglas generales

- Cada cuenta tiene un unico rol. Solo una cuenta `PLAYER` puede tener perfil.
- La academia se obtiene de `UserOrganization`; nunca del body ni de un query
  param en rutas de alcance propio.
- Un perfil tiene `operationalStatus` (`ACTIVE`/`INACTIVE`) y `profileStatus`
  (`INCOMPLETE`/`COMPLETE`). Son estados distintos.
- `profileStatus = COMPLETE` exige: `birthDate`, `residenceUbigeoCode`,
  `position`, `dominantFoot`, `heightCm`, `weightKg` y, si el jugador es menor,
  tutor registrado.
- Un perfil `INCOMPLETE` no aparece al `SCOUT`.
- `yearsExperience` no se almacena. Se deriva de la primera actividad historica
  de cualquier tipo: `Period.between(min(activityDate), today).getYears()`.
  Si no hay historial, es `null`.
- `DID_NOT_PLAY` normaliza minutos, goles, asistencias y tarjetas a cero conocido.
  Un campo `null` representa desconocido y nunca se convierte en cero.
- `DID_NOT_PLAY` no admite metricas posicionales; responde `400 INVALID_HISTORY_STAT`.
- Los ratings van de 1 a 5. El rating general es opcional y explicito.
- No hay `DELETE` en SCP-005. Las rutas intentadas responden `405` cuando pasan
  el filtro CSRF; sin CSRF pueden responder `403` antes de llegar al handler.
- Todos los `POST`, `PUT` y `PATCH` requieren CSRF (`X-CSRF-TOKEN`).
- Las respuestas con datos de menores usan `Cache-Control: no-store` en listado,
  candidatos de cuenta, perfil, historial, estadisticas, tutor y consentimiento.
- Un cambio de rol de una cuenta `PLAYER` con cualquier perfil existente se
  bloquea con `409 PLAYER_PROFILE_EXISTS`, incluso si el perfil esta `INACTIVE`.
  SCP-005 no borra perfiles; el retiro requiere un proceso futuro.

## Catalogos cerrados

### Posiciones

| Codigo | Etiqueta | Grupo |
|---|---|---|
| `GOALKEEPER` | Arquero | `GOALKEEPER` |
| `CENTER_BACK` | Defensa central | `DEFENDER` |
| `FULL_BACK` | Lateral | `DEFENDER` |
| `WING_BACK` | Carrilero | `DEFENDER` |
| `DEFENSIVE_MIDFIELDER` | Mediocampista defensivo | `MIDFIELDER` |
| `CENTRAL_MIDFIELDER` | Mediocampista central | `MIDFIELDER` |
| `ATTACKING_MIDFIELDER` | Mediocampista ofensivo | `MIDFIELDER` |
| `LEFT_MIDFIELDER` | Mediocampista izquierdo | `MIDFIELDER` |
| `RIGHT_MIDFIELDER` | Mediocampista derecho | `MIDFIELDER` |
| `LEFT_WINGER` | Extremo izquierdo | `FORWARD` |
| `RIGHT_WINGER` | Extremo derecho | `FORWARD` |
| `SECOND_STRIKER` | Segundo delantero | `FORWARD` |
| `STRIKER` | Delantero centro | `FORWARD` |

`positionGroup` se deriva en servidor y nunca se acepta como entrada.

### Categorias de edad

`SUB_8`, `SUB_10`, `SUB_12`, `SUB_13`, `SUB_14`, `SUB_15`, `SUB_16`,
`SUB_17`, `SUB_18`, `SUB_20`, `SUB_23`, `SENIOR`.

### Tipos de actividad

| Codigo | Etiqueta | Cuenta como partido |
|---|---|---|
| `OFFICIAL_MATCH` | Partido oficial | Si |
| `FRIENDLY_MATCH` | Amistoso | Si |
| `TOURNAMENT` | Torneo | Si |
| `TRAINING` | Entrenamiento | No |
| `SPORTS_TRIAL` | Prueba deportiva | No |

`TOURNAMENT` se registra por partido; el nombre del torneo va en `competition`.

### Niveles competitivos

`ACADEMY`, `LOCAL`, `REGIONAL`, `NATIONAL`, `INTERNATIONAL`.

### Participacion

`STARTER`, `SUBSTITUTE`, `DID_NOT_PLAY`; `null` = desconocido.

### Resultado

`WIN`, `DRAW`, `LOSS`.

### Metricas posicionales exactas

No se aceptan codigos adicionales.

| Grupo | Metricas |
|---|---|
| `GOALKEEPER` | `saves`, `goalsConceded`, `cleanSheet`, `crossInterventions`, `passesAttempted`, `passesCompleted` |
| `DEFENDER` | `successfulTackles`, `interceptions`, `clearances`, `duelsWon`, `blocks`, `errorsLeadingToChance` |
| `MIDFIELDER` | `passesAttempted`, `passesCompleted`, `interceptions`, `keyPasses`, `assists`, `recoveries`, `duelsWon`, `successfulDribbles`, `shots` |
| `FORWARD` | `goals`, `assists`, `shots`, `successfulDribbles`, `chancesCreated`, `crossesAttempted`, `crossesCompleted` |

Reglas:

- Solo se acepta el grupo correspondiente al `positionPlayed`.
- `cleanSheet` es booleano; el resto son enteros no negativos.
- `passesCompleted <= passesAttempted` si ambos existen.
- `crossesCompleted <= crossesAttempted` si ambos existen.
- `goalsConceded` debe coincidir con `opponentGoals` si ambos existen.
- `cleanSheet` debe coincidir con `goalsConceded == 0` si ambos existen.
- `goals`/`assists` posicionales deben coincidir con `playerGoals`/`assists`
  generales si ambos existen.
- `yellowCards` y `redCards` son campos generales del historial, fuera de
  `metrics`.

## Permisos por ruta

| Metodo y ruta | Roles efectivos | Alcance |
|---|---|---|
| `GET /players` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR`, `SCOUT` | Admin: todos. Staff: su academia. Scout: activos/complete de academia activa. |
| `GET /players/account-candidates` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR` | Staff: su academia. Admin: puede filtrar por academia. |
| `POST /players` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR` | Staff: su academia. Admin: cualquier academia valida. Perfil para una cuenta `PLAYER` existente. |
| `POST /players/with-account` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR` | Crea cuenta `PLAYER` y perfil en una transaccion. Staff: su academia. Admin: `academyId` obligatorio. |
| `GET /players/me` | `PLAYER` | Solo su perfil. |
| `GET /players/{id}` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR`, `SCOUT`, `PLAYER` | Proyeccion por rol. |
| `PUT /players/{id}` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR` | Staff: su academia; perfil inactivo es solo lectura para staff. |
| `PATCH /players/{id}/status` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR` | Staff puede inhabilitar; solo admin reactiva. |
| `GET /players/{id}/guardian` | `ACADEMY_DIRECTOR`, `PROFESSOR`, `SCOUT` | Staff: su academia. Scout: menor activo/complete. Admin/Player/Club: denegado. |
| `PUT /players/{id}/guardian` | `ACADEMY_DIRECTOR`, `PROFESSOR` | Solo staff de la academia actual. |
| `PUT /players/{id}/guardian/consent` | `ACADEMY_DIRECTOR`, `PROFESSOR` | Solo staff de la academia actual. |
| `GET /players/{id}/history` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR`, `SCOUT`, `PLAYER` | Segun alcance del perfil. |
| `POST /players/{id}/history` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR` | Append-only. |
| `GET /players/{id}/history/{historyId}` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR`, `SCOUT`, `PLAYER` | Segun alcance. |
| `PUT /players/{id}/history/{historyId}` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR` | Correccion; academia actual para staff. |
| `GET /players/{id}/history/{historyId}/revisions` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR` | Auditoria. |
| `GET /players/{id}/stats` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR`, `SCOUT`, `PLAYER` | Segun alcance. |
| `DELETE` en rutas SCP-005 | Ninguno | `405 METHOD_NOT_ALLOWED`. |
| Cualquier ruta SCP-005 | `CLUB_MANAGER` | `403 ACCESS_DENIED`. |

Un acceso a un jugador fuera del alcance del staff, del ojeador o del propio
jugador responde `404 PLAYER_NOT_FOUND` para evitar enumeracion.

## Filtros de `GET /players`

- `page`: defecto `0`.
- `size`: defecto `20`, maximo `100`.
- `sort`: defecto `lastName,asc`. Permitidos: `lastName`, `firstName`,
  `birthDate`, `createdAt`, `updatedAt`. El `SCOUT` no puede ordenar por
  `birthDate`; responde `400 INVALID_SORT`.
- `q`: maximo 100 caracteres. Busca literalmente por nombres y apellidos;
  escapa `%`, `_` y `!`. No busca documento, correo, telefono ni tutor.
- `position`: posicion detallada.
- `positionGroup`: `GOALKEEPER`, `DEFENDER`, `MIDFIELDER`, `FORWARD`.
- `ageMin`, `ageMax`: 0–100. Se calculan en `America/Lima` desde `birthDate`.
- `regionCode`: 2 digitos UBIGEO de **residencia del jugador**, no de la academia.
- `provinceCode`: 4 digitos; permitido a ADMIN, staff y SCOUT.
- `districtCode`: 6 digitos; solo ADMIN/staff. El SCOUT no puede usarlo.
- `academyId`: filtra por academia actual.
- `operationalStatus`: solo ADMIN/staff.
- `profileStatus`: solo ADMIN/staff.

El SCOUT siempre recibe `operationalStatus=ACTIVE`, `profileStatus=COMPLETE`,
cuenta `ACTIVE` y academia operativamente `ACTIVE`. No se filtra por
`verificationStatus`: la academia puede estar `PENDING_VERIFICATION` o
`REJECTED`, y la ficha muestra ese estado.

## DTOs de perfil

### `PlayerDirectoryItemResponse`

```json
{
  "id": 42,
  "firstName": "Luis",
  "lastName": "Quispe",
  "age": 16,
  "yearsExperience": 5,
  "photoUrl": "https://...",
  "position": "ATTACKING_MIDFIELDER",
  "positionGroup": "MIDFIELDER",
  "bestPosition": "LEFT_WINGER",
  "bestPositionGroup": "FORWARD",
  "dominantFoot": "RIGHT",
  "heightCm": 172,
  "weightKg": 64.50,
  "residence": {
    "departmentCode": "15",
    "departmentName": "Lima",
    "provinceCode": "1501",
    "provinceName": "Lima",
    "districtCode": "150101",
    "districtName": "Lima"
  },
  "academy": {
    "id": 3,
    "code": "ACA-000003",
    "name": "Academia Ejemplo",
    "logoUrl": "https://...",
    "operationalStatus": "ACTIVE",
    "verificationStatus": "PENDING_VERIFICATION"
  },
  "operationalStatus": "ACTIVE",
  "profileStatus": "COMPLETE"
}
```

No incluye `birthDate`, tutor, documento, correo ni telefono de la cuenta.
`heightCm` y `weightKg` se incluyen para ADMIN, staff y SCOUT; se omiten del
JSON cuando son desconocidos (`null`). El listado nunca expone fecha de
nacimiento, datos del tutor, documento, correo ni telefono.
ADMIN y staff reciben `districtCode`/`districtName` en `GET /players`.
En respuestas de `SCOUT` se omiten `operationalStatus`, `profileStatus` y los
campos de distrito (`districtCode`, `districtName`).

### `PlayerOwnResponse`

Incluye:

- `id`, nombres y apellidos.
- `birthDate`, `age`, `yearsExperience`.
- `heightCm`, `weightKg`.
- `position`/`positionGroup`, `bestPosition`/`bestPositionGroup`.
- `dominantFoot`, `summary`, `photoUrl`.
- `residence` completa con distrito.
- `academy`.
- `operationalStatus`, `profileStatus`.
- `canEdit: false`.
- `createdAt`, `updatedAt`, `version`.

No incluye tutor ni consentimiento.

### `PlayerAdminDetailResponse`

Incluye `userId`, perfil completo, residencia completa, academia,
`operationalStatus`, `profileStatus`, `guardianRequired`, autoría y timestamps.

No incluye nombre, documento, telefono, direccion, relacion, consentimiento ni
ningun otro dato del tutor.

### `PlayerStaffDetailResponse`

Incluye el perfil completo y:

- `guardianRequired`.
- `guardianDataStatus`: `NOT_APPLICABLE`, `MISSING`, `RECORDED`.
- `guardianConsentStatus`: `NOT_RECORDED`, `GRANTED`, `DENIED`, `REVOKED`.

Los datos concretos del tutor solo salen por `/guardian`.

### `PlayerScoutDetailResponse`

Incluye perfil deportivo, `age`, `yearsExperience`, posicion/grupo, residencia
con departamento/provincia (sin distrito), academia con `verificationStatus` y
`guardianDataAvailable`.

No incluye `birthDate`, `userId`, estados internos, timestamps, auditoria,
tutor ni consentimiento.

### `PlayerCreateRequest`

```json
{
  "userId": 12,
  "birthDate": "2010-04-15",
  "residenceUbigeoCode": "150101",
  "heightCm": 172,
  "weightKg": 64.50,
  "position": "ATTACKING_MIDFIELDER",
  "bestPosition": "LEFT_WINGER",
  "dominantFoot": "RIGHT",
  "summary": "...",
  "photoUrl": "https://..."
}
```

- `userId`: cuenta `PLAYER` activa, con `UserOrganization` de academia y dentro
  del alcance del actor.
- Para `PROFESSOR`/`ACADEMY_DIRECTOR`, si la cuenta no existe o no pertenece a su
  academia, responde `404 PLAYER_ACCOUNT_NOT_FOUND` antes de evaluar rol, estado
  o existencia de perfil. No se permite enumerar cuentas fuera del alcance.
- `ADMIN` conserva errores especificos: cuenta inexistente `404`, rol distinto de
  `PLAYER` `409 PLAYER_ACCOUNT_REQUIRED`, cuenta inactiva
  `409 PLAYER_ACCOUNT_INACTIVE` y cuenta sin academia `409 PLAYER_WITHOUT_ACADEMY`.
- La cuenta objetivo se bloquea con lock pesimista antes de validar rol y
  academia, para que un cambio de rol concurrente no deje perfiles huerfanos.
- `birthDate`: obligatoria, no futura.
- `residenceUbigeoCode`: obligatorio, 6 digitos, existente en UBIGEO INEI.
- `heightCm`: opcional 80–250.
- `weightKg`: opcional 20.00–200.00.
- `position` y `dominantFoot`: obligatorios.
- `bestPosition`, `summary`, `photoUrl`: opcionales.
- No acepta `yearsExperience`, `academyId`, tutor, estados ni autoría.

### `PlayerAccountCreateRequest`

Alta conjunta: crea la cuenta `PLAYER` con contrasena temporal y el perfil
deportivo en una sola transaccion. Si el perfil es invalido, no queda ninguna
cuenta creada.

```json
{
  "firstName": "Luis",
  "lastName": "Quispe",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "phone": "987654321",
  "email": "luis.quispe@example.com",
  "username": "luis.quispe",
  "academyId": 3,
  "birthDate": "2010-04-15",
  "residenceUbigeoCode": "150101",
  "heightCm": 172,
  "weightKg": 64.50,
  "position": "ATTACKING_MIDFIELDER",
  "bestPosition": "LEFT_WINGER",
  "dominantFoot": "RIGHT",
  "summary": "...",
  "photoUrl": "https://..."
}
```

- Identidad: mismas validaciones que `AdminUserCreateRequest` (`firstName`,
  `lastName`, `documentType`, `documentNumber`, `phone`, `email`, `username`).
- `academyId`: obligatorio solo para `ADMIN`; responde `400 ACADEMY_REQUIRED`
  si falta. Para `ACADEMY_DIRECTOR` y `PROFESSOR` se ignora y se usa la academia
  de la sesion, que debe estar `ACTIVE`.
- Perfil: mismas validaciones que `PlayerCreateRequest` sin `userId`.
- No acepta `role`, `status`, `password`, `passwordHash`, `mustChangePassword`,
  tutor, autoría ni organizacion para staff.
- Un correo, usuario o documento duplicado responde `409 USER_ALREADY_EXISTS`
  sin crear el perfil.
- Email, usuario, telefono y documento no se devuelven en la respuesta del
  perfil.

### `PlayerAccountCreatedResponse`

```json
{
  "player": { "...": "detalle admin/staff del perfil" },
  "temporaryPassword": "Abc123!@#...",
  "temporaryPasswordExpiresAt": "2026-10-25T10:00:00Z"
}
```

- `player`: `PlayerAdminDetailResponse` para `ADMIN` y
  `PlayerStaffDetailResponse` para staff.
- `temporaryPassword`: se devuelve una sola vez; no se persiste en claro ni se
  registra en logs. La cuenta queda `mustChangePassword = true` con vigencia de
  24 horas.
- La respuesta usa `Cache-Control: no-store` y `Pragma: no-cache`.

### `PlayerUpdateRequest`

Mismos campos que `PlayerCreateRequest`, sin `userId`, mas `version`
obligatoria. Reemplazo total de los campos del perfil. No cambia academia,
cuenta, estado operativo ni tutor.

Si existe historial, `birthDate` no puede ser posterior a la primera actividad
registrada: `400 BIRTH_DATE_AFTER_HISTORY`. Una correccion que vuelve menor al
jugador recalcula `profileStatus` y exige tutor para `COMPLETE`. Al crear o
corregir historial se bloquea el perfil para serializar la validacion con
`birthDate`.

### `PlayerStatusUpdateRequest`

```json
{ "status": "INACTIVE" }
```

Staff puede inhabilitar. Solo ADMIN puede reactivar. Un perfil inactivo queda en
solo lectura para staff.

## DTOs de tutor y consentimiento

### `PlayerGuardianStaffResponse`

```json
{
  "playerId": 42,
  "minor": true,
  "firstName": "Maria",
  "lastName": "Quispe",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "phone": "987654321",
  "address": "Av. Ejemplo 123",
  "relationship": "Madre",
  "consent": {
    "status": "GRANTED",
    "recordedAt": "2026-02-01T10:00:00Z",
    "recordedBy": { "id": 7, "firstName": "Ana", "lastName": "Torres", "role": "PROFESSOR" },
    "evidenceUrl": "https://...",
    "note": "Autorizacion firmada."
  },
  "version": 1,
  "updatedAt": "2026-02-01T10:00:00Z"
}
```

No existe `email` de tutor.

### `PlayerGuardianScoutResponse`

Mismos datos de tutor y contacto, pero el consentimiento solo incluye `status` y
`recordedAt`. No incluye `recordedBy`, `evidenceUrl` ni `note`.

### `PlayerGuardianUpsertRequest`

```json
{
  "firstName": "Maria",
  "lastName": "Quispe",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "phone": "987654321",
  "address": "Av. Ejemplo 123",
  "relationship": "Madre",
  "version": null
}
```

- Todos los campos son obligatorios excepto `version`.
- `version` es obligatoria cuando ya existe tutor.
- Solo staff de la academia actual.
- ADMIN, SCOUT y PLAYER no escriben tutor.
- Un jugador adulto responde `409 GUARDIAN_NOT_APPLICABLE`.

### `GuardianConsentUpdateRequest`

```json
{
  "status": "GRANTED",
  "evidenceUrl": "https://...",
  "note": "Autorizacion firmada."
}
```

- `status`: `GRANTED`, `DENIED` o `REVOKED`; `NOT_RECORDED` no se acepta.
- `evidenceUrl`: opcional, URL http/https; no se suben archivos.
- `note`: opcional, maximo 500.
- `recordedAt` y `recordedBy` los fija el servidor.
- Transiciones:
  - `NOT_RECORDED -> GRANTED|DENIED`
  - `DENIED|REVOKED -> GRANTED`
  - `GRANTED -> REVOKED`
- Cada cambio crea un evento append-only.

## Historial deportivo

### `PlayerHistoryEntryCreateRequest`

```json
{
  "activityType": "OFFICIAL_MATCH",
  "activityDate": "2026-05-10",
  "competition": "Copa Peru",
  "opponent": "Club Ejemplo",
  "ageCategory": "SUB_17",
  "competitiveLevel": "NATIONAL",
  "positionPlayed": "STRIKER",
  "participation": "STARTER",
  "minutesPlayed": 90,
  "teamResult": "WIN",
  "teamGoals": 2,
  "opponentGoals": 1,
  "playerGoals": 1,
  "assists": 1,
  "yellowCards": 0,
  "redCards": 0,
  "observations": "...",
  "videoUrl": "https://...",
  "videoTimestampSeconds": 125,
  "videoDescription": "...",
  "metrics": {
    "goalkeeper": null,
    "defender": null,
    "midfielder": null,
    "forward": {
      "goals": 1,
      "assists": 1,
      "shots": 3,
      "successfulDribbles": 2,
      "chancesCreated": 2,
      "crossesAttempted": 4,
      "crossesCompleted": 2
    }
  },
  "ratings": {
    "technical": 4,
    "tactical": 4,
    "physical": 4,
    "mental": 4,
    "overall": 4
  },
  "strengths": "...",
  "improvements": "...",
  "recommendations": "..."
}
```

Reglas:

- `activityType` y `activityDate` obligatorios.
- `activityDate` no futura y no anterior al nacimiento.
- `OFFICIAL_MATCH`, `FRIENDLY_MATCH` y `TOURNAMENT` exigen `opponent`,
  `ageCategory`, `competitiveLevel`, `positionPlayed` y `teamResult`.
- `teamGoals` y `opponentGoals`: ambos o ninguno.
- Si ambos existen, deben coincidir con `teamResult`.
- `TRAINING` y `SPORTS_TRIAL` no aceptan `teamResult`, `teamGoals` ni
  `opponentGoals`.
- `playerGoals`/`assists` no pueden superar `teamGoals` si ambos existen.
- `minutesPlayed > 0` exige participacion `STARTER` o `SUBSTITUTE`.
- `DID_NOT_PLAY` normaliza minutos, goles, asistencias y tarjetas a cero.
- `DID_NOT_PLAY` con metricas posicionales no nulas responde
  `400 INVALID_HISTORY_STAT`.
- Las metricas negativas se rechazan con `400 VALIDATION_ERROR`.
- `videoTimestampSeconds` y `videoDescription` exigen `videoUrl`.
- Ratings 1–5 o `null`.
- Las metricas solo pueden pertenecer al grupo de `positionPlayed`.
- No acepta autor, `playerId`, `revisionNumber`, `version` ni `teamResult`
  derivado.

### `PlayerHistoryEntryCorrectionRequest`

Mismos campos que `PlayerHistoryEntryCreateRequest`, mas:

- `expectedVersion`: obligatorio; debe coincidir con la version actual.
- `correctionReason`: obligatorio, 5–500 caracteres.

La correccion conserva `createdBy` original, actualiza `lastModifiedBy`,
incrementa `revisionNumber` y crea un snapshot en `player_history_revisions`.
No existe borrado.

### `PlayerHistoryEntryResponse`

Incluye todos los campos de la entrada, `positionGroup`, metricas, ratings,
`author`, `lastEditedBy`, `createdAt`, `updatedAt`, `version` y
`revisionNumber`. Usa `teamResult` explicito; no devuelve un `result` derivado.

### `PlayerHistoryRevisionResponse`

Incluye `revisionNumber`, `changeType`, `reason`, `editedBy`, `editedAt` y
`snapshot` con el estado completo de la entrada en esa revision. No incluye
tutor ni notas privadas de SCP-006.

## Estadisticas

`GET /players/{playerId}/stats` devuelve:

- `career`: totales de partidos.
- `byYear`: agrupado por ano de `activityDate`.
- `byActivityType`: los cinco tipos, incluso vacios.
- `byPosition`: posiciones detalladas con partidos.
- `byPositionGroup`: los cuatro grupos con partidos.
- `ratings`: promedios tecnico/tactico/fisico/mental/general de partidos.

Solo `OFFICIAL_MATCH`, `FRIENDLY_MATCH` y `TOURNAMENT` cuentan como partidos.
`TRAINING` y `SPORTS_TRIAL` no cuentan para `career`, `byYear`, `byPosition` ni
`byPositionGroup`.

Cada `StatCountResponse` y `StatAverageResponse` contiene:

```json
{
  "value": 10,
  "knownEntries": 12,
  "totalEntries": 12,
  "complete": true,
  "coverage": 1.0000
}
```

- `value` es `null` si no hay datos conocidos.
- `knownEntries` cuenta valores no nulos; `DID_NOT_PLAY` normaliza a cero.
- `coverage = knownEntries / totalEntries`; `null` si `totalEntries = 0`.
- `complete = totalEntries > 0 && knownEntries == totalEntries`.
- `matchesPlayed` cuenta `STARTER` y `SUBSTITUTE`.
- `matchesRecorded` es el numero de entradas de partido.
- `minutes`, goles, asistencias y tarjetas suman solo valores conocidos.
- `averageOverallRating` promedia solo ratings generales conocidos.
- `goalsPerMatch` y `assistsPerMatch` solo tienen valor si participacion y
  goles/asistencias estan completos y `matchesPlayed > 0`.
- `results` contiene `wins`, `draws`, `losses`, `unknownResults` y `winRate`.
- `winRate = wins / (wins + draws + losses)`; `null` si no hay resultados.
- En `byActivityType`, un tipo no-partido tiene `matchesPlayed.value = null`,
  `results = null`, `goalsPerMatch = null` y `assistsPerMatch = null`.

## Proyecciones y PII

| Dato | ADMIN | Staff academia actual | SCOUT | PLAYER propio | CLUB_MANAGER |
|---|---|---|---|---|---|
| Perfil deportivo | Si | Si | Si, activo/complete | Si | No |
| `birthDate` | Si | Si | No; solo `age` | Si | No |
| Residencia | Completa | Completa | Departamento/provincia | Completa | No |
| Academia | Si | Si | Si, con verificacion | Si | No |
| Tutor | No | Si | Si, menor activo/complete | No | No |
| Consentimiento | No | Si | Solo estado/fecha | No | No |
| Evidencia/nota | No | Si | No | No | No |
| Historial actual | Si | Si | Si, activo/complete | Solo propio | No |
| Revisiones | Si | Si | No | No | No |
| Notas privadas SCP-006 | No | No | No | No | No |

Reglas adicionales:

- ADMIN nunca lee ni escribe tutor.
- El tutor nunca se incluye en DTOs generales.
- El SCOUT no recibe distrito de residencia ni fecha de nacimiento.
- Un jugador adulto no expone tutor ni consentimiento por API.
- No se registran datos de tutor en logs ni snapshots de historial.
- Solo se aceptan URLs; no hay `multipart/form-data` para tutor.

## Errores principales

| Codigo | HTTP | Caso |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Bean Validation. |
| `ACADEMY_REQUIRED` | 400 | ADMIN intenta crear jugador sin `academyId`. |
| `INVALID_ROLE` | 400 | PLAYER enviado a `POST /admin/users`. |
| `INVALID_REQUEST` | 400 | JSON invalido o metrica desconocida. |
| `INVALID_SORT` | 400 | Campo de orden no permitido. |
| `INVALID_AGE_RANGE` | 400 | Rango de edad invalido. |
| `INVALID_LOCATION_FILTER` | 400 | Jerarquia UBIGEO invalida. |
| `INVALID_RESIDENCE_UBIGEO` | 400 | UBIGEO de residencia inexistente. |
| `INVALID_BIRTH_DATE` | 400 | Fecha futura o invalida. |
| `BIRTH_DATE_AFTER_HISTORY` | 400 | Fecha de nacimiento posterior a la primera actividad registrada. |
| `INVALID_ACTIVITY_DATE` | 400 | Fecha futura o anterior al nacimiento. |
| `TEAM_RESULT_REQUIRED` | 400 | Partido sin resultado. |
| `RESULT_SCORE_MISMATCH` | 400 | Resultado no coincide con marcador. |
| `INCOMPLETE_SCORE` | 400 | Solo un marcador informado. |
| `RESULT_NOT_APPLICABLE` | 400 | Resultado en entrenamiento/prueba. |
| `INVALID_HISTORY_STAT` | 400 | Goles/asistencias/minutos/cartulinas inconsistentes. |
| `INVALID_POSITION_METRICS` | 400 | Metricas de otro grupo. |
| `METRIC_STAT_MISMATCH` | 400 | Metrica incompatible con estadistica general. |
| `INVALID_CONSENT_STATUS` | 400 | Consentimiento `NOT_RECORDED` enviado. |
| `AUTHENTICATION_REQUIRED` | 401 | Sin sesion. |
| `CSRF_INVALID` | 403 | Falta o no coincide CSRF. |
| `ACCESS_DENIED` | 403 | Rol sin permiso. |
| `ROLE_NOT_ALLOWED` | 403 | Staff intenta crear PLAYER desde Usuarios. |
| `GUARDIAN_ACCESS_DENIED` | 403 | ADMIN/PLAYER/CLUB accede a tutor. |
| `PLAYER_NOT_FOUND` | 404 | Perfil inexistente o fuera de alcance. |
| `PLAYER_ACCOUNT_NOT_FOUND` | 404 | Cuenta objetivo inexistente o fuera de alcance. |
| `PLAYER_HISTORY_NOT_FOUND` | 404 | Entrada inexistente o de otro jugador. |
| `GUARDIAN_NOT_FOUND` | 404 | Tutor no registrado o adulto consultado por scout. |
| `PLAYER_PROFILE_ALREADY_EXISTS` | 409 | Perfil duplicado. |
| `USER_ALREADY_EXISTS` | 409 | Correo, usuario o documento duplicado en el alta conjunta. |
| `PLAYER_ACCOUNT_REQUIRED` | 409 | Cuenta sin rol PLAYER. |
| `PLAYER_ACCOUNT_INACTIVE` | 409 | Cuenta no activa. |
| `PLAYER_WITHOUT_ACADEMY` | 409 | Cuenta sin academia. |
| `PLAYER_PROFILE_INACTIVE` | 409 | Staff intenta modificar perfil inactivo. |
| `ONLY_ADMIN_CAN_REACTIVATE` | 409 | Staff intenta reactivar perfil. |
| `ACADEMY_INACTIVE` | 409 | Escritura de staff en academia inactiva. |
| `STALE_PLAYER_PROFILE` | 409 | Version de perfil desactualizada. |
| `STALE_GUARDIAN` | 409 | Version de tutor desactualizada. |
| `STALE_HISTORY_ENTRY` | 409 | Version de historial desactualizada. |
| `GUARDIAN_NOT_APPLICABLE` | 409 | Tutor en jugador adulto. |
| `GUARDIAN_REQUIRED` | 409 | Consentimiento sin tutor. |
| `INVALID_CONSENT_TRANSITION` | 409 | Transicion de consentimiento invalida. |
| `PLAYER_PROFILE_EXISTS` | 409 | Cambio de rol con cualquier perfil existente, activo o inactivo. |
| `DATA_CONFLICT` | 409 | Conflicto optimista/pesimista de concurrencia. |
| `METHOD_NOT_ALLOWED` | 405 | Intento de DELETE que supera el filtro CSRF. |

## Persistencia

- JPA/Hibernate; sin Flyway.
- `player_profiles`: perfil, residencia, posicion, estado y autoria.
- `player_guardians`: datos restringidos del tutor; sin email.
- `player_guardian_consent_events`: eventos append-only.
- `player_history_entries`: historial con autor, resultado explicito y revision.
- `player_history_metrics`: metricas exactas por entrada.
- `player_history_revisions`: snapshots JSON de cada revision.
- `player_profiles` no tiene `academy_id`; la academia se resuelve por
  `user_organizations`.
- `years_experience` no es una columna.
- No hay entidades de SCP-006 ni SCP-007 en este modulo.

## Cambios de contrato de esta correccion

- `GET /players` incluye distrito para ADMIN/staff y lo omite solo para SCOUT.
- El SCOUT ya no recibe `operationalStatus` ni `profileStatus` en el listado.
- `sort=birthDate` se rechaza para SCOUT con `400 INVALID_SORT`.
- Las metricas anidadas se validan con Bean Validation; valores negativos
  responden `400 VALIDATION_ERROR`.
- `DID_NOT_PLAY` con metricas posicionales responde `400 INVALID_HISTORY_STAT`.
- `GET /players` y `GET /players/account-candidates` incluyen
  `Cache-Control: no-store`.
- Historial y estadisticas incluyen `Cache-Control: no-store`.
- El cambio de rol se bloquea con cualquier `PlayerProfile`, activo o inactivo.
- `POST /players` bloquea la cuenta objetivo antes de validar rol y academia.
- Para staff, una cuenta fuera de su academia responde `404` antes de revelar
  rol, estado o perfil.
- `birthDate` posterior a la primera actividad historica responde
  `400 BIRTH_DATE_AFTER_HISTORY`.
- Conflictos de bloqueo optimista/pesimista responden `409 DATA_CONFLICT`.

## Limitaciones conocidas del MVP

- `profileStatus` se recalcula al crear/editar el perfil o al registrar tutor.
  El cambio pasivo de edad no dispara una escritura hasta la proxima
  actualizacion; el acceso al tutor si se evalua por edad en cada request.
- El historial pagina en base de datos, pero las metricas de cada entrada se
  cargan por relacion; en listas grandes puede requerir optimizacion posterior.
- Las estadisticas se calculan en memoria sobre el historial del jugador; es
  adecuado para el volumen del MVP.

## Pruebas

La suite cubre:

- permisos y scope por rol;
- proyecciones PII por rol;
- tutor, consentimiento y revocacion;
- append-only, correcciones y revisiones;
- catalogos, metricas y resultado;
- estadisticas con `null` y cobertura;
- completitud de menor;
- anos de experiencia;
- bloqueo de cambio de rol;
- CSRF y ausencia de DELETE;
- regresiones de SCP-002, SCP-003 y SCP-004.
