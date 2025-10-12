// VISUAL Studio Live Show - Constants and Helpers
// Based on specification: weekly selection cycle + live battle system

// ===== WEEKLY SCHEDULE (Europe/Paris timezone) =====

export const WEEKLY_SCHEDULE = {
  phase1: {
    start: { dow: "SUNDAY", time: "12:00" }, // Dim 12:00
    end: { dow: "MONDAY", time: "00:00" }, // Lun 00:00
    candidatesIn: 100,
    candidatesOut: 50,
    actions: ["Community voting", "3min video submission"],
    elimination: "AI + community votes",
  },
  phase2: {
    start: { dow: "MONDAY", time: "00:00" },
    end: { dow: "TUESDAY", time: "00:00" },
    candidatesIn: 50,
    candidatesOut: 2,
    actions: ["Enhanced community voting"],
    elimination: "Top 2 finalists selected",
  },
  phase3: {
    start: { dow: "TUESDAY", time: "00:00" },
    end: { dow: "FRIDAY", time: "20:30" },
    candidatesIn: 2,
    candidatesOut: 2,
    actions: ["30min looped presentations (A/B)", "Show preparation"],
    note: "Assets freeze at 20:30",
  },
  liveShow: {
    start: { dow: "FRIDAY", time: "21:00" },
    end: { dow: "SATURDAY", time: "00:00" },
    durationHours: 3,
    votingWindow: { start: "21:00", end: "23:45" },
  },
} as const

// ===== LIVE SHOW FORMAT (3h + ad breaks) =====

export const LIVE_SHOW_FORMAT = {
  opening: {
    slot: "21:00-21:15",
    durationMin: 15,
    ads: [],
  },
  performance1: {
    slot: "21:15-22:30",
    durationMin: 75,
    ads: [
      { slotNumber: 1, at: "21:30", durMin: 3, type: "standard" },
      { slotNumber: 2, at: "22:00", durMin: 4, type: "standard" },
    ],
  },
  performance2: {
    slot: "22:30-23:45",
    durationMin: 75,
    ads: [
      { slotNumber: 3, at: "22:30", durMin: 5, type: "premium" },
      { slotNumber: 4, at: "23:00", durMin: 4, type: "standard" },
      { slotNumber: 5, at: "23:30", durMin: 3, type: "standard" },
    ],
  },
  results: {
    slot: "23:45-00:00",
    durationMin: 15,
    ads: [{ slotNumber: 6, at: "00:02", durMin: 2, postShow: true, type: "interactive" }],
  },
} as const

// ===== INVESTMENT TRANCHES & VOTE CONVERSION =====

export const INVEST_TRANCHES_EUR = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const

export const VOTE_TABLE = [
  { amount: 2, votes: 1 },
  { amount: 3, votes: 2 },
  { amount: 4, votes: 3 },
  { amount: 5, votes: 4 },
  { amount: 6, votes: 5 },
  { amount: 8, votes: 6 },
  { amount: 10, votes: 7 },
  { amount: 12, votes: 8 },
  { amount: 15, votes: 9 },
  { amount: 20, votes: 10 },
] as const

/**
 * Convert investment amount (€) to votes (1-10)
 * @param amount Amount in euros
 * @returns Number of votes (0 if invalid amount)
 */
export function votesForAmount(amount: number): number {
  const eligible = VOTE_TABLE.filter((v) => amount >= v.amount)
  return eligible.length ? eligible[eligible.length - 1].votes : 0
}

/**
 * Validate if amount is in allowed tranches
 */
export function isValidInvestmentAmount(amount: number): boolean {
  return INVEST_TRANCHES_EUR.includes(amount as any)
}

// ===== DISTRIBUTION RULES (Battle Live Show) =====

export const BATTLE_DISTRIBUTION = {
  winnerArtist: 0.4, // 40% → Artiste gagnant
  winnerInvestors: 0.3, // 30% → Investisseurs du gagnant (pondérés par mises)
  loserArtist: 0.2, // 20% → Artiste perdant
  loserInvestors: 0.1, // 10% → Investisseurs du perdant (équipartition)
} as const

/**
 * Calculate payout distribution for battle results (BATTLE 40/30/20/10)
 * All payouts are floored to nearest euro, remainder goes to VISUAL
 * @param totalPot Total amount invested in the battle
 * @param winnerInvestments Array of winner's investments
 * @param loserInvestments Array of loser's investments
 * @param winnerArtistId Winner artist user ID
 * @param loserArtistId Loser artist user ID
 */
