import express, { type Express } from "express"
import { createServer, type Server } from "http"
import Stripe from "stripe"
import { storage } from "./storage"
import { db } from "./db"
import { liveShowFinalists, liveShowAudit } from "@shared/schema"
import { eq, desc } from "drizzle-orm"
import { isAuthenticated, getSession } from "./replitAuth"
import {
  insertProjectSchema,
  insertInvestmentSchema,
  // Schémas Live Show
  designateFinalistsSchema,
  cancelParticipationSchema,
} from "@shared/schema"
import { getMinimumCautionAmountForUser, hasProfile } from "@shared/utils"
import { ALLOWED_INVESTMENT_AMOUNTS, isValidInvestmentAmount, STRIPE_CONFIG } from "@shared/constants"
import { z } from "zod"
import multer from "multer"
import { mlScoreProject } from "./services/mlScoring"
import { initializeWebSocket } from "./websocket"
import { notificationService } from "./services/notificationService"
import { liveShowOrchestrator } from "./services/liveShowOrchestrator"
import { generateReceiptPDF } from "./receipts/handlers"
import { registerPushNotificationRoutes } from "./routes/pushNotificationRoutes"
import backupRoutes from "./routes/backupRoutes"
import livresRoutes from "./routes/livresRoutes"
import categoryTogglesRoutes from "./routes/categoryTogglesRoutes"

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY")
}
// Validate key format (never log secret value)
const isTestKey = process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")
const isLiveKey = process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")
const isValidSecret = isTestKey || isLiveKey
if (!isValidSecret) {
  console.warn(
    "[Stripe] ⚠️ STRIPE_SECRET_KEY does not have valid format (sk_test_ or sk_live_). Payment operations may fail.",
  )
}
console.log(`[Stripe] Initialized with ${isTestKey ? "TEST" : isLiveKey ? "LIVE" : "UNKNOWN"} mode key`)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_CONFIG.API_VERSION as any, // Configuration centralisée et configurable
})

// Function getMinimumCautionAmount is now imported from @shared/utils

// File upload configuration
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit to match VideoDepositService specs
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Invalid file type. Only video files are allowed."))
    }
  },
})

