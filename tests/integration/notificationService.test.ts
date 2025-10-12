import { describe, it, expect } from "vitest"
import { notificationService } from "../../server/services/notificationService"

describe("Notification Service", () => {
  describe("Notification Delivery", () => {
    it("should send notification to user", async () => {
      const result = await notificationService.sendToUser("user-123", {
        type: "investment_confirmed",
        title: "Investment Confirmed",
        message: "Your investment has been confirmed",
        data: { projectId: "project-456" },
      })

      expect(result.success).toBe(true)
    })

    it("should batch notifications", async () => {
      const notifications = Array(10)
        .fill(null)
        .map((_, i) => ({
          userId: `user-${i}`,
          type: "system",
          title: "Test",
          message: "Batch test",
        }))

      const result = await notificationService.sendBatch(notifications)

      expect(result.sent).toBe(10)
      expect(result.failed).toBe(0)
    })
  })

  describe("Template Management", () => {
    it("should render notification template", async () => {
      const rendered = await notificationService.renderTemplate("investment_confirmed", {
        projectTitle: "Test Project",
        amount: 20,
      })

      expect(rendered).toContain("Test Project")
      expect(rendered).toContain("20")
    })
  })
})
