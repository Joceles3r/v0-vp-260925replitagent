/**
 * Category Revenue Engine - Films / Vidéos / Documentaires
 * Implémentation du MODULE CORRECTIF 12/10/2025
 *
 * Système adaptatif TOP 10 / TOP 10% avec distribution Zipf
 */

import {
  CATEGORY_FILMS_VIDEOS_DOCS_RULES,
  selectTopMode,
  computeK,
  zipfWeights,
  euroFloor,
  type TopMode,
} from "@shared/category-rules"

export interface CategoryPayoutItem {
  accountId: string
  role: "investor_top" | "creator_top" | "investor_small" | "visual_platform"
  amountCents: number
  amountEurFloor: number
  rank?: number
  note: string
}

export interface CategoryPayoutCalculation {
  ruleVersion: string
  mode: TopMode
  nProjects: number
  K: number
  totalAmountCents: number
  payouts: CategoryPayoutItem[]
  visualAmountCents: number
  residualCents: number
  breakdown: {
    investorsTopTotal: number
    creatorsTopTotal: number
    investorsSmallTotal: number
    visualTotal: number
  }
}

/**
 * Barèmes TOP 10 fixes (pour N ≤ 120)
 * Conservés pour compatibilité ascendante
 */
const INVESTORS_TOP10_DISTRIBUTION = [0.1366, 0.0683, 0.0455, 0.0341, 0.0273, 0.0228, 0.0195, 0.0171, 0.0152, 0.0137] // sum ≈ 40%

const CREATORS_TOP10_DISTRIBUTION = [0.1024, 0.0512, 0.0341, 0.0256, 0.0205, 0.0171, 0.0146, 0.0128, 0.0114, 0.0102] // sum ≈ 30%

/**
 * Distribution TOP 10 % avec Zipf (pour N > 120)
 */
function distributeTop10Pct(
  totalCents: number,
  K: number,
  alpha: number = CATEGORY_FILMS_VIDEOS_DOCS_RULES.ZIPF_ALPHA,
): number[] {
  const weights = zipfWeights(K, alpha)
  return weights.map((w) => Math.floor(w * totalCents))
}

/**
 * Équipartition investisseurs "petits gagnants" (7%)
 */
function smallInvestorsEquipartition(totalCents: number, nEligible: number): number {
  if (nEligible <= 0) return 0
  return Math.floor(totalCents / nEligible)
}

/**
 * Calcul complet de la répartition catégorie Films/Vidéos/Documentaires
 *
 * @param SCents Pot total en centimes
 * @param investorsTopK IDs investisseurs TOP K (triés par rang)
 * @param creatorsTopK IDs porteurs TOP K (triés par rang)
 * @param investorsSmall IDs investisseurs hors TOP K avec ≥1 transaction
 * @param visualAccountId ID compte VISUAL
 * @param nProjects Nombre total de projets dans la fenêtre
 * @param alpha Paramètre Zipf (optionnel, défaut 1.0)
 */
