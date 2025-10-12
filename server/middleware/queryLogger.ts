import type { Request, Response, NextFunction } from "express"

/**
 * Middleware pour logger les requêtes lentes
 */
export function queryLogger(threshold = 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()

    res.on("finish", () => {
      const duration = Date.now() - start

      if (duration > threshold) {
        console.warn("[Slow Query]", {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          query: req.query,
          user: (req as any).user?.claims?.sub,
        })
      }
    })

    next()
  }
}

/**
 * Middleware pour limiter la taille des résultats
 */
export function resultSizeLimiter(maxLimit = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.query.limit) {
      const limit = Number.parseInt(req.query.limit as string, 10)
      if (limit > maxLimit) {
        req.query.limit = maxLimit.toString()
      }
    }

    next()
  }
}
