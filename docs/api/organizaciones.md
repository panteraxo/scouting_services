# Contrato de API - academias y clubes (SCP-003)

Prefijo: `/api/v1`. Todas las respuestas son JSON. El usuario, su rol y su
organizacion se obtienen del contexto de seguridad del servidor; ningun request
puede fijarlos. Las rutas no listadas aqui quedan denegadas por defecto.

## Reglas generales

- Roles: `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR`, `CLUB_MANAGER`, `SCOUT`,
  `PLAYER`.
- Un `UserOrganization` relaciona como maximo una organizacion por cuenta:
  - `ACADEMY_DIRECTOR`, `PROFESSOR`, `PLAYER`: una academia.
  - `CLUB_MANAGER`: un club.
  - `ADMIN`, `SCOUT`: sin fila.
- Muchas cuentas pueden compartir una academia o un club. La asignacion de
  cuentas no tiene endpoints en SCP-003; pertenece a SCP-004.
- Toda escritura (`POST`, `PUT`, `PATCH`) requiere CSRF: se obtiene en
  `GET /api/v1/auth/csrf` y se envia en `X-CSRF-TOKEN`.
- Las bajas son logicas: no existe `DELETE`. Una organizacion inactiva conserva
  sus relaciones y cuentas; no se borra ni se desactivan cuentas en cascada.
- Estados independientes:
  - `operationalStatus`: `ACTIVE` o `INACTIVE`.
  - `verificationStatus`: `PENDING_VERIFICATION`, `VERIFIED` o `REJECTED`.
- Toda organizacion nueva se crea `ACTIVE` y `PENDING_VERIFICATION`.
- Los codigos visibles se generan en servidor (`ACA-000001`, `CLU-000001`) y son
  inmutables. El cliente no puede enviarlos.
- El tipo de academia/club es texto libre (`type`); no es un enum.
- El pais de un club se fija a `PE`. No se acepta desde el request.
- El logo es una URL (`logoUrl`); no hay carga binaria. Las URLs se validan
  sintacticamente como URI absoluta `http` o `https` con host. No se descargan
  ni se consultan (sin SSRF).
- `ubigeoCode` valida formato y existencia en el servicio. Un formato invalido
  (longitud distinta de 6 o caracteres no numericos) o un codigo inexistente
  responde `400 INVALID_UBIGEO`. Un valor ausente o vacio responde
  `400 VALIDATION_ERROR`.
- Los conteos (`counts`) se exponen como `null` mientras no exista una fuente
  real de jugadores, aspirantes, profesores o equipos. Nunca se usa cero como
  dato desconocido.
- No se devuelven entidades JPA ni campos internos de Hibernate.
- Para rutas de alcance propio, un usuario sin asociacion o con una asociacion
  del tipo equivocado recibe `404`, sin revelar si la organizacion existe.

## Permisos por ruta

| Ruta | Rol permitido |
|---|---|
| `/api/v1/admin/academies/**` | `ADMIN` |
| `/api/v1/admin/clubs/**` | `ADMIN` |
| `GET /api/v1/academies/me` | `ACADEMY_DIRECTOR`, `PROFESSOR` |
| `PUT /api/v1/academies/me` | `ACADEMY_DIRECTOR` |
| `PATCH /api/v1/academies/me/deactivate` | `ACADEMY_DIRECTOR` |
| `GET /api/v1/clubs/me` | `CLUB_MANAGER` |
| `PUT /api/v1/clubs/me` | `CLUB_MANAGER` |
| `PATCH /api/v1/clubs/me/deactivate` | `CLUB_MANAGER` |
| `/api/v1/directory/**` | `ADMIN`, `SCOUT` |
| `/api/v1/ubigeo/**` | `ADMIN`, `ACADEMY_DIRECTOR`, `PROFESSOR`, `CLUB_MANAGER`, `SCOUT` |

`PLAYER` no accede a organizaciones ni a UBIGEO. Cualquier rol no listado recibe
`403 ACCESS_DENIED`.

