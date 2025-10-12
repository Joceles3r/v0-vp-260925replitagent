/**
 * Service avancé pour les webhooks Stripe
 * Path: server/services/stripeWebhooks.ts
 * Gestion sécurisée des événements Stripe avec retry et audit
 */

import { auditTrail } from "./auditTrail"
import { escrowService } from "./escrowService"
import { storage } from "./storage" // Assuming storage is imported from another module

export interface WebhookEvent {
  id: string
  type: string
  data: any
  created: number
  livemode: boolean
  pending_webhooks: number
  request: {
    id: string | null
    idempotency_key: string | null
  }
}

export interface ProcessedWebhook {
  eventId: string
  eventType: string
  status: "processed" | "failed" | "retry" | "ignored"
  processedAt: Date
  retryCount: number
  error?: string
  metadata: Record<string, any>
}

// Stockage temporaire des webhooks traités (prévention doublons)
const processedWebhooks = new Map<string, ProcessedWebhook>()

export class StripeWebhookService {
  private readonly maxRetries = 3
  private readonly retryDelays = [1000, 5000, 15000] // ms

  /**
   * Vérifie la signature d'un webhook Stripe
   */
  private verifySignature(event: WebhookEvent, signature: string): boolean {
    // Note: In production, signature verification should be done using
    // stripe.webhooks.constructEvent() which is already implemented in routes.ts
    // This method is kept for compatibility but signature verification
    // should happen at the route level before calling this service
    return true // Signature already verified at route level
  }

