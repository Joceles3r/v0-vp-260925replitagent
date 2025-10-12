import { Router } from "express"
import { storage } from "../storage"
import pushService from "../services/pushNotificationService"
import { requireAuth } from "../middleware/auth"
import { logger } from "../config/logger"

const router = Router()

/**
 * GET /api/push/vapid-public-key
 * Récupérer la clé publique VAPID pour l'inscription
 */
router.get("/vapid-public-key", (req, res) => {
  try {
    const publicKey = pushService.getVapidPublicKey()
    res.json({ publicKey })
  } catch (error) {
    logger.error("[Push API] Error getting VAPID key:", error)
    res.status(500).json({ error: "Failed to get VAPID key" })
  }
})

/**
 * POST /api/push/subscribe
 * Enregistrer une subscription push pour l'utilisateur
 */
router.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const { subscription } = req.body

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Invalid subscription data" })
    }

    // Sauvegarder la subscription en base de données
    await storage.savePushSubscription(userId, subscription)

    // Sauvegarder aussi en mémoire pour le service
    pushService.saveSubscription(userId, subscription)

    logger.info(`[Push API] Subscription saved for user ${userId}`)
    res.json({ success: true })
  } catch (error) {
    logger.error("[Push API] Error saving subscription:", error)
    res.status(500).json({ error: "Failed to save subscription" })
  }
})

/**
 * POST /api/push/unsubscribe
 * Supprimer la subscription push de l'utilisateur
 */
router.post("/unsubscribe", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id

    // Supprimer de la base de données
    await storage.removePushSubscription(userId)

    // Supprimer de la mémoire
    pushService.removeSubscription(userId)

    logger.info(`[Push API] Subscription removed for user ${userId}`)
    res.json({ success: true })
  } catch (error) {
    logger.error("[Push API] Error removing subscription:", error)
    res.status(500).json({ error: "Failed to remove subscription" })
  }
})

/**
 * POST /api/push/test
 * Envoyer une notification de test à l'utilisateur
 */
router.post("/test", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id

    const testPayload = {
      title: "Test de notification",
      body: "Votre système de notifications push fonctionne correctement !",
      icon: "/logo.svg",
      badge: "/badge.png",
      tag: "test",
      data: { type: "test", url: "/dashboard" },
    }

    const sent = await pushService.sendPushNotification(userId, testPayload)

    if (sent) {
      logger.info(`[Push API] Test notification sent to user ${userId}`)
      res.json({ success: true, message: "Test notification sent" })
    } else {
      res.status(404).json({ error: "No subscription found for user" })
    }
  } catch (error) {
    logger.error("[Push API] Error sending test notification:", error)
    res.status(500).json({ error: "Failed to send test notification" })
  }
})

/**
 * GET /api/push/status
 * Vérifier le statut de la subscription de l'utilisateur
 */
router.get("/status", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const subscription = await storage.getPushSubscription(userId)

    res.json({
      subscribed: !!subscription,
      subscription: subscription || null,
    })
  } catch (error) {
    logger.error("[Push API] Error checking subscription status:", error)
    res.status(500).json({ error: "Failed to check subscription status" })
  }
})

/**
 * POST /api/push/send (Admin only)
 * Envoyer une notification à un ou plusieurs utilisateurs
 */
router.post("/send", requireAuth, async (req, res) => {
  try {
    const { userIds, payload } = req.body

    // Vérifier que l'utilisateur est admin
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: "Admin access required" })
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "Invalid userIds array" })
    }

    if (!payload || !payload.title || !payload.body) {
      return res.status(400).json({ error: "Invalid notification payload" })
    }

    const result = await pushService.sendPushNotificationToMany(userIds, payload)

    logger.info(`[Push API] Batch notification sent: ${result.sent} sent, ${result.failed} failed`)
    res.json(result)
  } catch (error) {
    logger.error("[Push API] Error sending batch notification:", error)
    res.status(500).json({ error: "Failed to send notifications" })
  }
})

/**
 * POST /api/push/broadcast (Admin only)
 * Envoyer une notification à tous les utilisateurs abonnés
 */
router.post("/broadcast", requireAuth, async (req, res) => {
  try {
    const { payload } = req.body

    // Vérifier que l'utilisateur est admin
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: "Admin access required" })
    }

    if (!payload || !payload.title || !payload.body) {
      return res.status(400).json({ error: "Invalid notification payload" })
    }

    const result = await pushService.broadcastPushNotification(payload)

    logger.info(`[Push API] Broadcast notification sent: ${result.sent} sent, ${result.failed} failed`)
    res.json(result)
  } catch (error) {
    logger.error("[Push API] Error broadcasting notification:", error)
    res.status(500).json({ error: "Failed to broadcast notification" })
  }
})

export function registerPushNotificationRoutes(app: any) {
  app.use("/api/push", router)
  logger.info("[Push API] Push notification routes registered")
}
