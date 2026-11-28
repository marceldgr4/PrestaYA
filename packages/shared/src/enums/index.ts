/**
 * Enums centrales del dominio de negocio PrestaYA.
 *
 * Todas las entidades relacionales, DTOs de API y pantallas de clientes
 * (Web y Móvil) deben importar estos enums para evitar el uso de cadenas mágicas.
 */

/**
 * Roles del sistema para control de acceso RBAC.
 */
export enum UserRole {
  USUARIO = 'USUARIO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

/**
 * Estados posibles de la cuenta de usuario.
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/**
 * Tipos de documentos de identidad oficiales reconocidos.
 */
export enum DocumentType {
  CC = 'CC', // Cédula de Ciudadanía
  CE = 'CE', // Cédula de Extranjería
  PASAPORTE = 'PASAPORTE',
  PEP = 'PEP', // Permiso Especial de Permanencia
  PPT = 'PPT', // Permiso por Protección Temporal
}

/**
 * Canales o destinos de desembolso soportados.
 */
export enum PayoutDestinationType {
  CUENTA_BANCARIA = 'CUENTA_BANCARIA',
  LLAVE = 'LLAVE',
  NEQUI = 'NEQUI',
  DAVIPLATA = 'DAVIPLATA',
}

/**
 * Tipos de consentimientos legales obligatorios.
 */
export enum ConsentType {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  DATA_TREATMENT = 'DATA_TREATMENT',
  TERMS_OF_USE = 'TERMS_OF_USE',
}

/**
 * Categorías de archivos adjuntos y documentos.
 */
export enum DocumentCategory {
  ID_FRONT = 'ID_FRONT',
  ID_BACK = 'ID_BACK',
  UTILITY_BILL = 'UTILITY_BILL',
  DISBURSEMENT_PROOF = 'DISBURSEMENT_PROOF',
  PAYMENT_PROOF = 'PAYMENT_PROOF',
  CONTRACT_PDF = 'CONTRACT_PDF',
}

/**
 * Estado del análisis antimalware de documentos.
 */
export enum DocumentScanStatus {
  PENDING = 'PENDING',
  CLEAN = 'CLEAN',
  INFECTED = 'INFECTED',
  FAILED = 'FAILED',
}

/**
 * Estado de revisión administrativa de documentos KYC.
 */
export enum DocumentReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Frecuencia o periodicidad de amortización del crédito.
 */
export enum PaymentFrequency {
  SEMANAL = 'SEMANAL',
  QUINCENAL = 'QUINCENAL',
  MENSUAL = 'MENSUAL',
}

/**
 * Métodos de amortización autorizados.
 */
export enum AmortizationMethod {
  FRENCH_FIXED_FEE = 'FRENCH_FIXED_FEE', // Sistema Francés (cuota fija periódica)
}

/**
 * Ciclo de vida de una solicitud de crédito.
 */
export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Estado operativo del préstamo una vez desembolsado.
 */
export enum LoanStatus {
  PENDING_DISBURSEMENT = 'PENDING_DISBURSEMENT',
  ACTIVE = 'ACTIVE',
  PAID_OFF = 'PAID_OFF',
  IN_DEFAULT = 'IN_DEFAULT',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

/**
 * Clasificación de cartera según días de mora.
 */
export enum PortfolioStatus {
  AL_DIA = 'AL_DIA',
  MORA_1_30 = 'MORA_1_30',
  MORA_31_60 = 'MORA_31_60',
  MORA_MAYOR_60 = 'MORA_MAYOR_60',
  CASTIGADA = 'CASTIGADA',
}

/**
 * Estado individual de cada cuota del préstamo.
 */
export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
}

/**
 * Estado de un comprobante de pago reportado por el prestatario.
 */
export enum PaymentSubmissionStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

/**
 * Canales de notificación soportados.
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}

/**
 * Estado de entrega de una notificación.
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

/**
 * Estado de eventos en el Transactional Outbox.
 */
export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

/**
 * Categorías de casos de soporte (PQR).
 */
export enum SupportCaseCategory {
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  LOAN_INQUIRY = 'LOAN_INQUIRY',
  TECHNICAL_PROBLEM = 'TECHNICAL_PROBLEM',
  ACCOUNT_ACCESS = 'ACCOUNT_ACCESS',
  LEGAL_REQUEST = 'LEGAL_REQUEST',
}

/**
 * Estados de casos de soporte.
 */
export enum SupportCaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_USER = 'WAITING_USER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}
