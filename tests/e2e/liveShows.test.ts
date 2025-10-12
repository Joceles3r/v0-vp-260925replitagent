/**
 * E2E Tests for Live Shows & Battles System
 * Tests the complete orchestrator workflow from designation to payout
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals"
import { liveShowOrchestrator } from "../../server/services/liveShowOrchestrator"
import { liveShowWeeklyOrchestrator } from "../../server/services/liveShowWeeklyOrchestrator"
import { storage } from "../../server/storage"
import type { LiveShow, LiveShowEdition, User } from "@shared/schema"

describe("Live Shows E2E Tests", () => {
  let testShow: LiveShow
  let testEdition: LiveShowEdition
  let testUsers: User[]

  beforeAll(async () => {
    // Create test users
    testUsers = await Promise.all([
      storage.createUser({ username: "artist1", email: "artist1@test.com", role: "user" }),
      storage.createUser({ username: "artist2", email: "artist2@test.com", role: "user" }),
      storage.createUser({ username: "artist3", email: "artist3@test.com", role: "user" }),
      storage.createUser({ username: "artist4", email: "artist4@test.com", role: "user" }),
    ])
  })

  afterAll(async () => {
    // Cleanup test data
    if (testShow) await storage.deleteLiveShow(testShow.id)
    for (const user of testUsers) {
      await storage.deleteUser(user.id)
    }
  })

  describe("Orchestrator - Finalist Management", () => {
    beforeEach(async () => {
      const scheduledStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const scheduledEnd = new Date(scheduledStart.getTime() + 3 * 60 * 60 * 1000)

      testShow = await liveShowOrchestrator.createLiveShow({
        weekNumber: 1,
        title: "Test Live Show Week 1",
        description: "E2E Test Show",
        scheduledStart,
        scheduledEnd,
      })
    })

    it("should designate finalists and alternates", async () => {
      const finalists = await liveShowOrchestrator.designateFinalists(testShow.id, [
        { userId: testUsers[0].id, artistName: "Artist 1", rank: 1, role: "finalist" },
        { userId: testUsers[1].id, artistName: "Artist 2", rank: 2, role: "finalist" },
        { userId: testUsers[2].id, artistName: "Artist 3", rank: 3, role: "alternate" },
        { userId: testUsers[3].id, artistName: "Artist 4", rank: 4, role: "alternate" },
      ])

      expect(finalists).toHaveLength(4)
      expect(finalists[0].role).toBe("finalist")
      expect(finalists[2].role).toBe("alternate")
    })

    it("should request confirmations from finalists", async () => {
      await liveShowOrchestrator.designateFinalists(testShow.id, [
        { userId: testUsers[0].id, artistName: "Artist 1", rank: 1, role: "finalist" },
        { userId: testUsers[1].id, artistName: "Artist 2", rank: 2, role: "finalist" },
      ])

      await liveShowOrchestrator.requestConfirmations(testShow.id)

      const lineup = await liveShowOrchestrator.getLineupState(testShow.id)
      expect(lineup.F1?.confirmationRequestedAt).toBeTruthy()
      expect(lineup.F2?.confirmationRequestedAt).toBeTruthy()
    })

    it("should confirm finalist participation", async () => {
      const finalists = await liveShowOrchestrator.designateFinalists(testShow.id, [
        { userId: testUsers[0].id, artistName: "Artist 1", rank: 1, role: "finalist" },
      ])

      const result = await liveShowOrchestrator.confirmParticipation(finalists[0].id, testUsers[0].id)

      expect(result.success).toBe(true)

      const lineup = await liveShowOrchestrator.getLineupState(testShow.id)
      expect(lineup.F1?.status).toBe("confirmed")
    })

    it("should handle S1 replacement scenario (F1 cancels, A1 promotes)", async () => {
      const finalists = await liveShowOrchestrator.designateFinalists(testShow.id, [
        { userId: testUsers[0].id, artistName: "Artist 1", rank: 1, role: "finalist" },
        { userId: testUsers[1].id, artistName: "Artist 2", rank: 2, role: "finalist" },
        { userId: testUsers[2].id, artistName: "Artist 3", rank: 3, role: "alternate" },
      ])

      // F1 cancels
      const cancelResult = await liveShowOrchestrator.cancelParticipation(
        finalists[0].id,
        testUsers[0].id,
        "Personal emergency",
      )

      expect(cancelResult.success).toBe(true)
      expect(cancelResult.scenario?.scenario).toBe("S1")
      expect(cancelResult.scenario?.targetSlot).toBe("F1")

      // Check A1 was promoted to F1
      const lineup = await liveShowOrchestrator.getLineupState(testShow.id)
      expect(lineup.F1?.userId).toBe(testUsers[2].id)
      expect(lineup.F1?.status).toBe("promoted")
    })

    it("should handle S4 replacement scenario (both finalists cancel, both alternates promote)", async () => {
      const finalists = await liveShowOrchestrator.designateFinalists(testShow.id, [
        { userId: testUsers[0].id, artistName: "Artist 1", rank: 1, role: "finalist" },
        { userId: testUsers[1].id, artistName: "Artist 2", rank: 2, role: "finalist" },
        { userId: testUsers[2].id, artistName: "Artist 3", rank: 3, role: "alternate" },
        { userId: testUsers[3].id, artistName: "Artist 4", rank: 4, role: "alternate" },
      ])

      // Both finalists cancel
      await liveShowOrchestrator.cancelParticipation(finalists[0].id, testUsers[0].id)
      await liveShowOrchestrator.cancelParticipation(finalists[1].id, testUsers[1].id)

      const lineup = await liveShowOrchestrator.getLineupState(testShow.id)
      expect(lineup.F1?.userId).toBe(testUsers[2].id)
      expect(lineup.F2?.userId).toBe(testUsers[3].id)
      expect(lineup.F1?.status).toBe("promoted")
      expect(lineup.F2?.status).toBe("promoted")
    })

    it("should activate showcase mode when only one alternate available", async () => {
      const finalists = await liveShowOrchestrator.designateFinalists(testShow.id, [
        { userId: testUsers[0].id, artistName: "Artist 1", rank: 1, role: "finalist" },
        { userId: testUsers[1].id, artistName: "Artist 2", rank: 2, role: "finalist" },
        { userId: testUsers[2].id, artistName: "Artist 3", rank: 3, role: "alternate" },
      ])

      // Both finalists cancel
      await liveShowOrchestrator.cancelParticipation(finalists[0].id, testUsers[0].id)
      await liveShowOrchestrator.cancelParticipation(finalists[1].id, testUsers[1].id)

      const show = await storage.getLiveShow(testShow.id)
      expect(show?.fallbackMode).toBe("showcase")
    })

    it("should lock lineup when 2 finalists confirmed", async () => {
      const finalists = await liveShowOrchestrator.designateFinalists(testShow.id, [
        { userId: testUsers[0].id, artistName: "Artist 1", rank: 1, role: "finalist" },
        { userId: testUsers[1].id, artistName: "Artist 2", rank: 2, role: "finalist" },
      ])

      await liveShowOrchestrator.confirmParticipation(finalists[0].id, testUsers[0].id)
      await liveShowOrchestrator.confirmParticipation(finalists[1].id, testUsers[1].id)

      const lockResult = await liveShowOrchestrator.lockLineup(testShow.id, "admin-test")
      expect(lockResult.success).toBe(true)

      const lineup = await liveShowOrchestrator.getLineupState(testShow.id)
      expect(lineup.locked).toBe(true)
    })

    it("should prevent cancellation after lineup locked", async () => {
      const finalists = await liveShowOrchestrator.designateFinalists(testShow.id, [
        { userId: testUsers[0].id, artistName: "Artist 1", rank: 1, role: "finalist" },
        { userId: testUsers[1].id, artistName: "Artist 2", rank: 2, role: "finalist" },
      ])

      await liveShowOrchestrator.confirmParticipation(finalists[0].id, testUsers[0].id)
      await liveShowOrchestrator.confirmParticipation(finalists[1].id, testUsers[1].id)
      await liveShowOrchestrator.lockLineup(testShow.id, "admin-test")

      const cancelResult = await liveShowOrchestrator.cancelParticipation(finalists[0].id, testUsers[0].id)

      expect(cancelResult.success).toBe(false)
      expect(cancelResult.error).toContain("verrouillé")
    })
  })

  describe("Weekly Orchestrator - Battle Workflow", () => {
    beforeEach(async () => {
      const scheduledStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const scheduledEnd = new Date(scheduledStart.getTime() + 3 * 60 * 60 * 1000)

      testShow = await liveShowOrchestrator.createLiveShow({
        weekNumber: 1,
        title: "Test Weekly Battle",
        scheduledStart,
        scheduledEnd,
      })

      testEdition = await liveShowWeeklyOrchestrator.createWeeklyEdition(testShow.id, 1, 2025)
    })

    it("should create weekly edition with correct phase timestamps", () => {
      expect(testEdition.currentPhase).toBe("phase1")
      expect(testEdition.currentState).toBe("planned")
      expect(testEdition.phase1StartsAt).toBeTruthy()
      expect(testEdition.phase2StartsAt).toBeTruthy()
      expect(testEdition.liveStartsAt).toBeTruthy()
    })

    it("should run Phase 1 selection (100 → 50)", async () => {
      // Create 100 test candidates
      const candidates = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          storage.createLiveShowCandidate({
            editionId: testEdition.id,
            userId: testUsers[i % testUsers.length].id,
            artistName: `Candidate ${i + 1}`,
            status: "submitted",
            communityVotes: Math.floor(Math.random() * 100),
          }),
        ),
      )

      await liveShowWeeklyOrchestrator.runPhase1Selection(testEdition.id)

      const selected = await storage.getLiveShowCandidates(testEdition.id, "ai_selected")
      const eliminated = await storage.getLiveShowCandidates(testEdition.id, "eliminated")

      expect(selected.length).toBe(50)
      expect(eliminated.length).toBe(50)
    })

    it("should run Phase 2 selection (50 → 2 finalists)", async () => {
      // Create 50 ai_selected candidates
      await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          storage.createLiveShowCandidate({
            editionId: testEdition.id,
            userId: testUsers[i % testUsers.length].id,
            artistName: `Candidate ${i + 1}`,
            status: "ai_selected",
            communityVotes: Math.floor(Math.random() * 200),
          }),
        ),
      )

      await liveShowWeeklyOrchestrator.runPhase2Selection(testEdition.id)

      const finalists = await storage.getLiveShowCandidates(testEdition.id, "finalist")
      expect(finalists.length).toBe(2)
    })

    it("should close votes and calculate winner correctly", async () => {
      // Create battle investments
      await storage.createLiveShowBattleInvestment({
        editionId: testEdition.id,
        userId: testUsers[0].id,
        finalist: "A",
        amountEUR: "100.00",
        votes: 10,
        paymentStatus: "completed",
      })

      await storage.createLiveShowBattleInvestment({
        editionId: testEdition.id,
        userId: testUsers[1].id,
        finalist: "B",
        amountEUR: "50.00",
        votes: 5,
        paymentStatus: "completed",
      })

      const result = await liveShowWeeklyOrchestrator.closeVotesAndCalculateWinner(testEdition.id)

      expect(result.winner).toBe("A")
      expect(result.scoreA).toBe(10)
      expect(result.scoreB).toBe(5)
      expect(result.totalPot).toBe(150)
    })

    it("should distribute payouts correctly to winners and losers", async () => {
      // Create investments
      await storage.createLiveShowBattleInvestment({
        editionId: testEdition.id,
        userId: testUsers[0].id,
        finalist: "A",
        amountEUR: "100.00",
        votes: 10,
        paymentStatus: "completed",
      })

      await storage.createLiveShowBattleInvestment({
        editionId: testEdition.id,
        userId: testUsers[1].id,
        finalist: "B",
        amountEUR: "50.00",
        votes: 5,
        paymentStatus: "completed",
      })

      await liveShowWeeklyOrchestrator.distributeBattlePayouts(testEdition.id, "A")

      const investments = await storage.getLiveShowBattleInvestments(testEdition.id)
      const winnerInvestment = investments.find((inv) => inv.finalist === "A")
      const loserInvestment = investments.find((inv) => inv.finalist === "B")

      expect(winnerInvestment?.isWinner).toBe(true)
      expect(Number.parseFloat(winnerInvestment?.payoutAmount || "0")).toBeGreaterThan(100)
      expect(loserInvestment?.isWinner).toBe(false)
      expect(Number.parseFloat(loserInvestment?.payoutAmount || "0")).toBeGreaterThan(0)
    })

    it("should update edition state based on current time", async () => {
      await liveShowWeeklyOrchestrator.updateEditionState(testEdition.id)

      const updatedEdition = await storage.getLiveShowEdition(testEdition.id)
      expect(updatedEdition?.currentState).toBeDefined()
      expect(updatedEdition?.currentPhase).toBeDefined()
    })
  })

  describe("Penalty System", () => {
    it("should apply late cancellation penalty", async () => {
      await liveShowOrchestrator.applyPenalty(testUsers[0].id, testShow.id, "late_cancellation", "warning")

      const penalties = await storage.getUserPenalties(testUsers[0].id)
      expect(penalties.length).toBeGreaterThan(0)
      expect(penalties[0].penaltyType).toBe("late_cancellation")
    })

    it("should apply temporary ban with edition count", async () => {
      await liveShowOrchestrator.applyPenalty(testUsers[0].id, testShow.id, "no_show", "temporary_ban", 3)

      const penalties = await storage.getUserPenalties(testUsers[0].id)
      const ban = penalties.find((p) => p.severity === "temporary_ban")

      expect(ban).toBeTruthy()
      expect(ban?.editionsAffected).toBe(3)
      expect(ban?.expiresAt).toBeTruthy()
    })
  })
})
