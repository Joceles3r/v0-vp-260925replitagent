import { db } from "../db"
import { sql } from "drizzle-orm"

/**
 * Service d'optimisation de la base de données
 * Gère les index, les statistiques et les requêtes lentes
 */
class DatabaseOptimizer {
  /**
   * Crée les index manquants pour optimiser les requêtes fréquentes
   */
  async createMissingIndexes(): Promise<void> {
    const indexes = [
      // Index composites pour les requêtes fréquentes
      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status_created 
          ON projects(status, created_at DESC)`,

      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investments_user_created 
          ON investments(user_id, created_at DESC)`,

      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_type_created 
          ON transactions(user_id, type, created_at DESC)`,

      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read_created 
          ON notifications(user_id, is_read, created_at DESC)`,

      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_posts_status_created 
          ON social_posts(status, created_at DESC)`,

      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_deposits_status_created 
          ON video_deposits(status, created_at DESC)`,

      // Index pour les agrégations
      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investments_project_amount 
          ON investments(project_id, amount)`,

      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_amount 
          ON transactions(user_id, amount)`,

      // Index partiels pour les données actives
      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_active 
          ON projects(created_at DESC) WHERE status = 'active'`,

      sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
          ON notifications(user_id, created_at DESC) WHERE is_read = false`,
    ]

    for (const indexQuery of indexes) {
      try {
        await db.execute(indexQuery)
        console.log("[DB Optimizer] Index created successfully")
      } catch (error) {
        console.error("[DB Optimizer] Error creating index:", error)
      }
    }
  }

  /**
   * Analyse les statistiques de la base de données
   */
  async analyzeDatabase(): Promise<void> {
    try {
      await db.execute(sql`ANALYZE`)
      console.log("[DB Optimizer] Database statistics updated")
    } catch (error) {
      console.error("[DB Optimizer] Error analyzing database:", error)
    }
  }

  /**
   * Identifie les requêtes lentes
   */
  async getSlowQueries(limit = 10): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC
        LIMIT ${limit}
      `)

      return result.rows || []
    } catch (error) {
      console.error("[DB Optimizer] Error getting slow queries:", error)
      return []
    }
  }

  /**
   * Optimise les tables avec VACUUM
   */
  async vacuumTables(): Promise<void> {
    const tables = ["projects", "investments", "transactions", "notifications", "social_posts", "video_deposits"]

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`VACUUM ANALYZE ${table}`))
        console.log(`[DB Optimizer] Vacuumed table: ${table}`)
      } catch (error) {
        console.error(`[DB Optimizer] Error vacuuming ${table}:`, error)
      }
    }
  }

  /**
   * Obtient les statistiques de taille des tables
   */
  async getTableSizes(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 20
      `)

      return result.rows || []
    } catch (error) {
      console.error("[DB Optimizer] Error getting table sizes:", error)
      return []
    }
  }

  /**
   * Obtient les statistiques d'utilisation des index
   */
  async getIndexUsage(): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan ASC
        LIMIT 20
      `)

      return result.rows || []
    } catch (error) {
      console.error("[DB Optimizer] Error getting index usage:", error)
      return []
    }
  }
}

export const databaseOptimizer = new DatabaseOptimizer()
