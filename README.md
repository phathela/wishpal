# WishPal

**WishPal** is a wish-matching platform where AI agents match wishes (demand) with businesses/service providers (supply). WishPal doesn't handle transactions — it generates leads through intelligent matching.

## How It Works

1. **Post a Wish** — WishMates submit wishes across categories (houses, jobs, services, items)
2. **AI Matching** — AI agents analyze each wish and search internal & external sources for matches
3. **Connect** — WishPads (businesses) pay 1 Wee ($0.10) to unlock match details and contact the WishMate

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Authentication:** JWT (email/password)
- **Payments:** Stripe (for purchasing "Wees")
- **Real-time:** Socket.io
- **AI Agents:** Mock implementation (structure ready for Groq/DeepSeek)

## User Types

| Role | Name | Cost |
|------|------|------|
| Regular user | WishMate | Free |
| Business | WishPad | Pays per match unlocked |

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL (local or remote)
- Stripe account (for payment features)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/phathela/wishpal.git
   cd wishpal
   ```

2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   ```bash
   cp .env.example backend/.env
   # Edit backend/.env with your database URL and Stripe keys
   ```

4. Set up the database:
   ```bash
   # Create the database
   createdb wishpal
   # Run migrations
   psql -d wishpal -f backend/db/migrations/001_schema.sql
   ```

5. Start development:
   ```bash
   npm run dev
   ```

   Frontend: http://localhost:5173
   Backend: http://localhost:5000

## Railway Deployment

1. Push to GitHub
2. Create a new Railway project and connect your repo
3. Add environment variables in Railway dashboard:
   - `DATABASE_URL` (Railway PostgreSQL plugin)
   - `JWT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `FRONTEND_URL`
4. Deploy — Railway will detect the Dockerfile

## Currency

- **1 Wee = $0.10 USD**
- WishMates never pay
- WishPads pay 1 Wee to unlock each match
- Premium usernames: 10 Wees ($1) standard, 100 Wees ($10) premium
