#!/usr/bin/env bash
# Script de sauvegarde PostgreSQL chiffrée pour VISUAL Platform
# Path: scripts/backup_database.sh
# Adapté du fichier backup_pg.sh fourni

set -euo pipefail

# ===== CONFIGURATION =====
: "${PGDATABASE:?Variable PGDATABASE requise}"
: "${PGUSER:?Variable PGUSER requise}" 
: "${PGPASSWORD:?Variable PGPASSWORD requise}"
: "${PGHOST:?Variable PGHOST requise}"
: "${GPG_PASSPHRASE:?Variable GPG_PASSPHRASE requise pour chiffrement}"

# Configuration par défaut
BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/visual_${PGDATABASE}_${TIMESTAMP}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"

# ===== FONCTIONS =====

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

cleanup() {
    local exit_code=$?
    if [[ -f "${BACKUP_FILE}" ]]; then
        log "Nettoyage du fichier non-chiffré..."
        shred -u "${BACKUP_FILE}" 2>/dev/null || rm -f "${BACKUP_FILE}"
    fi
    exit $exit_code
}

check_dependencies() {
    local missing=()
    
    if ! command -v pg_dump &> /dev/null; then
        missing+=("pg_dump")
    fi
    
    if ! command -v gpg &> /dev/null; then
        missing+=("gpg")
    fi
    
    if ! command -v shred &> /dev/null; then
        log "ATTENTION: shred non disponible, utilisation de rm"
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log "ERREUR: Dépendances manquantes: ${missing[*]}"
        exit 1
    fi
}

create_backup_dir() {
    if [[ ! -d "${BACKUP_DIR}" ]]; then
        log "Création du répertoire de sauvegarde: ${BACKUP_DIR}"
        mkdir -p "${BACKUP_DIR}"
    fi
}

dump_database() {
    log "Démarrage de la sauvegarde de ${PGDATABASE}..."
    log "Fichier de sortie: ${BACKUP_FILE}"
    
    # Options pg_dump optimisées pour VISUAL
    local PG_DUMP_OPTIONS=(
        --host="${PGHOST}"
        --username="${PGUSER}" 
        --format=plain
        --verbose
        --no-owner
        --no-privileges
        --create
        --clean
        --if-exists
        --quote-all-identifiers
    )
    
    # Exclure les tables temporaires et de session si nécessaire
    # --exclude-table=sessions
    
    PGPASSWORD="${PGPASSWORD}" pg_dump "${PG_DUMP_OPTIONS[@]}" "${PGDATABASE}" > "${BACKUP_FILE}"
    
    local backup_size=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "Sauvegarde terminée. Taille: ${backup_size}"
}

encrypt_backup() {
    log "Chiffrement avec GPG..."
    
    # Chiffrement symétrique AES-256
    echo "${GPG_PASSPHRASE}" | gpg \
        --batch \
        --yes \
        --passphrase-fd 0 \
        --cipher-algo AES256 \
        --compress-algo 2 \
        --s2k-mode 3 \
        --s2k-digest-algo SHA512 \
        --s2k-count 65536 \
        --symmetric \
        --output "${ENCRYPTED_FILE}" \
        "${BACKUP_FILE}"
    
    local encrypted_size=$(du -h "${ENCRYPTED_FILE}" | cut -f1)
    log "Chiffrement terminé. Taille finale: ${encrypted_size}"
}

cleanup_old_backups() {
    log "Nettoyage des anciennes sauvegardes (> ${RETENTION_DAYS} jours)..."
    
    # Supprimer les sauvegardes plus anciennes que RETENTION_DAYS
    find "${BACKUP_DIR}" -name "visual_*.sql.gpg" -type f -mtime +${RETENTION_DAYS} -print0 | \
        while IFS= read -r -d '' file; do
            log "Suppression de l'ancienne sauvegarde: $(basename "$file")"
            rm -f "$file"
        done
}

verify_backup() {
    log "Vérification de l'intégrité de la sauvegarde chiffrée..."
    
    # Test de déchiffrement (sans écrire le fichier)
    if echo "${GPG_PASSPHRASE}" | gpg \
        --batch \
        --quiet \
        --passphrase-fd 0 \
        --decrypt "${ENCRYPTED_FILE}" > /dev/null 2>&1; then
        log "✅ Sauvegarde vérifiée avec succès"
        return 0
    else
        log "❌ ERREUR: Échec de la vérification de la sauvegarde"
        return 1
    fi
}

show_backup_stats() {
    local backup_count=$(ls -1 "${BACKUP_DIR}"/visual_*.sql.gpg 2>/dev/null | wc -l)
    local total_size=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1 || echo "N/A")
    
    log "=== STATISTIQUES DE SAUVEGARDE ==="
    log "Nombre total de sauvegardes: ${backup_count}"
    log "Taille totale du répertoire: ${total_size}"
    log "Dernière sauvegarde: $(basename "${ENCRYPTED_FILE}")"
    log "==================================="
}

# ===== SCRIPT PRINCIPAL =====

main() {
    log "🚀 Démarrage de la sauvegarde chiffrée VISUAL Platform"
    
    # Configuration du trap pour nettoyage
    trap cleanup EXIT INT TERM
    
    # Vérifications préliminaires
    check_dependencies
    create_backup_dir
    
    # Processus de sauvegarde
    dump_database
    encrypt_backup
    
    # Nettoyage et vérification
    cleanup_old_backups
    verify_backup
    
    # Affichage des statistiques
    show_backup_stats
    
    log "✅ Sauvegarde chiffrée terminée avec succès: ${ENCRYPTED_FILE}"
}

# ===== AIDE =====

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    cat << EOF
Script de sauvegarde PostgreSQL chiffrée pour VISUAL Platform

Usage: $0

Variables d'environnement requises:
  PGDATABASE        - Nom de la base de données
  PGUSER           - Utilisateur PostgreSQL  
  PGPASSWORD       - Mot de passe PostgreSQL
  PGHOST           - Hôte PostgreSQL
  GPG_PASSPHRASE   - Phrase de passe pour le chiffrement GPG

Variables optionnelles:
  BACKUP_DIR       - Répertoire de sauvegarde (défaut: backups)
  RETENTION_DAYS   - Jours de rétention (défaut: 14)

Exemple:
  export PGDATABASE="visual_prod"
  export PGUSER="visual_user"
  export PGPASSWORD="secure_password"
  export PGHOST="localhost"
  export GPG_PASSPHRASE="encryption_passphrase"
  $0

Pour déchiffrer une sauvegarde:
  gpg --decrypt backup.sql.gpg > restored.sql
EOF
    exit 0
fi

# Exécution du script principal
main "$@"
