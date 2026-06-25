# Ember — Non-Custodial Automated Trading & Investment Terminal

Ember is a 100% non-custodial automated trading terminal built on the high-performance **HotStuff Layer-1 (DracoBFT consensus)**. It enables users to deploy automated grid bots, recurring DCA investment strategies, and smart order execution splits (TWAP) on tokenized stocks, crypto, and RWAs. 

Ember integrates with the HotStuff L1 Builder Program, embedding a broker configuration into each executed transaction to generate on-chain yield.

---

## Key Features

- **DCA & Recurring Invest:** Automatically schedule tokenized stock and crypto accumulation cycles.
- **Smart TWAP & Execution:** Split large orders into multiple slices over time to capture maker rebates and reduce slippage.
- **Grid Bots:** Deploy buy/sell limit order grids to extract yield from flat, rangebound consolidation phases.
- **Non-Custodial Security Model:** Scoped Agent wallets sign trading orders programmatically. Withdrawals and transfers are strictly unauthorized.
- **Builder Dashboard:** Live tracking of broker fee approvals and on-chain fee claim/relays.

---

## Project Structure

This project is configured as a monorepo managed via `pnpm` and `turborepo`:

```text
├── apps/
│   ├── web/          # Next.js 14 Frontend dApp (Tailwind CSS + RainbowKit + Wagmi)
│   └── api/          # NestJS Backend API (BullMQ, Redis, JWT & SIWE Auth)
├── packages/
│   ├── config/       # Shared opcode and contract configurations
│   ├── types/        # Shared Zod validation schemas and TypeScript types
│   ├── strategies/   # DCA, TWAP, and Grid execution math engines
│   └── hotstuff-client/ # Resilient wrapper around the HotStuff L1 API
├── prisma/           # Database schemas for Postgres
├── docker-compose.yml # Dev services (Postgres & Redis)
└── pnpm-workspace.yaml
```

---

## Technology Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, RainbowKit, Wagmi, Viem, Zustand
- **Backend:** NestJS (TypeScript), Prisma ORM, BullMQ (Task Queue), Redis, JWT
- **Blockchain:** EIP-712 Typed Data Cryptography, MessagePack, HotStuff TS SDK
- **Database:** PostgreSQL (Supabase)

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.x.x
- A running Redis instance (Local or Cloud)
- A PostgreSQL database (Supabase)

### Local Configuration

Create a `.env` file in the root workspace directory:

```bash
# Environment & L1 Connections
HOTSTUFF_ENV=testnet
HOTSTUFF_REST_URL=https://testnet-api.hotstuff.trade
HOTSTUFF_WSS_URL=wss://testnet-api.hotstuff.trade/ws
HOTSTUFF_CHAIN_ID=1
HOTSTUFF_VERIFYING_CONTRACT=0x1234567890123456789012345678901234567890

# Builder Configuration
BUILDER_ADDRESS=0xYOUR_BUILDER_PUBLIC_ADDRESS
DEFAULT_BUILDER_FEE_BPS=3
MAX_BUILDER_FEE_BPS=10

# Agent Security & Encryption (32-character key)
AGENT_ENC_SECRET=ember-default-agent-encryption-secret-32-chars
JWT_SECRET=ember-jwt-secret-key-12345
PORT=4000

# Infrastructure
DATABASE_URL=postgresql://user:password@host:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/postgres
REDIS_URL=redis://localhost:6379
```

### Installation & Run

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Generate Prisma Client:**
   ```bash
   pnpm db:generate
   ```

3. **Run local dev services (Optional if using cloud equivalents):**
   ```bash
   docker compose up -d
   ```

4. **Start local development server:**
   ```bash
   pnpm dev
   ```
   - Web App will run on `http://localhost:3000`
   - Backend API will run on `http://localhost:4000`

---

## Deployment Guide

### Web App (Vercel)

1. Connect your repository to **Vercel**.
2. Set the root directory of the deployment to `apps/web`.
3. Configure the environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-api-domain.com`

### Backend API (Render / Railway / Koyeb)

1. Connect your repository to your backend host.
2. Set the root directory to `apps/api`.
3. Define the start command: `node dist/main.js` and build command: `pnpm install && pnpm build`.
4. Add all environment variables listed in the Local Configuration section (including `DATABASE_URL` and `REDIS_URL`).
