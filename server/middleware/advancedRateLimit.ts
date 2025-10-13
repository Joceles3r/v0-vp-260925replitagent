import type { Request, Response, NextFunction } from "express"
import { RateLimitError } from "../errors/AppError"
import { env } from "../config/env"
import { logger } from "../config/logger"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: Request) => string
  skip?: (req: Request) => boolean
  handler?: (req: Request, res: Response) => void
}

const requestCounts = new Map<string, { count: number; resetTime: number }>()

setInterval(
  () => {
    const now = Date.now()
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetTime < now) {
        requestCounts.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

export function advancedRateLimit(config: RateLimitConfig) {
  const {
    windowMs = env.RATE_LIMIT_WINDOW,
    maxRequests = env.RATE_LIMIT_MAX_REQUESTS,
    keyGenerator = (req) => (req as any).user?.id?.toString() || req.ip || "unknown",
    skip = () => false,
    handler,
  } = config

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip if configured
    if (skip(req)) {
      return next()
    }

    const key = keyGenerator(req)
    const now = Date.now()

    // Get or create rate limit entry
    let entry = requestCounts.get(key)

    if (!entry || entry.resetTime < now) {
      // Create new entry
      entry = {
        count: 0,
        resetTime: now + windowMs,
      }
      requestCounts.set(key, entry)
    }

    // Increment count
    entry.count++

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests)
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count))
    res.setHeader("X-RateLimit-Reset", new Date(entry.resetTime).toISOString())

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      logger.warn("Rate limit exceeded", {
        key,
        count: entry.count,
        limit: maxRequests,
        path: req.path,
        method: req.method,
      })

      if (handler) {
        return handler(req, res)
      }

      throw new RateLimitError("Too many requests, please try again later", {
        retryAfter: new Date(entry.resetTime).toISOString(),
      })
    }

    next()
  }
}

export const rateLimitPresets = {
  // Strict limits for authentication endpoints
  auth: advancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) => req.ip || "unknown",
  }),

  // Standard limits for API endpoints
  api: advancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyGenerator: (req) => (req as any).user?.id?.toString() || req.ip || "unknown",
  }),

  // Generous limits for admin users
  admin: advancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    skip: (req) => (req as any).user?.role !== "admin",
  }),

  // Very strict limits for payment endpoints
  payment: advancedRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (req) => (req as any).user?.id?.toString() || req.ip || "unknown",
  }),
}
