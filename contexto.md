# Contexto do Projeto - Ofertas Afiliado Automatizado

## Objetivo do Projeto

Criar um agente (bot) que monitora ofertas em grupos WhatsApp, gera links de afiliado e publica em canal próprio no Telegram, transformando ofertas em fonte de renda extra via marketing de afiliados.

---

## Status Atual

### Fase 1: ENTENDER - CONCLUÍDA
- [x] Ideia do projeto discutida e documentada
- [x] Escopo definido: WhatsApp (fonte) → Afiliados (transformação) → Telegram (destino)
- [x] Dependências identificadas: contas externas (Telegram, afiliados), número WhatsApp secundário

### Fase 2: CONTEXTO - CONCLUÍDA
- [x] Documentação dos módulos criada (README, WHATSAPP, TELEGRAM, AFFILIATES)
- [x] Graphify inicial (72 nós, 74 arestas, 16 comunidades)
- [x] Sistema de contexto implementado (contexto.md, SESSAO.txt, FLUXO.md)

### Fase 3: PLANEJAR - CONCLUÍDA
- [x] Docs do Telegraf v4.x buscadas (ExternalScout)
- [x] Docs do whatsapp-web.js v1.25 buscadas (ExternalScout)
- [x] 21 subtarefas criadas via TaskManager (tasks 01-20 + extra)
- [x] Dependências e ordem de execução definidas

### Fase 4: EXECUTAR - CONCLUÍDA (20 tasks + CLI mode + Product Fetcher)
**Tasks 01-04 (Base):**
- [x] package.json, tsconfig.json (strict, path aliases)
- [x] Config loader tipado (config/index.ts)
- [x] Logger (Winston - console + arquivo)
- [x] Helpers (formatBRL, formatDateBR, sanitizeText, slugify, delay, deepMerge...)

**Tasks 05-08 (Telegram - destino):**
- [x] Bot Telegraf (bot.ts - singleton, webhook, graceful shutdown)
- [x] Templates (templates.ts - offer/flash/daily com Markdown)
- [x] Inline Buttons (buttons.ts - oferta, categoria, alerta, relâmpago)
- [x] Comandos (commands.ts - /start, /ofertas, /categorias, /alertas, /status, /help)
- [x] Publisher (publisher.ts - rate limiter 30/h, multi-channel)

