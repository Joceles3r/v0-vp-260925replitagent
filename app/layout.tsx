import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { FeedbackWidget } from "@/client/src/components/FeedbackWidget"
import { AccessibilityMenu } from "@/client/src/components/AccessibilityMenu"
import "./globals.css"

export const metadata: Metadata = {
  title: "VISUAL Platform",
  description: "Plateforme d'investissement de contenus visuels",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          {children}
        </Suspense>
        <FeedbackWidget />
        <AccessibilityMenu />
        <Analytics />
      </body>
    </html>
  )
}
