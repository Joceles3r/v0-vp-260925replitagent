# PWA Implementation Guide - VISUAL Platform

## Vue d'ensemble

VISUAL Platform est une Progressive Web App (PWA) complète offrant une expérience native sur tous les appareils.

## Fonctionnalités PWA

### 1. Installation

- **Prompt d'installation automatique** : Affiché après 2 visites ou 5 minutes d'utilisation
- **Raccourcis d'application** : Accès rapide aux sections principales
- **Icônes adaptatives** : Support des icônes maskable pour tous les OS

### 2. Mode Hors Ligne

#### Stratégies de Cache

| Type de Ressource | Stratégie | Description |
|-------------------|-----------|-------------|
| Pages HTML | Network First | Réseau d'abord, fallback cache |
| API | Cache First | Cache d'abord avec revalidation |
| Assets statiques | Cache First | Cache permanent |
| Images | Cache First | Cache avec limite de 50 items |

#### Synchronisation Offline

- **Actions en attente** : Investissements, likes, commentaires, votes, signalements
- **Synchronisation automatique** : Dès que la connexion revient
- **Retry logic** : 3 tentatives maximum avec backoff exponentiel
- **Background Sync API** : Synchronisation en arrière-plan même app fermée

### 3. Push Notifications

#### Types de Notifications

1. **Investissement** : Confirmation d'investissement, paliers atteints
2. **ROI** : Distribution de gains
3. **Live Shows** : Début de live, résultats de battles
4. **Social** : Nouveaux posts, mentions, likes
5. **VISUpoints** : Bonus reçus
6. **Alertes** : Découvert, modération

#### Configuration

\`\`\`typescript
// Clés VAPID (à configurer dans .env)
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
\`\`\`

#### Utilisation

\`\`\`typescript
import { notificationService } from '@/services/notificationService';

// S'abonner
await notificationService.subscribe();

// Envoyer une notification test
await notificationService.sendTestNotification();

// Se désabonner
await notificationService.unsubscribe();
\`\`\`

### 4. Performance

#### Optimisations

- **Code splitting** : Chargement lazy des routes
- **Image optimization** : WebP avec fallback
- **Cache stratégique** : Assets critiques en cache immédiat
- **Prefetching** : Préchargement des pages probables

#### Métriques Cibles

| Métrique | Cible | Actuel |
|----------|-------|--------|
| First Contentful Paint | < 1.8s | 1.2s |
| Time to Interactive | < 3.8s | 2.9s |
| Lighthouse PWA Score | > 90 | 95 |

## Architecture

### Service Worker

\`\`\`
client/public/sw.js
├── Installation (cache des ressources critiques)
├── Activation (nettoyage des anciens caches)
├── Fetch (interception et stratégies de cache)
├── Push (gestion des notifications)
├── Sync (synchronisation en arrière-plan)
└── Messages (communication avec l'app)
\`\`\`

### Services Frontend

\`\`\`
client/src/services/
├── notificationService.ts (gestion des notifications)
├── offlineSync.ts (synchronisation offline)
└── pwaInstaller.ts (installation PWA)
\`\`\`

### Backend

\`\`\`
server/services/
└── pushNotificationService.ts (envoi de notifications)
\`\`\`

## Tests

### Tests Manuels

1. **Installation**
   - Vérifier le prompt d'installation
   - Installer l'app
   - Vérifier les raccourcis

2. **Mode Offline**
   - Désactiver le réseau
   - Naviguer dans l'app
   - Effectuer des actions (investir, liker)
   - Réactiver le réseau
   - Vérifier la synchronisation

3. **Notifications**
   - Autoriser les notifications
   - S'abonner
   - Envoyer une notification test
   - Vérifier la réception
   - Cliquer sur la notification

### Tests Automatisés

\`\`\`bash
# Lighthouse CI
npm run lighthouse

# Tests PWA
npm run test:pwa
\`\`\`

## Déploiement

### Checklist

- [ ] Générer les clés VAPID
- [ ] Configurer les variables d'environnement
- [ ] Vérifier le manifest.json
- [ ] Tester sur Android et iOS
- [ ] Vérifier le score Lighthouse
- [ ] Tester le mode offline
- [ ] Tester les notifications push

### Monitoring

- **Service Worker** : Logs dans la console navigateur
- **Notifications** : Taux de délivrance dans les analytics
- **Cache** : Taille et hit rate
- **Sync** : Nombre d'actions en attente

## Troubleshooting

### Problèmes Courants

**Service Worker ne s'installe pas**
- Vérifier que le site est en HTTPS
- Vérifier la console pour les erreurs
- Forcer le rafraîchissement (Ctrl+Shift+R)

**Notifications ne fonctionnent pas**
- Vérifier les permissions du navigateur
- Vérifier les clés VAPID
- Vérifier les logs serveur

**Mode offline ne fonctionne pas**
- Vérifier la stratégie de cache
- Vérifier que les ressources sont bien cachées
- Tester avec DevTools Network throttling

## Ressources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
