# 03 — Estructura del frontend

## 1. Organización

```text
frontend/
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── src/
    ├── app/                 Rutas App Router
    ├── components/ui/       Componentes de interfaz reutilizables
    ├── features/            Módulos funcionales
    ├── lib/                 Cliente HTTP y utilidades
    └── types/               Tipos TypeScript de la API
```

No hay carpeta `middleware.ts`. La protección de rutas del dashboard se hace en el layout cliente y, de forma efectiva, en el backend.

## 2. Rutas y páginas

| Ruta | Archivo | Función |
|---|---|---|
| `/` | `src/app/page.tsx` | Portada pública |
| `/login` | `src/app/login/page.tsx` | Inicio de sesión |
| `/registro/ojeador` | `src/app/registro/ojeador/page.tsx` | Registro público de ojeador |
| `/cambiar-password` | `src/app/cambiar-password/page.tsx` | Cambio de contraseña |
| `/inicio` | `(dashboard)/inicio/page.tsx` | Panel inicial por rol |
| `/jugadores` | `(dashboard)/jugadores/page.tsx` | Listado de jugadores en cards |
| `/jugadores/nuevo` | `(dashboard)/jugadores/nuevo/page.tsx` | Alta conjunta de cuenta y perfil |
| `/jugadores/[id]` | `(dashboard)/jugadores/[id]/page.tsx` | Ficha del jugador |
| `/jugadores/[id]/editar` | `(dashboard)/jugadores/[id]/editar/page.tsx` | Edición del perfil |
| `/jugadores/[id]/historial/nuevo` | `(dashboard)/jugadores/[id]/historial/nuevo/page.tsx` | Nueva actividad |
| `/jugadores/[id]/historial/[historyId]/editar` | `(dashboard)/jugadores/[id]/historial/[historyId]/editar/page.tsx` | Corrección de historial |
| `/jugadores/[id]/tutor` | `(dashboard)/jugadores/[id]/tutor/page.tsx` | Tutor y consentimiento |
| `/academias` | `(dashboard)/academias/page.tsx` | Consulta de academias |
| `/academias/[id]` | `(dashboard)/academias/[id]/page.tsx` | Detalle de academia |
| `/clubes` | `(dashboard)/clubes/page.tsx` | Consulta de clubes |
| `/clubes/[id]` | `(dashboard)/clubes/[id]/page.tsx` | Detalle de club |
| `/admin/academias` | `(dashboard)/admin/academias/page.tsx` | Administración de academias |
| `/admin/academias/nueva` | `(dashboard)/admin/academias/nueva/page.tsx` | Alta de academia |
| `/admin/academias/[id]` | `(dashboard)/admin/academias/[id]/page.tsx` | Detalle administrativo |
| `/admin/academias/[id]/editar` | `(dashboard)/admin/academias/[id]/editar/page.tsx` | Edición |
| `/admin/clubes` | `(dashboard)/admin/clubes/page.tsx` | Administración de clubes |
| `/admin/clubes/nuevo` | `(dashboard)/admin/clubes/nuevo/page.tsx` | Alta de club |
| `/admin/clubes/[id]` | `(dashboard)/admin/clubes/[id]/page.tsx` | Detalle administrativo |
| `/admin/clubes/[id]/editar` | `(dashboard)/admin/clubes/[id]/editar/page.tsx` | Edición |
| `/admin/usuarios` | `(dashboard)/admin/usuarios/page.tsx` | Gestión de usuarios |
| `/admin/usuarios/nuevo` | `(dashboard)/admin/usuarios/nuevo/page.tsx` | Alta de usuario |
| `/admin/usuarios/[id]` | `(dashboard)/admin/usuarios/[id]/page.tsx` | Detalle de usuario |
| `/admin/usuarios/[id]/editar` | `(dashboard)/admin/usuarios/[id]/editar/page.tsx` | Edición de identidad |
| `/admin/solicitudes-ojeador` | `(dashboard)/admin/solicitudes-ojeador/page.tsx` | Aprobación/rechazo de ojeadores |
| `/admin/recomendaciones` | `(dashboard)/admin/recomendaciones/page.tsx` | Auditoría de recomendaciones |
| `/admin/recomendaciones/[id]` | `(dashboard)/admin/recomendaciones/[id]/page.tsx` | Detalle de auditoría |
| `/prospecciones` | `(dashboard)/prospecciones/page.tsx` | Jugadores seguidos |
| `/prospecciones/nueva` | `(dashboard)/prospecciones/nueva/page.tsx` | Nueva prospección |
| `/prospecciones/[id]` | `(dashboard)/prospecciones/[id]/page.tsx` | Detalle de prospección |
| `/prospecciones/[id]/evaluaciones/nueva` | `(dashboard)/prospecciones/[id]/evaluaciones/nueva/page.tsx` | Nueva evaluación |
| `/prospecciones/[id]/recomendaciones/nueva` | `(dashboard)/prospecciones/[id]/recomendaciones/nueva/page.tsx` | Enviar recomendación |
| `/recomendaciones/[id]` | `(dashboard)/recomendaciones/[id]/page.tsx` | Detalle de recomendación del ojeador |
| `/mi-academia` | `(dashboard)/mi-academia/page.tsx` | Academia del Director/Profesor |
| `/mi-academia/editar` | `(dashboard)/mi-academia/editar/page.tsx` | Edición de academia propia |
| `/mi-club` | `(dashboard)/mi-club/page.tsx` | Club del Responsable |
| `/mi-club/editar` | `(dashboard)/mi-club/editar/page.tsx` | Edición de club propio |
| `/mi-club/recomendaciones` | `(dashboard)/mi-club/recomendaciones/page.tsx` | Bandeja del club |
| `/mi-club/recomendaciones/[id]` | `(dashboard)/mi-club/recomendaciones/[id]/page.tsx` | Detalle y respuesta del club |
| `/mi-perfil` | `(dashboard)/mi-perfil/page.tsx` | Perfil del jugador |
| `/usuarios/nuevo` | `(dashboard)/usuarios/nuevo/page.tsx` | Creación de usuario por Director de academia |

