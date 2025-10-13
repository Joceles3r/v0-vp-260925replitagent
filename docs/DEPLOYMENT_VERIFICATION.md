# VISUAL Platform - Deployment Verification Guide

This guide explains how to verify your deployment is production-ready.

## Automated Verification Scripts

### 1. Pre-Deployment Check

Runs comprehensive checks before deployment:

\`\`\`bash
npm run pre-deploy
\`\`\`

**Checks performed:**
- Dependencies security audit
- Application build
- All tests (unit + integration + E2E)
- TypeScript compilation
- Code linting
- Environment variables validation
- Database connection

**Exit codes:**
- `0` - All checks passed, ready to deploy
- `1` - Some checks failed, fix issues before deploying

### 2. Lighthouse Audit

Verifies performance and accessibility scores:

\`\`\`bash
npm run lighthouse
\`\`\`

**Minimum scores required:**
- Performance: 90/100
- Accessibility: 90/100
- Best Practices: 90/100
- SEO: 90/100
- PWA: 80/100

### 3. Database Connection Check

Verifies database connectivity:

\`\`\`bash
npm run db:check
\`\`\`

### 4. Full CI Pipeline

Runs all checks in sequence:

\`\`\`bash
npm run ci
\`\`\`

## Manual Verification Steps

### Security Checklist

- [ ] Run security audit: `npm run security:audit`
- [ ] Check for outdated dependencies: `npm outdated`
- [ ] Verify SSL certificate is valid
- [ ] Test HTTPS redirect
- [ ] Verify CORS configuration
- [ ] Test rate limiting
- [ ] Verify CSRF protection

### Performance Checklist

- [ ] Run Lighthouse audit: `npm run lighthouse`
- [ ] Test page load time < 3s
- [ ] Verify CDN caching works
- [ ] Check image optimization
- [ ] Test on slow 3G connection

### Functionality Checklist

- [ ] Test user registration flow
- [ ] Test login/logout
- [ ] Test investment flow
- [ ] Test Live Show functionality
- [ ] Test payment processing (Stripe)
- [ ] Test video upload (Bunny.net)
- [ ] Test push notifications
- [ ] Test offline mode (PWA)

### Accessibility Checklist

- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify color contrast ratios
- [ ] Check ARIA labels
- [ ] Test on mobile devices

## Post-Deployment Verification

After deploying to production:

\`\`\`bash
# 1. Check health endpoint
curl https://your-domain.com/healthz

# 2. Verify database migrations
npm run db:migrate

# 3. Check application logs
npm run docker:logs

# 4. Monitor error rates in Sentry
# Visit: https://sentry.io/organizations/your-org/issues/

# 5. Check performance metrics
# Visit: https://vercel.com/your-project/analytics
\`\`\`

## Rollback Procedure

If issues are detected post-deployment:

\`\`\`bash
# Quick rollback to previous version
npm run rollback

# Or manual rollback
bash scripts/quick-rollback.sh
\`\`\`

## Monitoring

Set up alerts for:
- Error rate > 1%
- Response time > 3s
- Database connection failures
- Stripe webhook failures
- CDN errors

## Support

For deployment issues, check:
1. `docs/DEPLOYMENT_GUIDE.md` - Full deployment guide
2. `docs/PRODUCTION_CHECKLIST.md` - Complete checklist
3. GitHub Issues - Known issues and solutions
\`\`\`
