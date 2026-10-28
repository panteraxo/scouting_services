# Docker + Aiven MySQL

Esta guía prepara el despliegue de Scouting.pe con:

- backend Spring Boot en Docker;
- frontend Next.js en Docker;
- MySQL administrado en Aiven;
- variables de entorno fuera del repositorio.

No se incluyen credenciales reales. Requisito: Docker Compose >= 2.24. La creación del servicio de Aiven y la carga de secretos las realiza el responsable de la cuenta.

## 1. Arquitectura del despliegue

```text
Navegador
   │
   ├── https://app.scouting.net.pe  → contenedor frontend (Next.js)
   │                                      │
   │                                      └── https://api.scouting.net.pe/api/v1
   │
   └── https://api.scouting.net.pe  → contenedor backend (Spring Boot)
                                          │
                                          └── MySQL TLS (Aiven)
```

En local:

```text
http://localhost:3000  → frontend
http://localhost:9193  → backend
```

## 2. Crear MySQL en Aiven

1. Entra a <https://console.aiven.io/>.
2. Crea o selecciona un proyecto.
3. Ve a **Services → Create service**.
4. Selecciona **MySQL**.
5. Selecciona el plan **Free**.
6. Asigna un nombre, por ejemplo `scouting-mysql`.
7. Espera hasta que el estado sea **Running**.
8. En **Overview → Connection information** copia:
   - host;
   - puerto;
   - usuario (`avnadmin`);
   - contraseña;
   - base de datos inicial (`defaultdb`).
9. Descarga el certificado CA del proyecto si vas a usar verificación estricta del certificado.

> El plan gratuito de Aiven tiene 1 GB de disco y un límite de 76 conexiones. Es suficiente para desarrollo y una demo, pero no para almacenar archivos multimedia. Los medios deben ir a R2/Images/Stream, no a MySQL.

### Crear la base de datos `scouting`

Aiven entrega `defaultdb`. Se recomienda crear una base propia:

```powershell
mysql --host=HOST_AIVEN --port=PORT_AIVEN --user=avnadmin --password --ssl-mode=REQUIRED -e "CREATE DATABASE IF NOT EXISTS scouting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Si no tienes el cliente `mysql` instalado, puedes usar un contenedor:

```powershell
docker run --rm -it mysql:8 mysql --host=HOST_AIVEN --port=PORT_AIVEN --user=avnadmin --password --ssl-mode=REQUIRED -e "CREATE DATABASE IF NOT EXISTS scouting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Verifica la conexión:

```powershell
docker run --rm -it mysql:8 mysql --host=HOST_AIVEN --port=PORT_AIVEN --user=avnadmin --password --ssl-mode=REQUIRED scouting -e "SELECT 1;"
```

### Permitir el acceso desde el backend

Aiven permite por defecto conexiones desde cualquier IP (`0.0.0.0/0`). Si vas a restringir el acceso:

1. En Aiven, abre el servicio MySQL.
2. Ve a **Networking → IP filter** o **Actions → Set IP address allowlist**.
3. Agrega la IP de salida del servidor donde correrá el backend.

Los planes gratuitos de algunas plataformas usan IPs de salida dinámicas. Si no puedes fijar la IP, mantén el filtro abierto y protege la cuenta con una contraseña fuerte y TLS. No uses este esquema para datos sensibles de producción sin revisar el riesgo.

## 3. Configurar las variables

Elige una sola plantilla y no ejecutes ambas copias sobre el mismo archivo.

Para produccion:

```powershell
Copy-Item .env.docker.example .env.docker
```

Para probar en local:

```powershell
Copy-Item .env.docker.local.example .env.docker
```

Completa `.env.docker`:

```dotenv
DB_URL=jdbc:mysql://HOST_AIVEN:PORT_AIVEN/scouting?sslMode=REQUIRED&serverTimezone=UTC
DB_USERNAME=avnadmin
DB_PASSWORD=TU_CONTRASENA_DE_AIVEN
```

La plantilla de producción usa perfil `prod`, cookie segura y una URL HTTPS de API. La plantilla local usa `dev`, `localhost` y cookie no segura. No mezcles ambas configuraciones en el mismo archivo.

Notas:

- `DB_PASSWORD` no se guarda en la URL ni en el repositorio.
- Si la contraseña contiene `$`, escríbela como `$$` en `.env.docker` para evitar que Docker Compose la interprete.
- `sslMode=REQUIRED` cifra la conexión. Para validar además que el certificado lo emitió Aiven, usa `VERIFY_CA` con el certificado CA (ver sección 8).
- `allowPublicKeyRetrieval=true` es un respaldo para la autenticación de MySQL; con TLS no debería ser necesario, pero evita errores de `Public Key Retrieval` en algunos clientes.

### Primera ejecución del esquema

El proyecto no usa Flyway ni Liquibase. Hibernate crea/actualiza las tablas con:

```dotenv
JPA_DDL_AUTO=update
```

