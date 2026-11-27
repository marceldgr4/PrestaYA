# ARQUITECTURA, DIAGRAMAS Y GUÍA DE IMPLEMENTACIÓN — PROYECTO PRESTAYA

## Control Documental

| Atributo                 | Detalle                                                                                 |
| :----------------------- | :-------------------------------------------------------------------------------------- |
| **Proyecto**             | PrestaYA — Plataforma Multiplataforma de Préstamos Personales                           |
| **Código del Documento** | `DOC-PRESTAYA-02`                                                                       |
| **Versión**              | `1.1.0-RC`                                                                              |
| **Fecha**                | 27 de noviembre de 2026                                                                 |
| **Documento Padre**      | `docs/documentaci_n_t_cnica_y_especificaci_n_de_requisitos_prestaya.md`                 |
| **Audiencia**            | Arquitectos de Software, Desarrolladores Full Stack (Backend, Web, Mobile), DevOps y QA |

---

## 1. Arquitectura del Sistema

### 1.1 Arquitectura General (Monolito Modular + Workers Asíncronos)

Para PrestaYA se establece una arquitectura de **Monolito Modular con principios de Arquitectura Limpia / Hexagonal**, respaldada por una API REST centralizada, base de datos relacional transaccional y trabajadores asíncronos (_workers_).

- **Por qué se elige esta arquitectura:**
  1. **Integridad Transaccional Financiera:** Permite ejecutar operaciones compuestas (ej. confirmar desembolso + activar préstamo + generar calendario de cuotas; o confirmar pago + asignar a cuotas + actualizar saldo) dentro de una única transacción ACID en PostgreSQL sin requerir patrones complejos de transacciones distribuidas (Sagas).
  2. **Velocidad de Desarrollo y Mantenimiento:** Optimiza la productividad de un equipo acotado o desarrollador Full Stack, evitando la sobrecarga operativa de múltiples repositorios, redes de servicios y despliegues independientes prematuros.
  3. **Evolución Controlada:** Al aislar cada dominio (`auth`, `users`, `documents`, `rates`, `applications`, `contracts`, `loans`, `payments`, `notifications`, `audit`, `reporting`) mediante interfaces y eventos internos, cualquier módulo crítico puede extraerse en el futuro si el tráfico lo demanda.

### 1.2 Arquitectura Backend (`NestJS` + `TypeScript`)

El backend se estructura en cuatro capas lógicas por cada módulo de dominio:

1. **Capa de Presentación / Transporte (`Controllers`, `DTOs`, `Guards`, `Interceptors`):** Expone endpoints REST versionados (`/api/v1`), valida esquemas de entrada, aplica autenticación JWT, autorización RBAC y control de idempotencia.
2. **Capa de Aplicación (`Use Cases` / `Application Services`):** Orquesta flujos de negocio, abre transacciones de base de datos, coordina puertos externos y registra eventos en el _Outbox_ transaccional.
3. **Capa de Dominio (`Entities`, `Value Objects`, `Domain Services`, `Policies`):** Contiene las reglas financieras puras (cálculo de intereses, validaciones de tope legal `LegalRatePolicy`, máquinas de estado, reglas de redondeo) sin dependencias de frameworks ni de base de datos.
4. **Capa de Infraestructura (`Repositories`, `Adapters`):** Implementa los puertos definidos por el dominio utilizando Prisma/TypeORM sobre PostgreSQL, SDK de S3 para almacenamiento privado y clientes de correo/push.

### 1.3 Arquitectura Frontend Web (`React` / `Next.js` + `TypeScript`)

- **Enfoque:** Aplicación web responsiva (_Single Page Application_ o híbrida con _App Router_) organizada por funcionalidades (_Feature-based architecture_).
- **Separación de Vistas:** Comparte componentes base de UI y cliente HTTP, pero segrega estrictamente las rutas y layouts de `/app/*` (Portal del Prestatario) y `/admin/*` (Panel Administrativo) mediante guardias de ruta y validación de sesión.
- **Gestión de Estado:** Estado del servidor gestionado con **TanStack Query (React Query)** para caché controlada, revalidación y manejo de estados de carga/error; estado global ligero (sesión/UI) mediante **Zustand** o React Context.

### 1.4 Arquitectura Móvil (`React Native` + `Expo` + `TypeScript`)

- **Alcance Funcional:** Exclusivamente enfocada en el recorrido del prestatario (`USUARIO`): registro, KYC, captura de documentos con cámara/galería, simulador, solicitudes, aceptación contractual, consulta de cuotas, reporte de comprobantes y notificaciones push.
- **Integración Nativa:** Uso de `expo-secure-store` para almacenar tokens de sesión cifrados en el _Keychain_ (iOS) / _Keystore_ (Android), `expo-image-picker` / `expo-document-picker` para soportes y `expo-notifications` (FCM/APNs) para avisos push.

### 1.5 Arquitectura de Datos y Almacenamiento

- **PostgreSQL 16+:** Fuente única de verdad transaccional. Valores monetarios en `NUMERIC(18,2)`, tasas en `NUMERIC(10,6)`, marcas temporales en `TIMESTAMPTZ` (almacenadas en UTC y proyectadas en `America/Bogota`).
- **Object Storage Privado (S3 Compatible / MinIO en local):** Almacena archivos binarios (cédulas, recibos públicos, contratos PDF, comprobantes de desembolso y pago). PostgreSQL solo almacena metadatos (`object_key`, `checksum_sha256`, `mime_type`, `scan_status`).
- **Redis 7+:** Utilizado exclusivamente para colas de trabajo (`BullMQ`), limitación de tasa (_rate limiting_) y caché de catálogos no financieros. **Nunca se usa como fuente de verdad de saldos o estados financieros.**

---

## 2. Diagramas Técnicos (Mermaid)

### 2.1 Diagrama de Contexto del Sistema

```mermaid
flowchart TB
    Usuario["Prestatario (USUARIO)\nWeb Responsiva / Android / iOS"]
    Admin["Administrador (ADMINISTRADOR)\nPanel Web Administrativo"]

    subgraph SistemaPrestaYA["Ecosistema PrestaYA"]
        Plataforma["Plataforma Multiplataforma PrestaYA\n(API REST + Portal Web + Apps Móviles + Workers)"]
    end

    S3[("Almacenamiento Privado S3\n(Documentos, Contratos, Comprobantes)")]
    EmailProvider["Proveedor Correo Transaccional\n(SMTP / Resend / SES)"]
    PushProvider["Servicios Push Móvil\n(Firebase FCM / Apple APNs)"]
    EntidadBancaria["Canales Bancarios / Billeteras Externas\n(Transferencias Manuales Nequi/Daviplata/Bancos)"]

    Usuario -->|"HTTPS: Registro, KYC, Simulación,\nSolicitud, Contrato, Reporte Pago"| Plataforma
    Admin -->|"HTTPS + MFA: Revisión, Aprobación,\nDesembolso, Conciliación, Reportes"| Plataforma

    Plataforma -->|"Sube/Lee archivos privados\n(URLs firmadas temporales)"| S3
    Plataforma -->|"Envía OTP, recibos y alertas"| EmailProvider
    Plataforma -->|"Envía notificaciones push"| PushProvider
    Admin -.->|"Ejecuta transferencia manual\nexterna y carga comprobante"| EntidadBancaria
    Usuario -.->|"Realiza pago externo\ny carga comprobante"| EntidadBancaria
```

### 2.2 Diagrama de Arquitectura Técnica y Despliegue

