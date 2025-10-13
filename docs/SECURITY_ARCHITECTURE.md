# Security Architecture

## Multi-Layer Security

\`\`\`mermaid
graph TB
    subgraph "Layer 1: Network"
        A[Rate Limiting]
        B[IP Blacklist]
        C[DDoS Protection]
    end
    
    subgraph "Layer 2: Application"
        D[reCAPTCHA v3]
        E[CSRF Tokens]
        F[Input Validation]
        G[SQL Injection Prevention]
    end
    
    subgraph "Layer 3: Authentication"
        H[Replit Auth]
        I[Session Management]
        J[JWT Tokens]
    end
    
    subgraph "Layer 4: Data"
        K[AES-256 Encryption]
        L[Sensitive Data Masking]
        M[Audit Logs]
    end
    
    subgraph "Layer 5: Monitoring"
        N[Sentry Error Tracking]
        O[Suspicious Activity Detection]
        P[Fingerprint Analysis]
    end
    
    A --> D
    B --> D
    C --> D
    D --> H
    E --> H
    F --> H
    G --> H
    H --> K
    I --> K
    J --> K
    K --> N
    L --> N
    M --> N
    N --> O
    O --> P
\`\`\`

## Anti-Scraping Measures

### 1. reCAPTCHA v3
- **Score threshold**: 0.5
- **Applied to**: Login, registration, payment forms
- **Invisible**: No user interaction required

### 2. Browser Fingerprinting
- **Canvas fingerprinting**
- **WebGL fingerprinting**
- **Audio context fingerprinting**
- **Device detection**: Headless browser identification

### 3. Behavioral Analysis
- **Mouse movement tracking**
- **Keystroke dynamics**
- **Navigation patterns**
- **Time-on-page analysis**

### 4. Rate Limiting
\`\`\`typescript
// Per-user limits
const userLimits = {
  standard: 100 requests / 15 minutes,
  admin: 1000 requests / 15 minutes,
  anonymous: 20 requests / 15 minutes
};

// Per-endpoint limits
const endpointLimits = {
  '/api/auth/login': 5 attempts / 15 minutes,
  '/api/investments': 10 requests / minute,
  '/api/projects': 50 requests / minute
};
\`\`\`

### 5. Suspicious Activity Detection
- **Multiple failed login attempts**
- **Rapid sequential requests**
- **Unusual navigation patterns**
- **Headless browser signatures**
- **VPN/Proxy detection**

## Data Protection

### Encryption at Rest
- **Algorithm**: AES-256-GCM
- **Key rotation**: Every 90 days
- **Encrypted fields**:
  - User passwords (bcrypt)
  - Payment information
  - Personal identification data
  - API keys & secrets

### Encryption in Transit
- **TLS 1.3** for all connections
- **HSTS** enabled
- **Certificate pinning** for mobile apps

### GDPR Compliance
- **Right to access**: User data export
- **Right to erasure**: Account deletion
- **Right to portability**: Data download
- **Consent management**: Granular permissions
