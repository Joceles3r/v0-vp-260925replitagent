"use client"

import { useEffect, useState } from "react"

export function useAccessibility() {
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal")
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Load preferences from localStorage
    const savedHighContrast = localStorage.getItem("a11y-high-contrast") === "true"
    const savedFontSize = (localStorage.getItem("a11y-font-size") as any) || "normal"
    const savedReducedMotion = localStorage.getItem("a11y-reduced-motion") === "true"

    setHighContrast(savedHighContrast)
    setFontSize(savedFontSize)
    setReducedMotion(savedReducedMotion)

    // Apply to document
    if (savedHighContrast) {
      document.documentElement.classList.add("high-contrast")
    }
    if (savedReducedMotion) {
      document.documentElement.classList.add("reduced-motion")
    }
    document.documentElement.setAttribute("data-font-size", savedFontSize)
  }, [])

  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem("a11y-high-contrast", String(newValue))
    document.documentElement.classList.toggle("high-contrast", newValue)
  }

  const changeFontSize = (size: "normal" | "large" | "xlarge") => {
    setFontSize(size)
    localStorage.setItem("a11y-font-size", size)
    document.documentElement.setAttribute("data-font-size", size)
  }

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion
    setReducedMotion(newValue)
    localStorage.setItem("a11y-reduced-motion", String(newValue))
    document.documentElement.classList.toggle("reduced-motion", newValue)
  }

  return {
    highContrast,
    fontSize,
    reducedMotion,
    toggleHighContrast,
    changeFontSize,
    toggleReducedMotion,
  }
}
