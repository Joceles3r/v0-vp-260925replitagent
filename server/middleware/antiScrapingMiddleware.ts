/**
 * Middleware anti-scraping avancé
 * Combine reCAPTCHA, fingerprinting et rate limiting
 */

import type { Request, Response, NextFunction } from "express"
import { verifyRecaptchaToken } from "../services/recaptchaService"
import { analyzeFingerprint, isFingerprintBlocked, type DeviceFingerprint } from "../services/fingerprintService"

export interface AntiScrapingOptions {
  requireRecaptcha?: boolean
  recaptchaThreshold?: number
  requireFingerprint?: boolean
  checkBotPatterns?: boolean
  logSuspicious?: boolean
}

const DEFAULT_OPTIONS: AntiScrapingOptions = {
  requireRecaptcha: true,
  recaptchaThreshold: 0.5,
  requireFingerprint: true,
  checkBotPatterns: true,
  logSuspicious: true,
}

/**
 * Middleware anti-scraping complet
 */
export function antiScraping(options: AntiScrapingOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Vérifier reCAPTCHA si requis
      if (opts.requireRecaptcha) {
        const recaptchaToken = req.headers["x-recaptcha-token"] || (req.body as any)?.recaptchaToken

        if (!recaptchaToken) {
          return res.status(403).json({
            error: "Token reCAPTCHA requis",
            code: "RECAPTCHA_REQUIRED",
          })
        }

        const validation = await verifyRecaptchaToken(recaptchaToken as string)

        if (!validation.isValid || validation.score < (opts.recaptchaThreshold || 0.5)) {
          if (opts.logSuspicious) {
            console.warn("[AntiScraping] reCAPTCHA failed:", {
              ip: req.ip,
              path: req.path,
              score: validation.score,
              reason: validation.reason,
            })
          }

          return res.status(403).json({
            error: "Vérification anti-bot échouée",
            code: "RECAPTCHA_FAILED",
            reason: validation.reason,
          })
        }
        ;(req as any).recaptchaScore = validation.score
      }

      // 2. Vérifier le fingerprint si requis
      if (opts.requireFingerprint) {
        const fingerprintData = req.headers["x-fingerprint-data"]

        if (!fingerprintData) {
          return res.status(403).json({
            error: "Fingerprint requis",
            code: "FINGERPRINT_REQUIRED",
          })
        }

        try {
          const fingerprint: DeviceFingerprint = JSON.parse(fingerprintData as string)
          fingerprint.ip = req.ip || req.socket.remoteAddress || ""
          fingerprint.userAgent = req.get("User-Agent") || ""
          fingerprint.acceptLanguage = req.get("Accept-Language") || ""

          // Vérifier si bloqué
          const isBlocked = await isFingerprintBlocked(fingerprint.visitorId)
          if (isBlocked) {
            if (opts.logSuspicious) {
              console.warn("[AntiScraping] Blocked device attempted access:", {
                visitorId: fingerprint.visitorId,
                ip: req.ip,
                path: req.path,
              })
            }

            return res.status(403).json({
              error: "Appareil bloqué",
              code: "DEVICE_BLOCKED",
            })
          }

          // Analyser le fingerprint
          const suspicious = await analyzeFingerprint(fingerprint)

          if (suspicious.length > 0 && opts.logSuspicious) {
            console.warn("[AntiScraping] Suspicious activity detected:", {
              visitorId: fingerprint.visitorId,
              ip: req.ip,
              path: req.path,
              activities: suspicious,
            })
          }
          ;(req as any).deviceFingerprint = fingerprint
          ;(req as any).suspiciousActivities = suspicious
        } catch (error) {
          console.error("[AntiScraping] Error parsing fingerprint:", error)
          return res.status(400).json({
            error: "Fingerprint invalide",
            code: "INVALID_FINGERPRINT",
          })
        }
      }

      // 3. Vérifier les patterns de bot dans les headers
      if (opts.checkBotPatterns) {
        const userAgent = req.get("User-Agent") || ""
        const botPatterns = [
          /bot/i,
          /crawler/i,
          /spider/i,
          /scraper/i,
          /python/i,
          /curl/i,
          /wget/i,
          /scrapy/i,
          /selenium/i,
          /phantomjs/i,
          /headless/i,
        ]

        for (const pattern of botPatterns) {
          if (pattern.test(userAgent)) {
            if (opts.logSuspicious) {
              console.warn("[AntiScraping] Bot User-Agent detected:", {
                userAgent,
                ip: req.ip,
                path: req.path,
              })
            }

            return res.status(403).json({
              error: "Accès refusé",
              code: "BOT_DETECTED",
            })
          }
        }
      }

      next()
    } catch (error) {
      console.error("[AntiScraping] Middleware error:", error)
      // En cas d'erreur, laisser passer pour ne pas bloquer les utilisateurs légitimes
      next()
    }
  }
}

/**
 * Middleware anti-scraping léger (pour endpoints moins sensibles)
 */
export function antiScrapingLight() {
  return antiScraping({
    requireRecaptcha: false,
    requireFingerprint: true,
    checkBotPatterns: true,
    logSuspicious: true,
  })
}

/**
 * Middleware anti-scraping strict (pour endpoints critiques)
 */
export function antiScrapingStrict() {
  return antiScraping({
    requireRecaptcha: true,
    recaptchaThreshold: 0.7,
    requireFingerprint: true,
    checkBotPatterns: true,
    logSuspicious: true,
  })
}
