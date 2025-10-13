# Guide de Backup et Plan de Contingence - VISUAL Platform

## Vue d'ensemble

VISUAL Platform implémente un système de backup automatique et de rollback pour garantir la continuité de service et la récupération rapide en cas d'incident.

## Architecture

### Composants

1. **Scripts Bash**
   - `scripts/auto-backup.sh` : Backup automatique complet
   - `scripts/auto-rollback.sh` : Rollback automatique avec health check

2. **Services Node.js**
   - `server/services/backupService.ts` : API de gestion des backups
   - `server/routes/backupRoutes.ts` : Endpoints REST pour les backups

3. **Automatisation**
   - Backup quotidien automatique (24h)
   - Health check toutes les 5 minutes
   - Cleanup hebdomadaire des anciens backups (30 jours)

## Configuration

### Variables d'Environnement

\`\`\`bash
# Répertoire de stockage des backups
BACKUP_DIR=/backups

# Base de données
DATABASE_NAME=visual_db
DATABASE_USER=postgres

# Rétention des backups (jours)
BACKUP_RETENTION_DAYS=30

# Health check
HEALTH_CHECK_URL=http://localhost:5000/healthz

# Webhooks (optionnel)
BACKUP_WEBHOOK_URL=https://hooks.slack.com/services/...
ROLLBACK_WEBHOOK_URL=https://hooks.slack.com/services/...
\`\`\`

### Permissions

\`\`\`bash
# Rendre les scripts exécutables
chmod +x scripts/auto-backup.sh
chmod +x scripts/auto-rollback.sh

# Créer le répertoire de backup
mkdir -p /backups
chown -R app:app /backups
\`\`\`

## Utilisation

### Backup Manuel

#### Via Script Bash

\`\`\`bash
# Créer un backup immédiat
bash scripts/auto-backup.sh

# Avec variables personnalisées
BACKUP_DIR=/custom/path bash scripts/auto-backup.sh
\`\`\`

#### Via API

\`\`\`bash
# Créer un backup
curl -X POST https://visual.com/api/backups \\
  -H "X-API-Token: your_admin_token"

# Réponse
{
  "success": true,
  "message": "Backup créé avec succès",
  "backup": {
    "filename": "visual_backup_2025-01-15_14-30-00.tar.gz",
    "size": 524288000,
    "sizeFormatted": "500 MB",
    "created": "2025-01-15T14:30:00.000Z"
  }
}
\`\`\`

### Lister les Backups

\`\`\`bash
curl -X GET https://visual.com/api/backups \\
  -H "X-API-Token: your_admin_token"

# Réponse
{
  "success": true,
  "count": 15,
  "backups": [
    {
      "filename": "visual_backup_2025-01-15_14-30-00.tar.gz",
      "size": 524288000,
      "sizeFormatted": "500 MB",
      "created": "2025-01-15T14:30:00.000Z",
      "age": "2h"
    },
    ...
  ]
}
\`\`\`

### Restaurer un Backup

#### Via Script Bash

\`\`\`bash
# Restaurer le dernier backup
bash scripts/auto-rollback.sh

# Restaurer un backup spécifique
LATEST_BACKUP=/backups/visual_backup_2025-01-15_14-30-00.tar.gz \\
  bash scripts/auto-rollback.sh
\`\`\`

#### Via API

\`\`\`bash
# Restaurer un backup spécifique
curl -X POST https://visual.com/api/backups/visual_backup_2025-01-15_14-30-00.tar.gz/restore \\
  -H "X-API-Token: your_admin_token"

# Réponse
{
  "success": true,
  "message": "Restauration démarrée en arrière-plan",
  "warning": "L'application va redémarrer dans quelques instants"
}
\`\`\`

⚠️ **Attention** : La restauration redémarre l'application automatiquement.

### Rollback Automatique

Le système vérifie automatiquement la santé de l'application toutes les 5 minutes et déclenche un rollback si nécessaire.

#### Déclencher Manuellement

\`\`\`bash
# Via API
curl -X POST https://visual.com/api/backups/rollback/auto \\
  -H "X-API-Token: your_admin_token"

# Réponse
{
  "success": true,
  "rolledBack": true,
  "message": "Rollback effectué avec succès"
}
\`\`\`

### Supprimer un Backup

\`\`\`bash
curl -X DELETE https://visual.com/api/backups/visual_backup_2025-01-15_14-30-00.tar.gz \\
  -H "X-API-Token: your_admin_token"

# Réponse
{
  "success": true,
  "message": "Backup supprimé avec succès"
}
\`\`\`

### Cleanup Automatique

\`\`\`bash
# Supprimer les backups de plus de 30 jours
curl -X POST https://visual.com/api/backups/cleanup \\
  -H "X-API-Token: your_admin_token" \\
  -H "Content-Type: application/json" \\
  -d '{"retentionDays": 30}'

# Réponse
{
  "success": true,
  "message": "5 backups supprimés",
  "deletedCount": 5
}
\`\`\`

## Contenu des Backups

Chaque backup contient :

1. **Base de données** : Dump PostgreSQL complet (format custom)
2. **Fichiers uploadés** : Tous les fichiers dans `/app/uploads`
3. **Configuration** : Fichier `.env` (sauvegardé comme `.env.backup`)
4. **Métadonnées** : Informations sur le backup (version, timestamp, taille)

### Structure d'un Backup

\`\`\`
visual_backup_2025-01-15_14-30-00/
├── database.dump          # Dump PostgreSQL
├── uploads.tar.gz         # Fichiers uploadés
├── .env.backup            # Configuration
├── package.json           # Dépendances
├── package-lock.json      # Lock file
└── metadata.json          # Métadonnées
\`\`\`

### Métadonnées

\`\`\`json
{
  "timestamp": "2025-01-15_14-30-00",
  "database": "visual_db",
  "version": "1.5.0",
  "node_version": "v20.10.0",
  "backup_size": "500 MB"
}
\`\`\`

## Automatisation

### Tâches Programmées

Le système configure automatiquement les tâches suivantes au démarrage :

1. **Backup quotidien** : Tous les jours à minuit
2. **Health check** : Toutes les 5 minutes
3. **Cleanup** : Tous les 7 jours

### Logs

Les logs sont disponibles dans la console de l'application :

\`\`\`
[Backup] Starting scheduled backup...
[Backup] Backup created successfully: visual_backup_2025-01-15_14-30-00.tar.gz
[Backup] Scheduled backup completed successfully

[Backup] Checking if rollback is needed...
[Backup] Application is healthy, no rollback needed

[Backup] Starting cleanup of old backups...
[Backup] Cleanup completed: 5 old backups removed
\`\`\`

## Health Check

### Endpoint

\`\`\`bash
# Vérifier la santé de l'application
curl https://visual.com/healthz

# Réponse (healthy)
{
  "status": "ok",
  "timestamp": "2025-01-15T14:30:00.000Z"
}

# Réponse (unhealthy)
HTTP 503 Service Unavailable
\`\`\`

### Critères de Santé

L'application est considérée comme "saine" si :
- Le endpoint `/healthz` répond avec un status 200
- La réponse est reçue dans les 10 secondes
- Pas d'erreur réseau

### Rollback Automatique

Si le health check échoue 3 fois consécutives :
1. Le système identifie le dernier backup valide
2. Arrête l'application
3. Restaure la base de données
4. Restaure les fichiers
5. Redémarre l'application
6. Vérifie à nouveau la santé

## Scénarios de Récupération

### Scénario 1 : Déploiement Raté

**Symptômes** : Application ne démarre pas après un déploiement

**Solution** :
\`\`\`bash
# 1. Vérifier les logs
docker logs visual-platform

# 2. Déclencher un rollback automatique
curl -X POST https://visual.com/api/backups/rollback/auto \\
  -H "X-API-Token: your_admin_token"

# 3. Vérifier la santé
curl https://visual.com/healthz
\`\`\`

### Scénario 2 : Corruption de Base de Données

**Symptômes** : Erreurs SQL, données incohérentes

**Solution** :
\`\`\`bash
# 1. Créer un backup de l'état actuel (pour investigation)
curl -X POST https://visual.com/api/backups \\
  -H "X-API-Token: your_admin_token"

# 2. Restaurer le dernier backup sain
curl -X POST https://visual.com/api/backups/visual_backup_2025-01-14_00-00-00.tar.gz/restore \\
  -H "X-API-Token: your_admin_token"

# 3. Attendre le redémarrage (30s)
sleep 30

# 4. Vérifier la santé
curl https://visual.com/healthz
\`\`\`

### Scénario 3 : Perte de Données

**Symptômes** : Fichiers manquants, données supprimées

**Solution** :
\`\`\`bash
# 1. Identifier le dernier backup avant la perte
curl -X GET https://visual.com/api/backups \\
  -H "X-API-Token: your_admin_token"

# 2. Restaurer ce backup
curl -X POST https://visual.com/api/backups/visual_backup_2025-01-13_14-00-00.tar.gz/restore \\
  -H "X-API-Token: your_admin_token"
\`\`\`

### Scénario 4 : Disaster Recovery

**Symptômes** : Serveur complètement inaccessible

**Solution** :
\`\`\`bash
# 1. Provisionner un nouveau serveur
# 2. Installer l'application
# 3. Copier les backups depuis le stockage distant
aws s3 sync s3://visual-backups /backups

# 4. Restaurer le dernier backup
bash scripts/auto-rollback.sh

# 5. Démarrer l'application
docker-compose up -d
\`\`\`

## Monitoring

### Métriques à Surveiller

1. **Taille des backups** : Doit augmenter progressivement
2. **Durée des backups** : Doit rester < 5 minutes
3. **Taux de réussite** : Doit être 100%
4. **Espace disque** : Doit avoir au moins 2x la taille du dernier backup

### Alertes Recommandées

\`\`\`yaml
# Backup échoué
- alert: BackupFailed
  expr: backup_success == 0
  for: 5m
  annotations:
    summary: "Backup automatique échoué"

# Espace disque faible
- alert: BackupDiskSpaceLow
  expr: disk_free_bytes < 10GB
  for: 10m
  annotations:
    summary: "Espace disque insuffisant pour les backups"

# Rollback déclenché
- alert: AutoRollbackTriggered
  expr: rollback_count > 0
  for: 1m
  annotations:
    summary: "Rollback automatique déclenché"
\`\`\`

## Sécurité

### Protection des Backups

1. **Chiffrement** : Les backups doivent être chiffrés au repos
2. **Accès restreint** : Seuls les admins peuvent accéder aux backups
3. **Stockage distant** : Copier les backups vers S3/GCS
4. **Rotation** : Supprimer automatiquement les anciens backups

### Token d'API

\`\`\`bash
# Générer un token admin
API_ADMIN_TOKEN=$(openssl rand -hex 32)

# Ajouter au .env
echo "API_ADMIN_TOKEN=${API_ADMIN_TOKEN}" >> .env

# Utiliser dans les requêtes
curl -H "X-API-Token: ${API_ADMIN_TOKEN}" ...
\`\`\`

## Troubleshooting

### Backup Échoue

**Erreur** : `pg_dump: error: connection to database failed`

**Solution** :
\`\`\`bash
# Vérifier la connexion à la base de données
psql -U postgres -d visual_db -c "SELECT 1"

# Vérifier les variables d'environnement
echo $DATABASE_NAME
echo $DATABASE_USER
\`\`\`

### Rollback Échoue

**Erreur** : `pg_restore: error: could not execute query`

**Solution** :
\`\`\`bash
# Vérifier l'intégrité du backup
tar -tzf /backups/visual_backup_*.tar.gz

# Essayer avec un backup plus ancien
LATEST_BACKUP=/backups/visual_backup_2025-01-14_00-00-00.tar.gz \\
  bash scripts/auto-rollback.sh
\`\`\`

### Espace Disque Insuffisant

**Erreur** : `No space left on device`

**Solution** :
\`\`\`bash
# Nettoyer les anciens backups immédiatement
curl -X POST https://visual.com/api/backups/cleanup \\
  -H "X-API-Token: your_admin_token" \\
  -d '{"retentionDays": 7}'

# Ou manuellement
find /backups -name "visual_backup_*.tar.gz" -mtime +7 -delete
\`\`\`

## Best Practices

1. **Tester les backups** : Restaurer régulièrement pour vérifier l'intégrité
2. **Stockage distant** : Copier les backups vers un stockage cloud
3. **Documentation** : Maintenir une liste des backups critiques
4. **Monitoring** : Surveiller les métriques de backup
5. **Automatisation** : Ne jamais compter uniquement sur les backups manuels
6. **Rétention** : Garder au moins 30 jours de backups
7. **Chiffrement** : Chiffrer les backups sensibles
8. **Tests de DR** : Simuler des scénarios de disaster recovery

## Intégration CI/CD

### GitHub Actions

\`\`\`yaml
name: Backup Before Deploy

on:
  push:
    branches: [main]

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Create backup before deployment
        run: |
          curl -X POST https://visual.com/api/backups \\
            -H "X-API-Token: ${{ secrets.API_ADMIN_TOKEN }}"
      
      - name: Wait for backup
        run: sleep 60
      
      - name: Deploy application
        run: ./deploy.sh
      
      - name: Health check
        run: |
          curl https://visual.com/healthz || \\
          curl -X POST https://visual.com/api/backups/rollback/auto \\
            -H "X-API-Token: ${{ secrets.API_ADMIN_TOKEN }}"
\`\`\`