export function calculateBattlePayouts(
  totalPot: number,
  winnerInvestments: Array<{ userId: string; amount: number }>,
  loserInvestments: Array<{ userId: string; amount: number }>,
  winnerArtistId?: string,
  loserArtistId?: string,
) {
  const winnerArtistShare = Math.floor(totalPot * BATTLE_DISTRIBUTION.winnerArtist)
  const winnerInvestorsPool = Math.floor(totalPot * BATTLE_DISTRIBUTION.winnerInvestors)
  const loserArtistShare = Math.floor(totalPot * BATTLE_DISTRIBUTION.loserArtist)
  const loserInvestorsPool = Math.floor(totalPot * BATTLE_DISTRIBUTION.loserInvestors)

  const totalWinnerInvested = winnerInvestments.reduce((sum, inv) => sum + inv.amount, 0)
  const totalLoserInvested = loserInvestments.reduce((sum, inv) => sum + inv.amount, 0)

  const winnerPayouts = winnerInvestments.map((inv) => ({
    userId: inv.userId,
    investment: inv.amount,
    payout: totalWinnerInvested > 0 ? Math.floor((inv.amount / totalWinnerInvested) * winnerInvestorsPool) : 0,
  }))

  const uniqueLoserCount = loserInvestments.length
  const loserPayoutPerInvestor = uniqueLoserCount > 0 ? Math.floor(loserInvestorsPool / uniqueLoserCount) : 0

  const loserPayouts = loserInvestments.map((inv) => ({
    userId: inv.userId,
    investment: inv.amount,
    payout: loserPayoutPerInvestor,
  }))

  const totalDistributed =
    winnerArtistShare +
    winnerPayouts.reduce((sum, p) => sum + p.payout, 0) +
    loserArtistShare +
    loserPayouts.reduce((sum, p) => sum + p.payout, 0)

  const visualRemainder = totalPot - totalDistributed

  return {
    winnerArtistShare,
    loserArtistShare,
    winnerPayouts,
    loserPayouts,
    totalDistributed,
    visualRemainder,
    artistPayouts: [
      ...(winnerArtistId ? [{ userId: winnerArtistId, amount: winnerArtistShare, isWinner: true }] : []),
      ...(loserArtistId ? [{ userId: loserArtistId, amount: loserArtistShare, isWinner: false }] : []),
    ],
  }
}

// ===== AI PRESELECTION WEIGHTS =====

export const AI_WEIGHTS = {
  activity: 0.4,
  quality: 0.3,
  engagement: 0.2,
  creativity: 0.1,
} as const

// ===== STATE MACHINE =====

export const LIVE_SHOW_STATES = {
  PLANNED: "planned",
  PRE_SHOW: "pre_show",
  LIVE_RUNNING: "live_running",
  VOTES_CLOSED: "votes_closed",
  RESULT_READY: "result_ready",
  ENDED: "ended",
} as const

export const LIVE_SHOW_PHASES = {
  PHASE1: "phase1",
  PHASE2: "phase2",
  PHASE3: "phase3",
  LIVE: "live",
  ENDED: "ended",
} as const

// ===== WEBSOCKET EVENTS =====

export const WS_EVENTS = {
  SCORE_UPDATE: "score:update",
  ADS_BREAK: "ads:break",
  VOTES_CLOSED: "votes:closed",
  WINNER_ANNOUNCED: "winner:announced",
  PHASE_CHANGE: "phase:change",
  STATE_CHANGE: "state:change",
} as const

// ===== HELPER: Get current Live Show phase based on time =====

export function getCurrentPhaseForTime(
  now: Date,
  edition: {
    phase1StartsAt: Date
    phase1EndsAt: Date
    phase2StartsAt: Date
    phase2EndsAt: Date
    phase3StartsAt: Date
    phase3EndsAt: Date
    liveStartsAt: Date
    liveEndsAt: Date
  },
): string {
  if (now >= edition.phase1StartsAt && now < edition.phase1EndsAt) return "phase1"
  if (now >= edition.phase2StartsAt && now < edition.phase2EndsAt) return "phase2"
  if (now >= edition.phase3StartsAt && now < edition.phase3EndsAt) return "phase3"
  if (now >= edition.liveStartsAt && now < edition.liveEndsAt) return "live"
  if (now >= edition.liveEndsAt) return "ended"
  return "planned"
}
