# Convenciones de API

- Prefijo: `/api/v1`.
- JSON para requests/responses.
- Validación de entrada mediante Bean Validation.
- DTOs específicos por operación.
- Errores consistentes con status HTTP apropiado.
- Paginación para listados grandes.
- Filtros explícitos y validados.
- No devolver entidades JPA directamente.
- Documentar permisos requeridos para cada endpoint.
- El usuario autenticado y su rol/organización se obtienen del contexto de seguridad del servidor; nunca se aceptan como autoridad desde el request.
- El inicio de sesión usa el correo y una sesión con cookie `HttpOnly`; las operaciones de escritura requieren protección CSRF. En producción la cookie debe ser `Secure` y CORS debe limitarse a los orígenes autorizados.
- Las contraseñas se almacenan con hash seguro. Las cuentas internas nuevas reciben una contraseña temporal de un solo uso y deben cambiarla al iniciar sesión.