```mermaid
flowchart LR
    subgraph Clientes["Capa de Clientes"]
        WebUser["Web Portal Usuario\n(React/Next.js + TS)"]
        WebAdmin["Web Panel Admin\n(React/Next.js + TS)"]
        MobileApp["App Móvil Android/iOS\n(React Native + Expo)"]
    end

    subgraph Edge["Borde y Seguridad"]
        Gateway["Reverse Proxy / Load Balancer\n(TLS 1.3 + WAF + Rate Limit)"]
    end

    subgraph BackendCluster["Backend Modular (Stateless)"]
        API["API REST NestJS (/api/v1)\nAuth/RBAC + Motor Financiero + Use Cases"]
        Worker["Background Worker (BullMQ)\nOutbox + Scheduler Mora + Reportes"]
    end

    subgraph Persistencia["Capa de Datos e Infraestructura"]
        PG[("PostgreSQL 16\nDatos Relacionales + Ledger + Audit")]
        Redis[("Redis 7\nColas BullMQ + Rate Limit")]
        Storage[("Object Storage S3 / MinIO\nBuckets Privados Cifrados")]
    end

    subgraph Externos["Servicios Externos"]
        Notify["FCM / APNs / Correo"]
        Obs["Observabilidad\n(Logs JSON + Métricas + Alertas)"]
    end

    WebUser & WebAdmin & MobileApp -->|"HTTPS / JSON / JWT"| Gateway
    Gateway --> API
    API -->|"Transacciones ACID"| PG
    API -->|"Encola jobs / Rate limit"| Redis
    API -->|"Upload / Presigned URLs"| Storage
    Redis --> Worker
    Worker -->|"Lee Outbox / Actualiza estados"| PG
    Worker -->|"Despacha avisos"| Notify
    API & Worker --> Obs
```

### 2.3 Diagrama de Componentes del Backend Modular

```mermaid
flowchart TB
    subgraph Transport["Capa API / Transporte"]
        Controllers["REST Controllers (/api/v1)\nAuth, Users, Docs, Quotes, Apps, Loans, Payments, Admin"]
        Guards["Security Guards & Interceptors\nJwtAuthGuard, RolesGuard, OwnershipGuard, IdempotencyInterceptor"]
    end

    subgraph DomainModules["Módulos de Dominio (Monolito Modular)"]
        AuthMod["Módulo Auth & Security\n(JWT, MFA, Sesiones)"]
        UsersMod["Módulo Users & KYC\n(Perfil, Destinos, Consentimientos)"]
        DocsMod["Módulo Documents\n(Metadatos, Validación MIME, URLs Firmadas)"]
        RatesMod["Módulo Rates & Simulator\n(Tarifas Versionadas, LegalRatePolicy, Amortización)"]
        AppsMod["Módulo Loan Applications\n(Radicación, Evaluación, Decisión)"]
        ContractsMod["Módulo Contracts\n(Oferta Congelada, PDF, Hash Aceptación)"]
        LoansMod["Módulo Loans & Portfolio\n(Desembolso, Cuotas, Mora, Cartera)"]
        PaymentsMod["Módulo Payments\n(Reportes, Conciliación, Allocations)"]
        NotifMod["Módulo Notifications\n(Outbox, Plantillas, Ley 2300)"]
        AuditMod["Módulo Audit & Reporting\n(Bitácora Append-Only, KPIs, Exportes)"]
    end

    Controllers --> Guards --> DomainModules
    AppsMod --> UsersMod & DocsMod & RatesMod
    ContractsMod --> AppsMod
    LoansMod --> ContractsMod & RatesMod
    PaymentsMod --> LoansMod & DocsMod
    DomainModules --> AuditMod
    DomainModules --> NotifMod
```

### 2.4 Diagramas de Flujo Funcional

#### Flujo A: Solicitud, Evaluación, Aceptación y Desembolso

```mermaid
flowchart TD
    Start([Inicio: Usuario Autenticado]) --> CheckKYC{"¿Perfil KYC, Docs,\nDestino y Consentimientos\ncompletos?"}
    CheckKYC -- No --> CompleteKYC["Completar Perfil / Cargar Soportes / Aceptar Políticas"]
    CompleteKYC --> CheckKYC
    CheckKYC -- Sí --> Simulate["Simular Préstamo (Motor valida Tope Legal E.A.)"]
    Simulate --> SubmitApp["Radicar Solicitud con Idempotency-Key"]
    SubmitApp --> CheckThreshold{"¿Monto > COP $500.000?"}
    CheckThreshold -- Sí --> FlagPriority["Marcar Alerta Prioritaria + Mensaje Supervisión"]
    CheckThreshold -- No --> QueueAdmin["Enviar a Cola de Revisión Administrativa"]
    FlagPriority --> QueueAdmin
    QueueAdmin --> AdminReview["Administrador Revisa Expediente y Documentos"]
    AdminReview --> Decision{"Decisión Administrativa"}
    Decision -- Solicitar Info --> ReqInfo["Estado: REQUIERE_INFORMACION -> Usuario subsana"]
    ReqInfo --> AdminReview
    Decision -- Rechazar --> Reject["Estado: RECHAZADA + Motivo + Notificación"]
    Reject --> EndReject([Fin: Solicitud Rechazada])
    Decision -- Aprobar --> GenContract["Congelar Oferta y Generar Contrato Electrónico"]
    GenContract --> UserAccept{"¿Usuario acepta contrato\ndentro de vigencia?"}
    UserAccept -- No / Expira --> Expire["Estado: EXPIRADA / CANCELADA"]
    UserAccept -- Sí --> ReadyDisburse["Estado: LISTA_PARA_DESEMBOLSO"]
    ReadyDisburse --> ExternalTransfer["Admin ejecuta transferencia externa (Banco/Nequi/Daviplata)"]
    ExternalTransfer --> RegisterDisburse["Admin registra desembolso + comprobante (Transacción ACID)"]
    RegisterDisburse --> ActiveLoan["Préstamo ACTIVO + Calendario de Cuotas Generado + Notificación"]
    ActiveLoan --> EndSuccess([Fin: Crédito Desembolsado])
```

#### Flujo B: Reporte, Conciliación de Pago y Gestión de Cartera

```mermaid
flowchart TD
    Start([Inicio: Préstamo Activo]) --> UserPay["Usuario realiza pago externo y sube comprobante"]
    UserPay --> SavePending["Guardar soporte en S3 + Pago en estado EN_REVISION\n(Saldo NO cambia)"]
    SavePending --> NotifyAdmin["Notificar a Administrador vía Outbox"]
    NotifyAdmin --> AdminVerify["Administrador verifica comprobante vs. extracto bancario"]
    AdminVerify --> VerifyDecision{"Resultado de Conciliación"}
    VerifyDecision -- Rechazar / Aclarar --> RejectPay["Estado: RECHAZADO / ACLARACION_SOLICITADA\n+ Motivo + Notificar Usuario"]
    RejectPay --> EndPending([Fin: Saldo sin cambios])
    VerifyDecision -- Confirmar --> BeginTx["Iniciar Transacción ACID + Lock SELECT FOR UPDATE"]
    BeginTx --> CreatePayment["Registrar Pago Confirmado (Idempotency-Key)"]
    CreatePayment --> Allocate["Imputar abono a cuotas (Prelación: Mora/Gastos -> Interés -> Capital)"]
    Allocate --> UpdateInstallments["Actualizar estado de cuotas (PAGADA_PARCIAL / PAGADA)"]
    UpdateInstallments --> CheckBalance{"¿Saldo insoluto == 0?"}
    CheckBalance -- Sí --> CloseLoan["Préstamo pasa a estado PAGADO"]
    CheckBalance -- No --> KeepActive["Préstamo continúa ACTIVO (Recalcular estado cartera)"]
    CloseLoan & KeepActive --> CommitAudit["Guardar Audit Log + Recibo + Commit Transacción"]
    CommitAudit --> NotifyUser["Notificar Confirmación y Recibo al Usuario"]
    NotifyUser --> EndConfirmed([Fin: Pago Conciliado])
```

### 2.5 Diagramas de Secuencia

