"use client"

import { motion } from "framer-motion"
import { CountdownBadge } from "./CountdownBadge"
import { Button } from "@/components/ui/button"

interface CategoryCardProps {
  title: string
  top10?: boolean
  description?: string
}

export function CategoryCard({
  title,
  top10 = false,
  description = "Découvrez les projets en lice. Votez, investissez, faites monter vos favoris.",
}: CategoryCardProps) {
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
        <div className="mt-3 text-sm text-white/75 leading-relaxed">{description}</div>
        <div className="mt-4 flex items-center justify-between">
          <CountdownBadge />
          <Button variant="neonViolet" size="sm" className="px-3 py-2 rounded-xl">
            Investir
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
