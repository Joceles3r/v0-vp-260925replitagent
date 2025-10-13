import crypto from "crypto"
import { env } from "../config/env"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64

export class EncryptionService {
  private key: Buffer

  constructor() {
    // Derive key from environment variable
    this.key = crypto.scryptSync(env.ENCRYPTION_KEY, "salt", 32)
  }

  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(IV_LENGTH)
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv)

      let encrypted = cipher.update(text, "utf8", "hex")
      encrypted += cipher.final("hex")

      const authTag = cipher.getAuthTag()

      // Combine IV + authTag + encrypted data
      return iv.toString("hex") + authTag.toString("hex") + encrypted
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`)
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), "hex")
      const authTag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2), "hex")
      const encrypted = encryptedData.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2)

      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted, "hex", "utf8")
      decrypted += decipher.final("utf8")

      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`)
    }
  }

  hash(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex")
  }

  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString("hex")
  }

  compareHash(plaintext: string, hash: string): boolean {
    const plaintextHash = this.hash(plaintext)
    return crypto.timingSafeEqual(Buffer.from(plaintextHash), Buffer.from(hash))
  }
}

export const encryptionService = new EncryptionService()
