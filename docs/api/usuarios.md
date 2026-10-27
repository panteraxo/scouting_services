# Contrato de API - usuarios y asignaciones (SCP-004)

Prefijo: `/api/v1`. Todas las respuestas son JSON. La identidad, el rol y la
organizacion del actor se obtienen siempre del contexto de seguridad del
servidor; ningun request puede fijarlos. Las rutas no listadas aqui quedan
denegadas por defecto.

## Reglas generales

- Cada cuenta tiene un unico rol: `ADMIN`, `PROFESSOR`, `ACADEMY_DIRECTOR`,
  `SCOUT`, `CLUB_MANAGER` o `PLAYER`.
- `UserOrganization` relaciona como maximo una organizacion por cuenta:
  - `PROFESSOR`, `ACADEMY_DIRECTOR`, `PLAYER`: una academia.
  - `CLUB_MANAGER`: un club.
  - `ADMIN`, `SCOUT`: sin organizacion.
- Muchas cuentas pueden compartir una academia o un club. La asociacion se
  crea, cambia y elimina junto con el rol en una sola transaccion.
- El cargo del Responsable de club se guarda en `UserOrganization.position`.
  Solo puede informarse para `CLUB_MANAGER`; es opcional. Nunca se acepta para
  roles de academia ni para `ADMIN`/`SCOUT`.
- Las cuentas internas nuevas se crean `ACTIVE` con una contrasena temporal
  generada por el servidor, almacenada con BCrypt, `mustChangePassword = true` y
  vigencia de 24 horas. No se solicita contrasena en el request.
- La contrasena temporal se devuelve **una sola vez** en la respuesta de
  creacion o de reseteo. No se guarda en claro, no se registra en logs y no se
  puede recuperar despues. Esas respuestas se envian con
  `Cache-Control: no-store` y `Pragma: no-cache`.
- El registro publico de ojeador sigue siendo la unica ruta para crear una
  cuenta `SCOUT` en estado `PENDING_APPROVAL`. La aprobacion/rechazo se realiza
  exclusivamente con `/api/v1/admin/scout-registrations/**`.
- Las cuentas `PENDING_APPROVAL` no aparecen en el listado general ni pueden
  modificarse, asignarse, resetearse o cambiarse de estado desde este modulo.
- No existe borrado fisico ni endpoint `DELETE`. La baja es logica mediante
  `status = INACTIVE`.
- Una cuenta inhabilitada no puede iniciar sesion y su sesion existente se
  invalida en la siguiente peticion. Inhabilitar una cuenta no modifica ni
  inhabilita un futuro perfil deportivo de jugador.
- No se crean ni asignan cuentas a una academia o club `INACTIVE`, ni siquiera
  desde `ADMIN`, hasta que la organizacion sea reactivada.
- Solo `ADMIN` recibe `documentNumber` y `phone` en el detalle. Los listados y
  las respuestas de creacion de alcance propio no exponen documento ni
  telefono. Ningun DTO de usuario incluye hash/contrasena, contrasena temporal,
  datos de tutor ni notas privadas de ojeadores.
- Todo `POST`, `PUT` y `PATCH` requiere CSRF: se obtiene en
  `GET /api/v1/auth/csrf` y se envia en `X-CSRF-TOKEN`.

## Permisos por ruta

| Ruta | Rol permitido | Alcance |
|---|---|---|
| `GET /api/v1/admin/users` | `ADMIN` | Todas las cuentas ACTIVE/INACTIVE |
| `POST /api/v1/admin/users` | `ADMIN` | Cualquier rol excepto `PLAYER` y organizacion valida |
| `GET /api/v1/admin/users/{id}` | `ADMIN` | Detalle administrativo |
| `PUT /api/v1/admin/users/{id}` | `ADMIN` | Datos de identidad |
| `PATCH /api/v1/admin/users/{id}/assignment` | `ADMIN` | Rol y organizacion |
| `PATCH /api/v1/admin/users/{id}/status` | `ADMIN` | Vigencia de la cuenta |
| `POST /api/v1/admin/users/{id}/reset-password` | `ADMIN` | Reseteo de cuenta ACTIVE |
| `POST /api/v1/academies/me/users` | `ACADEMY_DIRECTOR`, `PROFESSOR` | Academia de la sesion; no crea `PLAYER` |

Reglas de creacion por actor:

