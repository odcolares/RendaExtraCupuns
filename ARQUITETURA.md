# Arquitetura — RendaExtraCupuns SaaS (White-Label)

> **Versão**: 1.0  
> **Data**: 01/07/2026  
> **Propósito**: Documento de arquitetura para transformar o bot monousuário em plataforma SaaS white-label multi-tenant com painel admin web.

---

## Proposta de Valor

### O Problema

Milhares de brasileiros participam de grupos de WhatsApp com ofertas, promoções e cupons todos os dias. Esses grupos já existem — pessoas já compartilham links de produtos espontaneamente. O que **não existe** é uma forma automatizada de transformar esse conteúdo em **comissão de afiliado**.

Criar conteúdo do zero para postar em canal de ofertas dá trabalho. Monitorar grupos manualmente é inviável. As ferramentas existentes ou exigem configuração técnica, ou custam caro, ou simplesmente não funcionam com WhatsApp.

### A Solução

O **RendaExtraCupuns** é a única plataforma que **conecta o WhatsApp do cliente aos próprios grupos** e **transforma automaticamente ofertas já postadas em links de afiliado** — sem o cliente precisar criar conteúdo, sem precisar de conhecimento técnico, sem precisar mudar a rotina.

O cliente **não paga por conteúdo**. Ele paga pela **tecnologia que automatiza a geração de receita** a partir de algo que ele já tem: acesso a grupos de WhatsApp com ofertas.

### Diferenciais Competitivos

| Diferencial | RendaExtraCupuns | Concorrentes |
|-------------|------------------|--------------|
| **Fonte de ofertas** | Grupos de WhatsApp que o cliente JÁ participa | Exigem criar conteúdo ou conectar feeds próprios |
| **Automação** | 100% automática — detecta, afilia e publica | Muitas são semiautomáticas (requerem aprovação manual) |
| **Canais de saída** | Telegram (bot + canal do cliente) | Apenas e-mail ou notificação no app |
| **White-label** | Marca própria do cliente (nome, logo, cores) | Sem personalização |
| **Multi-plataforma** | Amazon, Shopee, Mercado Livre, AliExpress | Geralmente 1 ou 2 plataformas |
| **Infraestrutura** | Gerenciada (SaaS) — cliente só usa | Muitas exigem VPS próprio e configuração técnica |
| **Custo inicial** | Assinatura mensal acessível | Freemium limitado ou setup fee alto |

### Quem Compra

- **Afiliados iniciantes** que já participam de grupos de ofertas e querem monetizar sem esforço manual
- **Donos de grupos de WhatsApp** que querem transformar o grupo em fonte de receita sem poluir os membros
- **Criadores de conteúdo digital** que buscam renda passiva com afiliados
- **Pequenos marketers** que gerenciam múltiplos canais Telegram e precisam de escala

### Modelo de Receita

| Plano | Itens | Preço sugerido |
|-------|-------|----------------|
| **Free** | 2 fontes WhatsApp, 1 canal Telegram, sem branding | R$ 0 (atração) |
| **Pro** | 5 fontes, 1 canal, branding próprio | R$ 29–49/mês |
| **Enterprise** | Ilimitado, branding, múltiplos canais, prioridade | R$ 79–149/mês |

### A Máquina

> O cliente compra uma máquina que:
> 1. Escuta os grupos de WhatsApp que ele já participa
> 2. Identifica produtos e ofertas automaticamente
> 3. Gera links de afiliado nas melhores plataformas
> 4. Publica no canal Telegram dele com a marca dele
> 5. Gera comissão sem ele precisar fazer nada

