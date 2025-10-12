import { Router } from "express"
import { databaseOptimizer } from "../services/databaseOptimizer"
import { queryOptimizer } from "../services/queryOptimizer"
import { connectionPoolManager } from "../services/connectionPool"
import { requireAuth } from "../middleware/auth"
import { hasProfile } from "@shared/utils"
import { storage } from "../storage"

const router = Router()

/**
 * Routes d'optimisation (Admin uniquement)
 */

// Obtenir les statistiques de performance
router.get("/stats", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub
    const user = await storage.getUser(userId)

    if (!user || !hasProfile(user.profileTypes, "admin")) {
      return res.status(403).json({ message: "Admin access required" })
    }

    const [tableSizes, indexUsage, slowQueries, poolStats] = await Promise.all([
      databaseOptimizer.getTableSizes(),
      databaseOptimizer.getIndexUsage(),
      databaseOptimizer.getSlowQueries(10),
      Promise.resolve(connectionPoolManager.getPoolStats()),
    ])

    res.json({
      tableSizes,
      indexUsage,
      slowQueries,
      poolStats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching optimization stats:", error)
    res.status(500).json({ message: "Failed to fetch optimization stats" })
  }
})

// Créer les index manquants
router.post("/indexes/create", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub
    const user = await storage.getUser(userId)

    if (!user || !hasProfile(user.profileTypes, "admin")) {
      return res.status(403).json({ message: "Admin access required" })
    }

    await databaseOptimizer.createMissingIndexes()

    res.json({
      success: true,
      message: "Missing indexes created successfully",
    })
  } catch (error) {
    console.error("Error creating indexes:", error)
    res.status(500).json({ message: "Failed to create indexes" })
  }
})

// Analyser la base de données
router.post("/analyze", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub
    const user = await storage.getUser(userId)

    if (!user || !hasProfile(user.profileTypes, "admin")) {
      return res.status(403).json({ message: "Admin access required" })
    }

    await databaseOptimizer.analyzeDatabase()

    res.json({
      success: true,
      message: "Database analyzed successfully",
    })
  } catch (error) {
    console.error("Error analyzing database:", error)
    res.status(500).json({ message: "Failed to analyze database" })
  }
})

// Vacuum des tables
router.post("/vacuum", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub
    const user = await storage.getUser(userId)

    if (!user || !hasProfile(user.profileTypes, "admin")) {
      return res.status(403).json({ message: "Admin access required" })
    }

    await databaseOptimizer.vacuumTables()

    res.json({
      success: true,
      message: "Tables vacuumed successfully",
    })
  } catch (error) {
    console.error("Error vacuuming tables:", error)
    res.status(500).json({ message: "Failed to vacuum tables" })
  }
})

// Invalider le cache
router.post("/cache/invalidate", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub
    const user = await storage.getUser(userId)

    if (!user || !hasProfile(user.profileTypes, "admin")) {
      return res.status(403).json({ message: "Admin access required" })
    }

    const { key, pattern } = req.body

    if (key) {
      queryOptimizer.invalidateCache(key)
    } else if (pattern) {
      queryOptimizer.invalidateCachePattern(new RegExp(pattern))
    }

    res.json({
      success: true,
      message: "Cache invalidated successfully",
    })
  } catch (error) {
    console.error("Error invalidating cache:", error)
    res.status(500).json({ message: "Failed to invalidate cache" })
  }
})

export function registerOptimizationRoutes(app: any) {
  app.use("/api/optimization", router)
  console.log("[Optimization API] Routes registered")
}
