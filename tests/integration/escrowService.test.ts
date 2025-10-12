import { describe, it, expect } from "vitest"
import { escrowService } from "../../server/services/escrowService"

describe("Escrow Service", () => {
  describe("Escrow Creation", () => {
    it("should create escrow account", async () => {
      const escrow = await escrowService.createEscrow({
        projectId: "project-123",
        amount: 10000,
        releaseConditions: ["project_completion", "milestone_reached"],
      })

      expect(escrow).toHaveProperty("id")
      expect(escrow.status).toBe("active")
      expect(escrow.balance).toBe(10000)
    })
  })

  describe("Fund Management", () => {
    it("should hold funds in escrow", async () => {
      const escrow = await escrowService.createEscrow({
        projectId: "project-123",
        amount: 10000,
      })

      const deposit = await escrowService.depositToEscrow(escrow.id, 5000)

      expect(deposit.success).toBe(true)
      expect(deposit.newBalance).toBe(15000)
    })

    it("should release funds on condition met", async () => {
      const escrow = await escrowService.createEscrow({
        projectId: "project-123",
        amount: 10000,
        releaseConditions: ["project_completion"],
      })

      const release = await escrowService.releaseFunds(escrow.id, "project_completion", "admin-123")

      expect(release.success).toBe(true)
      expect(release.releasedAmount).toBe(10000)
    })
  })

  describe("Dispute Handling", () => {
    it("should freeze escrow on dispute", async () => {
      const escrow = await escrowService.createEscrow({
        projectId: "project-123",
        amount: 10000,
      })

      const freeze = await escrowService.freezeEscrow(escrow.id, "Dispute raised")

      expect(freeze.success).toBe(true)
      expect(freeze.status).toBe("frozen")
    })
  })
})
