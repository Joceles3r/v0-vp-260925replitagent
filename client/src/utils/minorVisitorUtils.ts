/**
 * Utilitaires pour le système de visiteurs mineurs
 */

// ===== CONSTANTES =====

export const MINOR_CONSTANTS = {
  MIN_AGE: 16,
  MAX_AGE: 17,
  MAJORITY_AGE: 18,
  DEFAULT_CAP_VP: 20000, // 200€ en VISUpoints
  VP_PER_EURO: 100,
  DEFAULT_LOCK_MONTHS: 6,
  CAP_WARNING_THRESHOLD: 0.8, // 80%
} as const;

export const MINOR_ACTIVITY_SOURCES = [
  'quiz_completion',
  'educational_content_viewing',
  'daily_login',
  'profile_completion',
  'community_mission',
  'live_show_viewing',
  'content_moderation_help',
  'platform_improvement_feedback'
] as const;

export const MINOR_NOTIFICATION_TYPES = {
  CAP_WARNING_80: 'cap_warning_80',
  CAP_REACHED: 'cap_reached',
  MAJORITY_REMINDER: 'majority_reminder',
  LOCK_EXPIRED: 'lock_expired'
} as const;

// ===== FONCTIONS UTILITAIRES =====

/**
 * Calculer l'âge à partir d'une date de naissance
 */
export function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Vérifier si une date de naissance est éligible pour un profil mineur
 */
export function isEligibleForMinorProfile(birthDate: string | Date): boolean {
  const age = calculateAge(birthDate);
  return age >= MINOR_CONSTANTS.MIN_AGE && age <= MINOR_CONSTANTS.MAX_AGE;
}

/**
 * Calculer la date de majorité (18ème anniversaire)
 */
export function calculateMajorityDate(birthDate: string | Date): string {
  const birth = new Date(birthDate);
  const majority = new Date(birth);
  majority.setFullYear(birth.getFullYear() + MINOR_CONSTANTS.MAJORITY_AGE);
  return majority.toISOString().split('T')[0]; // Format YYYY-MM-DD
}

/**
 * Calculer le nombre de jours jusqu'à la majorité
 */
