import type { Request, Response, NextFunction } from "express"
import crypto from "crypto"

interface CSRFRequest extends Request {
  csrfToken?: () => string
  session?: any
}

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString("hex")

export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now().toString()
  const data = `${sessionId}:${timestamp}`
  const hmac = crypto.createHmac("sha256", CSRF_SECRET)
  hmac.update(data)
  const signature = hmac.digest("hex")

  return `${timestamp}.${signature}`
}

export function validateCSRFToken(token: string, sessionId: string): boolean {
  if (!token || !sessionId) return false

  const parts = token.split(".")
  if (parts.length !== 2) return false

  const [timestamp, signature] = parts

  const tokenAge = Date.now() - Number.parseInt(timestamp)
  if (tokenAge > 3600000) return false

  const data = `${sessionId}:${timestamp}`
  const hmac = crypto.createHmac("sha256", CSRF_SECRET)
  hmac.update(data)
  const expectedSignature = hmac.digest("hex")

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

export function csrfProtection(req: CSRFRequest, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next()
  }

  const sessionId = req.sessionID || req.ip || "anonymous"
  const token = (req.headers["x-csrf-token"] as string) || req.body?._csrf

  if (!validateCSRFToken(token, sessionId)) {
    return res.status(403).json({
      error: "Invalid CSRF token",
      code: "CSRF_VALIDATION_FAILED",
    })
  }

  next()
}

export function attachCSRFToken(req: CSRFRequest, res: Response, next: NextFunction) {
  const sessionId = req.sessionID || req.ip || "anonymous"

  req.csrfToken = () => generateCSRFToken(sessionId)

  res.locals.csrfToken = req.csrfToken()

  next()
}
