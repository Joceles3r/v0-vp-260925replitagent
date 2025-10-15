# Module Poadcasts - Documentation Complète

## Vue d'ensemble

Le module **Poadcasts** (orthographe officielle demandée par l'ADMIN) est une nouvelle catégorie de contenu audio pour VISUAL Platform utilisant le système de distribution BATTLE 40/30/20/10.

## Caractéristiques principales

### Fenêtre temporelle
- **Période** : Mois numéraire en cours (28/29/30/31 jours selon le calendrier)
- **Seuils** :
  - Minimum : 30 poadcasts déposés
  - Maximum : 100 poadcasts (ou sélection des 100 meilleurs)

### Formule de distribution BATTLE 40/30/20/10

\`\`\`
POT TOTAL = P

40% → Porteur (créateur audio)
30% → Investisseurs (pro-rata votes × listen_score)
20% → VISUAL (infrastructure/modération/réserve)
10% → Bonus Pool (TOP 10, Visiteur du Mois, primes)
\`\`\`

### Tranches d'investissement

Héritées du système VISUAL standard :

| Montant (€) | Votes |
|-------------|-------|
| 2           | 1     |
| 3           | 2     |
| 4           | 3     |
| 5           | 4     |
| 6           | 5     |
| 8           | 6     |
| 10          | 7     |
| 12          | 8     |
| 15          | 9     |
| 20          | 10    |

### Listen Score

Métrique de performance calculée comme suit :

\`\`\`typescript
listen_score = 0.7 × taux_completion + 0.3 × auditeurs_uniques_normalisés
\`\`\`

Où :
- `taux_completion` ∈ [0, 1] : Pourcentage d'écoute jusqu'au bout
- `auditeurs_uniques_normalisés` ∈ [0, 1] : Nombre d'auditeurs uniques normalisé

### Anti-gonflage

Protection contre la capture de votes :
- **Cap par investisseur** : Maximum 20% des votes totaux de la catégorie
- Appliqué automatiquement lors du calcul de distribution

## Classement

### Calcul du score

\`\`\`typescript
score = votes × listen_score
\`\`\`

Les poadcasts sont classés du 1er au dernier selon ce score.

### Badge TOP 10

Les 10 premiers poadcasts reçoivent un badge visuel "TOP X" avec styling spécial.

## Interface utilisateur

### Composants principaux

1. **Header** : Affiche la fenêtre temporelle et les statistiques globales
2. **Stats Cards** : Poadcasts déposés, seuils, pot total, statut
3. **Règles & Explications** : 3 cartes détaillant les règles pour porteurs, investisseurs, et bonus
4. **Panneau ADMIN** : Formule de distribution et contrôles de test
5. **Classement** : Liste ordonnée avec jauges de performance
6. **Archives** : Sélecteur mois/année pour consulter les snapshots passés

### Jauges de performance

Chaque poadcast affiche 3 jauges colorées :
- **Complétion** : Taux d'écoute (rouge < 50%, jaune 50-75%, vert > 75%)
- **Audience unique** : Auditeurs uniques normalisés
- **Score global** : Votes × Listen Score (normalisé sur 100)

## Intégration admin

### Toggle de visibilité

Le module Poadcasts est contrôlable via le panneau admin :

**Emplacement** : `/admin/dashboard` → Section "Catégories & Rubriques"

**Fonctionnalité** :
- Switch ON/OFF pour activer/désactiver la catégorie
- Message personnalisable quand désactivé
- Persistance en base de données via `feature_toggles`

### Configuration

\`\`\`typescript
// Dans server/routes/adminDashboardRoutes.ts
{
  id: 'poadcasts',
  name: 'Poadcasts',
  description: 'Contenus audio avec système BATTLE 40/30/20/10',
  enabled: false // Initialement désactivé
}
\`\`\`

## Archives mensuelles

### Fonctionnement

- **Stockage** : localStorage (clé : `visual.poadcasts.archives`)
- **Structure** :
\`\`\`typescript
{
  ts: number,           // Timestamp de création
  year: number,         // Année
  month: number,        // Mois (0-11)
  pool: number,         // Pot total
  ranking: Array<{      // Classement complet
    id: string,
    title: string,
    votes: number,
    completion: number,
    uniquesNorm: number,
    rank: number,
    score: number
  }>
}
\`\`\`

### Utilisation

1. Cliquer sur "Archiver maintenant" en fin de mois
2. Sélectionner mois/année dans les dropdowns
3. Consulter le snapshot historique

## API à implémenter

### Endpoints requis

\`\`\`typescript
// Récupérer les poadcasts du mois en cours
GET /api/poadcasts/current
Response: { poadcasts: Poadcast[], pool: number }

// Récupérer les archives
GET /api/poadcasts/archives?year=2025&month=10
Response: { archive: Archive | null }

// Créer un snapshot d'archive
POST /api/poadcasts/archives
Body: { year: number, month: number }
Response: { success: boolean, archive: Archive }

// Investir dans un poadcast
POST /api/poadcasts/:id/invest
Body: { amount: number }
Response: { success: boolean, votes: number }
\`\`\`

## Formules de calcul

### Distribution investisseurs

\`\`\`typescript
function settleInvestors(
  potInvest: number,
  investors: { id: string; votes: number; listenScore: number }[]
) {
  // 1. Appliquer le cap de 20% par investisseur
  const sumVotes = investors.reduce((a, b) => a + b.votes, 0);
  const maxVotesPerInvestor = Math.ceil(sumVotes * 0.20);
  
  investors.forEach(i => {
    if (i.votes > maxVotesPerInvestor) {
      i.votes = maxVotesPerInvestor;
    }
  });
  
  // 2. Calculer les poids (votes × listen_score)
  const weights = investors.map(i => i.votes * i.listenScore);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  // 3. Distribuer au pro-rata
  return investors.map((i, idx) => ({
    id: i.id,
    amount: potInvest * (weights[idx] / totalWeight)
  }));
}
\`\`\`

## Roadmap

### Phase 1 : MVP (Actuel)
- ✅ Interface complète avec classement
- ✅ Jauges de performance
- ✅ Archives localStorage
- ✅ Toggle admin
- ⏳ Données mock (à remplacer par API)

### Phase 2 : Backend
- ⏳ API endpoints
- ⏳ Base de données PostgreSQL
- ⏳ Calcul automatique des listen_scores
- ⏳ Système de payout

### Phase 3 : Analytics
- ⏳ Tracking d'écoute en temps réel
- ⏳ Dashboard créateur
- ⏳ Statistiques avancées

### Phase 4 : Optimisations
- ⏳ Cache Redis pour performances
- ⏳ CDN pour fichiers audio
- ⏳ Compression audio adaptative

## Notes techniques

- **Framework** : React 18 + TypeScript
- **Styling** : Tailwind CSS avec thème néon (violet/bleu/rose)
- **Animations** : Framer Motion
- **État** : React hooks (useState, useMemo, useEffect)
- **Persistance** : localStorage (temporaire, à migrer vers API)

## Support

Pour toute question ou problème :
- Consulter la documentation VISUAL principale
- Contacter l'équipe admin via `/contact-support`
- Vérifier les logs dans le panneau admin