export function daysUntilMajority(majorityDate: string): number {
  const majority = new Date(majorityDate + 'T00:00:00.000Z');
  const now = new Date();
  const diffTime = majority.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Vérifier si un mineur peut faire du cashout
 */
export function canMinorCashOut(
  status: string,
  lockUntil?: string,
  checkDate = new Date()
): boolean {
  // Les mineurs ne peuvent jamais faire de cashout
  if (status === 'active' || status === 'capped') return false;
  
  // Si verrou actif, pas de cashout
  if (status === 'locked' && lockUntil && new Date(lockUntil) > checkDate) {
    return false;
  }
  
  // Si déverrouillé ou plus de verrou, cashout possible
  return status === 'unlocked' || !lockUntil;
}

/**
 * Convertir les VISUpoints en euros
 */
export function vpToEuros(visuPoints: number): number {
  return visuPoints / MINOR_CONSTANTS.VP_PER_EURO;
}

/**
 * Convertir les euros en VISUpoints
 */
export function eurosToVP(euros: number): number {
  return euros * MINOR_CONSTANTS.VP_PER_EURO;
}

/**
 * Calculer le pourcentage de progression vers le cap
 */
export function calculateCapPercentage(visuPoints: number, cap = MINOR_CONSTANTS.DEFAULT_CAP_VP): number {
  return Math.min((visuPoints / cap) * 100, 100);
}

/**
 * Déterminer si le seuil d'alerte (80%) est atteint
 */
export function isNearCap(visuPoints: number, cap = MINOR_CONSTANTS.DEFAULT_CAP_VP): boolean {
  const percentage = calculateCapPercentage(visuPoints, cap);
  return percentage >= (MINOR_CONSTANTS.CAP_WARNING_THRESHOLD * 100);
}

/**
 * Formater une durée en texte lisible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }
}

/**
 * Générer un ID unique pour une activité
 */
export function generateActivityId(type: string, category: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${type}_${category}_${timestamp}_${random}`;
}

/**
 * Valider une source d'activité pour les mineurs
 */
export function isValidMinorActivitySource(source: string): boolean {
  return MINOR_ACTIVITY_SOURCES.includes(source as any);
}

/**
 * Obtenir la couleur CSS pour un statut mineur
 */
export function getMinorStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'capped':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'transitioning':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'locked':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'unlocked':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Obtenir l'icône pour un type de notification
 */
export function getNotificationIcon(type: string): string {
  switch (type) {
    case MINOR_NOTIFICATION_TYPES.CAP_WARNING_80:
      return '⚠️';
    case MINOR_NOTIFICATION_TYPES.CAP_REACHED:
      return '🛑';
    case MINOR_NOTIFICATION_TYPES.MAJORITY_REMINDER:
      return '🎂';
    case MINOR_NOTIFICATION_TYPES.LOCK_EXPIRED:
      return '🔓';
    default:
      return '📢';
  }
}

/**
 * Formater un message de notification selon le type
 */
export function formatNotificationMessage(
  type: string,
  visuPoints: number,
  majorityDate?: string
): { title: string; message: string } {
  switch (type) {
    case MINOR_NOTIFICATION_TYPES.CAP_WARNING_80:
      return {
        title: '⚠️ Limite VISUpoints approchée',
        message: `Tu approches de la limite mineur de 200€ (${visuPoints.toLocaleString()} VP / 20 000 VP). Profite de tes derniers gains avant la majorité !`
      };
      
    case MINOR_NOTIFICATION_TYPES.CAP_REACHED:
      return {
        title: '🛑 Limite VISUpoints atteinte',
        message: 'Gains en pause jusqu\'à ta majorité (200€ max atteints). Tes points seront récupérables après ton 18ème anniversaire et 6 mois d\'attente.'
      };
      
    case MINOR_NOTIFICATION_TYPES.MAJORITY_REMINDER:
      const daysLeft = majorityDate ? daysUntilMajority(majorityDate) : 0;
      return {
        title: '🎂 Majorité approche !',
        message: daysLeft <= 7 
          ? `Plus que ${daysLeft} jour${daysLeft > 1 ? 's' : ''} ! Prépare-toi à choisir ton type de compte (Investisseur ou Investi-lecteur).`
          : 'Ta majorité approche ! Commence à réfléchir au type de compte que tu souhaites ouvrir.'
      };
      
    case MINOR_NOTIFICATION_TYPES.LOCK_EXPIRED:
      return {
        title: '🔓 Verrou expiré',
        message: 'Tu peux maintenant récupérer tes 200€ en VISUpoints (sous réserve de validation KYC).'
      };
      
    default:
      return {
        title: '📢 Notification VISUAL',
        message: 'Une mise à jour concernant ton compte mineur.'
      };
  }
}

/**
 * Créer un résumé du statut mineur pour l'affichage
 */
export function createMinorStatusSummary(status: any): {
  level: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  actionRequired: boolean;
} {
  if (!status?.isMinor) {
    return {
      level: 'info',
      title: 'Profil majeur',
      description: 'Tu peux utiliser toutes les fonctionnalités de VISUAL.',
      actionRequired: false
    };
  }

  const vpStats = {
    visuPoints: status.visuPoints || 0,
    capPercentage: calculateCapPercentage(status.visuPoints || 0),
    isNearCap: isNearCap(status.visuPoints || 0),
    isCapReached: (status.visuPoints || 0) >= MINOR_CONSTANTS.DEFAULT_CAP_VP,
  };

  if (status.status === 'locked') {
    return {
      level: 'warning',
      title: 'Verrou post-majorité actif',
      description: 'Tu dois attendre 6 mois après tes 18 ans pour récupérer tes VISUpoints.',
      actionRequired: false
    };
  }

  if (status.status === 'unlocked') {
    return {
      level: 'success',
      title: 'Conversion possible !',
      description: 'Tu peux maintenant récupérer tes VISUpoints en euros.',
      actionRequired: true
    };
  }

  if (vpStats.isCapReached) {
    return {
      level: 'warning',
      title: 'Plafond atteint',
      description: 'Gains en pause jusqu\'à tes 18 ans. Tu as gagné le maximum autorisé (200€).',
      actionRequired: false
    };
  }

  if (vpStats.isNearCap) {
    return {
      level: 'warning',
      title: 'Limite proche',
      description: `Tu approches du plafond de 200€ (${vpStats.capPercentage.toFixed(1)}% atteint).`,
      actionRequired: false
    };
  }

  return {
    level: 'success',
    title: 'Profil actif',
    description: `Tu peux continuer à gagner des VISUpoints (${vpToEuros(status.visuPoints).toFixed(2)}€ gagnés).`,
    actionRequired: false
  };
}
