import { storage } from "../storage"
import { hasProfile } from "@shared/utils"

export const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const userId = req.user.claims.sub
    const user = await storage.getUser(userId)

    if (!user || !hasProfile(user.profileTypes, "admin")) {
      return res.status(403).json({ error: "Admin access required" })
    }

    next()
  } catch (error) {
    console.error("[Auth Middleware] Error checking admin access:", error)
    res.status(500).json({ error: "Authorization failed" })
  }
}

export const requireAuthenticated = async (req: any, res: any, next: any) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ error: "Authentication required" })
    }

    next()
  } catch (error) {
    console.error("[Auth Middleware] Error checking authentication:", error)
    res.status(500).json({ error: "Authentication failed" })
  }
}
