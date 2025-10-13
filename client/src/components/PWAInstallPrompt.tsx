"use client"

/**
 * Composant pour promouvoir l'installation de la PWA
 */

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { X, Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Vérifier si l'utilisateur a déjà refusé
      const dismissed = localStorage.getItem("pwa_install_dismissed")
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    console.log("[PWA] Install prompt outcome:", outcome)

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa_install_dismissed", Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 shadow-lg z-50 bg-gradient-to-br from-[#0F0F23] to-[#1A1A2E] border-[#00D1FF]/20">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00D1FF] to-[#7B2CFF] rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">Installer VISUAL</h3>
          <p className="text-sm text-gray-300 mb-3">Accédez rapidement à VISUAL depuis votre écran d'accueil</p>

          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-gradient-to-r from-[#00D1FF] to-[#7B2CFF] hover:opacity-90"
            >
              Installer
            </Button>
            <Button onClick={handleDismiss} size="sm" variant="ghost" className="text-gray-300 hover:text-white">
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
