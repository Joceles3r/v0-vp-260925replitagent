/**
 * Service de gestion des Push Notifications
 * Backend pour PWA Push API avec web-push
 */

import webpush from "web-push"
import { storage } from "../storage"

// Configuration VAPID (clés pour authentification serveur)
const VAPID_KEYS = {
  publicKey:
    process.env.VAPID_PUBLIC_KEY || "BPWvZ7zHhPqKZ8xQ4RmZKxY1N5F3J8K9L0M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5",
  privateKey: process.env.VAPID_PRIVATE_KEY || "xHkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw",
}

// Configuration web-push
webpush.setVapidDetails("mailto:support@visual.com", VAPID_KEYS.publicKey, VAPID_KEYS.privateKey)

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
}

/**
 * Récupérer la clé publique VAPID
 */
export function getVapidPublicKey(): string {
  return VAPID_KEYS.publicKey
}

/**
 * Enregistrer une subscription
 */
export async function saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
  await storage.savePushSubscription(userId, subscription)
  console.log(`[Push] Subscription saved for user ${userId}`)
}

/**
 * Supprimer une subscription
 */
export async function removeSubscription(userId: string): Promise<void> {
  await storage.removePushSubscription(userId)
  console.log(`[Push] Subscription removed for user ${userId}`)
}

/**
 * Récupérer une subscription
 */
export async function getSubscription(userId: string): Promise<PushSubscription | undefined> {
  return await storage.getPushSubscription(userId)
}

/**
 * Envoyer une notification push à un utilisateur
 */
export async function sendPushNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
  const subscription = await storage.getPushSubscription(userId)

  if (!subscription) {
    console.warn(`[Push] No subscription found for user ${userId}`)
    return false
  }

  try {
    await webpush.sendNotification(subscription as any, JSON.stringify(payload))

    console.log(`[Push] Notification sent to user ${userId}`)
    return true
  } catch (error: any) {
    console.error(`[Push] Error sending notification to ${userId}:`, error)

    // Si subscription expirée/invalide, la supprimer
    if (error.statusCode === 410 || error.statusCode === 404) {
      await storage.removePushSubscription(userId)
      console.log(`[Push] Removed invalid subscription for user ${userId}`)
    }

    return false
  }
}

/**
 * Envoyer une notification à plusieurs utilisateurs
 */
export async function sendPushNotificationToMany(
  userIds: string[],
  payload: NotificationPayload,
): Promise<{ sent: number; failed: number }> {
  const results = await Promise.allSettled(userIds.map((userId) => sendPushNotification(userId, payload)))

  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length
  const failed = results.length - sent

  console.log(`[Push] Batch notification: ${sent} sent, ${failed} failed`)
  return { sent, failed }
}

/**
 * Envoyer une notification à tous les utilisateurs abonnés
 */
export async function broadcastPushNotification(
  payload: NotificationPayload,
): Promise<{ sent: number; failed: number }> {
  const userIds = await storage.getAllPushSubscribedUsers()
  return sendPushNotificationToMany(userIds, payload)
}

/**
 * Notifications prédéfinies pour VISUAL Platform
 */
export const NotificationTemplates = {
  /**
   * Nouvel investissement sur un projet
   */
  newInvestment: (projectTitle: string, amount: number): NotificationPayload => ({
    title: "🎉 Nouvel investissement !",
    body: `Vous avez investi ${amount}€ dans "${projectTitle}"`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "investment",
    data: { type: "investment", url: "/portfolio" },
    actions: [
      { action: "view", title: "Voir le portfolio" },
      { action: "dismiss", title: "Fermer" },
    ],
  }),

  /**
   * Palier de financement atteint
   */
  fundingMilestone: (projectTitle: string, percentage: number): NotificationPayload => ({
    title: "🎯 Palier atteint !",
    body: `"${projectTitle}" a atteint ${percentage}% de son objectif`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "milestone",
    data: { type: "milestone", url: "/projects" },
    requireInteraction: true,
  }),

  /**
   * ROI distribué
   */
  roiDistributed: (amount: number): NotificationPayload => ({
    title: "💰 ROI reçu !",
    body: `Vous avez reçu ${amount.toFixed(2)}€ de gains`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "roi",
    data: { type: "roi", url: "/wallet" },
    requireInteraction: true,
  }),

  /**
   * Live Show démarré
   */
  liveShowStarted: (showTitle: string): NotificationPayload => ({
    title: "🔴 Live en cours !",
    body: `"${showTitle}" vient de commencer`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "live-show",
    data: { type: "live", url: "/live" },
    requireInteraction: true,
    actions: [
      { action: "join", title: "Rejoindre" },
      { action: "dismiss", title: "Plus tard" },
    ],
  }),

  /**
   * Nouveau post social
   */
  newSocialPost: (author: string): NotificationPayload => ({
    title: "💬 Nouveau post",
    body: `${author} a publié un nouveau post`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "social",
    data: { type: "social", url: "/social" },
  }),

  /**
   * Bonus VISUpoints reçu
   */
  visuPointsBonus: (amount: number, reason: string): NotificationPayload => ({
    title: "⭐ Bonus VISUpoints !",
    body: `+${amount} VP - ${reason}`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "visupoints",
    data: { type: "visupoints", url: "/wallet" },
  }),

  /**
   * Alerte découvert
   */
  overdraftAlert: (balance: number): NotificationPayload => ({
    title: "⚠️ Alerte découvert",
    body: `Votre solde est de ${balance.toFixed(2)}€`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "overdraft",
    data: { type: "overdraft", url: "/wallet" },
    requireInteraction: true,
  }),

  /**
   * Signalement validé (modération)
   */
  reportValidated: (visuPoints: number): NotificationPayload => ({
    title: "✅ Signalement validé",
    body: `Merci ! Vous avez reçu ${visuPoints} VISUpoints`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "moderation",
    data: { type: "moderation", url: "/dashboard" },
  }),

  /**
   * Parrainage réussi
   */
  referralSuccess: (referredName: string): NotificationPayload => ({
    title: "🎁 Parrainage réussi !",
    body: `${referredName} a rejoint VISUAL grâce à vous (+100 VP)`,
    icon: "/logo.svg",
    badge: "/badge.png",
    tag: "referral",
    data: { type: "referral", url: "/profile" },
    requireInteraction: true,
  }),
}

export default {
  getVapidPublicKey,
  saveSubscription,
  removeSubscription,
  getSubscription,
  sendPushNotification,
  sendPushNotificationToMany,
  broadcastPushNotification,
  NotificationTemplates,
}