| Actor | Roles que puede crear | Organizacion |
|---|---|---|
| `ADMIN` | Todos excepto `PLAYER` | La indica el request segun la matriz rol-organizacion |
| `ACADEMY_DIRECTOR` | `PROFESSOR` | Siempre su propia academia, derivada de la sesion |
| `PROFESSOR` | Ninguno | No crea cuentas desde Usuarios |

`PROFESSOR` y `ACADEMY_DIRECTOR` no tienen listado, detalle ni edicion de
usuarios generales. Un intento de crear un rol fuera de su matriz responde
`403 ROLE_NOT_ALLOWED`.

La cuenta `PLAYER` ya no se crea desde este modulo: se crea junto con su perfil
deportivo mediante `POST /api/v1/players/with-account`. `POST /admin/users` con
`role=PLAYER` responde `400 INVALID_ROLE`; `POST /academies/me/users` con
`role=PLAYER` responde `403 ROLE_NOT_ALLOWED`. Ambos mensajes indican que el alta
corresponde al modulo Jugadores.

## Matriz rol-organizacion

| Rol | `academyId` | `clubId` | `position` |
|---|---|---|---|
| `ADMIN` | No | No | No |
| `SCOUT` | No | No | No |
| `PROFESSOR` | Obligatorio | No | No |
| `ACADEMY_DIRECTOR` | Obligatorio | No | No |
| `PLAYER` | Obligatorio | No | No |
| `CLUB_MANAGER` | No | Obligatorio | Opcional |

Una combinacion distinta responde `400 INVALID_ORGANIZATION_ASSIGNMENT`. Una
organizacion inexistente responde `404 ORGANIZATION_NOT_FOUND`; una organizacion
`INACTIVE` responde `409 ORGANIZATION_INACTIVE`.

La fila `PLAYER` aplica a la asignacion administrativa (`PATCH .../assignment`),
no a la creacion: la cuenta `PLAYER` se crea con su perfil desde Jugadores.

## Paginacion, filtros y orden

`GET /api/v1/admin/users` acepta:

- `page`: por defecto `0`, minimo `0`.
- `size`: por defecto `20`, entre `1` y `100`.
- `sort`: un unico campo permitido, formato `campo,asc|desc`. Por defecto
  `createdAt,desc`.
  Campos permitidos: `id`, `firstName`, `lastName`, `username`, `email`, `role`,
  `status`, `createdAt`, `updatedAt`.
- `q`: busqueda literal por nombres, apellidos, usuario, correo o documento,
  sin distinguir mayusculas/minusculas, maximo 100 caracteres. El servidor
  recorta el valor y escapa `%`, `_` y el caracter de escape `!` antes del
  `LIKE`; esos caracteres se buscan literalmente y no actuan como comodines.
- `role`: rol exacto.
- `status`: `ACTIVE` o `INACTIVE`. Enviar `PENDING_APPROVAL` responde
  `400 INVALID_STATUS_FILTER`.
- `academyId`: filtra cuentas asociadas a esa academia.
- `clubId`: filtra cuentas asociadas a ese club.

Enviar `academyId` y `clubId` a la vez responde
`400 INVALID_FILTER_COMBINATION`. Un `sort` fuera de la lista responde
`400 INVALID_SORT`. El listado siempre excluye `PENDING_APPROVAL`, aunque no se
envie `status`.

## DTOs

### `UserSummaryResponse`

Vista minima usada en listados y como resumen de creacion/reseteo:

```json
{
  "id": 12,
  "firstName": "Ana",
  "lastName": "Torres",
  "username": "ana.torres",
  "email": "ana.torres@example.com",
  "role": "PLAYER",
  "status": "ACTIVE",
  "academyId": 3,
  "academyCode": "ACA-000003",
  "academyName": "Academia Ejemplo",
  "clubId": null,
  "clubCode": null,
  "clubName": null
}
```

No incluye `documentNumber`, `phone`, hashes, secretos temporales, datos de
tutor ni notas privadas.

### `UserDetailResponse`

Detalle exclusivo de `ADMIN`:

