# Investment Flow Documentation

## User Investment Journey

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant S as Stripe
    participant D as Database
    participant N as Notification
    
    U->>F: Browse Projects
    F->>A: GET /api/projects
    A->>D: Query active projects
    D-->>A: Project list
    A-->>F: Return projects
    F-->>U: Display projects
    
    U->>F: Select project & amount
    F->>F: Validate amount (2€, 3€, 4€, 5€, 6€, 8€, 10€, 12€, 15€, 20€)
    F->>A: POST /api/investments
    A->>A: Check user balance
    A->>A: Validate investment rules
    
    alt Sufficient Balance
        A->>D: Create investment record
        A->>D: Update user balance
        A->>D: Update project funding
        D-->>A: Success
        A->>N: Send confirmation notification
        A-->>F: Investment confirmed
        F-->>U: Show success message
    else Insufficient Balance
        A->>S: Create Stripe payment intent
        S-->>A: Payment intent ID
        A-->>F: Redirect to payment
        F->>S: Complete payment
        S->>A: Webhook: payment_intent.succeeded
        A->>D: Create investment record
        A->>N: Send confirmation
        A-->>U: Investment confirmed
    end
\`\`\`

## Investment Rules

### Price Tiers (Investors)
- 2€, 3€, 4€, 5€, 6€, 8€, 10€, 12€, 15€, 20€

### Price Tiers (Porters)
- 2€, 3€, 4€, 5€, 10€

### Special Cases
- **Minor visitors (16-17)**: Maximum 200€ total investment
- **Overdraft**: Maximum -20€ allowed
- **Minimum project funding**: 30 projects to open category

### Revenue Distribution

#### Live Show (BATTLE)
- 40% Big Investors
- 30% Big Porters
- 20% Small Investors
- 10% VISUAL Platform

#### Categories (Films/Videos/Docs)
- 40% Big Investors
- 30% Big Porters
- 7% Small Investors (equal distribution)
- 23% VISUAL Platform

**Mode Selection**:
- N ≤ 120 projects: TOP 10 mode
- N > 120 projects: TOP 10% mode (Zipf distribution)
