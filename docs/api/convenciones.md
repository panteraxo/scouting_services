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
