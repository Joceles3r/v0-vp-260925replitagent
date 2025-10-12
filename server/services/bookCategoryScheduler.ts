/**
 * BookCategoryScheduler - Planificateur mensuel catégorie LIVRES
 * 
 * Rôle : Gestion des cycles mensuels calendaires pour catégories LIVRES
 * - Ouverture automatique le 1er du mois à 00:00:00 (Europe/Paris)
 * - Clôture automatique le dernier jour du mois à 23:59:59 (Europe/Paris)
 * - Auto-report des TOP10 auteurs vers le mois suivant
 * - Système de repêchage 24h pour rangs 11-100 (25€)
 */

import { LIVRES_CONFIG } from "@shared/constants";
import { storage } from "../storage";
import { visualFinanceAI } from "./visualFinanceAI";
import { InsertBookCategory, BookCategory } from "@shared/schema";

// Configuration RRULE pour planification mensuelle
interface MonthlySchedule {
  year: number;
  month: number; // 1-12
  openingDate: Date;
  closingDate: Date;
  timezone: string;
}

export class BookCategoryScheduler {
  private timezone: string = LIVRES_CONFIG.TIMEZONE;

  /**
   * Calcule les dates d'ouverture et clôture pour un mois donné (Europe/Paris)
   * TODO Production: utiliser une vraie lib timezone (luxon, date-fns-tz) pour Europe/Paris
   */
  private calculateMonthlySchedule(year: number, month: number): MonthlySchedule {
    // Pour l'instant, approximation avec offset Europe/Paris
    // Production : utiliser Intl.DateTimeFormat avec Europe/Paris ou luxon
    
    // 1er du mois à 00:00:00 (temps local approximé Europe/Paris)
    const openingDate = new Date(year, month - 1, 1, 0, 0, 0);
    
    // Dernier jour du mois à 23:59:59
    const lastDayOfMonth = new Date(year, month, 0).getDate(); // 28/29/30/31
    const closingDate = new Date(year, month - 1, lastDayOfMonth, 23, 59, 59);
    
    console.log(`[BookScheduler] 📅 Calendrier calculé ${year}-${month.toString().padStart(2, '0')} : ${lastDayOfMonth} jours`);
    console.log(`[BookScheduler] ⏰ Ouverture: ${openingDate.toISOString()}`);
    console.log(`[BookScheduler] ⏰ Clôture: ${closingDate.toISOString()}`);
    
    return {
      year,
      month,
      openingDate,
      closingDate,
      timezone: this.timezone
    };
  }

  /**
   * Obtient le décalage horaire Europe/Paris (approximation)
   * TODO Production: remplacer par luxon.DateTime.setZone('Europe/Paris') ou équivalent
   */
  private getTimezoneOffset(): number {
    // Approximation Europe/Paris : UTC+1 (hiver) ou UTC+2 (été)
    const now = new Date();
    
    // Détection DST simplifiée (dernier dimanche mars → dernier dimanche octobre)
    // TODO Production: utiliser Intl.DateTimeFormat pour détection précise
    const isDST = this.isDaylightSavingTime(now);
    return isDST ? 2 : 1; // UTC+2 (été) ou UTC+1 (hiver)
  }

  /**
   * Détection DST Europe simplifiée
   * TODO Production: remplacer par vraie logique DST avec lib timezone
   */
  private isDaylightSavingTime(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    
    // DST Europe : approximation Mars-Octobre 
    // Règle réelle : dernier dimanche mars → dernier dimanche octobre
    // TODO : implémenter calcul précis des dates de bascule DST
    return month >= 2 && month <= 9; // Mars-Octobre (approximation)
  }

