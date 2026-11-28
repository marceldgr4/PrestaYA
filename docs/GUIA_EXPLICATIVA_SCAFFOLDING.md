# Guía Paso a Paso y Código para Transcribir — Scaffolding PrestaYA

> **Propósito:** Esta guía contiene la explicación pedagógica y el código exacto de cada archivo necesario para el scaffolding de `packages/shared` y `apps/backend`.  
> **Cómo usar este archivo:** Lee la explicación de cada paso, crea o abre el archivo en la ruta indicada, escribe o copia el código correspondiente, y ejecuta los comandos de verificación.  
> **Nota:** Cuando hayas terminado de implementar y validar todo, puedes **borrar este archivo manualmente**.

---

## Índice de Archivos a Crear / Modificar

1. [Ajuste de Infraestructura: `infra/docker/backend.Dockerfile`](#1-ajuste-de-infraestructura-infradockerbackenddockerfile)
2. [Paquete Compartido: `packages/shared`](#2-paquete-compartido-packagesshared)
   - 2.1 [`packages/shared/package.json`](#21-packagessharedpackagejson)
   - 2.2 [`packages/shared/tsconfig.json`](#22-packagessharedtsconfigjson)
   - 2.3 [`packages/shared/src/enums/index.ts`](#23-packagessharedsrcenumsindexts)
   - 2.4 [`packages/shared/src/contracts/index.ts`](#24-packagessharedsrccontractsindexts)
   - 2.5 [`packages/shared/src/index.ts`](#25-packagessharedsrcindexts)
3. [Aplicación Backend: `apps/backend`](#3-aplicación-backend-appsbackend)
   - 3.1 [`apps/backend/package.json`](#31-appsbackendpackagejson)
   - 3.2 [`apps/backend/tsconfig.json`](#32-appsbackendtsconfigjson)
   - 3.3 [`apps/backend/tsconfig.build.json`](#33-appsbackendtsconfigbuildjson)
   - 3.4 [`apps/backend/nest-cli.json`](#34-appsbackendnest-clijson)
   - 3.5 [`apps/backend/prisma/schema.prisma`](#35-appsbackendprismaschemaprisma)
   - 3.6 [`apps/backend/src/app.module.ts`](#36-appsbackendsrcappmodulets)
   - 3.7 [`apps/backend/src/main.ts`](#37-appsbackendsrcmaints)
4. [Comandos de Verificación y Compilación](#4-comandos-de-verificación-y-compilación)

---

## 1. Ajuste de Infraestructura: `infra/docker/backend.Dockerfile`

### ¿Qué hace este archivo y por qué se ajusta?
El archivo `backend.Dockerfile` define la construcción de la imagen de producción en 5 etapas (*multi-stage build*).
En la línea 3 contenía `ARG NODE_VERSION=22.22-alpine`. La versión `22.22` no existe en Node.js; se ajusta a `22-alpine` para que Docker descargue la versión LTS oficial sin errores.

### Archivo: `infra/docker/backend.Dockerfile`
```dockerfile
# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.34.9 --activate
WORKDIR /repo

# Dependencias: solo manifiestos, para aprovechar la caché de capas
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @prestaya/backend...

# Build: compila shared, genera el cliente Prisma y compila el backend
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN pnpm --filter @prestaya/shared build \
 && pnpm --filter @prestaya/backend exec prisma generate \
 && pnpm --filter @prestaya/backend build

# Solo dependencias de producción del backend
FROM build AS prod-deps
RUN pnpm --filter @prestaya/backend deploy --prod /out

# Runtime mínimo y no root
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    TZ=America/Bogota
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=prod-deps --chown=app:app /out ./
COPY --from=build --chown=app:app /repo/apps/backend/dist ./dist
COPY --from=build --chown=app:app /repo/apps/backend/prisma ./prisma
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1
CMD ["node", "dist/main.js"]
```

---

## 2. Paquete Compartido: `packages/shared`

Este paquete contiene las definiciones que compartirán el Backend, el Frontend Web y la App Móvil.

### 2.1 `packages/shared/package.json`
* **¿Qué hace?** Declara el nombre del paquete `@prestaya/shared`, su punto de entrada (`dist/index.js`), los tipos (`dist/index.d.ts`) y la dependencia `zod` para validación de datos.

```json
{
  "name": "@prestaya/shared",
  "version": "0.1.0",
  "private": true,
  "description": "Tipos TypeScript, enums de dominio y contratos compartidos para PrestaYA",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
```

---

### 2.2 `packages/shared/tsconfig.json`
* **¿Qué hace?** Configura el compilador de TypeScript en modo estricto. Genera archivos `.d.ts` en la carpeta `dist/` para que los demás proyectos puedan importar los tipos con autocompletado en el editor.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### 2.3 `packages/shared/src/enums/index.ts`
* **¿Qué hace?** Define los enumeradores centrales del negocio: roles de usuario (`USUARIO`, `ADMINISTRADOR`), estados de crédito, métodos de amortización, canales de desembolso y estados de auditoría. Evita cadenas de texto mágicas y garantiza coherencia.

```typescript
/**
 * Enums centrales del dominio de negocio PrestaYA.
 *
 * Todas las entidades relacionales, DTOs de API y pantallas de clientes
 * (Web y Móvil) deben importar estos enums para evitar el uso de cadenas mágicas.
 */

/** Roles de usuario para control de acceso RBAC */
export enum UserRole {
  USUARIO = 'USUARIO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

/** Estados de cuenta del usuario */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/** Tipos de documento de identidad oficial */
export enum DocumentType {
  CC = 'CC',           // Cédula de Ciudadanía
  CE = 'CE',           // Cédula de Extranjería
  PASAPORTE = 'PASAPORTE',
  PEP = 'PEP',         // Permiso Especial de Permanencia
  PPT = 'PPT',         // Permiso por Protección Temporal
}

/** Destinos o canales para desembolsar el dinero */
export enum PayoutDestinationType {
  CUENTA_BANCARIA = 'CUENTA_BANCARIA',
  LLAVE = 'LLAVE',
  NEQUI = 'NEQUI',
  DAVIPLATA = 'DAVIPLATA',
}

/** Consentimientos legales obligatorios por ley */
export enum ConsentType {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  DATA_TREATMENT = 'DATA_TREATMENT',
  TERMS_OF_USE = 'TERMS_OF_USE',
}

/** Categorías de documentos adjuntos */
export enum DocumentCategory {
  ID_FRONT = 'ID_FRONT',
  ID_BACK = 'ID_BACK',
  UTILITY_BILL = 'UTILITY_BILL',
  DISBURSEMENT_PROOF = 'DISBURSEMENT_PROOF',
  PAYMENT_PROOF = 'PAYMENT_PROOF',
  CONTRACT_PDF = 'CONTRACT_PDF',
}

/** Estado de escaneo de antivirus/malware */
export enum DocumentScanStatus {
  PENDING = 'PENDING',
  CLEAN = 'CLEAN',
  INFECTED = 'INFECTED',
  FAILED = 'FAILED',
}

/** Estado de revisión administrativa de documentos */
export enum DocumentReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** Periodicidad o frecuencia de pago de las cuotas */
export enum PaymentFrequency {
  SEMANAL = 'SEMANAL',
  QUINCENAL = 'QUINCENAL',
  MENSUAL = 'MENSUAL',
}

/** Sistema de amortización financiera autorizado */
export enum AmortizationMethod {
  FRENCH_FIXED_FEE = 'FRENCH_FIXED_FEE', // Sistema Francés (cuota fija periódica)
}

/** Ciclo de vida de una solicitud de crédito */
export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/** Estado operativo de un préstamo activo */
export enum LoanStatus {
  PENDING_DISBURSEMENT = 'PENDING_DISBURSEMENT',
  ACTIVE = 'ACTIVE',
  PAID_OFF = 'PAID_OFF',
  IN_DEFAULT = 'IN_DEFAULT',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

/** Clasificación de cartera según días de mora */
export enum PortfolioStatus {
  AL_DIA = 'AL_DIA',
  MORA_1_30 = 'MORA_1_30',
  MORA_31_60 = 'MORA_31_60',
  MORA_MAYOR_60 = 'MORA_MAYOR_60',
  CASTIGADA = 'CASTIGADA',
}

/** Estado individual de cada cuota programada */
export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
}

/** Estado de un comprobante de pago reportado por el prestatario */
export enum PaymentSubmissionStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

/** Canales de notificación */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}

/** Estado de envío de notificación */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

/** Estados de eventos en la bandeja Outbox */
export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

/** Categorías de PQRs o casos de soporte */
export enum SupportCaseCategory {
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  LOAN_INQUIRY = 'LOAN_INQUIRY',
  TECHNICAL_PROBLEM = 'TECHNICAL_PROBLEM',
  ACCOUNT_ACCESS = 'ACCOUNT_ACCESS',
  LEGAL_REQUEST = 'LEGAL_REQUEST',
}

/** Estado del ticket de soporte */
export enum SupportCaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_USER = 'WAITING_USER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}
```

---

### 2.4 `packages/shared/src/contracts/index.ts`
* **¿Qué hace?** Define interfaces TypeScript que representan el contrato de datos entre clientes y servidor (sesiones JWT, simulación de crédito, errores API y respuestas paginadas).

```typescript
import {
  AccountStatus,
  AmortizationMethod,
  DocumentType,
  PaymentFrequency,
  UserRole,
} from '../enums/index.js';

/** Carga útil (payload) dentro del JWT de sesión */
export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
}

/** Respuesta de autenticación exitosa (tokens JWT) */
export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

/** Resumen público del perfil de usuario */
export interface UserProfileSummary {
  userId: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentMasked: string;
  city: string;
  department: string;
  kycVerified: boolean;
}

/** Datos de entrada para simular un crédito */
export interface LoanSimulationRequest {
  principalAmount: number;
  frequency: PaymentFrequency;
  termCount: number;
}

/** Detalle proyectado de una cuota en la simulación */
export interface SimulatedInstallment {
  installmentNumber: number;
  dueDate: string; // ISO 8601 (YYYY-MM-DD)
  principalFee: number;
  interestFee: number;
  totalFee: number;
  remainingBalance: number;
}

/** Resultado completo del cálculo de simulación */
export interface LoanSimulationResult {
  principalAmount: number;
  frequency: PaymentFrequency;
  termCount: number;
  amortizationMethod: AmortizationMethod;
  periodicInterestRate: number; // Ej: 0.015 (1.5%)
  effectiveAnnualRate: number;  // Ej: 0.285 (28.5%)
  legalUsuryCapEa: number;      // Tope legal de usura aplicable
  isWithinLegalLimit: boolean;  // Bloqueo legal si supera la usura
  totalInterestAmount: number;
  totalRepaymentAmount: number;
  schedule: SimulatedInstallment[];
}

/** Estructura estándar de errores retornados por la API */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  correlationId?: string;
  timestamp: string;
  path: string;
}

/** Estructura para respuestas con paginación */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
```

---

### 2.5 `packages/shared/src/index.ts`
* **¿Qué hace?** El archivo barril (*barrel export*). Re-exporta todo para que se importe desde `@prestaya/shared` directamente.

```typescript
/**
 * Punto de entrada unificado para @prestaya/shared.
 * Exporta todos los enums, contratos y tipos compartidos en el monorepo.
 */

export * from './enums/index.js';
export * from './contracts/index.js';
```

---

## 3. Aplicación Backend: `apps/backend`

Esta carpeta contiene la API REST construida con NestJS 10 y Prisma ORM para PostgreSQL.

### 3.1 `apps/backend/package.json`
* **¿Qué hace?** Declara las dependencias del Backend: NestJS (`@nestjs/core`, `@nestjs/common`, `@nestjs/config`, `@nestjs/throttler`), Prisma ORM, Helmet para seguridad HTTP, y la referencia interna `"@prestaya/shared": "workspace:*"`.

```json
{
  "name": "@prestaya/backend",
  "version": "0.1.0",
  "private": true,
  "description": "API REST principal de PrestaYA construida con NestJS y Prisma ORM",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint src/ --ext .ts",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.15",
    "@nestjs/config": "^3.3.0",
    "@nestjs/core": "^10.4.15",
    "@nestjs/platform-express": "^10.4.15",
    "@nestjs/throttler": "^6.3.0",
    "@prestaya/shared": "workspace:*",
    "@prisma/client": "^6.4.1",
    "dotenv": "^16.4.7",
    "helmet": "^8.0.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.9",
    "@nestjs/schematics": "^10.2.3",
    "@nestjs/testing": "^10.4.15",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.4",
    "prisma": "^6.4.1",
    "source-map-support": "^0.5.21",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.3"
  }
}
```

---

### 3.2 `apps/backend/tsconfig.json`
* **¿Qué hace?** Configuración estricta de TypeScript para NestJS, con soporte para decoradores (`experimentalDecorators`, `emitDecoratorMetadata`).

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

---

### 3.3 `apps/backend/tsconfig.build.json`
* **¿Qué hace?** Configuración utilizada por Nest CLI durante la compilación a producción. Excluye tests y archivos innecesarios del artefacto final.

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

---

### 3.4 `apps/backend/nest-cli.json`
* **¿Qué hace?** Configuración de la herramienta de línea de comandos de NestJS (`nest build`, `nest start`).

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

---

### 3.5 `apps/backend/prisma/schema.prisma`
* **¿Qué hace?** Define la conexión a PostgreSQL y los modelos relacionales centrales de Fase 1 según el diseño ERD documentado en `docs/arquitectura_diagramas_y_gu_a_de_desarrollo_prestaya.md` §3.
* **Modelos incluidos:**
  - `User`: Credenciales, rol (`USUARIO`/`ADMINISTRADOR`), estado de cuenta, MFA.
  - `UserProfile`: Datos personales, documento cifrado, hash de búsqueda única, dirección.
  - `RatePolicy`: Políticas y topes de tasas legales (bloqueo de usura).
  - `AuditLog`: Registro inmutable de auditoría (*append-only*).

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// ENUMS DE PERSISTENCIA (Sincronizados con @prestaya/shared)
// -------------------------------------------------------------

enum UserRole {
  USUARIO
  ADMINISTRADOR
}

enum AccountStatus {
  ACTIVE
  SUSPENDED
  BLOCKED
  PENDING_VERIFICATION
}

enum DocumentType {
  CC
  CE
  PASAPORTE
  PEP
  PPT
}

enum PaymentFrequency {
  SEMANAL
  QUINCENAL
  MENSUAL
}

// -------------------------------------------------------------
// MODELO: USUARIOS Y AUTENTICACIÓN
// -------------------------------------------------------------

model User {
  id                   String        @id @default(uuid()) @db.Uuid
  email                String        @unique @db.VarChar(255)
  phone                String        @unique @db.VarChar(20)
  passwordHash         String        @map("password_hash") @db.Text
  role                 UserRole      @default(USUARIO)
  accountStatus        AccountStatus @default(PENDING_VERIFICATION) @map("account_status")
  mfaSecretEncrypted   String?       @map("mfa_secret_encrypted") @db.Text
  mfaEnabled           Boolean       @default(false) @map("mfa_enabled")
  createdAt            DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  profile              UserProfile?
  auditLogs            AuditLog[]    @relation("UserAuditLogs")
  approvedRatePolicies RatePolicy[]  @relation("ApprovedPolicies")

  @@map("users")
}

// -------------------------------------------------------------
// MODELO: PERFIL DEL USUARIO (KYC)
// -------------------------------------------------------------

model UserProfile {
  id                     String       @id @default(uuid()) @db.Uuid
  userId                 String       @unique @map("user_id") @db.Uuid
  firstName              String       @map("first_name") @db.VarChar(100)
  lastName               String       @map("last_name") @db.VarChar(100)
  documentType           DocumentType @map("document_type")
  documentNumberEncrypted String       @map("document_number_encrypted") @db.Text
  documentNumberHash     String       @unique @map("document_number_hash") @db.VarChar(64)
  documentMasked         String       @map("document_masked") @db.VarChar(20)
  documentIssueDate      DateTime?    @map("document_issue_date") @db.Date
  address                String       @db.Text
  city                   String       @db.VarChar(100)
  department             String       @db.VarChar(100)
  kycVerifiedAt          DateTime?    @map("kyc_verified_at") @db.Timestamptz
  createdAt              DateTime     @default(now()) @map("created_at") @db.Timestamptz
  updatedAt              DateTime     @updatedAt @map("updated_at") @db.Timestamptz

  user                   User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([documentNumberHash], map: "idx_user_profiles_doc_hash")
  @@map("user_profiles")
}

// -------------------------------------------------------------
// MODELO: POLÍTICAS DE TASAS Y CONTROL LEGAL DE USURA
// -------------------------------------------------------------

model RatePolicy {
  id                    String           @id @default(uuid()) @db.Uuid
  name                  String           @db.VarChar(100)
  frequency             PaymentFrequency
  nominalPeriodRate     Decimal          @map("nominal_period_rate") @db.Decimal(10, 6)
  effectiveAnnualRate   Decimal          @map("effective_annual_rate") @db.Decimal(10, 6)
  legalUsuryCapEa       Decimal          @map("legal_usury_cap_ea") @db.Decimal(10, 6)
  amortizationMethod    String           @default("FRENCH_FIXED_FEE") @map("amortization_method") @db.VarChar(30)
  graceDays             Int              @default(0) @map("grace_days")
  isEnabledForProduction Boolean         @default(false) @map("is_enabled_for_production")
  effectiveFrom         DateTime         @map("effective_from") @db.Timestamptz
  effectiveTo           DateTime?        @map("effective_to") @db.Timestamptz
  legalSourceRef        String           @map("legal_source_ref") @db.Text
  approvedById          String?          @map("approved_by") @db.Uuid
  createdAt             DateTime         @default(now()) @map("created_at") @db.Timestamptz

  approvedBy            User?            @relation("ApprovedPolicies", fields: [approvedById], references: [id])

  @@map("rate_policies")
}

// -------------------------------------------------------------
// MODELO: AUDITORÍA INMUTABLE (APPEND-ONLY)
// -------------------------------------------------------------

model AuditLog {
  id            String    @id @default(uuid()) @db.Uuid
  actorId       String?   @map("actor_id") @db.Uuid
  actorRole     String?   @map("actor_role") @db.VarChar(20)
  action        String    @db.VarChar(80)
  entityType    String    @map("entity_type") @db.VarChar(50)
  entityId      String    @map("entity_id") @db.Uuid
  beforeState   Json?     @map("before_state")
  afterState    Json?     @map("after_state")
  reason        String?   @db.Text
  ipAddress     String?   @map("ip_address") @db.VarChar(45)
  correlationId String    @map("correlation_id") @db.Uuid
  occurredAt    DateTime  @default(now()) @map("occurred_at") @db.Timestamptz

  actor         User?     @relation("UserAuditLogs", fields: [actorId], references: [id])

  @@index([entityType, entityId, occurredAt(sort: Desc)], map: "idx_audit_logs_entity_time")
  @@map("audit_logs")
}
```

---

### 3.6 `apps/backend/src/app.module.ts`
* **¿Qué hace?** Módulo raíz de NestJS. Carga las variables de entorno (`ConfigModule`) y configura el limitador de tasa de peticiones (`ThrottlerModule` para prevenir ataques de fuerza bruta).

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Carga de variables de entorno global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Limitador de peticiones: máximo 100 peticiones por minuto por IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

---

### 3.7 `apps/backend/src/main.ts`
* **¿Qué hace?** Punto de entrada del servidor NestJS.
  - Aplica cabeceras de seguridad HTTP con `helmet`.
  - Configura CORS restringido.
  - Define el prefijo global `/api/v1`.
  - Expone un endpoint de comprobación de salud (`/api/v1/health`) consumido por el healthcheck de Docker.

```typescript
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('PrestaYABootstrap');
  const app = await NestFactory.create(AppModule);

  // Seguridad: Cabeceras HTTP endurecidas
  app.use(helmet());

  // Seguridad: CORS restrictivo
  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 PrestaYA API escuchando en el puerto ${port} (prefijo: /api/v1)`);
}

bootstrap();
```

---

## 4. Comandos de Verificación y Compilación

Una vez creados los archivos en sus respectivas rutas, ejecuta estos comandos en tu terminal desde la raíz del proyecto:

```bash
# 1. Instalar y enlazar paquetes del workspace
pnpm install

# 2. Compilar la librería compartida
pnpm --filter @prestaya/shared build

# 3. Generar el cliente de Prisma para la base de datos
pnpm --filter @prestaya/backend prisma:generate

# 4. Compilar la aplicación Backend
pnpm --filter @prestaya/backend build

# 5. Verificar que el código cumpla con el formato Prettier
pnpm format:check
```