```json
{
  "id": 12,
  "firstName": "Ana",
  "lastName": "Torres",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "email": "ana.torres@example.com",
  "phone": "987654321",
  "username": "ana.torres",
  "role": "PLAYER",
  "status": "ACTIVE",
  "mustChangePassword": true,
  "temporaryPasswordExpiresAt": "2026-10-20T22:00:00Z",
  "academyId": 3,
  "academyCode": "ACA-000003",
  "academyName": "Academia Ejemplo",
  "clubId": null,
  "clubCode": null,
  "clubName": null,
  "position": null,
  "createdAt": "2026-10-19T22:00:00Z",
  "updatedAt": "2026-10-19T22:00:00Z"
}
```

Nunca incluye `passwordHash` ni la contrasena temporal en claro.

### `UserCreatedResponse`

Respuesta de `POST /admin/users`, `POST /academies/me/users` y
`POST /admin/users/{id}/reset-password`:

```json
{
  "user": {
    "id": 12,
    "firstName": "Ana",
    "lastName": "Torres",
    "username": "ana.torres",
    "email": "ana.torres@example.com",
    "role": "PLAYER",
    "status": "ACTIVE",
    "academyId": 3,
    "academyCode": "ACA-000003",
    "academyName": "Academia Ejemplo",
    "clubId": null,
    "clubCode": null,
    "clubName": null
  },
  "temporaryPassword": "K7!mP2#vQ9@rT4xZ",
  "temporaryPasswordExpiresAt": "2026-10-20T22:00:00Z"
}
```

La contrasena temporal solo se muestra en esta respuesta.

### `AdminUserCreateRequest`

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `firstName` | string | Si | Maximo 100 |
| `lastName` | string | Si | Maximo 100 |
| `documentType` | `DNI`/`CE`/`PASSPORT` | Si | Enumeracion cerrada |
| `documentNumber` | string | Si | 4 a 30 caracteres `[A-Za-z0-9-]`; unico |
| `phone` | string | No | 6 a 20 caracteres de telefono; vacio equivale a `null` |
| `email` | string | Si | Correo valido, maximo 150; unico |
| `username` | string | Si | 3 a 30 caracteres `[A-Za-z0-9._-]`; unico |
| `role` | rol | Si | Cualquier rol del sistema excepto `PLAYER` |
| `academyId` | integer | Condicional | Obligatorio para roles de academia |
| `clubId` | integer | Condicional | Obligatorio para `CLUB_MANAGER` |
| `position` | string | No | Maximo 100; solo `CLUB_MANAGER` |

Campos desconocidos (por ejemplo `id`, `status`, `password`, `passwordHash`,
`mustChangePassword`, `academyName`) se ignoran y nunca se usan como autoridad.
El telefono es propio de la cuenta; no se copia ni se acepta el telefono del
tutor.

### `AcademyUserCreateRequest`

Mismos campos de identidad y `role`; no incluye `academyId`, `clubId`,
`position`, `status` ni contrasena. Cualquier organizacion enviada en el JSON se
ignora: la academia se deriva de `UserOrganization` de la sesion.

### `UserIdentityUpdateRequest`

Reemplazo total de los datos de identidad: `firstName`, `lastName`,
`documentType`, `documentNumber`, `phone`, `email`, `username`. No incluye rol,
estado, organizacion, contrasena ni identificadores. Los campos desconocidos se
ignoran.

### `UserAssignmentUpdateRequest`

```json
{
  "role": "CLUB_MANAGER",
  "academyId": null,
  "clubId": 4,
  "position": "Director deportivo"
}
```

Reemplaza de forma atomica el rol y la organizacion. Si el nuevo rol no lleva
organizacion, la asociacion existente se elimina. La organizacion debe estar
`ACTIVE`.

### `UserStatusUpdateRequest`

```json
{
  "status": "INACTIVE"
}
```

Solo admite `ACTIVE` o `INACTIVE`. `PENDING_APPROVAL` responde
`400 INVALID_STATUS`. Las cuentas pendientes responden
`409 PENDING_ACCOUNT_NOT_MANAGED`.

## Endpoints administrativos

### `GET /api/v1/admin/users`

- Solo `ADMIN`.
- Respuesta `200` con `PageResponse<UserSummaryResponse>`:

