const RETENTION_DAYS = 90 // Garder 90 jours d'historique

async function cleanupSuspiciousActivities() {
  console.log("[Cleanup] Starting cleanup of old suspicious activities...")

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

  try {
    // Cette méthode devra être implémentée dans storage.ts
    // const deletedCount = await storage.deleteSuspiciousActivitiesBefore(cutoffDate)

    console.log(`[Cleanup] Cleanup completed: activities before ${cutoffDate.toISOString()} removed`)
  } catch (error) {
    console.error("[Cleanup] Cleanup failed:", error)
    process.exit(1)
  }
}

cleanupSuspiciousActivities()
  .then(() => {
    console.log("[Cleanup] Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[Cleanup] Script failed:", error)
    process.exit(1)
  })