## 3. Módulos del frontend

| Módulo | Archivos principales | Responsabilidad |
|---|---|---|
| Autenticación | `features/auth/auth-provider.tsx`, `auth-api.ts`, `login-form.tsx`, `register-scout-form.tsx`, `change-password-form.tsx` | Sesión, login, registro de ojeador y cambio de contraseña |
| Layout | `app/(dashboard)/layout.tsx`, `features/auth/components/dashboard-shell.tsx` | Navegación, menú por rol y guarda de sesión |
| Usuarios | `features/usuarios/` | Alta, edición, asignación, estado y contraseña temporal |
| Organizaciones | `features/organizations/` | Academias, clubes, formularios, ubicación UBIGEO y consulta |
| Jugadores | `features/jugadores/` | Listado, alta cuenta+perfil, ficha, edición, tutor e historial |
| Prospección | `features/prospecciones/` | Seguimiento, notas y evaluaciones privadas |
| Recomendaciones | `features/recomendaciones/` | Envío, snapshot, bandeja del club y auditoría Admin |
| Administración | `features/admin/` | Solicitudes de ojeador |
| API | `lib/api-client.ts` | Fetch centralizado, cookies, CSRF y errores uniformes |
| Tipos | `types/api.ts` | Contratos TypeScript de DTOs y enums |

## 4. Gestión de estado

- No se usa Redux, Zustand ni React Query.
- Estado local de cada componente con `useState`/`useEffect`.
- `AuthProvider` mantiene el usuario autenticado y el estado de sesión.
- Los formularios guardan sus valores localmente.
- Las listas no se cachean; cada montaje vuelve a solicitar datos.

## 5. Validación

- Validaciones manuales en componentes de formulario antes de enviar.
- El backend sigue siendo la autoridad y devuelve `fieldErrors`.
- Los errores de campo se muestran junto al input correspondiente.
- Se usan mensajes funcionales en español.

## 6. Comunicación con la API

Archivo: `frontend/src/lib/api-client.ts`

- Base URL desde `NEXT_PUBLIC_API_BASE_URL`; valor por defecto actual `http://localhost:9193/api/v1`.
- `credentials: "include"` para enviar la cookie de sesión.
- `cache: "no-store"` para datos privados.
- `apiRequest` para lecturas.
- `apiMutation` para escrituras; envía `X-CSRF-TOKEN` y reintenta solo ante `CSRF_INVALID`.
- `getCsrfToken` mantiene el token en memoria y deduplica solicitudes simultáneas.
- `ApiError` contiene estado HTTP, código, errores de campo, ruta y timestamp.

## 7. Gestión de sesión y protección de rutas

- `AuthProvider` llama a `/auth/me` al iniciar.
- `DashboardLayout` redirige a `/login` si no hay sesión.
- Si `mustChangePassword` es verdadero, redirige a `/cambiar-password`.
- El menú lateral se filtra por rol, pero eso es solo usabilidad.
- La autorización efectiva está en el backend.
- No hay middleware de Next.js ni verificación de sesión en servidor.

## 8. Manejo de errores

- `Alert` para errores, avisos y éxito.
- `InlineLoading` y `StatePanel` para carga y vacío.
- Errores 401 disparan `markSessionExpired`.
- Los errores 404 de alcance se muestran como “no encontrado”.
- No hay páginas de error personalizadas para toda la aplicación.

## 9. Interfaz

- CSS global en `frontend/src/app/globals.css`.
- Componentes propios: botones, campos, alertas, tablas, tarjetas y paginación.
- No se usa Tailwind, Material UI, Bootstrap ni otra librería visual.
- Diseño responsive.
- Módulo Jugadores usa tarjetas; módulos administrativos y de recomendaciones usan tablas.
- No hay tests visuales ni E2E.

## 10. Limitaciones identificadas

- Sin pruebas automatizadas de componentes.
- Sin manejo formal de caché de datos.
- Sin SSR de datos de negocio.
- Sin middleware de protección de rutas.
- Sin preferencias de usuario ni configuración general.
- La URL de la API debe coincidir con el puerto del backend; una configuración incorrecta produce un error de conexión visible para el usuario.