  /**
   * Ouvre une nouvelle catégorie LIVRES pour le mois en cours
   */
  async openMonthlyCategory(): Promise<string> {
    const now = new Date();
    const schedule = this.calculateMonthlySchedule(now.getFullYear(), now.getMonth() + 1);
    
    console.log(`[BookScheduler] 📅 Ouverture catégorie LIVRES ${schedule.year}-${schedule.month.toString().padStart(2, '0')}`);
    
    // Créer nouvelle catégorie mensuelle
    const categoryData: InsertBookCategory = {
      name: `LIVRES_${schedule.year}_${schedule.month.toString().padStart(2, '0')}`,
      displayName: `Livres ${schedule.month.toString().padStart(2, '0')}/${schedule.year}`,
      description: `Catégorie mensuelle LIVRES ${schedule.year}-${schedule.month.toString().padStart(2, '0')}`,
      status: 'active',
      currentAuthorCount: 0,
      targetAuthorCount: LIVRES_CONFIG.TARGET_AUTHORS,
      maxAuthorCount: LIVRES_CONFIG.MAX_AUTHORS,
      cycleStartedAt: schedule.openingDate,
      cycleEndsAt: schedule.closingDate,
      isActive: true
    };
    
    const newCategory = await storage.createBookCategory(categoryData);
    const categoryId = newCategory.id;

    // TODO: Implémenter auto-report TOP10 auteurs une fois les méthodes de storage créées
    // await this.autoReportTop10AuthorsFromPreviousMonth(categoryId);
    
    console.log(`[BookScheduler] ✅ Catégorie ${categoryId} ouverte pour ${schedule.year}-${schedule.month.toString().padStart(2, '0')}`);
    return categoryId;
  }

  /**
   * Auto-report des TOP10 auteurs du mois précédent
   * TODO: À implémenter une fois les méthodes de storage créées
   */
  private async autoReportTop10AuthorsFromPreviousMonth(newCategoryId: string): Promise<void> {
    const now = new Date();
    const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    console.log(`[BookScheduler] TODO: Auto-report TOP10 pour ${previousYear}-${previousMonth.toString().padStart(2, '0')} vers ${newCategoryId}`);
  }

