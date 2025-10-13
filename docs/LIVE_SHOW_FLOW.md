# Live Show Weekly Flow

## Weekly Schedule

\`\`\`mermaid
gantt
    title VISUAL Studio Live Show - Weekly Schedule
    dateFormat YYYY-MM-DD
    section Pre-Show
    Voting Opens (Monday 00:00)           :a1, 2025-01-13, 5d
    AI Pre-Selection (Thursday 18:00)     :a2, 2025-01-16, 3h
    Finalist Designation (Thursday 21:00) :a3, 2025-01-16, 1h
    section Confirmations
    F1 Confirmation Deadline (Friday 12:00) :b1, 2025-01-17, 15h
    F2 Confirmation Deadline (Friday 18:00) :b2, 2025-01-17, 6h
    A1 Confirmation Deadline (Friday 20:00) :b3, 2025-01-17, 2h
    section Live Show
    Live Show Broadcast (Friday 21:00-00:00) :c1, 2025-01-17, 3h
    section Post-Show
    Winner Announcement (Saturday 00:00)   :d1, 2025-01-18, 1h
    Payout Processing (Saturday 01:00)     :d2, 2025-01-18, 2h
\`\`\`

## Contingency Scenarios

\`\`\`mermaid
flowchart TD
    A[Thursday 21:00: Designate F1, F2, A1, A2] --> B{Friday 12:00: F1 Confirmed?}
    B -->|Yes| C[F1 Participates]
    B -->|No| D{Friday 18:00: F2 Confirmed?}
    D -->|Yes| E[F2 Replaces F1 - Scenario S1]
    D -->|No| F{Friday 20:00: A1 Confirmed?}
    F -->|Yes| G[A1 Replaces F1 - Scenario S2]
    F -->|No| H{A2 Confirmed?}
    H -->|Yes| I[A2 Replaces F1 - Scenario S3]
    H -->|No| J[Showcase Mode - Scenario S4]
    
    C --> K[Live Show Friday 21:00]
    E --> K
    G --> K
    I --> K
    J --> L[No Battle, Showcase Only]
    
    K --> M[Winner Determined by Votes]
    M --> N[Payout Distribution 40/30/20/10]
\`\`\`

## Replacement Scenarios

| Scenario | Condition | Action | Notification |
|----------|-----------|--------|--------------|
| **S1** | F1 no-show, F2 confirmed | F2 → F1 position | F2 promoted, A1 → F2 |
| **S2** | F1 & F2 no-show, A1 confirmed | A1 → F1 position | A1 promoted, A2 → F2 |
| **S3** | F1, F2, A1 no-show, A2 confirmed | A2 → F1 position | A2 promoted, showcase mode |
| **S4** | All no-show | Showcase mode | No battle, display only |

## Voting System

### Vote Rates
- 1 VISUpoint = 1 vote
- 1€ investment = 10 votes
- Maximum votes per user: Unlimited
- Voting window: Monday 00:00 - Friday 21:00

### AI Pre-Selection (Thursday 18:00)
- Analyzes all projects with votes
- Considers: vote count, engagement, quality score
- Selects top candidates for final evaluation

### Final Selection (Thursday 21:00)
- Designates F1, F2 (finalists)
- Designates A1, A2 (alternates)
- Sends confirmation requests

## Live Show Format

### Duration: 3 hours (21:00 - 00:00)

**Structure**:
- 21:00-21:15: Opening & Finalist Presentation
- 21:15-21:45: F1 Project Showcase (30 min)
- 21:45-22:00: Ad Break 1 (15 min)
- 22:00-22:30: F2 Project Showcase (30 min)
- 22:30-22:45: Ad Break 2 (15 min)
- 22:45-23:30: Live Battle & Voting (45 min)
- 23:30-23:45: Ad Break 3 (15 min)
- 23:45-00:00: Winner Announcement & Closing (15 min)

**Total Ad Time**: 45 minutes (25% of show)
