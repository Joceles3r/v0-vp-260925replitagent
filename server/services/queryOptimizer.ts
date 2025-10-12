/**
 * Service d'optimisation des requêtes avec caching et batching
 */
class QueryOptimizer {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 60000 // 1 minute

  /**
   * Cache une requête avec TTL
   */
  async cacheQuery<T>(key: string, queryFn: () => Promise<T>, ttl: number = this.CACHE_TTL): Promise<T> {
    const cached = this.cache.get(key)

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T
    }

    const data = await queryFn()
    this.cache.set(key, { data, timestamp: Date.now() })

    return data
  }

  /**
   * Invalide le cache pour une clé spécifique
   */
  invalidateCache(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalide le cache par pattern
   */
  invalidateCachePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Batch loading pour éviter N+1 queries
   */
  async batchLoad<K, V>(keys: K[], loadFn: (keys: K[]) => Promise<Map<K, V>>): Promise<Map<K, V>> {
    if (keys.length === 0) return new Map()

    // Dédupliquer les clés
    const uniqueKeys = Array.from(new Set(keys))

    // Charger en batch
    return await loadFn(uniqueKeys)
  }
}

export const queryOptimizer = new QueryOptimizer()

// Nettoyer le cache toutes les 5 minutes
setInterval(
  () => {
    queryOptimizer.cleanExpiredCache()
  },
  5 * 60 * 1000,
)
