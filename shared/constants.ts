// Centralized constants for VISUAL platform
// Updated with video deposit modules - 2024

// ===== BRANDING & SLOGAN =====

// Slogan officiel VISUAL (trilingue)
export const VISUAL_SLOGAN = {
  fr: 'Regarde-Investis-Gagne',
  en: 'Watch-Invest-Win',
  es: 'Mira-Invierte-Gana'
} as const;

// Baseline explicatif
export const VISUAL_BASELINE = {
  fr: 'Investissez dans des projets visuels dès 2€ et participez aux gains',
  en: 'Invest in visual projects from €2 and share the profits',
  es: 'Invierte en proyectos visuales desde 2€ y comparte las ganancias'
} as const;

// Logo et branding
export const VISUAL_BRANDING = {
  logoPath: '/logo.svg',
  logoAlt: 'VISUAL Platform',
  colors: {
    primary: '#00D1FF',
    secondary: '#7B2CFF',
    accent: '#FF3CAC'
  }
} as const;

// Stripe API configuration
export const STRIPE_CONFIG = {
  // Version par défaut stable - utilise la version stable pour éviter les problèmes de compatibilité
  API_VERSION: "2024-06-20"
} as const;

// Project categories and their properties
export const PROJECT_CATEGORIES = {
  documentaire: {
    score: 0.8,
    colorClass: 'bg-secondary/10 text-secondary',
    label: 'Documentaire'
  },
  'court-métrage': {
    score: 0.7,
    colorClass: 'bg-chart-4/10 text-purple-600',
    label: 'Court-métrage'
  },
  clip: {
    score: 0.6,
    colorClass: 'bg-accent/10 text-accent',
    label: 'Clip'
  },
  animation: {
    score: 0.75,
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    label: 'Animation'
  },
  live: {
    score: 0.5,
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    label: 'Live'
  }
} as const;

// User profile types and their minimum caution amounts
export const PROFILE_CAUTION_MINIMUMS = {
  creator: 10,      // Porteurs
  admin: 10,        // Infoporteurs  
  investor: 20,     // Investisseurs
  invested_reader: 20  // Investi-lecteurs
} as const;

// User profile types and their minimum withdrawal amounts (Module 6)
export const PROFILE_WITHDRAWAL_MINIMUMS = {
  creator: 50,      // Porteurs: €50 minimum 
  admin: 50,        // Infoporteurs: €50 minimum
  investor: 25,     // Investisseurs: €25 minimum
  invested_reader: 25  // Investi-lecteurs: €25 minimum
} as const;

// Investment status mappings
export const INVESTMENT_STATUS = {
  active: {
    colorClass: 'bg-accent/10 text-accent',
    label: 'En production'
  },
  completed: {
    colorClass: 'bg-secondary/10 text-secondary',
    label: 'Publié'
  },
  pending: {
    colorClass: 'bg-muted text-muted-foreground',
    label: 'Finalisation'
  }
} as const;

// ===== PETITES ANNONCES - CONSTANTES =====

// Taux de commission pour le système d'escrow (5%)
export const ESCROW_FEE_RATE = 0.05;

// Montant minimum pour les frais d'escrow (1€)
export const ESCROW_MINIMUM_FEE = 1;

// Durée de validité des annonces (30 jours par défaut)
export const ANNONCE_DEFAULT_DURATION_DAYS = 30;

// Limites de contenu pour les annonces
export const ANNONCE_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  PRICE_MIN: 0,
  PRICE_MAX: 999999,
  IMAGES_MAX_COUNT: 5
} as const;

// Catégories autorisées (strictement audiovisuel/spectacle)
export const ANNONCE_CATEGORIES = {
  emploi: {
    label: 'Emploi',
    description: 'Offres et demandes d\'emploi dans l\'audiovisuel',
    colorClass: 'bg-blue-100 text-blue-800'
  },
  service: {
    label: 'Service',
    description: 'Services professionnels audiovisuels',
    colorClass: 'bg-green-100 text-green-800'
  },
  lieu: {
    label: 'Lieu',
    description: 'Locations de lieux de tournage',
    colorClass: 'bg-purple-100 text-purple-800'
  },
  matériel: {
    label: 'Matériel',
    description: 'Vente et location de matériel audiovisuel',
    colorClass: 'bg-orange-100 text-orange-800'
  }
} as const;

// Statuts des sanctions (graduées)
export const SANCTION_TYPES = {
  warning: {
    label: 'Avertissement',
    duration: 0, // Pas d'expiration
    severity: 1
  },
  suspension_24h: {
    label: 'Suspension 24h',
    duration: 24 * 60 * 60 * 1000, // 24h en ms
    severity: 2
  },
  suspension_7d: {
    label: 'Suspension 7 jours',
    duration: 7 * 24 * 60 * 60 * 1000, // 7 jours en ms
    severity: 3
  },
  suspension_30d: {
    label: 'Suspension 30 jours',
    duration: 30 * 24 * 60 * 60 * 1000, // 30 jours en ms
    severity: 4
  },
  permanent_ban: {
    label: 'Bannissement permanent',
    duration: null, // Permanent
    severity: 5
  }
} as const;

