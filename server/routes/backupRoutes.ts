/**
 * Routes API pour la gestion des backups
 * Endpoints admin pour créer, lister, restaurer et supprimer des backups
 */

import { Router } from "express"
import {
  createBackup,
  listBackups,
  getBackupInfo,
  deleteBackup,
  restoreBackup,
  checkApplicationHealth,
  autoRollbackIfNeeded,
  cleanupOldBackups,
} from "../services/backupService"
import { requireApiToken } from "../middleware/security"

const router = Router()

/**
 * GET /api/backups
 * Lister tous les backups disponibles
 */
router.get("/", requireApiToken, async (req, res) => {
  try {
    const backups = await listBackups()

    res.json({
      success: true,
      count: backups.length,
      backups: backups.map((b) => ({
        filename: b.filename,
        size: b.size,
        sizeFormatted: formatBytes(b.size),
        created: b.created,
        age: getAge(b.created),
      })),
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /api/backups
 * Créer un nouveau backup
 */
router.post("/", requireApiToken, async (req, res) => {
  try {
    const backup = await createBackup()

    res.json({
      success: true,
      message: "Backup créé avec succès",
      backup: {
        filename: backup.filename,
        size: backup.size,
        sizeFormatted: formatBytes(backup.size),
        created: backup.created,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * GET /api/backups/:filename
 * Obtenir les informations d'un backup spécifique
 */
router.get("/:filename", requireApiToken, async (req, res) => {
  try {
    const { filename } = req.params
    const backup = await getBackupInfo(filename)

    if (!backup) {
      return res.status(404).json({
        success: false,
        error: "Backup non trouvé",
      })
    }

    res.json({
      success: true,
      backup: {
        filename: backup.filename,
        size: backup.size,
        sizeFormatted: formatBytes(backup.size),
        created: backup.created,
        age: getAge(backup.created),
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * DELETE /api/backups/:filename
 * Supprimer un backup
 */
router.delete("/:filename", requireApiToken, async (req, res) => {
  try {
    const { filename } = req.params
    await deleteBackup(filename)

    res.json({
      success: true,
      message: "Backup supprimé avec succès",
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /api/backups/:filename/restore
 * Restaurer un backup
 */
router.post("/:filename/restore", requireApiToken, async (req, res) => {
  try {
    const { filename } = req.params

    // Lancer la restauration en arrière-plan
    restoreBackup(filename)
      .then(() => {
        console.log("[Backup API] Restore completed successfully")
      })
      .catch((error) => {
        console.error("[Backup API] Restore failed:", error)
      })

    res.json({
      success: true,
      message: "Restauration démarrée en arrière-plan",
      warning: "L'application va redémarrer dans quelques instants",
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * GET /api/backups/health/check
 * Vérifier la santé de l'application
 */
router.get("/health/check", requireApiToken, async (req, res) => {
  try {
    const isHealthy = await checkApplicationHealth()

    res.json({
      success: true,
      healthy: isHealthy,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /api/backups/rollback/auto
 * Déclencher un rollback automatique si nécessaire
 */
router.post("/rollback/auto", requireApiToken, async (req, res) => {
  try {
    const rolledBack = await autoRollbackIfNeeded()

    res.json({
      success: true,
      rolledBack,
      message: rolledBack ? "Rollback effectué avec succès" : "Aucun rollback nécessaire",
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * POST /api/backups/cleanup
 * Nettoyer les anciens backups
 */
router.post("/cleanup", requireApiToken, async (req, res) => {
  try {
    const { retentionDays = 30 } = req.body
    const deletedCount = await cleanupOldBackups(retentionDays)

    res.json({
      success: true,
      message: `${deletedCount} backups supprimés`,
      deletedCount,
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// Utilitaires
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

function getAge(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) {
    return `${days}j ${hours}h`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes}min`
  }
}

export default router
