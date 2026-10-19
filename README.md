# Scouting.pe — OpenCode Orchestrated Starter

Starter monorepo for Scouting.pe with:
- `frontend/`: Next.js + TypeScript
- `backend/`: Spring Boot + Java + Maven
- `database/`: database notes and seed guidance
- `.opencode/agents/`: orchestrator and specialist agents
- `docs/tasks/`: task queue and task template

## Prerequisites
- Git
- Node.js LTS and npm
- JDK 21
- MySQL 8 local
- OpenCode installed

## First steps
1. Copy `.env.example` to `.env` and adjust local values.
2. Open this repository in OpenCode.
3. Start with the `/plan-task` command to create a task card.
4. Ask the `orchestrator` agent to implement one task at a time.
5. Review the diff before accepting changes.

## Base de datos
Este proyecto usa MySQL local; no se utiliza Docker. Crea la base de datos y configura las credenciales por variables de entorno:

```sql
CREATE DATABASE IF NOT EXISTS scouting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Variables: `DB_URL`, `DB_USERNAME` (por defecto `root`) y `DB_PASSWORD`.

## Frontend
```bash
cd frontend
npm install
npm run dev
```

## Backend
```bash
cd backend/scouting
./mvnw spring-boot:run
```
On Windows use `mvnw.cmd spring-boot:run`. The Maven wrapper is already included in `backend/scouting/`.

## Orchestration model
- The orchestrator classifies each request as frontend, backend, full-stack, database/infra, or documentation.
- It delegates implementation to the relevant specialist agent(s).
- For full-stack work, backend API contracts should be agreed before frontend integration.
- QA checks the changes after implementation.
- Agents must report changed files, tests run, test results, and remaining risks.
- Do not run destructive database commands or deploy to production without explicit approval.

## Important
This repository is a starting scaffold, not a completed product. Verify OpenCode agent behavior and tool availability in your installed version. Never place real credentials in committed files.
