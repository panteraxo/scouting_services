# 09 — Pruebas y calidad

## 1. Pruebas backend

Herramientas:

- JUnit 5.
- Spring Boot Test.
- MockMvc.
- H2 en modo MySQL para integración.
- Surefire para reportes.

Comando ejecutado durante la auditoría:

```powershell
cd backend\scouting
.\mvnw.cmd test
```

Resultado real:

```text
Tests run: 123, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### Distribución observada

| Clase | Pruebas | Área |
|---|---:|---|
| `AuthenticationFlowIntegrationTest` | 20 | Login, sesión, CSRF y cambio de contraseña |
| `BootstrapAdminServiceTest` | 1 | Bootstrap de administrador |
| `ScoutRegistrationAdminServiceConcurrencyTest` | 2 | Concurrencia en aprobación de ojeadores |
| `OrganizationApiIntegrationTest` | 24 | Academias, clubes, verificación y consultas |
| `PlayerApiIntegrationTest` | 16 | Perfil, historial, estadísticas y tutor |
| `PlayerAccountApiIntegrationTest` | 6 | Alta conjunta de cuenta PLAYER + perfil |
| `PlayerProfileServiceTest` | 1 | Servicio de perfil |
| `PlayerStatsCalculatorTest` | 4 | Cálculo de estadísticas |
| `PlayerTimeTest` | 3 | Edad y fechas |
| `ProspectApiIntegrationTest` | 11 | Prospección y evaluaciones |
| `ProspectDataIntegrityTest` | 2 | Restricciones de integridad |
| `RecommendationApiIntegrationTest` | 16 | Recomendaciones, snapshot, respuestas |
| `RecommendationDataIntegrityTest` | 2 | Restricciones de recomendaciones |
| `UserManagementIntegrationTest` | 12 | Usuarios, roles y asignaciones |
| `UserManagementServiceTest` | 1 | Servicio de usuarios |
| `GlobalExceptionHandlerTest` | 1 | Formato de errores |
| `ScoutingApplicationTests` | 1 | Contexto Spring |
| **Total** | **123** | |

## 2. Pruebas frontend

Comandos ejecutados:

```powershell
cd frontend
npm run lint
npm run typecheck
npm run build
```

Resultados:

- `lint`: sin errores.
- `typecheck`: sin errores.
- `build`: compilación y generación de rutas correctamente.

No se encontró:

- Jest, Vitest, Playwright, Cypress ni Testing Library;
- pruebas unitarias de componentes;
- pruebas E2E;
- pruebas visuales o de accesibilidad automatizadas.

## 3. Cobertura funcional inferida

Las pruebas backend cubren principalmente:

- autenticación y sesión;
- CSRF y estados de cuenta;
- permisos por rol;
- bootstrap y aprobación de ojeadores;
- CRUD de organizaciones;
- asignaciones y contraseñas temporales;
- perfil, historial y estadísticas;
- tutor y consentimiento;
- prospección y evaluaciones;
- recomendaciones, snapshots y respuestas;
- restricciones de unicidad e integridad;
- concurrencia en flujos sensibles.

## 4. Áreas sin pruebas identificables

- Componentes React y formularios.
- Navegación y rutas del frontend.
- Pruebas E2E con navegador.
- Integración real contra MySQL; la suite usa H2.
- Pruebas de carga, rendimiento y concurrencia de alta escala.
- Escaneo de dependencias, SAST/DAST.
- Pruebas de accesibilidad.
- Pruebas de correo, archivos, analítica o IA, porque no existen.

## 5. Observaciones de calidad

1. **H2 no reproduce todas las diferencias de MySQL.** El problema de `snapshot_json` como `TINYTEXT` no se detectó en H2.
2. **El esquema local requirió correcciones manuales**; no hay migraciones que prueben el paso entre versiones.
3. **No hay CI** que ejecute tests y build automáticamente.
4. **No hay pruebas frontend**; los cambios de UI dependen de lint, typecheck y build.
5. **No hay pruebas de contrato OpenAPI** ni documentación generada.
6. **La suite es amplia para el MVP**, con 123 pruebas y cobertura de reglas de negocio relevantes.

## 6. Conclusión

El backend tiene una base de pruebas sólida para un MVP académico. El frontend no tiene pruebas automatizadas y la integración real con MySQL no está cubierta por la suite. Antes de producción se recomienda CI, pruebas E2E, migraciones versionadas y una prueba de integración contra MySQL.
