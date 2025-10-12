/**
 * Tests d'intégration - Category Revenue Engine Films/Vidéos/Documentaires
 * Validation du MODULE CORRECTIF 12/10/2025
 */

import { calculateCategoryPayout, validateCategoryPayoutInput } from "../../server/services/categoryRevenueEngine"
import { selectTopMode, computeK, zipfWeights } from "../../shared/categoryRules"

describe("Category Revenue Engine - Films/Vidéos/Documentaires", () => {
  describe("Mode Selection", () => {
    it("should select TOP10 for N=30", () => {
      expect(selectTopMode(30)).toBe("TOP10")
      expect(computeK(30, "TOP10")).toBe(10)
    })

    it("should select TOP10 for N=120", () => {
      expect(selectTopMode(120)).toBe("TOP10")
      expect(computeK(120, "TOP10")).toBe(10)
    })

    it("should select TOP10PCT for N=121", () => {
      expect(selectTopMode(121)).toBe("TOP10PCT")
      expect(computeK(121, "TOP10PCT")).toBe(13) // ceil(0.10 * 121)
    })

    it("should select TOP10PCT for N=600", () => {
      expect(selectTopMode(600)).toBe("TOP10PCT")
      expect(computeK(600, "TOP10PCT")).toBe(60)
    })

    it("should select TOP10PCT for N=1300", () => {
      expect(selectTopMode(1300)).toBe("TOP10PCT")
      expect(computeK(1300, "TOP10PCT")).toBe(130)
    })

    it("should throw error for N<30", () => {
      expect(() => selectTopMode(29)).toThrow("CATEGORY_WAITING")
    })
  })

  describe("Zipf Weights", () => {
    it("should generate normalized weights for K=10", () => {
      const weights = zipfWeights(10, 1.0)
      expect(weights.length).toBe(10)

      // Somme doit être 1
      const sum = weights.reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 5)

      // Décroissant
      for (let i = 1; i < weights.length; i++) {
        expect(weights[i]).toBeLessThan(weights[i - 1])
      }
    })

    it("should generate normalized weights for K=60", () => {
      const weights = zipfWeights(60, 1.0)
      expect(weights.length).toBe(60)

      const sum = weights.reduce((a, b) => a + b, 0)
      expect(sum).toBeCloseTo(1.0, 5)
    })

    it("should respect alpha parameter", () => {
      const weights08 = zipfWeights(10, 0.8)
      const weights10 = zipfWeights(10, 1.0)
      const weights12 = zipfWeights(10, 1.2)

      // Alpha plus faible = distribution plus égalitaire
      expect(weights08[9]).toBeGreaterThan(weights10[9])
      expect(weights10[9]).toBeGreaterThan(weights12[9])
    })
  })

  describe("TOP10 Mode (N ≤ 120)", () => {
    it("should calculate payout for N=30 projects", () => {
      const SCents = 1000000 // 10 000€
      const investorsTop10 = Array.from({ length: 10 }, (_, i) => `inv${i + 1}`)
      const creatorsTop10 = Array.from({ length: 10 }, (_, i) => `port${i + 1}`)
      const investorsSmall = Array.from({ length: 20 }, (_, i) => `inv_small${i + 1}`)

      const result = calculateCategoryPayout(SCents, investorsTop10, creatorsTop10, investorsSmall, "visual", 30)

      expect(result.mode).toBe("TOP10")
      expect(result.K).toBe(10)
      expect(result.nProjects).toBe(30)
      expect(result.totalAmountCents).toBe(SCents)

      // Vérifier conservation totale
      const totalPaid = result.payouts.reduce((sum, p) => sum + p.amountEurFloor, 0)
      expect(totalPaid).toBe(SCents)

      // Vérifier proportions approximatives
      expect(result.breakdown.investorsTopTotal).toBeGreaterThanOrEqual(Math.floor(SCents * 0.39))
      expect(result.breakdown.creatorsTopTotal).toBeGreaterThanOrEqual(Math.floor(SCents * 0.29))
      expect(result.breakdown.investorsSmallTotal).toBe(Math.floor(SCents * 0.07))
      expect(result.visualAmountCents).toBeGreaterThanOrEqual(Math.floor(SCents * 0.23))
    })

    it("should use fixed baremes for N=100", () => {
      const SCents = 500000 // 5 000€
      const investorsTop10 = Array.from({ length: 10 }, (_, i) => `inv${i + 1}`)
      const creatorsTop10 = Array.from({ length: 10 }, (_, i) => `port${i + 1}`)
      const investorsSmall = []

      const result = calculateCategoryPayout(SCents, investorsTop10, creatorsTop10, investorsSmall, "visual", 100)

      expect(result.mode).toBe("TOP10")
      expect(result.ruleVersion).toContain("top10")

      // Vérifier que tous les paiements utilisateurs sont arrondis à l'euro
      result.payouts.forEach((p) => {
        if (p.role !== "visual_platform") {
          expect(p.amountEurFloor % 100).toBe(0)
        }
      })
    })
  })

  describe("TOP10PCT Mode (N > 120)", () => {
    it("should calculate payout for N=600 projects", () => {
      const SCents = 5000000 // 50 000€
      const K = 60
      const investorsTop60 = Array.from({ length: K }, (_, i) => `inv${i + 1}`)
      const creatorsTop60 = Array.from({ length: K }, (_, i) => `port${i + 1}`)
      const investorsSmall = Array.from({ length: 540 }, (_, i) => `inv_small${i + 1}`)

      const result = calculateCategoryPayout(SCents, investorsTop60, creatorsTop60, investorsSmall, "visual", 600)

      expect(result.mode).toBe("TOP10PCT")
      expect(result.K).toBe(60)
      expect(result.nProjects).toBe(600)

      // Vérifier conservation totale
      const totalPaid = result.payouts.reduce((sum, p) => sum + p.amountEurFloor, 0)
      expect(totalPaid).toBe(SCents)

      // Vérifier décroissance des parts
      const investorPayouts = result.payouts.filter((p) => p.role === "investor_top")
      for (let i = 1; i < investorPayouts.length; i++) {
        expect(investorPayouts[i].amountCents).toBeLessThanOrEqual(investorPayouts[i - 1].amountCents)
      }
    })

    it("should calculate payout for N=1300 projects", () => {
      const SCents = 10000000 // 100 000€
      const K = 130
      const investorsTop130 = Array.from({ length: K }, (_, i) => `inv${i + 1}`)
      const creatorsTop130 = Array.from({ length: K }, (_, i) => `port${i + 1}`)
      const investorsSmall = Array.from({ length: 1170 }, (_, i) => `inv_small${i + 1}`)

      const result = calculateCategoryPayout(SCents, investorsTop130, creatorsTop130, investorsSmall, "visual", 1300)

      expect(result.mode).toBe("TOP10PCT")
      expect(result.K).toBe(130)
      expect(result.ruleVersion).toContain("top10pct")

      // Vérifier que tous les paiements utilisateurs sont arrondis à l'euro
      result.payouts.forEach((p) => {
        if (p.role !== "visual_platform") {
          expect(p.amountEurFloor % 100).toBe(0)
        }
      })
    })
  })

  describe("Validation", () => {
    it("should validate correct input for TOP10", () => {
      const validation = validateCategoryPayoutInput(
        50,
        Array.from({ length: 10 }, (_, i) => `inv${i}`),
        Array.from({ length: 10 }, (_, i) => `port${i}`),
        [],
      )

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it("should validate correct input for TOP10PCT", () => {
      const validation = validateCategoryPayoutInput(
        600,
        Array.from({ length: 60 }, (_, i) => `inv${i}`),
        Array.from({ length: 60 }, (_, i) => `port${i}`),
        [],
      )

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it("should reject N<30", () => {
      const validation = validateCategoryPayoutInput(
        29,
        Array.from({ length: 10 }, (_, i) => `inv${i}`),
        Array.from({ length: 10 }, (_, i) => `port${i}`),
        [],
      )

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it("should reject incorrect K for TOP10", () => {
      const validation = validateCategoryPayoutInput(
        50,
        Array.from({ length: 5 }, (_, i) => `inv${i}`), // Devrait être 10
        Array.from({ length: 10 }, (_, i) => `port${i}`),
        [],
      )

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes("investorsTopK"))).toBe(true)
    })

    it("should reject duplicates", () => {
      const validation = validateCategoryPayoutInput(
        50,
        ["inv1", "inv2", "inv1", "inv3", "inv4", "inv5", "inv6", "inv7", "inv8", "inv9"], // inv1 dupliqué
        Array.from({ length: 10 }, (_, i) => `port${i}`),
        [],
      )

      expect(validation.valid).toBe(false)
      expect(validation.errors.some((e) => e.includes("doublons"))).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("should handle no small investors", () => {
      const result = calculateCategoryPayout(
        1000000,
        Array.from({ length: 10 }, (_, i) => `inv${i}`),
        Array.from({ length: 10 }, (_, i) => `port${i}`),
        [], // Pas de petits investisseurs
        "visual",
        50,
      )

      expect(result.payouts.filter((p) => p.role === "investor_small")).toHaveLength(0)
      expect(result.totalAmountCents).toBe(1000000)
    })

    it("should handle small investors with <1€ each", () => {
      const SCents = 10000 // 100€
      const result = calculateCategoryPayout(
        SCents,
        Array.from({ length: 10 }, (_, i) => `inv${i}`),
        Array.from({ length: 10 }, (_, i) => `port${i}`),
        Array.from({ length: 100 }, (_, i) => `inv_small${i}`), // 7% / 100 = 0.07€ chacun
        "visual",
        50,
      )

      // Vérifier que la distribution round-robin fonctionne
      const smallPayouts = result.payouts.filter((p) => p.role === "investor_small")
      const paidOnes = smallPayouts.filter((p) => p.amountEurFloor === 100)
      const unpaidOnes = smallPayouts.filter((p) => p.amountEurFloor === 0)

      expect(paidOnes.length + unpaidOnes.length).toBe(100)
      expect(paidOnes.length).toBe(Math.floor((SCents * 0.07) / 100))
    })
  })
})
