import { describe, it, expect } from "vitest"
import request from "supertest"
import { app } from "../../server"

describe("Payment Flow E2E", () => {
  it("should complete full investment flow", async () => {
    // 1. Create project
    const projectResponse = await request(app).post("/api/projects").send({
      title: "Test Project",
      description: "E2E Test",
      category: "video",
      targetAmount: 10000,
    })

    expect(projectResponse.status).toBe(201)
    const projectId = projectResponse.body.id

    // 2. Make investment
    const investmentResponse = await request(app).post("/api/investments").send({
      projectId,
      amount: 20,
    })

    expect(investmentResponse.status).toBe(201)

    // 3. Verify escrow
    const escrowResponse = await request(app).get(`/api/escrow/project/${projectId}`)

    expect(escrowResponse.status).toBe(200)
    expect(escrowResponse.body.balance).toBeGreaterThan(0)
  })
})
