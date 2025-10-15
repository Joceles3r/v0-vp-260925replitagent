"use client"

import { motion } from "framer-motion"

interface TrafficLightProps {
  side: "left" | "right"
}

export function TrafficLight({ side }: TrafficLightProps) {
  const base = "fixed top-6 z-30"
  const pos = side === "left" ? "left-3" : "right-3"

  const pulse = {
    red: { boxShadow: "0 0 12px 2px rgba(255, 72, 72, .8)" },
    yellow: { boxShadow: "0 0 12px 2px rgba(255, 199, 0, .8)" },
    green: { boxShadow: "0 0 12px 2px rgba(72, 255, 158, .8)" },
  } as const

  return (
    <div className={`${base} ${pos}`} aria-hidden="true">
      <div className="ds-card ds-border-neon rounded-2xl p-2 w-14 shadow-xl">
        <div className="rounded-lg bg-black/50 p-2 flex flex-col gap-2">
          {["red", "yellow", "green"].map((color, i) => (
            <motion.span
              key={color}
              className={`h-4 w-4 rounded-full mx-auto block ${
                color === "red" ? "bg-red-500" : color === "yellow" ? "bg-yellow-400" : "bg-emerald-400"
              }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.6,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.25,
              }}
              style={color === "red" ? pulse.red : color === "yellow" ? pulse.yellow : pulse.green}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
