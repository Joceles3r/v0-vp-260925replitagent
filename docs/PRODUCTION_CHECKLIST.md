# VISUAL Platform - Production Deployment Checklist

Use this checklist before deploying to production.

## 🔐 Security

- [ ] All environment variables configured in `.env`
- [ ] Secrets generated with cryptographically secure random values
- [ ] SSL/TLS certificates installed and valid
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured in Nginx
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] Sensitive data encrypted at rest (AES-256)
- [ ] Database credentials rotated
- [ ] API keys secured (not in code)
- [ ] Audit logging enabled

## 🗄️ Database

- [ ] Production database created
- [ ] Database user with appropriate permissions
- [ ] All migrations applied successfully
- [ ] Database backups configured (daily)
- [ ] Backup restoration tested
- [ ] Connection pooling configured
- [ ] Indexes created for performance
- [ ] Query performance tested

## 🚀 Application

- [ ] Application builds successfully
- [ ] All tests passing (unit + integration + E2E)
- [ ] TypeScript compilation successful
- [ ] No linting errors
- [ ] Dependencies up to date (security patches)
- [ ] Environment set to `NODE_ENV=production`
- [ ] Source maps disabled in production
- [ ] Debug logging disabled
- [ ] Error monitoring configured (Sentry)

## 🌐 Infrastructure

- [ ] Domain configured and DNS propagated
- [ ] Load balancer configured (if applicable)
- [ ] CDN configured (Bunny.net)
- [ ] Redis configured for caching
- [ ] File storage configured (uploads)
- [ ] Email service configured
- [ ] Monitoring tools installed (Prometheus/Grafana)
- [ ] Log aggregation configured
- [ ] Alerting configured

## 💳 Third-Party Services

- [ ] Stripe account in live mode
- [ ] Stripe webhooks configured
- [ ] Stripe Connect onboarding tested
- [ ] Bunny.net CDN configured
- [ ] Bunny Stream API keys valid
- [ ] reCAPTCHA v3 configured
- [ ] All API keys valid and not rate-limited

## 📊 Performance

- [ ] Lighthouse score > 90
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] Database queries optimized
- [ ] Static assets cached
- [ ] Images optimized (WebP format)
- [ ] Gzip compression enabled
- [ ] CDN caching configured

## ♿ Accessibility

- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Color contrast ratios meet standards
- [ ] Alt text for all images
- [ ] ARIA labels where appropriate

## 🧪 Testing

- [ ] Unit tests coverage > 80%
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] User acceptance testing completed
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness tested

## 📱 PWA

- [ ] Service worker registered
- [ ] Manifest.json configured
- [ ] Push notifications working
- [ ] Offline mode functional
- [ ] Install prompt working

## 🔄 CI/CD

- [ ] GitHub Actions workflow configured
- [ ] Automated tests in CI pipeline
- [ ] Automated deployment configured
- [ ] Rollback procedure tested
- [ ] Deployment notifications configured

## 📋 Documentation

- [ ] README.md updated
- [ ] API documentation complete
- [ ] Deployment guide reviewed
- [ ] Runbook created for common issues
- [ ] Architecture diagrams updated
- [ ] Environment variables documented

## 🚨 Disaster Recovery

- [ ] Backup strategy documented
- [ ] Backup restoration tested
- [ ] Rollback procedure tested
- [ ] Incident response plan created
- [ ] On-call rotation established
- [ ] Emergency contacts documented

## 📞 Post-Deployment

- [ ] Health checks passing
- [ ] Monitoring dashboards configured
- [ ] Alerts configured and tested
- [ ] Team notified of deployment
- [ ] Stakeholders informed
- [ ] Documentation updated with deployment date

---

## Sign-Off

**Deployed by:** ___________________  
**Date:** ___________________  
**Version:** ___________________  
**Approved by:** ___________________  

---

**Notes:**

Use this command to verify all checks programmatically:

\`\`\`bash
make ci  # Runs lint, type-check, test, build
