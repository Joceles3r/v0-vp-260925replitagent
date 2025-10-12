/**
 * Stripe Connect API Routes
 * Handles Connect account creation, onboarding, and management
 */

import { Router } from "express"
import { stripeConnectService } from "../services/stripeConnectService"
import { isAuthenticated } from "../middleware/auth"

const router = Router()

// Create Connect account
router.post("/api/stripe/connect/create", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id
    const user = req.user

    const accountId = await stripeConnectService.createConnectAccount({
      userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    res.json({
      success: true,
      accountId,
    })
  } catch (error) {
    console.error("Error creating Connect account:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create Connect account",
    })
  }
})

// Get onboarding link
router.post("/api/stripe/connect/onboarding-link", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id
    const baseUrl = process.env.SITE_BASE_URL || "http://localhost:3000"

    const link = await stripeConnectService.createOnboardingLink(
      userId,
      `${baseUrl}/settings/payouts?refresh=true`,
      `${baseUrl}/settings/payouts?success=true`,
    )

    res.json({
      success: true,
      url: link.url,
      expiresAt: link.expiresAt,
    })
  } catch (error) {
    console.error("Error creating onboarding link:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create onboarding link",
    })
  }
})

// Refresh account status
router.post("/api/stripe/connect/refresh-status", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id

    const status = await stripeConnectService.refreshAccountStatus(userId)

    res.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("Error refreshing account status:", error)
    res.status(500).json({
      success: false,
      error: "Failed to refresh account status",
    })
  }
})

// Get dashboard link
router.get("/api/stripe/connect/dashboard-link", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id

    const url = await stripeConnectService.createDashboardLink(userId)

    res.json({
      success: true,
      url,
    })
  } catch (error) {
    console.error("Error creating dashboard link:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create dashboard link",
    })
  }
})

// Get account balance
router.get("/api/stripe/connect/balance", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id

    const balance = await stripeConnectService.getAccountBalance(userId)

    res.json({
      success: true,
      balance,
    })
  } catch (error) {
    console.error("Error retrieving balance:", error)
    res.status(500).json({
      success: false,
      error: "Failed to retrieve balance",
    })
  }
})

// Get Connect account status
router.get("/api/stripe/connect/status", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id

    const canReceive = await stripeConnectService.canReceivePayouts(userId)

    res.json({
      success: true,
      canReceivePayouts: canReceive,
    })
  } catch (error) {
    console.error("Error checking payout status:", error)
    res.status(500).json({
      success: false,
      error: "Failed to check payout status",
    })
  }
})

export default router
