# Reglas globales para agentes — Scouting.pe

## Producto
Sistema web para búsqueda, evaluación y seguimiento de jugadores de fútbol a nivel competitivo en Perú.

## Proyectos

### backend

Backend

Stack:

- Java
- Spring Boot
- Spring Security
- JPA / Hibernate
- MySQL

Responsabilidades:

- API REST
- autenticación
- autorización
- lógica de negocio
- persistencia
- DTOs
- servicios
- repositorios
- notificaciones
- reglas de reservas

---

### frontend

- Frontend: Next.js App Router, TypeScript.

---


## Reglas obligatorias
1. Lee `docs/arquitectura.md`, `docs/modelo-datos.md` y `docs/reglas-negocio.md` antes de cambiar diseño, datos o permisos.
2. No mezcles código frontend y backend en un mismo módulo.
3. No expongas entidades JPA directamente desde controladores; utiliza DTOs.
4. No almacenes contraseñas en texto plano. Utiliza hashing seguro a través de Spring Security.
5. No confíes en IDs enviados por el navegador para establecer la identidad o autorización del usuario.
6. Los permisos se validan en backend, no solo ocultando botones.
7. No expongas notas privadas de un ojeador a otros ojeadores.
8. No compartas información del jugador con un club sin una acción explícita y autorizada.
9. Un jugador puede existir sin cuenta de acceso.
10. `Prospeccion` representa el seguimiento de un jugador por un ojeador; no dupliques el perfil del jugador.
11. `HistorialDeportivo` pertenece al jugador y registra quién lo creó.
12. No agregues dependencias sin explicar por qué son necesarias.
13. No inventes resultados de pruebas. Ejecuta las comprobaciones disponibles y reporta su resultado real.
14. No ejecutes migraciones destructivas, borrados masivos ni despliegues productivos sin aprobación explícita.
15. No sobrescribas cambios de otros agentes. Revisa `git status` y el diff antes de editar.

## Protocolo de trabajo
- Define alcance, archivos probables, dependencias y criterios de aceptación antes de implementar.
- Divide tareas grandes en subtareas pequeñas.
- Para tareas full-stack, acuerda primero el contrato API entre backend y frontend.
- Evita que dos agentes editen simultáneamente los mismos archivos.
- Tras implementar, ejecuta pruebas/lint/compilación apropiados.
- Entrega un resumen: archivos cambiados, comandos ejecutados, resultado, riesgos y pasos pendientes.
- Actualiza `docs/tasks/queue.md` solo para las tareas que realmente se trabajaron; no marques como terminada una tarea sin verificación.

## Estilo
- Código y nombres técnicos en inglés cuando sea convencional; documentación funcional en español.
- Mensajes de interfaz en español.
- Mantén soluciones simples, mantenibles y adecuadas para un MVP.
