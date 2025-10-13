import type { Request, Response, NextFunction } from "express"
import { AppError } from "../errors/AppError"
import { captureException } from "../config/sentry"
import { isProduction } from "../config/env"
import { logger } from "../config/logger"

export function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction) {
  // Default to 500 server error
  let statusCode = 500
  let code = "INTERNAL_SERVER_ERROR"
  let message = "An unexpected error occurred"
  let context: Record<string, any> | undefined

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode
    code = err.code
    message = err.message
    context = err.context

    // Log operational errors as warnings
    if (err.isOperational) {
      logger.warn(`[${code}] ${message}`, {
        statusCode,
        context,
        path: req.path,
        method: req.method,
        userId: (req as any).user?.id,
      })
    } else {
      // Log non-operational errors as errors
      logger.error(`[${code}] ${message}`, {
        statusCode,
        context,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: (req as any).user?.id,
      })

      // Send to Sentry for non-operational errors
      captureException(err, {
        path: req.path,
        method: req.method,
        userId: (req as any).user?.id,
        ...context,
      })
    }
  } else {
    // Handle unexpected errors
    logger.error("Unexpected error:", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
    })

    // Send to Sentry
    captureException(err, {
      path: req.path,
      method: req.method,
      userId: (req as any).user?.id,
    })
  }

  // Send error response
  const errorResponse: any = {
    error: {
      code,
      message: isProduction && statusCode === 500 ? "Internal server error" : message,
    },
  }

  // Include context in development
  if (!isProduction && context) {
    errorResponse.error.context = context
  }

  // Include stack trace in development
  if (!isProduction && err.stack) {
    errorResponse.error.stack = err.stack
  }

  res.status(statusCode).json(errorResponse)
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
