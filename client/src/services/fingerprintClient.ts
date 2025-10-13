"use client"

import { useEffect } from "react"

import { useState } from "react"

/**
 * Service client pour générer le fingerprint du navigateur
 * Utilise FingerprintJS pour créer une empreinte unique
 */

import FingerprintJS from "@fingerprintjs/fingerprintjs"

let fpPromise: Promise<any> | null = null

/**
 * Initialiser FingerprintJS
 */
export async function initFingerprint(): Promise<void> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  await fpPromise
}

/**
 * Obtenir le fingerprint du navigateur
 */
export async function getFingerprint(): Promise<{
  visitorId: string
  components: any
}> {
  if (!fpPromise) {
    await initFingerprint()
  }

  const fp = await fpPromise!
  const result = await fp.get()

  return {
    visitorId: result.visitorId,
    components: result.components,
  }
}

/**
 * Générer les données de fingerprint pour l'API
 */
export async function generateFingerprintData(): Promise<string> {
  const { visitorId, components } = await getFingerprint()

  const fingerprintData = {
    visitorId,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    vendor: navigator.vendor,
    plugins: Array.from(navigator.plugins || []).map((p) => p.name),
    canvas: components.canvas?.value,
    webgl: components.webgl?.value,
    fonts: components.fonts?.value,
    audio: components.audio?.value,
    timestamp: Date.now(),
  }

  return JSON.stringify(fingerprintData)
}

/**
 * Hook React pour utiliser le fingerprint
 */
export function useFingerprintHeaders() {
  const [fingerprintData, setFingerprintData] = useState<string | null>(null)

  useEffect(() => {
    generateFingerprintData().then(setFingerprintData).catch(console.error)
  }, [])

  return {
    "X-Fingerprint-Data": fingerprintData || "",
  }
}
