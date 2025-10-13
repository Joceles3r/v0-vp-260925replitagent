/**
 * Utilitaires pour les Push Notifications
 */

/**
 * Convertir une clé VAPID base64 en Uint8Array
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Vérifier si les notifications sont supportées
 */
export function areNotificationsSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window
}

/**
 * Obtenir le statut de permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!areNotificationsSupported()) {
    return "denied"
  }
  return Notification.permission
}
