# Guide d'Utilisation du Logger Structuré VISUAL

## 📋 Introduction

Le logger structuré remplace progressivement `console.log/error/warn` pour offrir :
- ✅ Niveaux de logs environnementaux (DEBUG en dev, INFO+ en prod)
- ✅ Masquage automatique des données sensibles (tokens, passwords, keys)
- ✅ Format structuré avec timestamps et contexte
- ✅ Child loggers avec contexte préservé

## 🚀 Usage Basique

### Import
\`\`\`typescript
import { logger } from './config/logger';
\`\`\`

### Méthodes Disponibles

\`\`\`typescript
// DEBUG - Développement uniquement
logger.debug('User fetched from database', { userId: '123' });

// INFO - Messages informatifs
logger.info('Payment processed successfully', 
  { userId: '123', amount: 50.00 },
  { paymentId: 'pi_xxx' }
);

// WARN - Avertissements
logger.warn('Rate limit approaching', { userId: '123', requests: 95 });

// ERROR - Erreurs récupérables
logger.error('Failed to send email', 
  new Error('SMTP connection timeout'),
  { userId: '123' }
);

// CRITICAL - Erreurs critiques (toujours loggées)
logger.critical('Database connection lost', 
  new Error('Connection refused'),
  { dbHost: 'postgres.example.com' }
);
\`\`\`

## 🔒 Masquage Automatique des Données Sensibles

Le logger masque automatiquement :
- `password`, `secret`, `token`, `apiKey`, `api_key`
- `authorization`, `stripe_key`, `access_token`, `refresh_token`
- Toute clé contenant ces termes (insensible à la casse)

\`\`\`typescript
// ❌ AVANT (dangereux)
console.log('User login:', { email, password, token });
// Output: User login: { email: 'user@example.com', password: 'secret123', token: 'abc...' }

// ✅ APRÈS (sécurisé)
logger.info('User login', { email, password, token });
// Output: [2025-10-01T20:00:00.000Z] [INFO] User login | Context: {"email":"user@example.com","password":"****","token":"abc****xyz"}
\`\`\`

## 👶 Child Loggers avec Contexte

Créez des loggers avec contexte préservé pour les requêtes :

\`\`\`typescript
import { createRequestLogger } from './config/logger';

// Dans une route Express
app.get('/api/users/:id', async (req, res) => {
  const reqLogger = createRequestLogger(req);
  
  reqLogger.info('Fetching user');
  // [2025-10-01T20:00:00.000Z] [INFO] Fetching user | Context: {"requestId":"xxx","method":"GET","path":"/api/users/123","ip":"192.168.1.1","userId":"user_abc","sessionId":"sess_xyz"}
  
  try {
    const user = await getUser(req.params.id);
    reqLogger.info('User fetched successfully', { userId: user.id });
  } catch (error) {
    reqLogger.error('Failed to fetch user', error);
  }
});
\`\`\`

## 🔄 Migration Depuis console.log

### AVANT
\`\`\`typescript
console.log('[Stripe] Payment processed:', paymentIntent.id);
console.error('Database error:', error);
console.warn('Rate limit exceeded for user:', userId);
\`\`\`

### APRÈS
\`\`\`typescript
import { logger } from './config/logger';

logger.info('Payment processed', { service: 'Stripe', paymentIntentId: paymentIntent.id });
logger.error('Database error', error, { operation: 'user.create' });
logger.warn('Rate limit exceeded', { userId, currentCount: 105 });
\`\`\`

## 📊 Exemples par Cas d'Usage

### Service Business Logic
\`\`\`typescript
// server/services/paymentService.ts
import { logger } from '../config/logger';

export async function processPayment(userId: string, amount: number) {
  logger.info('Processing payment', { userId, amount });
  
  try {
    const payment = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'eur',
    });
    
    logger.info('Payment intent created', 
      { userId, amount },
      { paymentIntentId: payment.id, status: payment.status }
    );
    
    return payment;
  } catch (error) {
    logger.error('Payment processing failed', 
      error as Error,
      { userId, amount }
    );
    throw error;
  }
}
\`\`\`

### Routes API
\`\`\`typescript
// server/routes.ts
import { logger, createRequestLogger } from './config/logger';

app.post('/api/investments', requireAuth, async (req, res) => {
  const reqLogger = createRequestLogger(req);
  
  reqLogger.info('Investment request received', { body: req.body });
  
  try {
    const investment = await createInvestment(req.user.id, req.body);
    reqLogger.info('Investment created', { investmentId: investment.id });
    res.json(investment);
  } catch (error) {
    reqLogger.error('Investment creation failed', error as Error);
    res.status(500).json({ error: 'Failed to create investment' });
  }
});
\`\`\`

### WebSocket Events
\`\`\`typescript
// server/websocket.ts
import { logger } from './config/logger';

socket.on('join_room', (roomId) => {
  logger.debug('User joining room', 
    { socketId: socket.id, roomId, userId: socket.data.userId }
  );
  
  socket.join(roomId);
  
  logger.info('User joined room successfully', 
    { socketId: socket.id, roomId }
  );
});
\`\`\`

### Scheduled Jobs
\`\`\`typescript
// server/services/scheduler.ts
import { logger } from '../config/logger';

export async function runDailyCleanup() {
  const jobLogger = logger.child({ job: 'daily_cleanup', timestamp: new Date() });
  
  jobLogger.info('Starting daily cleanup job');
  
  try {
    const deleted = await cleanupExpiredSessions();
    jobLogger.info('Cleanup completed', { deletedSessions: deleted });
  } catch (error) {
    jobLogger.error('Cleanup job failed', error as Error);
  }
}
\`\`\`

## 🎯 Priorité de Migration

1. **URGENT** - Services critiques avec données sensibles :
   - `server/services/stripeWebhooks.ts`
   - `server/services/ebookLicenseService.ts`
   - `server/services/bunnyTokenService.ts`
   - `server/replitAuth.ts`

2. **HAUTE** - Routes API et middleware :
   - `server/routes.ts`
   - `server/middleware/security.ts`
   - `server/services/adminRoutes.ts`

3. **MOYENNE** - Services métier :
   - `server/services/visualAI.ts`
   - `server/services/liveShowWeeklyOrchestrator.ts`
   - `server/storage.ts`

4. **BASSE** - Services d'affichage et utils :
   - `server/services/highlightsService.ts`
   - `server/services/gdprService.ts`

## ⚠️ Notes Importantes

- **Ne PAS supprimer les logs existants d'un coup** - Migrer progressivement
- **Garder les logs de démarrage critiques** - Ils sont utiles pour le debugging
- **Tester après migration** - Vérifier que les logs apparaissent correctement
- **En production** - Seuls INFO, WARN, ERROR, CRITICAL apparaîtront
- **Child loggers** - Préférer pour les requêtes HTTP avec contexte

## 📝 Checklist de Migration

Pour chaque fichier :
- [ ] Importer `logger` ou `createRequestLogger`
- [ ] Remplacer `console.log` → `logger.info`
- [ ] Remplacer `console.error` → `logger.error`
- [ ] Remplacer `console.warn` → `logger.warn`
- [ ] Ajouter contexte et données structurées
- [ ] Tester que les logs apparaissent correctement
- [ ] Vérifier que les données sensibles sont masquées
