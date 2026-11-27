# DOCUMENTACIÓN TÉCNICA Y ESPECIFICACIÓN DE REQUISITOS (SRS) — PROYECTO PRESTAYA

## 1. Portada y Control Documental

| Atributo | Detalle |
| :--- | :--- |
| **Nombre del Proyecto** | PrestaYA — Plataforma Multiplataforma de Gestión de Préstamos Personales |
| **Código del Documento** | `DOC-PRESTAYA-01` |
| **Versión** | `1.1.0-RC` (Consolidación Arquitectónica y Especificación Técnica) |
| **Fecha de Elaboración** | 27 de noviembre de 2026 |
| **Estado Documental** | En revisión técnica y validación de reglas de negocio / legales |
| **Responsable Técnico** | Equipo Multidisciplinario de Ingeniería de Software / Desarrollador Full Stack |
| **Moneda de Operación** | Pesos Colombianos (`COP`) |
| **Zona Horaria Oficial** | `America/Bogota` (`UTC-5`) |
| **Jurisdicción Objetivo** | República de Colombia |

### Historial de Cambios

| Versión | Fecha | Autor / Rol | Descripción de Cambios | Estado |
| :--- | :--- | :--- | :--- | :--- |
| `1.0` | 26/11/2026 | Desarrollador Full Stack | Elaboración de propuesta técnica, económica y alcance inicial (`Propuesta_PrestaYa_v1.1`). | Base |
| `1.0-ERS` | 26/11/2026 | Arquitectura / Análisis | Especificación inicial de arquitectura, estados, SOLID y cumplimiento legal Colombia. | Complemento |
| `1.1.0-RC` | 27/11/2026 | Equipo Ingeniería Software | Consolidación documental bajo jerarquía oficial, trazabilidad completa de RF/RNF/RN, matriz de riesgos y resolución de conflictos técnicos. | Para Aprobación |

