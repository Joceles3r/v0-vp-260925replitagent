import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from "axios"

// API Base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
const API_TIMEOUT = Number.parseInt(import.meta.env.VITE_API_TIMEOUT || "30000", 10)

/**
 * Centralized API Client for VISUAL Platform
 * Handles authentication, error handling, and request/response interceptors
 */
class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Include cookies for session management
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token if available
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token")
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // Response interceptor - Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          const status = error.response.status

          if (status === 401) {
            // Unauthorized - clear auth and redirect to login
            localStorage.removeItem("auth_token")
            window.location.href = "/login"
          } else if (status === 403) {
            // Forbidden
            console.error("Access denied")
          } else if (status === 429) {
            // Rate limited
            console.error("Too many requests. Please try again later.")
          } else if (status >= 500) {
            // Server error
            console.error("Server error. Please try again later.")
          }
        } else if (error.request) {
          // Request made but no response
          console.error("Network error. Please check your connection.")
        }

        return Promise.reject(error)
      },
    )
  }

  // Generic request method
  async request(config: AxiosRequestConfig): Promise<any> {
    const response = await this.client.request(config)
    return response.data
  }

  // GET request
  async get(url: string, config?: AxiosRequestConfig): Promise<any> {
    return this.request({ ...config, method: "GET", url })
  }

  // POST request
  async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.request({ ...config, method: "POST", url, data })
  }

  // PUT request
  async put(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.request({ ...config, method: "PUT", url, data })
  }

  // PATCH request
  async patch(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> {
    return this.request({ ...config, method: "PATCH", url, data })
  }

  // DELETE request
  async delete(url: string, config?: AxiosRequestConfig): Promise<any> {
    return this.request({ ...config, method: "DELETE", url })
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Export convenience methods
export const api = {
  get: (url: string, config?: AxiosRequestConfig) => apiClient.get(url, config),
  post: (url: string, data?: any, config?: AxiosRequestConfig) => apiClient.post(url, data, config),
  put: (url: string, data?: any, config?: AxiosRequestConfig) => apiClient.put(url, data, config),
  patch: (url: string, data?: any, config?: AxiosRequestConfig) => apiClient.patch(url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) => apiClient.delete(url, config),
}

export default api
