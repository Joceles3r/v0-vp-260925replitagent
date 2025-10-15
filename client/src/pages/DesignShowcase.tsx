"use client"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"

/**
 * VISUAL — Mini Design System
 * -------------------------------------------------------------
 * - 100% client-side React + Tailwind (no external UI deps)
 * - Admin toggles (logo visibility, categories visibility)
 * - Neon theme tokens, traffic-light animations, slogan watermarks
 * - Core categories (3 rect cards) + Extra categories (Voix de l'info, Livres, Annonces)
 * - 168h countdown & TOP 10 badge example
 * - Responsive, accessible, clean
 *
 * Copy-paste in your project as a page (e.g., src/pages/VisualDesignSystem.tsx)
 * Requires Tailwind. Works in any React + Vite/Next env.
 */

// -----------------------------
// Theme tokens (CSS variables)
// -----------------------------
const Theme = () => (
  <style>{`
    :root {
      --violet-neon: #7A00FF;
      --blue-neon:   #00D8FF;
      --pink-accent: #FF3AF2;
      --white:       #FFFFFF;
      --bg-deep:     #0F0F14;
      --bg-soft:     #12121A;
      --card:        #1E1E26;
      --ring:        rgba(122,0,255,.55);
      --glow:        0 0 32px rgba(122,0,255,.45), 0 0 64px rgba(0,216,255,.25);
    }
    .ds-gradient-bg {
      background: radial-gradient(1200px 800px at 10% -10%, rgba(122,0,255,.35) 0%, transparent 60%),
                  radial-gradient(1000px 600px at 110% -20%, rgba(0,216,255,.25) 0%, transparent 60%),
                  linear-gradient(180deg, #0F0F14 0%, #12121A 100%);
    }
    .ds-neon-text { text-shadow: 0 0 12px rgba(122,0,255,.6); }
    .ds-border-neon { box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), var(--glow); }
    .ds-ring { box-shadow: 0 0 0 2px var(--ring); }
    .ds-blur-glow { filter: drop-shadow(0 0 16px rgba(122,0,255,.55)); }
    .ds-card {
      background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
      border: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(6px);
    }
    .ds-watermark {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      pointer-events: none;
      opacity: 0.12;
      font-weight: 800;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      text-shadow: 0 0 10px rgba(255,255,255,.2);
    }
  `}</style>
)

// -----------------------------
// Utilities
// -----------------------------
function classNames(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ")
}
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])
  return [value, setValue] as const
}

// -----------------------------
// Admin controls
// -----------------------------
function AdminBar({
  showLogo,
  setShowLogo,
  showCoreCats,
  setShowCoreCats,
  showExtraCats,
  setShowExtraCats,
  showAnnouncements,
  setShowAnnouncements,
  showSloganWM,
  setShowSloganWM,
}: any) {
  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={classNames(
        "relative inline-flex items-center h-9 px-3 rounded-xl transition",
        checked ? "bg-[var(--violet-neon)]/30 text-white" : "bg-white/5 text-white/70",
        "border border-white/10 hover:border-white/20",
      )}
      aria-pressed={checked}
    >
      <span
        className={classNames(
          "mr-2 h-4 w-4 rounded-full",
          checked ? "bg-[var(--blue-neon)] shadow-[var(--glow)]" : "bg-white/30",
        )}
      />
      {label}
    </button>
  )

  return (
    <div className="z-40 sticky top-0 w-full backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center">
        <span className="text-sm text-white/70">ADMIN — Contrôles de visibilité</span>
        <div className="flex flex-wrap gap-2">
          <Toggle label="Valider Logo (afficher)" checked={showLogo} onChange={() => setShowLogo((v: boolean) => !v)} />
          <Toggle label="Catégories (3)" checked={showCoreCats} onChange={() => setShowCoreCats((v: boolean) => !v)} />
          <Toggle
            label="Nouvelles Catégories"
            checked={showExtraCats}
            onChange={() => setShowExtraCats((v: boolean) => !v)}
          />
          <Toggle
            label="Annonces"
            checked={showAnnouncements}
            onChange={() => setShowAnnouncements((v: boolean) => !v)}
          />
          <Toggle
            label="Slogan Watermark"
            checked={showSloganWM}
            onChange={() => setShowSloganWM((v: boolean) => !v)}
          />
        </div>
      </div>
    </div>
  )
}

