"use client"

import type React from "react"
import { useMemo, useState } from "react"

/**
 * VISUAL — MODULE POADCASTS (BATTLE 40/30/20/10) — v2 avec CLASSEMENT + JAUGES + ARCHIVES
 * ========================================================================================
 * - Catégorie POADCASTS (orthographe demandée par l'ADMIN)
 * - Fenêtre mensuelle numéraire (28/29/30/31 jours)
 * - Seuils: minimum 30 poadcasts déposés, maximum 100 (ou 100 meilleurs)
 * - Formule officielle (ADMIN): 40% / 30% / 20% / 10%
 *     40% Porteur (créateur audio)
 *     30% Investisseurs (pro-rata votes * listen_score)
 *     20% VISUAL (infra/modération/réserve)
 *     10% Bonus Pool (TOP 10, Visiteur du Mois, primes)
 * - Tranches investissement (héritées VISUAL): 1/2/5/10/11/12/13/14/15/20 € → 1/2/3/4/5/6/7/8/9/10 votes
 * - listen_score ∈ [0,1] = 0.7 * taux_completion + 0.3 * auditeurs_uniques_normalisés
 * - Anti-gonflage: cap du poids d'un compte investisseur à X% (par défaut 20%) des votes catégorie
 * - NOUVEAU :
 *    • CLASSEMENT du 1er au dernier (rang calculé sur score = votes × listen_score)
 *    • JAUGES colorées (complétion, votes, score global) — esthétiques et lisibles
 *    • ARCHIVES mensuelles (sélecteur mois/année, snapshots persistés)
 *
 * Intégration:
 *  - Copiez ce fichier sous: src/modules/PoadcastsModule.tsx (ou pages/Poadcasts.tsx)
 *  - Tailwind requis (palette néon violet/bleu/rose/blanc conservée)
 *  - Reliez l'état à vos APIs quand prêtes (fetch dépôts, analytics, payouts)
 */

// -----------------------------
// Thème / tokens
// -----------------------------
const Theme = () => (
  <style>{`
    :root{
      --violet-neon:#7A00FF; --blue-neon:#00D8FF; --pink:#FF3AF2; --white:#FFFFFF;
      --deep:#0F0F14; --soft:#12121A; --card:#1E1E26; --ring:rgba(122,0,255,.55);
      --shadow-neon:0 0 32px rgba(122,0,255,.45), 0 0 64px rgba(0,216,255,.25);
      --emerald:#10B981; --yellow:#F59E0B; --red:#EF4444; --slate:#94A3B8;
    }
    .bg-neon{
      background: radial-gradient(900px 600px at 10% -10%, rgba(122,0,255,.25) 0%, transparent 60%),
                  radial-gradient(900px 600px at 100% -20%, rgba(0,216,255,.2) 0%, transparent 60%),
                  linear-gradient(180deg, var(--deep) 0%, var(--soft) 100%);
    }
    .card{ background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); border:1px solid rgba(255,255,255,.08); backdrop-filter: blur(6px); }
    .glow{ box-shadow: var(--shadow-neon); }
    .neon{ text-shadow:0 0 12px rgba(122,0,255,.6); }
  `}</style>
)

// -----------------------------
// Constantes officielles
// -----------------------------
const MIN_POADCASTS = 30
const MAX_POADCASTS = 100
const INVEST_VOTES: Record<number, number> = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 6, 10: 7, 12: 8, 15: 9, 20: 10 }
const PERC = { PORT: 0.4, INV: 0.3, VISU: 0.2, BONUS: 0.1 } as const
const VOTE_CAP_RATIO = 0.2 // 20% des votes totaux max par investisseur (anti-capture)

// -----------------------------
// Helpers de calcul
// -----------------------------
export function computeListenScore(tauxCompletion: number, auditeursUniqNorm: number) {
  const clamp = (x: number) => Math.max(0, Math.min(1, x))
  return 0.7 * clamp(tauxCompletion) + 0.3 * clamp(auditeursUniqNorm)
}

export function settleInvestors(potInvest: number, investors: { id: string; votes: number; listenScore: number }[]) {
  const copy = investors.map((x) => ({ ...x }))
  const sumVotes = copy.reduce((a, b) => a + b.votes, 0) || 1
  const CAP = VOTE_CAP_RATIO // configurable admin ultérieurement
  for (const i of copy) {
    const maxVotes = Math.ceil(sumVotes * CAP)
    if (i.votes > maxVotes) i.votes = maxVotes
  }
  const weights = copy.map((i) => i.votes * Math.max(0, Math.min(1, i.listenScore)))
  const W = weights.reduce((a, b) => a + b, 0) || 1
  return copy.map((i, idx) => ({ id: i.id, amount: potInvest * (weights[idx] / W) }))
}

