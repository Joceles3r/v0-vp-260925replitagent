/**
 * Service de synchronisation offline
 * Gère les actions en attente et la synchronisation en arrière-plan
 */

export interface PendingAction {
  id: string
  type: "investment" | "like" | "comment" | "vote" | "report"
  data: any
  timestamp: number
  retries: number
}

const PENDING_ACTIONS_KEY = "visual_pending_actions"
const MAX_RETRIES = 3

export class OfflineSyncService {
  private static instance: OfflineSyncService
  private pendingActions: PendingAction[] = []
  private isSyncing = false

  private constructor() {
    this.loadPendingActions()
    this.setupEventListeners()
  }

  static getInstance(): OfflineSyncService {
    if (!OfflineSyncService.instance) {
      OfflineSyncService.instance = new OfflineSyncService()
    }
    return OfflineSyncService.instance
  }

  /**
   * Charger les actions en attente depuis le localStorage
   */
  private loadPendingActions(): void {
    try {
      const stored = localStorage.getItem(PENDING_ACTIONS_KEY)
      if (stored) {
        this.pendingActions = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[OfflineSync] Error loading pending actions:", error)
      this.pendingActions = []
    }
  }

  /**
   * Sauvegarder les actions en attente
   */
  private savePendingActions(): void {
    try {
      localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(this.pendingActions))
    } catch (error) {
      console.error("[OfflineSync] Error saving pending actions:", error)
    }
  }

  /**
   * Configurer les écouteurs d'événements
   */
  private setupEventListeners(): void {
    // Synchroniser quand la connexion revient
    window.addEventListener("online", () => {
      console.log("[OfflineSync] Connection restored, syncing...")
      this.syncPendingActions()
    })

    // Enregistrer la synchronisation en arrière-plan
    if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register("background-sync").catch((error) => {
          console.error("[OfflineSync] Background sync registration failed:", error)
        })
      })
    }
  }

  /**
   * Ajouter une action en attente
   */
  addPendingAction(type: PendingAction["type"], data: any): string {
    const action: PendingAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    }

    this.pendingActions.push(action)
    this.savePendingActions()

    console.log("[OfflineSync] Action added:", action.id)

    // Essayer de synchroniser immédiatement si en ligne
    if (navigator.onLine) {
      this.syncPendingActions()
    }

    return action.id
  }

  /**
   * Synchroniser toutes les actions en attente
   */
  async syncPendingActions(): Promise<void> {
    if (this.isSyncing || this.pendingActions.length === 0) {
      return
    }

    this.isSyncing = true
    console.log("[OfflineSync] Syncing", this.pendingActions.length, "actions...")

    const actionsToSync = [...this.pendingActions]
    const failedActions: PendingAction[] = []

    for (const action of actionsToSync) {
      try {
        await this.syncAction(action)
        console.log("[OfflineSync] Action synced:", action.id)
      } catch (error) {
        console.error("[OfflineSync] Action sync failed:", action.id, error)

        action.retries++
        if (action.retries < MAX_RETRIES) {
          failedActions.push(action)
        } else {
          console.warn("[OfflineSync] Action abandoned after max retries:", action.id)
        }
      }
    }

    this.pendingActions = failedActions
    this.savePendingActions()
    this.isSyncing = false

    console.log("[OfflineSync] Sync complete. Remaining:", this.pendingActions.length)
  }

  /**
   * Synchroniser une action spécifique
   */
  private async syncAction(action: PendingAction): Promise<void> {
    const endpoints: Record<PendingAction["type"], string> = {
      investment: "/api/invest",
      like: "/api/social/like",
      comment: "/api/social/comment",
      vote: "/api/vote",
      report: "/api/moderation/report",
    }

    const endpoint = endpoints[action.type]
    if (!endpoint) {
      throw new Error(`Unknown action type: ${action.type}`)
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(action.data),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  /**
   * Obtenir le nombre d'actions en attente
   */
  getPendingCount(): number {
    return this.pendingActions.length
  }

  /**
   * Vider toutes les actions en attente
   */
  clearPendingActions(): void {
    this.pendingActions = []
    this.savePendingActions()
    console.log("[OfflineSync] All pending actions cleared")
  }
}

// Export singleton
export const offlineSyncService = OfflineSyncService.getInstance()
