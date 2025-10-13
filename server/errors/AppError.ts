export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(statusCode: number, message: string, code: string, isOperational = true, context?: Record<string, any>) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)

    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.context = context

    Error.captureStackTrace(this)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(400, message, "VALIDATION_ERROR", true, context)
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required", context?: Record<string, any>) {
    super(401, message, "AUTHENTICATION_ERROR", true, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions", context?: Record<string, any>) {
    super(403, message, "AUTHORIZATION_ERROR", true, context)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(404, `${resource} not found`, "NOT_FOUND_ERROR", true, context)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(409, message, "CONFLICT_ERROR", true, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", context?: Record<string, any>) {
    super(429, message, "RATE_LIMIT_ERROR", true, context)
  }
}

export class PaymentError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(402, message, "PAYMENT_ERROR", true, context)
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: Record<string, any>) {
    super(502, `${service} error: ${message}`, "EXTERNAL_SERVICE_ERROR", true, context)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(500, message, "DATABASE_ERROR", false, context)
  }
}