function useMonthWindow() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999) // dernier jour 28/29/30/31
  const days = end.getDate()
  return { start, end, days, year, month }
}

// -----------------------------
// Données mock + ranking (remplacer par vos APIs)
// -----------------------------
export type Poadcast = {
  id: string
  title: string
  votes: number // somme de votes (via tranches)
  completion: number // [0..1]
  uniquesNorm: number // [0..1]
}

function mockPoadcasts(n: number): Poadcast[] {
  return Array.from({ length: n }).map((_, i) => ({
    id: `p${i + 1}`,
    title: `Poadcast #${i + 1}`,
    votes: Math.floor(Math.random() * 500 + 20),
    completion: Math.random() * 0.5 + 0.45, // 45%..95%
    uniquesNorm: Math.random() * 0.7 + 0.2, // 20%..90%
  }))
}

function scoreOf(p: Poadcast) {
  const ls = computeListenScore(p.completion, p.uniquesNorm) // [0..1]
  return p.votes * ls // base ranking metric
}

function rankPoadcasts(list: Poadcast[]) {
  const sorted = [...list].sort((a, b) => scoreOf(b) - scoreOf(a))
  return sorted.map((p, idx) => ({ ...p, rank: idx + 1, score: scoreOf(p) }))
}

// -----------------------------
// UI Atomes
// -----------------------------
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-2xl p-4 text-white/90">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}

function TrafficLightMini() {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      <span className="h-2.5 w-2.5 bg-red-500 rounded-full glow" />
      <span className="h-2.5 w-2.5 bg-yellow-400 rounded-full glow" />
      <span className="h-2.5 w-2.5 bg-emerald-400 rounded-full glow" />
    </div>
  )
}

function Gauge({ label, value, tooltip }: { label: string; value: number; tooltip?: string }) {
  // value attendu 0..100
  const pct = Math.max(0, Math.min(100, value))
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-500"
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] text-white/60">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="mt-1 h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: pct + "%" }} title={tooltip || label} />
      </div>
    </div>
  )
}

function RuleItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card rounded-2xl p-4 text-white/85">
      <div className="text-sm font-semibold text-white neon mb-1">{title}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function AdminPanel() {
  return (
    <div className="card rounded-2xl p-5 text-white/85 border-l-2 border-[var(--violet-neon)]">
      <div className="text-sm font-bold mb-3">ADMIN — Formule & Pourcentages (POT total P)</div>
      <ul className="text-sm space-y-1">
        <li>
          • Porteur (créateur audio) <b>40%</b>: <code>P_port = 0.40 × P</code>
        </li>
        <li>
          • Investisseurs <b>30%</b>: <code>P_inv = 0.30 × P</code> (pro‑rata <i>votes × listen_score</i>)
        </li>
        <li>
          • VISUAL <b>20%</b>: <code>P_visual = 0.20 × P</code> (infra/modération/réserve)
        </li>
        <li>
          • Bonus Pool <b>10%</b>: <code>P_bonus = 0.10 × P</code> (TOP10/Visiteur du Mois…)
        </li>
      </ul>
      <div className="mt-3 text-xs text-white/70">
        Tranches: 2/3/4/5/6/8/10/12/15/20 € → 1/2/3/4/5/6/7/8/9/10 votes. Anti-capture: cap 20% des votes par
        investisseur.
      </div>
    </div>
  )
}

