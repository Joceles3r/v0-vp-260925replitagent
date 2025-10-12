/**
 * Tests d'intégration pour Stripe Connect
 * Path: tests/integration/stripeConnect.test.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { StripeConnectService } from "../../server/services/stripeConnectService"
import { storage } from "../../server/storage"

describe("Stripe Connect Integration", () => {
  const mockUserId = "test-user-123"
  const mockEmail = "test@visual.com"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Account Creation", () => {
    it("should create a new Stripe Connect account", async () => {
      const accountId = await StripeConnectService.createConnectAccount({
        userId: mockUserId,
        email: mockEmail,
      })

      expect(accountId).toBeTruthy()
      expect(accountId).toMatch(/^acct_/)
    })

    it("should return existing account if already created", async () => {
      const firstAccountId = await StripeConnectService.createConnectAccount({
        userId: mockUserId,
        email: mockEmail,
      })

      const secondAccountId = await StripeConnectService.createConnectAccount({
        userId: mockUserId,
        email: mockEmail,
      })

      expect(firstAccountId).toBe(secondAccountId)
    })

    it("should store account ID in user record", async () => {
      const accountId = await StripeConnectService.createConnectAccount({
        userId: mockUserId,
        email: mockEmail,
      })

      const user = await storage.getUser(mockUserId)
      expect(user?.stripeConnectAccountId).toBe(accountId)
    })
  })

  describe("Onboarding", () => {
    it("should generate onboarding link", async () => {
      const result = await StripeConnectService.createOnboardingLink(
        mockUserId,
        "https://visual.com/refresh",
        "https://visual.com/return",
      )

      expect(result.accountId).toBeTruthy()
      expect(result.onboardingUrl).toMatch(/^https:\/\/connect\.stripe\.com/)
      expect(result.expiresAt).toBeGreaterThan(Date.now() / 1000)
    })

    it("should create account if not exists during onboarding", async () => {
      const user = await storage.getUser(mockUserId)
      expect(user?.stripeConnectAccountId).toBeFalsy()

      const result = await StripeConnectService.createOnboardingLink(
        mockUserId,
        "https://visual.com/refresh",
        "https://visual.com/return",
      )

      expect(result.accountId).toBeTruthy()
    })
  })

  describe("Account Status", () => {
    it("should return account status for existing account", async () => {
      await StripeConnectService.createConnectAccount({
        userId: mockUserId,
        email: mockEmail,
      })

      const status = await StripeConnectService.getAccountStatus(mockUserId)

      expect(status.accountId).toBeTruthy()
      expect(typeof status.onboarded).toBe("boolean")
      expect(typeof status.chargesEnabled).toBe("boolean")
      expect(typeof status.payoutsEnabled).toBe("boolean")
      expect(typeof status.requiresAction).toBe("boolean")
    })

    it("should return null status for non-existent account", async () => {
      const status = await StripeConnectService.getAccountStatus("non-existent-user")

      expect(status.accountId).toBeNull()
      expect(status.onboarded).toBe(false)
      expect(status.chargesEnabled).toBe(false)
      expect(status.payoutsEnabled).toBe(false)
      expect(status.requiresAction).toBe(true)
    })
  })

  describe("Account Synchronization", () => {
    it("should sync account status from Stripe", async () => {
      const accountId = await StripeConnectService.createConnectAccount({
        userId: mockUserId,
        email: mockEmail,
      })

      await StripeConnectService.syncAccountStatus(mockUserId)

      const user = await storage.getUser(mockUserId)
      expect(user?.stripeConnectAccountId).toBe(accountId)
      expect(typeof user?.stripeConnectOnboarded).toBe("boolean")
      expect(typeof user?.stripeConnectChargesEnabled).toBe("boolean")
      expect(typeof user?.stripeConnectPayoutsEnabled).toBe("boolean")
    })

    it("should handle sync for non-existent account gracefully", async () => {
      await expect(StripeConnectService.syncAccountStatus("non-existent-user")).resolves.not.toThrow()
    })
  })

  describe("Dashboard Access", () => {
    it("should create dashboard link for onboarded account", async () => {
      await StripeConnectService.createConnectAccount({
        userId: mockUserId,
        email: mockEmail,
      })

      const dashboardUrl = await StripeConnectService.createDashboardLink(mockUserId)

      expect(dashboardUrl).toMatch(/^https:\/\/connect\.stripe\.com/)
    })

    it("should throw error for non-existent account", async () => {
      await expect(StripeConnectService.createDashboardLink("non-existent-user")).rejects.toThrow()
    })
  })
})
