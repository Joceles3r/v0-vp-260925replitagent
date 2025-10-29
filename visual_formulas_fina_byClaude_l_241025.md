# VISUAL - Formules Mathématiques et Répartitions Complètes
**Version finale : 2025-10-24**

---

## 📋 PRÉAMBULE

**Plateforme** : VISUAL  
**Slogan officiel** : *"Regarde-Investis-Gagne"*  
**Référence interne** : **100 VISUpoints = 1 €**

### Barème Commun Investisseurs (euros → votes)

| Montant (€) | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 | 20 |
|-------------|---|---|---|---|---|---|----|----|----|----| 
| **Votes** | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |

**Application** : Toutes catégories (Films, Vidéos, Documentaires, Voix de l'Info, Livres, Podcasts, VSLS).

---

## 📑 SOMMAIRE

1. [Films / Vidéos / Documentaires](#1-films--vidéos--documentaires----clôture-40302377)
2. [Voix de l'Info](#2-voix-de-linfo----vente-7030--pot-quotidien-6040)
3. [Livres](#3-livres----vente-7030--pot-mensuel-6040)
4. [Podcasts](#4-podcasts----vente-7030--pot-mensuel-40302010)
5. [VSLS (Visual Studio Live Show)](#5-vsls-visual-studio-live-show----40104010)
6. [Petites Annonces](#6-rubrique-petites-annonces----modèle-économique-pro)
7. [Règles Transverses](#7-règles-transverses)
8. [API & Settlement](#8-api--settlement-référence-technique)
9. [Check-list Déploiement](#9-check-list-déploiement)

---

## 1) Films / Vidéos / Documentaires — Clôture **40/30/23/7 %**

### Formule de Répartition

Soit **P** le **pot net** (après frais Stripe) à la clôture de la catégorie.

#### Distribution détaillée :

**A) 40 % → Investisseurs TOP 10**

```
P_{I,Top10} = 0,40 × P

part_i = P_{I,Top10} × (V_i / Σ_{j∈Top10} V_j)
```

Où :
- `V_i` = votes de l'investisseur `i` sur les projets TOP 10
- Répartition **pondérée** par le montant investi

---

**B) 30 % → Porteurs de Projets TOP 10**

```
P_{C,Top10} = 0,30 × P

part_c = P_{C,Top10} × (score_c / Σ score_{Top10})
```

Où :
- `score_c` = score final du projet `c` (votes × engagement × qualité)
- Répartition **pondérée** par le score de classement

---

**C) 7 % → Investisseurs rangs 11-100**

```
P_{I,11-100} = 0,07 × P
```

Distribution :
- **Équiparti** (parts égales) **OU**
- **Pro-rata votes** (selon paramétrage admin)

---

**D) 23 % → VISUAL (Plateforme)**

```
P_{VISUAL} = 0,23 × P
```

Inclut :
- Frais opérationnels
- Arrondis de calcul (bouclage au centime)
- Réserve technique

---

### Quotas Créateurs (Rappel)

| Type de contenu | Durée | Quota | Prix fixe |
|----------------|-------|-------|-----------|
| **Clips** | ≤ 5 min | 2/mois | 2 € |
| **Documentaires** | 5-30 min | 1/mois | 5 € ou 10 € |
| **Films** | > 30 min | 1/trimestre | 15 € |

---

## 2) Voix de l'Info — **Vente 70/30** + **Pot quotidien 60/40**

### Flux A — Vente Unitaire d'Article

```
Net_vente = Prix_payé - Frais_paiement

Auteur = 0,70 × Net_vente
VISUAL = 0,30 × Net_vente
```

**Arrondi** : Au centime près (0,01 €)

---

### Flux B — Pot du Jour (Distribution J → J+1 à 00:15)

Soit **P_day** le **pot net quotidien** cumulé.

#### A) 60 % → Auteurs TOP 10

```
P_{Auteurs} = 0,60 × P_day

part_a = P_{Auteurs} × (score_a / Σ score_{Top10})
```

**Méthodes de pondération** (configurable) :
- **Pro-rata score** (votes × engagement)
- **Poids par rang** : rang 1 = 10 points, rang 2 = 9 points, ..., rang 10 = 1 point

---

#### B) 40 % → Lecteurs Gagnants

**Critère d'éligibilité** : Avoir acheté **≥ 1 article** d'un auteur du TOP 10.

```
W_i = Σ (votes_i × poids_c)

part_i = 0,40 × P_day × (W_i / Σ W)
```

Où :
- `votes_i` = nombre de votes du lecteur `i` sur articles TOP 10
- `poids_c` = coefficient de pondération de l'auteur `c` (selon rang)

---

### Règles Spécifiques

- **Fréquence** : Clôture quotidienne automatique (CRON à 00:15 UTC+1)
- **Archivage** : Classements quotidiens conservés 90 jours
- **Délai paiement** : T+2 jours ouvrés

---

## 3) Livres — **Vente 70/30** + **Pot mensuel 60/40**

### Flux A — Vente Unitaire de Livre

```
Net_vente = Prix_payé - Frais_paiement

Auteur = 0,70 × Net_vente
VISUAL = 0,30 × Net_vente
```

---

### Flux B — Pot Mensuel (Mois Calendaire)

Soit **P_mois** le **pot net mensuel**.

#### A) 60 % → Auteurs TOP 10

```
P_{Auteurs} = 0,60 × P_mois

part_a = P_{Auteurs} × (score_a / Σ score_{Top10})
```

**Méthodes de pondération** :
- **Pro-rata score** (votes × ventes × engagement)
- **Poids dégressif** : rang 1 = 10, rang 2 = 9, ..., rang 10 = 1

---

#### B) 40 % → Lecteurs-Investisseurs Gagnants

**Critère** : Avoir investi sur **≥ 1 auteur du TOP 10**.

```
W_i = Σ (votes_i × poids_c)

part_i = 0,40 × P_mois × (W_i / Σ W)
```

---

### Système de Repêchage (Optionnel)

**Cible** : Auteurs classés **rangs 11-100**

- **Coût** : 25 € (ticket de repêchage)
- **Fenêtre** : 24 heures après clôture mensuelle
- **Effet** : Inscription automatique au cycle suivant (file d'attente prioritaire)

---

### Auto-Report TOP 10

**Paramétrable** par l'admin :
- **Activé** : TOP 10 reconduits automatiquement le mois suivant
- **Désactivé** : Retour en file d'attente générale

---

### Capacité Mensuelle

- **Target** : 100 auteurs/mois (paramètre `TARGET_AUTHORS`)
- **Extensible** : Jusqu'à 200 auteurs/mois selon charge serveur
- **File d'attente** : Visible jusqu'à 10 000 auteurs dans admin

---

## 4) Podcasts — **Vente 70/30** + **Pot mensuel 40/30/20/10**

### Flux A — Vente Épisode

```
Net_vente = Prix_payé - Frais_paiement

Porteur = 0,70 × Net_vente
VISUAL = 0,30 × Net_vente
```

---

### Flux B — Pot Mensuel

Soit **P** le **pot net mensuel**.

#### A) 40 % → Porteurs de Podcasts

```
P_{Porteurs} = 0,40 × P

part_p = P_{Porteurs} × (score_audio_p / Σ score_audio)
```

**Calcul score_audio** :
```
score_audio = impressions × complétion
```

Où :
- `impressions` = nombre total d'écoutes
- `complétion` = % moyen d'écoute (0 à 1)

---

#### B) 30 % → Investisseurs

```
P_{Investisseurs} = 0,30 × P

part_i = P_{Investisseurs} × (weight_i / Σ weights)

weight_i = votes_i × listen_score_i
```

**Formule listen_score** :
```
listen_score = 0,7 × complétion + 0,3 × auditeurs_uniques_norm
```

Où :
- `complétion` = % moyen d'écoute complète (0 à 1)
- `auditeurs_uniques_norm` = ratio auditeurs uniques / total écoutes (normalisé 0-1)

---

**⚠️ CAP ANTI-CAPTURE** (Recommandé) :

**Limite par investisseur** : ≤ **20 %** des votes globaux mensuels

```
IF votes_i / Σ votes_total > 0,20 THEN
  weight_i_capped = 0,20 × Σ votes_total × listen_score_i
```

**Objectif** : Prévenir la monopolisation par gros investisseurs.

---

#### C) 20 % → VISUAL

```
P_{VISUAL} = 0,20 × P
```

---

#### D) 10 % → Bonus Pool

```
P_{Bonus} = 0,10 × P
```

**Affectation** :
- **TOP 10 podcasts** : Primes de performance
- **Challenges spéciaux** : Événements promotionnels
- **Réserve technique** : Ajustements et arrondis

---

### Classement & Archivage

**Formule de classement** :
```
score_final = votes × listen_score
```

**Ordre** : Décroissant (1 → N)

**Archives** : Classements mensuels conservés indéfiniment (CSV + DB).

---

## 5) VSLS (Visual Studio Live Show) — **40/10/40/10 %**

### Contexte

**VSLS** = Battles artistiques en **temps réel** avec votes **live** (WebSocket).

Soit **P_live** le **pot net** du show.

---

### Répartition

#### A) 40 % → Artiste Gagnant

```
P_{Gagnant} = 0,40 × P_live
```

---

#### B) 10 % → Artiste Perdant

```
P_{Perdant} = 0,10 × P_live
```

**Objectif** : Récompenser la participation (pas de sortie à zéro).

---

#### C) 40 % → Investisseurs Gagnants

**Critère** : Avoir soutenu l'**artiste gagnant** pendant le show.

```
P_{Inv_Gagnants} = 0,40 × P_live

part_i = P_{Inv_Gagnants} × (votes_i / Σ votes_gagnant)
```

**Méthode** : **Pro-rata votes** (ou montants investis selon paramétrage).

---

#### D) 10 % → VISUAL

```
P_{VISUAL} = 0,10 × P_live
```

---

### Règles VSLS

#### Tranches € → Votes

**Barème commun** appliqué : 2 € = 1 vote, ..., 20 € = 10 votes.

---

#### Gestion des Égalités

En cas d'égalité de votes :

1. **Départage 1** : Somme des **engagements** (likes, partages, commentaires)
2. **Départage 2** : **Ancienneté du vote** (horodatage, premier vote = prioritaire)

---

#### Anti-Abus

**Protections actives** :

- **Limites de fréquence** : Max 10 votes/minute/user
- **Détection de patterns** : Bots, multi-comptes (fraud engine)
- **Annulation** : Si fraude détectée → votes invalidés + sanctions
- **Rate limiting** : Protection DDoS (100 req/15min par IP)

---

#### Traçabilité

**Logs en temps réel** :

- **WebSocket** : Tous les votes horodatés (ms precision)
- **Journal d'événements** : Actions, détections, sanctions
- **Export CSV** : Audit complet post-show (disponible admin)

---

### Délai de Paiement

**Artistes** : T+2 jours ouvrés  
**Investisseurs gagnants** : T+3 jours ouvrés (après vérifications anti-fraude)

---

## 6) Rubrique **Petites Annonces** — Modèle Économique Pro

### Principe

**Marketplace audiovisuelle** : Casting, matériel, services, locaux.

**⚠️ IMPORTANT** : **Hors système d'investissement** (pas de votes, pas de pots).

---

### Monétisation (4 leviers cumulables)

#### 1) Frais Fixes par Annonce

**Paliers** (configurables) :

| Formule | Prix | Durée | Visibilité |
|---------|------|-------|------------|
| **Basic** | 5 € | 30 jours | Standard |
| **Pro** | 15 € | 60 jours | Mise en avant modérée |
| **Premium** | 29 € | 90 jours | Top annonces + badge |

---

#### 2) Mise en Avant (Boosts)

**Tarifs** :

| Durée | Prix |
|-------|------|
| 7 jours | 9 € |
| 14 jours | 15 € |
| 30 jours | 25 € |

**Effet** : Annonce épinglée en tête de catégorie + badge "Sponsorisé".

---

#### 3) Commission sur Transaction

**Si transaction conclue via la plateforme** :

```
Commission = α % × Montant_net

α = 8 % (paramétrable 5-15 %)
```

**Montant_net** = Prix convenu - Frais de paiement

**Tracking** : Via système d'escrow optionnel ou déclaration manuelle.

---

#### 4) Abonnements Pro (Mensuels)

**Formules** :

| Plan | Prix/mois | Inclus |
|------|-----------|--------|
| **Starter** | 19 € | 5 annonces/mois + stats basiques |
| **Business** | 49 € | 20 annonces/mois + templates + priorité support |
| **Enterprise** | 99 € | Illimité + multi-utilisateurs + API access |

**Avantages** :
- Pas de frais par annonce (dans limite du plan)
- Outils avancés (statistiques, A/B testing, CRM intégré)
- Support prioritaire

---

### Conformité & Opérations

#### RGPD

- **Consentement explicite** : Collecte données minimales
- **Conservation limitée** : 90 jours après expiration annonce
- **Droit à l'oubli** : Suppression sur demande (< 30 jours)

---

#### Modération

**Système IA + Humain** :

- **Pré-modération IA** : Détection contenu interdit (70% automatique)
- **Revue manuelle** : Annonces signalées (< 24h)
- **Sanctions graduées** :
  - 1er signalement validé : **Avertissement**
  - 2e signalement : **Suspension 7 jours**
  - 3e signalement : **Ban définitif**

---

#### Sécurité Transactions

**Escrow optionnel** :

- Fonds bloqués jusqu'à validation service rendu
- Frais escrow : +2 % (en sus de la commission)
- Délai de déblocage : 48h après confirmation

**KYC Pro** :

- **Seuil** : > 5000 € de transactions/mois
- **Documents** : SIRET, RIB, pièce d'identité
- **Vérification** : < 72h (manuelle)

---

#### Facturation

- **Factures PDF** : Génération automatique (conformes TVA/TVS)
- **Exports** : CSV/Excel pour comptabilité
- **Historique** : Conservé 10 ans (obligation légale)

---

#### KPI Métiers

**Suivi admin** :

- **Taux de conversion** : Annonces → Transactions
- **Délai de placement** : Temps moyen avant réponse
- **ARPU** (Average Revenue Per User) : Revenus / Utilisateurs actifs
- **LTV** (Lifetime Value) : Valeur client sur 12 mois

---

## 7) Règles Transverses

### Arrondis

**Méthode** : **2 décimales** (0,01 €)

**Gestion des résidus** :

```
Σ parts_calculées ≠ pot_net  →  résidu → VISUAL
```

**Objectif** : Bouclage exact au centime (éviter écarts comptables).

---

### Barème Commun (Rappel)

**Application universelle** :

| € | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 15 | 20 |
|---|---|---|---|---|---|---|----|----|----|----| 
| **Votes** | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |

**Implémentation** : Client (`investmentCalculator.ts`) + Serveur (`voteService.ts`).

---

### RGPD & Anti-Fraude

#### Consentements

- **Cookies** : Bannière obligatoire (opt-in analytics)
- **Données sensibles** : Consentement explicite (KYC, paiements)
- **Marketing** : Opt-in séparé (newsletters)

---

#### Anti-Fraude

**Protections** :

- **Caps par utilisateur** :
  - Podcasts : ≤ 20 % votes globaux/mois
  - VSLS : ≤ 10 votes/minute
- **Limites de fréquence** :
  - Investissements : ≤ 50 transactions/jour
  - Parrainage : ≤ 20 filleuls/mois
- **Scoring comportemental** :
  - Détection bots (fraud engine)
  - Multi-comptes (IP tracking, fingerprinting)
  - Patterns suspects (montants, timing)

---

#### Sanctions Graduées

| Niveau | Action | Durée |
|--------|--------|-------|
| **1** | Avertissement | - |
| **2** | Limitation actions | 7 jours |
| **3** | Suspension compte | 30 jours |
| **4** | Ban définitif | Permanent |

---

### KYC & Âge

#### Mineurs (16-17 ans)

- **Plafond investissement** : 200 € cumulés
- **Retraits** : Différés jusqu'à 18 ans (sauf autorisation parentale)
- **KYC renforcé** : Obligatoire à la majorité (transition automatique)
- **Table dédiée** : `minor_visitors` (schema.ts)

---

#### Majeurs

- **KYC standard** : Pièce d'identité + justificatif domicile
- **Seuils** :
  - Dépôt > 1000 € → KYC obligatoire
  - Retrait > 500 € → KYC + vérification bancaire

---

## 8) API & Settlement (Référence Technique)

### Endpoints Principaux

#### A) Investissement

```http
POST /api/invest
Content-Type: application/json

{
  "category": "films" | "livres" | "podcasts" | "vsls",
  "targetId": "project_abc123",
  "amount": 10.00,
  "currency": "EUR"
}

→ Crédite votes selon barème
→ Retourne : { votes: 7, visupoints: 1000 }
```

---

#### B) Vente Unitaire

```http
POST /api/sale
Content-Type: application/json

{
  "category": "voix_info" | "livres" | "podcasts",
  "targetId": "article_xyz789",
  "price": 5.00,
  "currency": "EUR",
  "buyerId": "user_456"
}

→ Split 70/30 immédiat
→ Retourne : { 
    author_share: 3.50, 
    platform_share: 1.50,
    transaction_id: "txn_..."
  }
```

---

#### C) Clôture de Cycle

```http
POST /api/{category}/close
Authorization: Bearer {ADMIN_TOKEN}

{
  "period": "2025-10-24" | "2025-10",
  "force": false
}

→ Fige pot
→ Calcule payouts selon formules
→ Déclenche webhooks Stripe Connect
→ Retourne : { 
    pot_net: 15420.50,
    payouts: [...],
    status: "completed"
  }
```

---

#### D) Rankings

```http
GET /api/{category}/rankings?period=2025-10&limit=100

→ Retourne classements + parts calculées
→ Format : {
    rankings: [
      { rank: 1, target_id: "...", score: 1250, share: 520.30 },
      ...
    ],
    metadata: { period, total_pot, closed_at }
  }
```

---

### Pseudo-Code Settlement

```javascript
// 1) Calculer pot net
pot_net = pot_gross - stripe_fees - platform_fees

// 2) Définir clés de répartition (selon catégorie)
keys = {
  investors_top10: 0.40,
  creators_top10: 0.30,
  investors_11_100: 0.07,
  platform: 0.23
}

// 3) Calculer parts par clé
parts = keys.map(k => k.pct * pot_net)

// 4) Calculer poids individuels
weights = targets.map(t => {
  switch(category) {
    case 'films':
      return t.votes
    case 'podcasts':
      return t.votes * t.listen_score
    case 'vsls':
      return t.votes_for_winner
    // ...
  }
})

// 5) Distribuer chaque part
payouts = parts.map((part, key) => {
  eligible = targets.filter(t => t.eligible_for[key])
  
  return eligible.map(t => ({
    target_id: t.id,
    amount: part * (weights[t.id] / sum(weights[eligible])),
    key: key
  }))
})

// 6) Arrondir + gérer résidus
payouts.forEach(p => p.amount = round(p.amount, 2))
residue = pot_net - sum(payouts.amount)
platform_share += residue

// 7) Enregistrer + déclencher paiements
await db.insert('payouts', payouts)
await stripe.transferBatch(payouts)
```

---

### Idempotence Webhooks

**Protection rejeu** :

```javascript
// Stripe webhook handler
app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET)
  
  // Vérifier idempotence
  const existing = await db.query(
    'SELECT * FROM webhook_events WHERE event_id = ?',
    [event.id]
  )
  
  if (existing) {
    return res.status(200).send('Already processed')
  }
  
  // Traiter événement
  await processStripeEvent(event)
  
  // Marquer comme traité
  await db.insert('webhook_events', {
    event_id: event.id,
    processed_at: new Date()
  })
  
  res.status(200).send('OK')
})
```

---

## 9) Check-list Déploiement

### Avant Mise en Production

#### Configuration

- [ ] **Barème euros→votes** implémenté client + serveur
- [ ] **Clés de répartition** testées :
  - [ ] 40/30/23/7 (Films/Vidéos/Docs)
  - [ ] 70/30 (Ventes)
  - [ ] 60/40 (Voix de l'Info quotidien, Livres mensuel)
  - [ ] 40/30/20/10 (Podcasts mensuel)
  - [ ] 40/10/40/10 (VSLS)
- [ ] **Arrondis au centime** + vérification somme des parts = pot

---

#### Jobs Automatisés

- [ ] **CRON clôtures** configurés :
  - [ ] Voix de l'Info : Quotidien 00:15 UTC+1
  - [ ] Livres : Mensuel (dernier jour 23:59)
  - [ ] Podcasts : Mensuel (dernier jour 23:59)
  - [ ] Films/Vidéos/Docs : Paramétrable (admin)
- [ ] **Webhooks Stripe Connect** idempotents (rejeu safe)
- [ ] **Backup automatique** avant chaque clôture

---

#### Tests

- [ ] **Tests unitaires** : Coverage ≥ 80 %
  - [ ] `revenueEngine.test.ts` (100 %)
  - [ ] `voteService.test.ts`
  - [ ] `settlementService.test.ts`
- [ ] **Tests E2E** : Scénarios complets
  - [ ] Cycle Films complet (invest → classement → clôture)
  - [ ] Vente Voix de l'Info + pot quotidien
  - [ ] VSLS battle avec égalité

---

#### Exports & Conformité

- [ ] **Exports CSV/Excel** opérationnels :
  - [ ] Auteurs/créateurs (revenus, classements)
  - [ ] Investisseurs (gains, transactions)
  - [ ] Audits (logs, sanctions)
- [ ] **RGPD** : Conformité validée
  - [ ] Consentement cookies implémenté
  - [ ] Export données personnelles (< 30 jours)
  - [ ] Droit à l'oubli opérationnel
- [ ] **Anti-fraude** actif :
  - [ ] Rate limiting (4 niveaux)
  - [ ] Fraud detection engine
  - [ ] Caps par utilisateur
  - [ ] Limites de fréquence

---

#### Monitoring & Logs

- [ ] **Health checks** : `/healthz`, `/readyz`, `/metrics`
- [ ] **Logs structurés** : Actions sensibles auditées
- [ ] **Alertes** configurées :
  - [ ] Échec clôture (email admin)
  - [ ] Fraude détectée (SMS + email)
  - [ ] Erreur Stripe webhook (PagerDuty)
- [ ] **Dashboard admin** : Métriques temps réel
  - [ ] Pots en cours
  - [ ] Classements live
  - [ ] Transactions du jour

---

#### Sécurité

- [ ] **Headers sécurisé** : CSP, HSTS, X-Frame-Options
- [ ] **CORS** strict en production
- [ ] **Secrets** : Rotation clés API (Stripe, Bunny.net)
- [ ] **Audit trail HMAC** : Signatures cryptographiques
- [ ] **Row Level Security** : Policies PostgreSQL actives

---

#### Documentation

- [ ] **README technique** à jour
- [ ] **API documentation** (Swagger/OpenAPI)
- [ ] **Guides utilisateurs** :
  - [ ] Investisseurs (comment voter, comprendre les pots)
  - [ ] Créateurs (dépôt contenu, quotas, revenus)
  - [ ] Admin (clôtures manuelles, modération)
- [ ] **Runbooks** :
  - [ ] Procédure rollback
  - [ ] Incident response
  - [ ] Réconciliation Stripe

---

### Après Déploiement

#### Smoke Tests (J0)

- [ ] Créer investissement test (2 €) → vérifier 1 vote
- [ ] Acheter article Voix de l'Info → vérifier split 70/30
- [ ] Déclencher clôture manuelle → vérifier calculs
- [ ] Consulter rankings → vérifier affichage

---

#### Monitoring (J+7)

- [ ] Vérifier CRON exécutés (logs)
- [ ] Comparer pots calculés vs Stripe (réconciliation)
- [ ] Analyser erreurs 5xx (< 0.1 % attendu)
- [ ] Valider temps réponse API (< 200ms P95)

---

#### Optimisation (J+30)

- [ ] Analyser requêtes lentes (PostgreSQL `pg_stat_statements`)
- [ ] Ajuster caps anti-fraude (si nécessaire)
- [ ] Optimiser index DB (classements, rankings)
- [ ] Réviser formules si edge cases détectés

---

## 📊 TABLEAUX RÉCAPITULATIFS

### Répartitions par Catégorie

| Catégorie | Créateurs | Investisseurs | Plateforme | Autre |
|-----------|-----------|---------------|------------|-------|
| **Films/Vidéos/Docs** | 30 % (TOP 10) | 40 % (TOP 10) + 7 % (11-100) | 23 % | - |
| **Voix de l'Info** (vente) | 70 % | - | 30 % | - |
| **Voix de l'Info** (pot) | 60 % (TOP 10) | - | - | 40 % lecteurs |
| **Livres** (vente) | 70 % | - | 30 % | - |
| **Livres** (pot) | 60 % (TOP 10) | - | - | 40 % lecteurs-inv. |
| **Podcasts** (vente) | 70 % | - | 30 % | - |
| **Podcasts** (pot) | 40 % | 30 % | 20 % | 10 % bonus |
| **VSLS** | 40 % gagnant + 10 % perdant | 40 % (gagnants) | 10 % | - |
| **Petites Annonces** | - | - | 100 % (hors invest.) | - |

---

### Fréquences de Clôture

| Catégorie | Fréquence | Heure (UTC+1) | Automatique |
|-----------|-----------|---------------|-------------|
| **Films/Vidéos/Docs** | Paramétrable | Variable | ❌ (Admin) |
| **Voix de l'Info** | Quotidienne | 00:15 | ✅ (CRON) |
| **Livres** | Mensuelle | Dernier jour 23:59 | ✅ (CRON) |
| **Podcasts** | Mensuelle | Dernier jour 23:59 | ✅ (CRON) |
| **VSLS** | Immédiate | Fin du show | ✅ (WebSocket) |
| **Petites Annonces** | - | - | ❌ (N/A) |

---

### Quotas Créateurs

| Type | Durée Vidéo | Prix | Quota | Catégorie |
|------|-------------|------|-------|-----------|
| **Clip** | ≤ 5 min | 2 € | 2/mois | Films |
| **Documentaire** | 5-30 min | 5-10 € | 1/mois | Documentaires |
| **Film** | > 30 min | 15 € | 1/trimestre | Films |
| **Article** | - | Variable | Illimité | Voix de l'Info |
| **Livre** | - | Variable | 1/mois | Livres |
| **Épisode Podcast** | - | Variable | Illimité | Podcasts |

---

### Limites Anti-Fraude

| Action | Limite | Période | Sanction |
|--------|--------|---------|----------|
| **Votes VSLS** | 10 | 1 minute | Rate limit |
| **Investissements** | 50 | 1 jour | Avertissement |
| **Parrainage** | 20 filleuls | 1 mois | Suspension |
| **Podcasts (votes)** | 20 % du total | 1 mois | Cap appliqué |
| **Requêtes API** | 100 | 15 minutes | 429 Too Many Requests |

---

## 🔐 SÉCURITÉ & CONFORMITÉ

### Niveaux de KYC

| Niveau | Déclencheur | Documents | Délai Vérification |
|--------|-------------|-----------|-------------------|
| **KYC 0** | Inscription | Email | Instantané |
| **KYC 1** | Investissement > 100 € | Pièce d'identité | < 24h |
| **KYC 2** | Retrait > 500 € | + Justificatif domicile | < 48h |
| **KYC 3** | Transactions > 5000 €/mois | + SIRET (pro) | < 72h |

---

### RGPD - Conservation des Données

| Type de Donnée | Durée | Base Légale |
|----------------|-------|-------------|
| **Compte utilisateur** | Jusqu'à suppression demandée | Consentement |
| **Transactions financières** | 10 ans | Obligation légale |
| **Logs d'audit** | 1 an | Intérêt légitime |
| **Cookies analytics** | 13 mois | Consentement |
| **Petites annonces expirées** | 90 jours | Consentement |

---

### Sanctions Graduées (Modération)

| Infraction | 1ère fois | 2ème fois | 3ème fois | Gravité Immédiate |
|------------|-----------|-----------|-----------|-------------------|
| **Spam** | Avertissement | Suspension 7j | Suspension 30j | Ban si bot |
| **Contenu offensant** | Masquage + avertissement | Suspension 30j | Ban définitif | Ban si pédopornographie |
| **Fraude votes** | Annulation + avertissement | Suspension 30j | Ban définitif | Ban si coordonné |
| **Multi-comptes** | Fusion comptes | Suspension 30j | Ban tous comptes | Ban si ferme de clics |

---

## 🚀 FORMULES COMPLÈTES (Synthèse Technique)

### Films / Vidéos / Documentaires

```
P = pot_net après frais

Investisseurs TOP 10:
  P_I_top10 = 0.40 × P
  part_i = P_I_top10 × (V_i / Σ V_top10)

Porteurs TOP 10:
  P_C_top10 = 0.30 × P
  part_c = P_C_top10 × (score_c / Σ score_top10)

Investisseurs 11-100:
  P_I_11_100 = 0.07 × P
  part_i = P_I_11_100 / count(11-100)  [équiparti]

VISUAL:
  P_VISUAL = 0.23 × P
```

---

### Voix de l'Info

**Vente:**
```
Net_vente = Prix - Frais
Auteur = 0.70 × Net_vente
VISUAL = 0.30 × Net_vente
```

**Pot quotidien:**
```
P_day = pot_net du jour

Auteurs TOP 10:
  P_auteurs = 0.60 × P_day
  part_a = P_auteurs × (score_a / Σ score_top10)

Lecteurs gagnants:
  P_lecteurs = 0.40 × P_day
  W_i = Σ (votes_i × poids_c)
  part_i = P_lecteurs × (W_i / Σ W)
```

---

### Livres

**Vente:**
```
Net_vente = Prix - Frais
Auteur = 0.70 × Net_vente
VISUAL = 0.30 × Net_vente
```

**Pot mensuel:**
```
P_mois = pot_net mensuel

Auteurs TOP 10:
  P_auteurs = 0.60 × P_mois
  part_a = P_auteurs × (score_a / Σ score_top10)

Lecteurs-investisseurs gagnants:
  P_lecteurs_inv = 0.40 × P_mois
  W_i = Σ (votes_i × poids_c)
  part_i = P_lecteurs_inv × (W_i / Σ W)
```

---

### Podcasts

**Vente:**
```
Net_vente = Prix - Frais
Porteur = 0.70 × Net_vente
VISUAL = 0.30 × Net_vente
```

**Pot mensuel:**
```
P = pot_net mensuel

Porteurs:
  P_porteurs = 0.40 × P
  score_audio = impressions × complétion
  part_p = P_porteurs × (score_audio_p / Σ score_audio)

Investisseurs:
  P_inv = 0.30 × P
  listen_score = 0.7 × complétion + 0.3 × auditeurs_uniques_norm
  weight_i = votes_i × listen_score_i
  
  IF votes_i / Σ votes_total > 0.20 THEN
    weight_i_capped = 0.20 × Σ votes_total × listen_score_i
  
  part_i = P_inv × (weight_i / Σ weights)

VISUAL:
  P_VISUAL = 0.20 × P

Bonus Pool:
  P_bonus = 0.10 × P
```

---

### VSLS (Visual Studio Live Show)

```
P_live = pot_net du show

Artiste gagnant:
  P_gagnant = 0.40 × P_live

Artiste perdant:
  P_perdant = 0.10 × P_live

Investisseurs gagnants:
  P_inv_gagnants = 0.40 × P_live
  part_i = P_inv_gagnants × (votes_i / Σ votes_gagnant)

VISUAL:
  P_VISUAL = 0.10 × P_live

Égalités:
  1. Départage par engagement = likes + shares + comments
  2. Si égalité → ancienneté du vote (timestamp ASC)
```

---

## 📈 MÉTRIQUES DE SUCCÈS (KPI)

### Engagement Utilisateurs

- **DAU/MAU** (Daily/Monthly Active Users) : Objectif > 30 %
- **Taux de rétention J7** : > 40 %
- **Temps moyen session** : > 8 minutes
- **Investissements moyens par user/mois** : > 15 €

---

### Performance Économique

- **GMV** (Gross Merchandise Value) : Somme pots mensuels
- **Take rate** : Revenus plateforme / GMV (objectif 20-25 %)
- **ARPU** (Average Revenue Per User) : Revenus / MAU
- **LTV/CAC** : Lifetime Value / Coût d'Acquisition (objectif > 3)

---

### Qualité Contenu

- **Taux d'approbation projets** : < 60 % (sélectivité)
- **Score moyen qualité** (IA) : > 7/10
- **Taux de complétion vidéos** : > 65 %
- **NPS** (Net Promoter Score) créateurs : > 50

---

### Opérationnel

- **Uptime** : > 99.9 %
- **Temps réponse API P95** : < 200ms
- **Erreurs 5xx** : < 0.1 %
- **Temps clôture cycle** : < 5 minutes

---

## 🔄 CYCLES DE VIE

### Cycle Mensuel Livres

```
Jour 1 00:00:00 Europe/Paris
  ↓
Ouverture cycle N
  ↓
Auteurs actifs (max 100)
  ↓
Investissements + Ventes (70/30 immédiat)
  ↓
Jour 30/31 23:59:59
  ↓
Clôture automatique (CRON)
  ↓
Calcul classements (score final)
  ↓
Distribution pot 60/40
  ↓
J+1 00:00:00
  ↓
Fenêtre repêchage 24h (rangs 11-100)
  ↓
J+2 00:00:00
  ↓
Auto-report TOP 10 vers cycle N+1
  ↓
Nouveaux auteurs file d'attente → cycle N+1
```

---

### Cycle Quotidien Voix de l'Info

```
Jour J 00:00:00
  ↓
Ventes articles (70/30 immédiat)
  ↓
Accumulation pot quotidien
  ↓
Jour J 23:59:59
  ↓
Fige pot_day
  ↓
Jour J+1 00:15:00 (CRON)
  ↓
Calcul TOP 10 auteurs (score)
  ↓
Distribution 60% auteurs + 40% lecteurs
  ↓
Paiements J+2 (après vérifications)
  ↓
Archive classement + nouveau cycle J+1
```

---

## 🛠️ OUTILS ADMIN

### Dashboard Principal

**URL** : `/admin/dashboard`

**Sections** :
1. **Vue d'ensemble** : Métriques temps réel
2. **Utilisateurs** : KYC, sanctions, mineurs
3. **Financier** : Pots en cours, réconciliation Stripe
4. **Projets** : Modération, approbations
5. **Live Shows** : Gestion battles VSLS
6. **Livres** : Queue management (10K auteurs visible)
7. **Toggles** : ON/OFF catégories (7) + rubrique (1)
8. **Logo** : Visibilité logo officiel
9. **Logs** : Audit trail, fraude détectée

---

### Actions Rapides

**Clôture manuelle cycle** :
```bash
# Via API
curl -X POST https://visual.com/api/admin/films/close \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"period":"2025-10-24","force":false}'

# Via CLI (si disponible)
yarn admin:close --category=films --period=2025-10-24
```

**Export données** :
```bash
# Transactions mois
yarn admin:export --type=transactions --period=2025-10 --format=csv

# Classements catégorie
yarn admin:export --type=rankings --category=livres --period=2025-10
```

**Rollback déploiement** :
```bash
# Rollback automatique
make rollback

# Rollback vers version spécifique
./scripts/quick-rollback.sh v2.5.8
```

---

## ❓ FAQ TECHNIQUES

### Q1 : Que se passe-t-il si un pot net est négatif ?

**R** : Impossible par design. Le pot net = somme investissements − frais Stripe. Minimum théorique = 0 €.  
Si aucun investissement → cycle non clôturé (seuil minimum configurable, ex. 100 €).

---

### Q2 : Comment gérer les ex-aequo au vote ?

**R** : 
1. **Départage 1** : Somme engagements (likes + shares + comments)
2. **Départage 2** : Ancienneté du premier vote (timestamp ASC)
3. **Si toujours égalité** : Les deux cibles partagent équitablement la part

---

### Q3 : Le cap 20 % Podcasts s'applique-t-il avant ou après calcul ?

**R** : **Avant distribution**. Le `weight_i` est plafonné, puis les parts sont recalculées pro-rata des weights plafonnés.

**Exemple** :
```
User A : 10000 votes (50 % du total) → capped à 4000 votes (20 %)
User B : 8000 votes (40 %) → conserve 8000 votes
User C : 2000 votes (10 %) → conserve 2000 votes

Nouvelle base : 14000 votes (4000 + 8000 + 2000)
Parts recalculées sur cette base.
```

---

### Q4 : Les frais Stripe sont-ils déduits avant ou après répartition ?

**R** : **Avant**. 

```
pot_gross = Σ investissements
stripe_fees = pot_gross × 0.029 + 0.25 € (estimation)
pot_net = pot_gross - stripe_fees

Répartitions appliquées sur pot_net uniquement.
```

---

### Q5 : Peut-on modifier les formules en production ?

**R** : ⚠️ **Non recommandé** sauf :
- Migration majeure (avec période de transition)
- Correction bug critique (avec rollback plan)

**Process sécurisé** :
1. Feature flag pour nouvelle formule
2. Phase A/B testing (ex. 10 % utilisateurs)
3. Comparaison résultats ancien/nouveau
4. Migration progressive (30 jours)
5. Archive anciennes formules (audit)

---

### Q6 : Comment auditer les calculs de répartition ?

**R** : Table `payout_audit` :

```sql
CREATE TABLE payout_audit (
  id UUID PRIMARY KEY,
  cycle_id UUID NOT NULL,
  category VARCHAR(50) NOT NULL,
  formula_version VARCHAR(20) NOT NULL,
  pot_gross DECIMAL(10,2) NOT NULL,
  pot_net DECIMAL(10,2) NOT NULL,
  stripe_fees DECIMAL(10,2) NOT NULL,
  payouts JSONB NOT NULL, -- Détail par target
  residue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vérification somme
SELECT 
  cycle_id,
  pot_net,
  SUM((payout->>'amount')::DECIMAL) as total_paid,
  pot_net - SUM((payout->>'amount')::DECIMAL) as delta
FROM payout_audit, jsonb_array_elements(payouts) as payout
GROUP BY cycle_id, pot_net
HAVING ABS(pot_net - SUM((payout->>'amount')::DECIMAL)) > 0.01;
```

---

## 🎓 GLOSSAIRE

**CAP** : Plafond appliqué pour limiter la part d'un acteur (anti-monopole).

**Complétion** : Pourcentage moyen de lecture/écoute d'un contenu (0 à 1).

**Équiparti** : Distribution en parts égales (montant / nombre de bénéficiaires).

**Escrow** : Séquestre de fonds jusqu'à validation d'une transaction.

**GMV** : Gross Merchandise Value, volume total échangé sur la plateforme.

**Idempotence** : Propriété garantissant qu'une opération exécutée N fois produit le même résultat qu'une seule fois (crucial pour webhooks).

**KYC** : Know Your Customer, vérification d'identité réglementaire.

**Listen Score** : Métrique Podcasts combinant complétion et auditeurs uniques.

**Pot net** : Montant disponible pour distribution après déduction de tous les frais.

**Pro-rata** : Distribution proportionnelle à un poids (votes, score, montant).

**Repêchage** : Mécanisme permettant aux rangs 11-100 de repasser au cycle suivant via ticket payant.

**Résidu** : Différence due aux arrondis entre pot net et somme des parts distribuées (affecté à VISUAL).

**RLS** : Row Level Security, sécurité au niveau des lignes PostgreSQL.

**Settlement** : Processus de règlement financier (calcul + paiements).

**Take rate** : Pourcentage prélevé par la plateforme sur les transactions.

**VISUpoints** : Monnaie virtuelle interne (100 VP = 1 €), utilisée pour récompenses et pouvoir de vote.

**Webhook** : Notification HTTP automatique d'un événement (ex. paiement Stripe confirmé).

---

## 📞 CONTACTS & SUPPORT

**Équipe Technique** : dev@visual-platform.com  
**Support Admin** : admin@visual-platform.com  
**RGPD / DPO** : rgpd@visual-platform.com  
**Urgences Production** : +33 X XX XX XX XX (PagerDuty)

**Documentation Complète** : https://docs.visual-platform.com  
**Status Page** : https://status.visual-platform.com  
**GitHub** : https://github.com/visual-org/platform

---

## 📄 CHANGELOG

**v2025-10-24** :
- ✅ Ajout formule Podcasts 40/30/20/10 avec `listen_score`
- ✅ Clarification VSLS 40/10/40/10 + règles anti-abus
- ✅ Détail modèle économique Petites Annonces (4 revenus)
- ✅ Spécification cap 20 % Podcasts (anti-capture)
- ✅ Ajout cycle quotidien Voix de l'Info (J → J+1 00:15)
- ✅ Précision système repêchage Livres (25 €, 24h)
- ✅ Pseudo-code settlement complet
- ✅ Check-list déploiement exhaustive
- ✅ Tableaux récapitulatifs + glossaire

**v2.6** (Janvier 2025) :
- Système Livres complet (queue 10K auteurs)
- Toggles catégories/rubriques (7+1)
- Middleware auth centralisé

**v2.5** :
- Formule 40/30/23/7 Films/Vidéos/Docs stabilisée
- Barème commun 2-20 € → 1-10 votes

---

## ✅ VALIDATION FINALE

**Document validé par** :
- [ ] Lead Developer
- [ ] Product Manager
- [ ] CFO (Formules financières)
- [ ] Legal (RGPD, conformité)
- [ ] QA Lead (Tests coverage)

**Date validation** : _____________________

**Signature** : _____________________

---

**FIN DU DOCUMENT**

*Ce document constitue la référence officielle pour l'implémentation des formules mathématiques et répartitions de la plateforme VISUAL.*

*Toute modification doit faire l'objet d'une validation et d'une nouvelle version.*

**Version** : 2025-10-24  
**Statut** : ✅ VALIDÉ POUR DÉPLOIEMENT  
**Prochain audit** : 2025-11-24