// -----------------------------
// Cartes & Classement
// -----------------------------
function PoadcastRow({ p }: { p: ReturnType<typeof rankPoadcasts>[number] }) {
  const completionPct = p.completion * 100
  const uniquesPct = p.uniquesNorm * 100
  // score relatif vs meilleur
  const scoreRel = p.score // sera normalisé au parent

  return (
    <div className="card rounded-2xl p-4 text-white/90 border border-white/10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-[42px] h-[42px] rounded-xl bg-white/5 border border-white/10 grid place-items-center text-white font-bold">
          {p.rank}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrafficLightMini />
              <h3 className="font-semibold">{p.title}</h3>
            </div>
            {p.rank <= 10 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pink)]/20 text-[var(--pink)] border border-[var(--pink)]/30">
                TOP {p.rank}
              </span>
            )}
          </div>
          <div className="mt-3 grid md:grid-cols-3 gap-4">
            <Gauge label="Complétion" value={completionPct} tooltip="Taux d'écoute jusqu'au bout" />
            <Gauge label="Audience unique" value={uniquesPct} tooltip="Auditeurs uniques normalisés" />
            <Gauge label="Score global" value={scoreRel} tooltip="Votes × Listen Score (normalisé)" />
          </div>
          <div className="mt-3 text-xs text-white/60">
            Votes: {p.votes} · ListenScore: {computeListenScore(p.completion, p.uniquesNorm).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}

// -----------------------------
// Archives — snapshots mensuels en localStorage (à brancher back plus tard)
// -----------------------------
function useArchives() {
  const KEY = "visual.poadcasts.archives"
  const [archives, setArchives] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const save = (arr: any[]) => {
    setArchives(arr)
    try {
      localStorage.setItem(KEY, JSON.stringify(arr))
    } catch {}
  }
  return { archives, save }
}

