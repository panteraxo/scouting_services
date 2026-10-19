# Cola de tareas

Estados permitidos: `PLANNED`, `READY`, `IN_PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`.

| ID | Tarea | Área | Estado | Dependencias | Criterios de aceptación |
|---|---|---|---|---|---|
| SCP-001 | Validar estructura base y entorno local | infra | PLANNED | — | MySQL local disponible; frontend/backend tienen instrucciones reproducibles |
| SCP-002 | Definir contrato de autenticación y roles | full-stack | PLANNED | SCP-001 | Endpoints y permisos documentados |
| SCP-003 | Implementar gestión de usuarios | full-stack | PLANNED | SCP-002 | CRUD con validaciones y permisos |
| SCP-004 | Implementar academias y clubes | full-stack | PLANNED | SCP-003 | CRUD y relaciones verificadas |
| SCP-005 | Implementar jugadores e historial deportivo | full-stack | PLANNED | SCP-004 | Perfil, filtros e historial con autoría |
| SCP-006 | Implementar prospección y evaluaciones | full-stack | PLANNED | SCP-005 | Seguimiento por ojeador y evaluaciones privadas |
| SCP-007 | Implementar recomendaciones a clubes | full-stack | PLANNED | SCP-006 | Carta, evaluaciones seleccionadas y respuesta del club |

Actualizar estados solo con evidencia. Añadir criterios específicos al crear una tarea nueva.