// -----------------------------
// Traffic Light (animated)
// -----------------------------
function TrafficLight({ side }: { side: "left" | "right" }) {
  const base = "fixed top-6 z-30"
  const pos = side === "left" ? "left-3" : "right-3"
  const pulse = {
    red: { boxShadow: "0 0 12px 2px rgba(255, 72, 72, .8)" },
    yellow: { boxShadow: "0 0 12px 2px rgba(255, 199, 0, .8)" },
    green: { boxShadow: "0 0 12px 2px rgba(72, 255, 158, .8)" },
  } as const

  return (
    <div className={classNames(base, pos)} aria-hidden>
      <div className="ds-card ds-border-neon rounded-2xl p-2 w-14 shadow-xl">
        <div className="rounded-lg bg-black/50 p-2 flex flex-col gap-2">
          {["red", "yellow", "green"].map((c, i) => (
            <motion.span
              key={c}
              className={classNames(
                "h-4 w-4 rounded-full mx-auto block",
                c === "red" && "bg-red-500",
                c === "yellow" && "bg-yellow-400",
                c === "green" && "bg-emerald-400",
              )}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, delay: i * 0.25 }}
              style={c === "red" ? pulse.red : c === "yellow" ? pulse.yellow : pulse.green}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// -----------------------------
// 168h Countdown
// -----------------------------
function useCountdown(hours = 168) {
  const target = useMemo(() => Date.now() + hours * 60 * 60 * 1000, [hours])
  const [left, setLeft] = useState(target - Date.now())
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000)
    return () => clearInterval(t)
  }, [target])
  const s = Math.floor(left / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return { d, h, m, s: sec }
}

function CountdownBadge() {
  const { d, h, m, s } = useCountdown(168)
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10">
      ⏱️ 168h · {d}j {h}h {m}m {s}s
    </span>
  )
}

// -----------------------------
// Category Card
// -----------------------------
function CategoryCard({ title, top10 = false }: { title: string; top10?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group relative rounded-2xl p-[1px] bg-gradient-to-b from-[var(--violet-neon)]/60 to-[var(--blue-neon)]/40 ds-blur-glow"
    >
      <div className="ds-card rounded-[15px] p-4 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-white ds-neon-text">{title}</h3>
          {top10 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pink-accent)]/20 text-[var(--pink-accent)] border border-[var(--pink-accent)]/30">
              TOP 10
            </span>
          )}
        </div>
        <div className="mt-3 text-sm text-white/75 leading-relaxed">
          Découvrez les projets en lice. Votez, investissez, faites monter vos favoris.
        </div>
        <div className="mt-4 flex items-center justify-between">
          <CountdownBadge />
          <button className="px-3 py-2 rounded-xl bg-[var(--violet-neon)]/80 hover:bg-[var(--violet-neon)] text-white transition shadow-md">
            Investir
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// -----------------------------
// Hero / Header
// -----------------------------
function Header({ showLogo }: { showLogo: boolean }) {
  return (
    <header className="relative z-20">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          {/* Logo area (hidden by default until ADMIN validates) */}
          <div className="flex items-center gap-3">
            <div
              className={classNames(
                "h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-white/60",
                !showLogo && "opacity-20 blur-[1px]",
              )}
              title={showLogo ? "Logo officiel" : "Logo masqué (ADMIN)"}
            >
              {showLogo ? "LOGO" : "—"}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight ds-neon-text">VISUAL</h1>
              <p className="text-[13px] md:text-sm text-white/70">
                <span className="text-white/90">Regarde-Investis-Gagne</span>
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10">
              Catalogue
            </button>
            <button className="px-3 py-2 rounded-xl bg-[var(--blue-neon)]/20 text-white border border-[var(--blue-neon)]/40 hover:bg-[var(--blue-neon)]/30">
              Se connecter
            </button>
          </nav>
        </div>

        {/* Hero block */}
        <div className="mt-8 grid md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              La plateforme d'investissement participatif audiovisuel
            </h2>
            <p className="text-white/70 max-w-prose">
              Découvrez, votez et investissez dans des projets prometteurs. Classements, TOP 10, compte à rebours 168h,
              et récompenses — tout est là pour faire émerger les meilleurs.
            </p>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-[var(--violet-neon)] text-white shadow-lg"
                title="Regarde-Investis-Gagne"
              >
                Démarrer
              </button>
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80">
                En savoir plus
              </button>
            </div>
          </div>
          <div className="aspect-video rounded-2xl ds-card ds-border-neon grid place-items-center text-white/70">
            Démo — Explication de VISUAL (vidéo)
          </div>
        </div>
      </div>
    </header>
  )
}

