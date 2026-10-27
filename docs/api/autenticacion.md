# Contrato de API — autenticación (SCP-002)

Prefijo: `/api/v1`. Todas las respuestas son JSON. La identidad, el rol y el estado
de la cuenta se obtienen siempre del contexto de seguridad del servidor.

## Reglas generales

- Login por correo. Cada cuenta tiene un único rol.
- Estados de cuenta: `ACTIVE`, `PENDING_APPROVAL`, `INACTIVE`.
- Una cuenta `PENDING_APPROVAL` o `INACTIVE` nunca obtiene una sesión plena.
- Las operaciones de escritura requieren CSRF. El token se obtiene con
  `GET /api/v1/auth/csrf` y se envía en el header `X-CSRF-TOKEN`.
- La sesión usa la cookie `JSESSIONID` con `HttpOnly`. En el perfil `prod` la cookie
  es `Secure`; en local puede desactivarse con `SESSION_COOKIE_SECURE=false`.
- La sesión se renueva al iniciar sesión (protección contra fijación de sesión).
- Todo endpoint no listado aquí queda denegado por defecto.
- No existen endpoints de notas privadas ni de datos de tutor en esta fase. Tampoco
  se implementa el CRUD de `/users` ni la asignación de roles internos (SCP-004).

## Flujo CSRF

1. `GET /api/v1/auth/csrf` (público) crea/recupera la sesión y devuelve:

```json
{
  "token": "…",
  "headerName": "X-CSRF-TOKEN",
  "parameterName": "_csrf"
}
```

2. El cliente envía el token en el header `X-CSRF-TOKEN` en cada `POST`, `PUT`,
   `PATCH` o `DELETE`, incluyendo login, registro público, logout,
   cambio de contraseña y aprobación/rechazo de ojeadores.
3. Si falta el token o no coincide con la sesión, la API responde `403` con código
   `CSRF_INVALID`. Este código es exclusivo de la validación CSRF; una denegación
   de autorización (por ejemplo, un usuario autenticado sin el rol requerido)
   responde `403` con código `ACCESS_DENIED`.

## Endpoints

### `GET /api/v1/auth/csrf`

- Público.
- Respuesta `200` con el token CSRF.

### `POST /api/v1/auth/login`

