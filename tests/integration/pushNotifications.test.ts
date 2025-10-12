import { describe, it, expect, beforeAll, afterAll } from "@jest/globals"
import request from "supertest"
import type { Express } from "express"

describe("Push Notifications Integration Tests", () => {
  let app: Express
  let authToken: string
  let userId: string

  beforeAll(async () => {
    // Setup test app and authenticate
  })

  afterAll(async () => {
    // Cleanup
  })

  describe("VAPID Key Endpoint", () => {
    it("should return VAPID public key", async () => {
      const response = await request(app).get("/api/push/vapid-public-key").expect(200)

      expect(response.body).toHaveProperty("publicKey")
      expect(typeof response.body.publicKey).toBe("string")
      expect(response.body.publicKey.length).toBeGreaterThan(0)
    })
  })

  describe("Subscription Management", () => {
    const mockSubscription = {
      endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
      keys: {
        p256dh: "test-p256dh-key",
        auth: "test-auth-key",
      },
    }

    it("should subscribe user to push notifications", async () => {
      const response = await request(app)
        .post("/api/push/subscribe")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ subscription: mockSubscription })
        .expect(200)

      expect(response.body).toHaveProperty("success", true)
    })

    it("should reject subscription without auth", async () => {
      await request(app).post("/api/push/subscribe").send({ subscription: mockSubscription }).expect(401)
    })

    it("should reject invalid subscription data", async () => {
      await request(app)
        .post("/api/push/subscribe")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ subscription: { invalid: "data" } })
        .expect(400)
    })

    it("should get subscription status", async () => {
      const response = await request(app)
        .get("/api/push/status")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty("subscribed")
      expect(typeof response.body.subscribed).toBe("boolean")
    })

    it("should unsubscribe from push notifications", async () => {
      const response = await request(app)
        .post("/api/push/unsubscribe")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty("success", true)
    })
  })

  describe("Test Notifications", () => {
    beforeAll(async () => {
      // Re-subscribe for test notifications
      await request(app)
        .post("/api/push/subscribe")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          subscription: {
            endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
            keys: {
              p256dh: "test-p256dh-key",
              auth: "test-auth-key",
            },
          },
        })
    })

    it("should send test notification to subscribed user", async () => {
      const response = await request(app).post("/api/push/test").set("Authorization", `Bearer ${authToken}`).expect(200)

      expect(response.body).toHaveProperty("success", true)
      expect(response.body).toHaveProperty("message")
    })

    it("should fail to send test notification without subscription", async () => {
      // Unsubscribe first
      await request(app).post("/api/push/unsubscribe").set("Authorization", `Bearer ${authToken}`)

      await request(app).post("/api/push/test").set("Authorization", `Bearer ${authToken}`).expect(404)
    })
  })

  describe("Admin Notification Endpoints", () => {
    let adminToken: string

    beforeAll(async () => {
      // Setup admin authentication
    })

    it("should send notification to specific users (admin only)", async () => {
      const response = await request(app)
        .post("/api/push/send")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userIds: [userId],
          payload: {
            title: "Test Admin Notification",
            body: "This is a test notification from admin",
            icon: "/logo.svg",
          },
        })
        .expect(200)

      expect(response.body).toHaveProperty("sent")
      expect(response.body).toHaveProperty("failed")
    })

    it("should reject non-admin users from sending notifications", async () => {
      await request(app)
        .post("/api/push/send")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          userIds: [userId],
          payload: {
            title: "Test",
            body: "Test",
          },
        })
        .expect(403)
    })

    it("should broadcast notification to all users (admin only)", async () => {
      const response = await request(app)
        .post("/api/push/broadcast")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          payload: {
            title: "Platform Announcement",
            body: "Important update for all users",
            icon: "/logo.svg",
            requireInteraction: true,
          },
        })
        .expect(200)

      expect(response.body).toHaveProperty("sent")
      expect(response.body).toHaveProperty("failed")
    })
  })

  describe("Notification Templates", () => {
    it("should use correct template for investment notifications", async () => {
      const { NotificationTemplates } = await import("../server/services/pushNotificationService")

      const notification = NotificationTemplates.newInvestment("Test Project", 50)

      expect(notification.title).toContain("investissement")
      expect(notification.body).toContain("50")
      expect(notification.body).toContain("Test Project")
      expect(notification.tag).toBe("investment")
    })

    it("should use correct template for live show notifications", async () => {
      const { NotificationTemplates } = await import("../server/services/pushNotificationService")

      const notification = NotificationTemplates.liveShowStarted("Epic Battle")

      expect(notification.title).toContain("Live")
      expect(notification.body).toContain("Epic Battle")
      expect(notification.requireInteraction).toBe(true)
      expect(notification.actions).toHaveLength(2)
    })
  })
})
