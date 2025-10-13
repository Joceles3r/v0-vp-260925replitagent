/**
 * Service de backup automatique pour VISUAL Platform
 * Gère les backups programmés et la restauration
 */

import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

export interface BackupMetadata {
  timestamp: string
  database: string
  version: string
  node_version: string
  backup_size: string
}

export interface BackupInfo {
  filename: string
  path: string
  size: number
  created: Date
  metadata?: BackupMetadata
}

const BACKUP_DIR = process.env.BACKUP_DIR || "/backups"
const BACKUP_SCRIPT = path.join(process.cwd(), "scripts/auto-backup.sh")
const ROLLBACK_SCRIPT = path.join(process.cwd(), "scripts/auto-rollback.sh")

/**
 * Créer un backup manuel
 */
export async function createBackup(): Promise<BackupInfo> {
  console.log("[Backup] Starting manual backup...")

  try {
    const { stdout, stderr } = await execAsync(`bash ${BACKUP_SCRIPT}`)

    if (stderr && !stderr.includes("[INFO]")) {
      console.error("[Backup] Errors during backup:", stderr)
    }

    console.log("[Backup] Output:", stdout)

    // Récupérer le dernier backup créé
    const backups = await listBackups()
    const latestBackup = backups[0]

    console.log("[Backup] Backup created successfully:", latestBackup.filename)

    return latestBackup
  } catch (error) {
    console.error("[Backup] Failed to create backup:", error)
    throw new Error(`Backup failed: ${error}`)
  }
}

/**
 * Lister tous les backups disponibles
 */
export async function listBackups(): Promise<BackupInfo[]> {
  try {
    const files = await fs.readdir(BACKUP_DIR)
    const backupFiles = files.filter((f) => f.startsWith("visual_backup_") && f.endsWith(".tar.gz"))

    const backups: BackupInfo[] = []

    for (const filename of backupFiles) {
      const filePath = path.join(BACKUP_DIR, filename)
      const stats = await fs.stat(filePath)

      backups.push({
        filename,
        path: filePath,
        size: stats.size,
        created: stats.mtime,
      })
    }

    // Trier par date décroissante
    backups.sort((a, b) => b.created.getTime() - a.created.getTime())

    return backups
  } catch (error) {
    console.error("[Backup] Failed to list backups:", error)
    return []
  }
}

/**
 * Obtenir les informations d'un backup spécifique
 */
export async function getBackupInfo(filename: string): Promise<BackupInfo | null> {
  const backups = await listBackups()
  return backups.find((b) => b.filename === filename) || null
}

/**
 * Supprimer un backup
 */
export async function deleteBackup(filename: string): Promise<void> {
  const filePath = path.join(BACKUP_DIR, filename)

  try {
    await fs.unlink(filePath)
    console.log("[Backup] Deleted backup:", filename)
  } catch (error) {
    console.error("[Backup] Failed to delete backup:", error)
    throw new Error(`Failed to delete backup: ${error}`)
  }
}

/**
 * Restaurer un backup
 */
export async function restoreBackup(filename: string): Promise<void> {
  console.log("[Backup] Starting restore from:", filename)

  const backupPath = path.join(BACKUP_DIR, filename)

  // Vérifier que le backup existe
  try {
    await fs.access(backupPath)
  } catch (error) {
    throw new Error(`Backup not found: ${filename}`)
  }

  try {
    // Utiliser le script de rollback avec le backup spécifié
    const { stdout, stderr } = await execAsync(`LATEST_BACKUP=${backupPath} bash ${ROLLBACK_SCRIPT}`)

    if (stderr && !stderr.includes("[INFO]")) {
      console.error("[Backup] Errors during restore:", stderr)
    }

    console.log("[Backup] Restore output:", stdout)
    console.log("[Backup] Restore completed successfully")
  } catch (error) {
    console.error("[Backup] Failed to restore backup:", error)
    throw new Error(`Restore failed: ${error}`)
  }
}

/**
 * Vérifier la santé de l'application
 */
export async function checkApplicationHealth(): Promise<boolean> {
  const healthUrl = process.env.HEALTH_CHECK_URL || "http://localhost:5000/healthz"

  try {
    const response = await fetch(healthUrl)
    return response.ok
  } catch (error) {
    console.error("[Backup] Health check failed:", error)
    return false
  }
}

/**
 * Effectuer un rollback automatique si nécessaire
 */
export async function autoRollbackIfNeeded(): Promise<boolean> {
  console.log("[Backup] Checking if rollback is needed...")

  const isHealthy = await checkApplicationHealth()

  if (isHealthy) {
    console.log("[Backup] Application is healthy, no rollback needed")
    return false
  }

  console.warn("[Backup] Application is unhealthy, triggering automatic rollback...")

  try {
    const { stdout, stderr } = await execAsync(`bash ${ROLLBACK_SCRIPT}`)

    if (stderr && !stderr.includes("[INFO]")) {
      console.error("[Backup] Errors during rollback:", stderr)
    }

    console.log("[Backup] Rollback output:", stdout)

    // Vérifier à nouveau la santé
    const isHealthyAfterRollback = await checkApplicationHealth()

    if (isHealthyAfterRollback) {
      console.log("[Backup] Rollback successful, application is now healthy")
      return true
    } else {
      console.error("[Backup] Rollback completed but application is still unhealthy")
      return false
    }
  } catch (error) {
    console.error("[Backup] Rollback failed:", error)
    return false
  }
}

/**
 * Nettoyer les anciens backups
 */
export async function cleanupOldBackups(retentionDays = 30): Promise<number> {
  console.log(`[Backup] Cleaning up backups older than ${retentionDays} days...`)

  const backups = await listBackups()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  let deletedCount = 0

  for (const backup of backups) {
    if (backup.created < cutoffDate) {
      try {
        await deleteBackup(backup.filename)
        deletedCount++
      } catch (error) {
        console.error(`[Backup] Failed to delete old backup ${backup.filename}:`, error)
      }
    }
  }

  console.log(`[Backup] Cleaned up ${deletedCount} old backups`)
  return deletedCount
}