Cuando el esquema esté estable, cambia a:

```dotenv
JPA_DDL_AUTO=validate
```

No uses `update` de forma indefinida en producción. Antes de un despliegue real conviene incorporar migraciones versionadas.

### Primer administrador

El backend puede crear el primer `ADMIN` desde variables de entorno:

```dotenv
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_EMAIL=admin@scouting.net.pe
BOOTSTRAP_ADMIN_PASSWORD=una-contrasena-temporal-segura
BOOTSTRAP_ADMIN_FIRST_NAME=Administrador
BOOTSTRAP_ADMIN_LAST_NAME=Scouting
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_DOCUMENT_TYPE=DNI
BOOTSTRAP_ADMIN_DOCUMENT_NUMBER=00000000
```

La contraseña es temporal y obliga a cambiarla en el primer acceso. Después de crear el administrador:

```dotenv
BOOTSTRAP_ADMIN_ENABLED=false
BOOTSTRAP_ADMIN_PASSWORD=
```

No dejes la contraseña de bootstrap en el entorno de producción de forma permanente.

## 4. Construir y ejecutar en local

Estos comandos usan `.env.docker`. Para local, copia `.env.docker.local.example` como se indicó en la sección anterior.

```powershell
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
```

Ver logs:

```powershell
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker logs -f frontend
```

Comprobar el backend:

```powershell
Invoke-RestMethod http://localhost:9193/api/v1/auth/csrf
```

Abrir el frontend:

```text
http://localhost:3000
```

Detener:

```powershell
docker compose --env-file .env.docker down
```

> `NEXT_PUBLIC_API_BASE_URL` se incrusta en el bundle durante `npm run build`. Si cambias la URL de la API, debes reconstruir la imagen del frontend.

## 5. Publicar en servidores gratuitos

### Backend

Usa el `Dockerfile` de `backend/scouting` en la plataforma elegida (Render, Railway, Fly.io, Koyeb, etc.). Configura:

| Variable | Valor |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `PORT` / `SERVER_PORT` | `PORT` de la plataforma tiene prioridad; si no existe, se usa `SERVER_PORT` o 9193 |
| `DB_URL` | URL JDBC de Aiven con `sslMode=REQUIRED` |
| `DB_USERNAME` | `avnadmin` |
| `DB_PASSWORD` | contraseña de Aiven |
| `JPA_DDL_AUTO` | `update` en el primer arranque; luego `validate` |
| `APP_CORS_ALLOWED_ORIGINS` | URL exacta del frontend, sin `/` final |
| `SESSION_COOKIE_SECURE` | `true`; el perfil `prod` lo fuerza aunque la variable falte |
| `SESSION_COOKIE_SAME_SITE` | `Lax` si frontend y API comparten sitio; `None` solo con HTTPS y tras leer la advertencia de cookies de terceros |
| `BOOTSTRAP_ADMIN_*` | solo para el primer arranque |

El backend usa `PORT` si la plataforma lo inyecta; si no existe, usa `SERVER_PORT` y, como ultimo respaldo, 9193. Revisa el puerto publico de la plataforma antes de desplegar.

Health check sugerido:

```text
GET /api/v1/auth/csrf
```

Este endpoint es publico, pero puede crear una sesion vacia en cada sonda. Para health checks muy frecuentes, usa un chequeo TCP o valora agregar un endpoint de salud sin sesion.

### Frontend

El frontend debe construirse con la URL publica de la API. El build falla si no se pasa el argumento:

```powershell
docker build `
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.scouting.net.pe/api/v1 `
  -t scouting-frontend ./frontend
```

Si usas Vercel, configura `NEXT_PUBLIC_API_BASE_URL` en las variables del proyecto **antes** del build. Vercel la incrusta en el bundle; cambiarla después no modifica una compilación ya publicada.

### Dominios y cookies

La opción recomendada es mantener frontend y API bajo el mismo dominio registrable:

```text
app.scouting.net.pe
api.scouting.net.pe
```

Así la cookie de sesión funciona con `SameSite=Lax`.

Si el frontend queda en `*.vercel.app` y el backend en `*.onrender.com`, son sitios distintos. En ese caso:

```dotenv
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=None
APP_CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
```

`SameSite=None` exige HTTPS, pero no garantiza el funcionamiento: Chrome, Edge y Safari bloquean cookies de terceros por defecto. La cookie de sesion podria descartarse y el login pareceria exitoso mientras las siguientes peticiones fallan con 401/403.

Por eso, para produccion usa una de estas opciones:

1. **Mismo sitio registrable**: `app.scouting.net.pe` y `api.scouting.net.pe` con `SameSite=Lax`.
2. **Proxy same-origin**: publica la API bajo el mismo origen del frontend (por ejemplo, rewrites de Next.js) para que la cookie sea de primera parte.
3. **Solo como ultimo recurso**: dominios distintos con `SameSite=None`, asumiendo el riesgo de bloqueo de cookies de terceros.

