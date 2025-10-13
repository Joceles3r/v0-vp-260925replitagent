import { z } from "zod"
import { config } from "dotenv"

config()

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "STRIPE_SECRET_KEY must start with sk_"),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_", "STRIPE_PUBLISHABLE_KEY must start with pk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with whsec_"),

  // Bunny CDN
  BUNNY_STREAM_API_KEY: z.string().min(32, "BUNNY_STREAM_API_KEY must be at least 32 characters"),
  BUNNY_LIBRARY_ID: z.string().min(1, "BUNNY_LIBRARY_ID is required"),
  CDN_BASE_URL: z.string().url("CDN_BASE_URL must be a valid URL"),
  CDN_SIGN_KEY: z.string().min(32, "CDN_SIGN_KEY must be at least 32 characters"),

  // Security
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters"),
  CSRF_SECRET: z.string().min(32, "CSRF_SECRET must be at least 32 characters"),

  // reCAPTCHA
  RECAPTCHA_SECRET_KEY: z.string().min(40, "RECAPTCHA_SECRET_KEY is required"),
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().min(40, "NEXT_PUBLIC_RECAPTCHA_SITE_KEY is required"),

  // Redis
  KV_REST_API_URL: z.string().url("KV_REST_API_URL must be a valid URL"),
  KV_REST_API_TOKEN: z.string().min(32, "KV_REST_API_TOKEN must be at least 32 characters"),

  // Monitoring
  SENTRY_DSN: z.string().url("SENTRY_DSN must be a valid URL").optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Application
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/, "PORT must be a number").transform(Number).default("5000"),
  SITE_BASE_URL: z.string().url("SITE_BASE_URL must be a valid URL"),
  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

  // Admin
  ADMIN_EMAILS: z.string().min(1, "ADMIN_EMAILS is required"),
  ADMIN_CONSOLE_SECRET: z.string().min(32, "ADMIN_CONSOLE_SECRET must be at least 32 characters"),

  // Rate Limiting
  RATE_LIMIT_WINDOW: z
    .string()
    .regex(/^\d+$/, "RATE_LIMIT_WINDOW must be a number")
    .transform(Number)
    .default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .regex(/^\d+$/, "RATE_LIMIT_MAX_REQUESTS must be a number")
    .transform(Number)
    .default("100"),

  // Backup
  BACKUP_DIR: z.string().default("./backups"),
  HEALTH_CHECK_URL: z.string().url("HEALTH_CHECK_URL must be a valid URL").optional(),
})

export type Env = z.infer<typeof envSchema>

let env: Env

try {
  env = envSchema.parse(process.env)
  console.log("[ENV] ✓ All environment variables validated successfully")
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("[ENV] ✗ Environment variable validation failed:")
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`)
    })
    process.exit(1)
  }
  throw error
}

export { env }

export const isProduction = env.NODE_ENV === "production"
export const isDevelopment = env.NODE_ENV === "development"
export const isTest = env.NODE_ENV === "test"