**Tasks 09-11 (WhatsApp - fonte):**
- [x] Client (client.ts - LocalAuth, QR code, reconexão exponencial)
- [x] Parser + Extractor (parser.ts - links, detecção; extractor.ts - nome, preço, desconto)
- [x] Monitor (monitor.ts - filtra grupo Kotas #51, delega ao pipeline)

**Tasks 12-17 (Afiliados):**
- [x] Types + interfaces (types.ts - Platform, AffiliateLink, AffiliateConfig)
- [x] Amazon (amazon.ts - ASIN extraction + link com tag)
- [x] AliExpress (aliexpress.ts - product ID + link s.click)
- [x] Shopee (shopee.ts - shopId+itemId + link)
- [x] Mercado Livre (mercadolivre.ts - MLB/produto ID + link)
- [x] Gerador unificado (index.ts - detectPlatform + generateAffiliateLink)

**Task 18 (Database):**
- [x] SQLite via sql.js (index.ts - init, migrations, save/load db)
- [x] CRUD ofertas (offers.ts - insert, isDuplicate, getRecent, markAsPublished, getStats)

**Task 19 (Integração):**
- [x] Pipeline (processor.ts - extract → detect → affiliate → publish → DB)
- [x] App lifecycle (app.ts - init DB → Telegram → WhatsApp → graceful shutdown)
- [x] Entry point (index.ts)

**Task 20 (Testes):**
- [x] Jest + ts-jest + jest.config.ts
- [x] 12 arquivos de teste, 97 testes, 11 suites
- [x] Cobertura: unit (helpers, logger, parser, extractor, amazon, aliexpress, shopee, mercadolivre, detectPlatform, offers) + integration (pipeline E2E)

### Fase 5: VALIDAR - CONCLUÍDA
- [x] 97/97 testes passando
- [x] Pipeline testado E2E (provider → DB)
- [x] Edge cases cobertos (URLs inválidas, preços sem formatação, ofertas duplicadas, fallbacks)
- [x] Compilação TypeScript sem erros

### Fase 6: REGISTRAR - CONCLUÍDA
- [x] contexto.md atualizado (sessão 03)
- [x] SESSAO.txt com sessão 03 registrada
- [x] Graphify atualizado (734 nós, 987 arestas, 50 comunidades)
- [x] CLI mode para inserção manual de ofertas (src/cli.ts)
- [x] Product Fetcher (src/utils/product-fetcher.ts) — busca dados do produto pela URL
- [x] FLUXO.md atualizado com Fase 7 (DEPLOY) + Fluxo GitHub
- [x] README.md atualizado com CLI mode + Product Fetcher
- [x] contexto.md atualizado (sessão 04 — atualização de status geral)

### Fase 7: DEPLOY — REPRIORIZADO (SaaS Self-Service)

> **Decisão (Sessão 15):** O deploy em VPS do monólito foi substituído pelo **piloto do módulo web SaaS self-service**. O bot atual continua rodando localmente como fonte de ofertas. O deploy em VPS será necessário apenas na Fase 3 (multi-tenant workers), quando houver clientes pagando.
- [x] Criar bot no Telegram (@BotFather) — token obtido ✅ @RendaExtraCuponsBot
- [x] Criar canal no Telegram — @Ofertas_cupons_agora (ID: -1004303411968)
- [x] Bot adicionado como admin do canal com permissão de publicação
- [x] Configurar .env com tokens reais (Telegram + Amazon tag + Broadcast ID)
- [x] Testar E2E real — oferta JBL Fone publicada com link afiliado!
- [x] Publisher com fallback de imagem (sendPhoto → sendMessage se imagem bloqueada)
- [x] PM2 ecosystem.config.cjs configurado
- [x] Build preparado (postbuild copia .env + cria pastas)
- [x] WhatsApp conectado e sessão salva (`.wwebjs_auth/session/`)
- [x] WhatsApp Broadcast ID descoberto: `1734043269@broadcast`
- [x] Bug corrigido: `app.ts` não chamava `startClient()` + `startMonitoring()`
- [x] Script `qr-only.ts` — geração isolada de QR Code
- [x] Script `discover-group.ts` — descoberta de ID (5 min de escuta)
- [x] Debug produção +barto ofertas — newsletter detectada e processando ofertas!
- [x] Fix Shopee novos padrões: `shp.ee`, `s.shopee.com.br`, `-i.{shopId}.{itemId}`, query params tolerados
- [x] Fix AliExpress resolução URL curta: `s.click.aliexpress.com` → redirect → productId
- [x] Fix Cupom detector plural: `/\bcupons?\b/i`
- [x] Fix links desconhecidos: `resolveUnknownUrl()` no monitor
- [x] Extração fallback _data WhatsApp: campos ocultos da mensagem
- [x] GitHub: repositório criado (odcolares/RendaExtraCupuns) — 68 arquivos, 19.272 linhas
- [x] GitHub Flow: workflows (ci.yml, pr.yml), templates (issue + PR), FLUXO.md, branch protection
- [x] Repositório tornado público (necessário para branch protection no Free)
- [x] Demanda #5: isGenericProductName() + fetchProductInfo() — enriquecimento de nomes genéricos
- [x] Cadastrar AliExpress Afiliados — Tracking ID `RendaExtraCupuns` criado e configurado ✅
- [x] Cadastrar Shopee Afiliados — ID obtido (18387911117)
- [x] Cadastrar Mercado Livre Afiliados — ID obtido (88981950)
- [ ] ~~Fazer deploy em VPS/servidor cloud (24/7)~~ → **Repriorizado: piloto web SaaS local primeiro**

### Fase 8: PILOTO WEB SAAS — NOVO (07/07/2026)

```
Modelo: Self-service com assinatura mensal
  ├── Cliente: cria conta, paga mensalidade, configura grupos/afiliados/TG, vê métricas
  └── Admin: super admin com gestão de clientes + dashboard geral
Stack: Next.js + Prisma + SQLite (piloto) / PostgreSQL (futuro) + Vercel (deploy web)
```

**Fase 0 — Fundação (Next.js + Auth + DB + Pagamento)**
- [ ] Projeto Next.js + estrutura de pastas
- [ ] Prisma + SQLite (schema: User, Tenant, Offer, AffiliateConfig)
- [ ] NextAuth com roles (admin / client)
- [ ] Landing page com planos (Free / R$29 / R$79)
- [ ] Signup + Login
- [ ] Stripe/Mercado Pago (modo teste)
- [ ] Deploy Vercel (grátis)

**Fase 1 — Painel do Cliente**
- [ ] Dashboard: ofertas publicadas, fontes ativas, métricas
- [ ] Onboarding wizard (conectar WhatsApp, config Telegram)
- [ ] Configuração de afiliados (Amazon, ML, Shopee, AliExpress)
- [ ] Histórico de ofertas com busca/filtro
- [ ] Métricas: total ofertas, por plataforma, por período

**Fase 2 — Super Admin**
- [ ] Lista de clientes (status, plano, última atividade, ofertas)
- [ ] Detalhe do cliente (config, ofertas, status worker)
- [ ] Controle de planos (ativar/suspender/mudar)
- [ ] Visão geral: clientes ativos, ofertas globais, faturamento estimado

**Fase 3 — Multi-Tenant Workers (VPS)**
- [ ] Migrar WhatsApp de whatsapp-web.js para Baileys (sem Chromium)
- [ ] Session Manager: spawn/kill worker por cliente
- [ ] Adaptar pipeline (processor.ts) para multi-tenant
- [ ] VPS entra aqui (Hetzner ~€8/mês)

**Fase 4 — Polimento + Monetização**
- [ ] White-label (branding do cliente nos templates Telegram)
- [ ] Upgrade/downgrade de planos
- [ ] Cancelamento + retenção de dados por 30 dias
- [ ] Self-signup automático pós-pagamento

---

## Decisões Tomadas

### Sessão 07 (19/06/2026)
| Decisão | Justificativa |
|---------|---------------|
| **WhatsApp Broadcast em vez de Grupo** | O grupo de ofertas é uma Lista de Transmissão (ID termina em `@broadcast`), não um grupo tradicional (`@g.us`). O filtro `message.from === GROUP_ID` funciona igual para ambos |
| **Script QR isolado (`qr-only.ts`)** | `npm run dev` inicializa Telegram + WhatsApp + DB, e o `bot.launch()` impede o shell de encerrar. Script isolado gera QR sem dependências do Telegram |
| **Script Discover (`discover-group.ts`)** | O ID do grupo/broadcast não é óbvio de descobrir. Script escuta TODAS as mensagens por 5 min e exibe o `message.from` de cada uma |
| **app.ts: startClient() + startMonitoring()** | Bug crítico: `app.ts` chamava `initializeWhatsApp()` mas nunca chamava `client.initialize()` (feito por `startClient()`). QR Code nunca aparecia por isso |

### Sessão 09 (21/06/2026)
| Decisão | Justificativa |
|---------|---------------|
| **OAuth ML em vez de scraping** | Único método oficial e confiável para a API do Mercado Livre |
| **Ngrok para redirect HTTPS** | OAuth exige HTTPS no redirect URI; ngrok expõe localhost com HTTPS grátis |
| **/products/search + /products/{id}/items** | `/sites/MLB/search` retorna 403 mesmo com token (PolicyAgent bloqueia sem app certificado). Novo fluxo: `/products/search` retorna `catalog_product_id`, `/products/{id}/items` retorna `item_id` + `price` |
| **Refresh automático token** | Token expira em 6h (3600s), refresh_token é single-use. Código salva novo refresh_token no .env após cada refresh |
| **AliExpress sem ID → link direto** | Pipeline não trava; `generateAliExpressLink()` extrai product ID e retorna link direto |
| **Shopee sem ID → link direto** | Pipeline não trava; `generateShopeeLink()` extrai shopId+itemId e retorna link direto |
| **Amazon: resolvedor amzn.to com HTML** | `amzn.to` retorna HTTP 202 com página intermediária; resolvedor extrai URL via `<meta refresh>` no HTML |
| **WhatsApp multiplos grupos + newsletter** | `WHATSAPP_GROUP_IDS` (separados por vírgula) + `WHATSAPP_NEWSLETTER_ID` no config, monitor refatorado para aceitar lista |

### Sessão 15 (07/07/2026) — SaaS Self-Service

Esta sessão redirecionou a estratégia do projeto do deploy VPS do monólito para a construção de um SaaS white-label com painel web e assinatura mensal.

| Decisão | Justificativa |
|---------|---------------|
| **Modelo self-service com assinatura** | Cliente cria própria conta, paga mensalidade, configura tudo no painel. Admin (você) gerencia clientes. Gera receita recorrente escalável |
| **Piloto local (sem VPS)** | Máquina local já tem o bot rodando. Next.js + Prisma + SQLite roda lado a lado sem infra extra. VPS só na Fase 3 (multi-tenant) |
| **Next.js + Prisma + SQLite no piloto** | SQLite compatível com o banco atual do bot. Futuramente migra pra PostgreSQL sem mudar código (Prisma abstrai) |
| **NextAuth com roles** | Único login comrole `admin` ou `client` — admin vê todos, cliente vê só os dados dele |
| **Vercel para deploy web** | Grátis (Hobby), auto-deploy via GitHub, HTTPS, serverless. Painel web sem custo de infra |
| **VPS repriorizado** | VPS_DEPLOY.md descreve deploy do monólito. Com SaaS, VPS só fará sentido pra workers multi-tenant (Fase 3) |
| **WhatsApp como fonte mantido** | Diferencial competitivo do produto. Cliente conecta próprio número secundário via QR |
| **Telegram como destino mantido** | API oficial grátis, botões, formatação, canal público, zero custo por mensagem |
| **Stripe/Mercado Pago na Fase 0** | Pagamento de assinaturas é requisito de lançamento, não pós-lançamento |
| **Landing page integrada** | Next.js já serve landing + planos + signup + painel — tudo no mesmo projeto |

### Arquitetura
| Decisão | Justificativa |
|---------|---------------|
| **Telegram como destino principal** | API oficial, fácil automação, inline buttons, estatísticas nativas |
| **WhatsApp como fonte** | Grupo Kotas #51 já fornece ofertas verificadas |
| **Node.js + TypeScript** | Assíncrono, tipagem, bom suporte para bots |
| **sql.js em vez de better-sqlite3** | Neste Windows sem VS Build Tools, better-sqlite3 não compila; sql.js é WASM puro |
| **Módulos independentes** | Cada módulo com sua documentação, contextos nunca se misturam |
| **Singleton pattern** | initializeBot()/getBot(), initializeWhatsApp()/getClient() |
| **Pipeline architecture** | WhatsApp monitor → processor.ts (extract → detect → affiliate → publish → DB) |
| **Graceful shutdown** | SIGINT/SIGTERM → stop monitoring → destroy WhatsApp → stop Telegram → close DB |
| **Rate limiter in-memory** | Map<channelId, {count, resetAt}> — 30/h, resets por hora |
| **Image fallback no publisher** | try sendPhoto → catch sendMessage (Amazon e outros bloqueiam hotlink de imagem) |
| **PM2 para deploy** | ecosystem.config.cjs com restart automático, logs rotativos, limite de memória 500MB |
| **postbuild script** | Copia .env + cria pastas data/ e logs/ automaticamente no build |

### Stack Tecnológica
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | >=18 | Runtime |
| **TypeScript** | ^5.4.5 | Linguagem |
| **Next.js** | 14+ | Web app (admin + client panels) |
| **Prisma** | 5+ | ORM (SQLite piloto → PostgreSQL futuro) |
| **NextAuth.js** | 4+ | Autenticação com roles (admin/client) |
| **Stripe / Mercado Pago** | — | Pagamento de assinaturas |
| **Telegraf** | ^4.16.3 | Bot Telegram (workers) |
| **whatsapp-web.js** | ^1.25.0 | Cliente WhatsApp (monolito atual) |
| **Baileys** | futuro | WhatsApp nativo sem Chromium (workers) |
| **sql.js** | ^1.10.3 | SQLite WASM (bot atual) |
| **Winston** | ^3.13.0 | Logger |
| **Jest** | ^30.4.2 | Testes |
| **ts-jest** | ^29.4.11 | TypeScript para Jest |

### Fluxo de Dados
```
WhatsApp (2 Grupos + Newsletter)
  │  message.from em WHATSAPP_GROUP_IDS + WHATSAPP_NEWSLETTER_ID
  v
Monitor WhatsApp (filtra por lista de fontes, extrai links)
  │
  ├─ Link direto → detectPlatform → gera link afiliado
  │
  ├─ meli.la (Kotas) → resolveShortUrl
  │   ├─ Página de produto → gera link afiliado
  │   └─ Página social → fallback: searchMercadoLivreProduct()
  │       └─ API OAuth /products/search + /products/{id}/items
  |
  ├─ amzn.to → resolveShortUrl com fallback HTML meta refresh
  │
  v
Gerador de Links de Afiliado
  ├─ Amazon ✅ (tag afiliado)
  ├─ Mercado Livre ✅ (tag afiliado + OAuth search)
  ├─ AliExpress ✅* (*sem ID → link direto, não trava pipeline)
  └─ Shopee ✅* (*sem ID → link direto, não trava pipeline)
  |
  v
Publicador Telegram (formata com Markdown + inline buttons)
  |
  v
Canal Telegram @Ofertas_cupons_agora
  |
  v
Usuario clica → Compra → Comissao
```

---

## Graphify

### Evolução
| Métrica | Antes (docs) | Depois (código + docs) |
|---------|-------------|----------------------|
| Nós | 72 | 734 |
| Arestas | 74 | 987 |
| Comunidades | 16 | 50 |
| Data | 12/06/2026 | 15/06/2026 |

### God Nodes (mais conectados)
1. `createModuleLogger()` - 16 conexões
2. `compilerOptions` - 16 conexões
3. `📋 Contexto do Projeto` - 15 conexões
4. `📢 Visão Geral - Módulo Telegram` - 14 conexões
5. `Projeto: Ofertas Afiliado Automatizado` - 14 conexões
6. `processOffer()` - 13 conexões
7. `🎯 Projeto: Ofertas Afiliado Automatizado` - 13 conexões
8. `FLUXO DE TRABALHO` - 12 conexões

### Hyperedges (relações em grupo)
- **Core Data Pipeline**: WhatsApp Monitor → Parser → Processor → Telegram Publisher
- **Affiliate Platform Link Generators**: amazon, aliexpress, shopee, mercadolivre
- **Telegram Message Formatting Functions**: offer, flashsale, dailydeal

### Conexões Surpreendentes (ainda presentes)
- `detectPlatform(Affiliates)` ↔ `detectPlatform(WhatsApp)` — semanticamente similares
- `calculateDiscount` ↔ `extractDiscount` — potenciais duplicatas

### Arquivos
- Grafo interativo: `graphify-out/graph.html`
- Relatório: `graphify-out/GRAPH_REPORT.md`
- Dados brutos: `graphify-out/graph.json`

---

## Estrutura do Projeto

```
RendaExtraCupuns/
│
├── package.json, tsconfig.json, jest.config.ts
├── config/
│   └── .env.example                     # Template com todas as env vars
├── data/                                # SQLite .db criado em runtime
│
├── src/
│   ├── index.ts                         # Entry point (startApp)
│   ├── app.ts                           # Inicialização/shutdown módulos
│   ├── processor.ts                     # Pipeline: oferta -> afiliados -> Telegram -> DB
│   ├── qr-only.ts                       # Geração isolada de QR Code WhatsApp
│   ├── discover-group.ts                # Descoberta de ID do grupo/broadcast
│   ├── types.ts                         # OfferData compartilhado
│   │
│   ├── config/index.ts                  # Config loader tipado com dotenv
│   │
│   ├── utils/
│   │   ├── logger.ts                    # Winston (console + arquivo rotativo)
│   │   ├── helpers.ts                   # formatBRL, delay, deepMerge, slugify...
│   │   └── index.ts                     # Re-export
│   │
│   ├── telegram/                        # Modulo Telegram (destino)
│   │   ├── bot.ts                       # Telegraf singleton, webhook, shutdown
│   │   ├── templates.ts                 # formatOfferMessage, formatFlashSale...
│   │   ├── buttons.ts                   # Inline keyboards
│   │   ├── commands.ts                  # /start, /ofertas, /status, /help...
│   │   ├── publisher.ts                 # publishOffer com rate limiter 30/h
│   │   └── index.ts                     # Re-export
│   │
│   ├── whatsapp/                        # Modulo WhatsApp (fonte)
│   │   ├── client.ts                    # LocalAuth, QR, reconexao exponencial
│   │   ├── parser.ts                    # extractLinks, isValidOffer, detectPlatform
│   │   ├── extractor.ts                 # extractOfferData, precos BR, parsePrice
│   │   ├── monitor.ts                   # start/stopMonitoring, filtra Kotas #51
│   │   ├── types.ts                     # WhatsAppMessage, MonitoringState
│   │   └── index.ts                     # Re-export
│   │
│   ├── affiliates/                      # Modulo de Afiliados
│   │   ├── index.ts                     # generateAffiliateLink unificado
│   │   ├── types.ts                     # Platform union, AffiliateLink, configs
│   │   ├── amazon.ts                    # ASIN extraction + link (resolvedor amzn.to aprimorado)
│   │   ├── aliexpress.ts                # Product ID + link (graceful sem ID)
│   │   ├── shopee.ts                    # shopId/itemId + link (graceful sem ID)
│   │   ├── mercadolivre.ts              # MLB/produto ID + link
│   │   ├── mercadolivre-auth.ts         # OAuth: getValidToken + refresh automático
│   │   └── mercadolivre-search.ts       # API: /products/search + /products/{id}/items
│   │
│   ├── coupons/                         # Modulo Cupons
│   │   ├── types.ts                     # CouponData, interfaces de cupom
│   │   └── detector.ts                  # Detector e extrator de cupons promocionais
│   │
│   └── database/                        # Modulo Database
│       ├── index.ts                     # sql.js init, migrations, save/load
│       └── offers.ts                    # CRUD ofertas
│
├── tests/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── helpers.test.ts          # formatBRL, sanitizeText, slugify...
│   │   │   └── logger.test.ts           # createModuleLogger, niveis
│   │   ├── whatsapp/
│   │   │   ├── parser.test.ts           # extractLinks, detectPlatform, cleanUrl
│   │   │   └── extractor.test.ts        # extractOfferData, precos, parsePrice
│   │   ├── affiliates/
│   │   │   ├── amazon.test.ts           # ASIN extraction
│   │   │   ├── aliexpress.test.ts       # Product ID extraction
│   │   │   ├── shopee.test.ts           # shopId/itemId extraction
│   │   │   ├── mercadolivre.test.ts     # MLB/produto ID extraction
│   │   │   └── detectPlatform.test.ts   # detectPlatform unitario
│   │   └── database/
│   │       └── offers.test.ts           # CRUD completo (insert, getRecent, markAsPublished...)
│   └── integration/
│       └── pipeline.test.ts             # Pipeline E2E: 4 plataformas + duplicatas
│
├── graphify-out/                        # Graphify output
│   ├── graph.html                       # Grafo interativo
│   ├── GRAPH_REPORT.md                  # Relatorio completo
│   └── graph.json                       # Dados brutos
│
├── dist/                                # Build de producao (30 .js)
├── ecosystem.config.cjs                 # PM2 deploy config
│
├── .tmp/
│   ├── tasks/ofertas-afiliado/          # TaskManager: 21 tasks JSON
│   ├── external-context/telegraf/       # Docs fetched do Telegraf
│   └── external-context/whatsapp-web-js/ # Docs fetched do whatsapp-web.js
│
├── README.md                            # Visao geral
├── WHATSAPP.md                          # Documentacao modulo WhatsApp
├── TELEGRAM.md                          # Documentacao modulo Telegram
├── AFFILIATES.md                        # Documentacao modulo Afiliados
├── FLUXO.md                             # Fluxo de trabalho 6 fases
├── contexto.md                          # Este arquivo
└── SESSAO.txt                           # Checklist de sessoes
```

---

## Configurações Necessárias

### Variáveis de Ambiente (config/.env)
```bash
# Telegram
TELEGRAM_BOT_TOKEN=8497096404:AAGwbeKZ0348Qtym9OhRNHaKfJHbziqMEVo  # @RendaExtraCuponsBot
TELEGRAM_CHANNEL_ID=-1004303411968                                   # @Ofertas_cupons_agora

# WhatsApp
WHATSAPP_GROUP_IDS=120363407937604970@g.us,120363405887841028@g.us   # 2 grupos
WHATSAPP_NEWSLETTER_ID=120363421652731550@newsletter                 # Newsletter (opcional)
WHATSAPP_SESSION_PATH=./whatsapp-session

# Amazon
AMAZON_AFFILIATE_TAG=odcolares2026-20                               # ✅ Configurado

# AliExpress (placeholder — cadastre-se em portals.aliexpress.com)
ALIEXPRESS_AFFILIATE_ID=placeholder_ali

# Shopee (Afiliados)
SHOPEE_AFFILIATE_ID=18387911117

# Mercado Livre
MERCADOLIVRE_AFFILIATE_ID=88981950

# Mercado Livre OAuth (para busca via API)
ML_CLIENT_ID=2853473974069251                                       # App ID
ML_SECRET_KEY=5h2ef6HGy2tx8tRMWPiUqZL39ZwI3Q6o                     # Secret Key
ML_ACCESS_TOKEN=...                                                  # Gerado pelo setup-ml-oauth.js
ML_REFRESH_TOKEN=...                                                 # Gerado pelo setup-ml-oauth.js
```

### Contas Necessárias
| Serviço | Propósito | Status |
|---------|-----------|--------|
| Telegram Bot (@BotFather) | Publicar ofertas | ✅ @RendaExtraCuponsBot |
| Canal Telegram | Canal para publicar | ✅ @Ofertas_cupons_agora |
| Amazon Afiliados | Gerar links com tag | ✅ odcolares2026-20 |
| AliExpress Afiliados | Gerar links com ID | ✅ **RendaExtraCupuns** |
| Shopee Afiliados | Gerar links com ID | ✅ **18387911117** |
| Mercado Livre Afiliados | Gerar links com ID | ✅ 88981950 |
| Mercado Livre OAuth (API) | Busca de produtos via API | ✅ App criado, OAuth funcional |
| WhatsApp (sessão) | Conectar aos grupos/newsletter | ✅ Conectado, sessão salva em `whatsapp-session/` |

---

## Pontos de Atenção

### Legal
- **Lei 14.448/2022**: Obrigatório identificar como afiliado em toda mensagem
- **Exemplo**: "Links de afiliado - podemos ganhar comissão"
- Não ocultar que ganha comissão

### Técnico
- **WhatsApp**: Número secundário (não pessoal) - risco de ban
- **WhatsApp**: whatsapp-web.js precisa de sessão ativa (QR code)
- **Rate Limiting**: Máximo 30 msgs/hora no Telegram por canal
- **sql.js**: Banco em memória + export para arquivo (não é persistente como SQLite nativo)
- **Windows**: better-sqlite3 não compila sem VS Build Tools

### Código
- **Parser regex**: Usar /i sem flag g para .test() — flag g causa state leak entre chamadas
- **UTF-8 BOM**: PowerShell adiciona BOM ao redirecionar output; usar codificação UTF8 sem BOM
- **Graceful shutdown**: Ordem correta: monitor → WhatsApp → Telegram → DB
- **Image fallback**: Publisher tenta sendPhoto; se imagem for bloqueada (ex: Amazon hotlink), fallback para sendMessage com texto
- **Postbuild**: Script copia .env para dist/ e cria pastas data/ + logs/ automaticamente
- **app.ts Bug fix**: `initializeWhatsApp()` não chamava `startClient()` (que executa `client.initialize()`). QR Code nunca era gerado. Corrigido adicionando `await startClient()` + `await startMonitoring()` após `initializeWhatsApp()`
- **Broadcast vs Grupo**: O filtro `message.from !== GROUP_ID` funciona igual para `@g.us` (grupos) e `@broadcast` (listas de transmissão). O monitor não precisa de alterações
- **QR-only**: Para gerar QR Code sem iniciar Telegram, use `npm run whatsapp:qr` (script `src/qr-only.ts`). Útil para renovar sessão expirada
- **Discover**: Para descobrir o ID de um grupo/broadcast, use `npm run discover` (script `src/discover-group.ts`). Escuta por 5 min e exibe o `message.from` de cada mensagem recebida
- **WhatsApp múltiplas fontes**: `WHATSAPP_GROUP_IDS` aceita IDs separados por vírgula. `WHATSAPP_NEWSLETTER_ID` é opcional. O monitor refatorado loga o nome de cada fonte
- **ML OAuth**: Token expira em 6h (3600 segundos). Refresh automático salva novo `ML_REFRESH_TOKEN` no `.env`. refresh_token é single-use
- **ML API Search**: `/sites/MLB/search` retorna 403 (PolicyAgent). Alternativa: `/products/search` (retorna `catalog_product_id`) + `/products/{id}/items` (retorna `item_id` + `price`). Requer `Authorization: Bearer` com escopos `read` + `offline_access`
- **ML Página social**: Links `meli.la` do Kotas podem redirecionar para `/social/clubekotas` — página social sem product ID. Código detecta `/social/` no caminho e usa fallback de busca via OAuth
- **AliExpress/Shopee graceful**: Sem `ALIEXPRESS_AFFILIATE_ID` ou `SHOPEE_AFFILIATE_ID`, o código extrai product ID / shop+itemId e retorna link direto. Pipeline nunca trava por falta de ID
- **extractLinksFromMessage retorna ALL**: Removeu filtro `isProductLink` — agora retorna todas as URLs. Detecção de plataforma + resolução de shorteners acontece no `handleMessage` loop. Permite que tidd.ly e outros sejam resolvidos dinamicamente
- **Cupom detector plural**: `/\bcupons?\b/i` — "cupons" (plural) agora é detectado, não apenas "cupom"
- **URL resolution consolidada**: Cada módulo de afiliado (Shopee, AliExpress) resolve suas próprias URLs curtas via HTTP redirect (seguindo 302) antes de extrair IDs. Monitor tem `resolveUnknownUrl()` genérico para domínios não reconhecidos
- **Amazon amzn.to**: Retorna HTTP 202 com página intermediária. Resolvedor atual usa `axios` + extração de `<meta refresh>` no HTML para obter URL final
- **Produtos sem sellers ML**: `/products/{id}/items` retorna `"No winners found"` (404) se não há sellers ativos. Código trata como `null`
- **Duas instâncias do bot**: Causam erro `409 Conflict` no Telegram. Apenas uma instância pode rodar por vez
- **DB atual**: **ofertas em andamento**, IDs recentes mostram Shopee (PS5 Pro), ML (Caneca), Amazon — pipeline validado com +barto ofertas
- **URL Resolution**: Shopee (`shp.ee`, `s.shopee.com.br`), AliExpress (`s.click.aliexpress.com`), e domínios desconhecidos (`tidd.ly`) são resolvidos via HTTP redirect antes da extração de dados do produto
- **extractLinksFromMessage** agora retorna **TODAS as URLs** (sem filtro `isProductLink`); a detecção de plataforma + resolução acontece no loop `handleMessage`, permitindo resolução dinâmica de shorteners desconhecidos
- **Cupom detector**: aceita `/\bcupons?\b/i` — tanto "cupom" quanto "cupons" (plural)

---

## Métricas de Progresso

### Documentação
- [x] README.md
- [x] WHATSAPP.md (15 KB)
- [x] TELEGRAM.md (20 KB)
- [x] AFFILIATES.md (16 KB)
- [x] FLUXO.md (417 linhas)
- [x] contexto.md (este arquivo)
- [x] SESSAO.txt

### Código
- [x] src/config/ - implementado
- [x] src/utils/ - implementado (3 arquivos: logger, helpers, product-fetcher)
- [x] src/telegram/ - implementado (6 arquivos)
- [x] src/whatsapp/ - implementado (6 arquivos)
- [x] src/affiliates/ - implementado (8 arquivos: amazon, aliexpress, shopee, mercadolivre, mercadolivre-auth, mercadolivre-search, index, types)
- [x] src/coupons/ - implementado (2 arquivos: types, detector)
- [x] src/database/ - implementado (2 arquivos)
- [x] src/app.ts, processor.ts, types.ts, index.ts - implementados
- [x] src/qr-only.ts — script isolado de QR Code
- [x] src/discover-group.ts — script de descoberta de ID
- [x] scripts/setup-ml-oauth.js — script interativo OAuth Mercado Livre
- [x] ecosystem.config.cjs — PM2 para deploy em produção
- [x] Total: 35 arquivos .ts + 1 .js + build de 30 .js em dist/

### Testes
- [x] 11 suites de teste
- [x] 114 testes passando (24/06/2026)
- [x] Cobertura: WhatsApp 100%, Utils 100%, Database 89%, Afiliados 71%
- [x] Cobertura: unitária + integração E2E
- [x] TypeScript compila sem erros

### Graphify
- [x] 734 nós, 987 arestas, 50 comunidades
- [x] God nodes: createModuleLogger (16), compilerOptions (16)
- [x] Visualização: graph.html
- [x] Dados exportados: graph.json + GRAPH_REPORT.md

---

## Comandos Uteis

### Graphify
```bash
graphify update .          # Reextrair apenas codigo (sem LLM)
graphify query "pergunta"  # Perguntar ao grafo
graphify path "A" "B"      # Caminho entre conceitos
graphify explain "X"       # Explicar conceito
```

### Projeto
```bash
npm install                # Instalar dependencias
npm run dev                # Rodar em desenvolvimento
npm run build              # Build para producao
npm start                  # Rodar build (node dist/index.js)
npm run start:pm2          # Rodar com PM2 (ecosystem.config.cjs)
npm run cli                # Modo interativo (inserir ofertas manualmente)
npm test                   # Rodar testes (103 tests)
npm run test:coverage      # Testes com cobertura
```

---

## Sessões

| Sessão | Data | Foco | Status |
|--------|------|------|--------|
| 01 | 12/06/2026 | Planejamento e Documentação | Concluída |
| 02 | 15/06/2026 | Implementação (20 tasks) + Testes + Graphify | Concluída |
| 03 | 17/06/2026 | CLI mode (src/cli.ts) — inserção manual de ofertas | Concluída |
| 04 | 18/06/2026 | Atualização de status: FLUXO.md, README.md, contexto.md, SESSAO.txt | Concluída |
| 05 | 18/06/2026 | Deploy Steps 1-3: Bot Telegram + Canal + Amazon Afiliados + Teste E2E | Concluída |
| 06 | 19/06/2026 | Publisher com fallback de imagem + PM2 deploy config + Qualidade | Concluída |
| 07 | 19/06/2026 | Bugfix app.ts, QR-only, Discover broadcast ID, Teste fluxo completo | Concluída |
| 08 | **20/06/2026** | **Migração Beta → Alpha: ML configurado (88981950), pipeline ML + Amazon validado, docs atualizadas** | **Concluída** |
| 09 | **21/06/2026** | **ML OAuth + API Search: App criado, OAuth configurado, novo fluxo /products/search + /products/{id}/items validado. WhatsApp migrado para 2 grupos + newsletter. Bot em produção (12:55). 67 ofertas, 23 publicadas, 98/98 testes.** | **Concluída** |
| 10 | **22/06/2026** | **Atualização geral de documentação: README, contexto.md, SESSAO.txt, .env.example, módulo coupons documentado, 103/103 testes. DB com 96 ofertas (76 ML, 20 Amazon), 37 publicadas.** | **Concluída** |
| 11 | **23/06/2026** | **Debug produção +barto ofertas: Fix extração Shopee (novos padrões + resolução URL), AliExpress (resolução URL curta), Cupom detector (plural), Links desconhecidos (tidd.ly → resolução + detecção dinâmica). Bot com ofertas Shopee, ML, Amazon publicando.** | **Concluída** |
| 12 | **24/06/2026** | **GitHub Flow: CI/CD workflows (ci.yml, pr.yml), templates (issue + PR), FLUXO.md atualizado, branch protection, repo público. Demanda #5: enriquecimento de nome de produto via URL (isGenericProductName + processor). 114 testes.** | **Concluída** |
| 13 | **25/06/2026** | **AliExpress Afiliados: branch criada (feature/aliexpress-affiliate-id), template .env.example atualizado, aguardando aprovação do perfil no portals.aliexpress.com para inserir ID real** | **Concluída** |
| 14 | **25/06/2026** | **AliExpress Afiliados: ID RendaExtraCupuns configurado no .env, build + testes validados, commit e PR** | **Concluída** |
| 15 | **07/07/2026** | **Decisão estratégica: SaaS self-service com módulo web. Piloto local (Next.js + Prisma + SQLite). VPS repriorizado para Fase 3 (multi-tenant). Documentos atualizados.** | **Concluída** |

---

## Proximos Passos

### 🔴 Direção Estratégica (Sessão 15 — 07/07/2026):

1. ✅ **Bot monousuário + 4 plataformas de afiliados — COMPLETO**
2. 👉 **Piloto Web SaaS (self-service) — PRÓXIMO**
   - Next.js + Prisma + SQLite → rodando local + Vercel
   - Cliente cria conta, paga mensalidade, configura tudo no painel
3. 📌 **VPS** → necessário apenas na Fase 3 (multi-tenant workers), quando houver clientes pagando

### 🔵 Melhorias futuras:
- Páginas `/m/cupom-de-desconto` da Shopee: avaliar tratamento como cupom puro

### ✅ Ja configurado (pular):
- Bot Telegram ✅ @RendaExtraCuponsBot
- Canal Telegram ✅ @Ofertas_cupons_agora
- Amazon Afiliados ✅ tag odcolares2026-20
- Mercado Livre Afiliados ✅ ID 88981950
- ML OAuth ✅ App criado + refresh automático funcional
- WhatsApp (2 grupos + newsletter) ✅ IDs descobertos e configurados
- WhatsApp sessão ✅ salva em `whatsapp-session/`
- QR-only script ✅ npm run whatsapp:qr
- Discover script ✅ npm run discover
- Pipeline funcional ✅ 98/98 testes, TS compila sem erros
- PM2 ecosystem ✅
- Build script ✅
- Bot em produção ✅ rodando desde 12:55 (21/06), múltiplas plataformas publicando
- **Novos padrões Shopee** ✅ `shp.ee`, `s.shopee.com.br`, `-i.{shopId}.{itemId}`
- **Resolução URLs curtas Shopee + AliExpress** ✅ HTTP redirect seguido de extração
- **Resolução URLs desconhecidas** ✅ `resolveUnknownUrl()` no monitor — segue redirect, redetecta plataforma
- **Cupom detector plural** ✅ aceita `cupons` (plural)
- **Extração fallback _data** ✅ campos `canonicalUrl`, `matchedText`, `url`, `link` do objeto da mensagem WhatsApp
- **extractLinksFromMessage retorna todas URLs** ✅ filtro removido, resolução dinâmica no handleMessage
- **Shopee Afiliados** ✅ ID 18387911117 configurado! Links geram com `?af_id=18387911117`
- **GitHub** ✅ [github.com/odcolares/RendaExtraCupuns](https://github.com/odcolares/RendaExtraCupuns) — 68 arquivos, 19.272 linhas
- **GitHub Flow** ✅ Workflows CI/PR (ci.yml, pr.yml), templates (issue + PR), branch protection ativo
- **Enriquecimento nome produto** ✅ isGenericProductName() + fetchProductInfo() quando nome genérico (Demanda #5)

---

## Referencias

### Documentação do Projeto
- [README.md](./README.md) - Visão geral
- [WHATSAPP.md](./WHATSAPP.md) - Módulo WhatsApp
- [TELEGRAM.md](./TELEGRAM.md) - Módulo Telegram
- [AFFILIATES.md](./AFFILIATES.md) - Módulo de afiliados
- [FLUXO.md](./FLUXO.md) - Fluxo de trabalho
- [VPS_DEPLOY.md](./VPS_DEPLOY.md) - Guia de deploy em VPS 24/7

### Graphify
- [GRAPH_REPORT.md](./graphify-out/GRAPH_REPORT.md) - Relatório completo
- [graph.html](./graphify-out/graph.html) - Grafo interativo
- [graph.json](./graphify-out/graph.json) - Dados brutos

### GitHub
- [Repositório](https://github.com/odcolares/RendaExtraCupuns) - Código fonte
- [Workflows](https://github.com/odcolares/RendaExtraCupuns/actions) - CI/CD
- [PR #1](https://github.com/odcolares/RendaExtraCupuns/pull/1) - Validação do GitHub Flow com Demanda #5

### Externos
- [Telegraf](https://telegraf.js.org/) - Bot Telegram
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp
- [sql.js](https://github.com/sql-js/sql.js) - SQLite WASM
- [Amazon Afiliados](https://afiliados.amazon.com.br/) - Programa de afiliados
- [Lei 14.448/2022](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14448.htm) - Regulamentação

---

*Última atualização: 07/07/2026 — Sessão 15 (Decisão estratégica: SaaS self-service + piloto web local)*

