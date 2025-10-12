import { describe, it, expect } from "vitest"
import { stripeTransferService } from "../../server/services/stripeTransferService"

describe("Stripe Transfer Service", () => {
  describe("Transfer Creation", () => {
    it("should create scheduled transfer", async () => {
      const transfer = await stripeTransferService.createTransfer({
        recipientId: "user-123",
        amount: 5000, // 50 EUR
        currency: "eur",
        description: "Test payout",
        metadata: { projectId: "project-456" },
      })

      expect(transfer).toHaveProperty("id")
      expect(transfer.status).toBe("scheduled")
      expect(transfer.amount).toBe(5000)
    })

    it("should enforce 24-hour delay", async () => {
      const transfer = await stripeTransferService.createTransfer({
        recipientId: "user-123",
        amount: 5000,
        currency: "eur",
        description: "Test payout",
      })

      const scheduledFor = new Date(transfer.scheduledFor)
      const now = new Date()
      const hoursDiff = (scheduledFor.getTime() - now.getTime()) / (1000 * 60 * 60)

      expect(hoursDiff).toBeGreaterThanOrEqual(23)
      expect(hoursDiff).toBeLessThanOrEqual(25)
    })
  })

  describe("Transfer Processing", () => {
    it("should process ready transfers", async () => {
      const result = await stripeTransferService.processScheduledTransfers()

      expect(result).toHaveProperty("processed")
      expect(result).toHaveProperty("failed")
      expect(Array.isArray(result.processed)).toBe(true)
    })

    it("should retry failed transfers", async () => {
      const transfer = await stripeTransferService.createTransfer({
        recipientId: "user-123",
        amount: 5000,
        currency: "eur",
        description: "Test payout",
      })

      await stripeTransferService.markTransferFailed(transfer.id, "Test failure")

      const retryResult = await stripeTransferService.retryFailedTransfer(transfer.id)

      expect(retryResult.success).toBe(true)
    })
  })

  describe("Reconciliation", () => {
    it("should reconcile transfer status with Stripe", async () => {
      const result = await stripeTransferService.reconcileTransfers()

      expect(result).toHaveProperty("reconciled")
      expect(result).toHaveProperty("discrepancies")
    })
  })
})
