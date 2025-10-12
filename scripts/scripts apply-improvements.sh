#!/bin/bash
set -e

echo "🛡️  Vérification variables d'environnement..."
node scripts/validate-env.ts

echo "🏦 Ajout des indexes SQL..."
psql $DATABASE_URL -f scripts/create-indexes.sql

echo "💾 Backup base initial..."
bash scripts/backup_database.sh

echo "✅ Améliorations appliquées !"
