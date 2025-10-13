# VISUAL Platform - Architecture Overview

## System Architecture

\`\`\`mermaid
graph TB
    subgraph "Client Layer"
        A[React 18 + TypeScript]
        B[Tailwind CSS]
        C[Vite Build]
    end
    
    subgraph "API Layer"
        D[Express.js Server]
        E[REST API]
        F[WebSocket]
    end
    
    subgraph "Business Logic"
        G[Revenue Engine]
        H[Live Show Orchestrator]
        I[Category Revenue Engine]
        J[Visual AI Services]
    end
    
    subgraph "Data Layer"
        K[(PostgreSQL)]
        L[Drizzle ORM]
        M[Redis Cache]
    end
    
    subgraph "External Services"
        N[Stripe Connect]
        O[Bunny.net CDN]
        P[Replit Auth]
        Q[reCAPTCHA v3]
    end
    
    A --> D
    D --> E
    D --> F
    E --> G
    E --> H
    E --> I
    E --> J
    G --> L
    H --> L
    I --> L
    J --> L
    L --> K
    D --> M
    D --> N
    D --> O
    D --> P
    D --> Q
\`\`\`

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI Components & State Management |
| **Styling** | Tailwind CSS | Utility-first CSS Framework |
| **Build** | Vite | Fast Development & Production Builds |
| **Backend** | Express.js | REST API Server |
| **Database** | PostgreSQL | Relational Data Storage |
| **ORM** | Drizzle | Type-safe Database Access |
| **Cache** | Redis (Upstash) | Session & Performance Cache |
| **Auth** | Replit Auth | User Authentication |
| **Payments** | Stripe Connect | Payment Processing |
| **Video** | Bunny.net | CDN & Video Streaming |
| **Security** | reCAPTCHA v3 | Bot Protection |

## Core Modules

### 1. Revenue Distribution System
- **Live Show**: BATTLE 40/30/20/10 distribution
- **Categories**: 40/30/7/23 distribution with TOP 10/TOP 10% adaptive mode
- **Automated payouts** via Stripe Connect

### 2. AI Services
- **VisualAI**: Content moderation & fraud detection
- **VisualFinanceAI**: Financial analysis & predictions
- **VisualScoutAI**: Talent discovery & recommendations

### 3. User Management
- **Standard users**: Full investment capabilities
- **Minor visitors** (16-17): 200€ investment cap
- **Creators**: Content upload & revenue sharing
- **Admins**: Platform management

### 4. Security Layers
- **Anti-scraping**: reCAPTCHA v3 + fingerprinting
- **Rate limiting**: Per-user & per-IP
- **CSRF protection**: Token-based validation
- **Input validation**: SQL injection & XSS prevention
