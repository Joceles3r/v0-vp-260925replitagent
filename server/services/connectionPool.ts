import { Pool } from "pg"

/**
 * Gestionnaire de pool de connexions optimisé
 */
class ConnectionPoolManager {
  private pool: Pool | null = null

  /**
   * Initialise le pool de connexions avec des paramètres optimisés
   */
  initializePool(connectionString: string): Pool {
    if (this.pool) {
      return this.pool
    }

    this.pool = new Pool({
      connectionString,
      // Optimisations du pool
      max: 20, // Maximum 20 connexions
      min: 5, // Minimum 5 connexions actives
      idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30s
      connectionTimeoutMillis: 10000, // Timeout de connexion 10s
      maxUses: 7500, // Recycler les connexions après 7500 utilisations

      // Paramètres de performance PostgreSQL
      statement_timeout: 30000, // Timeout des requêtes à 30s
      query_timeout: 30000,

      // Options de connexion optimisées
      options: "-c statement_timeout=30000 -c idle_in_transaction_session_timeout=60000",
    })

    // Gestion des erreurs du pool
    this.pool.on("error", (err) => {
      console.error("[Connection Pool] Unexpected error:", err)
    })

    this.pool.on("connect", () => {
      console.log("[Connection Pool] New client connected")
    })

    this.pool.on("remove", () => {
      console.log("[Connection Pool] Client removed")
    })

    return this.pool
  }

  /**
   * Obtient les statistiques du pool
   */
  getPoolStats() {
    if (!this.pool) {
      return null
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    }
  }

  /**
   * Ferme le pool proprement
   */
  async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      console.log("[Connection Pool] Pool closed")
    }
  }
}

export const connectionPoolManager = new ConnectionPoolManager()
