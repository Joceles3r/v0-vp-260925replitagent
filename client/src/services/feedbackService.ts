interface FeedbackData {
  type: "bug" | "feature" | "improvement" | "other"
  message: string
  page: string
  userAgent: string
  timestamp: string
  userId?: number
  screenshot?: string
}

export class FeedbackService {
  private static instance: FeedbackService
  private feedbackQueue: FeedbackData[] = []

  private constructor() {}

  static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService()
    }
    return FeedbackService.instance
  }

  async submitFeedback(data: Omit<FeedbackData, "timestamp" | "userAgent" | "page">): Promise<void> {
    const feedback: FeedbackData = {
      ...data,
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedback),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      console.log("[FEEDBACK] Submitted successfully")
    } catch (error) {
      console.error("[FEEDBACK] Failed to submit:", error)
      // Queue for retry
      this.feedbackQueue.push(feedback)
      this.retryQueue()
    }
  }

  private async retryQueue() {
    if (this.feedbackQueue.length === 0) return

    const feedback = this.feedbackQueue[0]
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedback),
      })

      if (response.ok) {
        this.feedbackQueue.shift()
        console.log("[FEEDBACK] Retry successful")
      }
    } catch (error) {
      console.error("[FEEDBACK] Retry failed:", error)
    }
  }

  async captureScreenshot(): Promise<string | undefined> {
    try {
      // Use html2canvas if available
      const html2canvas = (window as any).html2canvas
      if (!html2canvas) return undefined

      const canvas = await html2canvas(document.body)
      return canvas.toDataURL("image/png")
    } catch (error) {
      console.error("[FEEDBACK] Screenshot capture failed:", error)
      return undefined
    }
  }
}

export const feedbackService = FeedbackService.getInstance()