export function calculateCategoryPayout(
  SCents: number,
  investorsTopK: string[],
  creatorsTopK: string[],
  investorsSmall: string[],
  visualAccountId: string,
  nProjects: number,
  alpha: number = CATEGORY_FILMS_VIDEOS_DOCS_RULES.ZIPF_ALPHA,
): CategoryPayoutCalculation {
  const mode = selectTopMode(nProjects)
  const K = computeK(nProjects, mode)

  if (investorsTopK.length !== K || creatorsTopK.length !== K) {
    throw new Error(
      `Incohérence: K=${K} mais investorsTopK=${investorsTopK.length}, creatorsTopK=${creatorsTopK.length}`,
    )
  }

  const payouts: CategoryPayoutItem[] = []
  let totalUsersPaidCents = 0

  const investorsTopPool = Math.floor(CATEGORY_FILMS_VIDEOS_DOCS_RULES.INVESTORS_TOP_SHARE * SCents)
  const creatorsTopPool = Math.floor(CATEGORY_FILMS_VIDEOS_DOCS_RULES.CREATORS_TOP_SHARE * SCents)
  const investorsSmallPool = Math.floor(CATEGORY_FILMS_VIDEOS_DOCS_RULES.INVESTORS_SMALL_SHARE * SCents)

  let investorsShares: number[]
  if (mode === "TOP10") {
    // Mode TOP 10: utiliser barèmes fixes
    investorsShares = INVESTORS_TOP10_DISTRIBUTION.map((pct) => Math.floor(pct * SCents))
  } else {
    // Mode TOP 10%: utiliser distribution Zipf
    investorsShares = distributeTop10Pct(investorsTopPool, K, alpha)
  }

  for (let i = 0; i < K; i++) {
    const amountCents = investorsShares[i]
    const amountEurFloor = euroFloor(amountCents)

    payouts.push({
      accountId: investorsTopK[i],
      role: "investor_top",
      amountCents,
      amountEurFloor,
      rank: i + 1,
      note: `${mode} rank ${i + 1}`,
    })

    totalUsersPaidCents += amountEurFloor
  }

  let creatorsShares: number[]
  if (mode === "TOP10") {
    // Mode TOP 10: utiliser barèmes fixes
    creatorsShares = CREATORS_TOP10_DISTRIBUTION.map((pct) => Math.floor(pct * SCents))
  } else {
    // Mode TOP 10%: utiliser distribution Zipf
    creatorsShares = distributeTop10Pct(creatorsTopPool, K, alpha)
  }

  for (let i = 0; i < K; i++) {
    const amountCents = creatorsShares[i]
    const amountEurFloor = euroFloor(amountCents)

    payouts.push({
      accountId: creatorsTopK[i],
      role: "creator_top",
      amountCents,
      amountEurFloor,
      rank: i + 1,
      note: `${mode} rank ${i + 1}`,
    })

    totalUsersPaidCents += amountEurFloor
  }

  const uniqueSmallInvestors = Array.from(new Set(investorsSmall))
  if (uniqueSmallInvestors.length > 0) {
    const perInvestorCents = smallInvestorsEquipartition(investorsSmallPool, uniqueSmallInvestors.length)
    const perInvestorEurFloor = euroFloor(perInvestorCents)

    if (perInvestorEurFloor >= 100) {
      // Cas normal: chaque investisseur reçoit ≥ 1€
      for (const investorId of uniqueSmallInvestors) {
        payouts.push({
          accountId: investorId,
          role: "investor_small",
          amountCents: perInvestorCents,
          amountEurFloor: perInvestorEurFloor,
          note: "equipartition 7%",
        })
        totalUsersPaidCents += perInvestorEurFloor
      }
    } else {
      // Cas limite: distribution round-robin de 1€
      const eurosToDistribute = Math.floor(investorsSmallPool / 100)
      for (let i = 0; i < uniqueSmallInvestors.length; i++) {
        const amountEurFloor = i < eurosToDistribute ? 100 : 0
        payouts.push({
          accountId: uniqueSmallInvestors[i],
          role: "investor_small",
          amountCents: perInvestorCents,
          amountEurFloor,
          note: amountEurFloor > 0 ? "equipartition 1€" : "equipartition 0€ (résiduel)",
        })
        totalUsersPaidCents += amountEurFloor
      }
    }
  }

  const base23PercentCents = Math.floor(CATEGORY_FILMS_VIDEOS_DOCS_RULES.VISUAL_PLATFORM_SHARE * SCents)
  const residualCents = Math.max(0, SCents - totalUsersPaidCents - base23PercentCents)
  const visualTotalCents = base23PercentCents + residualCents

  payouts.push({
    accountId: visualAccountId,
    role: "visual_platform",
    amountCents: visualTotalCents,
    amountEurFloor: visualTotalCents, // VISUAL reçoit les centimes
    note: "23% base + résidus arrondis",
  })

  const breakdown = {
    investorsTopTotal: investorsShares.reduce((a, b) => a + b, 0),
    creatorsTopTotal: creatorsShares.reduce((a, b) => a + b, 0),
    investorsSmallTotal: investorsSmallPool,
    visualTotal: visualTotalCents,
  }

  return {
    ruleVersion: `films_videos_docs_${mode.toLowerCase()}_40_30_7_23_v1`,
    mode,
    nProjects,
    K,
    totalAmountCents: SCents,
    payouts,
    visualAmountCents: visualTotalCents,
    residualCents,
    breakdown,
  }
}

/**
 * Validation des données d'entrée
 */
export function validateCategoryPayoutInput(
  nProjects: number,
  investorsTopK: string[],
  creatorsTopK: string[],
  investorsSmall: string[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Vérifier seuil minimum
  if (nProjects < CATEGORY_FILMS_VIDEOS_DOCS_RULES.MIN_PROJECTS_TO_OPEN) {
    errors.push(
      `Minimum ${CATEGORY_FILMS_VIDEOS_DOCS_RULES.MIN_PROJECTS_TO_OPEN} projets requis (actuellement: ${nProjects})`,
    )
  }

  // Vérifier cohérence K
  try {
    const mode = selectTopMode(nProjects)
    const K = computeK(nProjects, mode)

    if (investorsTopK.length !== K) {
      errors.push(`investorsTopK doit contenir ${K} éléments (mode ${mode}), actuellement: ${investorsTopK.length}`)
    }

    if (creatorsTopK.length !== K) {
      errors.push(`creatorsTopK doit contenir ${K} éléments (mode ${mode}), actuellement: ${creatorsTopK.length}`)
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Erreur validation mode")
  }

  // Vérifier unicité
  const uniqueInvestorsTop = new Set(investorsTopK)
  if (uniqueInvestorsTop.size !== investorsTopK.length) {
    errors.push("investorsTopK contient des doublons")
  }

  const uniqueCreatorsTop = new Set(creatorsTopK)
  if (uniqueCreatorsTop.size !== creatorsTopK.length) {
    errors.push("creatorsTopK contient des doublons")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