// ===== PHOTOS PETITES ANNONCES - CONSTANTES =====

// Configuration des photos par annonce (spec 24/09/2025)
export const AD_PHOTOS_CONFIG = {
  // Limites par annonce
  MAX_PHOTOS_PER_AD: 10,
  MIN_PHOTOS_PER_AD: 1,
  
  // Taille des fichiers
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB par photo
  RECOMMENDED_MAX_SIZE_BYTES: 4 * 1024 * 1024, // 4 MB recommandé
  
  // Dimensions
  RECOMMENDED_MAX_LONG_EDGE: 2560,
  RECOMMENDED_MIN_LONG_EDGE: 1024,
  MIN_WIDTH: 320,
  MIN_HEIGHT: 240,
  
  // Processing settings
  WEBP_QUALITY: 80,
  THUMBNAIL_SIZES: {
    SMALL: 320,    // Liste
    MEDIUM: 640,   // Mobile/Retina
    LARGE: 1280    // Desktop
  },
  
  // Cache et CDN
  CACHE_TTL_DAYS: 7,
  LAZY_LOADING: true,
  BLUR_UP: true,
} as const;

// Formats de fichiers acceptés
export const ACCEPTED_PHOTO_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
} as const;

// Messages d'erreur pour les photos
export const PHOTO_ERROR_MESSAGES = {
  MAX_COUNT_EXCEEDED: "Maximum 10 photos par annonce autorisées",
  INVALID_FORMAT: "Format non autorisé. Utilisez JPEG, PNG ou WebP uniquement",
  FILE_TOO_LARGE: "Fichier trop volumineux. Maximum 10 Mo par photo",
  DIMENSIONS_TOO_SMALL: "Image trop petite. Minimum 320x240 pixels",
  COVER_REQUIRED: "Une photo de couverture est obligatoire",
  UPLOAD_FAILED: "Échec du téléchargement. Réessayez",
  PROCESSING_FAILED: "Erreur lors du traitement de l'image",
  MODERATION_FAILED: "Photo refusée par la modération"
} as const;

// Paramètres de modération IA pour les photos
export const PHOTO_MODERATION_CONFIG = {
  // Seuils de confiance IA (0-1)
  NSFW_THRESHOLD: 0.7,
  FRAUD_THRESHOLD: 0.8,
  LOGO_THRESHOLD: 0.6,
  
  // Actions automatiques
  AUTO_REJECT_NSFW: true,
  AUTO_REJECT_FRAUD: true,
  REQUIRE_HUMAN_REVIEW_THRESHOLD: 0.5,
  
  // Règles de contenu
  MAX_WATERMARK_COVERAGE_PERCENT: 8, // 8% max de la surface
  FORBIDDEN_ELEMENTS: [
    'qr_codes',
    'external_payment_links',
    'competing_platforms',
    'explicit_content',
    'misleading_brands'
  ]
} as const;

// ===== CATÉGORIE LIVRES - CONSTANTES =====

// Prix autorisés pour les auteurs LIVRES (spécification v.16/09/2025)
export const ALLOWED_BOOK_AUTHOR_PRICES = [2, 3, 4, 5, 8] as const;
export type AllowedBookAuthorPrice = typeof ALLOWED_BOOK_AUTHOR_PRICES[number];

// Tranches d'engagement pour investi-lecteurs LIVRES
export const ALLOWED_BOOK_READER_AMOUNTS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const;
export type AllowedBookReaderAmount = typeof ALLOWED_BOOK_READER_AMOUNTS[number];

// Mapping votes selon barème VISUAL standard pour LIVRES
export const BOOK_VOTES_MAPPING: Record<AllowedBookReaderAmount, number> = {
  2: 1,   // 2€ = 1 vote
  3: 2,   // 3€ = 2 votes
  4: 3,   // 4€ = 3 votes
  5: 4,   // 5€ = 4 votes
  6: 5,   // 6€ = 5 votes
  8: 6,   // 8€ = 6 votes
  10: 7,  // 10€ = 7 votes
  12: 8,  // 12€ = 8 votes
  15: 9,  // 15€ = 9 votes
  20: 10  // 20€ = 10 votes
} as const;

