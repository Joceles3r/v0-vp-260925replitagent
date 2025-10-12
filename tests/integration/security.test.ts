import { describe, it, expect, beforeAll } from "vitest"
import request from "supertest"
import express from "express"
import { setupSecurity } from "../../server/config/security"
import { csrfProtection } from "../../server/middleware/csrfProtection"
import { validateRequest } from "../../server/middleware/inputValidation"
import { sqlInjectionProtection } from "../../server/middleware/sqlInjectionProtection"

describe("Security Middleware Tests", () => {
  let app: express.Application

  beforeAll(() => {
    app = express()
    app.use(express.json())
    setupSecurity(app)

    app.post("/test/csrf", csrfProtection, (req, res) => {
      res.json({ success: true })
    })

    app.post(
      "/test/validation",
      validateRequest([
        { field: "email", type: "email", required: true },
        { field: "age", type: "number", min: 18, max: 120 },
      ]),
      (req, res) => {
        res.json({ success: true })
      },
    )

    app.post("/test/sql", sqlInjectionProtection, (req, res) => {
      res.json({ success: true })
    })
  })

  describe("CSRF Protection", () => {
    it("should reject requests without CSRF token", async () => {
      const response = await request(app).post("/test/csrf").send({ data: "test" })

      expect(response.status).toBe(403)
      expect(response.body.code).toBe("CSRF_VALIDATION_FAILED")
    })

    it("should accept requests with valid CSRF token", async () => {
      const tokenResponse = await request(app).get("/api/csrf-token")
      const token = tokenResponse.body.token

      const response = await request(app).post("/test/csrf").set("x-csrf-token", token).send({ data: "test" })

      expect(response.status).toBe(200)
    })
  })

  describe("Input Validation", () => {
    it("should reject invalid email", async () => {
      const response = await request(app).post("/test/validation").send({ email: "invalid-email", age: 25 })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("Validation failed")
    })

    it("should reject age out of range", async () => {
      const response = await request(app).post("/test/validation").send({ email: "test@example.com", age: 150 })

      expect(response.status).toBe(400)
    })

    it("should accept valid input", async () => {
      const response = await request(app).post("/test/validation").send({ email: "test@example.com", age: 25 })

      expect(response.status).toBe(200)
    })
  })

  describe("SQL Injection Protection", () => {
    it("should detect SQL injection in body", async () => {
      const response = await request(app).post("/test/sql").send({ query: "'; DROP TABLE users; --" })

      expect(response.status).toBe(400)
      expect(response.body.code).toBe("SUSPICIOUS_INPUT")
    })

    it("should detect UNION attacks", async () => {
      const response = await request(app).post("/test/sql").send({ search: "test' UNION SELECT * FROM passwords--" })

      expect(response.status).toBe(400)
    })

    it("should allow safe input", async () => {
      const response = await request(app).post("/test/sql").send({ query: "normal search query" })

      expect(response.status).toBe(200)
    })
  })

  describe("Rate Limiting", () => {
    it("should enforce rate limits", async () => {
      const requests = Array(110)
        .fill(null)
        .map(() => request(app).get("/api/test"))

      const responses = await Promise.all(requests)
      const rateLimited = responses.filter((r) => r.status === 429)

      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })
})
