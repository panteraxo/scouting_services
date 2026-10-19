# Arquitectura de Scouting.pe

## Aplicaciones
- `frontend/`: Next.js App Router + TypeScript.
- `backend/`: Spring Boot REST API.
- `database/`: notas y documentación de base de datos.
- `.opencode/agents/`: instrucciones de agentes especialistas.

## Flujo de comunicación
Navegador → Next.js → API REST Spring Boot (`/api/v1`) → servicios → repositorios JPA → MySQL.

## Principios
- Separación frontend/backend.
- DTOs en la API.
- Reglas de negocio en servicios.
- Autorización del lado del servidor.
- Esquema gestionado por JPA/Hibernate (sin Flyway).
- Secretos fuera del repositorio.