// Configuration LIVRES par défaut (Mensualisation v.24/09/2025)
export const LIVRES_CONFIG = {
  // Cycle mensuel calendaire (remplace CYCLE_DURATION_DAYS: 30)
  CYCLE_TYPE: 'monthly_calendar',    // Cycle mensuel calendaire
  TIMEZONE: 'Europe/Paris',          // Fuseau horaire de référence
  
  // Configuration RRULE pour planification
  OPENING_RRULE: 'FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=0;BYMINUTE=0;BYSECOND=0',          // 1er du mois à 00:00:00
  CLOSING_RRULE: 'FREQ=MONTHLY;BYMONTHDAY=-1;BYHOUR=23;BYMINUTE=59;BYSECOND=59',      // Dernier jour à 23:59:59
  
  // Paramètres de capacité et gagnants
  TARGET_AUTHORS: 100,               // 100 auteurs pour démarrer
  MAX_AUTHORS: 100,                  // Extensible à 200 (TOP 20)
  TOP_N_WINNERS: 10,                 // TOP 10 gagnants par défaut
  
  // Partage des ventes unitaires (inchangé)
  AUTHOR_REVENUE_SHARE: 0.70,        // 70% pour l'auteur
  PLATFORM_REVENUE_SHARE: 0.30,     // 30% pour VISUAL
  
  // Formules de redistribution du pot mensuel (nouvelles formules 60/40)
  POT_AUTHORS_SHARE: 0.60,           // 60% du pot pour auteurs TOP10 (était 0.60)
  POT_READERS_SHARE: 0.40,           // 40% du pot pour lecteurs gagnants (était 0.40)
  POT_DISTRIBUTION_MODE: 'equipartition',  // Mode par défaut : équipartition
  POT_EMPTY_READERS_POLICY: 'to_visual',   // Si aucun lecteur gagnant : 'to_authors' ou 'to_visual'
  
  // Arrondi euro-floor et résidus VISUAL
  EURO_FLOOR_ROUNDING: true,         // Arrondi à l'euro inférieur pour utilisateurs
  RESIDUALS_TO_VISUAL: true,         // Résidus (centimes + écarts) → VISUAL
  
  // Tokens et repêchage
  DOWNLOAD_TOKEN_TTL_HOURS: 72,      // Token expiration 72h
  REPECHAGE_PRICE_EUR: 25,          // Repêchage 25€ pour rang 11-100
  REPECHAGE_WINDOW_HOURS: 24        // Fenêtre repêchage 24h après clôture
} as const;

// Validation functions for LIVRES
export function isValidBookAuthorPrice(price: number): price is AllowedBookAuthorPrice {
  return ALLOWED_BOOK_AUTHOR_PRICES.includes(price as AllowedBookAuthorPrice);
}

export function isValidBookReaderAmount(amount: number): amount is AllowedBookReaderAmount {
  return ALLOWED_BOOK_READER_AMOUNTS.includes(amount as AllowedBookReaderAmount);
}

export function getVotesForAmount(amount: number): number {
  if (isValidBookReaderAmount(amount)) {
    return BOOK_VOTES_MAPPING[amount];
  }
  return 0; // Invalid amount
}

export function calculateTipAmount(amountPaid: number, unitPrice: number): number {
  return Math.max(0, amountPaid - unitPrice);
}

// Default values
export const DEFAULT_CATEGORY_SCORE = 0.5;
export const DEFAULT_COLOR_CLASS = 'bg-muted text-muted-foreground';
export const DEFAULT_CAUTION_MINIMUM = 20;

// VISUAL 16/09/2025 - Nouvelles règles de prix strictes
// Prix autorisés pour les porteurs (projets visuels)
export const ALLOWED_PROJECT_PRICES = [2, 3, 4, 5, 10] as const;
export const MAX_PROJECT_PRICE = 10;
export const MIN_PROJECT_PRICE = 2;

// Tranches d'investissement autorisées pour les investisseurs
export const ALLOWED_INVESTMENT_AMOUNTS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const;
export const MAX_INVESTMENT_AMOUNT = 20;
export const MIN_INVESTMENT_AMOUNT = 2;

// Fonction utilitaire pour vérifier si un prix de projet est valide
export function isValidProjectPrice(price: number): boolean {
  return ALLOWED_PROJECT_PRICES.includes(price as any);
}

// Fonction utilitaire pour vérifier si un montant d'investissement est valide
export function isValidInvestmentAmount(amount: number): boolean {
  return ALLOWED_INVESTMENT_AMOUNTS.includes(amount as any);
}

// VISUAL video deposit pricing (based on user requirements)
export const VIDEO_DEPOSIT_PRICING = {
  clip: {
    price: 2, // €2 for clips ≤ 10 min
    maxDuration: 600, // 10 minutes in seconds
    maxSizeGB: 1, // 1 GB max
    label: 'Clips / Teasers',
    description: '≤ 10 min → 2 €'
  },
  documentary: {
    price: 5, // €5 for docs ≤ 30 min
    maxDuration: 1800, // 30 minutes in seconds
    maxSizeGB: 2, // 2 GB max
    label: 'Courts-métrages / Documentaires',
    description: '≤ 30 min → 5 €'
  },
  film: {
    price: 10, // €10 for films ≤ 4h
    maxDuration: 14400, // 4 hours in seconds
    maxSizeGB: 5, // 5 GB max
    label: 'Films complets',
    description: '≤ 4 h → 10 €'
  }
} as const;

// Creator quotas per period (monthly/quarterly limits)
export const CREATOR_QUOTAS = {
  clip: {
    maxPerMonth: 2,
    resetPeriod: 'monthly'
  },
  documentary: {
    maxPerMonth: 1,
    resetPeriod: 'monthly'
  },
  film: {
    maxPerQuarter: 1,
    resetPeriod: 'quarterly'
  }
} as const;

