/**
 * Service de fingerprinting pour détecter les bots et scrapers
 * Utilise FingerprintJS côté client et analyse côté serveur
 */

import { storage } from "../storage"

export interface DeviceFingerprint {
  visitorId: string
  ip: string
  userAgent: string
  acceptLanguage: string
  screenResolution?: string
  timezone?: string
  platform?: string
  vendor?: string
  plugins?: string[]
  canvas?: string
  webgl?: string
  fonts?: string[]
  audio?: string
  timestamp: number
}

export interface SuspiciousActivity {
  fingerprintId: string
  reason: string
  severity: "low" | "medium" | "high"
  timestamp: number
  metadata?: any
}

// Patterns de User-Agent suspects
const SUSPICIOUS_USER_AGENTS = [
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

// Patterns d'IP suspects (VPN, proxies, datacenters connus)
const SUSPICIOUS_IP_RANGES = [
  // Tor exit nodes (exemple)
  /^185\.220\./,
  // Datacenters connus (à compléter)
  /^104\.244\./,
]

/**
 * Analyser un fingerprint pour détecter des comportements suspects
 */
export async function analyzeFingerprint(fingerprint: DeviceFingerprint): Promise<SuspiciousActivity[]> {
  const suspicious: SuspiciousActivity[] = []

  // 1. Vérifier le User-Agent
  for (const pattern of SUSPICIOUS_USER_AGENTS) {
    if (pattern.test(fingerprint.userAgent)) {
      suspicious.push({
        fingerprintId: fingerprint.visitorId,
        reason: `Suspicious User-Agent: ${fingerprint.userAgent}`,
        severity: "high",
        timestamp: Date.now(),
        metadata: { pattern: pattern.source },
      })
      break
    }
  }

  // 2. Vérifier l'IP
  for (const pattern of SUSPICIOUS_IP_RANGES) {
    if (pattern.test(fingerprint.ip)) {
      suspicious.push({
        fingerprintId: fingerprint.visitorId,
        reason: `Suspicious IP range: ${fingerprint.ip}`,
        severity: "medium",
        timestamp: Date.now(),
      })
      break
    }
  }

  // 3. Vérifier les incohérences (ex: pas de canvas/webgl = headless browser)
  if (!fingerprint.canvas || !fingerprint.webgl) {
    suspicious.push({
      fingerprintId: fingerprint.visitorId,
      reason: "Missing canvas/webgl fingerprint (possible headless browser)",
      severity: "medium",
      timestamp: Date.now(),
    })
  }

  // 4. Vérifier la fréquence de requêtes
  const recentActivity = await getRecentActivity(fingerprint.visitorId)
  if (recentActivity.length > 100) {
    // Plus de 100 requêtes en 5 minutes
    suspicious.push({
      fingerprintId: fingerprint.visitorId,
      reason: `High request frequency: ${recentActivity.length} requests in 5 minutes`,
      severity: "high",
      timestamp: Date.now(),
      metadata: { requestCount: recentActivity.length },
    })
  }

  // 5. Vérifier les patterns de navigation (trop rapide, pas de mouvement souris, etc.)
  const navigationPattern = await analyzeNavigationPattern(fingerprint.visitorId)
  if (navigationPattern.isSuspicious) {
    suspicious.push({
      fingerprintId: fingerprint.visitorId,
      reason: navigationPattern.reason,
      severity: "medium",
      timestamp: Date.now(),
      metadata: navigationPattern.metadata,
    })
  }

  // Sauvegarder les activités suspectes
  if (suspicious.length > 0) {
    await storage.saveSuspiciousActivity(suspicious)
  }

  return suspicious
}

/**
 * Vérifier si un fingerprint est bloqué
 */
export async function isFingerprintBlocked(visitorId: string): Promise<boolean> {
  const blocked = await storage.isDeviceBlocked(visitorId)
  return blocked
}

/**
 * Bloquer un fingerprint
 */
export async function blockFingerprint(
  visitorId: string,
  reason: string,
  duration: number = 24 * 60 * 60 * 1000,
): Promise<void> {
  await storage.blockDevice(visitorId, reason, duration)
  console.log(`[Fingerprint] Blocked device ${visitorId} for ${duration}ms: ${reason}`)
}

/**
 * Récupérer l'activité récente d'un fingerprint
 */
async function getRecentActivity(visitorId: string): Promise<any[]> {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  return await storage.getDeviceActivity(visitorId, fiveMinutesAgo)
}

/**
 * Analyser le pattern de navigation
 */
async function analyzeNavigationPattern(visitorId: string): Promise<{
  isSuspicious: boolean
  reason: string
  metadata?: any
}> {
  const activity = await storage.getDeviceActivity(visitorId, Date.now() - 60 * 60 * 1000) // 1 heure

  if (activity.length === 0) {
    return { isSuspicious: false, reason: "" }
  }

  // Calculer le temps moyen entre les requêtes
  const intervals: number[] = []
  for (let i = 1; i < activity.length; i++) {
    intervals.push(activity[i].timestamp - activity[i - 1].timestamp)
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

  // Si les requêtes sont trop régulières (bot-like), c'est suspect
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
  const stdDev = Math.sqrt(variance)

  if (stdDev < 100 && avgInterval < 2000) {
    // Très régulier et très rapide
    return {
      isSuspicious: true,
      reason: "Bot-like navigation pattern (too regular and fast)",
      metadata: { avgInterval, stdDev, requestCount: activity.length },
    }
  }

  return { isSuspicious: false, reason: "" }
}

/**
 * Middleware Express pour vérifier le fingerprint
 */
export function requireFingerprint() {
  return async (req: any, res: any, next: any) => {
    const fingerprintData = req.headers["x-fingerprint-data"]

    if (!fingerprintData) {
      return res.status(403).json({
        error: "Fingerprint requis",
        code: "FINGERPRINT_REQUIRED",
      })
    }

    try {
      const fingerprint: DeviceFingerprint = JSON.parse(fingerprintData as string)

      // Ajouter l'IP et User-Agent du serveur
      fingerprint.ip = req.ip || req.connection.remoteAddress
      fingerprint.userAgent = req.get("User-Agent") || ""
      fingerprint.acceptLanguage = req.get("Accept-Language") || ""

      // Vérifier si bloqué
      const isBlocked = await isFingerprintBlocked(fingerprint.visitorId)
      if (isBlocked) {
        return res.status(403).json({
          error: "Appareil bloqué",
          code: "DEVICE_BLOCKED",
        })
      }

      // Analyser le fingerprint
      const suspicious = await analyzeFingerprint(fingerprint)

      // Si trop d'activités suspectes, bloquer
      const highSeverityCount = suspicious.filter((s) => s.severity === "high").length
      if (highSeverityCount >= 2) {
        await blockFingerprint(fingerprint.visitorId, "Multiple high-severity suspicious activities")
        return res.status(403).json({
          error: "Activité suspecte détectée",
          code: "SUSPICIOUS_ACTIVITY",
        })
      }

      // Enregistrer l'activité
      await storage.recordDeviceActivity({
        visitorId: fingerprint.visitorId,
        path: req.path,
        method: req.method,
        timestamp: Date.now(),
      })

      // Ajouter le fingerprint à la requête
      req.deviceFingerprint = fingerprint
      req.suspiciousActivities = suspicious

      next()
    } catch (error) {
      console.error("[Fingerprint] Error parsing fingerprint:", error)
      return res.status(400).json({
        error: "Fingerprint invalide",
        code: "INVALID_FINGERPRINT",
      })
    }
  }
}
