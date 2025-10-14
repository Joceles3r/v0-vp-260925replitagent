#!/usr/bin/env tsx
/**
 * Environment Variables Verification Script
 * Validates that all required environment variables are set
 */

import { config } from "dotenv"
import { resolve } from "path"
import { existsSync } from "fs"

// Load environment variables
config({ path: resolve(process.cwd(), ".env") })

interface EnvCheck {
  name: string
  required: boolean
  description: string
  validator?: (value: string) => boolean
}

const SERVER_ENV_CHECKS: EnvCheck[] = [
  // Database
  { name: "DATABASE_URL", required: true, description: "PostgreSQL connection string" },

  // Redis
  { name: "KV_REST_API_URL", required: true, description: "Upstash Redis URL" },
  { name: "KV_REST_API_TOKEN", required: true, description: "Upstash Redis token" },

  // Stripe
  { name: "STRIPE_SECRET_KEY", required: true, description: "Stripe secret key" },
  { name: "STRIPE_WEBHOOK_SECRET", required: true, description: "Stripe webhook secret" },
  { name: "STRIPE_PUBLISHABLE_KEY", required: true, description: "Stripe publishable key" },

  // Bunny.net
  { name: "BUNNY_API_KEY", required: true, description: "Bunny.net API key" },
  { name: "BUNNY_STORAGE_ZONE", required: true, description: "Bunny.net storage zone" },
  { name: "BUNNY_STREAM_LIBRARY_ID", required: true, description: "Bunny.net stream library ID" },

  // Security
  { name: "SESSION_SECRET", required: true, description: "Session encryption secret" },
  { name: "ENCRYPTION_KEY", required: true, description: "AES-256 encryption key" },
  { name: "RECAPTCHA_SECRET_KEY", required: true, description: "reCAPTCHA secret key" },

  // Monitoring
  { name: "SENTRY_DSN", required: false, description: "Sentry DSN for error tracking" },

  // Application
  { name: "NODE_ENV", required: true, description: "Node environment (development/production)" },
  { name: "PORT", required: false, description: "Server port (default: 5000)" },
]

const CLIENT_ENV_CHECKS: EnvCheck[] = [
  { name: "VITE_API_BASE_URL", required: true, description: "API base URL" },
  { name: "VITE_STRIPE_PUBLISHABLE_KEY", required: true, description: "Stripe publishable key" },
  { name: "VITE_RECAPTCHA_SITE_KEY", required: true, description: "reCAPTCHA site key" },
  { name: "VITE_BUNNY_CDN_URL", required: true, description: "Bunny.net CDN URL" },
]

function checkEnvVar(check: EnvCheck): { ok: boolean; message: string } {
  const value = process.env[check.name]

  if (!value) {
    if (check.required) {
      return {
        ok: false,
        message: `❌ MISSING: ${check.name} - ${check.description}`,
      }
    } else {
      return {
        ok: true,
        message: `⚠️  OPTIONAL: ${check.name} - ${check.description} (not set)`,
      }
    }
  }

  // Run custom validator if provided
  if (check.validator && !check.validator(value)) {
    return {
      ok: false,
      message: `❌ INVALID: ${check.name} - ${check.description}`,
    }
  }

  return {
    ok: true,
    message: `✅ OK: ${check.name}`,
  }
}

function main() {
  console.log("🔍 VISUAL Platform - Environment Variables Verification\n")

  // Check if .env file exists
  const envPath = resolve(process.cwd(), ".env")
  if (!existsSync(envPath)) {
    console.error("❌ ERROR: .env file not found!")
    console.error("   Please copy .env.example to .env and fill in your values.\n")
    process.exit(1)
  }

  console.log("📋 Checking Server Environment Variables:\n")

  let hasErrors = false
  const results: { ok: boolean; message: string }[] = []

  // Check server variables
  for (const check of SERVER_ENV_CHECKS) {
    const result = checkEnvVar(check)
    results.push(result)
    console.log(result.message)
    if (!result.ok) hasErrors = true
  }

  console.log("\n📋 Checking Client Environment Variables:\n")

  // Check client variables
  for (const check of CLIENT_ENV_CHECKS) {
    const result = checkEnvVar(check)
    results.push(result)
    console.log(result.message)
    if (!result.ok) hasErrors = true
  }

  console.log("\n" + "=".repeat(60))

  if (hasErrors) {
    console.error("\n❌ Environment validation FAILED!")
    console.error("   Please fix the missing/invalid variables above.\n")
    process.exit(1)
  } else {
    console.log("\n✅ All required environment variables are set!")
    console.log("   Your application is ready to deploy.\n")
    process.exit(0)
  }
}

main()