// Video security settings
export const VIDEO_SECURITY = {
  tokenExpiryMinutes: 15, // Tokens expire after 15 minutes
  maxTokenUsage: 3, // Max 3 uses per token
  hlsSegmentDuration: 10, // HLS segment duration in seconds
  allowedReferers: [], // Empty = allow all (VISUAL manages this)
  maxSimultaneousSessions: 2, // Max concurrent sessions per user
  watermarkEnabled: true // Dynamic watermarks enabled
} as const;

// Bunny.net CDN configuration (single VISUAL account)
// Note: libraryId and apiKey are configured server-side only for security
export const BUNNY_CONFIG = {
  storageZone: 'visual-videos', // Single storage zone for all videos
  pullZone: 'visual-cdn', // Single pull zone for delivery
  baseUrl: 'https://visual-videos.b-cdn.net', // VISUAL's CDN URL
  streamApiUrl: 'https://video.bunnycdn.com/library', // Stream API base
  allowedFormats: ['mp4', 'webm', 'mov'], // Allowed video formats
  maxConcurrentUploads: 3 // Limit concurrent uploads
} as const;

// ===== NOUVELLES CONSTANTES POUR FONCTIONNALITÉS AVANCÉES =====

// Système de parrainage
export const REFERRAL_SYSTEM = {
  maxReferralsPerMonth: 20, // Limite de 20 filleuls/mois
  sponsorBonusVP: 100, // 100 VISUpoints (1€) pour le parrain
  refereeBonusVP: 50, // 50 VISUpoints (0.50€) pour le filleul
  linkExpiryDays: 30, // Liens valides 30 jours
  codeLength: 8, // Longueur du code de parrainage
} as const;

// Gamification - Streaks de connexion
export const STREAK_REWARDS = {
  daily: 5, // 5 VP par jour consécutif
  weekly: 50, // Bonus 50 VP pour 7 jours consécutifs
  monthly: 200, // Bonus 200 VP pour 30 jours consécutifs
  maxStreakReward: 500, // Récompense maximale pour un streak
} as const;

// Video lifecycle configuration (cycle de vie des vidéos)
export const VIDEO_LIFECYCLE = {
  STANDARD_DURATION_HOURS: 168, // 7 jours (168 heures)
  EXTENSION_PRICE_EUR: 25, // Prix prolongation (harmonisation VISUAL)
  TOP10_AUTO_RENEW: true, // Reconduction automatique si TOP 10
  ARCHIVE_IF_NOT_TOP10: true, // Archivage automatique si hors TOP 10
  MAX_EXTENSIONS: 4, // Maximum 4 prolongations (1 mois total = 168h x 5)
  GRACE_PERIOD_HOURS: 24, // 24h de grâce avant archivage définitif
  NOTIFICATION_BEFORE_EXPIRY_HOURS: 48, // Notifier 48h avant expiration
  AUTO_ARCHIVE_DELAY_HOURS: 24, // Délai avant archivage automatique
} as const;

// Scratch Ticket - Mini-ticket "Scratch" pour utilisateurs réguliers
export const SCRATCH_TICKET_CONFIG = {
  TRIGGER_VP_THRESHOLD: 100, // Déclenché tous les 100 VISUpoints cumulés
  EXPIRY_DAYS: 30, // 30 jours pour gratter le ticket
  REWARDS: {
    FIVE_VP: { value: 5, weight: 40 },      // 40% de chances
    TEN_VP: { value: 10, weight: 30 },      // 30% de chances
    TWENTY_VP: { value: 20, weight: 20 },   // 20% de chances
    FIFTY_VP: { value: 50, weight: 5 },     // 5% de chances
    NOTHING: { value: 0, weight: 5 },       // 5% de chances (rien gagné)
  },
  MAX_PENDING_TICKETS: 5, // Maximum 5 tickets non grattés
  AI_VALIDATION_ENABLED: true, // IA VISUAL valide chaque scratch
  ANTI_CHEAT_COOLDOWN_HOURS: 1, // Minimum 1h entre 2 scratches
} as const;

// Quêtes quotidiennes - "Surprise du jour"
export const DAILY_QUESTS = {
  defaultReward: 20, // VISUpoints par défaut pour une quête complétée
  questTypes: {
    explore_projects: {
      title: "Explorateur curieux",
      description: "Découvre 3 projets différents",
      target: 3,
      reward: 20
    },
    make_investment: {
      title: "Investisseur du jour", 
      description: "Fais un investissement dans un projet",
      target: 1,
      reward: 30
    },
    social_activity: {
      title: "Sociable connecté",
      description: "Interagis avec la communauté (like, commentaire ou post)",
      target: 2,
      reward: 15
    },
    video_watch: {
      title: "Spectateur assidu",
      description: "Regarde une vidéo complète d'un projet",
      target: 1,
      reward: 10
    },
    live_participation: {
      title: "Fan de live",
      description: "Participe à un live show en cours",
      target: 1,
      reward: 25
    }
  },
  maxQuestsPerDay: 1, // Une seule quête active par jour
  questResetHour: 0, // Réinitialisation à minuit UTC
} as const;

