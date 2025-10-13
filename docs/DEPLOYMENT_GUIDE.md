# VISUAL Platform - Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Methods](#deployment-methods)
5. [Post-Deployment](#post-deployment)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
- **Node.js**: v20.x or higher
- **Yarn**: v1.22.x or higher
- **PostgreSQL**: v15.x or higher
- **Redis**: v7.x or higher (optional, for caching)
- **Docker**: v24.x or higher (for containerized deployment)
- **Git**: v2.x or higher

### Required Accounts
- **Stripe Account** (for payments)
- **Bunny.net Account** (for CDN and video streaming)
- **Sentry Account** (optional, for error monitoring)
- **Domain & SSL Certificate** (for production)

---

## 🌍 Environment Setup

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/your-org/visual-platform.git
cd visual-platform
\`\`\`

### 2. Configure Environment Variables

\`\`\`bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
\`\`\`

**Critical Variables to Configure:**

\`\`\`bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/visual_prod

# Security
SESSION_SECRET=<generate-random-64-char-string>
JWT_SECRET=<generate-random-64-char-string>
ENCRYPTION_KEY=<generate-random-32-char-string>
CSRF_SECRET=<generate-random-64-char-string>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
FRONTEND_URL=https://visual-platform.com
BACKEND_URL=https://api.visual-platform.com
\`\`\`

**Generate Secure Secrets:**

\`\`\`bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

### 3. Install Dependencies

\`\`\`bash
yarn install --frozen-lockfile
\`\`\`

---

## 🗄️ Database Setup

### 1. Create Database

\`\`\`bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE visual_prod;
CREATE USER visual_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE visual_prod TO visual_user;
\q
\`\`\`

### 2. Run Migrations

\`\`\`bash
# Generate migration files (if needed)
yarn db:generate

# Apply migrations
yarn db:migrate

# Or use Makefile
make migrate
\`\`\`

### 3. Seed Initial Data (Optional)

\`\`\`bash
yarn db:seed
\`\`\`

---

## 🚀 Deployment Methods

### Method 1: Docker Compose (Recommended)

**Advantages:**
- Isolated environment
- Easy scaling
- Consistent across environments
- Includes PostgreSQL, Redis, Nginx

**Steps:**

\`\`\`bash
# 1. Build images
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. View logs
docker-compose logs -f visual-app

# 5. Health check
curl http://localhost/healthz
\`\`\`

**Production Profile with Monitoring:**

\`\`\`bash
# Start with Prometheus + Grafana
docker-compose --profile monitoring up -d
\`\`\`

### Method 2: Manual Deployment

**Steps:**

\`\`\`bash
# 1. Build application
yarn build

# 2. Run database migrations
yarn db:migrate

# 3. Start application
NODE_ENV=production yarn start
\`\`\`

### Method 3: Automated Deployment Script

**With Automatic Backup & Rollback:**

\`\`\`bash
# Deploy with version tag
make deploy-version VERSION=v2.6.0

# Or use script directly
./scripts/deploy-with-rollback.sh deploy v2.6.0
\`\`\`

**What the script does:**
1. Creates backup (code + database)
2. Runs pre-deployment tests
3. Installs dependencies
4. Builds application
5. Applies database migrations
6. Restarts services
7. Performs health checks
8. **Auto-rollback if health check fails**

---

## ✅ Post-Deployment

### 1. Verify Health

\`\`\`bash
# Check health endpoint
curl https://visual-platform.com/healthz

# Expected response:
# {"status":"ok","timestamp":"2025-01-20T14:30:00.000Z"}
\`\`\`

### 2. Verify Database Connection

\`\`\`bash
# Check database status
curl https://visual-platform.com/status

# Expected response includes:
# {"database":"connected","redis":"connected",...}
\`\`\`

### 3. Test Critical Flows

- [ ] User registration/login
- [ ] Video upload
- [ ] Investment transaction
- [ ] Stripe payment
- [ ] Live Show access

### 4. Configure Monitoring

**Sentry Setup:**

\`\`\`bash
# Add Sentry DSN to .env
SENTRY_DSN=https://...@sentry.io/...

# Restart application
docker-compose restart visual-app
\`\`\`

**Prometheus + Grafana:**

\`\`\`bash
# Access Grafana
open http://localhost:3001

# Default credentials:
# Username: admin
# Password: (from GRAFANA_PASSWORD env var)
\`\`\`

### 5. SSL Certificate Setup

**Using Let's Encrypt:**

\`\`\`bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d visual-platform.com -d www.visual-platform.com

# Auto-renewal (cron job)
sudo certbot renew --dry-run
\`\`\`

---

## ⏮️ Rollback Procedures

### Automatic Rollback

The deployment script automatically rolls back if health checks fail.

### Manual Rollback

**List Available Backups:**

\`\`\`bash
make list-backups
# Or
ls -lh .backups/backup_*.tar.gz
\`\`\`

**Rollback to Specific Backup:**

\`\`\`bash
# Using timestamp from backup filename
make rollback-to TIMESTAMP=20250120_1430

# Or use script
./scripts/deploy-with-rollback.sh rollback 20250120_1430
\`\`\`

**Quick Rollback (Latest Backup):**

\`\`\`bash
make rollback
# Or
./scripts/quick-rollback.sh
\`\`\`

### Database Rollback

**Restore Database from Backup:**

\`\`\`bash
# Find backup
ls -lh .backups/db_backup_*.sql

# Restore
psql $DATABASE_URL < .backups/db_backup_20250120_1430.sql
\`\`\`

---

## 📊 Monitoring

### Health Endpoints

| Endpoint | Purpose | Access |
|----------|---------|--------|
| `/healthz` | Basic health check | Public |
| `/readyz` | Readiness check | Restricted |
| `/status` | Detailed status | Restricted |
| `/metrics` | Prometheus metrics | Restricted |

### Logs

**Docker Logs:**

\`\`\`bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f visual-app

# Last 100 lines
docker-compose logs --tail=100 visual-app
\`\`\`

**Application Logs:**

\`\`\`bash
# Production logs
tail -f /var/log/visual/app.log

# Error logs
tail -f /var/log/visual/error.log

# Audit logs
tail -f /var/log/visual/audit.log
\`\`\`

### Performance Monitoring

**Key Metrics to Monitor:**

- Response time (p50, p95, p99)
- Error rate
- Database connection pool usage
- Memory usage
- CPU usage
- Active users
- Transaction success rate

---

## 🔧 Troubleshooting

### Issue: Application Won't Start

**Check logs:**

\`\`\`bash
docker-compose logs visual-app
\`\`\`

**Common causes:**
- Missing environment variables
- Database connection failure
- Port already in use

**Solution:**

\`\`\`bash
# Verify environment variables
docker-compose config

# Check database connectivity
docker-compose exec visual-app psql $DATABASE_URL -c "SELECT 1"

# Check port availability
lsof -i :5000
\`\`\`

### Issue: Database Migration Fails

**Check migration status:**

\`\`\`bash
yarn db:studio
# Or
docker-compose exec postgres psql -U visual_user -d visual_prod -c "\dt"
\`\`\`

**Solution:**

\`\`\`bash
# Reset migrations (CAUTION: data loss)
yarn db:reset

# Or manually fix migration
psql $DATABASE_URL
# Run SQL commands to fix schema
\`\`\`

### Issue: Health Check Fails

**Check application status:**

\`\`\`bash
curl -v http://localhost:5000/healthz
\`\`\`

**Common causes:**
- Database not ready
- Redis not connected
- Application crash

**Solution:**

\`\`\`bash
# Restart services
docker-compose restart

# Check dependencies
docker-compose ps
\`\`\`

### Issue: High Memory Usage

**Check memory usage:**

\`\`\`bash
docker stats visual-app
\`\`\`

**Solution:**

\`\`\`bash
# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G  # Increase from 2G

# Restart
docker-compose up -d
\`\`\`

---

## 📞 Support

For deployment issues:

1. Check logs first
2. Review this guide
3. Check GitHub Issues
4. Contact DevOps team: devops@visual-platform.com

---

## 📚 Additional Resources

- [Architecture Overview](./ARCHITECTURE_OVERVIEW.md)
- [Security Guide](./SECURITY_ARCHITECTURE.md)
- [Backup & Recovery](./BACKUP_CONTINGENCY_GUIDE.md)
- [API Documentation](./api/)
