"use client"

import { useState, useEffect } from "react"
import { api } from "../utils/api"

interface HealthStatus {
  ok: boolean
  status?: string
  timestamp?: string
  uptime?: number
  version?: string
  environment?: string
  checks?: {
    database: string
    storage: string
    memory: string
  }
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get("/health")
      setHealth(response.data)
      setLastChecked(new Date())
    } catch (err: any) {
      setError(err.message || "Failed to connect to API")
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const getStatusColor = () => {
    if (loading) return "bg-gray-500"
    if (error || !health?.ok) return "bg-red-500"
    return "bg-green-500"
  }

  const getStatusText = () => {
    if (loading) return "Checking..."
    if (error) return "API is down"
    if (health?.ok) return "API is healthy"
    return "API is unhealthy"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">VISUAL Platform Health Check</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time API status monitoring</p>
        </div>

        {/* Main Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${getStatusColor()} animate-pulse`} />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{getStatusText()}</h2>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {loading ? "Checking..." : "Refresh"}
            </button>
          </div>

          {/* Timestamp */}
          {lastChecked && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Last checked: {lastChecked.toLocaleString()}
            </p>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <h3 className="text-red-800 dark:text-red-300 font-semibold mb-2">Error</h3>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Health Details */}
          {health && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {health.status && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{health.status}</p>
                </div>
              )}

              {health.uptime !== undefined && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uptime</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                  </p>
                </div>
              )}

              {health.version && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Version</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{health.version}</p>
                </div>
              )}

              {health.environment && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Environment</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{health.environment}</p>
                </div>
              )}
            </div>
          )}

          {/* Service Checks */}
          {health?.checks && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(health.checks).map(([service, status]) => (
                  <div key={service} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-1">{service}</p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          status === "healthy" ? "bg-green-500" : status === "warning" ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      />
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Endpoints</h3>
          <div className="space-y-2">
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              GET /api/health - Basic health check
            </a>
            <a
              href="/healthz"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              GET /healthz - Liveness probe
            </a>
            <a
              href="/readyz"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              GET /readyz - Readiness probe
            </a>
            <a
              href="/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 dark:text-blue-400 hover:underline"
            >
              GET /metrics - Prometheus metrics
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
