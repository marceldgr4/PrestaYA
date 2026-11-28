import {
  AccountStatus,
  AmortizationMethod,
  //ApplicationStatus,
  //DocumentCategory,
  DocumentType,
  //LoanStatus,
  PaymentFrequency,
  UserRole,
} from '../enums/index.js';

/**
 * Interfaz base de usuario autenticado en sesión.
 */
export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
}

/**
 * Respuesta estándar de inicio de sesión y renovación de token.
 */
export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

/**
 * Representación pública básica del perfil de usuario.
 */
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

/**
 * Parámetros de entrada para simulación de crédito.
 */
export interface LoanSimulationRequest {
  principalAmount: number;
  frequency: PaymentFrequency;
  termCount: number;
}

/**
 * Detalle proyectado de una cuota en la simulación.
 */
export interface SimulatedInstallment {
  installmentNumber: number;
  dueDate: string; // ISO 8601 YYYY-MM-DD
  principalFee: number;
  interestFee: number;
  totalFee: number;
  remainingBalance: number;
}

/**
 * Resultado proyectado del cálculo financiero de la simulación.
 */
export interface LoanSimulationResult {
  principalAmount: number;
  frequency: PaymentFrequency;
  termCount: number;
  amortizationMethod: AmortizationMethod;
  periodicInterestRate: number; // Tasa periódica decimal (ej: 0.015 = 1.5%)
  effectiveAnnualRate: number; // Tasa E.A. decimal (ej: 0.285 = 28.5%)
  legalUsuryCapEa: number; // Tope legal de usura aplicable
  isWithinLegalLimit: boolean;
  totalInterestAmount: number;
  totalRepaymentAmount: number;
  schedule: SimulatedInstallment[];
}

/**
 * Formato unificado de respuesta de error de la API REST.
 */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  correlationId?: string;
  timestamp: string;
  path: string;
}

/**
 * Contenedor de respuestas paginadas estándar.
 */
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
