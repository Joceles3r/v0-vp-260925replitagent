# VISUAL - Plateforme d'Investissement de Contenus Visuels

## 📖 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Structure du Projet](#structure-du-projet)
4. [Configuration](#configuration)
5. [Schéma de Base de Données](#schéma-de-base-de-données)
6. [Fonctions Utilitaires Partagées](#fonctions-utilitaires-partagées)
7. [Backend (Server)](#backend-server)
8. [Frontend (Client)](#frontend-client)
9. [Installation et Déploiement](#installation-et-déploiement)
10. [Fonctionnalités Principales](#fonctionnalités-principales)

---

## 🎯 Vue d'Ensemble

VISUAL est une plateforme web full-stack qui permet aux utilisateurs d'investir dans des projets de contenu visuel avec des montants réduits (€1-€20) tout en influençant les classements via un système de vote. La plateforme supporte les investissements traditionnels, les émissions en direct, et offre un tableau de bord complet pour la gestion de portefeuille.

### **Caractéristiques Principales :**
- 🎥 **Investissement dans des projets visuels** (documentaires, courts-métrages, clips, animations, live)
- 💰 **Système de caution basé sur le profil** : €10 pour créateurs/admins, €20 pour investisseurs
- 🔒 **Authentification Replit intégrée** avec vérification KYC
- 💳 **Intégration Stripe sécurisée** pour les paiements
- 📊 **Scoring ML automatisé** des projets
- 📱 **Notifications en temps réel** via WebSocket
- 📈 **Tableau de bord de portefeuille** avec suivi ROI
- 👥 **Émissions live avec système de bataille** entre artistes

---

## 🏗️ Architecture Technique

### **Stack Technologique :**
- **Frontend :** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend :** Node.js + Express + TypeScript 
- **Base de Données :** PostgreSQL avec Drizzle ORM
- **Authentification :** Replit Auth (OpenID Connect)
- **Paiements :** Stripe
- **Build System :** Vite (dev) + esbuild (production)
- **Temps Réel :** Socket.IO WebSocket

### **Patterns Architecturaux :**
- **Monorepo** avec code partagé entre frontend/backend
- **API RESTful** avec validation Zod
- **Types partagés** TypeScript pour cohérence
- **Middleware chain** pour sécurité et logging
- **State Management** avec Zustand + TanStack Query

---

## 📁 Structure du Projet

\`\`\`
VISUAL/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/         # Composants UI
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── InvestmentModal.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── PortfolioTable.tsx
│   │   │   └── ProjectCard.tsx
│   │   ├── hooks/             # Hooks React personnalisés
│   │   ├── lib/               # Utilitaires frontend
│   │   ├── pages/             # Pages de l'application
│   │   ├── stores/            # Stores Zustand
│   │   ├── App.tsx            # Point d'entrée principal
│   │   └── main.tsx
│   └── index.html
├── server/                     # Backend Express
│   ├── services/              # Services métier
│   │   ├── compliance.ts      # Rapports de conformité
│   │   ├── mlScoring.ts       # Scoring ML des projets
│   │   └── notificationService.ts
│   ├── db.ts                  # Configuration base de données
│   ├── index.ts               # Point d'entrée serveur
│   ├── replitAuth.ts          # Authentification Replit
│   ├── routes.ts              # Routes API
│   ├── storage.ts             # Interface de stockage
│   └── websocket.ts           # WebSocket pour temps réel
├── shared/                     # Code partagé
│   ├── constants.ts           # Constantes centralisées
│   ├── schema.ts              # Schéma DB + types TypeScript
│   └── utils.ts               # Fonctions utilitaires
├── uploads/                    # Fichiers uploadés
├── package.json               # Dépendances
├── vite.config.ts             # Configuration Vite
├── tsconfig.json              # Configuration TypeScript
└── drizzle.config.ts          # Configuration Drizzle ORM
\`\`\`

---

## ⚙️ Configuration

### **package.json**
\`\`\`json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@stripe/react-stripe-js": "^4.0.2",
    "@stripe/stripe-js": "^7.9.0",
    "@tanstack/react-query": "^5.60.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "lucide-react": "^0.453.0",
    "openai": "^5.20.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "socket.io": "^4.8.1",
    "stripe": "^18.5.0",
    "tailwindcss": "^3.4.17",
    "typescript": "5.6.3",
    "wouter": "^3.3.5",
    "zod": "^3.24.2",
    "zustand": "^5.0.8"
  }
}
\`\`\`

### **vite.config.ts**
\`\`\`typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
\`\`\`

### **tsconfig.json**
\`\`\`json
{
  "include": ["client/src/**/*", "shared/**/*", "server/**/*"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/typescript/tsbuildinfo",
    "noEmit": true,
    "module": "ESNext",
    "strict": true,
    "lib": ["esnext", "dom", "dom.iterable"],
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "types": ["node", "vite/client"],
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
\`\`\`

---

## 🗃️ Schéma de Base de Données

### **shared/schema.ts**
\`\`\`typescript
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User profile types enum
export const profileTypeEnum = pgEnum('profile_type', ['investor', 'invested_reader', 'creator', 'admin']);

// Project status enum
export const projectStatusEnum = pgEnum('project_status', ['pending', 'active', 'completed', 'rejected']);

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['investment', 'withdrawal', 'commission', 'redistribution', 'deposit']);

// Notification type enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'investment_milestone', 
  'funding_goal_reached', 
  'project_status_change',
  'roi_update',
  'new_investment',
  'live_show_started',
  'battle_result',
  'performance_alert'
]);

// Notification priority enum
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'medium', 'high', 'urgent']);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  profileType: profileTypeEnum("profile_type").default('investor'),
  kycVerified: boolean("kyc_verified").default(false),
  kycDocuments: jsonb("kyc_documents"),
  balanceEUR: decimal("balance_eur", { precision: 10, scale: 2 }).default('10000.00'), // Simulation mode starts with €10,000
  simulationMode: boolean("simulation_mode").default(true),
  cautionEUR: decimal("caution_eur", { precision: 10, scale: 2 }).default('0.00'),
  totalInvested: decimal("total_invested", { precision: 10, scale: 2 }).default('0.00'),
  totalGains: decimal("total_gains", { precision: 10, scale: 2 }).default('0.00'),
  rankGlobal: integer("rank_global"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default('0.00'),
  status: projectStatusEnum("status").default('pending'),
  videoUrl: varchar("video_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  mlScore: decimal("ml_score", { precision: 3, scale: 1 }), // 0.0 to 10.0
  roiEstimated: decimal("roi_estimated", { precision: 5, scale: 2 }).default('0.00'),
  roiActual: decimal("roi_actual", { precision: 5, scale: 2 }),
  investorCount: integer("investor_count").default(0),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investments table
export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  visuPoints: integer("visu_points").notNull(), // 100 VP = 1 EUR
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
  roi: decimal("roi", { precision: 5, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table for audit trail
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).default('0.00'),
  projectId: varchar("project_id").references(() => projects.id),
  investmentId: varchar("investment_id").references(() => investments.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Live shows table
export const liveShows = pgTable("live_shows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  streamUrl: varchar("stream_url"),
  isActive: boolean("is_active").default(false),
  viewerCount: integer("viewer_count").default(0),
  artistA: varchar("artist_a"),
  artistB: varchar("artist_b"),
  investmentA: decimal("investment_a", { precision: 10, scale: 2 }).default('0.00'),
  investmentB: decimal("investment_b", { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance reports table
export const complianceReports = pgTable("compliance_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  data: jsonb("data").notNull(),
  generatedBy: varchar("generated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table for real-time project performance alerts
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  priority: notificationPriorityEnum("priority").default('medium'),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"), // Additional context data for the notification
  createdAt: timestamp("created_at").defaultNow(),
});

// User notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  enabled: boolean("enabled").default(true),
  emailEnabled: boolean("email_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(true),
  threshold: decimal("threshold", { precision: 10, scale: 2 }), // For percentage-based notifications
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  investments: many(investments),
  transactions: many(transactions),
  complianceReports: many(complianceReports),
  notifications: many(notifications),
  notificationPreferences: many(notificationPreferences),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id],
  }),
  investments: many(investments),
  notifications: many(notifications),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, {
    fields: [investments.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [investments.projectId],
    references: [projects.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [transactions.projectId],
    references: [projects.id],
  }),
  investment: one(investments, {
    fields: [transactions.investmentId],
    references: [investments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema> & { id?: string };
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type LiveShow = typeof liveShows.$inferSelect;
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;
\`\`\`

---

## 🔧 Fonctions Utilitaires Partagées

### **shared/constants.ts**
\`\`\`typescript
// Centralized constants for VISUAL platform

// Project categories and their properties
export const PROJECT_CATEGORIES = {
  documentaire: {
    score: 0.8,
    colorClass: 'bg-secondary/10 text-secondary',
    label: 'Documentaire'
  },
  'court-métrage': {
    score: 0.7,
    colorClass: 'bg-chart-4/10 text-purple-600',
    label: 'Court-métrage'
  },
  clip: {
    score: 0.6,
    colorClass: 'bg-accent/10 text-accent',
    label: 'Clip'
  },
  animation: {
    score: 0.75,
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    label: 'Animation'
  },
  live: {
    score: 0.5,
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    label: 'Live'
  }
} as const;

// User profile types and their minimum caution amounts
export const PROFILE_CAUTION_MINIMUMS = {
  creator: 10,      // Porteurs
  admin: 10,        // Infoporteurs  
  investor: 20,     // Investisseurs
  invested_reader: 20  // Investi-lecteurs
} as const;

// Investment status mappings
export const INVESTMENT_STATUS = {
  active: {
    colorClass: 'bg-accent/10 text-accent',
    label: 'En production'
  },
  completed: {
    colorClass: 'bg-secondary/10 text-secondary',
    label: 'Publié'
  },
  pending: {
    colorClass: 'bg-muted text-muted-foreground',
    label: 'Finalisation'
  }
} as const;

// Default values
export const DEFAULT_CATEGORY_SCORE = 0.5;
export const DEFAULT_COLOR_CLASS = 'bg-muted text-muted-foreground';
export const DEFAULT_CAUTION_MINIMUM = 20;
\`\`\`

### **shared/utils.ts**
\`\`\`typescript
// Centralized utility functions for VISUAL platform

import { PROJECT_CATEGORIES, PROFILE_CAUTION_MINIMUMS, INVESTMENT_STATUS, DEFAULT_CATEGORY_SCORE, DEFAULT_COLOR_CLASS, DEFAULT_CAUTION_MINIMUM } from './constants';

/**
 * Get minimum caution amount based on user profile type
 * @param profileType - User's profile type (creator, admin, investor, invested_reader)
 * @returns Minimum caution amount in EUR
 */
export function getMinimumCautionAmount(profileType: string): number {
  return PROFILE_CAUTION_MINIMUMS[profileType as keyof typeof PROFILE_CAUTION_MINIMUMS] ?? DEFAULT_CAUTION_MINIMUM;
}

/**
 * Get category score for ML scoring
 * @param category - Project category
 * @returns Score between 0.0 and 1.0
 */
export function getCategoryScore(category: string): number {
  const normalizedCategory = category.toLowerCase();
  return PROJECT_CATEGORIES[normalizedCategory as keyof typeof PROJECT_CATEGORIES]?.score ?? DEFAULT_CATEGORY_SCORE;
}

/**
 * Get CSS color classes for project category
 * @param category - Project category
 * @returns CSS class string for styling
 */
export function getCategoryColor(category: string): string {
  const normalizedCategory = category?.toLowerCase();
  return PROJECT_CATEGORIES[normalizedCategory as keyof typeof PROJECT_CATEGORIES]?.colorClass ?? DEFAULT_COLOR_CLASS;
}

/**
 * Get color classes for investment status
 * @param status - Investment status (active, completed, pending)
 * @returns CSS class string for styling
 */
export function getStatusColor(status: string): string {
  return INVESTMENT_STATUS[status as keyof typeof INVESTMENT_STATUS]?.colorClass ?? DEFAULT_COLOR_CLASS;
}

/**
 * Get human-readable label for investment status
 * @param status - Investment status (active, completed, pending)
 * @returns Localized status label
 */
export function getStatusLabel(status: string): string {
  return INVESTMENT_STATUS[status as keyof typeof INVESTMENT_STATUS]?.label ?? 'Inconnu';
}

/**
 * Get human-readable label for project category
 * @param category - Project category
 * @returns Localized category label
 */
export function getCategoryLabel(category: string): string {
  const normalizedCategory = category?.toLowerCase();
  return PROJECT_CATEGORIES[normalizedCategory as keyof typeof PROJECT_CATEGORIES]?.label ?? category;
}
\`\`\`

---

## 🔙 Backend (Server)

### **server/index.ts** - Point d'entrée serveur
\`\`\`typescript
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Note: Do NOT add express.json() here - it must be added after Stripe webhook
// to ensure webhook receives raw body for signature verification

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
\`\`\`

---

## 🎨 Frontend (Client)

### **client/src/App.tsx** - Point d'entrée frontend
\`\`\`typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

// Pages
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Portfolio from "@/pages/portfolio";
import Live from "@/pages/live";
import Admin from "@/pages/admin";
import KYCOnboarding from "@/pages/KYCOnboarding";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Show navigation only for authenticated users */}
      {isAuthenticated && <Navigation />}
      
      <Switch>
        {isLoading ? (
          <Route>
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </Route>
        ) : !isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/landing" component={Landing} />
            <Route component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/kyc" component={KYCOnboarding} />
            <Route path="/projects" component={Projects} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/live" component={Live} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </>
        )}
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
\`\`\`

---

## 📦 Installation et Déploiement

### **Prérequis :**
- Node.js 18+ 
- PostgreSQL (ou Neon Database)
- Compte Stripe
- Variables d'environnement configurées

### **Variables d'Environnement Requises :**
\`\`\`bash
# Base de données
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_...

# OpenAI (optionnel)
OPENAI_API_KEY=sk-...

# Replit (auto-configuré sur Replit)
REPL_ID=...
REPLIT_DOMAINS=...
\`\`\`

### **Installation :**
\`\`\`bash
# 1. Installer les dépendances
npm install

# 2. Configurer la base de données
npm run db:push

# 3. Démarrer en développement
npm run dev

# 4. Build pour production
npm run build
npm start
\`\`\`

### **Déploiement sur Replit :**
1. **Fork le projet** sur Replit
2. **Configurer les secrets** dans l'onglet Secrets
3. **Créer une base PostgreSQL** via Replit Database
4. **Lancer l'application** avec `npm run dev`
5. **Publier** via le bouton Deploy

---

## 🚀 Fonctionnalités Principales

### **🔐 Authentification & KYC**
- Authentification Replit intégrée (OpenID Connect)
- Système de vérification KYC pour conformité AMF
- Gestion des profils utilisateur (investisseur, créateur, admin)
- Sessions sécurisées avec stockage PostgreSQL

### **💰 Système de Paiement Stripe**
- Intégration Stripe complète (paiements, webhooks)
- Système de caution basé sur le profil utilisateur
- Simulation avec €10,000 de départ
- Audit trail complet des transactions

### **📊 Gestion de Projets**
- Scoring ML automatisé des projets
- Upload de vidéos et miniatures
- Catégorisation (documentaire, court-métrage, clip, animation, live)
- Suivi du financement et des investisseurs

### **💼 Portefeuille & Investissements**
- Tableau de bord complet avec statistiques
- Suivi ROI en temps réel
- Historique des investissements
- Notifications de performance

### **📺 Live Streaming & Batailles**
- Émissions live entre artistes
- Système de vote en temps réel
- Suivi des investissements par artiste
- WebSocket pour mises à jour live

### **👑 Panneau Admin**
- Gestion des utilisateurs et projets
- Rapports de conformité AMF
- Statistiques de la plateforme
- Contrôle des statuts de projets

### **🔔 Notifications Temps Réel**
- WebSocket pour notifications instantanées
- Préférences de notification personnalisables
- Alertes de performance des projets
- Notifications d'étapes de financement

---

## 📈 Architecture de Sécurité

### **🛡️ Mesures de Sécurité Implémentées :**
- **Validation Zod** sur toutes les entrées API
- **Middleware d'authentification** pour routes protégées
- **Vérification des signatures Stripe** pour webhooks
- **Sessions sécurisées** avec expiration automatique
- **Validation des montants** avant transactions
- **Audit trail complet** de toutes les opérations
- **Conformité AMF** avec rapports automatisés

### **🔒 Protection des Données :**
- **Chiffrement** des données sensibles
- **Gestion sécurisée** des clés API via variables d'environnement
- **Validation des fichiers** uploadés
- **Limitation des montants** d'investissement (€1-€20)
- **Vérification KYC** obligatoire avant investissement

---

## 🎯 Conclusion

VISUAL est une plateforme complète et sécurisée qui révolutionne l'investissement dans le contenu visuel. Avec son architecture moderne, ses fonctionnalités robustes et sa conformité réglementaire, elle offre une expérience utilisateur exceptionnelle tout en respectant les standards de sécurité les plus élevés.

**Technologies utilisées :** React, TypeScript, Express, PostgreSQL, Stripe, Replit Auth, Socket.IO
**Déploiement :** Replit avec publication automatique
**Conformité :** AMF et réglementations financières européennes

---

*© 2024 VISUAL Platform - Plateforme d'investissement de contenus visuels*
