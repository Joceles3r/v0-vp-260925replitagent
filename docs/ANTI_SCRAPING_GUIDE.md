# Guide Anti-Scraping - VISUAL Platform

## Vue d'ensemble

VISUAL Platform implémente une protection anti-scraping multi-couches pour protéger les données et prévenir les abus.

## Couches de Protection

### 1. reCAPTCHA v3

**Fonctionnement** : Analyse le comportement de l'utilisateur en arrière-plan sans interaction.

**Score** : 0.0 (bot) à 1.0 (humain)

**Seuils** :
- Général : 0.5
- Endpoints sensibles : 0.7
- Endpoints critiques : 0.9

**Configuration** :
\`\`\`bash
RECAPTCHA_SECRET_KEY=your_secret_key
RECAPTCHA_SITE_KEY=your_site_key
\`\`\`

**Utilisation** :
\`\`\`typescript
import { requireRecaptcha } from '@/services/recaptchaService';

// Middleware simple
app.post('/api/invest', requireRecaptcha(), handler);

// Avec seuil personnalisé
app.post('/api/admin/action', requireRecaptcha WithThreshold(0.9), handler);
\`\`\`

### 2. Device Fingerprinting

**Fonctionnement** : Crée une empreinte unique du navigateur basée sur :
- Canvas fingerprint
- WebGL fingerprint
- Fonts installées
- Audio context
- Screen resolution
- Timezone
- Plugins
- User-Agent

**Détection** :
- Headless browsers (pas de canvas/webgl)
- Bots (User-Agent suspects)
- VPN/Proxies (IP ranges)
- Patterns de navigation suspects

**Utilisation** :
\`\`\`typescript
import { requireFingerprint } from '@/services/fingerprintService';

app.post('/api/search', requireFingerprint(), handler);
\`\`\`

### 3. Rate Limiting

**Niveaux** :
- **Général** : 100 req/15min
- **Auth** : 5 req/15min
- **Sensible** : 20 req/min
- **Upload** : 5 req/heure

**Headers de réponse** :
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
\`\`\`

### 4. Bot Detection

**Patterns détectés** :
- User-Agents suspects (curl, wget, python, scrapy, etc.)
- Requêtes trop régulières (variance < 100ms)
- Fréquence anormale (>100 req/5min)
- Absence de JavaScript
- Headers manquants

**Actions** :
- Blocage temporaire (24h par défaut)
- Logging des activités suspectes
- Alertes admin

## Middleware Anti-Scraping

### Configuration par Endpoint

\`\`\`typescript
import { antiScraping, antiScrapingLight, antiScrapingStrict } from '@/middleware/antiScrapingMiddleware';

// Léger (fingerprint + bot detection)
app.get('/api/public/data', antiScrapingLight(), handler);

// Standard (reCAPTCHA + fingerprint + bot detection)
app.post('/api/invest', antiScraping(), handler);

// Strict (reCAPTCHA 0.7+ + fingerprint + bot detection)
app.post('/api/admin/sensitive', antiScrapingStrict(), handler);
\`\`\`

### Options Personnalisées

\`\`\`typescript
app.post('/api/custom', antiScraping({
  requireRecaptcha: true,
  recaptchaThreshold: 0.6,
  requireFingerprint: true,
  checkBotPatterns: true,
  logSuspicious: true
}), handler);
\`\`\`

## Intégration Frontend

### 1. Installer FingerprintJS

\`\`\`bash
npm install @fingerprintjs/fingerprintjs
\`\`\`

### 2. Initialiser au démarrage

\`\`\`typescript
import { initFingerprint } from '@/services/fingerprintClient';

// Dans App.tsx ou _app.tsx
useEffect(() => {
  initFingerprint();
}, []);
\`\`\`

### 3. Ajouter les headers aux requêtes

\`\`\`typescript
import { generateFingerprintData } from '@/services/fingerprintClient';

const fingerprintData = await generateFingerprintData();

fetch('/api/invest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Fingerprint-Data': fingerprintData,
    'X-reCAPTCHA-Token': recaptchaToken
  },
  body: JSON.stringify(data)
});
\`\`\`

### 4. Hook React

\`\`\`typescript
import { useFingerprintHeaders } from '@/services/fingerprintClient';

function MyComponent() {
  const fingerprintHeaders = useFingerprintHeaders();
  
  const handleSubmit = async () => {
    await fetch('/api/action', {
      headers: {
        ...fingerprintHeaders,
        'X-reCAPTCHA-Token': await getRecaptchaToken()
      }
    });
  };
}
\`\`\`

## Monitoring

### Métriques à Surveiller

1. **Taux de blocage** : % de requêtes bloquées
2. **Score reCAPTCHA moyen** : Doit être > 0.7
3. **Devices bloqués** : Nombre d'appareils en liste noire
4. **Activités suspectes** : Nombre d'alertes par jour

### Logs

\`\`\`typescript
// Activité suspecte
[AntiScraping] Suspicious activity detected: {
  visitorId: "abc123",
  ip: "1.2.3.4",
  path: "/api/search",
  activities: [...]
}

// Device bloqué
[Fingerprint] Blocked device abc123 for 86400000ms: Multiple high-severity suspicious activities

// reCAPTCHA échoué
[AntiScraping] reCAPTCHA failed: {
  ip: "1.2.3.4",
  path: "/api/invest",
  score: 0.3,
  reason: "low_score"
}
\`\`\`

## Tests

### Test reCAPTCHA

\`\`\`bash
curl -X POST https://visual.com/api/test \\
  -H "X-reCAPTCHA-Token: test_token"
\`\`\`

### Test Fingerprint

\`\`\`bash
curl -X POST https://visual.com/api/test \\
  -H "X-Fingerprint-Data: {\"visitorId\":\"test123\",...}"
\`\`\`

### Test Bot Detection

\`\`\`bash
curl -X GET https://visual.com/api/test \\
  -H "User-Agent: python-requests/2.28.0"
# Devrait retourner 403 BOT_DETECTED
\`\`\`

## Troubleshooting

### Faux Positifs

**Symptôme** : Utilisateurs légitimes bloqués

**Solutions** :
1. Réduire le seuil reCAPTCHA (0.5 → 0.3)
2. Whitelist des IPs spécifiques
3. Augmenter la tolérance du fingerprinting

### Faux Négatifs

**Symptôme** : Bots passent la protection

**Solutions** :
1. Augmenter le seuil reCAPTCHA (0.5 → 0.7)
2. Activer le fingerprinting strict
3. Ajouter des patterns de bot personnalisés

## Maintenance

### Mise à Jour des Patterns

\`\`\`typescript
// server/services/fingerprintService.ts
const SUSPICIOUS_USER_AGENTS = [
  // Ajouter de nouveaux patterns
  /newbot/i,
  /newscraper/i
];
\`\`\`

### Déblocage Manuel

\`\`\`typescript
import { storage } from '@/storage';

// Débloquer un device
await storage.unblockDevice('visitorId123');
\`\`\`

### Nettoyage des Données

\`\`\`bash
# Script cron pour nettoyer les anciennes activités
0 2 * * * node scripts/cleanup-suspicious-activities.js
\`\`\`
