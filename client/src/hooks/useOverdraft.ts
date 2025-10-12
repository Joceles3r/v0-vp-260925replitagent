import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

// ===== TYPES =====

interface OverdraftStatus {
  userId: string;
  currentBalance: number;
  overdraftLimit: number;
  availableCredit: number;
  overdraftAmount: number;
  overdraftPercentage: number;
  alertLevel: 'safe' | 'warning' | 'critical' | 'blocked';
  isBlocked: boolean;
  daysSinceOverdraft: number;
  estimatedFees: number;
  nextAlert?: string;
}

interface OverdraftAlert {
  id: string;
  alertType: 'warning' | 'critical' | 'blocked';
  overdraftAmount: number;
  limitAmount: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface OverdraftIncident {
  id: string;
  incidentType: string;
  status: string;
  overdraftAmount: number;
  description: string;
  isResolved: boolean;
  createdAt: string;
}

interface OverdraftConfiguration {
  limitAmount: number;
  alertsEnabled: boolean;
  autoBlock: boolean;
  gracePeriodDays: number;
}

// ===== HOOKS PRINCIPAUX =====

/**
 * Hook pour obtenir le statut de découvert de l'utilisateur connecté
 */
export function useOverdraftStatus() {
  return useQuery({
    queryKey: ['overdraft', 'status'],
    queryFn: async (): Promise<OverdraftStatus> => {
      const response = await fetch('/api/overdraft/status', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement du statut de découvert');
      const data = await response.json();
      return data.status;
    },
    staleTime: 30 * 1000, // 30 secondes - données critiques
    refetchInterval: 60 * 1000, // Refresh toutes les minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook pour obtenir les alertes de découvert
 */
export function useOverdraftAlerts() {
  return useQuery({
    queryKey: ['overdraft', 'alerts'],
    queryFn: async (): Promise<OverdraftAlert[]> => {
      const response = await fetch('/api/overdraft/alerts', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des alertes');
      const data = await response.json();
      return data.alerts || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour obtenir les incidents de découvert
 */
export function useOverdraftIncidents() {
  return useQuery({
    queryKey: ['overdraft', 'incidents'],
    queryFn: async (): Promise<OverdraftIncident[]> => {
      const response = await fetch('/api/overdraft/incidents', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement des incidents');
      const data = await response.json();
      return data.incidents || [];
    },
  });
}

/**
 * Hook pour obtenir la configuration de découvert
 */
export function useOverdraftConfiguration() {
  return useQuery({
    queryKey: ['overdraft', 'configuration'],
    queryFn: async (): Promise<OverdraftConfiguration> => {
      const response = await fetch('/api/overdraft/configuration', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Erreur lors du chargement de la configuration');
      const data = await response.json();
      return data.configuration;
    },
  });
}

// ===== MUTATIONS =====

/**
 * Hook pour modifier la limite de découvert
 */
export function useUpdateOverdraftLimit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (limitAmount: number): Promise<void> => {
      const response = await fetch('/api/overdraft/limit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ limitAmount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour de la limite');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdraft'] });
      toast({
        title: "✅ Limite mise à jour",
        description: "Votre limite de découvert a été modifiée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour configurer les alertes
 */
export function useConfigureOverdraftAlerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Partial<OverdraftConfiguration>): Promise<void> => {
      const response = await fetch('/api/overdraft/configuration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la configuration');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdraft'] });
      toast({
        title: "✅ Configuration sauvegardée",
        description: "Vos préférences d'alerte ont été mises à jour.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook pour marquer une alerte comme lue
 */
export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string): Promise<void> => {
      const response = await fetch(`/api/overdraft/alerts/${alertId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du marquage de l\'alerte');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdraft', 'alerts'] });
    },
  });
}

/**
 * Hook pour demander un déblocage de compte
 */
export function useRequestAccountUnblock() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (message: string): Promise<void> => {
      const response = await fetch('/api/overdraft/unblock-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la demande de déblocage');
      }
    },
    onSuccess: () => {
      toast({
        title: "📨 Demande envoyée",
        description: "Votre demande de déblocage a été transmise à nos équipes. Vous recevrez une réponse sous 24h.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ===== HOOKS UTILITAIRES =====

/**
 * Hook pour calculer les statistiques de découvert
 */
export function useOverdraftStats(status?: OverdraftStatus) {
  if (!status) return null;

  const isInOverdraft = status.overdraftAmount > 0;
  const creditUsedPercentage = (status.overdraftAmount / status.overdraftLimit) * 100;
  const availableCreditPercentage = ((status.overdraftLimit - status.overdraftAmount) / status.overdraftLimit) * 100;
  
  return {
    isInOverdraft,
    creditUsedPercentage: creditUsedPercentage.toFixed(1),
    availableCreditPercentage: availableCreditPercentage.toFixed(1),
    dailyFeeAmount: (status.overdraftAmount * 0.001).toFixed(2),
    monthlyFeeEstimate: Math.min(status.overdraftAmount * 0.001 * 30, 50).toFixed(2),
    daysUntilBlock: status.alertLevel === 'critical' ? 3 : 
                   status.alertLevel === 'warning' ? 7 : null,
  };
}

/**
 * Hook pour obtenir le niveau de risque
 */
export function useOverdraftRiskLevel(status?: OverdraftStatus) {
  if (!status) return { level: 'unknown', color: 'gray', message: 'Statut inconnu' };

  switch (status.alertLevel) {
    case 'safe':
      return { 
        level: 'safe', 
        color: 'green', 
        message: 'Situation financière saine' 
      };
    case 'warning':
      return { 
        level: 'warning', 
        color: 'yellow', 
        message: 'Attention: vous approchez de votre limite' 
      };
    case 'critical':
      return { 
        level: 'critical', 
        color: 'orange', 
        message: 'Situation critique: régularisez rapidement' 
      };
    case 'blocked':
      return { 
        level: 'blocked', 
        color: 'red', 
        message: 'Compte bloqué: contactez-nous' 
      };
    default:
      return { 
        level: 'unknown', 
        color: 'gray', 
        message: 'Statut à vérifier' 
      };
  }
}

/**
 * Hook pour formater les montants
 */
export function useOverdraftFormatters() {
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(percentage / 100);
  };

  const formatDays = (days: number): string => {
    if (days === 0) return 'Aucun';
    if (days === 1) return '1 jour';
    return `${days} jours`;
  };

  return { formatAmount, formatPercentage, formatDays };
}