// Visiteur du mois
export const VISITOR_OF_MONTH = {
  rewardVP: 2500, // 25€ en VISUpoints pour le gagnant
  minActivitiesForRanking: 10, // Minimum d'activités pour être classé
  activityPoints: {
    page_view: 1,
    project_view: 2,
    investment: 10,
    social_interaction: 3,
    login: 2,
  },
} as const;

// Prix articles pour Infoporteurs {0, 0.2-5€}
export const ALLOWED_ARTICLE_PRICES = [0, 0.2, 0.5, 1, 2, 3, 4, 5] as const;
export const MAX_ARTICLE_PRICE = 5;
export const MIN_ARTICLE_PRICE = 0;

// Fonction utilitaire pour vérifier si un prix d'article est valide
export function isValidArticlePrice(price: number): boolean {
  return ALLOWED_ARTICLE_PRICES.includes(price as any);
}

// Packs VISUpoints pour Investi-lecteurs
export const VISU_POINTS_PACKS = [
  { name: 'Starter', points: 500, price: 5, bonus: 0 },
  { name: 'Standard', points: 1200, price: 10, bonus: 100 },
  { name: 'Premium', points: 2500, price: 20, bonus: 250 },
  { name: 'Ultimate', points: 5500, price: 40, bonus: 600 },
] as const;

// VISUpoints système
export const VISU_POINTS = {
  conversionRate: 100, // 100 VP = 1 EUR
  conversionThreshold: 2500, // Minimum 2500 VP pour conversion
  bonusActions: {
    stripe_connected: 50,
    bunny_activated: 25,
    first_investment: 100,
    profile_completed: 30,
    referral_success: 100,
    article_published: 20,
    daily_login: 5,
  },
} as const;

// Filtres émotionnels
export const EMOTIONAL_FILTERS = {
  joie: { color: '#fbbf24', icon: '😊' },
  tristesse: { color: '#3b82f6', icon: '😢' },
  colère: { color: '#ef4444', icon: '😠' },
  peur: { color: '#6b7280', icon: '😰' },
  surprise: { color: '#8b5cf6', icon: '😲' },
  dégoût: { color: '#10b981', icon: '🤢' },
  confiance: { color: '#06b6d4', icon: '😌' },
  anticipation: { color: '#f59e0b', icon: '🤗' },
} as const;

// ===== PRÉLÈVEMENT VISUAL 30% SUR VENTES ARTICLES =====
// Additif v.16/09/2025 - Prélèvement automatique sur chaque vente d'article
export const VISUAL_PLATFORM_FEE = {
  PLATFORM_FEE_INFOARTICLE: 0.30, // 30% pour VISUAL
  NET_TO_INFOPORTEUR: 0.70, // 70% pour l'infoporteur
  VISUPOINTS_TO_EUR: 100, // 100 pts = 1 € (référence VISU_POINTS.conversionRate)
  VISUPOINTS_CONVERSION_THRESHOLD: 2500, // Seuil conversion (référence VISU_POINTS.conversionThreshold)
  TRANSFER_DELAY_HOURS: 24, // Délai avant transfert Stripe (24h)
} as const;

// ===== TOP10 SYSTEM - Classements et Redistributions =====
// Système de classement quotidien des infoporteurs et investi-lecteurs
export const TOP10_SYSTEM = {
  RANKING_SIZE: 10, // TOP 10 articles/jour
  TOTAL_ARTICLES_POOL: 100, // Pool total de 100 articles
  REDISTRIBUTION_RANKS_START: 11, // Redistribution commence au rang 11
  REDISTRIBUTION_RANKS_END: 100, // Redistribution termine au rang 100
  SPLIT_TOP10_PERCENT: 0.60, // 60% du pot pour TOP10 infoporteurs
  SPLIT_WINNERS_PERCENT: 0.40, // 40% du pot pour investi-lecteurs vainqueurs
  PROCESSING_DELAY_HOURS: 24, // Délai avant transfert Stripe (24h)
  MIN_DAILY_SALES_FOR_RANKING: 1, // Minimum 1 vente pour être classé
} as const;

// ===== RÈGLES DE DISTRIBUTION DES ÉVÉNEMENTS D'INVESTISSEMENT =====
// Mise à jour v.16/09/2025 - Règles de redistribution 40/30/7/23 (CORRECTIF)

// Distribution des événements d'investissement de catégorie (TOP 100)
export const INVESTMENT_CATEGORY_DISTRIBUTION = {
  INVESTORS_TOP10_PERCENT: 0.40,     // 40% Investisseurs TOP 10 ✅ CORRIGÉ
  CREATORS_TOP10_PERCENT: 0.30,      // 30% Porteurs TOP 10 ✅ CORRIGÉ  
  VISUAL_PLATFORM_PERCENT: 0.23,     // 23% VISUAL (commission + reliquats arrondis)
  INVESTORS_11_100_PERCENT: 0.07,    // 7% Investisseurs rangs 11-100 (équipartition)
} as const;

