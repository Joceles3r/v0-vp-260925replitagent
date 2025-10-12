import { describe, it, expect } from "vitest"
import { bunnyService } from "../../server/services/bunnyService"

describe("Bunny Service - Video Management", () => {
  describe("Video Upload", () => {
    it("should create video upload session", async () => {
      const result = await bunnyService.createVideoUpload("Test Video", "creator-123", "clip")

      expect(result).toHaveProperty("videoId")
      expect(result).toHaveProperty("uploadUrl")
      expect(result.status).toBe("uploading")
    })

    it("should validate video specifications", () => {
      const clipValidation = bunnyService.constructor.validateVideoSpecs(
        "clip",
        180, // 3 minutes
        100 * 1024 * 1024, // 100MB
      )

      expect(clipValidation.valid).toBe(true)
      expect(clipValidation.errors).toHaveLength(0)
    })

    it("should reject oversized videos", () => {
      const validation = bunnyService.constructor.validateVideoSpecs(
        "clip",
        600, // 10 minutes (exceeds 5 min limit)
        100 * 1024 * 1024,
      )

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })

  describe("Secure Token Generation", () => {
    it("should generate valid playback token", () => {
      const token = bunnyService.generateSecureToken("video-123", "user-456", "192.168.1.1", "Mozilla/5.0")

      expect(token).toHaveProperty("token")
      expect(token).toHaveProperty("playbackUrl")
      expect(token).toHaveProperty("expiresAt")
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it("should verify valid tokens", () => {
      const token = bunnyService.generateSecureToken("video-123", "user-456")

      const verification = bunnyService.verifySecureToken(token.token)

      expect(verification.valid).toBe(true)
      expect(verification.data).toHaveProperty("videoId", "video-123")
    })

    it("should reject expired tokens", () => {
      const expiredToken = "eyJ2aWRlb0lkIjoidGVzdCIsImV4cGlyZXNBdCI6MTAwMDAwMH0=.invalidsig"

      const verification = bunnyService.verifySecureToken(expiredToken)

      expect(verification.valid).toBe(false)
    })
  })

  describe("HLS URL Generation", () => {
    it("should generate signed HLS URL", () => {
      const url = bunnyService.generateSecureHLSUrl("video-123", "user-456", "session-789")

      expect(url).toContain("playlist.m3u8")
      expect(url).toContain("auth=")
      expect(url).toContain("expires=")
    })
  })
})