```json
{
  "content": [ { "id": 12, "firstName": "Ana", "...": "..." } ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

### `POST /api/v1/admin/users`

- Solo `ADMIN`; requiere CSRF.
- Request: `AdminUserCreateRequest`.
- `role=PLAYER` responde `400 INVALID_ROLE`: el alta de jugador corresponde a
  `POST /api/v1/players/with-account`.
- Respuesta `201` con `UserCreatedResponse` y `Cache-Control: no-store`.
- La cuenta se crea `ACTIVE`, con `mustChangePassword = true` y caducidad de la
  contrasena temporal a 24 horas.
- Correo, usuario o documento duplicado: `409 USER_ALREADY_EXISTS` con mensaje
  generico, sin revelar cual dato existe.
- Una cuenta `ADMIN` creada por esta via queda activa de inmediato; el sistema
  puede tener varios administradores.

### `GET /api/v1/admin/users/{id}`

- Solo `ADMIN`.
- Respuesta `200` con `UserDetailResponse`.
- Cuenta inexistente: `404 USER_NOT_FOUND`.
- No se devuelven entidades JPA ni campos internos de Hibernate.

### `PUT /api/v1/admin/users/{id}`

- Solo `ADMIN`; requiere CSRF.
- Request: `UserIdentityUpdateRequest`.
- Respuesta `200` con `UserDetailResponse`.
- Aplica normalizacion: correo y usuario en minusculas; documento en
  mayusculas; telefono vacio se guarda como `null`.
- No permite cambiar rol, estado, organizacion ni contrasena.
- Duplicado: `409 USER_ALREADY_EXISTS`.
- Cuenta `PENDING_APPROVAL`: `409 PENDING_ACCOUNT_NOT_MANAGED`.

### `PATCH /api/v1/admin/users/{id}/assignment`

- Solo `ADMIN`; requiere CSRF.
- Request: `UserAssignmentUpdateRequest`.
- Respuesta `200` con `UserDetailResponse`.
- Valida la matriz rol-organizacion y que la organizacion este `ACTIVE`.
- No se puede cambiar el rol de una cuenta que tenga cualquier `PlayerProfile`,
  activo o inactivo: `409 PLAYER_PROFILE_EXISTS`. SCP-005 no borra perfiles; el
  retiro requiere un proceso futuro.
- La fila de la cuenta y las filas de administradores activos se bloquean en la
  transaccion para que cambios concurrentes no dejen el sistema sin `ADMIN`.
- Un `ADMIN` no puede cambiar su propio rol a otro distinto de `ADMIN`:
  `409 SELF_ROLE_CHANGE_NOT_ALLOWED`.
- Si la operacion dejaria el sistema sin ningun `ADMIN` activo:
  `409 LAST_ADMIN_PROTECTED`.
- Cuenta `PENDING_APPROVAL`: `409 PENDING_ACCOUNT_NOT_MANAGED`.

### `PATCH /api/v1/admin/users/{id}/status`

- Solo `ADMIN`; requiere CSRF.
- Request: `UserStatusUpdateRequest`.
- Respuesta `200` con `UserDetailResponse`.
- Un `ADMIN` no puede inhabilitar su propia cuenta:
  `409 SELF_DEACTIVATION_NOT_ALLOWED`.
- Si la operacion dejaria el sistema sin ningun `ADMIN` activo:
  `409 LAST_ADMIN_PROTECTED`.
- La sesion existente de una cuenta inhabilitada se invalida en su siguiente
  peticion (`401 ACCOUNT_NOT_ACTIVE`).
- No modifica el perfil deportivo ni las relaciones de organizacion.
- Cuenta `PENDING_APPROVAL`: `409 PENDING_ACCOUNT_NOT_MANAGED`.

### `POST /api/v1/admin/users/{id}/reset-password`

- Solo `ADMIN`; requiere CSRF.
- Solo cuentas `ACTIVE`: una cuenta `INACTIVE` responde
  `409 ACCOUNT_NOT_ACTIVE`; una `PENDING_APPROVAL` responde
  `409 PENDING_ACCOUNT_NOT_MANAGED`.
- Genera una nueva contrasena temporal BCrypt, la marca de un solo uso,
  `mustChangePassword = true` y caducidad de 24 horas. No activa una cuenta
  inactiva ni cambia su rol u organizacion.
- Respuesta `200` con `UserCreatedResponse` y `Cache-Control: no-store`.
- Un `ADMIN` puede resetear su propia cuenta; la sesion queda limitada al cambio
  de contrasena en la siguiente peticion.

## Endpoint de alcance de academia

### `POST /api/v1/academies/me/users`

- Requiere sesion con rol `ACADEMY_DIRECTOR` o `PROFESSOR`; requiere CSRF.
- Request: `AcademyUserCreateRequest`.
- `PROFESSOR` no puede crear cuentas desde este endpoint;
  `ACADEMY_DIRECTOR` solo puede crear `PROFESSOR`. `role=PLAYER` responde
  `403 ROLE_NOT_ALLOWED` porque su alta se realiza desde Jugadores. Otro rol
  responde `403 ROLE_NOT_ALLOWED`.
- La academia se obtiene de la sesion; `academyId`, `clubId`, `position`,
  `status` o `password` enviados en el JSON se ignoran.
- La academia debe estar `ACTIVE`; si esta inhabilitada responde
  `409 ORGANIZATION_INACTIVE`.
- La cuenta se crea `ACTIVE`, con contrasena temporal de un solo uso y
  `mustChangePassword = true`.
- Respuesta `201` con `UserCreatedResponse` y `Cache-Control: no-store`.
- No existen endpoints de listado, detalle o edicion para estos roles.

## Errores principales

| Codigo | HTTP | Significado |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Datos de entrada invalidos |
| `INVALID_REQUEST` | 400 | JSON o parametro con formato invalido |
| `INVALID_ORGANIZATION_ASSIGNMENT` | 400 | Organizacion incompatible con el rol |
| `INVALID_ROLE` | 400 | PLAYER enviado a la creacion general de usuarios |
| `INVALID_STATUS` / `INVALID_STATUS_FILTER` | 400 | Estado no gestionable por este modulo |
| `INVALID_FILTER_COMBINATION` | 400 | `academyId` y `clubId` a la vez |
| `INVALID_SORT` | 400 | Campo de orden no permitido |
| `AUTHENTICATION_REQUIRED` | 401 | Sin sesion valida |
| `CSRF_INVALID` | 403 | Falta o no coincide el token CSRF |
| `ACCESS_DENIED` | 403 | Rol sin permiso |
| `ROLE_NOT_ALLOWED` | 403 | Rol fuera de la matriz del actor |
| `USER_NOT_FOUND` | 404 | Cuenta inexistente |
| `ORGANIZATION_NOT_FOUND` | 404 | Academia o club inexistente |
| `USER_ALREADY_EXISTS` | 409 | Duplicado generico de identidad |
| `ORGANIZATION_INACTIVE` | 409 | Organizacion inhabilitada |
| `PENDING_ACCOUNT_NOT_MANAGED` | 409 | La cuenta debe gestionarse en revision de ojeadores |
| `ACCOUNT_NOT_ACTIVE` | 409 | Reset solicitado para cuenta no activa |
| `SELF_ROLE_CHANGE_NOT_ALLOWED` | 409 | Admin intenta degradar su propia cuenta |
| `SELF_DEACTIVATION_NOT_ALLOWED` | 409 | Admin intenta inhabilitar su propia cuenta |
| `LAST_ADMIN_PROTECTED` | 409 | La operacion dejaria el sistema sin ADMIN activo |
| `PLAYER_PROFILE_EXISTS` | 409 | La cuenta tiene un perfil deportivo, activo o inactivo |
| `DATA_CONFLICT` | 409 | Conflicto de concurrencia o integridad |
| `METHOD_NOT_ALLOWED` | 405 | No existe `DELETE` ni otro metodo permitido |

No se devuelven hashes, contrasenas, secretos temporales en lecturas ni datos de
tutor/notas privadas.

## Persistencia y esquema

- `UserOrganization.position` es una columna opcional de hasta 100 caracteres.
- La restriccion de base de datos exige exactamente una academia o un club por
  fila y prohibe `position` en asociaciones de academia.
- La correspondencia rol-organizacion se valida en el servicio y en la entidad
  antes de persistir. No se agregaron herramientas de migracion: el esquema lo
  gestiona JPA/Hibernate segun `docs/arquitectura.md`.
- No se crean endpoints para crear organizaciones desde este modulo; las
  organizaciones se administran en SCP-003.

## Fuera de alcance

- Perfil deportivo de jugador, tutor y datos restringidos (SCP-005).
- Notas privadas de ojeadores y evaluaciones (SCP-006).
- Carga binaria de archivos.
- Borrado fisico de cuentas.
- Cambio de contrasena por parte del usuario fuera de
  `POST /api/v1/auth/change-password`.
