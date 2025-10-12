/**
 * Stripe Connect Service
 * Manages Stripe Connect account creation, onboarding, and verification
 */

import Stripe from "stripe"
import { storage } from "../storage"
import { auditTrail } from "./auditTrail"
import { STRIPE_CONFIG } from "../../shared/constants"

let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required")
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: STRIPE_CONFIG.API_VERSION as any,
    })
  }
  return stripeInstance
}

export interface CreateConnectAccountParams {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  country?: string
}

export interface OnboardingLinkResult {
  url: string
  expiresAt: number
}

export class StripeConnectService {
  /**
   * Create a Stripe Connect Express account for a user
   */
  static async createConnectAccount(params: CreateConnectAccountParams): Promise<string> {
    const { userId, email, firstName, lastName, country = "FR" } = params

    try {
      const stripe = getStripeInstance()

      // Check if user already has a Connect account
      const user = await storage.getUser(userId)
      if (user?.stripeConnectAccountId) {
        console.log(`[Stripe Connect] User ${userId} already has account: ${user.stripeConnectAccountId}`)
        return user.stripeConnectAccountId
      }

      // Create Express account
      const account = await stripe.accounts.create({
        type: "express",
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        individual: {
          email,
          first_name: firstName,
          last_name: lastName,
        },
        metadata: {
          visual_user_id: userId,
        },
      })

      // Update user with Connect account ID
      await storage.updateUser(userId, {
        stripeConnectAccountId: account.id,
      })

      await auditTrail.appendAudit("stripe_connect_account_created", userId, {
        accountId: account.id,
        email,
        country,
      })

      console.log(`[Stripe Connect] Created account ${account.id} for user ${userId}`)
      return account.id
    } catch (error) {
      console.error("[Stripe Connect] Error creating account:", error)
      throw new Error(`Failed to create Stripe Connect account: ${error}`)
    }
  }

  /**
   * Generate an onboarding link for a Connect account
   */
  static async createOnboardingLink(
    userId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<OnboardingLinkResult> {
    try {
      const stripe = getStripeInstance()
      const user = await storage.getUser(userId)

      if (!user?.stripeConnectAccountId) {
        throw new Error("User does not have a Stripe Connect account")
      }

      const accountLink = await stripe.accountLinks.create({
        account: user.stripeConnectAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      })

      console.log(`[Stripe Connect] Created onboarding link for ${user.stripeConnectAccountId}`)

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      }
    } catch (error) {
      console.error("[Stripe Connect] Error creating onboarding link:", error)
      throw new Error(`Failed to create onboarding link: ${error}`)
    }
  }

  /**
   * Retrieve and update Connect account status
   */
  static async refreshAccountStatus(userId: string): Promise<{
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
  }> {
    try {
      const stripe = getStripeInstance()
      const user = await storage.getUser(userId)

      if (!user?.stripeConnectAccountId) {
        throw new Error("User does not have a Stripe Connect account")
      }

      const account = await stripe.accounts.retrieve(user.stripeConnectAccountId)

      const status = {
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        detailsSubmitted: account.details_submitted || false,
      }

      // Update user record
      await storage.updateUser(userId, {
        stripeConnectChargesEnabled: status.chargesEnabled,
        stripeConnectPayoutsEnabled: status.payoutsEnabled,
        stripeConnectOnboarded: status.detailsSubmitted,
        stripeConnectOnboardedAt: status.detailsSubmitted ? new Date() : null,
      })

      console.log(`[Stripe Connect] Refreshed status for ${user.stripeConnectAccountId}:`, status)

      return status
    } catch (error) {
      console.error("[Stripe Connect] Error refreshing account status:", error)
      throw new Error(`Failed to refresh account status: ${error}`)
    }
  }

  /**
   * Create a login link for Connect dashboard access
   */
  static async createDashboardLink(userId: string): Promise<string> {
    try {
      const stripe = getStripeInstance()
      const user = await storage.getUser(userId)

      if (!user?.stripeConnectAccountId) {
        throw new Error("User does not have a Stripe Connect account")
      }

      const loginLink = await stripe.accounts.createLoginLink(user.stripeConnectAccountId)

      console.log(`[Stripe Connect] Created dashboard link for ${user.stripeConnectAccountId}`)

      return loginLink.url
    } catch (error) {
      console.error("[Stripe Connect] Error creating dashboard link:", error)
      throw new Error(`Failed to create dashboard link: ${error}`)
    }
  }

  /**
   * Check if user can receive payouts
   */
  static async canReceivePayouts(userId: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId)

      if (!user?.stripeConnectAccountId) {
        return false
      }

      if (!user.stripeConnectOnboarded || !user.stripeConnectPayoutsEnabled) {
        // Refresh status to get latest info
        const status = await this.refreshAccountStatus(userId)
        return status.payoutsEnabled
      }

      return true
    } catch (error) {
      console.error("[Stripe Connect] Error checking payout eligibility:", error)
      return false
    }
  }

  /**
   * Get Connect account balance
   */
  static async getAccountBalance(userId: string): Promise<{
    available: number
    pending: number
    currency: string
  }> {
    try {
      const stripe = getStripeInstance()
      const user = await storage.getUser(userId)

      if (!user?.stripeConnectAccountId) {
        throw new Error("User does not have a Stripe Connect account")
      }

      const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripeConnectAccountId,
      })

      const availableBalance = balance.available[0] || { amount: 0, currency: "eur" }
      const pendingBalance = balance.pending[0] || { amount: 0, currency: "eur" }

      return {
        available: availableBalance.amount / 100,
        pending: pendingBalance.amount / 100,
        currency: availableBalance.currency,
      }
    } catch (error) {
      console.error("[Stripe Connect] Error retrieving balance:", error)
      throw new Error(`Failed to retrieve balance: ${error}`)
    }
  }
}

export const stripeConnectService = StripeConnectService