export async function registerRoutes(app: Express): Promise<Server> {
  // Revenue Engine - Stripe Webhooks (MUST be BEFORE JSON middleware)
  const { saleArticleSplit: saleArticleSplitEngine, categoryClosureSplit: categoryClosureSplitEngine } = await import(
    "./revenue/revenueEngine"
  )
  const {
    isStripeEventProcessed: isEventProcessed,
    recordStripeEvent: recordEvent,
    persistPayoutPlan: persistPlan,
  } = await import("./revenue/dbHelpers")
  const { appendAudit: auditLog } = await import("./audit/ledger")

  app.post("/webhooks/stripe/revenue", express.raw({ type: "application/json" }), async (req: any, res) => {
    const sig = req.headers["stripe-signature"]
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET for revenue webhook")
      return res.status(500).json({ error: "Webhook secret not configured" })
    }

    let event
    try {
      // Valider la signature Stripe (sécurité critique)
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err: any) {
      console.error("Revenue webhook signature verification failed:", err.message)
      return res.status(400).json({ error: "Invalid signature" })
    }

    const eventId = event.id
    const eventType = event.type

    // Vérifier idempotence
    if (await isEventProcessed(eventId)) {
      console.log(`✅ Revenue event ${eventId} already processed (idempotent)`)
      return res.json({ ok: true, duplicate: true })
    }

    const data = (event.data?.object as any) || {}
    const metadata = data.metadata || {}

    // Vente d'article (infoporteur)
    if (eventType === "checkout.session.completed" && metadata.kind === "article_sale") {
      const priceCents = Number.parseInt(data.amount_total || "0")
      const porterAccount = metadata.porter_account_id
      const visualAccount = metadata.visual_account_id || "acc_visual"

      const plan = saleArticleSplitEngine(priceCents, porterAccount, visualAccount)
      await persistPlan(eventId, "article_sale", plan, event)
      auditLog("stripe_sale_planned", "system", { event: eventId, amount: priceCents })

      console.log(`✅ Article sale split planned: ${priceCents} cents`)
    }

    // Clôture de catégorie
    if (eventType === "payment_intent.succeeded" && metadata.kind === "category_closure") {
      const SCents = Number.parseInt(data.amount || "0")
      const invTop10 = JSON.parse(metadata.investor_top10 || "[]")
      const portTop10 = JSON.parse(metadata.porter_top10 || "[]")
      const inv11_100 = JSON.parse(metadata.investor_11_100 || "[]")
      const visualAccount = metadata.visual_account_id || "acc_visual"

      const plan = categoryClosureSplitEngine(SCents, invTop10, portTop10, inv11_100, visualAccount)
      await persistPlan(eventId, "category_closure", plan, event)
      auditLog("stripe_category_closure_planned", "system", { event: eventId, amount: SCents })

      console.log(`✅ Category closure split planned: ${SCents} cents`)
    }

    // Enregistrer l'événement comme traité
    await recordEvent(eventId, eventType, event)

    res.json({ ok: true })
  })

  // Stripe Webhook - MUST be registered BEFORE any JSON parsing middleware
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req: any, res) => {
    const sig = req.headers["stripe-signature"]
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET")
      return res.status(500).json({ error: "Webhook secret not configured" })
    }

    let event

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message)
      return res.status(400).json({ error: "Invalid signature" })
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object

          // Security: Only process succeeded payments
          if (paymentIntent.status !== "succeeded") {
            console.error("Payment intent not succeeded:", paymentIntent.id, paymentIntent.status)
            return res.status(400).json({ error: "Payment not succeeded" })
          }

          // Security: Validate currency
          if (paymentIntent.currency !== "eur") {
            console.error("Invalid currency:", paymentIntent.currency)
            return res.status(400).json({ error: "Invalid currency" })
          }

          const userId = paymentIntent.metadata.userId
          const metadataAmount = Number.parseFloat(paymentIntent.metadata.depositAmount || "0")
          const type = paymentIntent.metadata.type
          const paymentIntentId = paymentIntent.id

          // Security: Validate authoritative amount against metadata
          const authorizedAmount = paymentIntent.amount_received / 100 // Convert from cents
          if (Math.abs(authorizedAmount - metadataAmount) > 0.01) {
            console.error(`Amount mismatch: authorized=${authorizedAmount}, metadata=${metadataAmount}`)
            return res.status(400).json({ error: "Amount verification failed" })
          }

          if (!userId || !metadataAmount || !type) {
            console.error("Missing required metadata in payment intent:", paymentIntentId)
            return res.status(400).json({ error: "Invalid payment metadata" })
          }

          // Use the authoritative amount from Stripe, not client metadata
          const depositAmount = authorizedAmount

          // Check for idempotency - prevent duplicate processing
          const existingTransaction = await storage.getTransactionByPaymentIntent(paymentIntentId)
          if (existingTransaction) {
            console.log(`Payment intent ${paymentIntentId} already processed`)
            return res.json({ received: true, status: "already_processed" })
          }

          const user = await storage.getUser(userId)
          if (!user) {
            console.error("User not found for payment:", userId)
            return res.status(404).json({ error: "User not found" })
          }

          // Update user balance based on payment type
          if (type === "caution") {
            const newCaution = Number.parseFloat(user.cautionEUR || "0") + depositAmount
            await storage.updateUser(userId, {
              cautionEUR: newCaution.toString(),
            })

            // Create transaction record with correct type
            const transaction = await storage.createTransaction({
              userId,
              type: "deposit",
              amount: depositAmount.toString(),
              metadata: {
                type: "caution_deposit",
                paymentIntentId,
                simulationMode: false,
              },
            })

            // AUTO-GENERATE RECEIPT: Critical fix for missing automatic generation
            try {
              const receipt = await generateReceiptPDF(transaction.id, userId, {
                templateVersion: "webhook-v1",
                includeDetails: true,
              })

              // Log auto-generation audit
              await storage.createAuditLog({
                userId,
                action: "auto_receipt_generated",
                resourceType: "receipt",
                resourceId: receipt.receiptId,
                details: {
                  transactionId: transaction.id,
                  receiptNumber: receipt.receiptNumber,
                  paymentIntentId,
                  trigger: "caution_deposit_webhook",
                },
              })

              console.log(`Auto-generated receipt ${receipt.receiptNumber} for caution deposit ${transaction.id}`)
            } catch (receiptError) {
              console.error("Failed to auto-generate receipt for caution deposit:", receiptError)
              // Don't fail the payment, just log the error
            }

            // Send real-time notification
            await notificationService.notifyUser(userId, {
              type: "caution_deposit_success",
              title: "Dépôt de caution réussi",
              message: `Votre caution de €${depositAmount} a été confirmée.`,
              priority: "medium",
            })

            console.log(`Caution deposit confirmed for user ${userId}: €${depositAmount}`)
          } else if (type === "video_deposit") {
            // Handle video deposit payment success with atomic operations
            const videoDepositId = paymentIntent.metadata.videoDepositId
            const videoType = paymentIntent.metadata.videoType

            if (!videoDepositId || !videoType) {
              console.error("Missing video deposit metadata:", paymentIntentId)
              return res.status(400).json({ error: "Invalid video deposit metadata" })
            }

            // Get the video deposit record
            const videoDeposit = await storage.getVideoDeposit(videoDepositId)
            if (!videoDeposit) {
              console.error("Video deposit not found:", videoDepositId)
              return res.status(404).json({ error: "Video deposit not found" })
            }

            // Ensure atomicity: All operations succeed or all fail
            try {
              // 1. Update video deposit status to active
              await storage.updateVideoDeposit(videoDepositId, {
                status: "active",
                paidAt: new Date(),
              })

              // 1.5. AUTO-CHECK CATEGORY THRESHOLDS: Module 5 integration (CRITICAL FIX)
              try {
                // Get the project to find its category
                const project = await storage.getProject(videoDeposit.projectId)
                if (project && project.category) {
                  // CRITICAL FIX: Resolve category name to UUID
                  const categoryObject = await storage.getVideoCategory(project.category)

                  if (!categoryObject || !categoryObject.id) {
                    console.warn(`Category not found for name: ${project.category} - threshold check skipped`)
                    await storage.createAuditLog({
                      userId: "system",
                      action: "threshold_check_skipped",
                      resourceType: "category",
                      details: {
                        reason: "category_not_found",
                        categoryName: project.category,
                        trigger: "video_deposit_activation",
                        videoDepositId,
                        projectId: videoDeposit.projectId, // FIXED: projectId was undeclared, using videoDeposit.projectId
                      },
                    })
                  } else {
                    // Import category threshold checker
                    const { checkCategoryThresholds } = await import("./categories/handlers")

                    // Trigger automatic threshold check with CORRECT UUID
                    const thresholdResults = await checkCategoryThresholds(
                      {
                        dryRun: false, // Execute real actions
                        categoryIds: [categoryObject.id], // FIXED: Use UUID instead of name
                      },
                      "system",
                    ) // System-triggered

                    console.log(
                      `Category threshold check triggered for ${project.category} (ID: ${categoryObject.id}) after video activation:`,
                      thresholdResults,
                    )

                    // Enhanced audit with ID resolution tracking
                    await storage.createAuditLog({
                      userId: "system",
                      action: "threshold_check",
                      resourceType: "category",
                      resourceId: categoryObject.id, // Use UUID for resourceId
                      details: {
                        trigger: "video_deposit_activation",
                        videoDepositId,
                        projectId: project.id,
                        categoryName: project.category,
                        categoryId: categoryObject.id,
                        results: thresholdResults,
                        categoriesChecked: thresholdResults.length,
                      },
                    })

                    // GUARD: Alert if no categories were actually checked
                    if (thresholdResults.length === 0) {
                      console.error(
                        `CRITICAL: Category threshold check returned zero results for ${project.category} (${categoryObject.id})`,
                      )
                    }
                  }
                }
              } catch (categoryError) {
                console.error("Failed to auto-check category thresholds after video activation:", categoryError)
                // Enhanced error logging for debugging
                await storage.createAuditLog({
                  userId: "system",
                  action: "threshold_check_error",
                  resourceType: "category",
                  details: {
                    error: categoryError instanceof Error ? categoryError.message : "Unknown error",
                    trigger: "video_deposit_activation",
                    videoDepositId,
                    projectId: videoDeposit.projectId,
                  },
                })
                // Don't break the main flow if category check fails
              }

              // 2. Update creator quota atomically
              const currentDate = new Date()
              const period =
                videoType === "film"
                  ? `${currentDate.getFullYear()}-Q${Math.ceil((currentDate.getMonth() + 1) / 3)}`
                  : `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}`

              const existingQuota = await storage.getCreatorQuota(userId, period)

              if (existingQuota) {
                const updates: Partial<any> = {}
                if (videoType === "clip") updates.clipDeposits = (existingQuota.clipDeposits || 0) + 1
                else if (videoType === "documentary")
                  updates.documentaryDeposits = (existingQuota.documentaryDeposits || 0) + 1
                else if (videoType === "film") updates.filmDeposits = (existingQuota.filmDeposits || 0) + 1

                await storage.updateCreatorQuota(userId, period, updates)
              } else {
                const newQuota: any = {
                  creatorId: userId,
                  period,
                  clipDeposits: videoType === "clip" ? 1 : 0,
                  documentaryDeposits: videoType === "documentary" ? 1 : 0,
                  filmDeposits: videoType === "film" ? 1 : 0,
                }
                await storage.createCreatorQuota(newQuota)
              }

              // 3. Create transaction record
              const transaction = await storage.createTransaction({
                userId,
                type: "deposit",
                amount: depositAmount.toString(),
                metadata: {
                  type: "video_deposit",
                  videoType,
                  videoDepositId,
                  paymentIntentId,
                  simulationMode: false,
                },
              })

              // 3.5. AUTO-GENERATE RECEIPT: Video deposit
              try {
                const receipt = await generateReceiptPDF(transaction.id, userId, {
                  templateVersion: "webhook-video-v1",
                  includeDetails: true,
                })

                // Log auto-generation audit
                await storage.createAuditLog({
                  userId,
                  action: "auto_receipt_generated",
                  resourceType: "receipt",
                  resourceId: receipt.receiptId,
                  details: {
                    transactionId: transaction.id,
                    receiptNumber: receipt.receiptNumber,
                    paymentIntentId,
                    videoType,
                    videoDepositId,
                    trigger: "video_deposit_webhook",
                  },
                })

                console.log(`Auto-generated receipt ${receipt.receiptNumber} for video deposit ${transaction.id}`)
              } catch (receiptError) {
                console.error("Failed to auto-generate receipt for video deposit:", receiptError)
                // Don't fail the payment, just log the error
              }

              // 4. Send success notification
              await notificationService.notifyUser(userId, {
                type: "video_deposit_success",
                title: "Dépôt vidéo confirmé",
                message: `Votre dépôt vidéo (${videoType}) de €${depositAmount} a été confirmé et activé.`,
                priority: "medium",
              })

              console.log(`Video deposit confirmed for user ${userId}: ${videoType} - €${depositAmount}`)
            } catch (atomicError) {
              console.error("Atomic video deposit operation failed:", atomicError)

              // Rollback: Set deposit status back to pending
              await storage.updateVideoDeposit(videoDepositId, {
                status: "pending_payment",
              })

              // Notify user of processing failure
              await notificationService.notifyUser(userId, {
                type: "video_deposit_failed",
                title: "Erreur de traitement",
                message: "Une erreur est survenue lors du traitement de votre dépôt vidéo. Contactez le support.",
                priority: "high",
              })

              return res.status(500).json({ error: "Video deposit processing failed" })
            }
          } else if (type === "project_extension") {
            // Handle project extension payment success with atomic operations
            const projectId = paymentIntent.metadata.projectId

            if (!projectId) {
              console.error("Missing project extension metadata:", paymentIntentId)
              return res.status(400).json({ error: "Invalid project extension metadata" })
            }

            // Get the project
            const project = await storage.getProject(projectId)
            if (!project) {
              console.error("Project not found for extension:", projectId)
              return res.status(404).json({ error: "Project not found" })
            }

            // Ensure atomicity: All operations succeed or all fail
            try {
              // 1. Get most recent extension by cycleEndsAt (fixed ambiguous selection)
              const extensions = await storage.getProjectExtensions(projectId)
              const currentExtension = extensions
                .filter((ext) => !ext.isArchived)
                .sort((a, b) => {
                  const dateA = a.cycleEndsAt ? new Date(a.cycleEndsAt).getTime() : 0
                  const dateB = b.cycleEndsAt ? new Date(b.cycleEndsAt).getTime() : 0
                  return dateB - dateA // Most recent first
                })[0]

              // 2. Calculate new extension dates with state transitions
              const now = new Date()
              const extensionDuration = 168 * 60 * 60 * 1000 // 168 hours in milliseconds
              const newExpiryDate = new Date(now.getTime() + extensionDuration)

              let extension
              if (currentExtension) {
                // Update existing extension with state transitions
                const newProlongationCount = (currentExtension.prolongationCount || 0) + 1
                const isTopTen = currentExtension.isInTopTen

                extension = await storage.updateProjectExtension(currentExtension.id, {
                  cycleEndsAt: newExpiryDate,
                  prolongationCount: newProlongationCount,
                  prolongationPaidEUR: (
                    (Number.parseFloat(currentExtension.prolongationPaidEUR || "0") || 0) + 20
                  ).toString(),
                  canProlong: newProlongationCount < 3, // Max 3 total extensions
                  // Persist state transitions - if not in TOP 10, archive after payment
                  isArchived: !isTopTen,
                  archivedAt: !isTopTen ? now : null,
                  archiveReason: !isTopTen ? "out_of_top_ten" : null,
                })
              } else {
                // Create new extension (will be updated by ranking system)
                extension = await storage.createProjectExtension({
                  projectId,
                  isInTopTen: false, // Will be updated by ranking system
                  cycleEndsAt: newExpiryDate,
                  prolongationCount: 1,
                  prolongationPaidEUR: "20.00",
                  canProlong: true,
                  isArchived: false, // New extensions start active
                })
              }

              // 3. Create transaction record with proper type
              const transaction = await storage.createTransaction({
                userId,
                type: "project_extension",
                amount: depositAmount.toString(),
                commission: "0.00",
                projectId,
                metadata: {
                  type: "project_extension",
                  extensionId: extension.id,
                  expiresAt: newExpiryDate.toISOString(),
                  paymentIntentId,
                  simulationMode: false,
                },
              })

              // 3.5. AUTO-GENERATE RECEIPT: Project extension
              try {
                const receipt = await generateReceiptPDF(transaction.id, userId, {
                  templateVersion: "webhook-extension-v1",
                  includeDetails: true,
                })

                // Log auto-generation audit
                await storage.createAuditLog({
                  userId,
                  action: "auto_receipt_generated",
                  resourceType: "receipt",
                  resourceId: receipt.receiptId,
                  details: {
                    transactionId: transaction.id,
                    receiptNumber: receipt.receiptNumber,
                    paymentIntentId,
                    projectId,
                    extensionId: extension.id,
                    trigger: "project_extension_webhook",
                  },
                })

                console.log(`Auto-generated receipt ${receipt.receiptNumber} for project extension ${transaction.id}`)
              } catch (receiptError) {
                console.error("Failed to auto-generate receipt for project extension:", receiptError)
                // Don't fail the payment, just log the error
              }

              // 4. Send success notification
              await notificationService.notifyUser(userId, {
                type: "project_status_change",
                title: "Prolongation confirmée",
                message: `Votre projet a été prolongé de 168h pour €${depositAmount}. ${extension.isArchived ? "Le projet a été archivé car il n'est pas dans le TOP 10." : ""}`,
                priority: "medium",
              })

              console.log(`Project extension confirmed for user ${userId}: project ${projectId} - €${depositAmount}`)
            } catch (atomicError) {
              console.error("Atomic project extension operation failed:", atomicError)

              // Notify user of processing failure
              await notificationService.notifyUser(userId, {
                type: "project_status_change",
                title: "Erreur de prolongation",
                message: "Une erreur est survenue lors de la prolongation de votre projet. Contactez le support.",
                priority: "high",
              })

              return res.status(500).json({ error: "Project extension processing failed" })
            }
          } else if (type === "live_show_weekly_battle") {
            // Handle Live Show Weekly battle investment payment success
            const editionId = paymentIntent.metadata.editionId
            const finalist = paymentIntent.metadata.finalist
            const votes = Number.parseInt(paymentIntent.metadata.votes || "0")

            if (!editionId || !finalist) {
              console.error("Missing live show weekly metadata:", paymentIntentId)
              return res.status(400).json({ error: "Invalid live show weekly metadata" })
            }

            try {
              // 1. Find and update the investment record
              const investments = await storage.getLiveShowBattleInvestments(editionId)
              const investment = investments.find(
                (inv) => inv.paymentIntentId === paymentIntentId && inv.userId === userId,
              )

              if (!investment) {
                console.error("Investment not found for payment:", paymentIntentId)
                return res.status(404).json({ error: "Investment not found" })
              }

              // Mark investment as paid
              await storage.updateLiveShowBattleInvestment(investment.id, {
                paidAt: new Date(),
              })

              // 2. Create transaction record
              const transaction = await storage.createTransaction({
                userId,
                type: "investment",
                amount: depositAmount.toString(),
                metadata: {
                  type: "live_show_weekly_battle",
                  editionId,
                  finalist,
                  votes,
                  paymentIntentId,
                  simulationMode: false,
                },
              })

              // 3. Emit WebSocket score update
              try {
                const { getNotificationService } = await import("./websocket")
                const wsService = getNotificationService()

                // Recalculate scoreboard
                const allInvestments = await storage.getLiveShowBattleInvestments(editionId)
                const paidInvestments = allInvestments.filter((inv) => inv.paidAt)

                const scoreboard = paidInvestments.reduce((acc: any, inv) => {
                  if (!acc[inv.finalist]) {
                    acc[inv.finalist] = {
                      finalist: inv.finalist,
                      totalVotes: 0,
                      totalAmount: 0,
                      investorCount: 0,
                    }
                  }
                  acc[inv.finalist].totalVotes += inv.votes || 0
                  acc[inv.finalist].totalAmount += Number.parseFloat(inv.amountEUR)
                  acc[inv.finalist].investorCount += 1
                  return acc
                }, {})

                wsService.emitLiveWeeklyScoreUpdate(editionId, {
                  scoreboard: Object.values(scoreboard),
                  latestPayment: {
                    finalist: investment.finalist,
                    amount: investment.amountEUR,
                    votes: investment.votes,
                  },
                })
              } catch (wsError) {
                console.error("Failed to emit WebSocket after payment:", wsError)
              }

              // 4. Send success notification
              await notificationService.notifyUser(userId, {
                type: "investment_confirmed",
                title: "Investissement confirmé",
                message: `Votre investissement de €${depositAmount} sur le finaliste ${finalist} a été confirmé.`,
                priority: "medium",
              })

              console.log(
                `Live Show Weekly investment confirmed for user ${userId}: ${finalist} - €${depositAmount} (${votes} votes)`,
              )
            } catch (atomicError) {
              console.error("Atomic live show investment operation failed:", atomicError)

              await notificationService.notifyUser(userId, {
                type: "investment_failed",
                title: "Erreur d'investissement",
                message: "Une erreur est survenue lors du traitement de votre investissement. Contactez le support.",
                priority: "high",
              })

              return res.status(500).json({ error: "Live show investment processing failed" })
            }
          }
          break
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object
          const userId = paymentIntent.metadata.userId
          const type = paymentIntent.metadata.type
          const videoDepositId = paymentIntent.metadata.videoDepositId
          const projectId = paymentIntent.metadata.projectId

          if (userId) {
            // Handle video deposit payment failure with cleanup
            if (type === "video_deposit" && videoDepositId) {
              try {
                // Mark video deposit as rejected and clean up
                await storage.updateVideoDeposit(videoDepositId, {
                  status: "rejected",
                  rejectionReason: "Payment failed",
                })

                // Revoke any associated tokens
                await storage.revokeVideoTokens(videoDepositId)

                console.log(`Video deposit ${videoDepositId} marked as rejected due to payment failure`)
              } catch (cleanupError) {
                console.error("Failed to cleanup after video payment failure:", cleanupError)
              }
            }

            // Handle project extension payment failure
            if (type === "project_extension" && projectId) {
              try {
                console.log(`Project extension payment failed for project ${projectId}, user ${userId}`)
                // No cleanup needed for project extensions as no state was changed yet
              } catch (cleanupError) {
                console.error("Failed to handle project extension payment failure:", cleanupError)
              }
            }

            await notificationService.notifyUser(userId, {
              type: "payment_failed",
              title: "Échec du paiement",
              message:
                type === "video_deposit"
                  ? "Votre paiement pour le dépôt vidéo a échoué. Le dépôt a été annulé."
                  : type === "project_extension"
                    ? "Votre paiement pour la prolongation du projet a échoué. Veuillez réessayer."
                    : "Votre paiement a échoué. Veuillez réessayer.",
              priority: "high",
            })
          }
          break
        }

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      res.json({ received: true })
    } catch (error) {
      console.error("Error processing webhook:", error)
      res.status(500).json({ error: "Webhook processing failed" })
    }
  })

  // Add JSON parsing middleware AFTER webhook registration
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)
      res.json(user)
    } catch (error) {
      console.error("Error fetching user:", error)
      res.status(500).json({ message: "Failed to fetch user" })
    }
  })

  // Profile management routes
  app.get("/api/user/profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      res.json({ profileTypes: user.profileTypes })
    } catch (error) {
      console.error("Error fetching user profiles:", error)
      res.status(500).json({ message: "Failed to fetch profiles" })
    }
  })

  // Platform Settings routes
  app.get("/api/platform-settings", async (req, res) => {
    try {
      const { default: platformSettingsService } = await import("./services/platformSettingsService")
      const settings = await platformSettingsService.getAllSettings()

      // Convert to boolean format for client
      const formattedSettings = {
        logo_official_visible: settings.logo_official_visible === "true",
        maintenance_mode: settings.maintenance_mode === "true",
        new_registration_enabled: settings.new_registration_enabled === "true",
        live_shows_enabled: settings.live_shows_enabled === "true",
        voix_info_enabled: settings.voix_info_enabled === "true",
        petites_annonces_enabled: settings.petites_annonces_enabled === "true",
      }

      res.json(formattedSettings)
    } catch (error) {
      console.error("Error fetching platform settings:", error)
      res.status(500).json({ error: "Failed to fetch platform settings" })
    }
  })

  app.put("/api/platform-settings", isAuthenticated, async (req: any, res) => {
    try {
      const { key, value } = req.body

      if (!key) {
        return res.status(400).json({ error: "Missing key" })
      }

      const userId = req.user?.claims?.sub || "admin"
      const { default: platformSettingsService } = await import("./services/platformSettingsService")

      await platformSettingsService.setSetting(key, value, userId)

      res.json({
        success: true,
        message: "Setting updated successfully",
      })
    } catch (error) {
      console.error("Error updating platform setting:", error)
      res.status(500).json({ error: "Failed to update platform setting" })
    }
  })

  app.get("/api/platform-settings/logo-visible", async (req, res) => {
    try {
      const { default: platformSettingsService } = await import("./services/platformSettingsService")
      const isVisible = await platformSettingsService.isLogoVisible()
      res.json({ visible: isVisible })
    } catch (error) {
      console.error("Error checking logo visibility:", error)
      res.status(500).json({ error: "Failed to check logo visibility" })
    }
  })

  app.patch("/api/user/profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const { profileTypes } = req.body

      if (!profileTypes || !Array.isArray(profileTypes) || profileTypes.length === 0) {
        return res.status(400).json({
          message: "Invalid profile types. Must provide at least one profile type.",
        })
      }

      // Get current user to check authorization
      const currentUser = await storage.getUser(userId)
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" })
      }

      const validProfileTypes = ["investor", "invested_reader", "creator", "admin", "infoporteur"]
      const invalidProfiles = profileTypes.filter((p: string) => !validProfileTypes.includes(p))

      if (invalidProfiles.length > 0) {
        return res.status(400).json({
          message: `Invalid profile types: ${invalidProfiles.join(", ")}`,
        })
      }

      // SECURITY: Restricted profiles can only be assigned by admins
      const restrictedProfiles = ["admin", "infoporteur"]
      const requestedRestrictedProfiles = profileTypes.filter((p: string) => restrictedProfiles.includes(p))
      const currentRestrictedProfiles = currentUser.profileTypes.filter((p: string) => restrictedProfiles.includes(p))

      // Check if user is trying to add restricted profiles they don't already have
      const newRestrictedProfiles = requestedRestrictedProfiles.filter(
        (p: string) => !currentRestrictedProfiles.includes(p),
      )

      // Only admins can add restricted profiles
      if (newRestrictedProfiles.length > 0 && !currentUser.profileTypes.includes("admin")) {
        return res.status(403).json({
          message: "Only administrators can assign admin or infoporteur profiles. Please contact an administrator.",
        })
      }

      // Prevent non-admins from removing their last non-restricted profile if they have restricted ones
      // This ensures admins can't accidentally lock themselves out
      const nonRestrictedProfiles = profileTypes.filter((p: string) => !restrictedProfiles.includes(p))
      if (currentRestrictedProfiles.length > 0 && nonRestrictedProfiles.length === 0) {
        return res.status(400).json({
          message: "You must have at least one regular profile (investor, invested_reader, or creator).",
        })
      }

      const updatedUser = await storage.updateUserProfiles(userId, profileTypes)
      res.json({ profileTypes: updatedUser.profileTypes })
    } catch (error) {
      console.error("Error updating user profiles:", error)
      res.status(500).json({ message: "Failed to update profiles" })
    }
  })

  // Nickname and avatar routes
  app.patch("/api/user/display", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const { nickname, avatarUrl } = req.body

      // Validate nickname if provided
      if (nickname !== undefined) {
        if (typeof nickname !== "string") {
          return res.status(400).json({
            message: "Nickname must be a string",
          })
        }

        if (nickname.length > 50) {
          return res.status(400).json({
            message: "Nickname must be 50 characters or less",
          })
        }

        // Optional: check for inappropriate content (basic check)
        const inappropriateWords = ["admin", "system", "visual", "support"]
        const lowerNickname = nickname.toLowerCase()
        if (inappropriateWords.some((word) => lowerNickname.includes(word))) {
          return res.status(400).json({
            message: "Nickname contains reserved words",
          })
        }
      }

      // Validate avatar URL if provided
      if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== "string") {
        return res.status(400).json({
          message: "Avatar URL must be a string",
        })
      }

      const updatedUser = await storage.updateUserDisplay(userId, { nickname, avatarUrl })
      res.json({
        nickname: updatedUser.nickname,
        avatarUrl: updatedUser.avatarUrl,
      })
    } catch (error) {
      console.error("Error updating user display:", error)
      res.status(500).json({ message: "Failed to update nickname/avatar" })
    }
  })

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const { limit = 50, offset = 0, category } = req.query

      // Validation des paramètres d'entrée
      const parsedLimit = Number.parseInt(limit as string)
      const parsedOffset = Number.parseInt(offset as string)

      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          message: "Invalid limit parameter",
          details: "Limit must be between 1 and 100",
          retryable: false,
        })
      }

      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return res.status(400).json({
          message: "Invalid offset parameter",
          details: "Offset must be a non-negative number",
          retryable: false,
        })
      }

      const projects = await storage.getProjects(parsedLimit, parsedOffset, category as string)

      // Log des métriques de succès
      console.log(
        `[API] Successfully fetched ${projects.length} projects (limit: ${parsedLimit}, offset: ${parsedOffset}, category: ${category || "all"})`,
      )

      res.json({
        data: projects,
        meta: {
          count: projects.length,
          limit: parsedLimit,
          offset: parsedOffset,
          category: (category as string) || null,
        },
      })
    } catch (error: any) {
      console.error("[ERROR] Failed to fetch projects:", {
        error: error?.message || String(error),
        stack: error?.stack,
        query: req.query,
        timestamp: new Date().toISOString(),
      })

      // Catégorisation des erreurs
      if (error?.code === "ECONNREFUSED") {
        return res.status(503).json({
          message: "Database connection failed",
          details: "The database is temporarily unavailable. Please try again later.",
          retryable: true,
        })
      }

      if (error?.code === "ETIMEDOUT") {
        return res.status(504).json({
          message: "Request timeout",
          details: "The request took too long to process. Please try again.",
          retryable: true,
        })
      }

      res.status(500).json({
        message: "Internal server error",
        details: "An unexpected error occurred while fetching projects",
        retryable: true,
      })
    }
  })

  // GET /api/projects/random - Récupérer un projet aléatoire de qualité
  app.get("/api/projects/random", async (req, res) => {
    try {
      // Récupérer tous les projets avec un score de qualité décent
      const projects = await storage.getProjects(100, 0) // Limite élargie pour plus de choix

      if (!projects || projects.length === 0) {
        return res.status(404).json({
          message: "No projects available",
          retryable: false,
        })
      }

      // Filtrer les projets avec un score décent (> 6.0) et diversifier les catégories
      const qualityProjects = projects.filter((p) => {
        const score = typeof p.mlScore === "number" ? p.mlScore : Number.parseFloat(p.mlScore || "0")
        return score > 6.0 && p.status === "active"
      })

      let selectedProject
      if (qualityProjects.length > 0) {
        // Sélection pondérée basée sur le score et la diversité
        const randomIndex = Math.floor(Math.random() * qualityProjects.length)
        selectedProject = qualityProjects[randomIndex]
      } else {
        // Fallback: prendre un projet aléatoire parmi tous les actifs
        const activeProjects = projects.filter((p) => p.status === "active")
        if (activeProjects.length === 0) {
          return res.status(404).json({
            message: "No active projects available",
            retryable: false,
          })
        }
        const randomIndex = Math.floor(Math.random() * activeProjects.length)
        selectedProject = activeProjects[randomIndex]
      }

      res.json({
        projectId: selectedProject.id,
        title: selectedProject.title,
        category: selectedProject.category,
        mlScore: selectedProject.mlScore,
      })
    } catch (error) {
      console.error("Error fetching random project:", error)
      res.status(500).json({
        message: "Failed to fetch random project",
        retryable: true,
      })
    }
  })

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const projectId = req.params.id

      // Validation de l'ID du projet
      if (!projectId || projectId.trim() === "") {
        return res.status(400).json({
          message: "Invalid project ID",
          details: "Project ID is required and cannot be empty",
          retryable: false,
        })
      }

      // Validation du format UUID si nécessaire
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (projectId.length > 20 && !uuidRegex.test(projectId)) {
        return res.status(400).json({
          message: "Invalid project ID format",
          details: "Project ID must be a valid UUID or numeric ID",
          retryable: false,
        })
      }

      const project = await storage.getProject(projectId)

      if (!project) {
        console.log(`[API] Project not found: ${projectId}`)
        return res.status(404).json({
          message: "Project not found",
          details: `No project exists with ID: ${projectId}`,
          retryable: false,
        })
      }

      console.log(`[API] Successfully fetched project: ${projectId} (${project.title})`)
      res.json({
        data: project,
        meta: {
          projectId: projectId,
          fetchedAt: new Date().toISOString(),
        },
      })
    } catch (error: any) {
      console.error("[ERROR] Failed to fetch project:", {
        error: error?.message || String(error),
        stack: error?.stack,
        projectId: req.params.id,
        timestamp: new Date().toISOString(),
      })

      // Catégorisation des erreurs
      if (error?.code === "ECONNREFUSED") {
        return res.status(503).json({
          message: "Database connection failed",
          details: "The database is temporarily unavailable. Please try again later.",
          retryable: true,
        })
      }

      if (error?.code === "ETIMEDOUT") {
        return res.status(504).json({
          message: "Request timeout",
          details: "The request took too long to process. Please try again.",
          retryable: true,
        })
      }

      if (error?.message?.includes("invalid input syntax")) {
        return res.status(400).json({
          message: "Invalid project ID format",
          details: "The provided project ID has an invalid format",
          retryable: false,
        })
      }

      res.status(500).json({
        message: "Internal server error",
        details: "An unexpected error occurred while fetching the project",
        retryable: true,
      })
    }
  })

  app.post("/api/projects", isAuthenticated, upload.single("video"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "creator")) {
        return res.status(403).json({ message: "Only creators can submit projects" })
      }

      const projectData = insertProjectSchema.parse({
        ...req.body,
        creatorId: userId,
        unitPriceEUR: req.body.unitPriceEUR || "5.00", // Prix unitaire obligatoire (2,3,4,5,10€)
        videoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      })

      // Calculate ML score with improved error handling
      try {
        const mlScore = await mlScoreProject(projectData)
        projectData.mlScore = mlScore.toString()
      } catch (mlError: any) {
        console.error("ML scoring error:", mlError)

        // Handle simulation validation errors with specific messages
        if (mlError.name === "SimulationValidationError") {
          return res.status(400).json({
            message: "Erreur de validation du projet",
            details: mlError.message,
            field: mlError.field,
            retryable: true,
          })
        }

        if (mlError.name === "MLScoringError") {
          return res.status(500).json({
            message: "Erreur lors du calcul du score ML",
            details: mlError.message,
            code: mlError.code,
            retryable: true,
          })
        }

        // Fallback to default score if ML scoring fails unexpectedly
        console.warn("Using default ML score due to unexpected error")
        projectData.mlScore = "5.0"
      }

      const project = await storage.createProject(projectData)
      res.status(201).json(project)
    } catch (error) {
      console.error("Error creating project:", error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Données de projet invalides",
          errors: error.errors,
          retryable: false,
        })
      }
      res.status(500).json({
        message: "Échec de création du projet",
        retryable: true,
      })
    }
  })

  // Investment routes
  app.post("/api/investments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !user.kycVerified) {
        return res.status(403).json({ message: "KYC verification required for investments" })
      }

      const minimumCaution = getMinimumCautionAmountForUser(user.profileTypes)
      if (Number.parseFloat(user.cautionEUR || "0") < minimumCaution) {
        return res.status(403).json({ message: `Minimum caution of €${minimumCaution} required` })
      }

      const investmentData = insertInvestmentSchema.parse({
        ...req.body,
        userId,
        visuPoints: Math.floor(Number.parseFloat(req.body.amount) * 100), // 100 VP = 1 EUR
        currentValue: req.body.amount,
      })

      // Validate investment amount (nouvelles règles 16/09/2025)
      const amount = Number.parseFloat(req.body.amount)
      if (!isValidInvestmentAmount(amount)) {
        return res.status(400).json({
          message: `Investment amount must be one of: ${ALLOWED_INVESTMENT_AMOUNTS.join(", ")} EUR`,
          allowedAmounts: ALLOWED_INVESTMENT_AMOUNTS,
        })
      }

      // Check if user has sufficient balance
      if (Number.parseFloat(user.balanceEUR || "0") < amount) {
        return res.status(400).json({ message: "Insufficient balance" })
      }

      // Prevent self-investment: check if user is the creator of the project
      const project = await storage.getProject(req.body.projectId)
      if (!project) {
        return res.status(404).json({ message: "Project not found" })
      }

      if (project.creatorId === userId) {
        return res.status(403).json({
          message: "You cannot invest in your own project. Self-investment is not allowed.",
        })
      }

      const investment = await storage.createInvestment(investmentData)

      // Create transaction record
      const commission = amount * 0.23 // 23% platform commission
      await storage.createTransaction({
        userId,
        type: "investment",
        amount: amount.toString(),
        commission: commission.toString(),
        projectId: req.body.projectId,
        investmentId: investment.id,
        metadata: { simulationMode: user.simulationMode },
      })

      // Update user balance (only in simulation mode for now)
      if (user.simulationMode) {
        const newBalance = Number.parseFloat(user.balanceEUR || "0") - amount
        await storage.upsertUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          profileTypes: user.profileTypes,
          kycVerified: user.kycVerified,
          balanceEUR: newBalance.toString(),
          simulationMode: user.simulationMode,
          cautionEUR: user.cautionEUR,
          totalInvested: (Number.parseFloat(user.totalInvested || "0") + amount).toString(),
          totalGains: user.totalGains,
          rankGlobal: user.rankGlobal,
        })
      }

      // Trigger notifications
      await notificationService.notifyNewInvestment({
        projectId: req.body.projectId,
        userId,
        amount: amount.toString(),
      })

      // Check for milestone notifications (reuse project from self-investment check)
      if (project) {
        const currentAmount = Number.parseFloat(project.currentAmount || "0") + amount
        const targetAmount = Number.parseFloat(project.targetAmount)
        const percentage = (currentAmount / targetAmount) * 100

        // Update project current amount
        await storage.updateProject(project.id, {
          currentAmount: currentAmount.toString(),
          investorCount: (project.investorCount || 0) + 1,
        })

        // Check for milestone notifications (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100]
        const reachedMilestone = milestones.find(
          (m) => percentage >= m && percentage - (amount / targetAmount) * 100 < m,
        )

        if (reachedMilestone) {
          await notificationService.notifyInvestmentMilestone({
            projectId: req.body.projectId,
            percentage: reachedMilestone,
            currentAmount: currentAmount.toString(),
            targetAmount: project.targetAmount,
          })

          if (reachedMilestone === 100) {
            await notificationService.notifyFundingGoalReached({
              projectId: req.body.projectId,
            })
          }
        }
      }

      res.status(201).json(investment)
    } catch (error) {
      console.error("Error creating investment:", error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid investment data", errors: error.errors })
      }
      res.status(500).json({ message: "Failed to create investment" })
    }
  })

  app.get("/api/investments/user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const requestedUserId = req.params.userId
      const currentUserId = req.user.claims.sub

      // Users can only view their own investments unless they're admin
      const currentUser = await storage.getUser(currentUserId)
      if (requestedUserId !== currentUserId && !hasProfile(currentUser?.profileTypes || [], "admin")) {
        return res.status(403).json({ message: "Access denied" })
      }

      const investments = await storage.getUserInvestments(requestedUserId)
      res.json(investments)
    } catch (error) {
      console.error("Error fetching user investments:", error)
      res.status(500).json({ message: "Failed to fetch investments" })
    }
  })

  // Live shows routes
  app.get("/api/live-shows", async (req, res) => {
    try {
      const liveShows = await storage.getActiveLiveShows()
      res.json(liveShows)
    } catch (error) {
      console.error("Error fetching live shows:", error)
      res.status(500).json({ message: "Failed to fetch live shows" })
    }
  })

  app.post("/api/live-shows", isAuthenticated, async (req: any, res) => {
    try {
      const { title, description, artistA, artistB, viewerCount } = req.body

      if (!title || typeof title !== "string") {
        return res.status(400).json({ message: "Title is required" })
      }

      const liveShowData = {
        title: title.trim(),
        description: description?.trim(),
        artistA: artistA?.trim(),
        artistB: artistB?.trim(),
        viewerCount: Number.parseInt(viewerCount) || 0,
      }

      const newLiveShow = await storage.createLiveShow(liveShowData)

      console.log(`[LiveShows] New live show created: ${newLiveShow.id} - ${newLiveShow.title}`)

      res.status(201).json({
        success: true,
        liveShow: newLiveShow,
        message: "Live show created successfully",
      })
    } catch (error) {
      console.error("Error creating live show:", error)
      res.status(500).json({
        message: "Failed to create live show",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  })

  app.post("/api/live-shows/:id/invest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !user.kycVerified) {
        return res.status(403).json({ message: "KYC verification required" })
      }

      const { artist, amount } = req.body
      const liveShowId = req.params.id

      // Validate amount
      const investmentAmount = Number.parseFloat(amount)
      if (investmentAmount < 2 || investmentAmount > 20) {
        return res.status(400).json({ message: "Investment amount must be between **2–20 €**" })
      }

      // Update live show investments
      const currentShows = await storage.getActiveLiveShows()
      const currentShow = currentShows.find((show) => show.id === liveShowId)

      if (!currentShow) {
        return res.status(404).json({ message: "Live show not found" })
      }

      const newInvestmentA =
        artist === "A"
          ? (Number.parseFloat(currentShow.investmentA || "0") + investmentAmount).toString()
          : currentShow.investmentA || "0"

      const newInvestmentB =
        artist === "B"
          ? (Number.parseFloat(currentShow.investmentB || "0") + investmentAmount).toString()
          : currentShow.investmentB || "0"

      await storage.updateLiveShowInvestments(liveShowId, newInvestmentA, newInvestmentB)

      // Create transaction record
      const commission = investmentAmount * 0.1 // 10% commission for live shows
      await storage.createTransaction({
        userId,
        type: "investment",
        amount: investmentAmount.toString(),
        commission: commission.toString(),
        metadata: { liveShowId, artist, type: "live_show" },
      })

      // Trigger notification for live show investment
      await notificationService.notifyNewInvestment({
        projectId: liveShowId,
        userId: userId,
        amount: investmentAmount.toString(),
        metadata: { projectTitle: `Live Show Battle`, projectType: "live_show" },
      })

      res.json({ success: true, message: "Investment recorded successfully" })
    } catch (error) {
      console.error("Error processing live show investment:", error)
      res.status(500).json({ message: "Failed to process investment" })
    }
  })

  // ===== LIVE SHOW FINALIST MANAGEMENT ROUTES =====

  // Get finalists for a specific show
  app.get("/api/live-shows/:id/finalists", async (req, res) => {
    try {
      const showId = req.params.id
      const finalists = await db
        .select()
        .from(liveShowFinalists)
        .where(eq(liveShowFinalists.liveShowId, showId))
        .orderBy(liveShowFinalists.rank)

      res.json(finalists)
    } catch (error) {
      console.error("Error fetching finalists:", error)
      res.status(500).json({ message: "Failed to fetch finalists" })
    }
  })

  // Designate finalists (Admin only)
  app.post("/api/live-shows/:id/finalists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const showId = req.params.id

      // Validate request body
      const validation = designateFinalistsSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validation.error.errors,
        })
      }

      const { finalists } = validation.data
      const result = await liveShowOrchestrator.designateFinalists(showId, finalists)

      res.json({
        success: true,
        message: "Finalists designated successfully",
        finalists: result,
      })
    } catch (error) {
      console.error("Error designating finalists:", error)
      res.status(500).json({ message: "Failed to designate finalists" })
    }
  })

  // Request confirmations from finalists (Admin only)
  app.post("/api/live-shows/:id/request-confirmations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const showId = req.params.id
      await liveShowOrchestrator.requestConfirmations(showId)

      res.json({
        success: true,
        message: "Confirmation requests sent to finalists",
      })
    } catch (error) {
      console.error("Error requesting confirmations:", error)
      res.status(500).json({ message: "Failed to request confirmations" })
    }
  })

  // Confirm participation (Finalist)
  app.post("/api/live-shows/finalists/:id/confirm", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const finalistId = req.params.id

      const result = await liveShowOrchestrator.confirmParticipation(finalistId, userId)

      if (!result.success) {
        return res.status(400).json({ message: result.error })
      }

      res.json({
        success: true,
        message: "Participation confirmée avec succès",
      })
    } catch (error) {
      console.error("Error confirming participation:", error)
      res.status(500).json({ message: "Failed to confirm participation" })
    }
  })

  // Cancel participation (Finalist)
  app.post("/api/live-shows/finalists/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const finalistId = req.params.id

      // Validate request body
      const validation = cancelParticipationSchema.safeParse(req.body)
      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validation.error.errors,
        })
      }

      const { reason } = validation.data
      const result = await liveShowOrchestrator.cancelParticipation(finalistId, userId, reason)

      if (!result.success) {
        return res.status(400).json({ message: result.error })
      }

      res.json({
        success: true,
        message: "Participation annulée",
        scenario: result.scenario,
        scenarioExecuted: !!result.scenario,
      })
    } catch (error) {
      console.error("Error canceling participation:", error)
      res.status(500).json({ message: "Failed to cancel participation" })
    }
  })

  // Lock lineup (Admin only)
  app.post("/api/live-shows/:id/lock-lineup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const showId = req.params.id
      const result = await liveShowOrchestrator.lockLineup(showId, userId)

      if (!result.success) {
        return res.status(400).json({ message: result.error })
      }

      res.json({
        success: true,
        message: "Line-up verrouillé avec succès",
      })
    } catch (error) {
      console.error("Error locking lineup:", error)
      res.status(500).json({ message: "Failed to lock lineup" })
    }
  })

  // Get lineup state
  app.get("/api/live-shows/:id/lineup", async (req, res) => {
    try {
      const showId = req.params.id
      const lineup = await liveShowOrchestrator.getLineupState(showId)

      res.json(lineup)
    } catch (error) {
      console.error("Error fetching lineup:", error)
      res.status(500).json({ message: "Failed to fetch lineup" })
    }
  })

  // Get Live Show audit log (Admin only)
  app.get("/api/live-shows/:id/audit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const showId = req.params.id
      const auditLog = await db
        .select()
        .from(liveShowAudit)
        .where(eq(liveShowAudit.liveShowId, showId))
        .orderBy(desc(liveShowAudit.timestamp))

      res.json(auditLog)
    } catch (error) {
      console.error("Error fetching audit log:", error)
      res.status(500).json({ message: "Failed to fetch audit log" })
    }
  })

  // Admin routes
  app.get("/api/admin/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const [userStats, projectStats, transactionStats] = await Promise.all([
        storage.getUserStats(),
        storage.getProjectStats(),
        storage.getTransactionStats(),
      ])

      res.json({
        users: userStats,
        projects: projectStats,
        transactions: transactionStats,
      })
    } catch (error) {
      console.error("Error fetching admin stats:", error)
      res.status(500).json({ message: "Failed to fetch admin stats" })
    }
  })

  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const { limit = 100, offset = 0 } = req.query
      const users = await storage.getAllUsers(Number.parseInt(limit as string), Number.parseInt(offset as string))

      res.json(users)
    } catch (error) {
      console.error("Error fetching users:", error)
      res.status(500).json({ message: "Failed to fetch users" })
    }
  })

  app.get("/api/admin/projects/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const pendingProjects = await storage.getPendingProjects()
      res.json(pendingProjects)
    } catch (error) {
      console.error("Error fetching pending projects:", error)
      res.status(500).json({ message: "Failed to fetch pending projects" })
    }
  })

  app.put("/api/admin/projects/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const { status } = req.body
      const projectId = req.params.id

      if (!["active", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" })
      }

      const project = await storage.getProject(projectId)
      const oldStatus = project?.status || "unknown"

      const updatedProject = await storage.updateProject(projectId, { status })

      // Trigger notification for status change
      await notificationService.notifyProjectStatusChange({
        projectId,
        oldStatus,
        newStatus: status,
      })

      res.json(updatedProject)
    } catch (error) {
      console.error("Error updating project status:", error)
      res.status(500).json({ message: "Failed to update project status" })
    }
  })

  app.get("/api/admin/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const { limit = 100 } = req.query
      const transactions = await storage.getAllTransactions(Number.parseInt(limit as string))
      res.json(transactions)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      res.status(500).json({ message: "Failed to fetch transactions" })
    }
  })

  // Live Shows Admin routes
  app.get("/api/admin/live-shows/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const activeShows = await storage.getActiveLiveShows()
      res.json(activeShows)
    } catch (error) {
      console.error("Error fetching active live shows:", error)
      res.status(500).json({ message: "Failed to fetch active live shows" })
    }
  })

  app.get("/api/admin/live-shows/:showId/lineup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const { showId } = req.params
      const lineup = await liveShowOrchestrator.getLineupState(showId)
      res.json(lineup)
    } catch (error) {
      console.error("Error fetching lineup:", error)
      res.status(500).json({ message: "Failed to fetch lineup" })
    }
  })

  app.get("/api/admin/live-shows/:showId/audit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const { showId } = req.params
      const auditLog = await storage.getLiveShowAudit(showId)
      res.json(auditLog)
    } catch (error) {
      console.error("Error fetching audit log:", error)
      res.status(500).json({ message: "Failed to fetch audit log" })
    }
  })

  app.post("/api/admin/live-shows/:showId/lock-lineup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const { showId } = req.params
      const result = await liveShowOrchestrator.lockLineup(showId, userId)

      if (!result.success) {
        return res.status(400).json({ message: result.error })
      }

      res.json({ success: true })
    } catch (error) {
      console.error("Error locking lineup:", error)
      res.status(500).json({ message: "Failed to lock lineup" })
    }
  })

  app.post("/api/admin/live-shows/:showId/unlock-lineup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const { showId } = req.params
      const result = await liveShowOrchestrator.unlockLineup(showId, userId)

      if (!result.success) {
        return res.status(400).json({ message: result.error })
      }

      res.json({ success: true })
    } catch (error) {
      console.error("Error unlocking lineup:", error)
      res.status(500).json({ message: "Failed to unlock lineup" })
    }
  })

  // ===== LIVE SHOW WEEKLY SYSTEM ROUTES =====

  // Get current week edition
  app.get("/api/live-weekly/current", async (req, res) => {
    try {
      const now = new Date()
      const weekNumber = Math.ceil(
        (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
      )
      const year = now.getFullYear()

      const edition = await storage.getCurrentWeekEdition(weekNumber, year)

      if (!edition) {
        return res.status(404).json({ message: "No current edition found" })
      }

      res.json(edition)
    } catch (error) {
      console.error("Error fetching current edition:", error)
      res.status(500).json({ message: "Failed to fetch current edition" })
    }
  })

  // Get edition candidates
  app.get("/api/live-weekly/candidates/:editionId", async (req, res) => {
    try {
      const { editionId } = req.params
      const candidates = await storage.getLiveShowCandidates(editionId)

      res.json(candidates)
    } catch (error) {
      console.error("Error fetching candidates:", error)
      res.status(500).json({ message: "Failed to fetch candidates" })
    }
  })

  // Submit community vote (Phase 1 & 2)
  app.post("/api/live-weekly/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const { candidateId } = req.body

      if (!candidateId) {
        return res.status(400).json({ message: "Candidate ID required" })
      }

      const candidate = await storage.getLiveShowCandidate(candidateId)
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" })
      }

      const edition = await storage.getLiveShowEdition(candidate.editionId)
      if (!edition) {
        return res.status(404).json({ message: "Edition not found" })
      }

      // Check if voting is allowed (phase 1 or 2)
      if (edition.currentPhase !== "phase1" && edition.currentPhase !== "phase2") {
        return res.status(400).json({ message: "Voting not allowed in current phase" })
      }

      const vote = await storage.createLiveShowCommunityVote({
        candidateId,
        voterId: userId,
        phase: edition.currentPhase,
      })

      res.json({ success: true, vote })
    } catch (error) {
      console.error("Error submitting vote:", error)
      res.status(500).json({ message: "Failed to submit vote" })
    }
  })

  // Battle investment (Live phase only)
  app.post("/api/live-weekly/invest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const { finalist, editionId, amountEUR } = req.body

      if (!finalist || !editionId || !amountEUR) {
        return res.status(400).json({ message: "Finalist (A/B), edition ID, and amount required" })
      }

      if (finalist !== "A" && finalist !== "B") {
        return res.status(400).json({ message: "Finalist must be 'A' or 'B'" })
      }

      const edition = await storage.getLiveShowEdition(editionId)
      if (!edition) {
        return res.status(404).json({ message: "Edition not found" })
      }

      // Check if battle is running
      if (edition.currentPhase !== "live") {
        return res.status(400).json({ message: "Investments only allowed during Live Show" })
      }

      if (edition.currentState !== "live_running") {
        return res.status(400).json({ message: "Battle not currently running" })
      }

      // Validate investment amount
      const { INVEST_TRANCHES_EUR, votesForAmount } = await import("@shared/liveShowConstants")
      if (!INVEST_TRANCHES_EUR.includes(amountEUR)) {
        return res.status(400).json({ message: "Invalid investment amount" })
      }

      const votes = votesForAmount(amountEUR)

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amountEUR * 100),
        currency: "eur",
        metadata: {
          type: "live_show_weekly_battle",
          depositAmount: amountEUR.toString(),
          finalist,
          editionId,
          userId,
          votes: votes.toString(),
        },
      })

      // Create investment record (pending until payment confirmed)
      const investment = await storage.createLiveShowBattleInvestment({
        editionId: edition.id,
        liveShowId: edition.liveShowId,
        userId,
        finalist,
        amountEUR: amountEUR.toString(),
        votes,
        paymentIntentId: paymentIntent.id,
      })

      // Emit score update via WebSocket
      try {
        const { getNotificationService } = await import("./websocket")
        const wsService = getNotificationService()

        // Get updated scoreboard
        const investments = await storage.getLiveShowBattleInvestments(edition.id)
        const scoreboard = investments.reduce((acc: any, inv) => {
          if (!acc[inv.finalist]) {
            acc[inv.finalist] = {
              finalist: inv.finalist,
              totalVotes: 0,
              totalAmount: 0,
              investorCount: 0,
            }
          }
          acc[inv.finalist].totalVotes += inv.votes
          acc[inv.finalist].totalAmount += Number.parseFloat(inv.amountEUR)
          acc[inv.finalist].investorCount += 1
          return acc
        }, {})

        wsService.emitLiveWeeklyScoreUpdate(edition.id, {
          scoreboard: Object.values(scoreboard),
          latestInvestment: {
            finalist: investment.finalist,
            amount: investment.amountEUR,
            votes: investment.votes,
          },
        })
      } catch (wsError) {
        console.error("Failed to emit WebSocket score update:", wsError)
      }

      res.json({
        success: true,
        investment,
        clientSecret: paymentIntent.client_secret,
      })
    } catch (error) {
      console.error("Error processing investment:", error)
      res.status(500).json({ message: "Failed to process investment" })
    }
  })

  // Get scoreboard
  app.get("/api/live-weekly/scoreboard/:editionId", async (req, res) => {
    try {
      const { editionId } = req.params
      const investments = await storage.getLiveShowBattleInvestments(editionId)

      // Aggregate by finalist
      const scoreboard = investments.reduce((acc: any, inv) => {
        if (!acc[inv.finalist]) {
          acc[inv.finalist] = {
            finalist: inv.finalist,
            totalVotes: 0,
            totalAmount: 0,
            investorCount: 0,
          }
        }

        acc[inv.finalist].totalVotes += inv.votes
        acc[inv.finalist].totalAmount += Number.parseFloat(inv.amountEUR)
        acc[inv.finalist].investorCount += 1

        return acc
      }, {})

      res.json(Object.values(scoreboard))
    } catch (error) {
      console.error("Error fetching scoreboard:", error)
      res.status(500).json({ message: "Failed to fetch scoreboard" })
    }
  })

  // Admin middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Authentication required" })
      }

      const user = await storage.getUser(req.user.claims.sub)
      if (!user || user.profileType !== "admin") {
        return res.status(403).json({ message: "Admin access required" })
      }

      next()
    } catch (error) {
      console.error("Admin check error:", error)
      res.status(500).json({ message: "Authorization failed" })
    }
  }

  // Admin: Create weekly edition
  app.post("/api/admin/live-weekly/create-edition", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { liveShowId, weekNumber, year } = req.body

      if (!liveShowId || !weekNumber || !year) {
        return res.status(400).json({ message: "Live Show ID, week number, and year required" })
      }

      const { LiveShowWeeklyOrchestrator } = await import("./services/liveShowWeeklyOrchestrator")
      const orchestrator = new LiveShowWeeklyOrchestrator()

      const edition = await orchestrator.createWeeklyEdition(liveShowId, weekNumber, year)

      res.json({ success: true, edition })
    } catch (error) {
      console.error("Error creating edition:", error)
      res.status(500).json({ message: "Failed to create edition" })
    }
  })

  // Compliance routes
  app.post("/api/compliance/report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const { reportType, period } = req.body
      const reportData = {
        generatedAt: new Date(),
        totalInvestments: 0,
        totalUsers: 0,
        totalProjects: 0,
        status: "generated",
        type: reportType,
        period,
      }

      const report = await storage.createComplianceReport({
        reportType,
        period,
        data: reportData,
        generatedBy: userId,
      })

      res.json(report)
    } catch (error) {
      console.error("Error generating compliance report:", error)
      res.status(500).json({ message: "Failed to generate compliance report" })
    }
  })

  app.get("/api/compliance/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const user = await storage.getUser(userId)

      if (!user || !hasProfile(user.profileTypes, "admin")) {
        return res.status(403).json({ message: "Admin access required" })
      }

      const reports = await storage.getComplianceReports()
      res.json(reports)
    } catch (error) {
      console.error("Error fetching compliance reports:", error)
      res.status(500).json({ message: "Failed to fetch compliance reports" })
    }
  })

  // Webhook handled at the top of this function

  const httpServer = createServer(app)

  // Initialize WebSocket for real-time notifications with session middleware
  const sessionMiddleware = getSession()
  console.log("[VISUAL] Initializing WebSocket notification service...")
  const wsService = initializeWebSocket(httpServer, sessionMiddleware)
  console.log(
    "[VISUAL] WebSocket service initialized successfully, connected users:",
    wsService.getConnectedUsersCount(),
  )

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const { limit = 50, offset = 0, unreadOnly = false } = req.query

      const notifications = await storage.getUserNotifications(
        userId,
        Number.parseInt(limit as string),
        Number.parseInt(offset as string),
        unreadOnly === "true",
      )

      res.json(notifications)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      res.status(500).json({ message: "Failed to fetch notifications" })
    }
  })

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const notificationId = req.params.id

      await storage.markNotificationAsRead(notificationId, userId)
      res.json({ success: true })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      res.status(500).json({ message: "Failed to mark notification as read" })
    }
  })

  app.get("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const preferences = await storage.getUserNotificationPreferences(userId)
      res.json(preferences)
    } catch (error) {
      console.error("Error fetching notification preferences:", error)
      res.status(500).json({ message: "Failed to fetch notification preferences" })
    }
  })

  app.patch("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const updates = req.body

      // Convert object updates to array format expected by storage
      const validNotificationTypes = [
        "investment_milestone",
        "funding_goal_reached",
        "project_status_change",
        "roi_update",
        "new_investment",
        "live_show_started",
        "battle_result",
        "performance_alert",
      ]

      const preferencesArray = Object.keys(updates)
        .filter((key) => validNotificationTypes.includes(key))
        .map((notificationType) => ({
          notificationType: notificationType as any,
          enabled: updates[notificationType].enabled ?? true,
          emailEnabled: updates[notificationType].emailEnabled ?? false,
          pushEnabled: updates[notificationType].pushEnabled ?? true,
          threshold: updates[notificationType].threshold,
        }))

      await storage.updateNotificationPreferences(userId, preferencesArray)

      // Return updated preferences
      const updatedPreferences = await storage.getUserNotificationPreferences(userId)
      res.json(updatedPreferences)
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      res.status(500).json({ message: "Failed to update notification preferences" })
    }
  })

  // KYC and Wallet endpoints
  app.post("/api/kyc/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub
      const { documents } = req.body

      // In simulation mode, automatically approve KYC
      const user = await storage.getUser(userId)
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Simulate KYC verification process
      const kycData = {
        documents: documents || {},
        verificationDate: new Date(),
        status: "verified",
        documentTypes: ["identity", "address_proof"],
        simulationMode: user.simulationMode,
      }

      // Update user as KYC verified
      await storage.updateUser(userId, {
        kycVerified: true,
        kycDocuments: kycData,
      })

      res.json({
        success: true,
      })
    } catch (error) {
      console.error("Error verifying KYC:", error)
      res.status(500).json({ message: "Failed to verify KYC" })
    }
  })

  // Push notification routes
  registerPushNotificationRoutes(app)

  app.use("/api/backups", backupRoutes)

  app.use("/api", livresRoutes)

  app.use("/api/admin/categories", categoryTogglesRoutes)

  return httpServer
}
