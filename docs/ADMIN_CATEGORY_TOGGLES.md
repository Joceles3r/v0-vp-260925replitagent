# Admin Category Toggles System

## Vue d'ensemble

Le système de toggles permet aux administrateurs de contrôler la visibilité de toutes les catégories et rubriques de VISUAL Platform via le dashboard admin.

## Catégories et Rubriques Disponibles

### Catégories (kind: "category")
1. **Films** - Films et cinéma
2. **Vidéos** - Vidéos créatives
3. **Documentaires** - Documentaires
4. **Voix et information** - Voix et information
5. **Live Shows** - Live Shows hebdomadaires
6. **Livres** - Livres et écriture
7. **Poadcasts** - Poadcasts mensuels

### Rubriques (kind: "rubrique")
1. **Petites Annonces** - Marketplace audiovisuelle

## Interface Admin

### Accès
- **URL**: Dashboard Admin → Section "Catégories & Rubriques"
- **Composant**: `CategoryTogglesCard.tsx`
- **Permissions**: Profil Admin requis

### Fonctionnalités

#### Visualisation
- Liste complète de toutes les catégories et rubriques
- État actuel (ON/OFF) visible pour chaque élément
- Description de chaque catégorie/rubrique

#### Actions
- **Toggle ON/OFF**: Switch pour activer/désactiver instantanément
- **Feedback visuel**: Toast de confirmation après chaque action
- **Persistance**: État sauvegardé en base de données

## Architecture Technique

### Frontend

**Hook principal**: `useFeatureToggles.ts`
\`\`\`typescript
// Récupérer tous les toggles
const { toggles, isLoading } = useFeatureToggles();

// Vérifier un toggle spécifique
const isVisible = useToggle("films");

// Récupérer par type
const { toggles: categories } = useTogglesByKind("category");
const { toggles: rubriques } = useTogglesByKind("rubrique");
\`\`\`

**Composant admin**: `CategoryTogglesCard.tsx`
- Affiche la liste des toggles
- Gère les actions ON/OFF
- Communique avec l'API backend

### Backend

**Routes**: `server/routes/categoryTogglesRoutes.ts`
\`\`\`
GET    /api/admin/categories          - Liste tous les toggles
PATCH  /api/admin/categories/:id      - Met à jour un toggle
\`\`\`

**Storage**: `server/storage.ts`
\`\`\`typescript
getAllFeatureToggles(): Promise<FeatureToggle[]>
updateFeatureToggle(key: string, updates: Partial<FeatureToggle>): Promise<FeatureToggle>
\`\`\`

**Base de données**: Table `feature_toggles`
\`\`\`sql
CREATE TABLE feature_toggles (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'category' | 'rubrique'
  is_visible BOOLEAN DEFAULT true,
  hidden_message_variant TEXT,
  hidden_message_custom TEXT,
  version INTEGER DEFAULT 1,
  updated_by TEXT,
  updated_at TIMESTAMP
);
\`\`\`

## Comportement Utilisateur

### Catégorie/Rubrique Visible (ON)
- Apparaît dans la navigation principale
- Accessible à tous les utilisateurs
- Contenu visible et interactions possibles

### Catégorie/Rubrique Cachée (OFF)
- N'apparaît pas dans la navigation
- Accès bloqué (redirection ou message)
- Message personnalisable:
  - "Section en cours de développement"
  - "Section en travaux, disponible bientôt"
  - Message personnalisé

## Cas d'Usage

### Lancement Progressif
1. Admin désactive une nouvelle catégorie (ex: Poadcasts)
2. Développement et tests en production
3. Admin active la catégorie quand prête
4. Utilisateurs voient immédiatement la nouvelle section

### Maintenance
1. Admin désactive temporairement une catégorie
2. Message "Section en travaux" affiché aux utilisateurs
3. Maintenance effectuée sans pression
4. Réactivation instantanée après correction

### A/B Testing
1. Admin active/désactive selon les segments
2. Analyse des métriques d'engagement
3. Décision basée sur les données

## Sécurité

### Authentification
- Middleware `requireAdmin` sur toutes les routes
- Vérification du profil utilisateur
- Token JWT requis

### Validation
- Schema Zod pour valider les requêtes
- Vérification de l'existence du toggle
- Logs d'audit pour chaque modification

### Permissions
- Seuls les admins peuvent modifier les toggles
- Utilisateurs normaux: lecture seule via API publique
- Historique des modifications (updated_by, updated_at)

## API Publique

**Endpoint**: `/api/public/toggles`
- Accessible sans authentification
- Cache de 5 secondes
- Format optimisé pour le frontend

**Réponse**:
\`\`\`json
{
  "films": { "visible": true, "message": "" },
  "videos": { "visible": true, "message": "" },
  "poadcasts": { "visible": false, "message": "Section en cours" },
  "petites_annonces": { "visible": true, "message": "" }
}
\`\`\`

## Monitoring

### Métriques à Surveiller
- Nombre de toggles actifs/inactifs
- Fréquence des changements
- Impact sur le trafic utilisateur
- Erreurs lors des basculements

### Logs
\`\`\`
[Admin] Category toggle updated: films -> ON by admin-123
[Admin] Category toggle updated: poadcasts -> OFF by admin-456
\`\`\`

## Roadmap

### Phase 1 (Actuel)
- ✅ Toggles ON/OFF simples
- ✅ Interface admin basique
- ✅ Persistance en base de données

### Phase 2 (Futur)
- ⏳ Planification temporelle (activer à date/heure précise)
- ⏳ Toggles par segment utilisateur
- ⏳ Rollout progressif (% d'utilisateurs)
- ⏳ Analytics intégrées

### Phase 3 (Vision)
- ⏳ Feature flags avancés
- ⏳ Expérimentations A/B natives
- ⏳ Rollback automatique si erreurs
- ⏳ Dashboard analytics dédié