**Ele não paga por oferta. Ele paga pela automação.**

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura Multi-Tenant](#3-arquitetura-multi-tenant)
4. [Migração WhatsApp: Baileys](#4-migração-whatsapp-baileys)
5. [Admin Panel (Next.js)](#5-admin-panel-nextjs)
6. [Modelo de Dados (PostgreSQL)](#6-modelo-de-dados-postgresql)
7. [Deploy e Infraestrutura](#7-deploy-e-infraestrutura)
8. [Fluxos do Sistema](#8-fluxos-do-sistema)
9. [Segurança](#9-segurança)
10. [Riscos e Mitigações](#10-riscos-e-mitigações)
11. [Fases de Implementação](#11-fases-de-implementação)

---

## 1. Visão Geral do Sistema

### 1.1 Propósito

Plataforma SaaS que permite a cada cliente:

- Conectar seu próprio WhatsApp (via QR code) para monitorar grupos/ofertas
- Conectar seu próprio bot Telegram (token via @BotFather)
- Publicar ofertas com links de afiliado no canal do cliente
- Personalizar branding (nome do bot, templates, identidade visual)

### 1.2 Diagrama de Contexto

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INTERNET                                   │
└─────────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Admin Web      │   │   Cliente        │   │   Cliente        │
│   (Você)         │   │   WhatsApp       │   │   Telegram       │
│   Gerencia tudo  │   │   + Telegram     │   │   Canal          │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                       │
         └──────────┬──────────┴───────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│                   PLATAFORMA                          │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │            VERCEL (Next.js)                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ Admin    │  │ API      │  │ Auth         │ │  │
│  │  │ Panel    │  │ Routes   │  │ (NextAuth)   │ │  │
│  │  └──────────┘  └──────────┘  └──────────────┘ │  │
│  └────────────────────────────────────────────────┘  │
│                         │                             │
│                         ▼                             │
│  ┌────────────────────────────────────────────────┐  │
│  │              VPS (Docker/Podman)                │  │
│  │                                                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐ │  │
│  │  │ API        │  │ Session    │  │ PostgreSQL│ │  │
│  │  │ Gateway    │  │ Manager    │  │ (Multi-   │ │  │
│  │  │ (Fastify)  │  │            │  │  tenant)  │ │  │
│  │  └────────────┘  └────────────┘  └──────────┘ │  │
│  │                                                 │  │
│  │  ┌─────────────────────────────────────────┐   │  │
│  │  │         WORKER POOL (PM2)               │   │  │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │   │  │
│  │  │  │ Cliente1 │ │ Cliente2 │ │ Cliente N│ │   │  │
│  │  │  │ Baileys  │ │ Baileys  │ │ Baileys │ │   │  │
│  │  │  │ Telegraf │ │ Telegraf │ │ Telegraf│ │   │  │
│  │  │  │ Marca X  │ │ Marca Y  │ │ Marca Z │ │   │  │
│  │  │  └─────────┘ └─────────┘ └─────────┘  │   │  │
│  │  └─────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 1.3 Princípios Arquiteturais

| Princípio | Descrição |
|-----------|-----------|
| **Isolamento de inquilinos** | Cada cliente opera em worker independente. Falha de um não afeta outros. |
| **Stateless API** | API do admin panel sem estado (estado fica no PostgreSQL/Redis). |
| **Branding dinâmico** | Templates de mensagem são renderizados com configuração por cliente. |
| **Filas assíncronas** | Operações pesadas (scraping, resolução de URL) via fila para não bloquear. |
| **Graceful degradation** | Se um afiliado falha, pipeline continua com link direto. |

---

## 2. Stack Tecnológica

### 2.1 Tabela de Componentes

| Componente | Tecnologia | Justificativa |
|------------|-----------|---------------|
| **Admin Panel** | **Next.js 14+** (App Router) | SSR, RSC, API routes nativas, TypeScript |
| **Autenticação** | **NextAuth.js** | JWT + provedores, integração Next.js nativa |
| **UI Framework** | **shadcn/ui + Tailwind CSS** | Componentes acessíveis, customizáveis, white-label |
| **Formulários** | **React Hook Form + Zod** | Validação tipada, performática |
| **ORM** | **Prisma** | Type-safe, migrations, suporte PostgreSQL |
| **Banco** | **PostgreSQL 16** | Multi-tenant, conexões concorrentes, JSONB |
| **API Gateway (VPS)** | **Fastify** | Mais rápido que Express, schema validation |
| **WhatsApp** | **@whiskeysockets/baileys** | Zero Chromium, ~30MB RAM por sessão, WebSocket |
| **Telegram** | **Telegraf v4** | Já utilizado, adaptar para multi-tenant |
| **Fila/Task** | **BullMQ + Redis** | Processamento assíncrono de mensagens |
| **Cache** | **Redis** | Sessões, rate limit, cache de queries |
| **Logger** | **Winston** | Já utilizado, adicionar transporte remoto |
| **Deploy Web** | **Vercel** | Escala automática, CDN, HTTPS gratuito |
| **Deploy Workers** | **VPS (Ubuntu) + PM2 ou Docker** | Processos persistentes 24/7 |
| **Monitoramento** | **Sentry (free tier)** | Erros em produção |

### 2.2 Por que Fastify e não Express?

| Critério | Express | Fastify |
|----------|---------|---------|
| Performance (req/s) | ~30K | ~76K |
| Schema validation | Manual (Joi/Zod) | Nativo (JSON Schema) |
| Plugin system | Manual | Encapsulado |
| TypeScript | OK | Excelente |

### 2.3 Por que Prisma e não Drizzle/Knex?

Prisma oferece **migrations declarativas**, **type-safety** e **client gerado** — reduz bugs em schema multi-tenant complexo. Drizzle é mais leve, mas Prisma acelera o desenvolvimento inicial.

---

## 3. Arquitetura Multi-Tenant

### 3.1 Modelo de Isolamento: **Database per Tenant + Shared Metadata**

```
PostgreSQL
├── public schema (metadados globais)
│   ├── tenants
│   ├── plans
│   └── users (admin)
│
├── tenant_{uuid} schema (dados do cliente)
│   ├── offers
│   ├── affiliate_configs
│   ├── telegram_bot_config
│   ├── whatsapp_session
│   ├── branding
│   └── published_messages
│
└── ...
```

**Motivo**: Isolamento total dos dados. Um cliente nunca acessa dados de outro. Backup/restore por cliente. Schema separado permite customizações futuras sem risco.

### 3.2 Identificação do Tenant

Cada requisição carrega o `tenant_id` via:

- **Admin Web**: JWT token contém `tenant_id` — extraído no middleware Next.js
- **Workers**: Variável de ambiente configurada no worker do cliente
- **API Gateway**: Header `X-Tenant-ID` para chamadas internas

### 3.3 Pool de Conexões

Usar **PgBouncer** (transaction mode) para gerenciar conexões concorrentes entre workers. Cada worker do cliente abre conexão própria com o schema do tenant.

---

## 4. Migração WhatsApp: Baileys

### 4.1 Por que Baileys?

| Característica | whatsapp-web.js (atual) | Baileys |
|----------------|------------------------|---------|
| Engine | Puppeteer (Chromium) | WebSocket puro |
| RAM por sessão | 400–800 MB | ~30 MB |
| CPU | Alto | Baixo |
| Inicialização | 5–15s (abrir navegador) | <1s |
| Multi-dispositivo | Limitado | Nativo |
| QR Code | Sim | Sim |
| TypeScript | Sim (tipos parciais) | Sim (tipos excelentes) |
| Manutenção | Ativo | Ativo |

### 4.2 Impacto da Migração

```
Arquivos atuais a migrar (src/whatsapp/):

  client.ts       →  Baileys client (socket + auth)
  parser.ts       →  Reaproveitar (lógica de extração de links)
  extractor.ts    →  Reaproveitar (lógica de preços BR)
  monitor.ts      →  Reaproveitar (lógica de filtro por fontes)
  types.ts        →  Adaptar tipos para Baileys
  index.ts        →  Re-export atualizado

Arquivos que NÃO mudam:
  src/affiliates/     →  Lógica de afiliados independente
  src/telegram/       →  Telegraf continua igual
  src/processor.ts    →  Pipeline permanece
  src/database/       →  Precisa adaptar para PostgreSQL
```

### 4.3 Arquitetura do Worker WhatsApp

```
Worker Process (PM2 fork mode por cliente)
├── BaileysSocket (WebSocket WhatsApp)
├── Auth State (credenciais armazenadas no PostgreSQL)
├── QR Code Handler (gera QR → envia pro admin web via Redis pub/sub)
├── Message Handler (mensagens recebidas → fila BullMQ)
└── Health Check (heartbeat a cada 30s)
```

### 4.4 Fluxo de Conexão

```
1. Admin cria cliente no painel → worker spawnado
2. Worker inicia Baileys socket
3. Se precisa de QR:
   a. Gera QR code → publica no Redis channel `qr:{tenant_id}`
   b. Admin web escuta SSE/WebSocket → exibe QR no navegador
   c. Cliente escaneia com WhatsApp
   d. Worker persiste credenciais no PostgreSQL
4. Se já tem credenciais:
   a. Reconecta automaticamente
   b. Inicia monitoramento
5. Health check contínuo
```

### 4.5 Tratamento de Desconexão

- **Desconexão normal**: Reconexão automática com backoff exponencial (5s, 10s, 20s, 60s)
- **QR expirado**: Notifica admin para novo scan
- **Conta banida**: Marca worker como `blocked` e notifica admin
- **Mudança de número**: Cliente precisa reconectar

---

## 5. Admin Panel (Next.js)

### 5.1 Estrutura de Rotas

```
/                           → Landing page (pública)
/auth                       → Login (NextAuth)
  /login
  /register                 → Futuro: self-signup

/admin                      → Dashboard (protegido)
  /dashboard                → Métricas: ofertas/dia, clientes ativos, sessões
  /tenants
    /                      → Lista de clientes (CRUD)
    /[id]                   → Detalhe do cliente
    /[id]/whatsapp          → QR code, status, logs
    /[id]/telegram          → Config bot token, canal
    /[id]/branding          → Nome, logo, templates
    /[id]/ofertas           → Ofertas recentes do cliente
  /plans
    /                      → Tabela de planos (Grátis/Pro/Enterprise)
  /logs                    → Logs centralizados
  /settings                → Config globais (afiliados, API keys)
```

### 5.2 Componentes-chave

```
components/
├── ui/                     # shadcn/ui components
├── layout/
│   ├── sidebar.tsx         # Navegação com tenant switcher
│   ├── header.tsx          # Breadcrumb + avatar
│   └── tenant-guard.tsx    # Verifica permissão do tenant
├── tenants/
│   ├── tenant-table.tsx    # Lista com status, plano, última atividade
│   ├── tenant-form.tsx     # Criar/editar cliente
│   ├── whatsapp-qr.tsx     # Exibição do QR code em tempo real
│   ├── whatsapp-status.tsx # Status: connected/connecting/expired/blocked
│   └── branding-form.tsx   # Formulário de personalização
├── dashboard/
│   ├── stats-cards.tsx     # Cards de métricas
│   ├── offers-chart.tsx    # Gráfico de ofertas ao longo do tempo
│   └── sessions-map.tsx    # Status das sessões
└── shared/
    ├── data-table.tsx      # Tabela genérica com paginação
    └── confirm-dialog.tsx  # Modal de confirmação
```

### 5.3 API Routes (Next.js)

```
/api
├── auth/[...nextauth]       → NextAuth (credenciais + JWT)
├── tenants
│   ├── GET                  → Listar clientes (admin)
│   ├── POST                 → Criar cliente
│   ├── [id]
│   │   ├── GET              → Detalhe
│   │   ├── PATCH            → Atualizar
│   │   └── DELETE           → Desativar
│   ├── [id]/whatsapp
│   │   ├── POST /connect    → Iniciar conexão (gera QR)
│   │   ├── POST /disconnect → Desconectar
│   │   └── GET /status      → Status da sessão
│   ├── [id]/telegram
│   │   ├── POST /test       → Enviar mensagem de teste
│   │   └── PATCH            → Atualizar token/channel
│   └── [id]/branding        → CRUD branding
├── offers                   → Ofertas (filtradas por tenant do JWT)
├── plans                    → CRUD planos
├── webhooks
│   └── whatsapp/:tenantId   → Webhook do worker para admin
└── ws/qr/:tenantId          → WebSocket para QR code em tempo real
```

### 5.4 Autenticação

**NextAuth.js** com:
- Provedor **Credentials** (email + senha) — apenas admin
- JWT armazenado em cookie httpOnly
- Role: `super_admin` (acesso total) | `support` (leitura)
- Middleware Next.js protege rotas `/admin/*`

### 5.5 Comunicação Admin ↔ Workers

```
Admin (Next.js/Vercel)                    VPS (Workers)
       │                                      │
       │  HTTP REST (API Gateway)              │
       │  POST /api/tenants/5/whatsapp/connect │
       │─────────────────────────────────────►│
       │                                      │
       │  POST /api/webhooks/whatsapp/5        │
       │◄─────────────────────────────────────│  (QR gerado, status)
       │                                      │
       │  WebSocket (QR code em tempo real)    │
       │◄─────────────────────────────────────│  (stream de QR)
```

Para bypassar o firewall VPS, o worker faz **outbound connections** para a API do Next.js (webhooks reversos). O QR code usa **WebSocket via Vercel** ou **Server-Sent Events**.

---

## 6. Modelo de Dados (PostgreSQL)

### 6.1 Schema Global (`public`)

```sql
-- Tabela de planos
CREATE TABLE public.plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL,       -- 'Free', 'Pro', 'Enterprise'
  price_cents INTEGER NOT NULL DEFAULT 0, -- em centavos (R$ 0 = grátis)
  max_whatsapp_sources INTEGER NOT NULL DEFAULT 2,
  max_telegram_channels INTEGER NOT NULL DEFAULT 1,
  has_branding BOOLEAN DEFAULT FALSE,
  has_analytics BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes (tenants)
CREATE TABLE public.tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,    -- Nome do cliente/empresa
  email           VARCHAR(255) UNIQUE NOT NULL,
  plan_id         UUID REFERENCES public.plans(id),
  status          VARCHAR(20) DEFAULT 'active',  -- active, suspended, cancelled
  whatsapp_status VARCHAR(20) DEFAULT 'disconnected',  -- disconnected, connecting, connected, expired, blocked
  telegram_status VARCHAR(20) DEFAULT 'inactive',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_activity   TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários admin da plataforma
CREATE TABLE public.admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'super_admin',  -- super_admin, support
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Config de afiliados por tenant
CREATE TABLE tenant_{uuid}.affiliate_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform        VARCHAR(20) NOT NULL,  -- amazon, shopee, aliexpress, mercadolivre
  affiliate_id    VARCHAR(255),
  is_active       BOOLEAN DEFAULT TRUE,
  config_json     JSONB,                 -- dados específicos de cada plataforma
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Schema por Tenant (`tenant_{uuid}`)

```sql
CREATE SCHEMA IF NOT EXISTS tenant_{uuid};

-- Configuração do WhatsApp
CREATE TABLE tenant_{uuid}.whatsapp_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_data     TEXT,                  -- Credenciais criptografadas do Baileys
  source_group_ids TEXT[],                -- IDs dos grupos monitorados
  source_broadcast_ids TEXT[],
  source_newsletter_ids TEXT[],
  qr_code          TEXT,                  -- QR atual (base64)
  qr_expires_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração do Telegram
CREATE TABLE tenant_{uuid}.telegram_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_token       VARCHAR(100) NOT NULL,  -- Token do @BotFather
  channel_id      VARCHAR(50),            -- ID do canal
  channel_url     VARCHAR(255),           -- Link do canal
  is_active       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Branding (white-label)
CREATE TABLE tenant_{uuid}.branding (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name         VARCHAR(100) DEFAULT 'Ofertas',
  bot_avatar_url   TEXT,
  primary_color    VARCHAR(7) DEFAULT '#2563eb',   -- Hex
  message_template TEXT,                            -- Template customizado
  footer_text      VARCHAR(200) DEFAULT 'Links de afiliado - podemos ganhar comissão',
  logo_url         TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Ofertas processadas
CREATE TABLE tenant_{uuid}.offers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message  TEXT,
  platform          VARCHAR(20),          -- amazon, shopee, aliexpress, mercadolivre
  product_name      VARCHAR(500),
  product_price     DECIMAL(10,2),
  product_url       TEXT,
  affiliate_url     TEXT,
  coupon_code       VARCHAR(50),
  discount_percent  INTEGER,
  image_url         TEXT,
  source            VARCHAR(50),           -- grupo, broadcast, newsletter
  status            VARCHAR(20) DEFAULT 'pending',  -- pending, published, failed
  published_at      TIMESTAMPTZ,
  telegram_msg_id   INTEGER,              -- ID da mensagem no Telegram
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Índices Críticos

```sql
CREATE INDEX idx_offers_tenant_created ON tenant_{uuid}.offers(created_at DESC);
CREATE INDEX idx_offers_tenant_status ON tenant_{uuid}.offers(status);
CREATE INDEX idx_offers_tenant_platform ON tenant_{uuid}.offers(platform);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_plan ON public.tenants(plan_id);
```

---

## 7. Deploy e Infraestrutura

### 7.1 Deploy Admin Panel → Vercel

```
next.config.js:
  - output: standalone
  - env: DATABASE_URL, NEXTAUTH_SECRET, VPS_API_URL
  - Vercel auto-deploy via GitHub (push na main)
```

### 7.2 Deploy Workers → VPS

**Opção A — PM2 (recomendado para início)**

```bash
# estrutura no VPS
/opt/rendaextra/
├── dist/                    # Build do worker (npm run build)
├── ecosystem.config.cjs     # PM2 config com processo por tenant
├── tenants/
│   ├── {tenant_id}/
│   │   ├── session/         # Dados da sessão WhatsApp
│   │   └── logs/            # Logs do Winston
│   └── ...
├── .env                     # Config global (DB URL, Redis)
└── package.json
```

```js
// ecosystem.config.cjs — modo cluster adaptado
module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'dist/api-gateway.js',
      instances: 2,
      exec_mode: 'cluster',
      env: { PORT: 3001 }
    },
    {
      name: 'worker-{tenant_id}',
      script: 'dist/worker.js',
      args: '--tenant {tenant_id}',
      instances: 1,
      exec_mode: 'fork',            // fork = 1 processo isolado
      max_memory_restart: '256M',   // Baileys é leve
      env: { TENANT_ID: '{tenant_id}' }
    }
    // Novo worker para cada cliente
  ]
};
```

**Opção B — Docker (quando escalar)**

```dockerfile
# Dockerfile.worker
FROM node:20-slim
RUN apt-get update && apt-get install -y openssl ca-certificates
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
CMD ["node", "dist/worker.js", "--tenant", "$TENANT_ID"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

  api-gateway:
    build: .
    command: node dist/api-gateway.js
    ports: ['3001:3001']

  worker-{tenant_id}:
    build: .
    command: node dist/worker.js --tenant {tenant_id}
    depends_on: [postgres, redis]
    # Escalar: docker compose up -d --scale worker=5
```

### 7.3 Especificação de VPS Mínima

| Estágio | Clientes | RAM | CPU | Disco | Custo/mês |
|---------|----------|-----|-----|-------|-----------|
| **MVP** (1-5) | 3-5 | 2 GB | 2 vCPU | 40 GB | ~$10-15 |
| **Crescendo** (5-20) | 10-20 | 4 GB | 4 vCPU | 80 GB | ~$20-30 |
| **Escalando** (20+) | 20-50+ | 8+ GB | 4+ vCPU | 160 GB | ~$40-60 |

**Provedores recomendados (custo-benefício)**:
- **Hetzner Cloud** — CX22 (2 vCPU, 4 GB) ~€8/mês
- **DigitalOcean** — Basic (2 vCPU, 4 GB) ~$24/mês
- **Contabo** — VPS S (4 vCPU, 8 GB) ~€6/mês (menos performance mas muito barato)

### 7.4 CI/CD

```
GitHub → push na main
  ├── Vercel: auto-deploy do admin panel
  └── GitHub Actions:
      ├── Build worker (npm run build)
      ├── Rodar testes (npm test)
      ├── Lint (tsc --noEmit)
      └── Deploy no VPS via rsync/SCP ou Docker Hub + watchtower
```

---

## 8. Fluxos do Sistema

### 8.1 Onboarding de Novo Cliente

```
1. Admin cria cliente no painel → INSERT em public.tenants
2. Sistema cria schema tenant_{uuid}
3. Admin preenche configurações:
   a. Grupos WhatsApp (IDs)
   b. Token do bot Telegram
   c. ID do canal Telegram
   d. Config de afiliados
   e. Branding (opcional)
4. Sistema inicia worker:
   a. Spawna processo PM2 (ou container Docker)
   b. Worker conecta Baileys → gera QR code
   c. QR code aparece no admin panel via WebSocket
   d. Admin envia QR para o cliente escanear
5. Worker conectado → monitoramento ativo
6. Admin testa com oferta manual via CLI ou bot Telegram
7. Cliente confirmado → ativo
```

### 8.2 Pipeline de Oferta (por cliente)

```
WhatsApp (grupo/broadcast/newsletter do cliente)
    │
    ▼
Worker Baileys (message handler)
    │  Filtra por fontes configuradas
    ▼
Extractor (parser.ts + extractor.ts — REAPROVEITADO)
    │  Extrai: links, nome, preço
    ▼
Detect Platform (detectPlatform — REAPROVEITADO)
    │  Amazon, Shopee, ML, AliExpress
    ▼
Affiliate Link (generateAffiliateLink — ADAPTADO)
    │  Usa affiliate_configs do tenant
    ▼
Publish (Telegram Bot do cliente)
    │  Template de mensagem com branding
    ▼
Registro (INSERT INTO tenant_{uuid}.offers)
```

### 8.3 Ciclo de Vida de um Worker

```
[CREATED] → worker criado, sem sessão
    │
    ▼
[CONNECTING] → Baileys tentando conectar / QR gerado
    │
    ▼
[CONNECTED] → WhatsApp conectado, monitorando
    │
    ├──→ [DISCONNECTED] → reconexão automática → [CONNECTING]
    ├──→ [EXPIRED] → QR expirou → notifica admin
    └──→ [BLOCKED] → conta bloqueada → notifica admin (requer novo WhatsApp)
```

---

## 9. Segurança

### 9.1 Proteção de Tokens

| Token/Chave | Onde armazena | Criptografia |
|-------------|---------------|--------------|
| Telegram Bot Token | PostgreSQL (tenant_{uuid}.telegram_config) | AES-256-GCM |
| WhatsApp Credentials | PostgreSQL (tenant_{uuid}.whatsapp_config) | AES-256-GCM |
| JWT Secret | Vercel env + VPS env | N/A (variável de ambiente) |
| Database URL | Vercel env + VPS env | N/A |
| ML OAuth Tokens | PostgreSQL (tenant_{uuid}.affiliate_configs) | AES-256-GCM |

### 9.2 Isolamento

- Workers rodam em **processos separados** (PM2 fork mode)
- Cada worker só acessa **seu schema** no PostgreSQL
- API Gateway valida `tenant_id` do JWT antes de qualquer operação
- Rate limiting por tenant (30 msgs/hora Telegram)

### 9.3 Comunicação Segura

- Admin ↔ Vercel: HTTPS (Vercel automático)
- VPS ↔ Vercel: HTTPS + API key secreta
- Workers → PostgreSQL: SSL
- Redis: password + rede interna

---

## 10. Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| **WhatsApp banir número do cliente** | Cliente perde acesso | Média | Documentar riscos para cliente; worker detecta e notifica; cliente usa número secundário |
| **Baileys quebrar com atualização WhatsApp** | Todos os clientes afetados | Média | Monitorar repositório Baileys; testes semanais; fallback temporário pra CLI mode |
| **Custos de infraestrutura crescerem** | Margem reduzida | Alta | Auto-scaling sob demanda; alerts de custo; upgrade de planos cobre infra |
| **Cliente inadimplente** | Perda de receita | Média | Suspender automaticamente após X dias; reter dados por 30 dias |
| **Vazamento de token Telegram** | Bot sequestrado | Baixa | Criptografia AES em repouso; rotação de chaves; revogação manual |
| **Escalabilidade do VPS** | Lentidão com muitos workers | Média | Docker + orquestração; métricas de alerta; plano de migração horizontal |

---

## 11. Fases de Implementação

### Fase 0 — Fundação (Estimativa: 1–2 semanas)

```
[ ] Criar projeto Next.js com estrutura de pastas
[ ] Configurar Prisma + PostgreSQL (schema global)
[ ] Configurar NextAuth.js (login admin)
[ ] Migrar código atual para usar Prisma (em vez de sql.js)
[ ] Setup do VPS: Node, PM2, PostgreSQL, Redis
[ ] CI/CD básico (GitHub Actions + Vercel)
```

### Fase 1 — Núcleo Multi-Tenant (Estimativa: 2–3 semanas)

```
[ ] Migrar WhatsApp de whatsapp-web.js para Baileys
[ ] Implementar Session Manager no VPS (spawn/kill workers)
[ ] Schema tenant_{uuid} via migration dinâmica
[ ] Webhook de comunicação worker → admin
[ ] WebSocket para QR code em tempo real
[ ] Adaptar pipeline (processor.ts) para multi-tenant
[ ] Tests: Baileys, multi-tenant pipeline
```

### Fase 2 — Admin Panel (Estimativa: 2–3 semanas)

```
[ ] CRUD de clientes (tenants)
[ ] Dashboard com métricas básicas
[ ] Interface de conexão WhatsApp (QR code)
[ ] Configuração de Telegram (token + test)
[ ] Gerenciamento de planos
[ ] Branding white-label (nome, templates)
[ ] Histórico de ofertas por cliente
```

### Fase 3 — Polimento e Produção (Estimativa: 1–2 semanas)

```
[ ] Sistema de planos (gratuito vs pago)
[ ] Landing page do produto
[ ] Onboarding automatizado (script de setup)
[ ] Monitoramento (Sentry + health checks)
[ ] Backup automatizado do PostgreSQL
[ ] Documentação do admin
[ ] Testes E2E do fluxo completo
```

### Fase 4 — Monetização (Estimativa: 1–2 semanas — futuro)

```
[ ] Gateway de pagamento (Stripe ou Mercado Pago)
[ ] Self-signup (cliente se cadastra sozinho)
[ ] Upgrade/downgrade de planos automático
[ ] Controle de uso por plano (limites)
[ ] Emissão de notas/recebimentos
```

---

## 12. Módulo Web — Estrutura Detalhada

### 12.1 Estrutura de Diretórios (Next.js + App Router)

```
web/
├── app/                              # Next.js App Router
│   ├── page.tsx                      # Landing page pública
│   ├── layout.tsx                    # Root layout (fontes, metadata)
│   │
│   ├── (auth)/                       # Grupo de rotas públicas
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/                  # Grupo de rotas protegidas
│   │   ├── layout.tsx                # Sidebar + Header + TenantGuard
│   │   ├── page.tsx                  # Redirect p/ /dashboard
│   │   │
│   │   ├── dashboard/page.tsx        # Métricas gerais
│   │   │
│   │   ├── tenants/
│   │   │   ├── page.tsx              # Lista de clientes (data-table)
│   │   │   ├── new/page.tsx          # Criar cliente (form wizard)
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Visão geral do cliente
│   │   │       ├── whatsapp/page.tsx # QR + status + fontes
│   │   │       ├── telegram/page.tsx # Token + canal + teste
│   │   │       ├── branding/page.tsx # Nome, logo, cores, templates
│   │   │       ├── affiliates/page.tsx # IDs de afiliado por plataforma
│   │   │       ├── offers/page.tsx   # Histórico de ofertas
│   │   │       └── settings/page.tsx # Suspender, plano, etc
│   │   │
│   │   ├── plans/page.tsx            # CRUD de planos
│   │   └── logs/page.tsx             # Logs centralizados
│   │
│   └── api/                          # API Routes
│       ├── auth/[...nextauth]/route.ts
│       ├── tenants/
│       │   ├── route.ts              # GET (listar), POST (criar)
│       │   └── [id]/
│       │       ├── route.ts          # GET, PATCH, DELETE
│       │       ├── whatsapp/
│       │       │   └── route.ts      # POST connect/disconnect, GET status
│       │       ├── telegram/
│       │       │   └── route.ts      # POST test, PATCH config
│       │       └── branding/
│       │           └── route.ts
│       └── webhooks/
│           └── whatsapp/route.ts     # Callback do worker → admin
│
├── components/
│   ├── ui/                           # shadcn/ui (botão, input, card, tabela...)
│   │
│   ├── layout/
│   │   ├── sidebar.tsx               # Navegação com tenant switcher
│   │   ├── header.tsx                # Breadcrumb + user menu
│   │   ├── tenant-guard.tsx          # Valida permissão do tenant
│   │   └── mobile-nav.tsx
│   │
│   ├── tenants/
│   │   ├── tenant-table.tsx          # Tabela com status, plano, ações
│   │   ├── tenant-form-wizard.tsx    # Formulário multi-etapas
│   │   ├── tenant-card.tsx           # Card de resumo do cliente
│   │   ├── whatsapp-qr.tsx           # Componente de QR code com SSE
│   │   ├── whatsapp-status-badge.tsx # Status com cor (verde/amarelo/vermelho)
│   │   ├── whatsapp-sources.tsx      # Gerenciar grupos/broadcasts
│   │   └── telegram-config.tsx       # Token + canal + botão de teste
│   │
│   ├── branding/
│   │   ├── branding-form.tsx         # Nome, logo, cores
│   │   ├── color-picker.tsx
│   │   ├── logo-upload.tsx
│   │   └── template-preview.tsx      # Preview da mensagem em tempo real
│   │
│   ├── affiliates/
│   │   └── affiliate-config.tsx      # Config por plataforma
│   │
│   ├── dashboard/
│   │   ├── stats-cards.tsx           # Cards de métricas (clientes ativos, ofertas, etc)
│   │   ├── offers-chart.tsx          # Gráfico de ofertas no tempo
│   │   ├── recent-offers.tsx         # Últimas ofertas de todos tenants
│   │   └── sessions-status.tsx       # Status geral das sessões
│   │
│   └── shared/
│       ├── data-table.tsx            # Tabela genérica (sort, filter, pagination)
│       ├── confirm-dialog.tsx
│       ├── empty-state.tsx
│       └── page-header.tsx
│
├── lib/
│   ├── prisma.ts                     # Singleton do Prisma Client
│   ├── auth.ts                       # Config NextAuth (JWT, callbacks, providers)
│   ├── auth-config.ts                # Tipos e helpers de auth
│   ├── api-client.ts                 # Cliente HTTP para API do VPS
│   ├── encryption.ts                 # AES-256-GCM para tokens em repouso
│   ├── tenant.ts                     # Helpers: criar schema, migrar
│   └── utils.ts                      # cn(), formatDate(), formatBRL()
│
├── hooks/
│   ├── use-qr-code.ts                # Hook SSE: conecta ao canal de QR do tenant
│   ├── use-tenants.ts                # React Query: CRUD tenants
│   ├── use-offers.ts                 # React Query: ofertas por tenant
│   ├── use-worker-status.ts          # Polling health check do worker
│   └── use-debounce.ts
│
├── stores/                           # (opcional) State global
│   └── app-store.ts                  # Zustand: tenant ativo, sidebar state
│
├── types/
│   └── index.ts                      # Tipos compartilhados
│
├── prisma/
│   └── schema.prisma                 # Modelo de dados completo
│
├── public/
│   └── images/
│       └── logo.svg
│
├── .env.local
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

### 12.2 Layout do Dashboard

```
┌──────────────────────────────────────────────────────┐
│  Header                                                │
│  Breadcrumb: Dashboard > Clientes > João Silva         │
│                                            [avatar ▼]  │
├──────────┬───────────────────────────────────────────┤
│ Sidebar  │  Content Area                               │
│          │                                             │
│  📊      │  ┌──────────────────────────────────┐      │
│  Dashboard│  │  Stats Cards                     │      │
│          │  │  [Clientes] [Ofertas] [Ativos]    │      │
│  👥      │  └──────────────────────────────────┘      │
│  Clientes │                                             │
│          │  ┌──────────────────────────────────┐      │
│  ├─ Novo │  │  Tabela de Clientes              │      │
│  ├─ ID   │  │  Nome │ Status │ Plano │ Ações   │      │
│    ├─ WP │  │  ...  │  ✅    │  Pro   │ [...]  │      │
│    ├─ TG │  │  ...  │  ❌    │  Free  │ [...]  │      │
│    ├─ Marca│ │  ...  │  ⏳    │  Pro   │ [...]  │      │
│    └─ Ofertas│ └──────────────────────────────────┘      │
│          │                                             │
│  💳 Planos│                                             │
│  📋 Logs │                                             │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

### 12.3 Autenticação (NextAuth.js)

```
NextAuth.js (Credentials provider)
    │
    ├── /api/auth/[...nextauth]
    │       ├── POST /login  → valida email + senha
    │       ├── JWT gerado   → role: super_admin | support
    │       └── Session callback → anexa role ao token
    │
    └── Middleware (middleware.ts)
            ├── protege /dashboard/*, /api/tenants/*
            └── redirect para /login se não autenticado
```

**JWT contém:**
```ts
{
  sub: "admin-uuid",
  email: "admin@email.com",
  role: "super_admin",
  iat: timestamp,
  exp: timestamp
}
```

Apenas o **admin da plataforma** acessa o painel. Clientes não têm login — o admin configura cada conta ou envia um link único de configuração (modelo B2B).

### 12.4 Fluxo de Conexão WhatsApp (QR Code)

Este é o momento mais crítico da UX — o cliente precisa escanear um QR code.

```
┌──────────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL (Next.js)                          │
│                                                                   │
│  Página: /dashboard/tenants/[id]/whatsapp                         │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ whatsapp-qr.tsx                                            │   │
│  │                                                            │   │
│  │  [Botão] "Conectar WhatsApp"                               │   │
│  │      │                                                     │   │
│  │      ▼                                                     │   │
│  │  POST /api/tenants/[id]/whatsapp/connect                   │   │
│  │      │                                                     │   │
│  │      ▼                                                     │   │
│  │  API Route → chama VPS: POST /vps/worker/[id]/connect      │   │
│  │      │                                                     │   │
│  │      ▼                                                     │   │
│  │  VPS spawna/reutiliza worker → Baileys gera QR             │   │
│  │      │                                                     │   │
│  │      ▼                                                     │   │
│  │  Worker publica QR no Redis: channel `qr:{tenant_id}`      │   │
│  │      │                                                     │   │
│  │      ▼                                                     │   │
│  │  useQRCode() hook (SSE) recebe QR em tempo real            │   │
│  │      │                                                     │   │
│  │      ▼                                                     │   │
│  │  ┌─────────────────┐                                       │   │
│  │  │  █▀▀▀▀▀█▀▀▀▀▀█   │  ← QR code renderizado              │   │
│  │  │  ▀ █▄▄▄█ █▄▄▄█▀   │                                       │   │
│  │  │  ▄█▄▄▄██▄█▄▄ ▄█   │                                       │   │
│  │  └─────────────────┘                                       │   │
│  │  Status: "Aguardando leitura... (QR expira em 2:00)"       │   │
│  │                                                            │   │
│  │  ▼ QR escaneado                                            │   │
│  │  Status: "✅ WhatsApp conectado! 🎉"                       │   │
│  │  Botão: "Enviar mensagem de teste"                         │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

#### Hook `useQRCode` (o pulo do gato)

```ts
// hooks/use-qr-code.ts
// Escuta eventos SSE do canal Redis via API route do Next.js

export function useQRCode(tenantId: string) {
  const [qr, setQr] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  useEffect(() => {
    const source = new EventSource(`/api/tenants/${tenantId}/whatsapp/stream`)

    source.addEventListener('qr', (e) => {
      setQr(e.data)              // base64 do QR
      setStatus('awaiting_scan')
    })

    source.addEventListener('connected', () => {
      setQr(null)
      setStatus('connected')
    })

    source.addEventListener('error', () => {
      setStatus('error')
    })

    return () => source.close()
  }, [tenantId])

  return { qr, status, connect, disconnect }
}
```

### 12.5 Branding White-Label — Como a Marca Flui

```
Admin salva branding do cliente
    │
    ▼
API route PATCH /api/tenants/[id]/branding
    │
    ├── UPDATE tenant_{uuid}.branding no PostgreSQL
    │
    ▼
Worker do cliente lê branding ao iniciar / recarregar
    │
    ▼
Pipeline de oferta usa branding para renderizar:
    ├── Nome do bot (@ClienteOfertasBot)
    ├── Avatar personalizado
    ├── Template de mensagem customizado
    │     └── Ex: "{emoji} {product_name}\n💰 R$ {price}\n{affiliate_link}"
    └── Footer com texto de afiliado
    │
    ▼
Telegram publica com a marca do cliente
```

**Exemplo de template renderizado:**

```
🔥 Fone Bluetooth XLM-200

De: R$ 189,90
Por: R$ 97,40 (💰 -49%)

🛒 Comprar: [Link de Afiliado Amazon]

📦 Frete grátis para todo Brasil

• • • • • • • • • • • • • • • • • •
Links de afiliado — podemos ganhar comissão
```

### 12.6 Controle de Planos — Como os Limites São Aplicados

```
Admin cria/edita plano
    │
    ▼
Plano salvo em public.plans (nome, price, max_sources, has_branding...)
    │
    ▼
Cada tenant tem plan_id
    │
    ▼
Backend (API + Worker) verifica limites:

  API (Next.js):
  ├── Criar fonte → check tenant.max_whatsapp_sources
  ├── Ativar branding → check plan.has_branding
  └── Conectar Telegram → check plan.max_telegram_channels

  Worker (VPS):
  ├── Ao iniciar → lê plano do tenant do DB
  ├── Se plan = 'free' e excedeu 30 ofertas/dia → pausa publicação
  └── Envia notificação pro admin: "Cliente X excedeu limite do Free"
```

### 12.7 Mapa de Componentes e Responsabilidades

| Componente | Onde Roda | Responsabilidade |
|------------|-----------|-----------------|
| **Next.js App** | Vercel | Admin panel, API routes, autenticação, SSE |
| **API Gateway** | VPS (Fastify) | Orquestração workers, proxy para admin |
| **PostgreSQL** | VPS ou Neon | Dados multi-tenant |
| **Redis** | VPS ou Upstash | Filas (BullMQ), pub/sub QR, cache |
| **Workers** | VPS (PM2) | Baileys (WhatsApp) + Telegraf (Telegram) |
| **Prisma** | Next.js + Workers | ORM type-safe |

#### Como se comunicam:

```
[Admin Browser]
    ↕ HTTPS
[Vercel / Next.js]
    ↕ HTTPS (API Key secreta)
[VPS / API Gateway] → [PostgreSQL] ← [Worker 1, Worker 2...]
    ↕                      ↕
[Redis (pub/sub + filas)]  │
    ↕                      │
[Worker 1 (Baileys + Telegraf)] ← Lê branding, fontes, afiliados
```

### 12.8 Observações Técnicas

| Aspecto | Decisão | Motivo |
|---------|---------|--------|
| **Estado do cliente** | URL param `/tenants/[id]` | Sem estado global complexo; cada página carrega seu contexto |
| **QR code em tempo real** | SSE (Server-Sent Events) | Mais simples que WebSocket; unidirecional é suficiente |
| **Formulários** | React Hook Form + Zod | Validação type-safe, performática, integração com shadcn/ui |
| **Tabelas** | @tanstack/react-table | Ordenação, filtro, paginação, seleção — heads-up |
| **Requisições** | @tanstack/react-query | Cache, refetch, mutations, estado de loading |
| **CSS** | Tailwind CSS + shadcn/ui | Componentes acessíveis, tema customizável por tenant |
| **Comunicação VPS** | API Key + HTTPS outbound | Worker não precisa de porta pública; ele chama a API do Next.js |

---

## Apêndice A — Comparativo de Custo Mensal (MVP)

| Item | Free Tier | MVP (5 clientes) | Crescendo (20 clientes) |
|------|-----------|-------------------|------------------------|
| **Admin Panel** | Vercel Hobby → **$0** | Vercel Pro → **$0** | Vercel Pro → **$20** |
| **PostgreSQL** | Neon/Free → **$0** | Neon/Launch → **$0** | Neon/Scale → **$29** |
| **Redis** | Redis/Free (30MB) → **$0** | Redis/Free → **$0** | Upstash/Pro → **$15** |
| **VPS (Workers)** | Oracle ARM → **$0** | Hetzner CX22 → **~€8** | Hetzner CX32 → **~€15** |
| **Domínio** | subdomain.vercel.app → **$0** | seudominio.com → **~$10/ano** | idem |
| **Monitoramento** | Sentry Free → **$0** | Sentry Free → **$0** | Sentry Team → **$26** |
| **SMS (teste)** | N/A | **$0** | **$0** |
| **Total/mês** | **$0** | **~$8-10** | **~$55-65** |

---

## Apêndice B — Glossário

| Termo | Definição |
|-------|-----------|
| **Tenant** | Cliente da plataforma. Cada tenant é uma empresa/usuário com seu próprio WhatsApp, Telegram e branding. |
| **Worker** | Processo Node.js que roda a conexão WhatsApp + Telegram de um tenant específico. |
| **Baileys** | Biblioteca TypeScript pura que implementa o protocolo WebSocket do WhatsApp Web. Não precisa de Chromium. |
| **White-label** | Capacidade do cliente personalizar a marca (nome, logo, cores) como se fosse o próprio produto. |
| **Schema (PostgreSQL)** | Namespace isolado dentro do banco. Cada tenant tem seu schema `tenant_{uuid}`. |
| **BullMQ** | Gerenciador de filas baseado em Redis para tarefas assíncronas. |

---

*Este documento é um artefato vivo — será atualizado conforme decisões de implementação.*