- Público; requiere CSRF.
- Request:

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña-elegida"
}
```

- Respuesta `200`:

```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "firstName": "Nombre",
  "lastName": "Apellido",
  "username": "usuario",
  "role": "ADMIN",
  "status": "ACTIVE",
  "mustChangePassword": false
}
```

- Credenciales incorrectas, correo inexistente, cuenta pendiente, cuenta inactiva o
  contraseña temporal expirada: `401` con el mismo mensaje genérico
  `"Credenciales invalidas."`.
- Si `mustChangePassword` es `true`, la sesión solo habilita `GET /auth/me`,
  `GET /auth/csrf`, `POST /auth/change-password` y `POST /auth/logout`. El resto
  responde `403` con código `PASSWORD_CHANGE_REQUIRED`.

### `POST /api/v1/auth/register/scout`

- Público; requiere CSRF.
- Solo crea solicitudes de ojeador. No inicia sesión.
- El servidor fuerza `role = SCOUT` y `status = PENDING_APPROVAL`; no se aceptan
  `role`, `status`, organización, academia ni club desde el request.
- Request:

```json
{
  "firstName": "Nombre",
  "lastName": "Apellido",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "email": "ojeador@ejemplo.com",
  "phone": "987654321",
  "username": "ojeador",
  "password": "contraseña-elegida"
}
```

- `documentType`: `DNI`, `CE` o `PASSPORT`.
- `phone`: opcional. Si se informa, debe tener entre 6 y 20 caracteres y usar solo
  dígitos, `+`, `(`, `)`, `-` o espacios. Un valor vacío o ausente se almacena como
  `null`.
- `password`: entre 8 y 72 caracteres.
- Respuesta `202`:

```json
{
  "message": "Solicitud registrada. Un administrador revisara la cuenta para habilitarla."
}
```

- Si el correo, documento o nombre de usuario ya existen, se devuelve exactamente la
  misma respuesta `202` y no se crea una segunda cuenta. No se revela cuál dato
  existe. Esta decisión evita enumeración de cuentas; los duplicados se registran
  solo como traza interna.
- Errores de formato/validación: `400` con `VALIDATION_ERROR`.
- Campos desconocidos del JSON (por ejemplo `role` o `status`) se ignoran y nunca
  se usan como autoridad.

### `GET /api/v1/auth/me`

- Requiere sesión.
- Respuesta `200` con el mismo DTO `UserResponse`. No incluye contraseña, hash,
  datos de tutor ni notas privadas.

### `POST /api/v1/auth/change-password`

- Requiere sesión y CSRF.
- Request:

```json
{
  "currentPassword": "contraseña-actual",
  "newPassword": "contraseña-nueva"
}
```

- Respuesta `200` con `mustChangePassword: false`.
- Consume la contraseña temporal: limpia `mustChangePassword` y
  `temporaryPasswordExpiresAt`.
- Contraseña actual incorrecta: `400` `INVALID_CURRENT_PASSWORD`.
- Nueva contraseña igual a la actual: `400` `PASSWORD_UNCHANGED`.

### `POST /api/v1/auth/logout`

- Requiere sesión y CSRF.
- Invalida la sesión y limpia el contexto de seguridad. Respuesta `204`.

### `GET /api/v1/admin/scout-registrations`

- Solo `ADMIN` autenticado.
- Parámetros:
  - `status` (opcional, por defecto `PENDING_APPROVAL`): `ACTIVE`,
    `PENDING_APPROVAL` o `INACTIVE`.
  - `page` (por defecto `0`, mínimo `0`).
  - `size` (por defecto `20`, entre `1` y `100`).
- Respuesta `200`:

```json
{
  "content": [
    {
      "id": 10,
      "firstName": "Nombre",
      "lastName": "Apellido",
      "documentType": "DNI",
      "documentNumber": "12345678",
      "email": "ojeador@ejemplo.com",
      "phone": "987654321",
      "username": "ojeador",
      "status": "PENDING_APPROVAL",
      "createdAt": "2026-10-19T22:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

- No expone hash de contraseña, datos de tutor ni notas privadas.
- `phone` puede ser `null` si la solicitud no informó teléfono.

### `POST /api/v1/admin/scout-registrations/{id}/approve`

- Solo `ADMIN`; requiere CSRF.
- Solo procesa solicitudes `SCOUT` en estado `PENDING_APPROVAL`.
- Cambia el estado a `ACTIVE`. Respuesta `200` con la solicitud actualizada.
- Solicitud inexistente o de otro rol: `404` genérico.
- Solicitud ya procesada: `409`.
- La transición es atómica: si dos administradores intentan procesar la misma
  solicitud a la vez, solo una operación cambia el estado y la otra recibe
  `409` con código `SCOUT_REGISTRATION_ALREADY_PROCESSED`.

### `POST /api/v1/admin/scout-registrations/{id}/reject`

- Solo `ADMIN`; requiere CSRF.
- Solo procesa solicitudes `SCOUT` en estado `PENDING_APPROVAL`.
- Cambia el estado a `INACTIVE`. Respuesta `200` con la solicitud actualizada.
- Un rechazo o cualquier cambio futuro a `INACTIVE` invalida el acceso en la
  siguiente petición de una sesión existente.
- Igual que en la aprobación, la transición es atómica: ante dos operaciones
  simultáneas solo una responde `200`; la otra recibe `409`
  `SCOUT_REGISTRATION_ALREADY_PROCESSED`.

## Códigos de error

Formato:

```json
{
  "timestamp": "2026-10-19T22:00:00Z",
  "status": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Credenciales invalidas.",
  "path": "/api/v1/auth/login"
}
```

Códigos principales: `VALIDATION_ERROR`, `INVALID_REQUEST`,
`INVALID_CREDENTIALS`, `AUTHENTICATION_REQUIRED`, `ACCESS_DENIED`,
`CSRF_INVALID`, `ACCOUNT_NOT_ACTIVE`, `PASSWORD_CHANGE_REQUIRED`,
`INVALID_CURRENT_PASSWORD`, `PASSWORD_UNCHANGED`,
`SCOUT_REGISTRATION_NOT_FOUND`, `SCOUT_REGISTRATION_ALREADY_PROCESSED`,
`DATA_CONFLICT`, `INTERNAL_ERROR`.

- `CSRF_INVALID` (`403`): el token CSRF falta, es incorrecto o no corresponde a la
  sesión. Aplica a `POST`, `PUT`, `PATCH` y `DELETE`.
- `ACCESS_DENIED` (`403`): la identidad está autenticada pero no tiene el rol o
  permiso requerido. No representa un fallo de CSRF.

## Bootstrap del primer administrador

El administrador inicial se crea únicamente desde variables de entorno locales. No
hay correo, usuario ni contraseña por defecto en Git.

Variables:

Spring Boot no lee automáticamente un archivo `.env`; las variables deben estar
exportadas en el shell, configuradas en el IDE o inyectadas por el entorno de
ejecución. `.env.example` solo documenta sus nombres.

| Variable | Obligatoria si se habilita | Descripción |
|---|---|---|
| `BOOTSTRAP_ADMIN_ENABLED` | No (por defecto `true`) | `false` desactiva el bootstrap. |
| `BOOTSTRAP_ADMIN_EMAIL` | Sí | Correo del administrador. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Sí | Contraseña temporal; 8 a 72 caracteres. |
| `BOOTSTRAP_ADMIN_FIRST_NAME` | Sí | Nombres. |
| `BOOTSTRAP_ADMIN_LAST_NAME` | Sí | Apellidos. |
| `BOOTSTRAP_ADMIN_USERNAME` | Sí | Nombre de usuario único. |
| `BOOTSTRAP_ADMIN_DOCUMENT_TYPE` | No | `DNI`, `CE` o `PASSPORT`. |
| `BOOTSTRAP_ADMIN_DOCUMENT_NUMBER` | No | Documento único si se informa. |
| `BOOTSTRAP_ADMIN_PHONE` | No | Teléfono. |

Comportamiento:

- Si `BOOTSTRAP_ADMIN_EMAIL` y `BOOTSTRAP_ADMIN_PASSWORD` están vacíos, no se crea
  nada.
- Si solo uno está configurado, el arranque falla con un mensaje de configuración.
- Si ya existe cualquier cuenta `ADMIN`, no se modifica ni se sobrescribe.
- Si el correo, usuario o documento ya pertenecen a otra cuenta, no se sobrescribe;
  se omite con una advertencia.
- La contraseña se almacena con BCrypt.
- La cuenta se crea `ACTIVE`, con `mustChangePassword = true` y una vigencia de
  **24 horas** para la contraseña temporal. Al expirar, el login se rechaza.
- El cambio de contraseña consume la contraseña temporal y desactiva la obligación.

### Ejecución en una única instancia

La comprobación «¿ya existe un ADMIN?» y la inserción no usan un bloqueo
distribuido. Por tanto, la inicialización del primer administrador debe
ejecutarse en **una única instancia/proceso**:

1. Realizar el primer arranque con una sola instancia, o mantener
   `BOOTSTRAP_ADMIN_ENABLED=false` en el resto de réplicas mientras se confirma
   que la cuenta ADMIN existe.
2. Una vez creada, escalar horizontalmente con el bootstrap deshabilitado en las
   demás instancias. Reactivarlo no crea administradores adicionales: si ya
   existe cualquier `ADMIN`, se omite sin modificar nada.
3. Si dos instancias arrancan simultáneamente con la misma configuración, la
   restricción única de correo/usuario/documento puede hacer fallar el arranque
   de una de ellas; si las identidades difieren, podrían crearse dos cuentas
   ADMIN. Ninguno de estos escenarios sustituye la coordinación operativa.

Esta regla solo aplica al bootstrap. No se agrega ninguna restricción de base de
datos que impida crear administradores adicionales mediante los flujos
administrativos correspondientes.

### Recuperación de la contraseña temporal expirada

Si la contraseña temporal del ADMIN inicial expira antes de que se cambie, el
bootstrap **no** la regenera ni sobrescribe la cuenta, y SCP-002 no expone un
endpoint de reseteo administrativo. La recuperación requiere intervención
operativa controlada:

1. Detener temporalmente la instancia o deshabilitar el bootstrap.
2. Generar un nuevo hash BCrypt para una contraseña temporal (8 a 72 caracteres)
   fuera del repositorio y sin registrarla en Git ni en logs.
3. Actualizar únicamente esa cuenta `ADMIN` en `users`: `password_hash`,
   `must_change_password = 1`, `status = 'ACTIVE'` y
   `temporary_password_expires_at` a un nuevo instante UTC de 24 horas.
4. Registrar la operación en la bitácora operativa y entregar la contraseña por
   un canal seguro; el usuario deberá cambiarla en el primer acceso.

No se recomienda eliminar la cuenta ADMIN para forzar el bootstrap. Si se hace
en un entorno controlado, debe ser con respaldo previo y con una sola instancia
en ejecución.

## Variables de entorno de la fase

- `APP_CORS_ALLOWED_ORIGINS`: orígenes permitidos, separados por coma. Por defecto
  `http://localhost:3000`.
- `SESSION_COOKIE_SECURE`: `true` en producción. El perfil `prod` también fuerza
  `Secure` mediante `application-prod.properties`.
- `SPRING_PROFILES_ACTIVE=prod` para producción.

## Fuera de alcance

- CRUD de usuarios y alta de roles internos (SCP-004).
- Asignación de academia/club a usuarios (SCP-003/SCP-004).
- Datos de tutor y notas privadas de ojeadores.
- Flyway u otra herramienta de migraciones; el esquema lo gestiona JPA/Hibernate.
