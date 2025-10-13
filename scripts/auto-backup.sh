#!/bin/bash

# Script de backup automatique pour VISUAL Platform
# Sauvegarde la base de données, les fichiers et la configuration

set -e  # Arrêter en cas d'erreur

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_NAME="${DATABASE_NAME:-visual_db}"
DB_USER="${DATABASE_USER:-postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_NAME="visual_backup_${TIMESTAMP}"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Créer le répertoire de backup
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

log_info "Démarrage du backup: ${BACKUP_NAME}"

# 1. Backup de la base de données
log_info "Backup de la base de données..."
pg_dump -U "${DB_USER}" -d "${DB_NAME}" -F c -f "${BACKUP_DIR}/${BACKUP_NAME}/database.dump"

if [ $? -eq 0 ]; then
    log_info "✓ Base de données sauvegardée"
else
    log_error "✗ Échec du backup de la base de données"
    exit 1
fi

# 2. Backup des fichiers uploadés (si stockage local)
if [ -d "/app/uploads" ]; then
    log_info "Backup des fichiers uploadés..."
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/uploads.tar.gz" -C /app uploads/
    log_info "✓ Fichiers uploadés sauvegardés"
fi

# 3. Backup de la configuration
log_info "Backup de la configuration..."
cp /app/.env "${BACKUP_DIR}/${BACKUP_NAME}/.env.backup" 2>/dev/null || log_warn "Fichier .env non trouvé"
cp /app/package.json "${BACKUP_DIR}/${BACKUP_NAME}/package.json" 2>/dev/null
cp /app/package-lock.json "${BACKUP_DIR}/${BACKUP_NAME}/package-lock.json" 2>/dev/null

# 4. Créer un fichier de métadonnées
cat > "${BACKUP_DIR}/${BACKUP_NAME}/metadata.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "database": "${DB_NAME}",
  "version": "$(cat /app/package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')",
  "node_version": "$(node --version)",
  "backup_size": "$(du -sh ${BACKUP_DIR}/${BACKUP_NAME} | cut -f1)"
}
EOF

# 5. Compresser le backup
log_info "Compression du backup..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}/"
rm -rf "${BACKUP_NAME}/"

BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
log_info "✓ Backup compressé: ${BACKUP_SIZE}"

# 6. Nettoyer les anciens backups
log_info "Nettoyage des backups de plus de ${RETENTION_DAYS} jours..."
find "${BACKUP_DIR}" -name "visual_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete
log_info "✓ Anciens backups supprimés"

# 7. Vérifier l'intégrité du backup
log_info "Vérification de l'intégrité..."
tar -tzf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" > /dev/null

if [ $? -eq 0 ]; then
    log_info "✓ Backup vérifié et valide"
else
    log_error "✗ Backup corrompu!"
    exit 1
fi

# 8. Envoyer une notification (optionnel)
if [ -n "${BACKUP_WEBHOOK_URL}" ]; then
    curl -X POST "${BACKUP_WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -d "{\"status\":\"success\",\"backup\":\"${BACKUP_NAME}\",\"size\":\"${BACKUP_SIZE}\"}" \
        > /dev/null 2>&1
fi

log_info "✅ Backup terminé avec succès: ${BACKUP_NAME}.tar.gz"
