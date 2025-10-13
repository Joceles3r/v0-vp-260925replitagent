/**
 * Service centralisé pour les notifications PWA
 * Gère les permissions, subscriptions et envoi de notifications
 */

import { urlBase64ToUint8Array } from "../utils/pushUtils"

export interface NotificationPermissionState {
  permission: NotificationPermission
  isSupported: boolean
  isSubscribed: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private registration: ServiceWorkerRegistration | null = null
  private subscription: PushSubscription | null = null

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Initialiser le service
   */
  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      console.warn("[Notifications] Push notifications not supported")
      return
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      this.subscription = await this.registration.pushManager.getSubscription()
      console.log("[Notifications] Service initialized")
    } catch (error) {
      console.error("[Notifications] Initialization error:", error)
    }
  }

  /**
   * Vérifier le support des notifications
   */
  isSupported(): boolean {
    return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window
  }

  /**
   * Obtenir l'état actuel
   */
  async getState(): Promise<NotificationPermissionState> {
    await this.initialize()

    return {
      permission: Notification.permission,
      isSupported: this.isSupported(),
      isSubscribed: this.subscription !== null,
    }
  }

  /**
   * Demander la permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error("Push notifications not supported")
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  /**
   * S'abonner aux notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize()
    }

    if (!this.registration) {
      throw new Error("Service Worker not registered")
    }

    if (Notification.permission !== "granted") {
      const granted = await this.requestPermission()
      if (!granted) {
        throw new Error("Notification permission denied")
      }
    }

    try {
      // Récupérer la clé VAPID publique
      const response = await fetch("/api/push/vapid-public-key")
      const { publicKey } = await response.json()

      // Créer la subscription
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Envoyer au serveur
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subscription: this.subscription.toJSON(),
        }),
      })

      console.log("[Notifications] Subscribed successfully")
      return this.subscription
    } catch (error) {
      console.error("[Notifications] Subscription error:", error)
      throw error
    }
  }

  /**
   * Se désabonner
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return false
    }

    try {
      await this.subscription.unsubscribe()

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          endpoint: this.subscription.endpoint,
        }),
      })

      this.subscription = null
      console.log("[Notifications] Unsubscribed successfully")
      return true
    } catch (error) {
      console.error("[Notifications] Unsubscribe error:", error)
      return false
    }
  }

  /**
   * Envoyer une notification test
   */
  async sendTestNotification(): Promise<void> {
    if (!this.subscription) {
      throw new Error("Not subscribed to notifications")
    }

    await fetch("/api/push/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
  }

  /**
   * Obtenir la subscription actuelle
   */
  getSubscription(): PushSubscription | null {
    return this.subscription
  }
}

// Export singleton
export const notificationService = NotificationService.getInstance()