## Paginacion, filtros y orden

- `page`: por defecto `0`, minimo `0`.
- `size`: por defecto `20`, entre `1` y `100`.
- `sort`: un unico campo permitido, formato `campo,asc|desc`. Por defecto
  `name,asc`.
- Campos de orden permitidos para academias y clubes: `name`, `code`, `type`,
  `foundationYear`, `createdAt`, `updatedAt`, `operationalStatus`,
  `verificationStatus`.
- `q`: busqueda literal por nombre o codigo, sin distinguir mayusculas/minusculas,
  maximo 100 caracteres. El servidor recorta el valor y escapa `%`, `_` y el
  caracter de escape `!` antes de ejecutar el `LIKE`; por tanto esos caracteres
  se buscan literalmente y no actuan como comodines ni como escape enviado por
  el cliente. Buscar `%` devuelve solo las organizaciones cuyo nombre o codigo
  contiene un `%` real.
- `type`: coincidencia exacta sin distinguir mayusculas/minusculas, maximo 100
  caracteres.
- `ubigeo`: prefijo de 2 (departamento), 4 (provincia) o 6 (distrito) digitos.
  Un valor con otra longitud responde `400 INVALID_UBIGEO_FILTER`.
- Los listados administrativos aceptan ademas `operationalStatus` y
  `verificationStatus`.
- El directorio de ojeadores no acepta filtros de estado; siempre consulta
  `ACTIVE + VERIFIED`.

## DTOs

### Academia - creacion y reemplazo total