#### Secuencia 1: Radicación y Aprobación de Solicitud

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (Web/Móvil)
    participant API as Backend API (NestJS)
    participant DB as PostgreSQL
    participant Q as Redis / Worker
    actor A as Administrador (Web)

    U->>API: POST /api/v1/loan-applications (Idempotency-Key, quote_id, destination_id)
    API->>DB: BEGIN TRANSACTION
    API->>DB: Validar KYC, Documentos, Consentimientos y Vigencia de Cotización
    API->>DB: INSERT loan_applications (status = EN_REVISION)
    API->>DB: INSERT application_events + audit_logs
    API->>DB: INSERT outbox_events (ADMIN_NEW_APPLICATION)
    API->>DB: COMMIT
    API-->>U: 201 Created (Radicado de solicitud)

    Q->>DB: Leer outbox_events pendientes
    Q-->>A: Notificación: Nueva solicitud pendiente de revisión

    A->>API: PATCH /api/v1/admin/applications/{id}/decision (APROBADA, motivo)
    API->>DB: BEGIN TRANSACTION
    API->>DB: Validar estado == EN_REVISION y rol == ADMINISTRADOR
    API->>DB: UPDATE loan_applications (status = APROBADA)
    API->>DB: INSERT loan_contracts (oferta congelada + términos)
    API->>DB: INSERT application_events + audit_logs + outbox_events
    API->>DB: COMMIT
    API-->>A: 200 OK (Solicitud aprobada y contrato generado)
    Q-->>U: Push/Email: Tu solicitud fue aprobada. Revisa y acepta tu contrato
```

#### Secuencia 2: Reporte y Conciliación Atómica de Pago

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (Web/Móvil)
    participant API as Backend API (NestJS)
    participant S3 as Storage Privado S3
    participant DB as PostgreSQL
    actor A as Administrador (Web)

    U->>API: POST /api/v1/loans/{id}/payment-submissions (archivo, monto, fecha, ref)
    API->>API: Validar MIME, tamaño y escaneo malware
    API->>S3: PutObject (bucket privado)
    S3-->>API: object_key + checksum
    API->>DB: INSERT payment_submissions (status = EN_REVISION) + outbox_events
    API-->>U: 201 Created (Comprobante recibido, pendiente de verificación)

    A->>API: GET /api/v1/admin/documents/{docId}/presigned-url
    API->>DB: INSERT audit_logs (VIEW_PAYMENT_PROOF)
    API->>S3: Generar URL firmada (TTL 10 min)
    API-->>A: URL temporal de visualización

    A->>API: POST /api/v1/admin/payment-submissions/{subId}/confirm (Idempotency-Key, monto_real)
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT * FROM loans WHERE id = ? FOR UPDATE
    API->>DB: Validar submission.status == EN_REVISION
    API->>DB: INSERT payments (idempotency_key UNIQUE)
    API->>DB: INSERT payment_allocations & UPDATE installments / loans.outstanding_balance
    API->>DB: UPDATE payment_submissions (status = CONFIRMADO)
    API->>DB: INSERT audit_logs + outbox_events (PAYMENT_CONFIRMED)
    API->>DB: COMMIT
    API-->>A: 200 OK (Pago conciliado y saldo actualizado)
```

### 2.6 Diagramas de Estados

#### Estados de Solicitud de Préstamo

```mermaid
stateDiagram-v2
    [*] --> BORRADOR
    BORRADOR --> EN_REVISION : Enviar solicitud (validación completa)
    EN_REVISION --> REQUIERE_INFORMACION : Admin solicita subsanación
    REQUIERE_INFORMACION --> EN_REVISION : Usuario carga datos/soportes
    EN_REVISION --> RECHAZADA : Admin rechaza (con motivo)
    EN_REVISION --> APROBADA : Admin aprueba y congela oferta
    APROBADA --> EXPIRADA : Vence plazo de aceptación
    APROBADA --> CANCELADA : Cancelada antes de desembolso
    APROBADA --> LISTA_PARA_DESEMBOLSO : Usuario acepta contrato electrónico
    LISTA_PARA_DESEMBOLSO --> CANCELADA : Cancelada antes de transferencia
    LISTA_PARA_DESEMBOLSO --> DESEMBOLSADA : Admin confirma desembolso efectivo
    RECHAZADA --> [*]
    EXPIRADA --> [*]
    CANCELADA --> [*]
    DESEMBOLSADA --> [*]
```

#### Estados de Préstamo Activo y Cartera

```mermaid
stateDiagram-v2
    [*] --> ACTIVO : Desembolso confirmado
    state ACTIVO {
        [*] --> AL_DIA
        AL_DIA --> PROXIMO_A_VENCER : Dentro de ventana preventiva (ej. <= 3 días)
        PROXIMO_A_VENCER --> EN_MORA : Supera fecha vencimiento + días gracia
        AL_DIA --> EN_MORA : Supera fecha vencimiento + días gracia
        EN_MORA --> AL_DIA : Pago conciliado cubre cuotas vencidas
        PROXIMO_A_VENCER --> AL_DIA : Pago conciliado cubre cuota próxima
    }
    ACTIVO --> PAGADO : Saldo insoluto == 0.00 tras conciliación
    PAGADO --> [*]
```

#### Estados de Reporte de Pago / Comprobante

```mermaid
stateDiagram-v2
    [*] --> EN_REVISION : Usuario carga comprobante
    EN_REVISION --> ACLARACION_SOLICITADA : Admin solicita soporte legible/adicional
    ACLARACION_SOLICITADA --> EN_REVISION : Usuario adjunta nuevo soporte
    EN_REVISION --> RECHAZADO : Soporte inválido o no conciliado en banco
    EN_REVISION --> CONFIRMADO : Admin verifica ingreso y aplica saldo (ACID)
    RECHAZADO --> [*]
    CONFIRMADO --> [*]
```

---

## 3. Diseño de Base de Datos (PostgreSQL)

### 3.1 Principios de Modelado Financiero

1. **Tipos de Datos Exactos:** Toda columna monetaria utiliza `NUMERIC(18,2)`. Toda tasa de interés utiliza `NUMERIC(10,6)`.
2. **Inmutabilidad Financiera (_Append-Only_):** Las tablas `payments`, `payment_allocations`, `disbursements`, `application_events` y `audit_logs` nunca permiten `DELETE` ni `UPDATE` de montos históricos. Las correcciones se realizan mediante registros de reverso auditados.
3. **Separación de Datos Sensibles:** Los números de documento de identidad y cuentas destino se almacenan cifrados (`*_encrypted`) junto con un índice hash (`*_hash`) para búsquedas exactas y control de unicidad sin exponer texto plano.
4. **Identificadores:** Claves primarias `UUID v4` generadas por la base de datos o aplicación para evitar enumeración secuencial en URLs.

