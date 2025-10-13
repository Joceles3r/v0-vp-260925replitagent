#!/bin/bash

# VISUAL Platform - Pre-Deployment Verification Script
# This script automates the verification of critical deployment checklist items

set -e

echo "🚀 VISUAL Platform - Pre-Deployment Verification"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "📦 Checking Dependencies..."
if npm audit --production --audit-level=high | grep -q "found 0 vulnerabilities"; then
    check_pass "No high-severity vulnerabilities found"
else
    check_fail "High-severity vulnerabilities detected - run 'npm audit fix'"
fi

echo ""
echo "🔨 Building Application..."
if npm run build > /dev/null 2>&1; then
    check_pass "Application builds successfully"
else
    check_fail "Build failed - check TypeScript errors"
fi

echo ""
echo "🧪 Running Tests..."
if npm run test > /dev/null 2>&1; then
    check_pass "All tests passing"
else
    check_fail "Tests failing - fix before deployment"
fi

echo ""
echo "📝 Checking TypeScript..."
if npm run type-check > /dev/null 2>&1; then
    check_pass "TypeScript compilation successful"
else
    check_fail "TypeScript errors detected"
fi

echo ""
echo "🎨 Checking Code Quality..."
if npm run lint > /dev/null 2>&1; then
    check_pass "No linting errors"
else
    check_warn "Linting errors detected - consider fixing"
fi

echo ""
echo "🔐 Checking Environment Variables..."
REQUIRED_VARS=(
    "DATABASE_URL"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "BUNNY_STREAM_API_KEY"
    "RECAPTCHA_SECRET_KEY"
    "SENTRY_DSN"
    "SESSION_SECRET"
    "ENCRYPTION_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        check_fail "Missing required environment variable: $var"
    else
        check_pass "Environment variable set: $var"
    fi
done

echo ""
echo "🗄️ Checking Database Connection..."
if npm run db:check > /dev/null 2>&1; then
    check_pass "Database connection successful"
else
    check_fail "Cannot connect to database"
fi

echo ""
echo "📊 Summary"
echo "=========="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Pre-deployment checks FAILED${NC}"
    echo "Fix the issues above before deploying to production."
    exit 1
else
    echo -e "${GREEN}✅ Pre-deployment checks PASSED${NC}"
    echo "Application is ready for deployment!"
    exit 0
fi
