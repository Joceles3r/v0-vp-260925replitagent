# ==============================================
# VISUAL PLATFORM - MAKEFILE
# ==============================================

.PHONY: help dev build test lint format migrate seed up down clean install

# Variables
NODE_VERSION := 18
DOCKER_COMPOSE := docker-compose
YARN := yarn

# Couleurs pour l'affichage
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Aide par défaut
help: ## 📖 Affiche cette aide
	@echo "$(GREEN)VISUAL Platform - Commandes disponibles:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# ==============================================
# 🚀 DÉVELOPPEMENT
# ==============================================

dev: ## 🏃 Lance l'application en mode développement (frontend + backend)
	@echo "$(GREEN)🚀 Démarrage du mode développement...$(NC)"
	$(YARN) dev

dev-client: ## 🖥️  Lance uniquement le frontend
	@echo "$(GREEN)🖥️  Démarrage du frontend...$(NC)"
	cd client && $(YARN) dev

dev-server: ## ⚙️  Lance uniquement le backend
	@echo "$(GREEN)⚙️  Démarrage du backend...$(NC)"
	cd server && $(YARN) dev

install: ## 📦 Installation des dépendances
	@echo "$(GREEN)📦 Installation des dépendances...$(NC)"
	$(YARN) install
	@echo "$(GREEN)✅ Installation terminée!$(NC)"

# ==============================================
# 🗄️ BASE DE DONNÉES
# ==============================================

migrate: ## 🔄 Lance les migrations de base de données
	@echo "$(GREEN)🔄 Exécution des migrations...$(NC)"
	$(YARN) db:migrate
	@echo "$(GREEN)✅ Migrations terminées!$(NC)"

generate: ## 🛠️  Génère une nouvelle migration
	@echo "$(GREEN)🛠️  Génération d'une nouvelle migration...$(NC)"
	$(YARN) db:generate

seed: ## 🌱 Seed la base de données avec des données de test
	@echo "$(GREEN)🌱 Seeding de la base de données...$(NC)"
	$(YARN) db:seed
	@echo "$(GREEN)✅ Seeding terminé!$(NC)"

db-reset: ## 🔄 Reset complet de la base de données
	@echo "$(YELLOW)⚠️  Reset complet de la base de données...$(NC)"
	@read -p "Êtes-vous sûr? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(YARN) db:reset && echo "$(GREEN)✅ Base de données resetée!$(NC)"; \
	else \
		echo "$(RED)❌ Annulé$(NC)"; \
	fi

studio: ## 🎨 Lance Drizzle Studio (interface graphique BDD)
	@echo "$(GREEN)🎨 Lancement de Drizzle Studio...$(NC)"
	$(YARN) db:studio

# ==============================================
# 🧪 TESTS ET QUALITÉ
# ==============================================

test: ## 🧪 Lance tous les tests
	@echo "$(GREEN)🧪 Exécution des tests...$(NC)"
	$(YARN) test

test-unit: ## 🎯 Tests unitaires uniquement
	@echo "$(GREEN)🎯 Tests unitaires...$(NC)"
	$(YARN) test:unit

test-e2e: ## 🌐 Tests end-to-end
	@echo "$(GREEN)🌐 Tests E2E...$(NC)"
	$(YARN) test:e2e

test-coverage: ## 📊 Tests avec couverture de code
	@echo "$(GREEN)📊 Tests avec couverture...$(NC)"
	$(YARN) test:coverage

lint: ## 🔍 Vérification du code (ESLint + Ruff)
	@echo "$(GREEN)🔍 Vérification du code...$(NC)"
	$(YARN) lint

lint-fix: ## 🔧 Correction automatique des erreurs de linting
	@echo "$(GREEN)🔧 Correction automatique...$(NC)"
	$(YARN) lint:fix

format: ## ✨ Formatage du code (Prettier + Black)
	@echo "$(GREEN)✨ Formatage du code...$(NC)"
	$(YARN) format

type-check: ## 🏷️  Vérification TypeScript
	@echo "$(GREEN)🏷️  Vérification TypeScript...$(NC)"
	$(YARN) type-check

lighthouse: ## 🚨 Tests de performance Lighthouse
	@echo "$(GREEN)🚨 Tests Lighthouse...$(NC)"
	$(YARN) lighthouse

a11y: ## ♿ Tests d'accessibilité
	@echo "$(GREEN)♿ Tests d'accessibilité...$(NC)"
	$(YARN) a11y

# ==============================================
# 🏗️ BUILD ET DÉPLOIEMENT
# ==============================================

build: ## 🏗️ Build pour production
	@echo "$(GREEN)🏗️ Build de production...$(NC)"
	$(YARN) build
	@echo "$(GREEN)✅ Build terminé!$(NC)"

preview: ## 👀 Preview du build de production
	@echo "$(GREEN)👀 Preview du build...$(NC)"
	$(YARN) preview

start: ## 🚀 Démarre en mode production
	@echo "$(GREEN)🚀 Démarrage en production...$(NC)"
	$(YARN) start

