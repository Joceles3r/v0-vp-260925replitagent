"use client"

import { Switch, Route } from "wouter"
import { queryClient } from "./lib/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/useAuth"
import Navigation from "@/components/Navigation"
import CuriosityDock from "@/components/CuriosityDock"
import { AudioJingle } from "@/components/AudioJingle"
import { FloatingContactButton } from "@/components/FloatingContactButton"

// Pages
import Landing from "@/pages/landing"
import LoginPage from "@/pages/login"
import Home from "@/pages/home"
import Dashboard from "@/pages/dashboard"
import Projects from "@/pages/projects"
import Portfolio from "@/pages/portfolio"
import Live from "@/pages/live"
import Admin from "@/pages/admin"
import KYCOnboarding from "@/pages/KYCOnboarding"
import WalletPage from "@/pages/wallet"
import SocialPage from "@/pages/social"
import ReceiptsPage from "@/pages/receipts"
import Top10Page from "@/pages/top10"
import FidelityPage from "@/pages/fidelity"
import VisualPage from "@/pages/visual"
import InfoPage from "@/pages/info"
import LeaderboardPage from "@/pages/leaderboard"
import AccessibilityPage from "@/pages/accessibility"
import ProfilePage from "@/pages/profile"
import SettingsPage from "@/pages/settings"
import CreatorVideosPage from "@/pages/creator-videos"
import LegalPage from "@/pages/legal"
import NotFound from "@/pages/not-found"
import AdminDashboard from "@/admin/pages/AdminDashboard"
import ContactSupportPage from "@/pages/contact-support"
import VoixInfoDashboardPage from "@/pages/voix-info-dashboard"
import MinorVisitorDashboardPage from "@/pages/minor-visitor-dashboard"
import OverdraftManagementPage from "@/pages/overdraft-management"
import PoadcastsPage from "@/pages/Poadcasts"

function Router() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Show navigation only for authenticated users */}
      {isAuthenticated && <Navigation />}

      <Switch>
        {isLoading ? (
          <Route>
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </Route>
        ) : !isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/landing" component={Landing} />
            <Route path="/login" component={LoginPage} />
            <Route path="/visual" component={VisualPage} />
            <Route path="/info" component={InfoPage} />
            <Route path="/accessibility" component={AccessibilityPage} />
            <Route path="/legal" component={LegalPage} />
            <Route path="/projects" component={Projects} />
            <Route component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/kyc" component={KYCOnboarding} />
            <Route path="/visual" component={VisualPage} />
            <Route path="/info" component={InfoPage} />
            <Route path="/accessibility" component={AccessibilityPage} />
            <Route path="/legal" component={LegalPage} />
            <Route path="/projects" component={Projects} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/live" component={Live} />
            <Route path="/wallet" component={WalletPage} />
            <Route path="/social" component={SocialPage} />
            <Route path="/receipts" component={ReceiptsPage} />
            <Route path="/top10" component={Top10Page} />
            <Route path="/fidelity" component={FidelityPage} />
            <Route path="/leaderboard" component={LeaderboardPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/settings" component={SettingsPage} />
            <Route path="/creator/videos" component={CreatorVideosPage} />
            <Route path="/contact-support" component={ContactSupportPage} />
            <Route path="/voix-info" component={VoixInfoDashboardPage} />
            <Route path="/minor-visitor-dashboard" component={MinorVisitorDashboardPage} />
            <Route path="/wallet/overdraft" component={OverdraftManagementPage} />
            <Route path="/poadcasts" component={PoadcastsPage} />
            <Route path="/admin" component={Admin} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route component={NotFound} />
          </>
        )}
      </Switch>

      {/* Curiosity Dock - visible uniquement pour les utilisateurs connectés */}
      {isAuthenticated && !isLoading && <CuriosityDock />}

      {/* Bouton flottant de contact - visible uniquement pour les utilisateurs connectés */}
      {isAuthenticated && !isLoading && <FloatingContactButton />}
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AudioJingle />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
