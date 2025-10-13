import { Router } from "express"
import { asyncHandler } from "../middleware/errorHandler"
import { requireAuth } from "../middleware/auth"
import { db } from "../db"
import { feedbackTable } from "../../shared/schema"
import { logger } from "../config/logger"

const router = Router()

router.post(
  "/feedback",
  asyncHandler(async (req, res) => {
    const { type, message, page, userAgent, screenshot } = req.body
    const userId = (req as any).user?.id

    // Validate input
    if (!type || !message) {
      return res.status(400).json({ error: "Type and message are required" })
    }

    // Store feedback
    const [feedback] = await db
      .insert(feedbackTable)
      .values({
        userId,
        type,
        message,
        page,
        userAgent,
        screenshot,
        createdAt: new Date(),
      })
      .returning()

    logger.info("User feedback received", {
      feedbackId: feedback.id,
      userId,
      type,
      page,
    })

    res.json({ success: true, feedbackId: feedback.id })
  }),
)

router.get(
  "/feedback",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as any).user
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" })
    }

    const feedback = await db.select().from(feedbackTable).orderBy(feedbackTable.createdAt, "desc").limit(100)

    res.json({ feedback })
  }),
)

export default router