// -----------------------------
// Page principale
// -----------------------------
export default function PoadcastsModule() {
  const { start, end, days, month, year } = useMonthWindow()
  const [pool, setPool] = useState(10000) // Pot total P (mock), à brancher API
  const [list, setList] = useState<Poadcast[]>(() => mockPoadcasts(42)) // à brancher API
  const ranked = useMemo(() => rankPoadcasts(list), [list])
  const ready = list.length >= MIN_POADCASTS
  const bestScore = ranked[0]?.score || 1
  const rankedNorm = ranked.map((r) => ({ ...r, score: Math.max(0, Math.min(100, (r.score / bestScore) * 100)) }))

  // Archives
  const { archives, save } = useArchives()
  const [archMonth, setArchMonth] = useState<number>(month)
  const [archYear, setArchYear] = useState<number>(year)
  const filteredArchive = archives.find((a) => a.year === archYear && a.month === archMonth)

  function archiveNow() {
    const snap = {
      ts: Date.now(),
      year,
      month,
      pool,
      ranking: ranked.map((r) => ({
        id: r.id,
        title: r.title,
        votes: r.votes,
        completion: r.completion,
        uniquesNorm: r.uniquesNorm,
        rank: r.rank,
        score: r.score,
      })),
    }
    const arr = [...archives.filter((a) => !(a.year === year && a.month === month)), snap]
    save(arr)
  }

  const pPort = (PERC.PORT * pool).toFixed(2)
  const pInv = (PERC.INV * pool).toFixed(2)
  const pVisu = (PERC.VISU * pool).toFixed(2)
  const pBonus = (PERC.BONUS * pool).toFixed(2)

  return (
    <div className="min-h-screen bg-neon">
      <Theme />

      <header className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white neon">Poadcasts</h1>
            <p className="text-sm text-white/70">Regarde-Investis-Gagne</p>
          </div>
          <div className="text-white/70 text-sm">
            Fenêtre: <b>{start.toLocaleDateString()}</b> → <b>{end.toLocaleDateString()}</b> ({days} jours)
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
          <Stat label="Poadcasts déposés" value={`${list.length}`} />
          <Stat label="Seuil minimum" value={`${MIN_POADCASTS}`} />
          <Stat label="Cap maximum" value={`${MAX_POADCASTS}`} />
          <Stat label="Pot total (P)" value={`${pool.toFixed(2)} €`} />
          <Stat label="Statut" value={ready ? "Prêt pour distribution" : "En attente du seuil"} />
          <div className="card rounded-2xl p-4 text-white/90">
            <div className="text-xs text-white/60">Répartition ADMIN</div>
            <div className="text-sm">
              40% {pPort} · 30% {pInv} · 20% {pVisu} · 10% {pBonus}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-14">
        {/* Règles participants */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Règles & Explications</h2>
            <div className="text-xs text-white/60">Formule BATTLE 40/30/20/10</div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <RuleItem title="Porteurs (créateurs audio)">
              • Dépôt jusqu'à <b>100 poadcasts</b> (ou sélection des 100 meilleurs).
              <br />• Période = <b>mois numéraire</b> en cours (28/29/30/31 jours).
              <br />• Distribution si <b>≥ 30 poadcasts</b> enregistrés dans le mois.
              <br />• Part porteurs <b>40%</b> du pot net.
            </RuleItem>
            <RuleItem title="Investisseurs">
              • Tranches 2/3/4/5/6/8/10/12/15/20 € → 1/2/3/4/5/6/7/8/9/10 votes.
              <br />• Répartition <b>30%</b> au pro‑rata <i>votes × listen_score</i>.<br />• listen_score =
              0.7×complétion + 0.3×auditeurs uniques norm.
              <br />• Anti-gonflage: cap <b>20%</b> des votes par compte.
            </RuleItem>
            <RuleItem title="Classements & Bonus">
              • <b>Classement 1 → N</b> visible (TOP 10 badge).
              <br />• <b>Bonus Pool 10%</b> (ex: 40/25/15/10/5/3/1×4).
              <br />• Slogan aux emplacements clés (bandeau, watermark, footer).
            </RuleItem>
          </div>
        </section>

        {/* Panneau ADMIN */}
        <section className="mt-8">
          <AdminPanel />
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/80">
            <button
              className="px-3 py-2 rounded-xl bg-[var(--violet-neon)] text-white shadow-md hover:shadow-lg"
              onClick={() => setPool((p) => p + 500)}
            >
              + Ajouter 500 € au pot (mock)
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
              onClick={() => setList(mockPoadcasts(Math.min(100, Math.max(30, Math.floor(Math.random() * 100)))))}
            >
              Régénérer la liste (mock)
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-[var(--blue-neon)]/30 border border-[var(--blue-neon)]/40 text-white"
              onClick={archiveNow}
            >
              Archiver maintenant (snapshot mois)
            </button>
          </div>
        </section>

        {/* CLASSEMENT DU MOIS */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Classement du mois — 1er → dernier</h2>
            <div className="text-xs text-white/60">Ordonné par score (votes × listen_score)</div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {rankedNorm.map((p) => (
              <PoadcastRow key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* ARCHIVES */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Archives mensuelles</h2>
            <div className="flex items-center gap-2 text-sm">
              <select
                className="bg-white/5 border border-white/10 text-white/90 rounded-lg px-2 py-1"
                value={archMonth}
                onChange={(e) => setArchMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, m) => (
                  <option className="bg-[var(--soft)]" key={m} value={m}>
                    {m + 1}
                  </option>
                ))}
              </select>
              <select
                className="bg-white/5 border border-white/10 text-white/90 rounded-lg px-2 py-1"
                value={archYear}
                onChange={(e) => setArchYear(Number(e.target.value))}
              >
                {Array.from(new Set([year, ...archives.map((a) => a.year)]))
                  .sort()
                  .map((y) => (
                    <option className="bg-[var(--soft)]" key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {filteredArchive ? (
            <div className="card rounded-2xl p-5 text-white/85">
              <div className="text-sm text-white/70 mb-3">
                Snapshot {filteredArchive.month + 1}/{filteredArchive.year} · Pot: {filteredArchive.pool.toFixed(2)} € ·
                Entrées: {filteredArchive.ranking.length}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredArchive.ranking.map((r: any) => (
                  <div key={r.id} className="card rounded-2xl p-4 text-white/90 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="min-w-[32px] h-[32px] rounded-lg bg-white/5 border border-white/10 grid place-items-center text-white text-sm font-bold">
                          {r.rank}
                        </div>
                        <div className="font-semibold">{r.title}</div>
                      </div>
                      {r.rank <= 10 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pink)]/20 text-[var(--pink)] border border-[var(--pink)]/30">
                          TOP {r.rank}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-white/70">
                      <div>Votes: {r.votes}</div>
                      <div>Complétion: {(r.completion * 100).toFixed(0)}%</div>
                      <div>Score: {r.score.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card rounded-2xl p-5 text-white/80">
              Aucune archive pour {archMonth + 1}/{archYear}. Utilisez « Archiver maintenant » en fin de mois.
            </div>
          )}
        </section>

        {/* Bandeau slogan */}
        <div className="mt-12 py-2 text-center text-white/90 bg-gradient-to-r from-[var(--violet-neon)]/20 via-[var(--pink)]/20 to-[var(--blue-neon)]/20 border-y border-white/10">
          Regarde-Investis-Gagne
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-white/60">
        © {new Date().getFullYear()} VISUAL — Regarde-Investis-Gagne
      </footer>
    </div>
  )
}