// -----------------------------
// Slogan Banner (strategic spots)
// -----------------------------
function SloganStrip() {
  return (
    <div className="w-full py-2 bg-gradient-to-r from-[var(--violet-neon)]/20 via-[var(--pink-accent)]/20 to-[var(--blue-neon)]/20 border-y border-white/10 text-center text-white/90 text-sm">
      Regarde-Investis-Gagne
    </div>
  )
}

// -----------------------------
// Main Page
// -----------------------------
export default function VisualDesignSystem() {
  // Admin toggles (persisted)
  const [showLogo, setShowLogo] = useLocalStorage("visual.showLogo", false)
  const [showCoreCats, setShowCoreCats] = useLocalStorage("visual.showCoreCats", true)
  const [showExtraCats, setShowExtraCats] = useLocalStorage("visual.showExtraCats", true)
  const [showAnnouncements, setShowAnnouncements] = useLocalStorage("visual.showAnnouncements", true)
  const [showSloganWM, setShowSloganWM] = useLocalStorage("visual.showSloganWM", true)

  return (
    <div className="min-h-screen ds-gradient-bg text-[15px]">
      <Theme />

      {/* Traffic lights at extremes */}
      <TrafficLight side="left" />
      <TrafficLight side="right" />

      {/* ADMIN BAR */}
      <AdminBar
        showLogo={showLogo}
        setShowLogo={setShowLogo}
        showCoreCats={showCoreCats}
        setShowCoreCats={setShowCoreCats}
        showExtraCats={showExtraCats}
        setShowExtraCats={setShowExtraCats}
        showAnnouncements={showAnnouncements}
        setShowAnnouncements={setShowAnnouncements}
        showSloganWM={showSloganWM}
        setShowSloganWM={setShowSloganWM}
      />

      {/* Header & Hero */}
      <Header showLogo={showLogo} />

      {/* Slogan strip (strategic placement) */}
      <SloganStrip />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Core Categories (3 rect) */}
        {showCoreCats && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Catégories</h2>
              <span className="text-white/60 text-sm">3 catégories principales</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <CategoryCard title="Cinéma" top10 />
              <CategoryCard title="Musique" />
              <CategoryCard title="Documentaires" />
            </div>
          </section>
        )}

        {/* Extra Categories */}
        {showExtraCats && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Nouvelles catégories</h2>
              <span className="text-white/60 text-sm">Visibilité contrôlée par ADMIN</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <CategoryCard title="Voix de l'info" />
              <CategoryCard title="Livres" />
              <CategoryCard title="Podcasts" />
            </div>
          </section>
        )}

        {/* Annonces */}
        {showAnnouncements && (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Annonces</h2>
              <span className="text-white/60 text-sm">Rubrique optionnelle</span>
            </div>
            <div className="rounded-2xl p-5 ds-card ds-border-neon text-white/85">
              🔔 Mises à jour VISUAL : nouvelle formule BATTLE 40/30/20/10 pour le Visual Studio Live Show. Tests
              généraux cette semaine.
            </div>
          </section>
        )}
      </main>

      {/* Slogan watermark (strategic repetition) */}
      {showSloganWM && <div className="ds-watermark text-3xl md:text-5xl text-white/80">Regarde-Investis-Gagne</div>}

      {/* Footer with slogan */}
      <footer className="mt-16 border-t border-white/10 py-8 text-center text-white/60">
        © {new Date().getFullYear()} VISUAL — Regarde-Investis-Gagne
      </footer>
    </div>
  )
}
