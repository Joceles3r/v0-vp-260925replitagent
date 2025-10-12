import type { Request, Response, NextFunction } from "express"

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|#|\/\*|\*\/)/g,
  /(\bOR\b.*=.*)/gi,
  /(\bAND\b.*=.*)/gi,
  /(;|\||&&)/g,
  /(0x[0-9a-f]+)/gi,
  /(\bCHAR\(|\bCONCAT\()/gi,
]

export function detectSQLInjection(input: string): boolean {
  if (typeof input !== "string") return false

  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input))
}

export function sqlInjectionProtection(req: Request, res: Response, next: NextFunction) {
  const checkObject = (obj: any, path = ""): string | null => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key

      if (typeof value === "string" && detectSQLInjection(value)) {
        return currentPath
      }

      if (typeof value === "object" && value !== null) {
        const result = checkObject(value, currentPath)
        if (result) return result
      }
    }
    return null
  }

  const suspiciousField = checkObject({ ...req.body, ...req.query, ...req.params })

  if (suspiciousField) {
    console.warn(`[SECURITY] Potential SQL injection detected in field: ${suspiciousField}`, {
      ip: req.ip,
      path: req.path,
      method: req.method,
    })

    return res.status(400).json({
      error: "Invalid input detected",
      code: "SUSPICIOUS_INPUT",
    })
  }

  next()
}