// Tableaux détaillés de répartition TOP10 (pourcentages absolus de S)
export const TOP10_DETAILED_DISTRIBUTION = {
  // Investisseurs TOP10 - parts absolues (≈ 40% total)
  INVESTORS_PERCENTAGES: [13.66, 6.83, 4.55, 3.41, 2.73, 2.28, 1.95, 1.71, 1.52, 1.37],
  // Porteurs TOP10 - parts absolues (≈ 30% total)  
  CREATORS_PERCENTAGES: [10.24, 5.12, 3.41, 2.56, 2.05, 1.71, 1.46, 1.28, 1.14, 1.02],
} as const;

// Distribution des Live Shows / Battles
export const LIVE_SHOWS_DISTRIBUTION = {
  WINNING_ARTIST_PERCENT: 0.40,      // 40% Artiste gagnant
  WINNING_INVESTORS_PERCENT: 0.30,   // 30% Investisseurs gagnants (TOP 10 côté gagnant)
  LOSING_ARTIST_PERCENT: 0.20,       // 20% Artiste perdant
  LOSING_INVESTORS_PERCENT: 0.10,    // 10% Investisseurs perdants
} as const;

// Distribution des Articles journalistiques - OBSOLÈTE
// ⚠️ DÉPRÉCIÉ - Utiliser VISUAL_PLATFORM_FEE (30% VISUAL / 70% Infoporteur) + système TOP10
// export const ARTICLES_DISTRIBUTION = {
//   INFOPORTEUR_PERCENT: 0.60,         // 60% Infoporteur (tout auteur confondu)
//   INVESTILECTEURS_PERCENT: 0.30,     // 30% Investi-lecteurs gagnants TOP 10
//   VISUAL_COMMISSION_PERCENT: 0.10,   // 10% VISUAL (commission)
// } as const;

// ===== FIDÉLITÉ AMÉLIORÉE - Streaks Quotidiens et Hebdomadaires =====
// Nouveau système de fidélité avec cycles quotidiens et hebdomadaires
export const ENHANCED_FIDELITY = {
  // Barème quotidien - cycle de 7 jours
  DAILY_STREAK_REWARDS: [
    { day: 1, points: 1 }, // 1er jour consécutif = 1 VP
    { day: 2, points: 2 }, // 2ème jour consécutif = 2 VP
    { day: 3, points: 3 }, // 3ème jour consécutif = 3 VP
    { day: 4, points: 4 }, // 4ème jour consécutif = 4 VP
    { day: 5, points: 6 }, // 5ème jour consécutif = 6 VP
    { day: 6, points: 8 }, // 6ème jour consécutif = 8 VP
    { day: 7, points: 10 } // 7ème jour consécutif = 10 VP (puis reset)
  ],
  DAILY_CYCLE_LENGTH: 7, // Cycle de 7 jours
  
  // Barème hebdomadaire - cycle de 4 semaines
  WEEKLY_STREAK_REWARDS: [
    { week: 1, points: 5 },  // 1ère semaine consécutive = 5 VP
    { week: 2, points: 10 }, // 2ème semaine consécutive = 10 VP
    { week: 3, points: 15 }, // 3ème semaine consécutive = 15 VP
    { week: 4, points: 20 }  // 4ème semaine consécutive = 20 VP (puis reset)
  ],
  WEEKLY_CYCLE_LENGTH: 4, // Cycle de 4 semaines
  
  // Combinaison possible des deux systèmes
  SYSTEMS_ARE_CUMULATIVE: true,
  
  // Gestion des streaks
  STREAK_RESET_HOURS: 30, // Reset si pas de connexion pendant 30h
} as const;

// ===== MINI RÉSEAU SOCIAL AUTOMATIQUE - LIVE SHOWS =====
// Système de mini réseau social qui s'affiche automatiquement pendant les Live Shows
export const MINI_SOCIAL_CONFIG = {
  // Paramètres par défaut selon spécifications utilisateur
  autoshow: true, // Affichage automatique par défaut (ON)
  position: 'sidebar' as const, // Position par défaut : sidebar desktop / drawer mobile
  defaultState: 'expanded' as const, // État d'ouverture par défaut
  highlightsFallback: 'highlights' as const, // Mode dégradé pour trafic élevé
  slowMode: true, // Anti-spam activé par défaut
  
  // Seuils et limites de fonctionnement
  highTrafficThreshold: 1000, // Seuil de spectateurs pour mode highlights
  maxMessagesPerMinute: 5, // Limite anti-spam en slow mode
  messageMaxLength: 200, // Longueur maximum des messages
  moderationDelay: 500, // Délai filtrage IA en ms
  
  // Configuration modération automatique
  moderation: {
    aiFilterEnabled: true, // Filtrage IA activé
    requireAccountAge: 7, // Compte minimum 7 jours pour poster
    require2FA: false, // 2FA requis pour médias/liens (sera true en production)
    slowModeInterval: 10, // Intervalle slow mode en secondes
    maxLinksPerMessage: 1, // Maximum 1 lien par message
    maxEmojiPerMessage: 5, // Maximum 5 emojis par message
  },
  
  // États de session persistants
  sessionPersistence: {
    rememberCollapsedState: true, // Se souvenir si l'utilisateur ferme
    resetOnNewShow: false, // Ne pas rouvrir automatiquement sur nouveau show
    cookieExpiry: 24 * 60 * 60 * 1000, // Cookie 24h pour état fermé
  },
  
  // Messages par défaut
  defaultMessages: {
    welcome: "Bienvenue sur le live ! 🎬",
    slowModeActive: "Mode lent activé - 1 message toutes les 10s",
    highTrafficMode: "Trafic élevé - Mode lecture seule activé",
    moderationPending: "Message en cours de modération...",
    requireAge: "Compte trop récent pour poster",
    require2FA: "Vérification 2FA requise pour ce type de contenu",
  },
  
  // Paramètres techniques
  technical: {
    refreshInterval: 2000, // Actualisation messages en ms
    connectionTimeout: 30000, // Timeout WebSocket en ms
    maxRetries: 3, // Tentatives de reconnexion
    bufferSize: 100, // Messages en mémoire
    highlightsUpdateInterval: 30000, // Mise à jour highlights en mode dégradé
  }
} as const;