### Tabla de Contenido
1. [Portada y Control Documental](#1-portada-y-control-documental)
2. [Inventario Documental y Análisis de Consistencia](#2-inventario-documental-y-análisis-de-consistencia)
3. [Introducción](#3-introducción)
4. [Objetivos](#4-objetivos)
5. [Alcance del Sistema](#5-alcance-del-sistema)
6. [Descripción Funcional y Técnica de la Solución](#6-descripción-funcional-y-técnica-de-la-solución)
7. [Usuarios, Roles y Matriz de Permisos](#7-usuarios-roles-y-matriz-de-permisos)
8. [Requisitos Funcionales (RF)](#8-requisitos-funcionales-rf)
9. [Requisitos No Funcionales (RNF)](#9-requisitos-no-funcionales-rnf)
10. [Reglas de Negocio (RN) y Marco Legal](#10-reglas-de-negocio-rn-y-marco-legal)
11. [Arquitectura General del Sistema](#11-arquitectura-general-del-sistema)
12. [Seguridad, Privacidad y Cumplimiento Normativo](#12-seguridad-privacidad-y-cumplimiento-normativo)
13. [Estrategia de Desarrollo y Calidad](#13-estrategia-de-desarrollo-y-calidad)
14. [Matriz de Riesgos, Vacíos y Decisiones Pendientes](#14-matriz-de-riesgos-vacíos-y-decisiones-pendientes)

---

## 2. Inventario Documental y Análisis de Consistencia

### 2.1 Inventario de Fuentes Analizadas

| Archivo Fuente | Tipo de Documento | Prioridad | Propósito e Información Relevante | Relación y Hallazgos |
| :--- | :--- | :--- | :--- | :--- |
| `Propuesta_PrestaYa_v1.1.docx` | Propuesta Técnica, Funcional, Económica y Cronograma | **1 (Principal)** | Define alcance MVP, escenarios (Solo Web vs. Multiplataforma), presupuesto en COP, cronograma (18–20 semanas activas), actores, reglas comerciales preliminares, 24 RF, 14 RNF y 10 RN. | Fuente rectora. Nota: En la portada interna indica versión `1.0` aunque el archivo se nombra `v1.1`. |
| `Documento_ERS_Arquitectura_Plataforma_Prestamos_Multiplataforma.docx` | Especificación de Requisitos y Guía de Construcción | **2 (Complementario)** | Amplía detalles de implementación: stack NestJS + Next.js + Expo, patrones SOLID, outbox transaccional, 25 RF (añade `RF-05 Consentimientos` explícito), diagramas Mermaid y referencias normativas de Colombia. | Alta alineación con la propuesta principal. Aporta mayor rigor en patrones de diseño, concurrencia y manejo de archivos. |
| `SRS_Plataforma_Prestamos_Multiplataforma_Colombia.docx` | Especificación de Requisitos de Software (SRS) | **2 (Complementario)** | Detalla estados granulados de solicitud, crédito, comprobante y cuota; esquema relacional con `payment_transactions` e idempotencia; matriz legal colombiana (Ley 1480/2011, Decreto 1368/2014, Circular 002/2023 SIC). | Complementa el modelo de datos y las transiciones de estado. Contiene una guía de prompt operativo inicial. |

### 2.2 Registro de Contradicciones y Resoluciones Técnicas

De acuerdo con la jerarquía documental establecida (`Propuesta_PrestaYa_v1.1` > Documentos complementarios > Recomendaciones técnicas), se documentan las siguientes divergencias detectadas entre las fuentes:

| ID Conflicto | Aspecto | Fuente 1 (`Propuesta_PrestaYa_v1.1`) | Fuentes Complementarias (`ERS` / `SRS`) | Resolución / Recomendación Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **CONF-01** | **Stack Tecnológico Backend y Web** | Propone **Node.js + Express + TypeScript** para backend y **React + TypeScript** para web. | Proponen **NestJS + TypeScript** para backend y **Next.js + TypeScript** (o React/Next.js) para web, y **React Native + Expo** para móvil. | **Recomendación Técnica:** Adoptar **NestJS + TypeScript** en backend (provee inyección de dependencias nativa, arquitectura modular estricta, validación con `class-validator` y soporte OpenAPI integrado) y **React (Vite) o Next.js + TypeScript** en web, junto con **React Native + Expo** en móvil. *Requiere confirmación del desarrollador/propietario antes de inicializar repositorios.* |
| **CONF-02** | **Alcance de Plataforma (Escenario A vs. B)** | Presenta dos escenarios comerciales: Escenario A (Solo Web Responsiva) y Escenario B (Web + Apps Móviles Android/iOS). | Asumen directamente el desarrollo multiplataforma (Web + Android + iOS) con backend compartido. | **Regla Aplicada:** Se documenta la arquitectura bajo el **Escenario B (Multiplataforma: Web + Android + iOS)** conforme al alcance solicitado para PrestaYA, manteniendo desacoplamiento total vía API REST para permitir despliegue web temprano mientras se aprueban tiendas móviles. |
| **CONF-03** | **Granularidad de Estados de Solicitud y Pago** | Define estados simplificados en sección 6.1 (`pendiente`, `en revisión`, `aprobada`, `rechazada`), pero en `RF-010` y `RF-011` exige oferta/contrato antes de desembolso. | Detallan máquinas de estado completas: `BORRADOR -> ENVIADA -> EN_REVISION -> REQUIERE_INFORMACION -> APROBADA -> ACEPTADA -> LISTA_PARA_DESEMBOLSO -> DESEMBOLSADA`. | **Resolución:** Se adopta la máquina de estados completa de los documentos complementarios porque satisface estrictamente las reglas `RF-010`, `RF-011` y `RN-06` de la propuesta principal. |
| **CONF-04** | **Tasas Comerciales vs. Legalidad en Colombia** | El solicitante indicó tasas ilustrativas de `10% semanal`, `15% quincenal` y `20% mensual`, pero el propio documento advierte no activarlas en producción sin revisión legal. | Exigen bloqueo automático en el motor financiero frente al límite de usura certificado por la Superintendencia Financiera de Colombia (`28,34% E.A.` a nov/2026). | **Confirmado:** Las tasas comerciales iniciales quedan **bloqueadas por defecto** en producción. El sistema implementará un motor parametrizable con validación estricta contra topes legales vigentes (`LegalRatePolicy`). |
| **CONF-05** | **Nomenclatura de Tablas en Base de Datos** | Menciona `payout_destinations`, `payments`, `audit_logs`. | `SRS` menciona `payout_methods`, `payment_transactions`, `audit_events`. | **Recomendación Técnica:** Unificar el esquema relacional en inglés estándar (`snake_case` plural) conciliando ambas propuestas (ver Sección 6.3 del Archivo 2). |

---

## 3. Introducción

### 3.1 Contexto del Proyecto
**PrestaYA** es una plataforma tecnológica financiera diseñada para digitalizar, centralizar y controlar el ciclo de vida completo de préstamos personales en Colombia. El proyecto se encuentra en fase de planificación técnica y definición arquitectónica previa al inicio de la construcción del Producto Mínimo Viable (MVP).

### 3.2 Problema que se Busca Resolver
La gestión manual o fragmentada de préstamos personales mediante hojas de cálculo, mensajería instantánea informal y transferencias no trazables genera riesgos operativos y financieros críticos:
* Pérdida o adulteración de soportes de identidad y comprobantes de pago.
* Errores en el cálculo de intereses, fechas de vencimiento, mora y saldos insolutos.
* Duplicidad en el registro de abonos o desembolsos por falta de controles transaccionales.
* Ausencia de trazabilidad (auditoría) sobre quién aprobó, desembolsó o concilió cada operación.
* Riesgo de incumplimiento normativo en materia de tasas de interés máximas permitidas y protección de datos personales (Ley 1581 de 2012).

### 3.3 Justificación y Descripción General de la Solución
PrestaYA centraliza la operación en un **único backend y base de datos relacional**, consumidos de manera coherente por una **aplicación web** (portal de prestatarios y panel administrativo) y **aplicaciones móviles nativas/multiplataforma** para Android e iOS (enfocadas en el recorrido del solicitante).

> **Aviso Legal y Financiero Prioritario:** Este documento constituye una especificación técnica de ingeniería de software y **no representa asesoría jurídica ni habilitación regulatoria** para ejercer actividad financiera o de captación/colocación masiva de recursos. Antes del despliegue a producción, el propietario del proyecto debe validar con asesoría legal y contable colombiana la naturaleza jurídica del prestamista, contratos/pagarés electrónicos, tributación, políticas de tratamiento de datos y tasas aplicables.

---

## 4. Objetivos

### 4.1 Objetivo General
Diseñar y construir una plataforma tecnológica multiplataforma segura, auditada, mantenible y escalable que permita gestionar de extremo a extremo el ciclo de vida de los préstamos personales en Colombia —desde el registro e identificación del solicitante, simulación y solicitud, hasta la evaluación administrativa, formalización contractual, desembolso efectivo, seguimiento de cuotas y conciliación de pagos— garantizando la integridad financiera y la consistencia de datos entre Web, Android e iOS.

### 4.2 Objetivos Específicos
1. **Control de Identidad y Acceso:** Implementar registro, verificación de contacto, autenticación segura y control de acceso basado en roles (`USUARIO` y `ADMINISTRADOR`) validado en servidor.
2. **Expediente Digital y KYC Básico:** Permitir a los solicitantes completar su perfil demográfico, registrar medios de desembolso (cuenta bancaria, llave interoperable, Nequi, Daviplata) y cargar documentación privada con control de acceso temporal.
3. **Motor Financiero Parametrizable:** Desarrollar un simulador y motor de cálculo exacto (aritmética decimal) con versionado de tarifas, conversión de tasas y bloqueo automático ante límites legales configurados.
4. **Flujo de Aprobación Supervisado:** Garantizar que el 100 % de las solicitudes pasen por revisión y decisión administrativa explícita con trazabilidad inmutable.
5. **Gestión de Desembolsos y Calendario:** Generar el préstamo activo y su plan definitivo de amortización/cuotas únicamente tras la aceptación contractual y confirmación del desembolso real.
6. **Conciliación Idempotente de Pagos:** Permitir el reporte de comprobantes por parte del prestatario y su verificación/conciliación atómica por el administrador, evitando doble contabilización.
7. **Seguimiento de Cartera y Notificaciones:** Automatizar alertas de vencimiento, cálculo de estados de cartera y notificaciones multicanal respetando ventanas legales de contacto.
8. **Analítica Operativa y Auditoría:** Proveer al administrador herramientas de búsqueda paginada, indicadores financieros (KPIs), exportación controlada y bitácora de auditoría.

### 4.3 Resultados Esperados
* Ecosistema funcional compuesto por API REST centralizada, Base de Datos PostgreSQL, Portal Web (Usuario + Admin) y Apps Móviles (Android/iOS).
* Cero inconsistencias de saldos entre plataformas gracias a una única fuente de verdad transaccional.
* Trazabilidad reconstruible al 100 % de todas las decisiones financieras y cambios de estado.

---

## 5. Alcance del Sistema

### 5.1 Alcance Funcional (MVP)
El alcance del MVP cubre el flujo operativo completo dividido en dos experiencias:

* **Experiencia del Prestatario (`USUARIO` — Web Responsiva, Android e iOS):**
  * Registro de cuenta, verificación, inicio/cierre de sesión y recuperación de credenciales.
  * Gestión de perfil personal, dirección, aceptación explícita de consentimientos legales y configuración de medio de desembolso.
  * Carga de documento de identidad y soporte de domicilio (imagen o PDF) y consulta del estado de verificación.
  * Simulación financiera transparente (monto, periodicidad, plazo, cuotas, fechas, intereses y tasa efectiva anual).
  * Radicación de solicitudes de préstamo y consulta en tiempo real de su estado y observaciones.
  * Visualización y aceptación electrónica de oferta y contrato/pagaré tras aprobación.
  * Consulta de préstamos activos, saldo pendiente, calendario de cuotas y días de mora.
  * Reporte de pagos mediante carga de comprobante digital y descarga de recibos confirmados.
  * Bandeja de notificaciones internas, avisos push/correo y canal de atención/reclamos (PQR).

* **Experiencia Administrativa (`ADMINISTRADOR` — Panel Web):**
  * Dashboard operativo con indicadores de solicitudes, colocación, cartera vigente/vencida, pagos pendientes y recaudo.
  * Bandeja de solicitudes con búsqueda avanzada y filtros combinables.
  * Revisión integral de expedientes (datos KYC, documentos privados, historial crediticio interno) y registro de decisión (aprobar, rechazar con motivo o solicitar información adicional).
  * Registro y confirmación de desembolsos realizados externamente (transferencia bancaria o billetera digital) con soporte.
  * Bandeja de conciliación de pagos reportados (confirmar abono, rechazar o solicitar aclaración).
  * Gestión de cartera, seguimiento de cuotas vencidas, administración de usuarios (bloqueo/desbloqueo) y notas internas.
  * Configuración versionada de parámetros financieros (tasas, límites, plazos, días de gracia) y exportación controlada de reportes.
  * Consulta de bitácora de auditoría.

### 5.2 Alcance Técnico
* Backend modular con API REST versionada (`/api/v1`) documentada mediante OpenAPI/Swagger.
* Persistencia relacional transaccional en PostgreSQL con soporte ACID y precisión decimal exacta.
* Almacenamiento privado de objetos compatible con Amazon S3 (acceso exclusivo vía URLs firmadas temporales).
* Procesamiento asíncrono mediante colas de mensajes y workers para notificaciones, recordatorios programados y tareas pesadas.
* Contenerización con Docker y flujos de CI/CD en GitHub Actions.

### 5.3 Plataformas Objetivo
1. **Aplicación Web Responsiva:** Navegadores modernos de escritorio y móviles (Chrome, Edge, Safari, Firefox). Alberga tanto el Portal de Usuario como el Panel Administrativo.
2. **Aplicación Móvil Android:** Dispositivos Android compatibles con el SDK objetivo de React Native/Expo (enfocada en el flujo del prestatario).
3. **Aplicación Móvil iOS:** Dispositivos iPhone compatibles con iOS soportado por React Native/Expo (enfocada en el flujo del prestatario).

### 5.4 Funcionalidades Excluidas del MVP (Fuera de Alcance)
De conformidad con la documentación analizada, quedan explícitamente excluidas de esta fase:
1. **Aprobación o rechazo automático mediante scoring algorítmico sin intervención humana.**
2. **Dispersión o desembolso automático de dinero mediante APIs bancarias, ACH, PSE, Nequi o Daviplata** (las transferencias se ejecutan manualmente por el administrador fuera de la plataforma y se registran con comprobante).
3. **Conciliación bancaria automática vía webhooks o lectura directa de extractos bancarios.**
4. **Reporte automático a centrales de riesgo crediticio** (Datacrédito, TransUnion) sin definición jurídica y habilitación contractual expresa.
5. **Firma electrónica certificada por entidad de certificación digital abierta (ECD)** (se utilizará aceptación electrónica verificable con hash de integridad, sello temporal, IP y OTP/credenciales, sujeto a validación jurídica).
6. **Cobro jurídico automatizado, cesión o venta de cartera a terceros, y modelo multi-prestamista (marketplace).**
7. **Funcionalidades administrativas avanzadas dentro de las apps móviles** (la gestión administrativa reside en el Panel Web).

### 5.5 Restricciones Conocidas
* **Restricción Regulatoria Financiera:** Prohibido habilitar en producción las tasas ilustrativas iniciales (`10% semanal`, `15% quincenal`, `20% mensual`) sin aprobación escrita del propietario y validación legal frente a la tasa de usura vigente certificada por la Superintendencia Financiera de Colombia.
* **Restricción de Tiendas Móviles:** La publicación en Google Play Store y Apple App Store depende de la creación de cuentas de desarrollador por parte del cliente, políticas de aplicaciones financieras de Google/Apple y tiempos de revisión externos.
* **Restricción de Disponibilidad:** El desarrollo está dimensionado para un desarrollador Full Stack (18–20 semanas activas / 21–24 semanas calendario para escenario multiplataforma), sujeto a tiempos de respuesta del cliente (3–5 días hábiles por entrega).

---

## 6. Descripción Funcional y Técnica de la Solución

PrestaYA opera bajo un modelo cliente-servidor desacoplado con una **única fuente de verdad**:

```text
[Portal Web Usuario] ──┐
[Panel Web Admin]    ──┼──► HTTPS (JSON / JWT) ──► [API Backend Central] ──┬──► [PostgreSQL (ACID)]
[App Móvil Android]  ──┤                                                   ├──► [Storage Privado S3]
[App Móvil iOS]      ──┘                                                   └──► [Redis / Colas / Workers] ──► [Email / Push / SMS]
```

1. **Clientes (Web y Móvil):** No contienen lógica financiera crítica ni reglas de aprobación. Actúan como capas de presentación, validación preliminar de formularios y consumo de endpoints REST. La lógica de cálculo de cuotas, validación de tasas y transiciones de estado reside exclusivamente en el backend.
2. **Backend Central (API REST):** Expone contratos unificados bajo `/api/v1`. Aplica autenticación JWT, autorización RBAC, validación de propiedad de recursos (anti-IDOR), idempotencia mediante llaves únicas (`Idempotency-Key`) y transacciones ACID.
3. **Base de Datos Relacional (PostgreSQL):** Almacena entidades de negocio, saldos en formato `NUMERIC(18,2)`, historial de estados y bitácora inmutable de auditoría (`audit_logs`).
4. **Almacenamiento Privado (S3 Compatible):** Almacena documentos de identidad, recibos públicos, contratos PDF y comprobantes de pago/desembolso en buckets privados sin acceso público directo.
5. **Workers Asíncronos:** Procesan el patrón *Transactional Outbox* para envío confiable de notificaciones, ejecución de tareas programadas (recordatorios de vencimiento y cálculo diario de mora en zona `America/Bogota`) y generación de reportes.

---

## 7. Usuarios, Roles y Matriz de Permisos

### 7.1 Perfiles Identificados
En los documentos fuente se confirman **dos roles humanos** y **un actor de sistema**:

1. **Prestatario (`USUARIO`):** Persona natural registrada en la plataforma que solicita préstamos personales, aporta documentación de soporte y reporta pagos.
2. **Administrador (`ADMINISTRADOR`):** Personal autorizado de PrestaYA encargado de evaluar solicitudes, aprobar/rechazar operaciones, registrar desembolsos, conciliar pagos, administrar cartera y parametrizar el sistema.
3. **Sistema (`SISTEMA` — Actor Automatizado):** Procesos internos y tareas programadas (jobs) que calculan calendarios, actualizan indicadores de vencimiento/mora por reglas aprobadas, despachan notificaciones y registran auditoría. **No tiene facultad para aprobar solicitudes ni confirmar pagos.**

> **Nota sobre Roles Recomendados (No aprobados aún):** En caso de crecimiento operativo, se recomienda evaluar a futuro la segregación del rol `ADMINISTRADOR` en sub-perfiles como `ANALISTA_CREDITO` (evalúa pero no desembolsa), `TESORERO` (registra desembolsos y concilia pagos) y `SUPER_ADMIN` (configura tasas y parámetros). Para el MVP se mantiene el modelo binario `USUARIO` / `ADMINISTRADOR` definido en `Propuesta_PrestaYa_v1.1`.

### 7.2 Matriz de Permisos (Control RBAC en Servidor)

| Módulo / Acción | `USUARIO` (Prestatario) | `ADMINISTRADOR` | `SISTEMA` (Jobs) | Restricción / Regla de Control |
| :--- | :---: | :---: | :---: | :--- |
| Registrarse e iniciar sesión | Sí | Sí | No | Admin requiere MFA obligatorio. |
| Ver / editar perfil propio y destino desembolso | Sí | Sí (propio) | No | Validación de ownership (`user_id == auth.id`). |
| Cargar documentos de identidad / domicilio | Sí (propios) | No (solo lectura) | Escaneo MIME/AV | Acceso vía URL firmada temporal. |
| Visualizar documentos de usuarios | Sí (propios) | Sí (con auditoría) | No | Cada visualización admin genera registro en `audit_logs`. |
| Simular condiciones de préstamo | Sí | Sí | Calcula | Sujeto a `LegalRatePolicy` vigente. |
| Crear y enviar solicitud de préstamo | Sí | No | Valida | Idempotencia por clave única; 100% requiere revisión. |
| Consultar solicitudes | Solo propias | Todas (paginado) | No | Prohibido acceso cruzado entre usuarios (anti-IDOR). |
| Aprobar / rechazar / pedir info en solicitud | No | Sí | No | Requiere motivo y registro en `application_events`. |
| Aceptar oferta y contrato electrónico | Sí (propias) | No | Genera PDF/Hash | Prerrequisito antes del desembolso. |
| Registrar desembolso efectivo | No | Sí | No | Requiere solicitud aprobada + contrato aceptado. |
| Generar calendario definitivo de cuotas | No | Dispara acción | Sí (automático) | Solo tras confirmación de desembolso. |
| Consultar préstamos, cuotas y saldos | Solo propios | Todos (paginado) | Actualiza mora | Moneda COP `NUMERIC(18,2)`. |
| Reportar pago con comprobante | Sí (propios) | No | Registra `EN_REVISION` | Nunca descuenta saldo automáticamente. |
| Confirmar / rechazar pago (Conciliación) | No | Sí | Aplica saldo | Transacción ACID + `Idempotency-Key`. |
| Gestionar usuarios (bloquear/desbloquear) | No | Sí | No | Prohibido eliminar historial financiero. |
| Configurar tasas, plazos y reglas | No | Sí | Valida topes | Cambios versionados con fecha de vigencia y auditoría. |
| Consultar dashboard y exportar reportes | No | Sí | Genera reporte | Exportes con minimización de datos y registro de descarga. |
| Consultar bitácora de auditoría | Timeline propio | Auditoría completa | Escribe eventos | Bitácora *append-only* (inmutable). |

---

## 8. Requisitos Funcionales (RF)

A continuación se consolidan y estandarizan los **25 Requisitos Funcionales** derivados de `Propuesta_PrestaYa_v1.1` (`RF-001` a `RF-024`) y complementados con `RF-005` de `Documento_ERS` (Consentimientos explícitos).

### Módulo 1: Autenticación, Perfil y KYC

#### `RF-001` — Registro y Autenticación de Usuarios
* **Descripción:** Permitir a nuevos usuarios crear una cuenta mediante correo electrónico y/o teléfono celular verificable y contraseña robusta, así como iniciar sesión, renovar tokens y recuperar acceso de forma segura.
* **Actor Responsable:** `USUARIO`, `ADMINISTRADOR`.
* **Condiciones Previas:** El correo electrónico y teléfono no deben existir previamente en el sistema.
* **Flujo Principal:**
  1. El usuario ingresa correo, teléfono, contraseña y acepta política de privacidad básica.
  2. El backend valida formato, fortaleza de contraseña y unicidad; almacena hash (`Argon2id` o `bcrypt`).
  3. El sistema envía código de verificación (OTP) y activa la cuenta tras validación.
  4. Al iniciar sesión, el backend emite `Access Token` JWT de corta duración y `Refresh Token` rotativo. Para `ADMINISTRADOR` exige segundo factor (MFA).
* **Resultado Esperado:** Cuenta creada y sesión autenticada con rol asignado en el servidor.
* **Reglas Relacionadas:** `RNF-05`, `RN-10`.
* **Criterios de Aceptación:**
  * Rechaza registros con correo/teléfono duplicado sin enumerar cuentas existentes de forma insegura.
  * Bloquea temporalmente intentos fallidos consecutivos (rate limiting).
  * El rol nunca puede ser enviado ni alterado por el cliente en el payload de registro.

#### `RF-002` — Gestión de Perfil e Identificación (KYC Básico)
* **Descripción:** Capturar y validar los datos personales y de ubicación del prestatario requeridos para el estudio de crédito y formalización contractual.
* **Actor Responsable:** `USUARIO` (edición), `ADMINISTRADOR` (consulta y actualización autorizada).
* **Condiciones Previas:** Usuario autenticado con cuenta activa.
* **Flujo Principal:**
  1. El usuario completa nombres, apellidos, tipo de documento (`CC`, `CE`, `PPT`), número de documento, fecha de expedición, teléfono, dirección de residencia y municipio/departamento.
  2. El backend valida formatos, unicidad del número de documento (mediante índice hash criptográfico) y cifra el número de documento en reposo.
  3. El perfil queda marcado como completo para habilitar solicitudes.
* **Resultado Esperado:** Perfil personal almacenado de forma segura e íntegra.
* **Reglas Relacionadas:** `RN-10`, `RNF-06`.
* **Criterios de Aceptación:**
  * Impide registrar dos cuentas distintas con el mismo número de documento de identidad.
  * El número de documento se muestra parcialmente enmascarado en listados generales.

#### `RF-003` — Carga y Administración Privada de Documentos
* **Descripción:** Permitir al usuario cargar soportes obligatorios (foto/PDF del documento de identidad por ambas caras y recibo de servicio público para validar dirección) y consultar su estado de revisión.
* **Actor Responsable:** `USUARIO` (carga), `ADMINISTRADOR` (revisión).
* **Condiciones Previas:** Usuario autenticado.
* **Flujo Principal:**
  1. El cliente solicita autorización de carga o envía archivo (`PDF`, `JPG`, `PNG`).
  2. El backend valida extensión, *magic bytes* (MIME real), tamaño máximo permitido y ejecuta escaneo antivirus/malware.
  3. El archivo se almacena en Object Storage privado (S3) con clave no predecible y metadatos en PostgreSQL (`checksum SHA-256`, versión, estado `PENDIENTE`).
  4. Para visualización, el backend genera una URL firmada temporal de corta duración (ej. 5–15 minutos) previa validación de permisos.
* **Resultado Esperado:** Documentos almacenados de forma privada, versionados y accesibles únicamente por su titular y administradores autorizados.
* **Reglas Relacionadas:** `RN-10`, `RNF-05`.
* **Criterios de Aceptación:**
  * Rechaza archivos ejecutables o con extensión alterada.
  * Ningún documento es accesible mediante una URL pública permanente.
  * Cada descarga por un administrador queda registrada en `audit_logs`.

#### `RF-004` — Gestión de Cuenta o Llave Destino de Desembolso
* **Descripción:** Permitir al prestatario registrar y actualizar el canal financiero donde recibirá los fondos aprobados (cuenta bancaria tradicional, llave interoperable Bre-B, Nequi o Daviplata).
* **Actor Responsable:** `USUARIO`.
* **Condiciones Previas:** Perfil KYC completado (`RF-002`).
* **Flujo Principal:**
  1. El usuario selecciona tipo de destino, entidad financiera, nombre del titular y número de cuenta/celular/llave.
  2. El sistema valida coherencia entre el titular registrado y el nombre del usuario autenticado.
  3. Almacena el identificador cifrado y una versión enmascarada (ej. `****4589`) para visualización.
* **Resultado Esperado:** Medio de desembolso verificado y disponible para asociar a solicitudes.
* **Reglas Relacionadas:** `RN-10`.
* **Criterios de Aceptación:**
  * Nunca se solicitan contraseñas bancarias, PIN ni códigos CVV.
  * Solo puede existir un destino activo principal por defecto, manteniendo historial de cambios.

#### `RF-005` — Gestión de Consentimientos Legales Versionados
* **Descripción:** Registrar de manera separada, explícita y verificable la aceptación de políticas de privacidad, autorización de tratamiento de datos personales (Ley 1581 de 2012) y términos de uso.
* **Actor Responsable:** `USUARIO`.
* **Condiciones Previas:** Existencia de versiones activas de textos legales en configuración.
* **Flujo Principal:**
  1. Antes de registrar datos sensibles o enviar una solicitud, el usuario visualiza los textos legales vigentes.
  2. Marca casillas independientes por cada finalidad legal.
  3. El sistema registra usuario, propósito, versión del documento, marca temporal UTC, dirección IP y agente de usuario.
* **Resultado Esperado:** Evidencia inmutable de consentimiento informada y trazable.
* **Reglas Relacionadas:** `RNF-06`, `RNF-12`.
* **Criterios de Aceptación:**
  * Impide avanzar en la solicitud si falta algún consentimiento obligatorio vigente.
  * Si el administrador actualiza la versión de la política, el sistema solicita nueva aceptación en la siguiente operación.

---

### Módulo 2: Simulación y Solicitudes de Préstamo

#### `RF-006` — Simulador Financiero de Préstamos
* **Descripción:** Permitir calcular de manera transparente las condiciones estimadas de un préstamo a partir del monto solicitado, frecuencia de pago (semanal, quincenal, mensual) y número de cuotas/plazo.
* **Actor Responsable:** `USUARIO`, `ADMINISTRADOR`.
* **Condiciones Previas:** Existencia de una política de tasas vigente y legalmente habilitada (`RF-007`).
* **Flujo Principal:**
  1. El usuario ingresa capital deseado (`COP`), periodicidad y número de cuotas.
  2. El motor financiero del backend consulta la tarifa vigente, calcula la tasa periódica equivalente, interés total, valor de cada cuota, fechas estimadas de vencimiento (en `America/Bogota`) y Tasa Efectiva Anual (`E.A.`).
  3. El sistema verifica que la tasa resultante no supere el límite legal configurado (`LegalRatePolicy`).
  4. Genera una cotización (`loan_quote`) con identificador único, versión de algoritmo/tarifa y tiempo de expiración.
* **Resultado Esperado:** Desglose financiero exacto e informativo entregado al usuario.
* **Reglas Relacionadas:** `RN-03`, `RN-04`, `RN-09`.
* **Criterios de Aceptación:**
  * Si la configuración excede el tope legal configurado, el sistema bloquea el cálculo y no emite cotización.
  * Todos los cálculos utilizan aritmética decimal exacta (`NUMERIC`), sin errores de punto flotante.

#### `RF-007` — Administración de Tarifas y Políticas Financieras
* **Descripción:** Permitir al administrador parametrizar tasas nominales/efectivas, topes legales de usura vigentes, montos mínimos/máximos y plazos permitidos por periodicidad, mediante versiones con vigencia temporal.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Autenticación administrativa con MFA.
* **Flujo Principal:**
  1. El administrador crea una nueva versión de política de tasas indicando modalidad, tasa E.A., tope legal de referencia, fuente regulatoria (ej. certificación Superfinanciera) y fecha de inicio de vigencia.
  2. El sistema valida que `tasa_aplicada <= tope_legal` y registra la versión como inmutable una vez activada.
* **Resultado Esperado:** Parámetros financieros gobernados, versionados y auditados.
* **Reglas Relacionadas:** `RN-04`, `RN-08`.
* **Criterios de Aceptación:**
  * Las tasas comerciales ilustrativas iniciales (`10% semanal`, `15% quincenal`, `20% mensual`) están bloqueadas por defecto y requieren validación jurídica explícita antes de activarse.
  * Modificar una tarifa no altera préstamos ya formalizados ni cotizaciones vigentes congeladas.

#### `RF-008` — Creación y Radicación de Solicitud de Préstamo
* **Descripción:** Permitir al usuario formalizar una solicitud de préstamo vinculada a una cotización válida, su perfil KYC, documentos cargados y cuenta destino.
* **Actor Responsable:** `USUARIO`.
* **Condiciones Previas:** Perfil KYC completo (`RF-002`), documentos mínimos cargados (`RF-003`), destino de desembolso activo (`RF-004`), consentimientos vigentes (`RF-005`) y cotización no expirada (`RF-006`).
* **Flujo Principal:**
  1. El usuario confirma monto, frecuencia, plazo, destino de desembolso y declaración de veracidad.
  2. El cliente envía la petición incluyendo un encabezado `Idempotency-Key`.
  3. El backend valida precondiciones, congela una instantánea (`snapshot`) de la cotización y crea la solicitud en estado `ENVIADA` (y transición inmediata a `EN_REVISION`).
  4. Emite número de radicado único y dispara notificación al administrador vía *Outbox*.
* **Resultado Esperado:** Solicitud radicada sin duplicidad y en cola de evaluación administrativa.
* **Reglas Relacionadas:** `RN-01`, `RN-02`, `RN-03`, `RN-08`.
* **Criterios de Aceptación:**
  * Reintentos de red con la misma `Idempotency-Key` devuelven la solicitud ya creada sin duplicarla.
  * El usuario recibe comprobante/radicado con fecha y hora oficial de Colombia.

#### `RF-009` — Umbral de Revisión y Supervisión Administrativa
* **Descripción:** Garantizar que el 100 % de las solicitudes pasen por evaluación manual del administrador, aplicando señalización explícita y prioridad/autorización reforzada cuando el monto supere `COP $500.000`.
* **Actor Responsable:** `SISTEMA`, `ADMINISTRADOR`.
* **Condiciones Previas:** Solicitud radicada (`RF-008`).
* **Flujo Principal:**
  1. Al radicar una solicitud, el sistema evalúa el monto solicitado.
  2. Si `monto > 500000` (umbral configurable), el sistema etiqueta la solicitud con alerta de revisión prioritaria y muestra al usuario el mensaje: *"Pendiente de evaluación y autorización del administrador"*.
  3. Ninguna solicitud (ni siquiera `<= COP $500.000`) puede pasar a `APROBADA` sin acción humana registrada.
* **Resultado Esperado:** Control preventivo contra aprobaciones automáticas no supervisadas.
* **Reglas Relacionadas:** `RN-01`, `RN-02`.
* **Criterios de Aceptación:**
  * No existe ningún endpoint o job que cambie una solicitud a `APROBADA` sin un `actor_id` con rol `ADMINISTRADOR`.

---

### Módulo 3: Evaluación, Contratación y Desembolso

#### `RF-010` — Cola de Revisión y Expediente Administrativo
* **Descripción:** Proveer al administrador una bandeja de trabajo paginada con filtros combinables y vista integral del expediente del solicitante.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Rol `ADMINISTRADOR` autenticado.
* **Flujo Principal:**
  1. El administrador filtra solicitudes por estado, rango de fechas, rango de montos, documento, nombre o alerta de umbral.
  2. Al abrir un expediente, visualiza datos personales, historial previo de préstamos/pagos en PrestaYA, documentos adjuntos (vía URLs firmadas), destino de desembolso y simulación solicitada.
  3. Puede registrar notas internas visibles solo para administradores.
* **Resultado Esperado:** Evaluación informada y centralizada del solicitante.
* **Reglas Relacionadas:** `RN-01`, `RN-10`.
* **Criterios de Aceptación:**
  * Paginación ejecutada en servidor (`server-side`) cumpliendo tiempos de respuesta `P95 <= 500 ms`.

#### `RF-011` — Decisión Administrativa (Aprobar, Rechazar o Solicitar Información)
* **Descripción:** Permitir al administrador emitir una decisión formal sobre una solicitud en revisión, registrando justificación y notificando al usuario.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Solicitud en estado `EN_REVISION` y documentos requeridos revisados.
* **Flujo Principal:**
  1. El administrador selecciona una de tres acciones:
     * **Aprobar:** Puede confirmar las condiciones solicitadas o ajustar monto/plazo dentro de límites legales; el sistema congela la oferta final y cambia estado a `APROBADA`.
     * **Rechazar:** Selecciona código de motivo estandarizado y observación respetuosa (no discriminatoria); cambia estado a `RECHAZADA`.
     * **Solicitar Información:** Indica qué documento o dato debe subsanar el usuario; cambia estado a `REQUIERE_INFORMACION`.
  2. El sistema guarda el cambio en transacción ACID, registra evento en `application_events` y `audit_logs`, y envía notificación al usuario.
* **Resultado Esperado:** Decisión formalizada, inmutable y notificada.
* **Reglas Relacionadas:** `RN-01`, `RN-03`, `RN-08`.
* **Criterios de Aceptación:**
  * Imposible aprobar o rechazar sin ingresar motivo/justificación.
  * Una solicitud rechazada no puede ser desembolsada.

#### `RF-012` — Generación y Aceptación Electrónica de Oferta y Contrato
* **Descripción:** Generar el documento contractual (condiciones finales, tabla de amortización proyectada, pagaré/contrato según plantilla aprobada) al aprobar una solicitud y capturar la aceptación verificable del prestatario antes del desembolso.
* **Actor Responsable:** `SISTEMA` (generación), `USUARIO` (aceptación).
* **Condiciones Previas:** Solicitud en estado `APROBADA`.
* **Flujo Principal:**
  1. Tras la aprobación, el sistema genera el documento de oferta/contrato congelando tasa, capital, cuotas, fechas tentativas y reglas de mora.
  2. El usuario revisa la oferta en Web o App Móvil y la acepta explícitamente (con confirmación de identidad/OTP o contraseña).
  3. El sistema genera el PDF final, calcula su huella criptográfica (`SHA-256`), lo almacena en S3 privado y cambia la solicitud a `ACEPTADA` / `LISTA_PARA_DESEMBOLSO`.
* **Resultado Esperado:** Vínculo contractual formalizado e inmutable previo a la entrega del dinero.
* **Reglas Relacionadas:** `RN-06`, `RNF-12`.
* **Criterios de Aceptación:**
  * La oferta tiene un plazo de vigencia configurable; si expira sin aceptación, pasa a `EXPIRADA`.
  * El hash del documento aceptado permite verificar integridad ante cualquier auditoría o disputa.

#### `RF-013` — Registro y Confirmación de Desembolso Efectivo
* **Descripción:** Permitir al administrador registrar la transferencia real de fondos al destino del usuario y activar oficialmente el préstamo y su calendario definitivo de pagos.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Solicitud en estado `LISTA_PARA_DESEMBOLSO` (aprobada y con contrato aceptado).
* **Flujo Principal:**
  1. El administrador realiza la transferencia bancaria o por billetera digital fuera de la plataforma.
  2. En el panel administrativo registra fecha/hora real del desembolso, monto neto entregado, canal utilizado, número de referencia bancaria y adjunta comprobante de transferencia.
  3. En una única transacción ACID (con `Idempotency-Key`):
     * Crea el registro en `disbursements`.
     * Crea el préstamo activo en `loans` (`estado = ACTIVO`).
     * Genera las cuotas definitivas en `installments` calculando vencimientos exactos a partir de la fecha real de desembolso.
     * Actualiza la solicitud a `DESEMBOLSADA` y registra auditoría.
  4. Notifica al usuario la activación del crédito y su calendario.
* **Resultado Esperado:** Préstamo activo y cronograma de pagos generado de forma atómica sin riesgo de duplicidad.
* **Reglas Relacionadas:** `RN-06`, `RN-08`, `RN-09`.
* **Criterios de Aceptación:**
  * El sistema bloquea cualquier intento de desembolsar una solicitud que no esté en estado `LISTA_PARA_DESEMBOLSO`.
  * Un reintento con la misma `Idempotency-Key` no genera un segundo préstamo ni cuotas duplicadas.

---

### Módulo 4: Cartera, Cuotas y Conciliación de Pagos

#### `RF-014` — Consulta de Préstamo, Saldo y Calendario de Cuotas
* **Descripción:** Permitir al prestatario y al administrador visualizar el detalle completo de cada préstamo: capital inicial, saldo insoluto, interés causado, pagos aplicados, próxima fecha de vencimiento, días de mora y estado de cada cuota.
* **Actor Responsable:** `USUARIO` (propios), `ADMINISTRADOR` (todos).
* **Condiciones Previas:** Préstamo en estado `ACTIVO` o `PAGADO`.
* **Flujo Principal:**
  1. El usuario accede a la sección "Mis Préstamos" en Web o App Móvil.
  2. Consulta el resumen financiero y el desglose cuota por cuota (número, fecha de vencimiento, capital, interés, valor total, valor pagado y estado).
* **Resultado Esperado:** Información financiera clara, consistente entre Web y Móvil, y actualizada en tiempo real tras cada conciliación.
* **Reglas Relacionadas:** `RN-05`, `RN-09`.
* **Criterios de Aceptación:**
  * Las fechas se presentan consistentemente en zona horaria `America/Bogota`.

#### `RF-015` — Reporte de Pago con Comprobante por el Prestatario
* **Descripción:** Permitir al prestatario informar un pago realizado (total, por cuota o abono parcial según política) adjuntando el comprobante digital de la transferencia o consignación.
* **Actor Responsable:** `USUARIO`.
* **Condiciones Previas:** Préstamo activo con saldo pendiente mayor a cero.
* **Flujo Principal:**
  1. El usuario selecciona el préstamo (y opcionalmente la cuota), ingresa el monto pagado, fecha de pago, canal y referencia de transacción, y adjunta imagen o PDF del soporte.
  2. El backend valida el archivo, lo guarda en S3 privado y crea un registro en `payment_submissions` con estado `EN_REVISION`.
  3. **El saldo del préstamo NO se modifica en este paso.**
  4. Se emite notificación al administrador para su verificación.
* **Resultado Esperado:** Reporte de pago radicado en cola de conciliación administrativa.
* **Reglas Relacionadas:** `RN-07`, `RN-09`.
* **Criterios de Aceptación:**
  * Cargar un comprobante nunca reduce el saldo pendiente ni marca cuotas como pagadas antes de la aprobación administrativa.

#### `RF-016` — Conciliación y Validación Administrativa de Pagos
* **Descripción:** Permitir al administrador verificar el comprobante reportado contra sus extractos bancarios y confirmar el pago, rechazarlo o solicitar aclaración.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Registro de pago en estado `EN_REVISION`.
* **Flujo Principal:**
  1. El administrador revisa el comprobante (URL firmada), referencia y valor declarado.
  2. Si confirma el pago, ingresa monto efectivamente recibido, fecha efectiva y referencia bancaria.
  3. En una transacción ACID con bloqueo pesimista (`SELECT FOR UPDATE`) sobre el préstamo y sus cuotas:
     * Crea el asiento definitivo en `payments` / `payment_transactions` (con `Idempotency-Key`).
     * Aplica el monto a las cuotas correspondientes siguiendo el orden de prelación aprobado (`payment_allocations`: gastos/mora autorizados -> interés causado -> capital).
     * Actualiza `amount_paid` y estado de cada cuota (`PAGADA_PARCIAL` o `PAGADA`).
     * Recalcula el saldo insoluto del préstamo; si llega a `0.00`, cambia estado del préstamo a `PAGADO`.
     * Registra evento inmutable en `audit_logs`.
  4. Si rechaza o pide aclaración, registra motivo y cambia estado del reporte a `RECHAZADO` o `ACLARACION_SOLICITADA`.
  5. Notifica el resultado y envía recibo digital al usuario.
* **Resultado Esperado:** Contabilización exacta, atómica, auditable e idempotente de los recaudos.
* **Reglas Relacionadas:** `RN-05`, `RN-07`, `RN-08`, `RN-09`.
* **Criterios de Aceptación:**
  * Dos administradores intentando conciliar simultáneamente el mismo comprobante no pueden generar doble abono.
  * El historial de pagos confirmados nunca puede ser borrado; cualquier corrección posterior requiere un asiento de reverso auditado.

#### `RF-017` — Cálculo de Mora y Estados de Cartera
* **Descripción:** Actualizar periódicamente el estado operativo de las cuotas y la clasificación de cartera del préstamo según las fechas de vencimiento, días de gracia y reglas financieras aprobadas.
* **Actor Responsable:** `SISTEMA` (Job programado diario), `ADMINISTRADOR` (supervisión).
* **Condiciones Previas:** Préstamos activos con cuotas pendientes.
* **Flujo Principal:**
  1. Un proceso programado diario (ejecutado a las `00:05 America/Bogota`) evalúa cuotas no pagadas.
  2. Clasifica el estado de cartera calculado: `AL_DIA`, `PROXIMO_A_VENCER` (ej. dentro de los próximos 3 días configurables), `EN_MORA` (superados los días de gracia) o `PAGADO`.
  3. Calcula intereses moratorios únicamente si existe regla legal y contractual habilitada para dicha obligación, sin capitalizar intereses (`RN-05`) y respetando el tope legal vigente (`RN-04`).
  4. El estado `REPORTADO` permanece deshabilitado por defecto y solo puede activarse bajo flujo legal formal y autorización expresa.
* **Resultado Esperado:** Clasificación precisa y diaria del estado de cartera sin afectar el estado de acceso de la cuenta del usuario.
* **Reglas Relacionadas:** `RN-04`, `RN-05`, `RN-08`.
* **Criterios de Aceptación:**
  * El estado de cartera (`EN_MORA`) se mantiene separado del estado de identidad del usuario (`ACTIVO` / `BLOQUEADO`).

---

### Módulo 5: Notificaciones, Analítica, Soporte y Configuración

#### `RF-018` — Sistema de Notificaciones Multicanal y Bandeja Interna
* **Descripción:** Informar oportunamente a usuarios y administradores sobre eventos relevantes del ciclo de vida del crédito mediante bandeja interna (*in-app*), notificaciones push (FCM/APNs) y correo electrónico (y SMS/WhatsApp opcional si se contrata proveedor y existe consentimiento).
* **Actor Responsable:** `SISTEMA` (despacho vía Outbox).
* **Condiciones Previas:** Evento de negocio persistido y consentimiento de canal vigente.
* **Flujo Principal:**
  1. Cada transición crítica escribe un mensaje en la tabla `outbox_events` dentro de la misma transacción de negocio.
  2. El worker asíncrono consume el evento, verifica deduplicación (`dedupe_key`) y envía la notificación por los canales configurados.
  3. Registra estado de entrega (`ENVIADA`, `FALLIDA`, `LEIDA`).
* **Resultado Esperado:** Comunicación confiable y desacoplada (un fallo de proveedor externo no revierte operaciones financieras).
* **Reglas Relacionadas:** `RNF-14`.
* **Criterios de Aceptación:**
  * Eventos cubiertos: solicitud radicada, solicitud aprobada/rechazada/info requerida, contrato disponible, desembolso confirmado, recordatorio de vencimiento, pago reportado, pago confirmado/rechazado.

#### `RF-019` — Recordatorios Programados y Cumplimiento de Cobranza (Ley 2300 de 2023)
* **Descripción:** Ejecutar recordatorios preventivos y de cobranza en ventanas horarias y frecuencias configurables que cumplan estrictamente la legislación colombiana.
* **Actor Responsable:** `SISTEMA` (Scheduler), `ADMINISTRADOR` (configuración).
* **Condiciones Previas:** Cuotas próximas a vencer o vencidas y reglas de ventana horaria configuradas.
* **Flujo Principal:**
  1. El scheduler evalúa cuotas según reglas configuradas (ej. 3 días antes, 1 día antes y el día del vencimiento).
  2. Verifica que la hora actual en `America/Bogota` esté dentro de la franja permitida por la Ley 2300 de 2023 (lunes a viernes de 7:00 a.m. a 7:00 p.m., sábados de 8:00 a.m. a 3:00 p.m.; prohibido domingos y festivos) y que no se exceda el límite de contactos por semana.
  3. Despacha los recordatorios únicamente a los canales autorizados por el titular.
* **Resultado Esperado:** Gestión preventiva de recaudo respetuosa y legalmente conforme.
* **Reglas Relacionadas:** `RNF-06`.
* **Criterios de Aceptación:**
  * Bloqueo automático de envíos de cobranza fuera de los horarios y días permitidos por Ley 2300 de 2023.
  * Prohibido contactar referencias personales o terceros para gestiones de cobro.

#### `RF-020` — Búsqueda Global y Filtros Avanzados
* **Descripción:** Permitir al administrador localizar rápidamente usuarios, solicitudes, préstamos y pagos mediante criterios combinables.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Rol `ADMINISTRADOR`.
* **Flujo Principal:**
  1. El administrador ingresa término de búsqueda (nombre, número de documento exacto vía hash, teléfono, código de solicitud o préstamo) y aplica filtros (estado, rango de fechas, mora, monto).
  2. El backend ejecuta consultas indexadas con paginación *server-side* y enmascara datos sensibles en los resultados de lista.
* **Resultado Esperado:** Localización ágil de registros sin degradar el rendimiento de la base de datos.
* **Reglas Relacionadas:** `RNF-01`, `RNF-05`.
* **Criterios de Aceptación:**
  * Nunca se cargan todos los registros en memoria del cliente.

#### `RF-021` — Dashboard Ejecutivo e Indicadores Operativos
* **Descripción:** Presentar al administrador métricas consolidadas en tiempo real sobre el estado del negocio y la cartera.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Rol `ADMINISTRADOR`.
* **Flujo Principal:**
  1. El administrador accede al dashboard principal.
  2. Visualiza: solicitudes por estado, tasa de aprobación/rechazo, capital total desembolsado, saldo de cartera vigente, cartera vencida (por tramos de mora), pagos pendientes de conciliación, recaudo por período y vencimientos de los próximos 7 días.
* **Resultado Esperado:** Visibilidad gerencial y operativa para la toma de decisiones.
* **Reglas Relacionadas:** `RNF-01`.
* **Criterios de Aceptación:**
  * Todos los totales monetarios coinciden exactamente con la suma de movimientos confirmados en el ledger.

#### `RF-022` — Historial y Bitácora Inmutable de Auditoría
* **Descripción:** Registrar cronológicamente todas las acciones críticas y consultas sensibles realizadas en la plataforma, ofreciendo una línea de tiempo simplificada al usuario y una bitácora técnica completa al administrador.
* **Actor Responsable:** `SISTEMA` (registro), `ADMINISTRADOR` (consulta completa), `USUARIO` (timeline propio).
* **Condiciones Previas:** Cualquier operación crítica o acceso a documentos privados.
* **Flujo Principal:**
  1. Ante eventos como login, cambio de perfil, descarga de documento, decisión de solicitud, desembolso, conciliación de pago o cambio de tarifa, el sistema inserta un registro en `audit_logs`.
  2. Registra `actor_id`, `role`, `action`, `entity_type`, `entity_id`, estado anterior/nuevo (redactado sin secretos), `reason`, `ip_address`, `correlation_id` y `timestamp UTC`.
* **Resultado Esperado:** Trazabilidad integral (*append-only*) que permite reconstruir la historia de cualquier operación.
* **Reglas Relacionadas:** `RN-08`, `RN-10`, `RNF-12`.
* **Criterios de Aceptación:**
  * Ningún usuario ni administrador puede editar o eliminar registros de `audit_logs` desde la aplicación.

#### `RF-023` — Exportación Controlada de Reportes
* **Descripción:** Permitir al administrador exportar listados de cartera, colocación, recaudos y auditoría en formatos `CSV`, `XLSX` o `PDF`.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Rol `ADMINISTRADOR` y filtros seleccionados.
* **Flujo Principal:**
  1. El administrador solicita la exportación de un reporte filtrado.
  2. El sistema aplica minimización de datos (enmascarando documentos/cuentas salvo permiso explícito), genera el archivo (de forma asíncrona si supera un umbral de filas), incorpora marca de agua/metadatos de generación y registra la descarga en `audit_logs`.
* **Resultado Esperado:** Reportes descargables seguros y auditados.
* **Reglas Relacionadas:** `RNF-06`, `RN-10`.
* **Criterios de Aceptación:**
  * Cada exportación queda auditada indicando qué administrador la descargó y bajo qué filtros.

#### `RF-024` — Gestión de Usuarios y Control de Cuentas
* **Descripción:** Permitir al administrador consultar perfiles de prestatarios, revisar su historial completo, gestionar estados de acceso (`ACTIVO`, `BLOQUEADO`, `VERIFICACION_PENDIENTE`) y agregar notas administrativas internas.
* **Actor Responsable:** `ADMINISTRADOR`.
* **Condiciones Previas:** Rol `ADMINISTRADOR`.
* **Flujo Principal:**
  1. El administrador selecciona un usuario y puede bloquear o desbloquear su acceso registrando un motivo obligatorio.
  2. Puede aprobar o rechazar documentos individuales del expediente KYC.
* **Resultado Esperado:** Administración ordenada del ciclo de vida de los clientes.
* **Reglas Relacionadas:** `RN-08`, `RNF-12`.
* **Criterios de Aceptación:**
  * Bloquear a un usuario revoca inmediatamente sus sesiones activas (`Refresh Tokens`), pero conserva intactos sus préstamos y obligaciones vigentes.

#### `RF-025` — Canal de Atención, PQR y Disputas de Pago
* **Descripción:** Proveer a los prestatarios un canal estructurado para radicar peticiones, quejas, reclamos (PQR), solicitudes de corrección de datos (Hábeas Data) o disputas sobre pagos rechazados.
* **Actor Responsable:** `USUARIO` (radicación), `ADMINISTRADOR` (gestión y cierre).
* **Condiciones Previas:** Usuario autenticado.
* **Flujo Principal:**
  1. El usuario crea un ticket seleccionando categoría (Soporte técnico, Disputa de pago, Actualización de datos, Reclamo financiero), descripción y adjunto opcional.
  2. El sistema asigna número de radicado, fecha límite de respuesta (SLA) y notifica al administrador.
  3. El administrador responde, documenta la resolución y cierra el caso con trazabilidad.
* **Resultado Esperado:** Atención formalizada que respalda los derechos del consumidor financiero y titular de datos.
* **Reglas Relacionadas:** `RNF-06`.
* **Criterios de Aceptación:**
  * Todo ticket conserva historial de mensajes y tiempos de respuesta para control de SLA.

---

## 9. Requisitos No Funcionales (RNF)

| ID | Categoría | Requisito y Métrica Verificable |
| :--- | :--- | :--- |
| **RNF-01** | **Rendimiento** | Tiempo de respuesta `P95 <= 500 ms` en endpoints de consulta paginada; `P95 <= 1.0 s` en cálculos del simulador; `P95 <= 1.5 s - 2.0 s` en operaciones transaccionales críticas (excluyendo latencia de proveedores externos). |
| **RNF-02** | **Concurrencia** | Soportar una línea base de prueba de carga de **500 usuarios concurrentes** y **100 peticiones/segundo** en lectura sin degradación ni bloqueos muertos (*deadlocks*). |
| **RNF-03** | **Disponibilidad** | Disponibilidad objetivo para el MVP de **>= 99,5 % mensual** (excluyendo ventanas de mantenimiento programado), con arquitectura preparada para escalar a **99,9 %**. |
| **RNF-04** | **Respaldo y Recuperación** | Objetivo de punto de recuperación **RPO <= 15 minutos** (mediante backups continuos/PITR en PostgreSQL) y tiempo objetivo de recuperación **RTO <= 4 horas**, con respaldos cifrados y pruebas periódicas de restauración. |
| **RNF-05** | **Seguridad** | Cumplimiento de estándares OWASP ASVS y OWASP API Security Top 10: cifrado TLS 1.2+ en tránsito, cifrado AES-256 en reposo, MFA obligatorio para administradores, RBAC estricto en servidor, validación de ownership (anti-IDOR), rate limiting y escaneo de vulnerabilidades en dependencias. |
| **RNF-06** | **Privacidad y Datos** | Cumplimiento técnico de Ley 1581 de 2012: minimización de datos, consentimiento granular versionado, enmascaramiento en interfaces/logs, políticas de retención y canal para derechos ARCO (acceso, rectificación, cancelación/supresión cuando proceda). |
| **RNF-07** | **Integridad Financiera** | Operaciones monetarias ejecutadas bajo transacciones ACID en PostgreSQL, precisión decimal exacta `NUMERIC(18,2)`, llaves de idempotencia únicas y prohibición absoluta de borrado físico de registros financieros (`append-only` / reversos). |
| **RNF-08** | **Escalabilidad** | API backend completamente *stateless* (sin estado de sesión en memoria local) que permita escalamiento horizontal detrás de balanceador de carga; uso de Redis y colas para tareas asíncronas. |
| **RNF-09** | **Compatibilidad** | Web adaptable a resoluciones desde `360px` (móvil) hasta `1920px+` (escritorio); aplicaciones móviles compatibles con versiones activas de Android (API 24+) e iOS (iOS 15+) definidas al release. |
| **RNF-10** | **Accesibilidad** | Conformidad objetivo con **WCAG 2.2 Nivel AA**: contraste adecuado, navegación por teclado, etiquetas semánticas para lectores de pantalla y mensajes de error claros en español. |
| **RNF-11** | **Mantenibilidad** | Arquitectura modular por dominios, `TypeScript` en modo estricto (`strict: true`), aplicación de principios SOLID, linters (`ESLint`/`Prettier`), documentación OpenAPI actualizada y cobertura mínima de pruebas unitarias del **80 %** en el motor financiero. |
| **RNF-12** | **Trazabilidad** | Reconstrucción completa del ciclo de vida de cada usuario, solicitud, contrato, desembolso y pago mediante eventos auditados con `correlation_id`. |
| **RNF-13** | **Observabilidad** | Logs estructurados en formato JSON (redactados de PII y secretos), métricas de latencia/errores/colas y alertas automatizadas ante fallos críticos. |
| **RNF-14** | **Resiliencia y Continuidad** | Implementación de *timeouts* estrictos, reintentos con *backoff* exponencial solo en operaciones idempotentes, *circuit breakers* para servicios externos y *Dead-Letter Queues (DLQ)* para eventos fallidos. |

---

## 10. Reglas de Negocio (RN) y Marco Legal

### 10.1 Reglas de Negocio Confirmadas vs. Propuestas Pendientes

| ID | Dominio | Descripción de la Regla | Estado |
| :--- | :--- | :--- | :---: |
| **RN-01** | **Supervisión Humana** | El administrador supervisa el **100 %** de las solicitudes y desembolsos. Ningún proceso automatizado puede aprobar créditos ni transferir fondos por sí solo. | **Confirmada** |
| **RN-02** | **Umbral de Revisión** | Toda solicitud superior a **COP $500.000** debe mostrar explícitamente estado de evaluación administrativa y marcarse con prioridad/autorización reforzada. Este umbral **no** implica autoaprobación para montos iguales o inferiores. | **Confirmada** |
| **RN-03** | **Validez de Cotización** | La simulación es meramente informativa y tiene vigencia limitada. Las condiciones solo se vuelven vinculantes al aprobarse la solicitud y aceptarse la oferta/contrato final. | **Confirmada** |
| **RN-04** | **Legalidad de Tasas** | Los intereses remuneratorios y moratorios deben calcularse aplicando una tasa Efectiva Anual (`E.A.`) vigente y su conversión periódica, verificando que no exceda el límite legal certificado (tasa de usura de la Superfinanciera de Colombia: `28,34 % E.A.` referencia nov/2026). El motor bloquea tasas no conformes. | **Confirmada (Bloqueo Técnico)** |
| **RN-05** | **No Anatocismo** | No se cobra interés sobre interés (capitalización de intereses) salvo excepción legal expresa. El sistema separa contablemente capital, interés corriente, interés de mora, gastos autorizados y abonos. | **Confirmada** |
| **RN-06** | **Activación de Préstamo** | Un préstamo pasa a estado `ACTIVO` y genera su calendario definitivo de cuotas **únicamente** después de: (1) Aprobación administrativa, (2) Aceptación contractual electrónica del usuario, y (3) Confirmación de desembolso efectivo con comprobante. | **Confirmada** |
| **RN-07** | **Conciliación de Pagos** | La carga de un comprobante por parte del usuario coloca el pago en estado `EN_REVISION` y **no** disminuye el saldo. Solo la conciliación confirmada por un administrador actualiza el saldo y genera recibo. | **Confirmada** |
| **RN-08** | **Máquina de Estados** | Toda transición de estado debe validar precondiciones en el dominio y registrar un evento auditable con actor, fecha/hora y motivo. | **Confirmada** |
| **RN-09** | **Precisión Monetaria** | Todos los valores monetarios operan en pesos colombianos (`COP`) usando tipos decimales exactos (`NUMERIC(18,2)` en DB), prohibiendo tipos `float` o `double`. | **Confirmada** |
| **RN-10** | **Confidencialidad** | Datos de identificación, cuentas destino y documentos son estrictamente privados. El administrador accede bajo necesidad operativa y cada consulta sensible queda auditada. | **Confirmada** |
| **RN-P01** | **Tasas Comerciales Iniciales** | Esquema comercial ilustrativo propuesto por el solicitante (`10 % semanal`, `15 % quincenal`, `20 % mensual`). **BLOQUEADO** para producción porque al anualizarse excede el tope de usura en Colombia. | **Pendiente Validación Jurídica** |
| **RN-P02** | **Sistema de Amortización** | Definición exacta entre cuota fija (sistema francés), abono constante a capital o pago único al vencimiento, así como política de redondeo al peso colombiano. | **Pendiente Aprobación Cliente** |
| **RN-P03** | **Prelación de Pagos y Abonos** | Orden exacto de imputación de pagos parciales/anticipados (gastos -> mora -> interés corriente -> capital) y política de reducción de cuota vs. reducción de plazo. | **Pendiente Aprobación Cliente** |
| **RN-P04** | **Días de Gracia y Mora** | Número exacto de días de gracia tras el vencimiento antes de entrar en `EN_MORA` y fórmula exacta de liquidación moratoria. | **Pendiente Aprobación Cliente** |

### 10.2 Marco Normativo de Referencia en Colombia
El diseño técnico incorpora soporte estructural para las siguientes normas colombianas (sujetas a validación jurídica del cliente antes del lanzamiento):
* **Ley 1581 de 2012 y Decreto 1074 de 2015:** Protección de Datos Personales (autorización previa, expresa e informada, finalidad, seguridad y derechos ARCO).
* **Ley 1266 de 2008:** Hábeas Data Financiero (aplica si en el futuro se decide consultar o reportar a centrales de riesgo; actualmente deshabilitado).
* **Ley 2300 de 2023 ("Ley Dejen de Fregar"):** Regulación de canales autorizados, horarios (L-V 7:00–19:00, Sáb 8:00–15:00) y frecuencia máxima de contacto para gestiones de cobranza.
* **Ley 1480 de 2011 (Estatuto del Consumidor) y Decreto 1368 de 2014:** Transparencia en operaciones de crédito, divulgación de tasa efectiva anual, costos totales y derecho a pagos anticipados sin penalidad.
* **Ley 527 de 1999:** Validez jurídica de mensajes de datos, contratos electrónicos y evidencia de integridad.
* **Código de Comercio (Art. 884) y Código Penal (Art. 305):** Límites legales de intereses remuneratorios y moratorios (delito de usura).

---

## 11. Arquitectura General del Sistema

### 11.1 Estilo Arquitectónico: Monolito Modular + Workers Asíncronos
Para la etapa inicial (MVP) y considerando un equipo de desarrollo acotado, se adopta un **Monolito Modular con Arquitectura Limpia / Hexagonal ligera** desplegado como un servicio API stateless, complementado con **Workers asíncronos** respaldados por Redis/Colas.

**Justificación Técnica:**
* Evita la complejidad operativa, latencia de red y transacciones distribuidas de los microservicios prematuros.
* Garantiza **transacciones ACID locales** en PostgreSQL para operaciones financieras críticas (desembolso + creación de cuotas; conciliación + asignación de pagos + actualización de saldo).
* Mantiene fronteras estrictas entre dominios (`auth`, `users`, `documents`, `rates`, `applications`, `contracts`, `loans`, `payments`, `notifications`, `audit`, `reporting`), permitiendo extraer módulos en el futuro si el volumen de tráfico lo exige.

### 11.2 Componentes Principales y Responsabilidades
1. **Frontend Web (`React` / `Next.js` + `TypeScript`):** Interfaz responsiva dividida en dos áreas protegidas: Portal del Prestatario y Panel de Administración.
2. **Aplicación Móvil (`React Native` + `Expo` + `TypeScript`):** Cliente nativo para Android e iOS enfocado exclusivamente en el flujo del prestatario, con soporte para cámara (captura de documentos/comprobantes) y notificaciones push.
3. **API Gateway / Backend Core (`NestJS` + `TypeScript`):** Expone endpoints REST `/api/v1`, gestiona autenticación JWT/MFA, autorización RBAC, validación de DTOs, motor financiero y casos de uso.
4. **Base de Datos Transaccional (`PostgreSQL`):** Persistencia relacional con integridad referencial, restricciones `CHECK`/`UNIQUE`, bloqueos optimistas/pesimistas y respaldos PITR.
5. **Object Storage Privado (`S3 Compatible`):** Almacenamiento cifrado de documentos KYC, contratos PDF y comprobantes de pago/desembolso.
6. **Bus de Eventos / Cola (`Redis` + `BullMQ`):** Procesamiento desacoplado de *Transactional Outbox*, envío de correos, push notifications, tareas programadas (mora/recordatorios) y generación de reportes.

*(El detalle granular, diagramas Mermaid, modelo entidad-relación y estructura de carpetas se especifican en el archivo `02_ARQUITECTURA_DIAGRAMAS_Y_DESARROLLO_PRESTAYA.md`).*

---

## 12. Seguridad, Privacidad y Cumplimiento

1. **Autenticación y Gestión de Sesiones:**
   * Contraseñas almacenadas con `Argon2id` (o `bcrypt` con factor de costo >= 12).
   * Tokens de acceso JWT de corta duración (`15 min`) y `Refresh Tokens` rotativos almacenados como hash en base de datos con capacidad de revocación inmediata.
   * **MFA obligatorio** (TOTP o OTP verificado) para cuentas con rol `ADMINISTRADOR`, además de reautenticación para acciones de alto impacto (desembolsar, conciliar pagos, cambiar tasas).
2. **Autorización y Control de Acceso:**
   * Denegación por defecto en todos los endpoints.
   * Validación estricta de propiedad (*Resource Ownership*) en cada consulta: un `USUARIO` solo puede consultar recursos donde `resource.user_id === req.user.id`, mitigando vulnerabilidades IDOR/BOLA.
3. **Protección de Datos Sensibles (PII y Financieros):**
   * Cifrado en tránsito mediante `HTTPS / TLS 1.2+` (HSTS habilitado).
   * Cifrado a nivel de columna (`AES-256-GCM`) para números de documento de identidad y números de cuentas/llaves destino en PostgreSQL, acompañados de índices hash (`HMAC-SHA256`) para búsquedas exactas sin descifrar toda la tabla.
   * Prohibición estricta de almacenar claves bancarias, PIN o códigos CVV.
4. **Seguridad en Carga y Almacenamiento de Archivos:**
   * Validación de tipo de archivo real (*magic bytes*), límite de tamaño (ej. 10 MB) y escaneo antimalware antes de marcar el documento como disponible.
   * Buckets S3 completamente privados; acceso mediante **URLs prefirmadas** con expiración corta (`5 a 15 minutos`).
5. **Validación de Entradas y Prevención de Vulnerabilidades:**
   * Validación estricta de esquemas en entrada mediante DTOs y tuberías globales (`ValidationPipe` con `whitelist: true` y `forbidNonWhitelisted: true`).
   * Uso de consultas parametrizadas vía ORM/Query Builder para prevenir inyección SQL.
   * Políticas CORS restrictivas, cabeceras de seguridad (`Helmet`), protección XSS y *Rate Limiting* por IP y por usuario.
6. **Gestión de Secretos y Auditoría:**
   * Secretos administrados mediante variables de entorno inyectadas desde un *Secret Manager* (nunca versionados en Git).
   * Sanitización automática de logs para enmascarar tokens, contraseñas y PII.

---

## 13. Estrategia de Desarrollo y Calidad

### 13.1 Metodología y Organización por Fases
Se adopta un enfoque **iterativo e incremental** organizado en **6 fases** (alineadas con el cronograma de 18–20 semanas activas de `Propuesta_PrestaYa_v1.1`):

| Fase | Nombre | Entregables Clave |
| :--- | :--- | :--- |
| **Fase 0** | Descubrimiento y Cierre Legal | Validación escrita de reglas financieras, tasas legales, contratos, privacidad y UX flows. |
| **Fase 1** | Fundaciones y Seguridad | Repositorios, Docker, CI/CD, modelo de datos inicial, Auth/RBAC/MFA, Perfil KYC, Storage privado S3 y Auditoría. |
| **Fase 2** | Motor Financiero y Solicitudes | Tarifas versionadas, Simulador con bloqueo legal, Solicitudes idempotentes, Bandeja y Decisión Administrativa. |
| **Fase 3** | Formalización, Desembolso y Cartera | Generación y aceptación de contrato electrónico, Registro de desembolso atómico, Calendario de cuotas y Dashboard. |
| **Fase 4** | Pagos, Conciliación y Notificaciones | Carga de comprobantes, Conciliación administrativa idempotente, Cálculo de mora, Outbox, Notificaciones y PQR. |
| **Fase 5** | Apps Móviles y Hardening | Integración completa Android/iOS (Expo), pruebas de carga/seguridad, backups PITR, UAT y despliegue a producción. |

### 13.2 Control de Calidad y Criterios de Aceptación Global
* Ningún módulo se considera terminado sin pruebas unitarias e integración automatizadas aprobadas en el pipeline CI.
* Revisión obligatoria mediante *Pull Requests* con verificación de linter, compilación estricta y ausencia de vulnerabilidades críticas.
* **Criterios de Aceptación del MVP:**
  1. Consistencia total de datos y estados entre Web, Android e iOS.
  2. Imposibilidad técnica de aprobar o desembolsar sin intervención administrativa y aceptación contractual.
  3. Idempotencia verificada en solicitudes, desembolsos y conciliación de pagos.
  4. Bloqueo efectivo de tasas que excedan el límite legal configurado.
  5. Acceso privado y auditado a documentos sensibles.

---

## 14. Matriz de Riesgos, Vacíos y Decisiones Pendientes

### 14.1 Matriz de Riesgos Identificados

| ID Riesgo | Riesgo | Descripción | Impacto | Probabilidad | Estrategia de Mitigación | Responsable |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| **RSK-01** | **Bloqueo Legal por Tasas de Interés** | Intentar operar con las tasas comerciales ilustrativas (`10% sem`, `15% quin`, `20% men`) que superan la usura en Colombia. | **Crítico** | Alta | Bloquear tasas por defecto en el motor; exigir validación jurídica escrita y configurar `LegalRatePolicy` con tope Superfinanciera vigente antes de producción. | Propietario / Asesor Legal |
| **RSK-02** | **Inconsistencia o Duplicidad de Pagos** | Reintentos de red o doble clic del administrador al conciliar comprobantes generando doble abono al saldo. | **Crítico** | Media | Transacciones ACID, bloqueo `SELECT FOR UPDATE`, `Idempotency-Key` única en DB y confirmación manual obligatoria. | Equipo Desarrollo |
| **RSK-03** | **Filtración de Documentos Sensibles (PII)** | Acceso no autorizado a cédulas, recibos o comprobantes por configuración errónea de almacenamiento. | **Alto** | Baja | Buckets S3 privados sin acceso público, URLs prefirmadas de corta expiración, validación de ownership y auditoría de descargas. | Arquitectura / DevOps |
| **RSK-04** | **Rechazo o Demora en Tiendas Móviles** | Google Play o App Store rechazan o retrasan la app por políticas de servicios financieros y préstamos personales. | **Alto** | Media | Preparar cuentas corporativas, políticas de privacidad y documentación legal desde Fase 2; lanzar Web Responsiva como canal operativo inmediato. | Propietario / Desarrollo |
| **RSK-05** | **Retraso por Definiciones de Negocio** | Demora en la entrega de reglas exactas de amortización, mora y textos legales por parte del cliente. | **Medio** | Media | Congelar reglas financieras en Fase 0 (Hito 1) mediante acta firmada; aplicar cláusula de desplazamiento proporcional de cronograma. | Propietario del Proyecto |
| **RSK-06** | **Fallo en Proveedores de Notificación** | Caída del servicio de correo o push durante confirmaciones de pago o desembolso. | **Medio** | Media | Patrón *Transactional Outbox* con reintentos exponenciales y cola DLQ; desacoplar envío de notificaciones de la transacción financiera. | Equipo Desarrollo |

### 14.2 Vacíos Documentales y Decisiones Pendientes (Requieren Validación del Propietario)

Antes de iniciar la codificación del módulo financiero y contractual, el propietario del proyecto y su asesoría legal/contable deben confirmar por escrito los siguientes puntos:

1. **Naturaleza Jurídica del Prestamista:** Confirmar si operará como persona natural, sociedad comercial o entidad vigilada, y validar las obligaciones tributarias y regulatorias correspondientes.
2. **Tasa Aplicable y Modalidad de Crédito:** Definir la tasa Efectiva Anual (`E.A.`) autorizada para producción y confirmar el rechazo definitivo o ajuste legal de las tasas ilustrativas iniciales (`10%`, `15%`, `20%`).
3. **Sistema de Amortización y Redondeo:** Confirmar si los préstamos operarán bajo **cuota fija (amortización francesa)**, **abono constante a capital** o **pago único al vencimiento**, y la regla de redondeo a pesos colombianos (`COP`).
4. **Política de Pagos Parciales, Anticipados y Prelación:** Definir si se aceptan abonos parciales o pagos anticipados totales, y confirmar el orden de imputación (gastos -> mora -> interés corriente -> capital).
5. **Reglas de Mora y Días de Gracia:** Establecer el número de días de gracia tras el vencimiento, la tasa moratoria aplicable (dentro del límite legal) y si aplica cobro de gastos de cobranza prejurídica.
6. **Límites Operativos del Producto:** Definir monto mínimo y máximo de préstamo, plazos permitidos por periodicidad (semanal, quincenal, mensual) y número máximo de préstamos activos simultáneos por usuario.
7. **Textos Legales y Contratos:** Entregar versiones aprobadas por abogado de: Política de Tratamiento de Datos (Ley 1581/2012), Términos y Condiciones, Contrato de Mutuo / Pagaré Electrónico y cláusulas de cobranza (Ley 2300/2023).
8. **Proveedores Externos y Presupuesto Cloud:** Confirmar proveedores a contratar para hosting/cloud, almacenamiento S3, correo transaccional, notificaciones push (Firebase/APNs) y dominio oficial.
9. **Confirmación de Stack Técnico:** Ratificar la adopción de **NestJS + PostgreSQL + React/Next.js + React Native (Expo)** frente a Express puro, conforme a la recomendación técnica documentada en `CONF-01`.