  /**
   * Clôture d'une catégorie LIVRES en fin de mois
   */
  async closeMonthlyCategory(categoryId: string): Promise<void> {
    console.log(`[BookScheduler] 🔒 Début clôture catégorie ${categoryId}`);
    
    try {
      // 1. Calculer classements finaux
      const books = await storage.getBooksByCategoryId(categoryId);
      // Récupérer tous les achats pour les livres de cette catégorie
      let purchases: any[] = [];
      for (const book of books) {
        const bookPurchases = await storage.getBookPurchases(book.id);
        purchases.push(...bookPurchases);
      }
      
      // 2. Orchestrer workflow de clôture via AgentOrchestrator
      const { agentOrchestrator } = await import('./agentOrchestrator');
      const workflowResult = await agentOrchestrator.executeBookCategoryLifecycleWorkflow(
        categoryId, 
        books, 
        purchases
      );
      
      // 3. Marquer catégorie comme fermée
      await storage.updateBookCategory(categoryId, { 
        status: 'closed',
        updatedAt: new Date()
      });
      
      // 4. TODO: Démarrer fenêtre repêchage 24h
      // await this.startRepechageWindow(categoryId);
      
      console.log(`[BookScheduler] ✅ Clôture catégorie ${categoryId} terminée`);
      
    } catch (error) {
      console.error(`[BookScheduler] ❌ Erreur clôture catégorie ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Démarre la fenêtre de repêchage 24h pour rangs 11-100
   * TODO: À implémenter une fois les tables de repêchage créées
   */
  private async startRepechageWindow(categoryId: string): Promise<void> {
    const now = new Date();
    const repechageEndTime = new Date(now.getTime() + LIVRES_CONFIG.REPECHAGE_WINDOW_HOURS * 60 * 60 * 1000);
    
    console.log(`[BookScheduler] TODO: Démarrer fenêtre repêchage pour ${categoryId} (${LIVRES_CONFIG.REPECHAGE_PRICE_EUR}€, 24h)`);
  }

  /**
   * Traite un paiement de repêchage
   * TODO: À implémenter une fois le système de repêchage créé
   */
  async processRepechagePayment(
    repechageId: string, 
    authorId: string, 
    stripePaymentIntentId: string
  ): Promise<void> {
    console.log(`[BookScheduler] TODO: Traiter repêchage ${repechageId} pour auteur ${authorId}`);
    throw new Error('Système de repêchage pas encore implémenté');
  }

  /**
   * Obtient ou crée la catégorie du mois suivant
   */
  private async getOrCreateNextMonthCategory(): Promise<string> {
    const now = new Date();
    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    
    const categoryName = `LIVRES_${nextYear}_${nextMonth.toString().padStart(2, '0')}`;
    
    // Vérifier si catégorie existe déjà
    const existing = await storage.getBookCategoryByName(categoryName);
    
    if (existing) {
      return existing.id;
    }

    // Créer nouvelle catégorie si nécessaire
    const schedule = this.calculateMonthlySchedule(nextYear, nextMonth);
    const categoryData: InsertBookCategory = {
      name: categoryName,
      displayName: `Livres ${nextMonth.toString().padStart(2, '0')}/${nextYear}`,
      description: `Catégorie mensuelle future ${nextYear}-${nextMonth.toString().padStart(2, '0')}`,
      status: 'waiting', // Pas encore active
      currentAuthorCount: 0,
      targetAuthorCount: LIVRES_CONFIG.TARGET_AUTHORS,
      maxAuthorCount: LIVRES_CONFIG.MAX_AUTHORS,
      cycleStartedAt: schedule.openingDate,
      cycleEndsAt: schedule.closingDate,
      isActive: false
    };

    const newCategory = await storage.createBookCategory(categoryData);
    console.log(`[BookScheduler] 📅 Catégorie future créée : ${newCategory.id} pour ${nextYear}-${nextMonth.toString().padStart(2, '0')}`);
    return newCategory.id;
  }

  /**
   * Vérifie et traite les événements planifiés (à appeler via CRON)
   * TODO Production: intégrer avec node-cron ou système cron système
   * TODO Production: RRULE evaluation avec timezone Europe/Paris précise
   */
  async processScheduledEvents(): Promise<void> {
    const now = new Date();
    console.log(`[BookScheduler] ⏰ Vérification événements planifiés : ${now.toISOString()}`);
    
    try {
      // TODO Production: évaluer OPENING_RRULE avec lib rrule + timezone Europe/Paris
      // Vérifier ouvertures de catégories (1er du mois à 00:00 Europe/Paris)
      if (now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() < 5) {
        console.log(`[BookScheduler] 🎯 Déclenchement ouverture mensuelle détecté`);
        await this.openMonthlyCategory();
      }

      // TODO Production: évaluer CLOSING_RRULE avec lib rrule + timezone Europe/Paris
      // Vérifier clôtures de catégories (dernier jour du mois à 23:59 Europe/Paris)
      const isLastDayOfMonth = this.isLastDayOfMonth(now);
      if (isLastDayOfMonth && now.getHours() === 23 && now.getMinutes() >= 55) {
        console.log(`[BookScheduler] 🎯 Déclenchement clôture mensuelle détecté`);
        
        const allCategories = await storage.getAllBookCategories();
        const activeCategories = allCategories.filter(c => c.status === 'active' && c.isActive);
        
        for (const category of activeCategories) {
          if (category.cycleEndsAt && new Date(category.cycleEndsAt) <= now) {
            await this.closeMonthlyCategory(category.id);
          }
        }
      }

      // TODO Production: nettoyer repêchages expirés (après 24h)
      // await this.cleanupExpiredRepechages();
      
      console.log(`[BookScheduler] ✅ Vérification événements terminée`);
      
    } catch (error) {
      console.error('[BookScheduler] ❌ Erreur traitement événements planifiés:', error);
    }
  }
  
  /**
   * Démarre la surveillance CRON (à appeler depuis server/index.ts)
   * TODO Production: intégrer node-cron pour exécution automatique
   */
  startCronMonitoring(): void {
    console.log(`[BookScheduler] 🔄 Démarrage surveillance CRON (mode manuel pour l'instant)`);
    console.log(`[BookScheduler] 📋 Configuration RRULE:`);
    console.log(`[BookScheduler]   - Ouverture: ${LIVRES_CONFIG.OPENING_RRULE}`);
    console.log(`[BookScheduler]   - Clôture: ${LIVRES_CONFIG.CLOSING_RRULE}`);
    console.log(`[BookScheduler]   - Timezone: ${LIVRES_CONFIG.TIMEZONE}`);
    console.log(`[BookScheduler] ⚠️  TODO Production: implémenter node-cron avec ${LIVRES_CONFIG.TIMEZONE}`);
    
    // TODO Production: 
    // import cron from 'node-cron';
    // cron.schedule('*/5 * * * *', () => this.processScheduledEvents(), { timezone: 'Europe/Paris' });
  }

  /**
   * Vérifie si on est le dernier jour du mois
   */
  private isLastDayOfMonth(date: Date): boolean {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return date.getDate() === lastDay;
  }

  /**
   * Nettoie les repêchages expirés
   * TODO: À implémenter une fois les tables de repêchage créées
   */
  private async cleanupExpiredRepechages(): Promise<void> {
    console.log(`[BookScheduler] TODO: Nettoyage repêchages expirés`);
  }
}

// Instance singleton
export const bookCategoryScheduler = new BookCategoryScheduler();