// Paramètres runtime spécifiques par plateforme
export const MINI_SOCIAL_RUNTIME_PARAMS = {
  'live_show.social.autoshow': {
    key: 'live_show.social.autoshow',
    value: 'true',
    type: 'boolean',
    description: 'Affichage automatique du mini réseau social pendant les Live Shows',
    modifiableByAdmin: true
  },
  'live_show.social.position': {
    key: 'live_show.social.position',
    value: 'sidebar',
    type: 'string',
    description: 'Position du panel: sidebar (desktop) ou drawer (mobile)',
    modifiableByAdmin: true
  },
  'live_show.social.default_state': {
    key: 'live_show.social.default_state', 
    value: 'expanded',
    type: 'string',
    description: 'État par défaut: expanded ou collapsed',
    modifiableByAdmin: true
  },
  'live_show.social.highload_fallback': {
    key: 'live_show.social.highload_fallback',
    value: 'highlights',
    type: 'string', 
    description: 'Mode dégradé pour trafic élevé: highlights ou disabled',
    modifiableByAdmin: true
  },
  'live_show.social.slow_mode': {
    key: 'live_show.social.slow_mode',
    value: 'true',
    type: 'boolean',
    description: 'Mode lent anti-spam activé',
    modifiableByAdmin: true
  },
  'live_show.social.high_traffic_threshold': {
    key: 'live_show.social.high_traffic_threshold',
    value: '1000',
    type: 'number',
    description: 'Seuil de spectateurs pour basculer en mode highlights',
    modifiableByAdmin: true
  },
  'live_show.social.ai_moderation': {
    key: 'live_show.social.ai_moderation',
    value: 'true',
    type: 'boolean',
    description: 'Filtrage IA automatique des messages',
    modifiableByAdmin: true
  },
  'live_show.social.dnd_hours': {
    key: 'live_show.social.dnd_hours',
    value: '[]',
    type: 'json',
    description: 'Heures DND (Do Not Disturb) au format JSON [0,1,2...23]',
    modifiableByAdmin: true
  }
} as const;

// ===== PETITES ANNONCES - CONSTANTES =====

