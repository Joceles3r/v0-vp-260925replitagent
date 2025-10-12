# Règles Catégories Films / Vidéos / Documentaires

**Version:** MODULE CORRECTIF 12/10/2025  
**Statut:** ✅ Implémenté

## Vue d'ensemble

Système adaptatif de répartition des revenus pour les catégories Films, Vidéos et Documentaires, avec basculement automatique entre TOP 10 et TOP 10% selon le nombre de projets.

## Seuils et Modes

### Fenêtre de Catégorie
- **Durée:** 168 heures (7 jours)
- **Seuil d'ouverture:** Minimum 30 projets validés

### Modes de Sélection

| Nombre de Projets (N) | Mode | K (Grands Gagnants) | Distribution |
|----------------------|------|---------------------|--------------|
| N < 30 | WAITING | - | Catégorie en attente |
| 30 ≤ N ≤ 120 | TOP 10 | 10 | Barèmes fixes par rang |
| N > 120 | TOP 10% | ceil(0.10 × N) | Distribution Zipf |

**Exemples:**
- N = 30 → TOP 10 (K = 10)
- N = 100 → TOP 10 (K = 10)
- N = 121 → TOP 10% (K = 13)
- N = 600 → TOP 10% (K = 60)
- N = 1300 → TOP 10% (K = 130)

## Répartition Globale (40/30/7/23)

### Distribution des Revenus