## 6. Cloudflare

Para el dominio `scouting.net.pe`:

1. Agrega el dominio a Cloudflare y cambia los nameservers en Punto.pe/NIC Perú.
2. Crea los registros `app`, `api` y `www` según el destino de cada servicio.
3. Usa SSL/TLS en **Full (strict)**.
4. Activa **Always Use HTTPS**.
5. No pongas el backend en HTTP público sin TLS.

Si usas Cloudflare delante de un servicio gratuito, verifica que el proveedor acepte el certificado y el hostname personalizado.

## 7. Comprobar la conexión a Aiven

Errores frecuentes:

| Error | Causa probable |
|---|---|
| `Access denied for user 'avnadmin'` | contraseña incorrecta o usuario distinto |
| `Unknown database 'scouting'` | no se creó la base; usa `defaultdb` o créala |
| `Communications link failure` | host/puerto incorrecto, servicio detenido o IP filter |
| `SSLHandshakeException` | modo SSL incorrecto o CA no configurada |
| `Public Key Retrieval is not allowed` | agrega `allowPublicKeyRetrieval=true` |
| `Table ... doesn't exist` | el esquema no se creó; revisa `JPA_DDL_AUTO` y logs |
| `Too many connections` | límite del plan; reduce el pool o revisa instancias |

Para revisar el pool de conexiones, agrega en el entorno del backend:

```dotenv
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=5
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=1
```

Si el servicio gratuito de Aiven esta dormido, Hikari puede fallar durante el arranque. Despierta el servicio antes de iniciar el backend o configura `SPRING_DATASOURCE_HIKARI_INITIALIZATION_FAIL_TIMEOUT=-1` con un `CONNECTION_TIMEOUT` acotado para tolerar el arranque. No uses ese ajuste para ocultar una base caida de forma permanente.

## 8. Verificación estricta del certificado (opcional)

`sslMode=REQUIRED` cifra la conexión, pero no valida el certificado contra la CA de Aiven. Para usar `VERIFY_CA`:

1. Descarga el certificado CA desde Aiven.
2. Créale un truststore JKS:

```powershell
keytool -importcert `
  -alias aiven-mysql `
  -file ca.pem `
  -keystore aiven-truststore.jks `
  -storepass changeit `
  -noprompt
```

3. Monta el archivo en el contenedor, por ejemplo en `/app/certs/aiven-truststore.jks`.
4. Ajusta la URL:

```text
jdbc:mysql://HOST:PORT/scouting?sslMode=VERIFY_CA&trustCertificateKeyStoreUrl=file:/app/certs/aiven-truststore.jks&trustCertificateKeyStorePassword=changeit&serverTimezone=UTC
```

No publiques el truststore ni su contraseña en Git. Si no necesitas esta validación todavía, mantén `sslMode=REQUIRED` y documenta la deuda.

## 9. Limitaciones actuales

- La sesión se guarda en memoria del backend. Un despliegue con varias instancias o reinicios frecuentes obliga a configurar sesiones compartidas.
- No hay migraciones versionadas; Hibernate administra el esquema.
- El plan gratuito de Aiven tiene 1 GB de disco y puede apagar servicios sin uso.
- Los servicios gratuitos de aplicación pueden dormir o reiniciarse; la primera petición puede tardar.
- No hay almacenamiento de archivos; los medios siguen siendo URLs.
- SCP-008 (rate limiting de login/registro) sigue pendiente antes de producción.
- No se debe usar este entorno para datos reales de menores sin revisar autorización, retención y controles de acceso.

## 10. Checklist antes de publicar

- [ ] Base `scouting` creada en Aiven.
- [ ] `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` configurados fuera de Git.
- [ ] `SPRING_PROFILES_ACTIVE=prod`.
- [ ] `SESSION_COOKIE_SECURE=true`.
- [ ] `APP_CORS_ALLOWED_ORIGINS` apunta al dominio exacto del frontend.
- [ ] `NEXT_PUBLIC_API_BASE_URL` apunta a la API pública y la imagen fue reconstruida.
- [ ] `JPA_DDL_AUTO` cambiado a `validate` tras estabilizar el esquema.
- [ ] Bootstrap de administrador desactivado después del primer arranque.
- [ ] HTTPS activo en frontend y API.
- [ ] IP filter de Aiven revisado.
- [ ] Logs sin contraseñas, tokens ni datos personales.
- [ ] `.env.docker` esta ignorado por Git y no se versiona.
- [ ] `SHOW CREATE TABLE player_history_revisions` y `recommendations` muestran `snapshot_json` como `longtext` antes de usar `validate`.
- [ ] Prueba autenticada real: login, una lectura y una escritura con CSRF a traves de los contenedores.
- [ ] Una sola replica o sesiones compartidas; los reinicios de la plataforma cierran sesiones.
- [ ] Health check revisado; si crea sesiones, se acepto el costo o se usa un chequeo TCP.
