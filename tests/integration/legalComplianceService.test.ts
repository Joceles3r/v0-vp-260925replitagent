import { describe, it, expect } from "vitest"
import { legalComplianceService } from "../../server/services/legalComplianceService"

describe("Legal Compliance Service", () => {
  describe("Terms Management", () => {
    it("should track terms acceptance", async () => {
      const result = await legalComplianceService.recordTermsAcceptance({
        userId: "user-123",
        termsVersion: "2.0",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      })

      expect(result.success).toBe(true)
      expect(result.acceptedAt).toBeDefined()
    })

    it("should require re-acceptance for new versions", async () => {
      await legalComplianceService.recordTermsAcceptance({
        userId: "user-123",
        termsVersion: "1.0",
        ipAddress: "192.168.1.1",
      })

      const needsAcceptance = await legalComplianceService.needsTermsAcceptance("user-123", "2.0")

      expect(needsAcceptance).toBe(true)
    })
  })

  describe("GDPR Compliance", () => {
    it("should export user data", async () => {
      const data = await legalComplianceService.exportUserData("user-123")

      expect(data).toHaveProperty("personalInfo")
      expect(data).toHaveProperty("investments")
      expect(data).toHaveProperty("transactions")
    })

    it("should anonymize deleted user data", async () => {
      const result = await legalComplianceService.anonymizeUserData("user-123")

      expect(result.success).toBe(true)
      expect(result.anonymizedFields).toContain("email")
      expect(result.anonymizedFields).toContain("firstName")
    })
  })

  describe("Consent Management", () => {
    it("should record marketing consent", async () => {
      const result = await legalComplianceService.recordConsent({
        userId: "user-123",
        consentType: "marketing",
        granted: true,
      })

      expect(result.success).toBe(true)
    })

    it("should allow consent withdrawal", async () => {
      await legalComplianceService.recordConsent({
        userId: "user-123",
        consentType: "marketing",
        granted: true,
      })

      const withdrawal = await legalComplianceService.withdrawConsent({
        userId: "user-123",
        consentType: "marketing",
      })

      expect(withdrawal.success).toBe(true)
    })
  })
})