\`\`\`
Pot Total (S) = 100%
├── 40% → Investisseurs TOP K (grands gagnants)
├── 30% → Porteurs TOP K (grands gagnants)
├── 7%  → Investisseurs rangs K+1 à N (petits gagnants, équipartition)
└── 23% → VISUAL (+ résidus d'arrondis)
\`\`\`

### Détails par Catégorie

#### 1. Investisseurs TOP K (40%)

**Mode TOP 10 (N ≤ 120):**
- Utilise barèmes fixes par rang (compatibilité ascendante)
- Rangs 1-10: [13.66%, 6.83%, 4.55%, 3.41%, 2.73%, 2.28%, 1.95%, 1.71%, 1.52%, 1.37%]

**Mode TOP 10% (N > 120):**
- Distribution Zipf: `poids_i = 1 / i^α` (α = 1.0 par défaut)
- Normalisée: `part_i = 0.40 × S × (poids_i / Σpoids)`
- Décroissante et équitable pour tout K

#### 2. Porteurs TOP K (30%)

**Mode TOP 10 (N ≤ 120):**
- Barèmes fixes par rang
- Rangs 1-10: [10.24%, 5.12%, 3.41%, 2.56%, 2.05%, 1.71%, 1.46%, 1.28%, 1.14%, 1.02%]

**Mode TOP 10% (N > 120):**
- Distribution Zipf identique aux investisseurs
- `part_i = 0.30 × S × (poids_i / Σpoids)`

#### 3. Investisseurs "Petits Gagnants" (7%)

**Éligibilité:**
- Investisseurs ayant investi sur des projets **hors TOP K**
- Au moins **1 transaction valide** pendant la fenêtre
- Comptes uniques (dédoublonnage)

**Distribution:**
- **Équipartition stricte** entre tous les éligibles
- `Part = floor((0.07 × S) / M)` où M = nombre d'investisseurs éligibles
- Si M = 0 → montant va à VISUAL

**Cas limite (part < 1€):**
- Distribution round-robin de 1€ jusqu'à épuisement
- Résidus → VISUAL

#### 4. VISUAL (23% + résidus)

- **Base:** 23% du pot total
- **+ Résidus d'arrondis** de tous les paiements utilisateurs
- Reçoit les centimes (pas d'arrondi euro-floor)

## Tarification

### Prix Porteurs (€)
Valeurs autorisées: **2, 3, 4, 5, 10**

### Tranches Investisseurs (€)
Valeurs autorisées: **2, 3, 4, 5, 6, 8, 10, 12, 15, 20**

### Conversion Votes (Live Show)
- 2€ → 1 vote
- 4€ → 2 votes
- ...
- 20€ → 10 votes

## Arrondis et Résidus

### Règle d'Arrondi
- **Tous les paiements utilisateurs:** Arrondi à l'**euro inférieur** (floor)
- **VISUAL:** Reçoit les centimes (pas d'arrondi)

### Gestion des Résidus
\`\`\`typescript
// Exemple: Paiement calculé = 12.47€
amountCents = 1247
amountEurFloor = 1200 // Utilisateur reçoit 12.00€
residualCents = 47    // → VISUAL
\`\`\`

**Tous les résidus rejoignent VISUAL (23%)** pour garantir:
- Conservation exacte du pot total
- Pas de perte de centimes
- Transparence comptable

## Distribution Zipf (TOP 10%)

### Formule

\`\`\`typescript
// Poids pour rang i
poids_i = 1 / i^α

// Normalisation
W = Σ(poids_i) pour i=1..K

// Part pour rang i
part_i = (Pool × poids_i) / W
\`\`\`

### Paramètre α (Alpha)

- **Défaut:** α = 1.0
- **Plage recommandée:** 0.8 - 1.2
- **Effet:**
  - α plus faible → distribution plus égalitaire
  - α plus élevé → distribution plus concentrée sur les premiers rangs

### Propriétés

- **Décroissante:** part_i > part_(i+1) pour tout i
- **Normalisée:** Σpart_i = Pool (40% ou 30%)
- **Adaptative:** Fonctionne pour tout K
- **Équitable:** Pas de reparamétrage manuel nécessaire

## Algorithme de Calcul

### Pseudocode

\`\`\`
input: N (projets), S (pot total en centimes), α (défaut 1.0)

// 1. Déterminer le mode
if N < 30:
  status = "WAITING"
  return error
else if N <= 120:
  mode = "TOP10"
  K = 10
else:
  mode = "TOP10PCT"
  K = ceil(0.10 * N)

// 2. Calculer les pools
investorsTopPool = floor(0.40 * S)
creatorsTopPool = floor(0.30 * S)
investorsSmallPool = floor(0.07 * S)

// 3. Distribution TOP K
if mode == "TOP10":
  // Utiliser barèmes fixes
  investorsShares = FIXED_BAREMES_INVESTORS
  creatorsShares = FIXED_BAREMES_CREATORS
else:
  // Utiliser Zipf
  weights = zipfWeights(K, α)
  investorsShares = weights.map(w => floor(w * investorsTopPool))
  creatorsShares = weights.map(w => floor(w * creatorsTopPool))

// 4. Arrondir à l'euro inférieur pour utilisateurs
for each share:
  userPaid = euroFloor(share)
  residual += (share - userPaid)

// 5. Équipartition petits investisseurs
if M > 0:
  perInvestor = floor(investorsSmallPool / M)
  perInvestorEurFloor = euroFloor(perInvestor)
  distribute(perInvestorEurFloor to each)

// 6. VISUAL = 23% base + tous les résidus
visualAmount = floor(0.23 * S) + residual
\`\`\`

## Transparence et Audit

### Informations Publiques

Pour chaque catégorie clôturée, afficher:
- **N:** Nombre total de projets
- **Mode:** TOP 10 ou TOP 10%
- **K:** Nombre de grands gagnants
- **Pot Total:** Montant en euros
- **Breakdown:** Répartition par catégorie (40/30/7/23)

### Logs d'Audit

Chaque calcul de paiement enregistre:
- Version de la règle appliquée
- Mode et paramètres (N, K, α)
- Montants bruts et arrondis
- Résidus calculés
- Horodatage et hash d'intégrité

### Réconciliation

- Vérification automatique: `Σpaiements = Pot Total`
- Alerte si divergence > 0.01%
- Traçabilité complète dans `financial_ledger`

## Paramètres Configurables

### Admin Console

\`\`\`typescript
{
  min_projects_to_open: 30,        // Seuil d'ouverture
  top_mode_threshold: 120,         // Basculement TOP10 → TOP10%
  alpha_zipf: 1.00,                // Paramètre Zipf (0.8-1.2)
  rounding: "floor_to_euro",       // Mode d'arrondi
  category_window_hours: 168       // Durée fenêtre (7j)
}
\`\`\`

## Tests de Non-Régression

### Scénarios Testés

1. **N = 30:** Mode TOP 10, barèmes fixes
2. **N = 100:** Mode TOP 10, conservation totale
3. **N = 121:** Mode TOP 10%, K=13, Zipf
4. **N = 600:** Mode TOP 10%, K=60, décroissance
5. **N = 1300:** Mode TOP 10%, K=130, grande échelle

### Validations

- ✅ Conservation exacte du pot total
- ✅ Tous les paiements utilisateurs arrondis à l'euro
- ✅ Résidus correctement attribués à VISUAL
- ✅ Distribution décroissante par rang
- ✅ Équipartition 7% fonctionnelle
- ✅ Gestion des cas limites (M=0, parts <1€)

## Migration depuis Ancien Système

### Changements

| Ancien | Nouveau |
|--------|---------|
| TOP 10 fixe | TOP 10 / TOP 10% adaptatif |
| Pas de seuil minimum | Minimum 30 projets |
| Distribution manuelle | Distribution Zipf automatique |
| Pas de gestion N>120 | Scalable jusqu'à N=∞ |

### Compatibilité

- **N ≤ 120:** Comportement identique (barèmes fixes)
- **N > 120:** Nouveau comportement (Zipf)
- **Répartition 40/30/7/23:** Inchangée
- **Arrondis:** Inchangés (euro-floor)

## Implémentation

### Fichiers Modifiés

- ✅ `shared/categoryRules.ts` - Constantes et utilitaires
- ✅ `server/services/categoryRevenueEngine.ts` - Moteur de calcul
- ✅ `server/services/visualFinanceAI.ts` - Intégration VisualFinanceAI
- ✅ `tests/integration/categoryRevenueEngine.test.ts` - Suite de tests

### API

\`\`\`typescript
// Calcul paiement catégorie Films/Vidéos/Docs
const result = await visualFinanceAI.calculateFilmsVideosDocsPayout(
  categoryId,
  totalAmountEur,
  investorsTopK,    // Triés par rang
  creatorsTopK,     // Triés par rang
  investorsSmall,   // Hors TOP K avec ≥1 transaction
  nProjects,
  alpha             // Optionnel, défaut 1.0
);
\`\`\`

## Support et Maintenance

### Monitoring

- Latence calcul: < 2000ms (SLO)
- Divergence ledger: < 0.01%
- Alertes automatiques si anomalie

### Contact

Pour questions ou ajustements:
- **Documentation:** Ce fichier
- **Code:** `server/services/categoryRevenueEngine.ts`
- **Tests:** `tests/integration/categoryRevenueEngine.test.ts`

---

**Dernière mise à jour:** 12/10/2025  
**Version:** 1.0  
**Statut:** ✅ Production Ready
