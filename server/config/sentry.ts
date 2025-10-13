import * as Sentry from "@sentry/node"
import { ProfilingIntegration } from "@sentry/profiling-node"
import { env, isProduction } from "./env"

export function initSentry() {
  if (!env.SENTRY_DSN) {
    console.warn("[SENTRY] No DSN provided, skipping initialization")
    return
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
    profilesSampleRate: isProduction ? 0.1 : 1.0,

    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: undefined as any }),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"]
        delete event.request.headers["cookie"]
        delete event.request.headers["x-api-key"]
      }

      // Remove sensitive query params
      if (event.request?.query_string) {
        const sensitiveParams = ["token", "api_key", "password", "secret"]
        sensitiveParams.forEach((param) => {
          if (event.request?.query_string?.includes(param)) {
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]*`, "gi"),
              `${param}=[REDACTED]`,
            )
          }
        })
      }

      return event
    },

    // Ignore common non-critical errors
    ignoreErrors: [
      "Non-Error exception captured",
      "Non-Error promise rejection captured",
      "ResizeObserver loop limit exceeded",
      "cancelled",
    ],
  })

  console.log("[SENTRY] ✓ Initialized successfully")
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info", context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

export function setUserContext(user: { id: number; username: string; email: string; role: string }) {
  Sentry.setUser({
    id: user.id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  })
}

export function clearUserContext() {
  Sentry.setUser(null)
}