// Configuration générale des petites annonces selon additif v.24/09/2025
export const PETITES_ANNONCES_CONFIG = {
  // Périmètre thématique obligatoire (audiovisuel/spectacle uniquement)
  PERIMETER_THEME: 'audiovisuel_spectacle',
  ENFORCE_THEME_VALIDATION: true,
  
  // Catégories autorisées et leurs sous-catégories
  ALLOWED_CATEGORIES: {
    talents_jobs: {
      label: 'Talents & Jobs',
      subcategories: [
        'casting', 'comediens', 'figurants', 'realisateurs', 'cadreurs', 'monteurs',
        'etalonneurs', 'preneurs_son', 'mixeurs', 'scriptes', 'regisseurs',
        'machinerie', 'electriciens', 'decoration', 'costumes', 'maquillage',
        'vfx', 'motion', 'assistants_prod', 'community_manager', 'attache_presse'
      ]
    },
    services: {
      label: 'Services',
      subcategories: [
        'compositeur_musique', 'voix_off', 'sound_design', 'etalonnage',
        'montage', 'coaching_comedien', 'direction_acteurs', 'photo_plateau',
        'making_of', 'sous_titrage', 'traduction_diffusion'
      ]
    },
    lieux_tournage: {
      label: 'Lieux de tournage',
      subcategories: [
        'maisons', 'appartements', 'ateliers', 'bureaux', 'entrepots',
        'exterieurs_prives', 'studios', 'plateaux', 'salles_theatre'
      ]
    },
    materiel: {
      label: 'Matériel & Accessoires',
      subcategories: [
        'cameras', 'optiques', 'lumieres', 'son', 'machinerie_travelling',
        'grip', 'decoration', 'vehicules_epoque', 'vehicules_tournage',
        'accessoires_scene', 'costumes_location'
      ]
    }
  },
  
  // Configuration escrow (paiements protégés)
  ESCROW_ENABLED: true,
  ESCROW_SERVICE_FEE_RATE: 0.05,        // 5% de frais service
  ESCROW_MINIMUM_FEE_EUR: 1.00,         // 1€ minimum
  ESCROW_DEFAULT_DELIVERY_DAYS: 7,      // 7 jours par défaut
  ESCROW_DISPUTE_TIMEOUT_DAYS: 14,      // 14 jours pour régler un litige
  
  // Modération et sécurité
  MODERATION_MODE: 'ai_human_hybrid',   // IA + humaine
  AUTO_APPROVAL_THRESHOLD: 85,          // Score IA > 85% = auto-approuvé
  MANUAL_REVIEW_THRESHOLD: 60,          // Score 60-85% = révision manuelle
  AUTO_REJECT_THRESHOLD: 60,            // Score < 60% = rejet automatique
  
  // KYC/2FA requis
  REQUIRE_KYC_FOR_ESCROW: true,
  REQUIRE_KYC_FOR_PROFESSIONAL: true,
  REQUIRE_2FA_FOR_ESCROW: true,
  
  // Gestion des expiration et limites
  DEFAULT_EXPIRY_DAYS: 30,              // 30 jours par défaut
  MAX_ACTIVE_ANNONCES_PER_USER: 10,     // 10 annonces actives max par utilisateur
  MAX_IMAGES_PER_ANNONCE: 5,            // 5 images max par annonce
  VIDEO_UPLOAD_COST_TO_USER: true,      // Coût vidéo Bunny à l'annonceur
  
  // Messages de refus types
  REJECTION_MESSAGES: {
    OUT_OF_SCOPE: "Votre annonce a été refusée car elle ne correspond pas au périmètre « spectacle/audiovisuel » de VISUAL (exemples acceptés : locations de lieux pour tournage, véhicules d'époque, castings, services techniques, matériel image/son). Vous pouvez la reformuler et la republier en respectant l'Additif 'Petites Annonces'.",
    INAPPROPRIATE_CONTENT: "Contenu inapproprié détecté. Veuillez respecter les conditions d'utilisation.",
    SUSPECTED_FRAUD: "Annonce signalée pour suspicion de fraude. Contactez le support pour plus d'informations.",
    DUPLICATE_DETECTED: "Annonce identique ou similaire déjà publiée. Évitez les doublons.",
    MISSING_AUTHORIZATION: "Justificatif d'autorisation manquant pour ce type d'annonce (lieu, matériel soumis à autorisation)."
  }
} as const;

// Sanctions graduées selon l'additif
export const PETITES_ANNONCES_SANCTIONS = {
  WARNING: {
    type: 'warning',
    label: 'Avertissement',
    duration: null,
    description: 'Première infraction mineure'
  },
  TEMPORARY_BAN_24H: {
    type: 'temporary_ban',
    label: 'Suspension 24h',
    duration: 24,
    description: 'Récidive ou infraction modérée'
  },
  TEMPORARY_BAN_7D: {
    type: 'temporary_ban', 
    label: 'Suspension 7 jours',
    duration: 168, // 7 * 24
    description: 'Infractions répétées'
  },
  PERMANENT_BAN: {
    type: 'permanent_ban',
    label: 'Bannissement définitif',
    duration: null,
    description: 'Fraude grave ou abus répétés'
  }
} as const;

// Drapeaux IA pour détection automatique
export const PETITES_ANNONCES_AI_FLAGS = {
  // Périmètre thématique
  OUT_OF_AUDIOVISUAL_SCOPE: 'hors_theme_audiovisuel',
  REAL_ESTATE_DETECTED: 'immobilier_detecte',
  GENERAL_GOODS_DETECTED: 'biens_generaux_detectes',
  
  // Contenu suspect
  INAPPROPRIATE_CONTENT: 'contenu_inapproprie',
  EXTERNAL_PAYMENT_LINKS: 'liens_paiement_externes',
  CONTACT_INFO_IN_DESCRIPTION: 'coordonnees_dans_description',
  SUSPICIOUS_PRICING: 'prix_suspects',
  
  // Fraude potentielle
  DUPLICATE_CONTENT: 'contenu_duplique',
  FAKE_LOCATION: 'localisation_suspecte',
  MISSING_AUTHORIZATION: 'autorisation_manquante',
  UNREALISTIC_OFFERS: 'offres_irrealistes'
} as const;

// Configuration validation côté client
export const PETITES_ANNONCES_VALIDATION = {
  TITLE_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 255,
  DESCRIPTION_MIN_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 2000,
  LOCATION_MIN_LENGTH: 5,
  LOCATION_MAX_LENGTH: 255,
  PRICE_MAX_LENGTH: 100,
  
  // Confirmation obligatoire du périmètre
  REQUIRE_SCOPE_CONFIRMATION: true,
  SCOPE_CONFIRMATION_TEXT: "Je confirme que mon annonce respecte le périmètre audiovisuel/spectacle"
} as const;