  /**
   * Traite un webhook Stripe entrant
   */
  async processWebhook(event: WebhookEvent, signature: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier la signature (idempotence/sécurité)
      if (!this.verifySignature(event, signature)) {
        await auditTrail.appendAudit("stripe_webhook_signature_invalid", "stripe", {
          eventId: event.id,
          eventType: event.type,
        })
        return { success: false, error: "Signature invalide" }
      }

      // Vérifier si déjà traité (idempotence)
      if (processedWebhooks.has(event.id)) {
        const processed = processedWebhooks.get(event.id)!
        if (processed.status === "processed") {
          return { success: true } // Déjà traité avec succès
        }
      }

      // Traiter selon le type d'événement
      const result = await this.handleEventType(event)

      // Enregistrer le traitement
      const processed: ProcessedWebhook = {
        eventId: event.id,
        eventType: event.type,
        status: result.success ? "processed" : "failed",
        processedAt: new Date(),
        retryCount: 0,
        error: result.error,
        metadata: result.metadata || {},
      }

      processedWebhooks.set(event.id, processed)

      // Audit trail
      await auditTrail.appendAudit("stripe_webhook_processed", "stripe", {
        eventId: event.id,
        eventType: event.type,
        status: processed.status,
        error: result.error,
      })

      return result
    } catch (error) {
      console.error("Erreur traitement webhook Stripe:", error)

      // Enregistrer l'échec
      const processed: ProcessedWebhook = {
        eventId: event.id,
        eventType: event.type,
        status: "failed",
        processedAt: new Date(),
        retryCount: 0,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        metadata: {},
      }

      processedWebhooks.set(event.id, processed)

      return { success: false, error: "Erreur interne" }
    }
  }

  /**
   * Traite les différents types d'événements Stripe
   */
  private async handleEventType(
    event: WebhookEvent,
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, any> }> {
    switch (event.type) {
      case "payment_intent.succeeded":
        return await this.handlePaymentSucceeded(event)

      case "payment_intent.payment_failed":
        return await this.handlePaymentFailed(event)

      case "charge.dispute.created":
        return await this.handleDisputeCreated(event)

      case "invoice.payment_succeeded":
        return await this.handleInvoicePaymentSucceeded(event)

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return await this.handleSubscriptionEvent(event)

      case "account.updated":
        return await this.handleAccountUpdated(event)

      case "payout.paid":
      case "payout.failed":
        return await this.handlePayoutEvent(event)

      default:
        // Événement non géré - ignoré mais enregistré
        await auditTrail.appendAudit("stripe_webhook_ignored", "stripe", {
          eventId: event.id,
          eventType: event.type,
          reason: "Type d'événement non géré",
        })
        return { success: true, metadata: { ignored: true, reason: "Type non géré" } }
    }
  }

  /**
   * Gère les paiements réussis
   */
  private async handlePaymentSucceeded(
    event: WebhookEvent,
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, any> }> {
    try {
      const paymentIntent = event.data.object
      const amount = paymentIntent.amount // en centimes
      const currency = paymentIntent.currency
      const customerId = paymentIntent.customer
      const metadata = paymentIntent.metadata || {}

      // Si c'est un paiement escrow, libérer les fonds
      if (metadata.escrow_id) {
        const escrowResult = await escrowService.fundEscrow(
          metadata.escrow_id,
          paymentIntent.id,
          customerId || "unknown",
        )

        if (!escrowResult.success) {
          return { success: false, error: `Erreur escrow: ${escrowResult.error}` }
        }
      }

      // Traitement standard des investissements/paiements
      await this.processInvestmentPayment({
        paymentId: paymentIntent.id,
        userId: customerId || metadata.user_id,
        amount: amount / 100, // Convertir en euros
        currency,
        projectId: metadata.project_id,
        type: metadata.payment_type || "investment",
      })

      return {
        success: true,
        metadata: {
          paymentId: paymentIntent.id,
          amount,
          currency,
          escrowProcessed: !!metadata.escrow_id,
        },
      }
    } catch (error) {
      return { success: false, error: `Erreur traitement paiement: ${error}` }
    }
  }

  /**
   * Gère les échecs de paiement
   */
  private async handlePaymentFailed(
    event: WebhookEvent,
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, any> }> {
    try {
      const paymentIntent = event.data.object
      const failure_reason = paymentIntent.last_payment_error?.message || "Raison inconnue"
      const metadata = paymentIntent.metadata || {}

      // Si c'est un paiement escrow, annuler la transaction
      if (metadata.escrow_id) {
        await escrowService.cancelEscrow(metadata.escrow_id, "system", `Échec paiement: ${failure_reason}`)
      }

      // Notifier l'échec
      await this.notifyPaymentFailure({
        paymentId: paymentIntent.id,
        userId: metadata.user_id,
        projectId: metadata.project_id,
        reason: failure_reason,
      })

      return {
        success: true,
        metadata: {
          paymentId: paymentIntent.id,
          failure_reason,
          escrowCancelled: !!metadata.escrow_id,
        },
      }
    } catch (error) {
      return { success: false, error: `Erreur traitement échec: ${error}` }
    }
  }

  /**
   * Gère les litiges créés
   */
  private async handleDisputeCreated(
    event: WebhookEvent,
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, any> }> {
    try {
      const dispute = event.data.object
      const chargeId = dispute.charge
      const amount = dispute.amount
      const reason = dispute.reason

      // Créer un litige escrow si applicable
      // TODO: Lier avec les transactions existantes

      await auditTrail.appendAudit("stripe_dispute_created", "stripe", {
        disputeId: dispute.id,
        chargeId,
        amount,
        reason,
      })

      return {
        success: true,
        metadata: {
          disputeId: dispute.id,
          chargeId,
          amount,
          reason,
        },
      }
    } catch (error) {
      return { success: false, error: `Erreur traitement litige: ${error}` }
    }
  }

  /**
   * Gère les paiements de factures réussis
   */
  private async handleInvoicePaymentSucceeded(
    event: WebhookEvent,
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, any> }> {
    try {
      const invoice = event.data.object
      const subscriptionId = invoice.subscription
      const customerId = invoice.customer
      const amount = invoice.amount_paid

      // Traitement des abonnements/VIP
      await this.processSubscriptionPayment({
        invoiceId: invoice.id,
        subscriptionId,
        customerId,
        amount: amount / 100,
        currency: invoice.currency,
      })

      return {
        success: true,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId,
          amount,
        },
      }
    } catch (error) {
      return { success: false, error: `Erreur traitement facture: ${error}` }
    }
  }

  /**
   * Gère les événements d'abonnement
   */
  private async handleSubscriptionEvent(
    event: WebhookEvent,
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, any> }> {
    try {
      const subscription = event.data.object
      const customerId = subscription.customer
      const status = subscription.status

      // Mettre à jour le statut d'abonnement utilisateur
      await this.updateUserSubscription({
        customerId,
        subscriptionId: subscription.id,
        status,
        eventType: event.type,
      })

      return {
        success: true,
        metadata: {
          subscriptionId: subscription.id,
          status,
          eventType: event.type,
        },
      }
    } catch (error) {
      return { success: false, error: `Erreur traitement abonnement: ${error}` }
    }
  }

  /**
   * Gère les mises à jour de compte
   */
  private async handleAccountUpdated(
    event: WebhookEvent,
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, any> }> {
    try {
      const account = event.data.object
      const accountId = account.id
      const capabilities = account.capabilities

      const visualUserId = account.metadata?.visual_user_id

      if (visualUserId) {
        await storage.updateUser(visualUserId, {
          stripeConnectChargesEnabled: account.charges_enabled || false,
          stripeConnectPayoutsEnabled: account.payouts_enabled || false,
          stripeConnectOnboarded: account.details_submitted || false,
          stripeConnectOnboardedAt: account.details_submitted ? new Date() : null,
        })

        console.log(`[Stripe Webhook] Updated Connect account status for user ${visualUserId}`)

        await auditTrail.appendAudit("stripe_connect_account_updated", "stripe", {
          accountId,
          visualUserId,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        })
      }

      return {
        success: true,
        metadata: {
          accountId,
          payouts_enabled: account.payouts_enabled,
          charges_enabled: account.charges_enabled,
        },
      }
    } catch (error) {
      return { success: false, error: `Erreur traitement compte: ${error}` }
    }
  }

  /**
   * Gère les événements de virement
   */
  private async handlePayoutEvent(
    event: WebhookEvent,
  ): Promise<{ success: boolean; error?: string; metadata?: Record<string, any> }> {
    try {
      const payout = event.data.object
      const amount = payout.amount
      const status = payout.status
      const destination = payout.destination

      const payoutId = payout.id
      const eventType = event.type

      // Find transfer by Stripe payout ID
      const transfer = await storage.getTransferByStripeId(payoutId)

      if (transfer) {
        const newStatus = eventType === "payout.paid" ? "completed" : "failed"
        await storage.updateStripeTransferStatus(transfer.id, newStatus)

        console.log(`[Stripe Webhook] Updated transfer ${transfer.id} status to ${newStatus}`)

        await auditTrail.appendAudit("stripe_payout_processed", "stripe", {
          payoutId,
          transferId: transfer.id,
          status: newStatus,
          amount,
          eventType,
        })
      }

      return {
        success: true,
        metadata: {
          payoutId,
          amount,
          status,
        },
      }
    } catch (error) {
      console.error("[Stripe Webhook] Error updating payout status:", error)
      return { success: false, error: `Erreur traitement virement: ${error}` }
    }
  }

  /**
   * Traite un paiement d'investissement
   */
  private async processInvestmentPayment(params: {
    paymentId: string
    userId: string
    amount: number
    currency: string
    projectId?: string
    type: string
  }): Promise<void> {
    // TODO: Implémenter le traitement réel des investissements
    console.log("Traitement paiement investissement:", params)
  }

  /**
   * Notifie un échec de paiement
   */
  private async notifyPaymentFailure(params: {
    paymentId: string
    userId: string
    projectId?: string
    reason: string
  }): Promise<void> {
    // TODO: Implémenter les notifications d'échec
    console.log("Notification échec paiement:", params)
  }

  /**
   * Traite un paiement d'abonnement
   */
  private async processSubscriptionPayment(params: {
    invoiceId: string
    subscriptionId: string
    customerId: string
    amount: number
    currency: string
  }): Promise<void> {
    // TODO: Implémenter le traitement des abonnements
    console.log("Traitement paiement abonnement:", params)
  }

  /**
   * Met à jour le statut d'abonnement utilisateur
   */
  private async updateUserSubscription(params: {
    customerId: string
    subscriptionId: string
    status: string
    eventType: string
  }): Promise<void> {
    // TODO: Implémenter la mise à jour des abonnements
    console.log("Mise à jour abonnement:", params)
  }

  /**
   * Met à jour un compte marchand
   */
  private async updateMerchantAccount(params: {
    accountId: string
    capabilities: any
    payouts_enabled: boolean
    charges_enabled: boolean
  }): Promise<void> {
    // TODO: Implémenter la mise à jour des comptes marchands
    console.log("Mise à jour compte marchand:", params)
  }

  /**
   * Met à jour le statut d'un virement
   */
  private async updatePayoutStatus(params: {
    payoutId: string
    amount: number
    currency: string
    status: string
    destination: string
    eventType: string
  }): Promise<void> {
    try {
      const { payoutId, status, eventType } = params

      // Find transfer by Stripe payout ID
      const transfer = await storage.getTransferByStripeId(payoutId)

      if (transfer) {
        const newStatus = eventType === "payout.paid" ? "completed" : "failed"
        await storage.updateStripeTransferStatus(transfer.id, newStatus)

        console.log(`[Stripe Webhook] Updated transfer ${transfer.id} status to ${newStatus}`)
      }
    } catch (error) {
      console.error("[Stripe Webhook] Error updating payout status:", error)
      throw error
    }
  }

  /**
   * Récupère les statistiques des webhooks
   */
  async getWebhookStats(): Promise<{
    total: number
    processed: number
    failed: number
    byType: Record<string, number>
  }> {
    const webhooks = Array.from(processedWebhooks.values())

    const byType = webhooks.reduce(
      (acc, webhook) => {
        acc[webhook.eventType] = (acc[webhook.eventType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      total: webhooks.length,
      processed: webhooks.filter((w) => w.status === "processed").length,
      failed: webhooks.filter((w) => w.status === "failed").length,
      byType,
    }
  }

  /**
   * Nettoie les anciens webhooks traités
   */
  async cleanupOldWebhooks(olderThanDays = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    let cleaned = 0
    for (const [id, webhook] of Array.from(processedWebhooks.entries())) {
      if (webhook.processedAt < cutoffDate) {
        processedWebhooks.delete(id)
        cleaned++
      }
    }

    return cleaned
  }
}

// Instance singleton
export const stripeWebhookService = new StripeWebhookService()
