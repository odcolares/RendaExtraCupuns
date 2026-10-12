# RendaExtraCupuns - Agent Guidelines

## Project Overview

This is a monorepo with two sub-projects:

### Root (bot/)
- **WhatsApp monitor** - monitors group/broadcast sources for offers
- **Affiliate link generator** - supports Amazon, Mercado Livre, Shopee, AliExpress
- **Telegram publisher** - posts formatted offers to Telegram channels with rate limiting
- **Coupon detector** - extracts promotional codes from WhatsApp messages
- **SQLite database** - via sql.js (WASM) for persistence
- **Phase 2 multi-tenant workers** - `src/bot/` (BotManager, TenantBot, entrypoint)

Tech: Node.js >= 18, TypeScript 5.4, Jest, Prisma 7.8 (Turso/libSQL)

### web/
- **Next.js 16 SaaS** - App Router, Server Actions, RSC
- **Prisma + Turso** - serverless SQLite-compatible database
- **NextAuth v5** - authentication with roles (admin/client)
- **Stripe** - subscription payments
- **shadcn/ui + Tailwind** - UI components

## Quick Commands

### Root (bot)
```bash
npm run dev          # Start bot (telegram + whatsapp + db)
npm run cli          # Interactive CLI mode
npm run whatsapp:qr  # Generate WhatsApp QR code only
npm run discover     # Discover group/broadcast IDs
npm run build        # Compile TypeScript
npm start            # Run production build
npm test             # Run Jest tests
npm run test:coverage # Tests with coverage report
npm run lint         # TypeScript type checking
```

### Web (web/)
```bash
cd web
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm test             # Run Vitest tests
npm run lint         # ESLint
```

### Database
```bash
npx prisma generate  # Generate Prisma client (root)
npx prisma db push   # Push schema changes
cd web && npx prisma studio  # Open Prisma Studio
```

### ML OAuth (one-time setup)
```bash
node scripts/setup-ml-oauth.js
```

## Directory Structure

```
RendaExtraCupuns/
├── src/                         # Bot source code
│   ├── index.ts, app.ts, processor.ts, cli.ts
│   ├── qr-only.ts, discover-group.ts, types.ts
│   ├── affiliates/              # Link generators (amazon, ML, shopee, aliexpress)
│   ├── telegram/                # Telegram publisher, bot, templates
│   ├── whatsapp/                # WhatsApp client, parser, extractor, monitor
│   ├── coupons/                 # Coupon detector
│   ├── database/                # SQLite (sql.js) CRUD
│   ├── utils/                   # Logger, helpers, product-fetcher
│   ├── bot/                     # Phase 2: multi-tenant BotManager/TenantBot
│   ├── config/index.ts          # Typed config loader
│   ├── lib/prisma.ts            # Prisma client (Turso adapter)
│   └── generated/prisma/        # Generated Prisma client (GIT IGNORED)
├── tests/                       # Jest tests (unit + integration)
├── prisma/                      # Prisma schema + root migrations
├── config/                      # Bot config (.env.example, .env ignored)
├── data/                        # SQLite databases (.gitkeep tracked)
├── scripts/                     # Utility scripts
├── docs/                        # Documentation
├── web/                         # Next.js SaaS web app
└── dist/                        # Compiled bot output (GIT IGNORED)
```

## Conventions

- **Path aliases**: `@/*` maps to `src/*` (root), `./src/*` (web)
- **Logger**: Use `createModuleLogger("ModuleName")` from `src/utils/logger.ts`
- **Config**: Loaded from `config/.env` via `src/config/index.ts`
- **Tests**: Root uses Jest (`tests/`), web uses Vitest (`src/`)
- **Generated files**: `src/generated/prisma/` is git-ignored; run `npx prisma generate` after schema changes
- **Graceful shutdown**: monitor -> WhatsApp -> Telegram -> DB (reverse order)
- **Rate limiting**: 30 messages/hour per Telegram channel

## Key Patterns

- **Singleton**: `getBot()`, `getClient()`, `getBotManager()`
- **Pipeline**: WhatsApp monitor -> processor.ts (extract -> detect -> affiliate -> publish -> DB)
- **Graceful degradation**: AliExpress/Shopee without affiliate ID use direct links (no pipeline break)
- **Tenant isolation**: Phase 2 bot uses `TenantBot` per-tenant with config from DB
- **Server Actions**: Web app uses Next.js Server Actions for mutations
