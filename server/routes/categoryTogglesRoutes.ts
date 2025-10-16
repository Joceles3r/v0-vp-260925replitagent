import { Router } from "express"
import { requireAdmin } from "../middleware/auth"
import { storage } from "../storage"
import { z } from "zod"

const router = Router()

// Schema de validation pour la mise à jour d'un toggle
const updateToggleSchema = z.object({
  enabled: z.boolean(),
})

/**
 * GET /api/admin/categories
 * Récupère toutes les catégories et rubriques avec leur état de visibilité
 */
router.get("/", requireAdmin, async (req, res) => {
  try {
    // Récupérer tous les feature toggles depuis la base de données
    const toggles = await storage.getAllFeatureToggles()

    // Transformer en format attendu par le frontend
    const categories = toggles.map((toggle) => ({
      id: toggle.key,
      name: toggle.label,
      description: toggle.kind === "category" ? "Catégorie de contenu" : "Rubrique",
      enabled: toggle.isVisible,
      kind: toggle.kind,
    }))

    res.json(categories)
  } catch (error) {
    console.error("[Admin] Error fetching categories:", error)
    res.status(500).json({ error: "Failed to fetch categories" })
  }
})

/**
 * PATCH /api/admin/categories/:categoryId
 * Met à jour l'état de visibilité d'une catégorie ou rubrique
 */
router.patch("/:categoryId", requireAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params
    const validation = updateToggleSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({ error: "Invalid request body", details: validation.error })
    }

    const { enabled } = validation.data

    // Mettre à jour le toggle dans la base de données
    await storage.updateFeatureToggle(categoryId, {
      isVisible: enabled,
      updatedBy: req.user?.id || null,
      updatedAt: new Date(),
    })

    res.json({ success: true, categoryId, enabled })
  } catch (error) {
    console.error(`[Admin] Error updating category ${req.params.categoryId}:`, error)
    res.status(500).json({ error: "Failed to update category" })
  }
})

export default router
