"use client"

import { useState, useEffect, useMemo } from "react"

interface CountdownBadgeProps {
  hours?: number
  className?: string
}

function useCountdown(hours = 168) {
  const target = useMemo(() => Date.now() + hours * 60 * 60 * 1000, [hours])
  const [left, setLeft] = useState(target - Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setLeft(Math.max(0, target - Date.now()))
    }, 1000)
    return () => clearInterval(timer)
  }, [target])

  const s = Math.floor(left / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  return { d, h, m, s: sec }
}

export function CountdownBadge({ hours = 168, className = "" }: CountdownBadgeProps) {
  const { d, h, m, s } = useCountdown(hours)

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/10 ${className}`}
    >
      ⏱️ 168h · {d}j {h}h {m}m {s}s
    </span>
  )
}
