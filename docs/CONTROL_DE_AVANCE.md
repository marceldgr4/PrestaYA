# Control de Avance y Checklist de Desarrollo — PrestaYA

> **Rama activa:** `feat/backend-scaffold`  
> **Fase actual:** Fase 1 — Fundaciones y Scaffolding del Monorepo  
> **Guía con código fuente para transcribir:** [`docs/GUIA_EXPLICATIVA_SCAFFOLDING.md`](./GUIA_EXPLICATIVA_SCAFFOLDING.md)  
> **Última actualización:** 2026-11-27

---

## Estado Global del Bloque

| Tarea / Archivo | Estado | Descripción |
| :--- | :---: | :--- |
| **Infraestructura Base** | ✅ Completado | `docker-compose.yaml` (PostgreSQL, Redis, MinIO, Mailpit), scripts de secretos y hooks. |
| **`packages/shared`** | 🟡 En progreso | Paquete de tipos compartidos, enums de negocio y validaciones con Zod. |
| **`apps/backend` (Scaffold)** | ⏳ Pendiente | Configuración inicial NestJS 10, TypeScript estricto, Prisma ORM y Dockerfile. |
| **Prisma ORM & Esquema DB** | ⏳ Pendiente | `schema.prisma` con modelo relacional Fase 1 (users, profiles, policies, audit_logs). |
| **Pruebas de Compilación** | ⏳ Pendiente | Verificación de `pnpm build`, `pnpm typecheck` y `pnpm format:check`. |

---

## Lista de Chequeo de Archivos

### 1. Infraestructura Docker
- [ ] Modificar `infra/docker/backend.Dockerfile` (Línea 3: `ARG NODE_VERSION=22-alpine`)

### 2. Paquete Compartido (`packages/shared`)
- [ ] Transcribir `packages/shared/package.json`
- [ ] Transcribir `packages/shared/tsconfig.json`
- [ ] Transcribir `packages/shared/src/enums/index.ts`
- [ ] Transcribir `packages/shared/src/contracts/index.ts`
- [ ] Transcribir `packages/shared/src/index.ts`

### 3. Aplicación Backend (`apps/backend`)
- [ ] Transcribir `apps/backend/package.json`
- [ ] Transcribir `apps/backend/tsconfig.json`
- [ ] Transcribir `apps/backend/tsconfig.build.json`
- [ ] Transcribir `apps/backend/nest-cli.json`
- [ ] Transcribir `apps/backend/prisma/schema.prisma`
- [ ] Transcribir `apps/backend/src/app.module.ts`
- [ ] Transcribir `apps/backend/src/main.ts`

### 4. Ejecución y Validación Local (Terminal)
- [ ] Ejecutar `pnpm install`
- [ ] Ejecutar `pnpm --filter @prestaya/shared build`
- [ ] Ejecutar `pnpm --filter @prestaya/backend prisma:generate`
- [ ] Ejecutar `pnpm --filter @prestaya/backend build`
- [ ] Ejecutar `pnpm format:check`
