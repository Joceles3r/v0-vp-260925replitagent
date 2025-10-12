import { describe, it, expect } from "vitest"
import { visualAIService } from "../../server/services/visualAI"

describe("VisualAI Service - Core Orchestration", () => {
  describe("Fraud Detection", () => {
    it("should detect suspicious investment patterns", async () => {
      const result = await visualAIService.analyzeFraudRisk({
        userId: "test-user-1",
        investmentAmount: 20,
        projectId: "test-project-1",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      })

      expect(result).toHaveProperty("riskScore")
      expect(result.riskScore).toBeGreaterThanOrEqual(0)
      expect(result.riskScore).toBeLessThanOrEqual(100)
    })

    it("should flag rapid successive investments", async () => {
      const investments = Array(10)
        .fill(null)
        .map((_, i) => ({
          userId: "test-user-2",
          investmentAmount: 20,
          projectId: `project-${i}`,
          timestamp: new Date(Date.now() - i * 1000),
        }))

      const result = await visualAIService.detectRapidInvestments("test-user-2", investments)

      expect(result.suspicious).toBe(true)
      expect(result.reason).toContain("rapid")
    })
  })

  describe("Engagement Scoring", () => {
    it("should calculate engagement coefficient correctly", async () => {
      const score = await visualAIService.calculateEngagementCoefficient({
        views: 1000,
        likes: 100,
        comments: 50,
        shares: 25,
        watchTime: 5000,
      })

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it("should boost score for high engagement", async () => {
      const highEngagement = await visualAIService.calculateEngagementCoefficient({
        views: 10000,
        likes: 2000,
        comments: 500,
        shares: 300,
        watchTime: 50000,
      })

      const lowEngagement = await visualAIService.calculateEngagementCoefficient({
        views: 100,
        likes: 5,
        comments: 1,
        shares: 0,
        watchTime: 500,
      })

      expect(highEngagement).toBeGreaterThan(lowEngagement)
    })
  })

  describe("Content Moderation", () => {
    it("should flag inappropriate content", async () => {
      const result = await visualAIService.moderateContent({
        contentId: "test-content-1",
        contentType: "video",
        title: "Test Video",
        description: "This contains inappropriate language: [REDACTED]",
      })

      expect(result.flagged).toBe(true)
      expect(result.reasons).toContain("inappropriate_language")
    })

    it("should approve clean content", async () => {
      const result = await visualAIService.moderateContent({
        contentId: "test-content-2",
        contentType: "video",
        title: "Beautiful Landscape",
        description: "A stunning view of mountains at sunset",
      })

      expect(result.flagged).toBe(false)
    })
  })
})
