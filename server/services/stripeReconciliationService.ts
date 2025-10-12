import Stripe from "stripe"
import { storage } from "../storage"
import { logger } from "../config/logger"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

/**
 * Reconciliation service for Stripe Connect payments
 * Ensures database state matches Stripe's authoritative records
 */
export class StripeReconciliationService {
  /**
   * Reconcile all pending transfers with Stripe
   */
  async reconcilePendingTransfers(): Promise<{
    reconciled: number
    failed: number
    errors: string[]
  }> {
    const pendingTransfers = await storage.getStripeTransfersByStatus("pending")
    let reconciled = 0
    let failed = 0
    const errors: string[] = []

    for (const transfer of pendingTransfers) {
      try {
        // Fetch authoritative state from Stripe
        const stripeTransfer = await stripe.transfers.retrieve(transfer.stripeTransferId)

        // Update local state to match Stripe
        const newStatus = stripeTransfer.reversed ? "reversed" : "completed"
        await storage.updateStripeTransferStatus(transfer.id, newStatus)

        reconciled++
        logger.info(`Reconciled transfer ${transfer.id}: ${transfer.status} → ${newStatus}`)
      } catch (error) {
        failed++
        const errorMsg = `Failed to reconcile transfer ${transfer.id}: ${error}`
        errors.push(errorMsg)
        logger.error(errorMsg)
      }
    }

    return { reconciled, failed, errors }
  }

  /**
   * Reconcile Connect account statuses
   */
  async reconcileConnectAccounts(): Promise<{
    reconciled: number
    failed: number
    errors: string[]
  }> {
    const users = await storage.getUsersWithStripeConnect()
    let reconciled = 0
    let failed = 0
    const errors: string[] = []

    for (const user of users) {
      if (!user.stripeConnectAccountId) continue

      try {
        // Fetch authoritative state from Stripe
        const account = await stripe.accounts.retrieve(user.stripeConnectAccountId)

        // Update local state to match Stripe
        await storage.updateUser(user.id, {
          stripeConnectOnboardingComplete: account.charges_enabled && account.payouts_enabled,
          stripeConnectAccountStatus: account.charges_enabled ? "active" : "restricted",
        })

        reconciled++
        logger.info(`Reconciled Connect account for user ${user.id}`)
      } catch (error) {
        failed++
        const errorMsg = `Failed to reconcile Connect account for user ${user.id}: ${error}`
        errors.push(errorMsg)
        logger.error(errorMsg)
      }
    }

    return { reconciled, failed, errors }
  }

  /**
   * Verify payout completion and update database
   */
  async verifyPayouts(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    verified: number
    mismatches: Array<{ payoutId: string; issue: string }>
  }> {
    const payouts = await stripe.payouts.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    })

    let verified = 0
    const mismatches: Array<{ payoutId: string; issue: string }> = []

    for (const payout of payouts.data) {
      const transfer = await storage.getStripeTransferByPayoutId(payout.id)

      if (!transfer) {
        mismatches.push({
          payoutId: payout.id,
          issue: "Payout exists in Stripe but not in database",
        })
        continue
      }

      // Verify status matches
      const expectedStatus = payout.status === "paid" ? "completed" : payout.status === "failed" ? "failed" : "pending"

      if (transfer.status !== expectedStatus) {
        await storage.updateStripeTransferStatus(transfer.id, expectedStatus)
        mismatches.push({
          payoutId: payout.id,
          issue: `Status mismatch: DB had ${transfer.status}, Stripe has ${payout.status}`,
        })
      }

      verified++
    }

    return { verified, mismatches }
  }
}

export const reconciliationService = new StripeReconciliationService()
