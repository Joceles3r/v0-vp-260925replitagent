import type { Request, Response, NextFunction } from "express"
import DOMPurify from "isomorphic-dompurify"

export interface ValidationRule {
  field: string
  type: "string" | "number" | "email" | "url" | "boolean" | "array" | "object"
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  sanitize?: boolean
  custom?: (value: any) => boolean | string
}

export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

export function sanitizeInput(value: any, type: string): any {
  if (value === null || value === undefined) return value

  switch (type) {
    case "string":
      return typeof value === "string" ? sanitizeHTML(value.trim()) : String(value)
    case "number":
      const num = Number(value)
      return isNaN(num) ? null : num
    case "email":
      return typeof value === "string" ? value.toLowerCase().trim() : value
    case "boolean":
      return Boolean(value)
    case "array":
      return Array.isArray(value) ? value : [value]
    default:
      return value
  }
}

export function validateField(value: any, rule: ValidationRule): { valid: boolean; error?: string } {
  if (rule.required && (value === null || value === undefined || value === "")) {
    return { valid: false, error: `${rule.field} is required` }
  }

  if (!rule.required && (value === null || value === undefined)) {
    return { valid: true }
  }

  if (rule.sanitize) {
    value = sanitizeInput(value, rule.type)
  }

  switch (rule.type) {
    case "string":
      if (typeof value !== "string") {
        return { valid: false, error: `${rule.field} must be a string` }
      }
      if (rule.minLength && value.length < rule.minLength) {
        return { valid: false, error: `${rule.field} must be at least ${rule.minLength} characters` }
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return { valid: false, error: `${rule.field} must be at most ${rule.maxLength} characters` }
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return { valid: false, error: `${rule.field} format is invalid` }
      }
      break

    case "number":
      const num = Number(value)
      if (isNaN(num)) {
        return { valid: false, error: `${rule.field} must be a number` }
      }
      if (rule.min !== undefined && num < rule.min) {
        return { valid: false, error: `${rule.field} must be at least ${rule.min}` }
      }
      if (rule.max !== undefined && num > rule.max) {
        return { valid: false, error: `${rule.field} must be at most ${rule.max}` }
      }
      break

    case "email":
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(String(value))) {
        return { valid: false, error: `${rule.field} must be a valid email` }
      }
      break

    case "url":
      try {
        new URL(String(value))
      } catch {
        return { valid: false, error: `${rule.field} must be a valid URL` }
      }
      break

    case "array":
      if (!Array.isArray(value)) {
        return { valid: false, error: `${rule.field} must be an array` }
      }
      break
  }

  if (rule.custom) {
    const customResult = rule.custom(value)
    if (customResult !== true) {
      return {
        valid: false,
        error: typeof customResult === "string" ? customResult : `${rule.field} validation failed`,
      }
    }
  }

  return { valid: true }
}

export function validateRequest(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = []
    const sanitizedData: any = {}

    for (const rule of rules) {
      const value = req.body[rule.field]
      const result = validateField(value, rule)

      if (!result.valid) {
        errors.push(result.error!)
      } else if (rule.sanitize && value !== null && value !== undefined) {
        sanitizedData[rule.field] = sanitizeInput(value, rule.type)
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      })
    }

    if (Object.keys(sanitizedData).length > 0) {
      req.body = { ...req.body, ...sanitizedData }
    }

    next()
  }
}

export function sanitizeQueryParams(req: Request, res: Response, next: NextFunction) {
  if (req.query) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        sanitized[key] = sanitizeHTML(value)
      } else {
        sanitized[key] = value
      }
    }
    req.query = sanitized
  }
  next()
}
