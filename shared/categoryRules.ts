/**
 * Règles catégories Films / Vidéos / Documentaires
 * Version: MODULE CORRECTIF 12/10/2025
 *
 * Système adaptatif:
 * - N < 30: WAITING (sécurité lancement)
 * - 30 ≤ N ≤ 120: TOP 10 (barèmes fixes)
 * - N > 120: TOP 10% (distribution Zipf)
 */

export const CATEGORY_FILMS_VIDEOS_DOCS_RULES = {
  // Seuils d'activation
  MIN_PROJECTS_TO_OPEN: 30,
  TOP_MODE_THRESHOLD: 120,
  TOP_PERCENT: 0.1,
  CATEGORY_WINDOW_HOURS: 168, // 7 jours

  // Répartition globale (40/30/7/23)
  INVESTORS_TOP_SHARE: 0.4,
  CREATORS_TOP_SHARE: 0.3,
  INVESTORS_SMALL_SHARE: 0.07,
  VISUAL_PLATFORM_SHARE: 0.23,

  // Paramètre Zipf (configurable 0.8-1.2)
  ZIPF_ALPHA: 1.0,

  // Prix porteurs autorisés (€)
  ALLOWED_PORTER_PRICES: [2, 3, 4, 5, 10],

  // Tranches investisseurs autorisées (€)
  ALLOWED_INVESTMENT_TRANCHES: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20],

  // Arrondi
  ROUNDING_MODE: "floor_to_euro" as const,
} as const

export type TopMode = "TOP10" | "TOP10PCT"

/**
 * Sélectionner le mode TOP selon le nombre de projets
 */
export function selectTopMode(nProjects: number): TopMode {
  if (nProjects > CATEGORY_FILMS_VIDEOS_DOCS_RULES.TOP_MODE_THRESHOLD) {
    return "TOP10PCT"
  }
  if (nProjects >= CATEGORY_FILMS_VIDEOS_DOCS_RULES.MIN_PROJECTS_TO_OPEN) {
    return "TOP10"
  }
  throw new Error(
    `CATEGORY_WAITING: Minimum ${CATEGORY_FILMS_VIDEOS_DOCS_RULES.MIN_PROJECTS_TO_OPEN} projets requis (actuellement: ${nProjects})`,
  )
}

/**
 * Calculer K (nombre de "grands gagnants")
 */
export function computeK(nProjects: number, mode: TopMode): number {
  if (mode === "TOP10PCT") {
    return Math.ceil(CATEGORY_FILMS_VIDEOS_DOCS_RULES.TOP_PERCENT * nProjects)
  }
  return 10 // TOP10 fixe
}

/**
 * Générer les poids Zipf normalisés
 * @param K Nombre de rangs
 * @param alpha Paramètre de décroissance (défaut 1.0)
 * @returns Array de poids normalisés (somme = 1)
 */
export function zipfWeights(K: number, alpha: number = CATEGORY_FILMS_VIDEOS_DOCS_RULES.ZIPF_ALPHA): number[] {
  const weights = Array.from({ length: K }, (_, i) => 1 / Math.pow(i + 1, alpha))
  const sum = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / sum)
}

/**
 * Arrondir à l'euro inférieur (centimes → centimes)
 */
export function euroFloor(cents: number): number {
  return Math.floor(cents / 100) * 100
}
