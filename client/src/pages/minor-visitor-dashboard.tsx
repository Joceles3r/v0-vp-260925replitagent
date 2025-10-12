import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User,
  Shield,
  Coins,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  Gift,
  Star,
  Lock,
  CheckCircle,
  Bell
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import MinorActivitiesPanel from '@/components/minor/MinorActivitiesPanel';
import MinorNotificationCenter from '@/components/minor/MinorNotificationCenter';

interface MinorStatus {
  isMinor: boolean;
  age?: number;
  status?: string;
  visuPoints: number;
  capReached: boolean;
  canEarnMore: boolean;
  majorityDate?: string;
  lockUntil?: string;
  canCashOut: boolean;
}

const MinorVisitorDashboardPage: React.FC = () => {
  // Récupérer le statut du visiteur mineur
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['minor-visitor', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/minor-visitors/status', { credentials: 'include' });
      if (!response.ok) throw new Error('Erreur lors du chargement du statut');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Chargement de votre profil mineur...</p>
          </div>
        </div>
      </div>
    );
  }

  const status: MinorStatus = statusData?.status || {};

  // Si ce n'est pas un mineur, rediriger ou afficher message
  if (!status.isMinor) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Accès réservé aux mineurs</h2>
            <p className="text-muted-foreground mb-4">
              Cette page est destinée aux utilisateurs de 16-17 ans uniquement.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const capPercentage = Math.min((status.visuPoints / 20000) * 100, 100);
  const euroEquivalent = (status.visuPoints / 100).toFixed(2);
  const remainingPoints = Math.max(20000 - status.visuPoints, 0);
  const remainingEuros = (remainingPoints / 100).toFixed(2);

  const getStatusBadge = () => {
    switch (status.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">✅ Actif</Badge>;
      case 'capped':
        return <Badge className="bg-orange-100 text-orange-800">🛑 Plafond atteint</Badge>;
      case 'transitioning':
        return <Badge className="bg-blue-100 text-blue-800">🔄 En transition</Badge>;
      case 'locked':
        return <Badge className="bg-red-100 text-red-800">🔒 Verrou 6 mois</Badge>;
      case 'unlocked':
        return <Badge className="bg-purple-100 text-purple-800">🔓 Conversion possible</Badge>;
      default:
        return <Badge variant="outline">{status.status}</Badge>;
    }
  };

  const getMajorityCountdown = () => {
    if (!status.majorityDate) return null;
    
    try {
      const majorityDate = new Date(status.majorityDate + 'T00:00:00.000Z');
      const now = new Date();
      
      if (majorityDate <= now) {
        return "🎉 Majorité atteinte !";
      }
      
      return formatDistanceToNow(majorityDate, { locale: fr });
    } catch {
      return "Date invalide";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              Espace Visiteur Mineur
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Ton espace sécurisé sur VISUAL (16-17 ans)
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {status.age} ans
            </Badge>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Alerte si proche de la majorité */}
      {status.majorityDate && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>Majorité dans {getMajorityCountdown()}</strong> - 
            Tu devras choisir ton type de compte (Investisseur ou Investi-lecteur) à tes 18 ans.
          </AlertDescription>
        </Alert>
      )}

      {/* Carte VISUpoints principale */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-purple-600" />
            Tes VISUpoints Mineur
          </CardTitle>
          <CardDescription>
            Plafond spécial mineur : 200€ maximum jusqu'à tes 18 ans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-purple-600">
                {status.visuPoints.toLocaleString()} VP
              </p>
              <p className="text-lg text-muted-foreground">
                ≈ {euroEquivalent}€
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Plafond : 20 000 VP (200€)
              </p>
              <p className="text-sm font-medium">
                Restant : {remainingPoints.toLocaleString()} VP ({remainingEuros}€)
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression vers le plafond</span>
              <span>{capPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={capPercentage} className="h-3" />
          </div>
          
          {status.capReached && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-orange-700">
                <strong>Plafond atteint !</strong> Tes gains sont en pause jusqu'à tes 18 ans. 
                Tu pourras récupérer tes 200€ après 6 mois de présence post-majorité.
              </AlertDescription>
            </Alert>
          )}

          {!status.capReached && capPercentage >= 80 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-yellow-700">
                <strong>Tu approches du plafond !</strong> Il te reste {remainingEuros}€ à gagner avant la pause.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activités pour gagner des points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-500" />
              Gagner des VISUpoints
            </CardTitle>
            <CardDescription>
              Activités autorisées pour les mineurs (non-financières)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status.canEarnMore ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      📚
                    </div>
                    <div>
                      <p className="font-medium">Quiz éducatifs</p>
                      <p className="text-sm text-muted-foreground">+10-50 VP par quiz</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Participer</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      👁️
                    </div>
                    <div>
                      <p className="font-medium">Visionnage Live Shows</p>
                      <p className="text-sm text-muted-foreground">+5 VP par 10 min</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Regarder</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      🎯
                    </div>
                    <div>
                      <p className="font-medium">Missions communauté</p>
                      <p className="text-sm text-muted-foreground">+20-100 VP par mission</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Explorer</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      ⭐
                    </div>
                    <div>
                      <p className="font-medium">Connexion quotidienne</p>
                      <p className="text-sm text-muted-foreground">+5 VP par jour</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Gains en pause - Plafond de 200€ atteint
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tes points seront récupérables à tes 18 ans
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Ton statut protégé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-medium">Âge actuel</p>
                <p className="text-lg font-bold text-blue-600">{status.age} ans</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium">VP gagnés</p>
                <p className="text-lg font-bold text-green-600">{status.visuPoints}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>Consultation des contenus grand public</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span>Visionnage des Live Shows (spectateur)</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                  ✗
                </div>
                <span>Investissements et opérations financières</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                  ✗
                </div>
                <span>Publications sur le réseau social</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                  ✗
                </div>
                <span>Conversion VISUpoints → Euros</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations sur la transition vers la majorité */}
      <Card className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-orange-500" />
            À tes 18 ans sur VISUAL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                1️⃣
              </div>
              <h4 className="font-medium mb-1">Choix du compte</h4>
              <p className="text-sm text-muted-foreground">
                Tu devras choisir : Investisseur ou Investi-lecteur
              </p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                2️⃣
              </div>
              <h4 className="font-medium mb-1">Vérification KYC</h4>
              <p className="text-sm text-muted-foreground">
                Validation d'identité pour les opérations financières
              </p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                3️⃣
              </div>
              <h4 className="font-medium mb-1">Récupération VP</h4>
              <p className="text-sm text-muted-foreground">
                {status.visuPoints >= 20000 ? 
                  "Après 6 mois d'attente" : 
                  "Immédiatement disponible"
                }
              </p>
            </div>
          </div>
          
          {status.visuPoints >= 20000 && (
            <Alert className="bg-orange-100 border-orange-300">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                <strong>Verrou de 6 mois :</strong> Comme tu as atteint les 200€, tu devras attendre 6 mois après tes 18 ans pour récupérer tes VISUpoints en euros.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Activités pour gagner des VISUpoints */}
      <MinorActivitiesPanel />

      {/* Centre de notifications */}
      <MinorNotificationCenter />

      {/* Actions rapides */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1">
              <Bell className="h-5 w-5" />
              <span className="text-xs">Notifications</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Historique VP</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1">
              <User className="h-5 w-5" />
              <span className="text-xs">Mon profil</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-1">
              <Shield className="h-5 w-5" />
              <span className="text-xs">Sécurité</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinorVisitorDashboardPage;
