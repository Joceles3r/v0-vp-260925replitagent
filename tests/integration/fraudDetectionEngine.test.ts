import { describe, it, expect } from "vitest"
import { fraudDetectionEngine } from "../../server/services/fraudDetectionEngine"

describe("Fraud Detection Engine", () => {
  describe("Pattern Detection", () => {
    it("should detect velocity abuse", async () => {
      const transactions = Array(20)
        .fill(null)
        .map((_, i) => ({
          userId: "user-123",
          amount: 20,
          timestamp: new Date(Date.now() - i * 60000), // 1 minute apart
        }))

      const result = await fraudDetectionEngine.analyzeTransactionVelocity("user-123", transactions)

      expect(result.suspicious).toBe(true)
      expect(result.riskScore).toBeGreaterThan(70)
    })

    it("should detect IP hopping", async () => {
      const sessions = [
        { userId: "user-123", ipAddress: "192.168.1.1", timestamp: new Date() },
        { userId: "user-123", ipAddress: "10.0.0.1", timestamp: new Date(Date.now() + 60000) },
        { userId: "user-123", ipAddress: "172.16.0.1", timestamp: new Date(Date.now() + 120000) },
      ]

      const result = await fraudDetectionEngine.detectIPHopping("user-123", sessions)

      expect(result.suspicious).toBe(true)
    })

    it("should detect coordinated attacks", async () => {
      const users = ["user-1", "user-2", "user-3"]
      const projectId = "project-123"

      const result = await fraudDetectionEngine.detectCoordinatedActivity(users, projectId)

      expect(result).toHaveProperty("coordinated")
      expect(result).toHaveProperty("confidence")
    })
  })

  describe("Risk Scoring", () => {
    it("should calculate comprehensive risk score", async () => {
      const score = await fraudDetectionEngine.calculateRiskScore({
        userId: "user-123",
        transactionHistory: [],
        accountAge: 30,
        kycVerified: true,
        previousFlags: 0,
      })

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it("should increase score for suspicious behavior", async () => {
      const lowRisk = await fraudDetectionEngine.calculateRiskScore({
        userId: "user-123",
        accountAge: 365,
        kycVerified: true,
        previousFlags: 0,
      })

      const highRisk = await fraudDetectionEngine.calculateRiskScore({
        userId: "user-456",
        accountAge: 1,
        kycVerified: false,
        previousFlags: 5,
      })

      expect(highRisk).toBeGreaterThan(lowRisk)
    })
  })
})