deploy: ## 🚀 Déploiement avec backup automatique et rollback
	@echo "$(GREEN)🚀 Déploiement avec sauvegarde...$(NC)"
	@bash scripts/deploy-with-rollback.sh deploy

deploy-version: ## 🚀 Déploiement d'une version spécifique (usage: make deploy-version VERSION=v1.2.3)
	@echo "$(GREEN)🚀 Déploiement version $(VERSION)...$(NC)"
	@bash scripts/deploy-with-rollback.sh deploy $(VERSION)

rollback: ## ⏮️  Rollback vers le dernier backup
	@echo "$(YELLOW)⚠️  ROLLBACK vers le dernier backup...$(NC)"
	@bash scripts/quick-rollback.sh

rollback-to: ## ⏮️  Rollback vers un backup spécifique (usage: make rollback-to TIMESTAMP=20250120_1430)
	@echo "$(YELLOW)⚠️  ROLLBACK vers $(TIMESTAMP)...$(NC)"
	@bash scripts/deploy-with-rollback.sh rollback $(TIMESTAMP)

list-backups: ## 📋 Liste tous les backups disponibles
	@echo "$(GREEN)📋 Backups disponibles:$(NC)"
	@ls -lh .backups/backup_*.tar.gz 2>/dev/null || echo "$(YELLOW)Aucun backup trouvé$(NC)"

# ==============================================
# 🐳 DOCKER
# ==============================================

up: ## 🐳 Lance Docker Compose (tous les services)
	@echo "$(GREEN)🐳 Lancement des services Docker...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Services lancés!$(NC)"

down: ## 🛑 Arrête Docker Compose
	@echo "$(GREEN)🛑 Arrêt des services Docker...$(NC)"
	$(DOCKER_COMPOSE) down

restart: ## 🔄 Redémarre Docker Compose
	@echo "$(GREEN)🔄 Redémarrage des services...$(NC)"
	$(DOCKER_COMPOSE) restart

logs: ## 📋 Affiche les logs Docker
	@echo "$(GREEN)📋 Logs des services...$(NC)"
	$(DOCKER_COMPOSE) logs -f

ps: ## 📊 Status des conteneurs
	@echo "$(GREEN)📊 Status des conteneurs...$(NC)"
	$(DOCKER_COMPOSE) ps

# ==============================================
# 🧹 NETTOYAGE
# ==============================================

clean: ## 🧹 Nettoyage (node_modules, dist, cache)
	@echo "$(GREEN)🧹 Nettoyage en cours...$(NC)"
	rm -rf node_modules client/node_modules server/node_modules
	rm -rf client/dist server/dist
	rm -rf .yarn/cache
	$(YARN) cache clean
	@echo "$(GREEN)✅ Nettoyage terminé!$(NC)"

clean-docker: ## 🐳 Nettoyage Docker (images, volumes, cache)
	@echo "$(GREEN)🐳 Nettoyage Docker...$(NC)"
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✅ Nettoyage Docker terminé!$(NC)"

# ==============================================
# 🔒 SÉCURITÉ
# ==============================================

security-check: ## 🔒 Audit de sécurité des dépendances
	@echo "$(GREEN)🔒 Audit de sécurité...$(NC)"
	$(YARN) audit

security-fix: ## 🔧 Correction automatique des vulnérabilités
	@echo "$(GREEN)🔧 Correction des vulnérabilités...$(NC)"
	$(YARN) audit --fix

# ==============================================
# 📊 MONITORING
# ==============================================

health: ## 💚 Vérification de santé de l'application
	@echo "$(GREEN)💚 Vérification de santé...$(NC)"
	curl -f http://localhost:8001/healthz || echo "$(RED)❌ Service indisponible$(NC)"

status: ## 📊 Status détaillé des services
	@echo "$(GREEN)📊 Status des services...$(NC)"
	curl -s http://localhost:8001/status | jq . || echo "$(RED)❌ Impossible de récupérer le status$(NC)"

# ==============================================
# 📝 DÉVELOPPEMENT
# ==============================================

setup: install migrate seed ## 🛠️  Setup complet pour nouveaux développeurs
	@echo "$(GREEN)🎉 Setup terminé! Vous pouvez maintenant lancer 'make dev'$(NC)"

ci: lint type-check test build ## 🤖 Pipeline CI (lint, test, build)
	@echo "$(GREEN)✅ Pipeline CI réussie!$(NC)"

fresh-install: clean install ## 🆕 Installation fraîche (supprime node_modules)
	@echo "$(GREEN)🆕 Installation fraîche terminée!$(NC)"

# ==============================================
# 📚 DOCUMENTATION
# ==============================================

docs: ## 📚 Génère la documentation
	@echo "$(GREEN)📚 Génération de la documentation...$(NC)"
	$(YARN) docs:generate

docs-serve: ## 📖 Servir la documentation localement
	@echo "$(GREEN)📖 Documentation disponible sur http://localhost:8080$(NC)"
	$(YARN) docs:serve
