#!/bin/bash

# Script de rollback automatique pour VISUAL Platform
# Détecte les échecs et restaure automatiquement la dernière version stable

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DB_NAME="${DATABASE_NAME:-visual_db}"
DB_USER="${DATABASE_USER:-postgres}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:5000/healthz}"
MAX_RETRIES=3
RETRY_DELAY=10

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction de health check
check_health() {
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        log_info "Health check (tentative $((retries + 1))/${MAX_RETRIES})..."
        
        if curl -sf "${HEALTH_CHECK_URL}" > /dev/null 2>&1; then
            log_info "✓ Application en bonne santé"
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log_warn "Health check échoué, nouvelle tentative dans ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi
    done
    
    log_error "✗ Application en échec après ${MAX_RETRIES} tentatives"
    return 1
}

# Fonction de rollback
perform_rollback() {
    log_warn "🔄 Démarrage du rollback automatique..."
    
    # 1. Trouver le dernier backup valide
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/visual_backup_*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "${LATEST_BACKUP}" ]; then
        log_error "Aucun backup trouvé dans ${BACKUP_DIR}"
        exit 1
    fi
    
    log_info "Backup trouvé: $(basename ${LATEST_BACKUP})"
    
    # 2. Extraire le backup
    TEMP_DIR=$(mktemp -d)
    log_info "Extraction du backup dans ${TEMP_DIR}..."
    tar -xzf "${LATEST_BACKUP}" -C "${TEMP_DIR}"
    
    BACKUP_NAME=$(basename "${LATEST_BACKUP}" .tar.gz)
    
    # 3. Arrêter l'application
    log_info "Arrêt de l'application..."
    docker-compose stop visual-platform || systemctl stop visual-platform || true
    
    # 4. Restaurer la base de données
    log_info "Restauration de la base de données..."
    pg_restore -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists \
        "${TEMP_DIR}/${BACKUP_NAME}/database.dump"
    
    if [ $? -eq 0 ]; then
        log_info "✓ Base de données restaurée"
    else
        log_error "✗ Échec de la restauration de la base de données"
        exit 1
    fi
    
    # 5. Restaurer les fichiers uploadés
    if [ -f "${TEMP_DIR}/${BACKUP_NAME}/uploads.tar.gz" ]; then
        log_info "Restauration des fichiers uploadés..."
        tar -xzf "${TEMP_DIR}/${BACKUP_NAME}/uploads.tar.gz" -C /app/
        log_info "✓ Fichiers uploadés restaurés"
    fi
    
    # 6. Restaurer la configuration
    if [ -f "${TEMP_DIR}/${BACKUP_NAME}/.env.backup" ]; then
        log_info "Restauration de la configuration..."
        cp "${TEMP_DIR}/${BACKUP_NAME}/.env.backup" /app/.env
        log_info "✓ Configuration restaurée"
    fi
    
    # 7. Redémarrer l'application
    log_info "Redémarrage de l'application..."
    docker-compose up -d visual-platform || systemctl start visual-platform
    
    # 8. Attendre le démarrage
    log_info "Attente du démarrage (30s)..."
    sleep 30
    
    # 9. Vérifier la santé
    if check_health; then
        log_info "✅ Rollback réussi!"
        
        # Nettoyer
        rm -rf "${TEMP_DIR}"
        
        # Notification
        if [ -n "${ROLLBACK_WEBHOOK_URL}" ]; then
            curl -X POST "${ROLLBACK_WEBHOOK_URL}" \
                -H "Content-Type: application/json" \
                -d "{\"status\":\"success\",\"backup\":\"${BACKUP_NAME}\"}" \
                > /dev/null 2>&1
        fi
        
        return 0
    else
        log_error "✗ Rollback échoué, l'application ne répond toujours pas"
        rm -rf "${TEMP_DIR}"
        return 1
    fi
}

# Main
log_info "Vérification de la santé de l'application..."

if ! check_health; then
    log_warn "Application en échec détectée, rollback nécessaire"
    perform_rollback
    exit $?
else
    log_info "✓ Application en bonne santé, aucun rollback nécessaire"
    exit 0
fi
