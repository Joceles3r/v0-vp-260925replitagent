# Database Schema Documentation

## Core Tables

### users
Primary user account information

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique user identifier |
| username | VARCHAR(50) UNIQUE | User login name |
| email | VARCHAR(255) UNIQUE | User email address |
| role | ENUM | 'user', 'creator', 'admin', 'minor' |
| balance | DECIMAL(10,2) | Current account balance |
| visu_points | INTEGER | Gamification points |
| created_at | TIMESTAMP | Account creation date |
| kyc_status | ENUM | 'pending', 'approved', 'rejected' |
| stripe_account_id | VARCHAR(255) | Stripe Connect account |

**Indexes**:
\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_stripe_account ON users(stripe_account_id);
\`\`\`

### projects
Content projects for investment

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique project identifier |
| creator_id | INTEGER REFERENCES users(id) | Project creator |
| title | VARCHAR(255) | Project title |
| category | ENUM | 'Films', 'Vidéos', 'Documentaires', 'Livres' |
| status | ENUM | 'draft', 'active', 'funded', 'closed' |
| funding_goal | DECIMAL(10,2) | Target funding amount |
| current_funding | DECIMAL(10,2) | Current funding amount |
| video_id | VARCHAR(255) | Bunny.net video ID |
| created_at | TIMESTAMP | Project creation date |
| closes_at | TIMESTAMP | Category closure date |

**Indexes**:
\`\`\`sql
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_closes_at ON projects(closes_at);
\`\`\`

### investments
User investments in projects

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique investment identifier |
| user_id | INTEGER REFERENCES users(id) | Investor |
| project_id | INTEGER REFERENCES projects(id) | Invested project |
| amount | DECIMAL(10,2) | Investment amount |
| type | ENUM | 'investor', 'porter' |
| created_at | TIMESTAMP | Investment date |
| payout_amount | DECIMAL(10,2) | Revenue received |
| payout_date | TIMESTAMP | Payout date |

**Indexes**:
\`\`\`sql
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_project ON investments(project_id);
CREATE INDEX idx_investments_created_at ON investments(created_at);
CREATE INDEX idx_investments_type ON investments(type);
\`\`\`

### live_shows
Weekly live show events

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique show identifier |
| week_number | INTEGER | ISO week number |
| year | INTEGER | Year |
| f1_project_id | INTEGER REFERENCES projects(id) | Finalist 1 |
| f2_project_id | INTEGER REFERENCES projects(id) | Finalist 2 |
| a1_project_id | INTEGER REFERENCES projects(id) | Alternate 1 |
| a2_project_id | INTEGER REFERENCES projects(id) | Alternate 2 |
| winner_project_id | INTEGER REFERENCES projects(id) | Winner |
| status | ENUM | 'scheduled', 'live', 'completed', 'cancelled' |
| total_pot | DECIMAL(10,2) | Total prize pool |
| broadcast_date | TIMESTAMP | Show date & time |

**Indexes**:
\`\`\`sql
CREATE INDEX idx_live_shows_week ON live_shows(week_number, year);
CREATE INDEX idx_live_shows_status ON live_shows(status);
CREATE INDEX idx_live_shows_broadcast_date ON live_shows(broadcast_date);
\`\`\`

## Performance Optimization

### Recommended Indexes
\`\`\`sql
-- High-frequency queries
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_investments_project_amount ON investments(project_id, amount DESC);
CREATE INDEX idx_projects_category_status ON projects(category, status);

-- Composite indexes for complex queries
CREATE INDEX idx_users_role_created ON users(role, created_at DESC);
CREATE INDEX idx_projects_status_closes ON projects(status, closes_at);
\`\`\`

### Query Optimization Tips
1. **Use EXPLAIN ANALYZE** to identify slow queries
2. **Avoid SELECT \***: Specify only needed columns
3. **Use pagination**: LIMIT/OFFSET for large result sets
4. **Leverage indexes**: Ensure WHERE clauses use indexed columns
5. **Batch operations**: Use transactions for multiple inserts/updates
