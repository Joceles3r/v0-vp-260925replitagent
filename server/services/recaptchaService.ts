/**
 * Service reCAPTCHA v3 pour VISUAL Platform
 * Protection anti-bot et anti-scraping
 */

import fetch from "node-fetch"

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || ""
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
const RECAPTCHA_THRESHOLD = 0.5 // Score minimum acceptable (0.0 = bot, 1.0 = humain)

export interface RecaptchaVerificationResult {
  success: boolean
  score: number
  action: string
  challenge_ts: string
  hostname: string
  "error-codes"?: string[]
}

export interface RecaptchaValidation {
  isValid: boolean
  score: number
  reason?: string
}

/**
 * Vérifier un token reCAPTCHA v3
 */
export async function verifyRecaptchaToken(token: string, expectedAction?: string): Promise<RecaptchaValidation> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn("[reCAPTCHA] Secret key not configured, skipping verification")
    return { isValid: true, score: 1.0, reason: "disabled" }
  }

  if (!token) {
    return { isValid: false, score: 0, reason: "missing_token" }
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const result: RecaptchaVerificationResult = await response.json()

    if (!result.success) {
      console.warn("[reCAPTCHA] Verification failed:", result["error-codes"])
      return {
        isValid: false,
        score: 0,
        reason: result["error-codes"]?.join(", ") || "verification_failed",
      }
    }

    // Vérifier l'action si spécifiée
    if (expectedAction && result.action !== expectedAction) {
      console.warn("[reCAPTCHA] Action mismatch:", {
        expected: expectedAction,
        received: result.action,
      })
      return {
        isValid: false,
        score: result.score,
        reason: "action_mismatch",
      }
    }

    // Vérifier le score
    if (result.score < RECAPTCHA_THRESHOLD) {
      console.warn("[reCAPTCHA] Score too low:", result.score)
      return {
        isValid: false,
        score: result.score,
        reason: "low_score",
      }
    }

    console.log("[reCAPTCHA] Verification successful:", {
      score: result.score,
      action: result.action,
    })

    return {
      isValid: true,
      score: result.score,
    }
  } catch (error) {
    console.error("[reCAPTCHA] Verification error:", error)
    return {
      isValid: false,
      score: 0,
      reason: "network_error",
    }
  }
}

/**
 * Middleware Express pour vérifier reCAPTCHA
 */
export function requireRecaptcha(expectedAction?: string) {
  return async (req: any, res: any, next: any) => {
    const token = req.headers["x-recaptcha-token"] || req.body?.recaptchaToken || req.query?.recaptchaToken

    const validation = await verifyRecaptchaToken(token, expectedAction)

    if (!validation.isValid) {
      return res.status(403).json({
        error: "Vérification reCAPTCHA échouée",
        code: "RECAPTCHA_FAILED",
        reason: validation.reason,
      })
    }

    // Ajouter le score à la requête pour logging
    req.recaptchaScore = validation.score

    next()
  }
}

/**
 * Vérifier reCAPTCHA avec seuil personnalisé
 */
export function requireRecaptchaWithThreshold(threshold: number, expectedAction?: string) {
  return async (req: any, res: any, next: any) => {
    const token = req.headers["x-recaptcha-token"] || req.body?.recaptchaToken || req.query?.recaptchaToken

    const validation = await verifyRecaptchaToken(token, expectedAction)

    if (!validation.isValid || validation.score < threshold) {
      return res.status(403).json({
        error: "Vérification reCAPTCHA échouée",
        code: "RECAPTCHA_FAILED",
        reason: validation.reason || "threshold_not_met",
        score: validation.score,
        threshold,
      })
    }

    req.recaptchaScore = validation.score
    next()
  }
}