`AcademyCreateRequest` y `AcademyUpdateRequest` tienen los mismos campos. No
incluyen `id`, `code`, estados, conteos, verificacion ni usuario responsable;
si el JSON los envia, se ignoran.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | Si | 2 a 150 caracteres |
| `logoUrl` | string | Si | URI absoluta `http` o `https` con host |
| `type` | string | Si | Texto libre, maximo 100 |
| `description` | string | Si | Maximo 2000 |
| `foundationYear` | integer | Si | 1800 hasta el anio actual |
| `ruc` | string | Si | Exactamente 11 digitos; unico por tabla |
| `ubigeoCode` | string | Si | Distrito de 6 digitos existente en el catalogo |
| `address` | string | Si | Maximo 300 |
| `institutionalEmail` | string | Si | Correo valido, maximo 150 |
| `institutionalPhone` | string | Si | Maximo 30 |
| `websiteUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `instagramUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `facebookUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `youtubeUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `tiktokUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `trainingGroups` | string[] | No | Hasta 20 etiquetas de 80 caracteres; se normalizan y deduplican |
| `headquarters` | string | Si | Sede, maximo 200 |
| `representativeName` | string | No | Valor legacy de respaldo, maximo 150; el mostrado se deriva del Director activo asignado |

`representativeName` deja de ser obligatorio al crear o reemplazar una academia.
El valor que devuelve `AcademyResponse` se deriva de la cuenta con rol
`ACADEMY_DIRECTOR` y estado `ACTIVE` asignada a la academia mediante
`UserOrganization`: se muestra su nombre completo (`firstName + lastName`). Si no
hay un Director activo, se usa el `representativeName` legacy almacenado cuando
no esta en blanco; si tampoco existe, la respuesta devuelve `null`. El valor
legacy nunca se expone como cadena vacia.

No se aceptan DNI, correo ni telefono personales del representante; solo se
usan los contactos institucionales de la academia.

### Club - creacion y reemplazo total

`ClubCreateRequest` y `ClubUpdateRequest` tienen los mismos campos.

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `name` | string | Si | 2 a 150 caracteres |
| `type` | string | Si | Texto libre, maximo 100 |
| `ruc` | string | Si | Exactamente 11 digitos; unico por tabla |
| `foundationYear` | integer | Si | 1800 hasta el anio actual |
| `logoUrl` | string | Si | URI absoluta `http` o `https` con host |
| `description` | string | Si | Maximo 2000 |
| `ubigeoCode` | string | Si | Distrito de 6 digitos existente en el catalogo |
| `address` | string | Si | Maximo 300 |
| `institutionalEmail` | string | Si | Correo valido, maximo 150 |
| `institutionalPhone` | string | Si | Maximo 30 |
| `websiteUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `instagramUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `facebookUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `youtubeUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |
| `tiktokUrl` | string | No | URI absoluta `http` o `https` con host; vacio equivale a `null` |

`countryCode` no forma parte del request; la respuesta siempre devuelve `PE`.
No existen campos de responsable, DNI, correo o telefono personal del
responsable. Los nombres de responsables se derivan de `UserOrganization`.

### Respuesta completa de academia (`AcademyResponse`)

Usada por ADMIN y por el propio Director/Profesor.

```json
{
  "id": 1,
  "code": "ACA-000001",
  "name": "Academia Ejemplo",
  "logoUrl": "https://cdn.example.com/logo.png",
  "type": "Academia de futbol",
  "description": "Descripcion institucional.",
  "foundationYear": 2001,
  "ruc": "20123456789",
  "ubigeoCode": "150101",
  "departmentName": "Lima",
  "provinceName": "Lima",
  "districtName": "Lima",
  "address": "Av. Institucional 123",
  "institutionalEmail": "contacto@academia.example.com",
  "institutionalPhone": "+51 1 555 0101",
  "websiteUrl": "https://academia.example.com",
  "instagramUrl": "https://instagram.com/academia",
  "facebookUrl": "https://facebook.com/academia",
  "youtubeUrl": "https://youtube.com/@academia",
  "tiktokUrl": "https://tiktok.com/@academia",
  "trainingGroups": ["Sub 12", "Sub 15"],
  "headquarters": "Sede principal",
  "representativeName": "Ana Torres",
  "operationalStatus": "ACTIVE",
  "verificationStatus": "PENDING_VERIFICATION",
  "counts": {
    "players": null,
    "prospects": null,
    "professors": null,
    "teams": null
  },
  "createdAt": "2026-10-19T22:00:00Z",
  "updatedAt": "2026-10-19T22:00:00Z",
  "version": 0
}
```

### Respuesta completa de club (`ClubResponse`)

Usada por ADMIN y por el propio Responsable.

```json
{
  "id": 1,
  "code": "CLU-000001",
  "name": "Club Ejemplo",
  "type": "Club de futbol",
  "ruc": "20987654321",
  "foundationYear": 1998,
  "logoUrl": "https://cdn.example.com/club.png",
  "description": "Descripcion institucional.",
  "countryCode": "PE",
  "ubigeoCode": "150101",
  "departmentName": "Lima",
  "provinceName": "Lima",
  "districtName": "Lima",
  "address": "Av. Institucional 456",
  "institutionalEmail": "contacto@club.example.com",
  "institutionalPhone": "+51 1 555 0202",
  "websiteUrl": "https://club.example.com",
  "instagramUrl": "https://instagram.com/club",
  "facebookUrl": "https://facebook.com/club",
  "youtubeUrl": "https://youtube.com/@club",
  "tiktokUrl": "https://tiktok.com/@club",
  "responsibleNames": ["Nombre Apellido"],
  "operationalStatus": "ACTIVE",
  "verificationStatus": "PENDING_VERIFICATION",
  "counts": {
    "players": null,
    "prospects": null,
    "professors": null,
    "teams": null
  },
  "createdAt": "2026-10-19T22:00:00Z",
  "updatedAt": "2026-10-19T22:00:00Z",
  "version": 0
}
```

`responsibleNames` se deriva de las cuentas asociadas al club y solo aparece en
la vista completa (ADMIN y Responsable del club). No incluye DNI, correo ni
telefono personal. El cargo funcional queda pendiente de SCP-004.

### Respuesta de directorio

`AcademyDirectoryResponse` omite `ruc`, `representativeName`, estados internos,
version y marcas de tiempo. `ClubDirectoryResponse` omite `ruc`,
`responsibleNames`, estados internos, version y marcas de tiempo. Ambos conservan
los contactos institucionales y `counts` con valores `null`.

## Endpoints

### Administracion de academias (ADMIN)

#### `GET /api/v1/admin/academies`

- Parametros: `page`, `size`, `sort`, `q`, `type`, `ubigeo`,
  `operationalStatus`, `verificationStatus`.
- Respuesta `200` con `PageResponse<AcademyResponse>`.
- Incluye RUC y representante porque es una vista administrativa. El
  representante se deriva del Director de academia activo asignado y, en su
  defecto, del valor legacy de respaldo.

#### `POST /api/v1/admin/academies`

- Requiere CSRF.
- Request: `AcademyCreateRequest`.
- Respuesta `201` con `AcademyResponse`.
- Fuerza `operationalStatus=ACTIVE`, `verificationStatus=PENDING_VERIFICATION`
  y un codigo `ACA-000001` secuencial.
- `ruc` duplicado: `409 RUC_ALREADY_EXISTS`.
- `ubigeoCode` inexistente o con formato invalido: `400 INVALID_UBIGEO`.
- Anio futuro: `400 INVALID_FOUNDATION_YEAR`.

#### `GET /api/v1/admin/academies/{id}`

- Respuesta `200` con `AcademyResponse`, incluso si esta inactiva o no verificada.
- Inexistente: `404 ORGANIZATION_NOT_FOUND`.

#### `PUT /api/v1/admin/academies/{id}`

- Requiere CSRF.
- Request: `AcademyUpdateRequest` (reemplazo total).
- Respuesta `200` con `AcademyResponse`.
- No cambia `code`, estados ni verificacion. Una edicion ADMIN no reinicia la
  verificacion.
- Permite editar una academia inactiva.
- `ruc` duplicado en otra academia: `409 RUC_ALREADY_EXISTS`.

#### `PATCH /api/v1/admin/academies/{id}/deactivate`

- Requiere CSRF. Sin body.
- Cambia `operationalStatus` a `INACTIVE`; no altera la verificacion.
- Ya inactiva: `409 ORGANIZATION_ALREADY_INACTIVE`.

#### `PATCH /api/v1/admin/academies/{id}/reactivate`

- Requiere CSRF. Sin body.
- Cambia `operationalStatus` a `ACTIVE`; no altera la verificacion.
- Ya activa: `409 ORGANIZATION_ALREADY_ACTIVE`.

#### `PATCH /api/v1/admin/academies/{id}/verification`

- Requiere CSRF.
- Request: `{"status": "VERIFIED"}`.
- Respuesta `200` con `AcademyResponse`.
- Transiciones permitidas:
  - `PENDING_VERIFICATION -> VERIFIED`
  - `PENDING_VERIFICATION -> REJECTED`
  - `REJECTED -> PENDING_VERIFICATION` (reabrir)
  - `VERIFIED -> PENDING_VERIFICATION` (revocar)
- Cualquier otra transicion, incluida repetir el mismo estado:
  `409 INVALID_VERIFICATION_TRANSITION`.
- ADMIN puede verificar aunque la academia este `INACTIVE`.

### Administracion de clubes (ADMIN)

Espejo exacto de las rutas de academia:

- `GET /api/v1/admin/clubs`
- `POST /api/v1/admin/clubs`
- `GET /api/v1/admin/clubs/{id}`
- `PUT /api/v1/admin/clubs/{id}`
- `PATCH /api/v1/admin/clubs/{id}/deactivate`
- `PATCH /api/v1/admin/clubs/{id}/reactivate`
- `PATCH /api/v1/admin/clubs/{id}/verification`

Usa `ClubCreateRequest`, `ClubUpdateRequest`, `ClubResponse` y las mismas
transiciones y codigos de error. El primer codigo es `CLU-000001`; la secuencia
de club es independiente de la de academia.

### Alcance propio de academia

#### `GET /api/v1/academies/me`

- Roles: `ACADEMY_DIRECTOR`, `PROFESSOR`.
- Respuesta `200` con `AcademyResponse` de la academia asociada a la cuenta.
- Funciona tambien si la academia esta `INACTIVE` (solo lectura).
- Sin asociacion o asociacion de club: `404 ORGANIZATION_NOT_FOUND`.

#### `PUT /api/v1/academies/me`

- Rol: `ACADEMY_DIRECTOR`.
- Requiere CSRF.
- Request: `AcademyUpdateRequest`.
- Respuesta `200` con `AcademyResponse`.
- Cualquier cambio de contenido reinicia `verificationStatus` a
  `PENDING_VERIFICATION`. Un envio identico no lo reinicia.
- Academia inactiva: `409 ORGANIZATION_INACTIVE`.
- No puede cambiar `code`, estados, verificacion, conteos ni usuario responsable.

#### `PATCH /api/v1/academies/me/deactivate`

- Rol: `ACADEMY_DIRECTOR`.
- Requiere CSRF.
- Cambia su academia a `INACTIVE`.
- Ya inactiva: `409 ORGANIZATION_ALREADY_INACTIVE`.
- La reactivacion solo la realiza ADMIN.

### Alcance propio de club

- `GET /api/v1/clubs/me`: rol `CLUB_MANAGER`, lectura incluso si esta inactivo.
- `PUT /api/v1/clubs/me`: rol `CLUB_MANAGER`, requiere CSRF. Todo cambio de
  contenido reinicia la verificacion a `PENDING_VERIFICATION`; academia/club
  inactivo responde `409 ORGANIZATION_INACTIVE`.
- `PATCH /api/v1/clubs/me/deactivate`: rol `CLUB_MANAGER`, requiere CSRF.
- La reactivacion solo la realiza ADMIN.

### Directorio de ojeadores

#### `GET /api/v1/directory/academies`

#### `GET /api/v1/directory/academies/{id}`

#### `GET /api/v1/directory/clubs`

#### `GET /api/v1/directory/clubs/{id}`

- Roles: `ADMIN`, `SCOUT`.
- Listados: `page`, `size`, `sort`, `q`, `type`, `ubigeo`.
- Filtro forzado: `operationalStatus=ACTIVE` y
  `verificationStatus=VERIFIED`. No existe parametro para ampliarlo.
- Detalle de una organizacion no activa o no verificada:
  `404 ORGANIZATION_NOT_FOUND`.
- Respuesta de academia: `AcademyDirectoryResponse`; de club:
  `ClubDirectoryResponse`.
- No exponen RUC, representante, responsables ni datos personales.

## Catalogo UBIGEO

Rutas:

- `GET /api/v1/ubigeo/departments`
- `GET /api/v1/ubigeo/provinces?departmentCode=NN`
- `GET /api/v1/ubigeo/districts?provinceCode=NNNN`

Respuesta: arreglo de `{ "code": "010101", "name": "Chachapoyas" }`.

- `departmentCode` debe tener 2 digitos; formato invalido:
  `400 INVALID_DEPARTMENT_CODE`; inexistente: `404 UBIGEO_NOT_FOUND`.
- `provinceCode` debe tener 4 digitos; formato invalido:
  `400 INVALID_PROVINCE_CODE`; inexistente: `404 UBIGEO_NOT_FOUND`.
- Falta un parametro obligatorio: `400 INVALID_REQUEST`.
- El catalogo es local; no se consulta INEI ni otro proveedor en runtime.

Fuente oficial: Instituto Nacional de Estadistica e Informatica (INEI), "Lista de
Ubicacion Geografica", UBIGEO 2025. URL consultada el **2026-10-19**:

<https://webapp.inei.gob.pe:8443/sisconcode/ubigeo/listaBusquedaUbigeoPorUbicacionGeografica.htm?flagDist&flagDpto&flagProv&nivel=1&strDist=TODOS&strDpto=TODOS&strProv=TODOS&strVersion=2025&versionCategoriaPK=8-1>

Archivo local: `backend/scouting/src/main/resources/ubigeo/ubigeo-inei-2025.csv`.
Contiene 25 departamentos, 196 provincias y 1892 distritos, con licencia,
atribucion, transformacion y fecha de consulta documentadas en
`backend/scouting/src/main/resources/ubigeo/README.md`. Los datos son informacion
publica oficial del INEI; se reproducen solo codigos y nombres.

## Errores

Formato uniforme:

```json
{
  "timestamp": "2026-10-19T22:00:00Z",
  "status": 409,
  "code": "ORGANIZATION_INACTIVE",
  "message": "La academia esta inhabilitada y solo admite lectura.",
  "path": "/api/v1/academies/me"
}
```

Errores de validacion incluyen `fieldErrors`:

```json
{
  "timestamp": "2026-10-19T22:00:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Datos de entrada invalidos.",
  "path": "/api/v1/admin/academies",
  "fieldErrors": {
    "name": "El nombre es obligatorio."
  }
}
```

Codigos principales de SCP-003:

| HTTP | Codigo | Causa |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Campos obligatorios, formato, URL, RUC, anio o tamano invalido |
| 400 | `INVALID_REQUEST` | JSON ilegible, parametro faltante o valor de enum invalido |
| 400 | `INVALID_FOUNDATION_YEAR` | Anio de fundacion futuro |
| 400 | `INVALID_UBIGEO` | Codigo UBIGEO inexistente o con formato invalido |
| 400 | `INVALID_UBIGEO_FILTER` | Filtro UBIGEO con longitud distinta de 2, 4 o 6 |
| 400 | `INVALID_DEPARTMENT_CODE` | Codigo de departamento con formato invalido |
| 400 | `INVALID_PROVINCE_CODE` | Codigo de provincia con formato invalido |
| 400 | `INVALID_SORT` | Campo o direccion de orden no permitido |
| 401 | `AUTHENTICATION_REQUIRED` | Sin sesion |
| 403 | `ACCESS_DENIED` | Rol sin permiso |
| 403 | `CSRF_INVALID` | Token CSRF ausente o invalido |
| 404 | `ORGANIZATION_NOT_FOUND` | Organizacion inexistente o fuera del alcance |
| 404 | `UBIGEO_NOT_FOUND` | Departamento o provincia inexistente |
| 405 | `METHOD_NOT_ALLOWED` | Metodo no implementado, por ejemplo `DELETE` |
| 409 | `RUC_ALREADY_EXISTS` | RUC duplicado en la misma entidad |
| 409 | `ORGANIZATION_INACTIVE` | Edicion o inhabilitacion de una organizacion inactiva |
| 409 | `ORGANIZATION_ALREADY_INACTIVE` | Intento de inhabilitar una organizacion ya inactiva |
| 409 | `ORGANIZATION_ALREADY_ACTIVE` | Intento de reactivar una organizacion ya activa |
| 409 | `INVALID_VERIFICATION_TRANSITION` | Transicion de verificacion no permitida |
| 409 | `DATA_CONFLICT` | Conflicto de concurrencia o integridad |

En una colision concurrente del indice unico de RUC, la respuesta es
`409 RUC_ALREADY_EXISTS` cuando el proveedor de base de datos expone la
restriccion `uk_academies_ruc` o `uk_clubs_ruc` (MySQL y H2 lo hacen). Si el
proveedor no expone el nombre de la restriccion, el error no se reclasifica y se
mantiene `409 DATA_CONFLICT`; no se transforman otras violaciones de integridad
como colisiones de codigo visible.

## Fuera de alcance de SCP-003

- Endpoints de creacion, edicion o asignacion de usuarios y sus organizaciones
  (SCP-004).
- Cargo funcional del responsable de club (se derivara de `UserOrganization` en
  SCP-004).
- Conteos reales de jugadores, aspirantes, profesores y equipos; se mantienen
  `null` hasta que exista la fuente.
- Carga binaria de logos.
- Endpoints `DELETE`.
- Flyway u otra herramienta de migraciones; el esquema lo gestiona
  JPA/Hibernate.
