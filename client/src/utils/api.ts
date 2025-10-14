import axios from "axios"

/**
 * Client API centralisé pour toutes les requêtes vers le backend
 * Utilise la variable d'environnement VITE_API_BASE_URL ou fallback sur /api
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Pour les cookies de session
})

/**
 * Intercepteur de requête pour ajouter le token JWT si disponible
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * Intercepteur de réponse pour gérer les erreurs globalement
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default api
