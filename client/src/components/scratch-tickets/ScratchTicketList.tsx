import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import ScratchTicket, { ScratchTicketData } from './ScratchTicket';

interface ScratchTicketListResponse {
  success: boolean;
  tickets: ScratchTicketData[];
  count: number;
  pending: number;
}

interface ScratchResponse {
  success: boolean;
  reward: string;
  rewardVP: number;
  message: string;
  newBalance: number;
}

export const ScratchTicketList: React.FC = () => {
  const [tickets, setTickets] = useState<ScratchTicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTickets = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/scratch-tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des tickets');
      }

      const data: ScratchTicketListResponse = await response.json();
      
      if (data.success) {
        setTickets(data.tickets.map(ticket => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          expiresAt: new Date(ticket.expiresAt),
          scratchedAt: ticket.scratchedAt ? new Date(ticket.scratchedAt) : undefined,
        })));
      } else {
        throw new Error('Erreur lors de la récupération des tickets');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleScratchTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/scratch-tickets/${ticketId}/scratch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data: ScratchResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors du grattage');
      }

      // Mettre à jour le ticket local avec le résultat
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket.id === ticketId 
            ? {
                ...ticket,
                status: 'scratched' as const,
                reward: data.reward as any,
                rewardVP: data.rewardVP,
                scratchedAt: new Date(),
                canScratch: false
              }
            : ticket
        )
      );

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du grattage';
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const pendingTickets = tickets.filter(ticket => ticket.status === 'pending');
  const scratchedTickets = tickets.filter(ticket => ticket.status === 'scratched');
  const expiredTickets = tickets.filter(ticket => ticket.status === 'expired');
  const canScratchCount = tickets.filter(ticket => ticket.canScratch).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de vos tickets...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => fetchTickets()} 
            className="mt-4 w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full text-white">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Mini-Tickets Scratch</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Grattez vos tickets pour gagner des VISUpoints !
                </p>
              </div>
            </div>
            <Button
              onClick={() => fetchTickets(true)}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{tickets.length}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{canScratchCount}</div>
              <div className="text-sm text-yellow-600">À gratter</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{scratchedTickets.length}</div>
              <div className="text-sm text-green-600">Grattés</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{expiredTickets.length}</div>
              <div className="text-sm text-red-600">Expirés</div>
            </div>
          </div>

          {canScratchCount > 0 && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <Gift className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                Vous avez <strong>{canScratchCount}</strong> ticket{canScratchCount > 1 ? 's' : ''} 
                {' '}prêt{canScratchCount > 1 ? 's' : ''} à gratter ! 
                N'oubliez pas qu'ils expirent après 30 jours.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Liste des tickets */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-lg font-semibold mb-2">Aucun ticket pour le moment</h3>
            <p className="text-muted-foreground mb-4">
              Les Mini-Tickets Scratch sont automatiquement créés tous les 100 VISUpoints cumulés.
            </p>
            <p className="text-sm text-muted-foreground">
              Continuez à gagner des VISUpoints pour débloquer votre premier ticket !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tickets à gratter */}
          {canScratchCount > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default" className="bg-yellow-500">
                  À gratter ({canScratchCount})
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {pendingTickets
                    .filter(ticket => ticket.canScratch)
                    .map(ticket => (
                      <ScratchTicket
                        key={ticket.id}
                        ticket={ticket}
                        onScratch={handleScratchTicket}
                      />
                    ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Tickets en attente (cooldown) */}
          {pendingTickets.filter(ticket => !ticket.canScratch).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">
                  En attente ({pendingTickets.filter(ticket => !ticket.canScratch).length})
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {pendingTickets
                    .filter(ticket => !ticket.canScratch)
                    .map(ticket => (
                      <ScratchTicket
                        key={ticket.id}
                        ticket={ticket}
                        onScratch={handleScratchTicket}
                        disabled={true}
                      />
                    ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Tickets grattés */}
          {scratchedTickets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">
                  Grattés récemment ({Math.min(scratchedTickets.length, 6)})
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {scratchedTickets
                    .slice(0, 6) // Afficher seulement les 6 plus récents
                    .map(ticket => (
                      <ScratchTicket
                        key={ticket.id}
                        ticket={ticket}
                        onScratch={handleScratchTicket}
                        disabled={true}
                      />
                    ))}
                </AnimatePresence>
              </div>
              {scratchedTickets.length > 6 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  ... et {scratchedTickets.length - 6} autre{scratchedTickets.length - 6 > 1 ? 's' : ''} ticket{scratchedTickets.length - 6 > 1 ? 's' : ''} gratté{scratchedTickets.length - 6 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScratchTicketList;