### 3.2 Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    USERS ||--|| USER_PROFILES : "tiene"
    USERS ||--o{ PAYOUT_DESTINATIONS : "registra"
    USERS ||--o{ CONSENTS : "acepta"
    USERS ||--o{ DOCUMENTS : "carga"
    USERS ||--o{ LOAN_APPLICATIONS : "radica"
    USERS ||--o{ LOANS : "obtiene"
    USERS ||--o{ NOTIFICATIONS : "recibe"
    USERS ||--o{ SUPPORT_CASES : "abre"

    RATE_POLICIES ||--o{ LOAN_QUOTES : "rige"
    RATE_POLICIES ||--o{ LOANS : "gobierna"

    LOAN_QUOTES ||--o| LOAN_APPLICATIONS : "origina"
    LOAN_APPLICATIONS ||--o{ APPLICATION_EVENTS : "registra_historial"
    LOAN_APPLICATIONS ||--o| LOAN_CONTRACTS : "formaliza"
    LOAN_APPLICATIONS ||--o| LOANS : "se_convierte_en"

    LOANS ||--|| DISBURSEMENTS : "se_activa_con"
    LOANS ||--|{ INSTALLMENTS : "programa"
    LOANS ||--o{ PAYMENT_SUBMISSIONS : "recibe_reportes"

    PAYMENT_SUBMISSIONS ||--o| PAYMENTS : "se_concilia_en"
    PAYMENTS ||--|{ PAYMENT_ALLOCATIONS : "se_imputa_en"
    INSTALLMENTS ||--o{ PAYMENT_ALLOCATIONS : "amortiza"

    DOCUMENTS ||--o| DISBURSEMENTS : "soporta"
    DOCUMENTS ||--o| PAYMENT_SUBMISSIONS : "evidencia"
```

### 3.3 Diccionario de Entidades y Esquema Relacional

> **Nota de Trazabilidad:** Las tablas marcadas con `[Diseño Técnico Recomendado]` amplían las entidades base de `Propuesta_PrestaYa_v1.1` para garantizar el patrón _Outbox_, mesas de ayuda PQR y notas internas documentadas en los archivos complementarios.

| Tabla                               | Clave Primaria | Claves Foráneas                                                                                                                                                                                         | Campos Relevantes y Restricciones (`CHECK` / `UNIQUE`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| :---------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`users`**                         | `id UUID PK`   | —                                                                                                                                                                                                       | `email VARCHAR(255) UNIQUE NOT NULL`, `phone VARCHAR(20) UNIQUE NOT NULL`, `password_hash TEXT NOT NULL`, `role VARCHAR(20) CHECK (role IN ('USUARIO', 'ADMINISTRADOR'))`, `account_status VARCHAR(30)`, `mfa_secret_encrypted TEXT`, `mfa_enabled BOOLEAN DEFAULT FALSE`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.                                                                                                                                                                                                                                                                                       |
| **`user_profiles`**                 | `id UUID PK`   | `user_id UUID UNIQUE FK -> users(id)`                                                                                                                                                                   | `first_name VARCHAR(100) NOT NULL`, `last_name VARCHAR(100) NOT NULL`, `document_type VARCHAR(10) NOT NULL`, `document_number_encrypted TEXT NOT NULL`, `document_number_hash VARCHAR(64) UNIQUE NOT NULL`, `document_masked VARCHAR(20) NOT NULL`, `document_issue_date DATE`, `address TEXT NOT NULL`, `city VARCHAR(100) NOT NULL`, `department VARCHAR(100) NOT NULL`, `kyc_verified_at TIMESTAMPTZ`.                                                                                                                                                                                                            |
| **`payout_destinations`**           | `id UUID PK`   | `user_id UUID FK -> users(id)`                                                                                                                                                                          | `destination_type VARCHAR(30) CHECK (destination_type IN ('CUENTA_BANCARIA', 'LLAVE', 'NEQUI', 'DAVIPLATA'))`, `institution_name VARCHAR(100) NOT NULL`, `holder_name VARCHAR(200) NOT NULL`, `account_identifier_encrypted TEXT NOT NULL`, `account_masked VARCHAR(30) NOT NULL`, `is_active BOOLEAN DEFAULT TRUE`, `verified_at TIMESTAMPTZ`.                                                                                                                                                                                                                                                                      |
| **`consents`**                      | `id UUID PK`   | `user_id UUID FK -> users(id)`                                                                                                                                                                          | `consent_type VARCHAR(50) NOT NULL` (`PRIVACY_POLICY`, `DATA_TREATMENT`, `TERMS_OF_USE`), `policy_version VARCHAR(30) NOT NULL`, `accepted_at TIMESTAMPTZ NOT NULL`, `ip_address INET`, `user_agent TEXT`, `withdrawn_at TIMESTAMPTZ`.                                                                                                                                                                                                                                                                                                                                                                               |
| **`documents`**                     | `id UUID PK`   | `user_id UUID FK -> users(id)`, `reviewed_by UUID FK -> users(id)`                                                                                                                                      | `category VARCHAR(40) NOT NULL` (`ID_FRONT`, `ID_BACK`, `UTILITY_BILL`, `DISBURSEMENT_PROOF`, `PAYMENT_PROOF`, `CONTRACT_PDF`), `object_key TEXT UNIQUE NOT NULL`, `mime_type VARCHAR(100) NOT NULL`, `file_size_bytes BIGINT NOT NULL`, `checksum_sha256 VARCHAR(64) NOT NULL`, `scan_status VARCHAR(20) DEFAULT 'PENDING'`, `review_status VARCHAR(20) DEFAULT 'PENDING'`, `rejection_reason TEXT`, `uploaded_at TIMESTAMPTZ`.                                                                                                                                                                                     |
| **`rate_policies`**                 | `id UUID PK`   | `approved_by UUID FK -> users(id)`                                                                                                                                                                      | `name VARCHAR(100) NOT NULL`, `frequency VARCHAR(20) CHECK (frequency IN ('SEMANAL', 'QUINCENAL', 'MENSUAL'))`, `nominal_period_rate NUMERIC(10,6) NOT NULL`, `effective_annual_rate NUMERIC(10,6) NOT NULL`, `legal_usury_cap_ea NUMERIC(10,6) NOT NULL`, `amortization_method VARCHAR(30) NOT NULL`, `grace_days INT DEFAULT 0`, `is_enabled_for_production BOOLEAN DEFAULT FALSE`, `effective_from TIMESTAMPTZ NOT NULL`, `effective_to TIMESTAMPTZ`, `legal_source_ref TEXT NOT NULL`, `CHECK (effective_annual_rate <= legal_usury_cap_ea)`.                                                                    |
| **`loan_quotes`**                   | `id UUID PK`   | `user_id UUID FK -> users(id)`, `rate_policy_id UUID FK -> rate_policies(id)`                                                                                                                           | `principal NUMERIC(18,2) CHECK (principal > 0)`, `frequency VARCHAR(20) NOT NULL`, `term_count INT CHECK (term_count > 0)`, `periodic_rate NUMERIC(10,6) NOT NULL`, `effective_annual_rate NUMERIC(10,6) NOT NULL`, `total_interest NUMERIC(18,2) NOT NULL`, `total_payable NUMERIC(18,2) NOT NULL`, `installment_amount NUMERIC(18,2) NOT NULL`, `schedule_snapshot JSONB NOT NULL`, `expires_at TIMESTAMPTZ NOT NULL`.                                                                                                                                                                                             |
| **`loan_applications`**             | `id UUID PK`   | `user_id UUID FK -> users(id)`, `quote_id UUID UNIQUE FK -> loan_quotes(id)`, `payout_destination_id UUID FK -> payout_destinations(id)`, `decided_by UUID FK -> users(id)`                             | `radicado_code VARCHAR(30) UNIQUE NOT NULL`, `idempotency_key VARCHAR(100) UNIQUE NOT NULL`, `requested_principal NUMERIC(18,2) NOT NULL`, `frequency VARCHAR(20) NOT NULL`, `term_count INT NOT NULL`, `requires_priority_review BOOLEAN NOT NULL`, `status VARCHAR(30) NOT NULL`, `decision_reason_code VARCHAR(50)`, `decision_notes TEXT`, `submitted_at TIMESTAMPTZ NOT NULL`, `decided_at TIMESTAMPTZ`.                                                                                                                                                                                                        |
| **`application_events`**            | `id UUID PK`   | `application_id UUID FK -> loan_applications(id)`, `actor_id UUID FK -> users(id)`                                                                                                                      | `previous_status VARCHAR(30)`, `new_status VARCHAR(30) NOT NULL`, `reason TEXT`, `occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **`loan_contracts`**                | `id UUID PK`   | `application_id UUID UNIQUE FK -> loan_applications(id)`, `document_id UUID FK -> documents(id)`                                                                                                        | `contract_number VARCHAR(30) UNIQUE NOT NULL`, `terms_version VARCHAR(30) NOT NULL`, `terms_snapshot JSONB NOT NULL`, `accepted_at TIMESTAMPTZ`, `acceptance_ip INET`, `acceptance_method VARCHAR(30)`, `document_hash_sha256 VARCHAR(64)`.                                                                                                                                                                                                                                                                                                                                                                          |
| **`loans`**                         | `id UUID PK`   | `application_id UUID UNIQUE FK -> loan_applications(id)`, `user_id UUID FK -> users(id)`, `rate_policy_id UUID FK -> rate_policies(id)`                                                                 | `loan_code VARCHAR(30) UNIQUE NOT NULL`, `principal NUMERIC(18,2) NOT NULL`, `disbursed_amount NUMERIC(18,2) NOT NULL`, `total_interest NUMERIC(18,2) NOT NULL`, `outstanding_principal NUMERIC(18,2) NOT NULL`, `outstanding_interest NUMERIC(18,2) NOT NULL`, `outstanding_mora NUMERIC(18,2) DEFAULT 0`, `status VARCHAR(20) CHECK (status IN ('ACTIVO', 'PAGADO'))`, `portfolio_status VARCHAR(30) CHECK (portfolio_status IN ('AL_DIA', 'PROXIMO_A_VENCER', 'EN_MORA', 'REPORTADO', 'PAGADO'))`, `disbursed_at TIMESTAMPTZ NOT NULL`, `maturity_date DATE NOT NULL`, `version INT DEFAULT 1` (Optimistic Lock). |
| **`disbursements`**                 | `id UUID PK`   | `loan_id UUID UNIQUE FK -> loans(id)`, `payout_destination_id UUID FK -> payout_destinations(id)`, `proof_document_id UUID FK -> documents(id)`, `confirmed_by UUID FK -> users(id)`                    | `idempotency_key VARCHAR(100) UNIQUE NOT NULL`, `amount NUMERIC(18,2) CHECK (amount > 0)`, `channel VARCHAR(50) NOT NULL`, `external_reference VARCHAR(100) NOT NULL`, `disbursed_at TIMESTAMPTZ NOT NULL`, `confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.                                                                                                                                                                                                                                                                                                                                                       |
| **`installments`**                  | `id UUID PK`   | `loan_id UUID FK -> loans(id)`                                                                                                                                                                          | `sequence_number INT NOT NULL`, `due_date DATE NOT NULL`, `principal_due NUMERIC(18,2) NOT NULL`, `interest_due NUMERIC(18,2) NOT NULL`, `mora_due NUMERIC(18,2) DEFAULT 0`, `total_due NUMERIC(18,2) NOT NULL`, `amount_paid NUMERIC(18,2) DEFAULT 0`, `status VARCHAR(20) CHECK (status IN ('PENDIENTE', 'PAGADA_PARCIAL', 'PAGADA', 'VENCIDA'))`, `paid_at TIMESTAMPTZ`, `UNIQUE (loan_id, sequence_number)`.                                                                                                                                                                                                     |
| **`payment_submissions`**           | `id UUID PK`   | `loan_id UUID FK -> loans(id)`, `installment_id UUID NULLABLE FK -> installments(id)`, `user_id UUID FK -> users(id)`, `proof_document_id UUID FK -> documents(id)`, `reviewed_by UUID FK -> users(id)` | `declared_amount NUMERIC(18,2) CHECK (declared_amount > 0)`, `declared_payment_date DATE NOT NULL`, `channel VARCHAR(50) NOT NULL`, `declared_reference VARCHAR(100)`, `status VARCHAR(30) CHECK (status IN ('EN_REVISION', 'CONFIRMADO', 'RECHAZADO', 'ACLARACION_SOLICITADA'))`, `review_notes TEXT`, `submitted_at TIMESTAMPTZ NOT NULL`, `reviewed_at TIMESTAMPTZ`.                                                                                                                                                                                                                                              |
| **`payments`**                      | `id UUID PK`   | `submission_id UUID UNIQUE FK -> payment_submissions(id)`, `loan_id UUID FK -> loans(id)`, `confirmed_by UUID FK -> users(id)`                                                                          | `idempotency_key VARCHAR(100) UNIQUE NOT NULL`, `receipt_number VARCHAR(30) UNIQUE NOT NULL`, `confirmed_amount NUMERIC(18,2) CHECK (confirmed_amount > 0)`, `effective_payment_date DATE NOT NULL`, `bank_reference VARCHAR(100) NOT NULL`, `confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.                                                                                                                                                                                                                                                                                                                      |
| **`payment_allocations`**           | `id UUID PK`   | `payment_id UUID FK -> payments(id)`, `installment_id UUID FK -> installments(id)`                                                                                                                      | `principal_applied NUMERIC(18,2) DEFAULT 0`, `interest_applied NUMERIC(18,2) DEFAULT 0`, `mora_applied NUMERIC(18,2) DEFAULT 0`, `total_applied NUMERIC(18,2) NOT NULL`.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **`outbox_events`** `[Recomendado]` | `id UUID PK`   | —                                                                                                                                                                                                       | `aggregate_type VARCHAR(50) NOT NULL`, `aggregate_id UUID NOT NULL`, `event_type VARCHAR(80) NOT NULL`, `payload JSONB NOT NULL`, `status VARCHAR(20) DEFAULT 'PENDING'`, `retry_count INT DEFAULT 0`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `processed_at TIMESTAMPTZ`.                                                                                                                                                                                                                                                                                                                                           |
| **`notifications`**                 | `id UUID PK`   | `user_id UUID FK -> users(id)`                                                                                                                                                                          | `channel VARCHAR(20) CHECK (channel IN ('IN_APP', 'EMAIL', 'PUSH', 'SMS'))`, `event_type VARCHAR(80) NOT NULL`, `title VARCHAR(200) NOT NULL`, `body TEXT NOT NULL`, `dedupe_key VARCHAR(120) UNIQUE NOT NULL`, `status VARCHAR(20) NOT NULL`, `read_at TIMESTAMPTZ`, `sent_at TIMESTAMPTZ`.                                                                                                                                                                                                                                                                                                                         |
| **`audit_logs`**                    | `id UUID PK`   | `actor_id UUID NULLABLE FK -> users(id)`                                                                                                                                                                | `actor_role VARCHAR(20)`, `action VARCHAR(80) NOT NULL`, `entity_type VARCHAR(50) NOT NULL`, `entity_id UUID NOT NULL`, `before_state JSONB`, `after_state JSONB`, `reason TEXT`, `ip_address INET`, `correlation_id UUID NOT NULL`, `occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.                                                                                                                                                                                                                                                                                                                               |
| **`support_cases`** `[Recomendado]` | `id UUID PK`   | `user_id UUID FK -> users(id)`, `loan_id UUID NULLABLE FK -> loans(id)`, `assigned_to UUID NULLABLE FK -> users(id)`                                                                                    | `ticket_code VARCHAR(30) UNIQUE NOT NULL`, `category VARCHAR(40) NOT NULL`, `subject VARCHAR(200) NOT NULL`, `description TEXT NOT NULL`, `status VARCHAR(30) NOT NULL`, `resolution_notes TEXT`, `sla_due_at TIMESTAMPTZ NOT NULL`, `created_at TIMESTAMPTZ DEFAULT NOW()`, `closed_at TIMESTAMPTZ`.                                                                                                                                                                                                                                                                                                                |

### 3.4 Índices Recomendados para Rendimiento

- `idx_user_profiles_doc_hash` en `user_profiles(document_number_hash)` (búsqueda exacta instantánea).
- `idx_loan_applications_status_submitted` en `loan_applications(status, submitted_at DESC)` (bandeja administrativa).
- `idx_loans_user_status` en `loans(user_id, status)` (consulta de préstamos activos del usuario).
- `idx_loans_portfolio_status` en `loans(portfolio_status)` (indicadores de cartera).
- `idx_installments_due_status` en `installments(due_date, status)` (job diario de recordatorios y mora).
- `idx_payment_submissions_status` en `payment_submissions(status, submitted_at ASC)` (cola de conciliación).
- `idx_audit_logs_entity_time` en `audit_logs(entity_type, entity_id, occurred_at DESC)` (trazabilidad por expediente).
- `idx_outbox_pending` parcial en `outbox_events(created_at ASC) WHERE status = 'PENDING'`.

---

## 4. Organización de Módulos y Secuencia de Desarrollo

Para minimizar retrabajos y respetar las dependencias técnicas y de negocio, la implementación debe seguir estrictamente este orden:

| Orden  | Módulo                            | Objetivo y Responsabilidad                                                                                                                | Dependencias                           |    Prioridad     | Criterios de Finalización                                                       |
| :----: | :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- | :--------------: | :------------------------------------------------------------------------------ |
| **1**  | **`core` & `audit`**              | Configuración global, conexión PostgreSQL, manejo centralizado de excepciones, interceptor de auditoría _append-only_ y `correlation_id`. | Ninguna (Infraestructura base)         | **P0 (Crítica)** | Healthchecks activos; `audit_logs` escribiendo eventos estructurados sin PII.   |
| **2**  | **`auth`**                        | Registro, login, JWT rotativo, guards RBAC (`USUARIO`/`ADMINISTRADOR`), validación de ownership y MFA para administradores.               | `core`, `audit`                        | **P0 (Crítica)** | Pruebas de seguridad contra escalamiento de roles e IDOR aprobadas.             |
| **3**  | **`users` & `consents`**          | Perfil KYC, cifrado/hash de documento, destinos de desembolso y registro granular de consentimientos legales versionados.                 | `auth`, `audit`                        | **P0 (Crítica)** | Unicidad de documento validada; consentimientos bloqueantes operativos.         |
| **4**  | **`documents`**                   | Integración con S3 privado, validación MIME/_magic bytes_, escaneo antimalware y generación de URLs prefirmadas temporales.               | `auth`, `users`, `audit`               | **P0 (Crítica)** | Archivos inaccesibles públicamente; descargas admin registradas en auditoría.   |
| **5**  | **`rates` & `simulator`**         | Políticas de tarifas versionadas, `LegalRatePolicy` (bloqueo de usura) y motor de cálculo decimal exacto (`NUMERIC`).                     | `core`, `audit`                        | **P0 (Crítica)** | 100% cobertura unitaria en fórmulas, redondeos y bloqueo de tasas ilegales.     |
| **6**  | **`applications`**                | Radicación idempotente de solicitudes, alerta umbral `> COP $500.000`, bandeja administrativa y decisión formal.                          | `users`, `documents`, `rates`, `audit` |  **P1 (Alta)**   | Flujo de revisión completo; imposible autoaprobar solicitudes.                  |
| **7**  | **`contracts`**                   | Generación de oferta congelada, PDF contractual, huella `SHA-256` y aceptación electrónica verificable del usuario.                       | `applications`, `documents`, `audit`   |  **P1 (Alta)**   | Bloqueo de desembolso si no existe aceptación contractual vigente.              |
| **8**  | **`loans` & `disbursements`**     | Registro de desembolso efectivo idempotente, activación atómica del préstamo, generación de cuotas y job diario de mora/cartera.          | `contracts`, `rates`, `audit`          |  **P1 (Alta)**   | Transacción ACID verificada; cero cuotas duplicadas ante reintentos.            |
| **9**  | **`payments`**                    | Reporte de comprobantes (`EN_REVISION`), conciliación administrativa con bloqueo `FOR UPDATE`, imputación a cuotas y recibos.             | `loans`, `documents`, `audit`          |  **P1 (Alta)**   | Imposible alterar saldo sin conciliación; idempotencia en confirmación probada. |
| **10** | **`notifications` & `scheduler`** | Worker de _Transactional Outbox_, envío push/email, recordatorios programados y control horario Ley 2300 de 2023.                         | `core`, `loans`, `payments`            |  **P2 (Media)**  | Reintentos con DLQ operativos; bloqueo fuera de horarios legales de cobranza.   |
| **11** | **`reporting` & `support`**       | Dashboard de KPIs, búsqueda global paginada, exportaciones controladas CSV/PDF y canal de PQR/disputas.                                   | `loans`, `payments`, `audit`           |  **P2 (Media)**  | Totales de dashboard 100% consistentes con el ledger; exportes auditados.       |

---

## 5. Estructura de Carpetas y Archivos (Monorepo)

Se recomienda organizar el proyecto como un **Monorepo** (`prestaya/`) gestionado con `pnpm workspaces` (o `npm workspaces`), facilitando compartir contratos de tipos (`packages/shared`) entre Backend, Web y Móvil sin duplicar código.

```text
prestaya/
├── .github/
│   └── workflows/                 # Pipelines CI/CD (lint, test, build) en GitHub Actions
│       ├── backend-ci.yml
│       ├── web-ci.yml
│       └── mobile-ci.yml
├── docs/                          # Documentación técnica oficial del repositorio
│   ├── documentaci_n_t_cnica_y_especificaci_n_de_requisitos_prestaya.md
│   ├── arquitectura_diagramas_y_gu_a_de_desarrollo_prestaya.md
│   ├── prompt_maestro_operativo_para_asistentes_ia_prestaya.md
│   └── adr/                       # Architecture Decision Records (decisiones técnicas clave)
├── infra/                         # Configuración de infraestructura y contenedores locales
│   ├── docker/
│   │   ├── postgres/
│   │   │   └── init/              # Scripts SQL iniciales montados en /docker-entrypoint-initdb.d
│   │   ├── backend.Dockerfile     # Imagen multi-stage optimizada para API NestJS
│   │   └── web.Dockerfile         # Imagen multi-stage para Frontend Web
│   └── scripts/                   # Scripts de utilidad (ej. generate-secrets.mjs) y backups locales
├── packages/
│   └── shared/                    # Tipos TypeScript, enums de estados y constantes compartidas
│       ├── src/
│       │   ├── enums/             # Estados de solicitud, préstamo, cuota, pago y roles
│       │   └── contracts/         # Interfaces de respuesta API (NO lógica financiera privada)
│       └── package.json
├── apps/
│   ├── backend/                   # API REST Central y Workers (NestJS + TypeScript)
│   │   ├── prisma/                # Esquema relacional, migraciones versionadas y seeds iniciales
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── common/            # Guards (JWT, RBAC, Ownership), Interceptors (Audit, Idempotency), Filters
│   │   │   ├── config/            # Validación estricta de variables de entorno (Joi / Zod)
│   │   │   ├── infrastructure/    # Adaptadores técnicos: PrismaService, S3StorageAdapter, RedisQueue
│   │   │   ├── modules/           # Dominios de negocio desacoplados (Controller -> UseCase -> Domain -> Repo)
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── consents/
│   │   │   │   ├── documents/
│   │   │   │   ├── rates/         # Incluye LegalRatePolicy y motor de cálculo decimal
│   │   │   │   ├── applications/
│   │   │   │   ├── contracts/
│   │   │   │   ├── loans/
│   │   │   │   ├── payments/
│   │   │   │   ├── notifications/ # Incluye OutboxWorker y Scheduler Ley 2300
│   │   │   │   ├── reporting/
│   │   │   │   ├── support/
│   │   │   │   └── audit/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/                  # Pruebas unitarias (*.spec.ts) e integración/E2E (*.e2e-spec.ts)
│   │   └── package.json
│   ├── web/                       # Aplicación Web Responsiva: Portal Usuario + Panel Admin
│   │   ├── src/
│   │   │   ├── api/               # Cliente HTTP (Axios/Fetch) con interceptores de refresh token
│   │   │   ├── components/        # Componentes UI reutilizables (accesibles WCAG 2.2 AA)
│   │   │   ├── features/          # Módulos funcionales separados por rol
│   │   │   │   ├── auth/          # Login, registro, MFA admin
│   │   │   │   ├── borrower/      # Vistas del prestatario (perfil, simulador, solicitudes, cuotas, pagos)
│   │   │   │   └── admin/         # Vistas administrativas (dashboard, bandeja, desembolsos, conciliación)
│   │   │   ├── guards/            # Protección de rutas por rol en interfaz (complemento al backend)
│   │   │   └── utils/             # Formateadores de moneda COP y fechas America/Bogota
│   │   └── package.json
│   └── mobile/                    # Aplicación Móvil Android/iOS (React Native + Expo) - Solo Prestatario
│       ├── src/
│       │   ├── api/               # Cliente API compartido con manejo seguro de tokens (SecureStore)
│       │   ├── components/        # Componentes nativos móviles
│       │   ├── navigation/        # Navegación autenticada vs. pública
│       │   ├── screens/           # Pantallas del prestatario (KYC, cámara docs, simulador, préstamos, pagos)
│       │   └── services/          # Push notifications (FCM/APNs) y selector de archivos
│       ├── app.json
│       └── package.json
├── .env.example                   # Plantilla de variables de entorno (SIN secretos reales)
├── .gitignore                     # Exclusión de node_modules, .env, builds y archivos temporales
├── docker-compose.yaml            # Orquestación local (PostgreSQL, Redis, MinIO S3, Mailpit; y Backend en Fase 2+)
└── package.json                   # Configuración raíz del monorepo
```

### Reglas de Ubicación (Qué NO debe hacerse)

- **Prohibido** colocar lógica de cálculo de tasas, redondeos financieros o validación de reglas de negocio dentro de `apps/web` o `apps/mobile` (los clientes solo formatean y muestran los datos calculados por `apps/backend`).
- **Prohibido** ubicar componentes de administración dentro de `apps/mobile`.
- **Prohibido** colocar consultas SQL directas dentro de los `Controllers`; toda persistencia debe encapsularse en repositorios dentro de `infrastructure` o del módulo correspondiente.

---

## 6. Docker y Entornos de Desarrollo

### 6.1 Requisitos Previos

- **Docker Engine** `>= 24.0` y **Docker Compose** `>= 2.20`
- **Node.js** `>= 22.12.0` (`.nvmrc`: `26`) y **pnpm** `>= 10.16.0` (`packageManager`: `pnpm@10.34.9`)
- **Git** `>= 2.40`

### 6.2 `docker-compose.yaml` para Desarrollo Local

El entorno local emula completamente la infraestructura de producción utilizando servicios contenedores ligeros y gratuitos (PostgreSQL, Redis, MinIO como reemplazo local de Amazon S3 y Mailpit para capturar correos transaccionales sin enviar spam real).

> **Nota:** El archivo `docker-compose.yaml` real del repositorio usa imágenes endurecidas de Chainguard para MinIO (`cgr.dev/chainguard/minio`), autenticación `scram-sha-256` en PostgreSQL, contraseña en Redis y puertos expuestos solo en `127.0.0.1`. El bloque YAML a continuación es una referencia simplificada; consulta el archivo `docker-compose.yaml` en la raíz del proyecto para la versión completa.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: prestaya-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:?Falta DB_USER en .env}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Falta DB_PASSWORD en .env}
      POSTGRES_DB: ${DB_NAME:?Falta DB_NAME en .env}
      POSTGRES_INITDB_ARGS: '--auth-host=scram-sha-256 --data-checksums'
      TZ: UTC
    ports:
      - '127.0.0.1:${DB_PORT:-5432}:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/docker/postgres/init:/docker-entrypoint-initdb.d:ro
    networks:
      - prestaya_net
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U "$${POSTGRES_USER}" -d "$${POSTGRES_DB}"']
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  redis:
    image: redis:7-alpine
    container_name: prestaya-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory-policy noeviction --requirepass "$$REDIS_PASSWORD"
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:?Falta REDIS_PASSWORD en .env}
    ports:
      - '127.0.0.1:${REDIS_PORT:-6379}:6379'
    volumes:
      - redis_data:/data
    networks:
      - prestaya_net
    healthcheck:
      test: ['CMD-SHELL', 'REDISCLI_AUTH="$$REDIS_PASSWORD" redis-cli --no-auth-warning ping | grep -q PONG']
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: cgr.dev/chainguard/minio:latest
    container_name: prestaya-minio
    restart: unless-stopped
    user: '65532:65532'
    command: ['server', '/data', '--console-address', ':9001']
    environment:
      MINIO_ROOT_USER: ${S3_ACCESS_KEY:?Falta S3_ACCESS_KEY en .env}
      MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY:?Falta S3_SECRET_KEY en .env}
    ports:
      - '127.0.0.1:9000:9000' # API S3 compatible
      - '127.0.0.1:9001:9001' # Consola Web MinIO
    volumes:
      - minio_data:/data
    networks:
      - prestaya_net

  # minio-init: crea automáticamente el bucket privado al arrancar (ver docker-compose.yaml)

  mailpit:
    image: axllent/mailpit:v1.34.0
    container_name: prestaya-mailpit
    restart: unless-stopped
    ports:
      - '127.0.0.1:1025:1025' # Servidor SMTP local
      - '127.0.0.1:8025:8025' # Bandeja Web de pruebas
    networks:
      - prestaya_net

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  prestaya_net:
    driver: bridge
```

### 6.3 Plantilla de Variables de Entorno (`.env.example`)

El archivo `.env.example` usa marcadores `__SECRET_*__` que el script `pnpm secrets:generate` reemplaza automáticamente por valores aleatorios criptográficamente seguros al generar `.env`. También resuelve las interpolaciones `${VAR}` a valores literales (Prisma y NestJS no expanden variables).

```env
# --- APLICACIÓN ---
NODE_ENV=development
PORT=3000
APP_TIMEZONE=America/Bogota
CORS_ORIGINS=http://localhost:5173,http://localhost:8081

# --- BASE DE DATOS POSTGRESQL ---
DB_USER=prestaya_dev
DB_PASSWORD=__SECRET_HEX_24__
DB_NAME=prestaya_db
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public
DATABASE_URL_TEST=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/prestaya_test?schema=public

# --- REDIS (colas BullMQ y rate limit) ---
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=__SECRET_HEX_24__

# --- SEGURIDAD Y CIFRADO ---
JWT_ACCESS_SECRET=__SECRET_HEX_64__
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=__SECRET_HEX_64__
JWT_REFRESH_EXPIRES_IN=7d
PII_ENCRYPTION_KEY=__SECRET_B64_32__
PII_HASH_PEPPER=__SECRET_HEX_32__

# --- ALMACENAMIENTO PRIVADO S3 / MINIO ---
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET_PRIVATE=prestaya-private-docs
S3_ACCESS_KEY=prestaya_minio
S3_SECRET_KEY=__SECRET_HEX_24__
S3_FORCE_PATH_STYLE=true
S3_PRESIGNED_TTL_SECONDS=600

# --- CORREO (Mailpit local) ---
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=no-reply@prestaya.local
```

### 6.4 Diferenciación de Entornos

| Característica       | Local (`development`)                       | Desarrollo Compartido / Staging (`staging`)  | Pruebas Automatizadas (`test`)                  | Producción (`production`)                       |
| :------------------- | :------------------------------------------ | :------------------------------------------- | :---------------------------------------------- | :---------------------------------------------- |
| **Infraestructura**  | Docker Compose en máquina del desarrollador | Cloud administrado (instancias reducidas)    | Contenedores efímeros en CI (GitHub Actions)    | Cloud administrado HA + Multi-AZ                |
| **Base de Datos**    | PostgreSQL contenedor local                 | PostgreSQL administrado con datos sintéticos | Base de datos aislada destruida tras cada suite | PostgreSQL administrado con PITR (`RPO <= 15m`) |
| **Storage Archivos** | MinIO local (`localhost:9000`)              | Bucket S3 privado de pruebas                 | Mock o contenedor MinIO efímero                 | Bucket S3 privado cifrado KMS + Antivirus       |
| **Correo / Push**    | Mailpit local (`localhost:8025`)            | Proveedor sandbox (solo correos whitelist)   | Mocks en memoria                                | Proveedor transaccional + FCM/APNs reales       |
| **Gestión Secretos** | Archivo `.env` local ignorado por Git       | Variables cifradas en plataforma Cloud       | Secretos efímeros en GitHub Actions             | Cloud Secret Manager con rotación periódica     |

### 6.5 Comandos Operativos Docker y Solución de Problemas

- **Generar `.env` con secretos aleatorios:** `pnpm secrets:generate`
- **Levantar servicios base:** `pnpm infra:up` (alias de `docker compose up -d`)
- **Ver logs en tiempo real:** `pnpm infra:logs` (o `docker compose logs -f postgres redis minio`)
- **Estado de los contenedores:** `pnpm infra:ps`
- **Detener servicios conservando datos:** `pnpm infra:down`
- **Resetear entorno limpio (elimina volúmenes locales):** `pnpm infra:reset` (alias de `docker compose down -v`)
- **Solución de problemas frecuentes:**
  - _Puerto `5432` ocupado:_ Detener servicio PostgreSQL nativo del sistema operativo (`sudo service postgresql stop` o desde Servicios en Windows) antes de ejecutar `pnpm infra:up`.
  - _Error de bucket inexistente en MinIO:_ El servicio `minio-init` crea automáticamente el bucket privado `prestaya-private-docs` al iniciar el stack. Si falló, revisa `docker compose logs minio-init`; para recrear manualmente accede a `http://localhost:9001`.
  - _Base de datos `prestaya_test` no existe:_ El script `infra/docker/postgres/init/01-create-test-database.sql` solo se ejecuta al inicializar el volumen por primera vez. Si ya existía, ejecuta `pnpm infra:reset` seguido de `pnpm infra:up`.

---

## 7. Estrategia de Git y GitHub

### 7.1 Estrategia de Ramas (GitHub Flow Adaptado)

Para un equipo pequeño o desarrollador Full Stack con despliegues controlados, se adopta un flujo basado en **tres ramas permanentes** y ramas efímeras por tarea:

1. **`main` (Protegida):** Código en producción. Solo recibe merges desde `staging` mediante Pull Request aprobado y etiquetado (`v1.0.0`).
2. **`staging` (Protegida):** Rama de preproducción y validación UAT del cliente. Recibe merges desde `develop`.
3. **`develop` (Protegida):** Rama principal de integración continua donde convergen las funcionalidades completadas.
4. **Ramas de trabajo efímeras (creadas desde `develop`):**
   - `feat/<modulo>-<descripcion-corta>` (ej. `feat/rates-legal-usury-validator`)
   - `fix/<modulo>-<descripcion-corta>` (ej. `fix/payments-idempotency-lock`)
   - `docs/<descripcion-corta>` (ej. `docs/update-openapi-contracts`)
   - `chore/<descripcion-corta>` (ej. `chore/docker-compose-minio`)

### 7.2 Convención de Commits (_Conventional Commits_)

Formato obligatorio: `<tipo>(<alcance>): <descripción imperativa en español o inglés técnico>`

- `feat(loans): implementar generación atómica de cuotas tras desembolso`
- `fix(payments): prevenir doble aplicación con bloqueo pesimista`
- `sec(documents): validar magic bytes y expiración de URLs firmadas`
- `test(rates): agregar casos borde para conversión de tasa EA`
- `docs(architecture): actualizar diagrama de secuencia de conciliación`

### 7.3 Reglas de Pull Requests y Protección de Ramas

- Prohibido hacer `git push --force` o commits directos sobre `main`, `staging` y `develop`.
- Todo Pull Request hacia `develop` requiere:
  1. Pipeline CI verde (Lint + Typecheck + Pruebas Unitarias e Integración + Build).
  2. Descripción clara del objetivo, archivos afectados y evidencia de pruebas.
  3. Resolución de conflictos mediante `git rebase develop` o `git merge develop` antes de integrar.

---

## 8. Convenciones de Desarrollo

| Elemento                     | Convención                                                                                 | Ejemplo                                                                                         |
| :--------------------------- | :----------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Archivos y Carpetas**      | `kebab-case` con sufijo de responsabilidad                                                 | `legal-rate-policy.service.ts`, `confirm-payment.dto.ts`                                        |
| **Clases, Interfaces, DTOs** | `PascalCase` (Interfaces sin prefijo `I` salvo puertos hexagonales)                        | `LoanApplicationEntity`, `CreateLoanQuoteDto`                                                   |
| **Variables y Métodos**      | `camelCase` descriptivo                                                                    | `calculatePeriodicRate()`, `outstandingPrincipal`                                               |
| **Constantes y Enums**       | `UPPER_SNAKE_CASE`                                                                         | `MAX_UNREVIEWED_THRESHOLD_COP = 500000`                                                         |
| **Tablas y Columnas SQL**    | `snake_case` plural para tablas, singular para columnas                                    | `payment_allocations.principal_applied`                                                         |
| **Manejo de Errores**        | Excepciones de dominio tipadas mapeadas a respuestas HTTP RFC 7807                         | `{ statusCode: 422, errorCode: "RATE_EXCEEDS_LEGAL_CAP", message: "..." }`                      |
| **Comentarios en Código**    | Explicar el **por qué** de reglas financieras o decisiones arquitectónicas, nunca lo obvio | `// Bloqueo pesimista para evitar condición de carrera si dos admins concilian simultáneamente` |

---

## 9. Estrategia de Pruebas y Criterios de Calidad

| Nivel de Prueba          | Herramientas Sugeridas                   | Alcance Obligatorio en PrestaYA                                                                                                                                  | Criterio de Aceptación                                                       |
| :----------------------- | :--------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **Unitarias**            | Jest / Vitest                            | Motor de tasas, conversión E.A., validación de usura, redondeos COP, asignación de pagos a cuotas, transiciones de estado.                                       | **>= 85 % cobertura** en módulos financieros (`rates`, `loans`, `payments`). |
| **Integración**          | Jest + Supertest + PostgreSQL real       | Transacciones ACID de desembolso y conciliación, restricciones `UNIQUE` de idempotencia, cifrado/hash de perfil, generación de URLs firmadas S3.                 | 100 % de casos críticos ejecutados contra PostgreSQL en CI.                  |
| **Seguridad**            | Supertest + OWASP ZAP / npm audit        | Pruebas negativas: intento de acceso de `USUARIO` a datos de otro usuario (IDOR), intento de acceso sin MFA a rutas admin, carga de archivos maliciosos.         | **0 vulnerabilidades críticas o altas** abiertas.                            |
| **End-to-End (E2E)**     | Playwright (Web) + Detox/Maestro (Móvil) | Flujo completo: Registro -> KYC -> Simulación -> Solicitud -> Aprobación -> Contrato -> Desembolso -> Cuotas -> Reporte Pago -> Conciliación -> Préstamo Pagado. | Flujo E2E exitoso en Web y Móvil antes de liberar a `staging`.               |
| **Carga y Concurrencia** | k6                                       | Simulación de 500 usuarios concurrentes, envíos simultáneos con misma `Idempotency-Key` y conciliaciones concurrentes.                                           | `P95 <= 500 ms` en lecturas y **0 inconsistencias de saldo**.                |

---

## 10. Guía de Inicio Rápido para Desarrolladores

Sigue estos pasos en orden para levantar el entorno completo de **PrestaYA** desde cero:

```bash
# 1. Clonar el repositorio oficial y ubicarse en la rama develop
git clone https://github.com/<organizacion>/prestaya.git
cd prestaya
git checkout develop

# 2. Instalar dependencias de todo el monorepo
pnpm install

# 3. Generar el archivo .env con secretos aleatorios seguros (nunca subir .env a Git)
pnpm secrets:generate

# 4. Levantar servicios de infraestructura en Docker (PostgreSQL, Redis, MinIO, Mailpit)
pnpm infra:up

# 5. Verificar que los contenedores estén saludables (healthy)
pnpm infra:ps

# 6. Ejecutar migraciones de base de datos y cargar datos semilla iniciales (roles y políticas base)
pnpm --filter @prestaya/backend prisma:migrate:dev
pnpm --filter @prestaya/backend prisma:seed

# 7. Iniciar el Backend API en modo desarrollo (http://localhost:3000/api/v1/docs)
pnpm --filter @prestaya/backend start:dev

# 8. En otra terminal, iniciar el Frontend Web (http://localhost:5173)
pnpm --filter @prestaya/web dev

# 9. En otra terminal, iniciar la Aplicación Móvil con Expo (escanear QR o emulador)
pnpm --filter @prestaya/mobile start

# 10. Ejecutar la suite de pruebas automatizadas del backend
pnpm --filter @prestaya/backend test
pnpm --filter @prestaya/backend test:e2e

# 11. Flujo estándar para iniciar una nueva tarea de desarrollo
git checkout develop
git pull origin develop
git checkout -b feat/nombre-del-modulo-tarea

# 12. Verificar linter y compilación antes de confirmar cambios
pnpm lint
pnpm build

# 13. Realizar commit siguiendo Conventional Commits y subir rama para Pull Request
git add .
git commit -m "feat(modulo): descripción clara del cambio implementado"
git push -u origin feat/nombre-del-modulo-tarea
```

