# 🎯 Projeto: Renda Extra Cupuns

## Visão Geral

Sistema automatizado que monitora ofertas em grupos WhatsApp, gera links de afiliado e publica em canal próprio no **Telegram**, transformando ofertas em fonte de renda extra via marketing de afiliados.

**Status**: **Alpha** ✅ | WhatsApp (2 grupos + newsletter + barto ofertas) ✅ | CLI mode ✅ | Bot Telegram ✅ | Canal ✅ | Amazon Afiliados ✅ | **Mercado Livre (OAuth + API Search) ✅** | AliExpress (pronto, sem ID) ✅ | **Shopee Afiliados ID 18387911117 ✅** | Detector de Cupons (plural ✅) | Resolução URLs desconhecidas ✅ | PM2 config ✅ | Deploy VPS ⏳

---

## 📋 Documentação

| Documento | Descrição |
|-----------|-----------|
| [📱 **WHATSAPP.md**](./WHATSAPP.md) | Monitor de ofertas no WhatsApp |
| [📢 **TELEGRAM.md**](./TELEGRAM.md) | Publicador de ofertas no Telegram |
| [📢 **TELEGRAM_OVERVIEW.md**](./TELEGRAM_OVERVIEW.md) | Visão geral do módulo Telegram |
| [🔗 **AFFILIATES.md**](./AFFILIATES.md) | Integração com programas de afiliados |
| [🔄 **FLUXO.md**](./FLUXO.md) | Fluxo de trabalho (7 fases) |
| [📋 **contexto.md**](./contexto.md) | Status e decisões do projeto |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUXO PRINCIPAL                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   WhatsApp           │     │    SEU BOT      │     │    Telegram     │
│   (Lista Transmissão)│────▶│   (Node.js)     │────▶│  (Canal/Grupo)  │
└──────────────────────┘     └─────────────────┘     └─────────────────┘
        │                            │                       │
        ▼                            ▼                       ▼
   📥 Monitor (filtra         🔗 Gerador de            📤 Publicador
   por @broadcast)            links afiliados          de ofertas
```

### Fluxo de Dados

```
WhatsApp (2 Grupos + Newsletters)
    │  message.from em WHATSAPP_GROUP_IDS + WHATSAPP_NEWSLETTER_ID
    ▼
Monitor WhatsApp (filtra por lista de fontes, extrai links)
    │
    ├─ Link direto → detectPlatform → gera link afiliado
    │
    ├─ meli.la (Kotas) → resolveShortUrl
    │   ├─ Página de produto → gera link afiliado
    │   └─ Página social → fallback: searchMercadoLivreProduct()
    │       └─ API /products/search + /products/{id}/items
    │           └─ Item encontrado → gera link afiliado
    │
    ├─ amzn.to → resolveShortUrl com fallback HTML meta refresh
    │   └─ ASIN encontrado → gera link afiliado
    │
    │
    ▼
Gerador de Links de Afiliado (Amazon ✅, ML ✅, AliExpress ✅*, Shopee ✅*)
    │  * sem ID configurado → usa link direto, pipeline não trava
    ▼
Publicador Telegram (formata com Markdown + inline buttons)
    │
    ▼
Canal Telegram @Ofertas_cupons_agora
    │
    ▼
Usuario clica → Compra → Comissao
```

---

## Stack Tecnológica

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | >=18 | Runtime |
| **TypeScript** | ^5.4.5 | Linguagem com tipagem |
| **Telegraf** | ^4.16.3 | Bot Telegram |
| **whatsapp-web.js** | ^1.25.0 | Cliente WhatsApp (baileys) |
| **sql.js** | ^1.10.3 | SQLite via WASM |
| **Winston** | ^3.13.0 | Logger (console + arquivo) |
| **axios** | ^1.7.2 | HTTP requests |
| **dotenv** | ^16.4.5 | Variáveis de ambiente |

### APIs de Afiliados

| Plataforma | Comissão | Documentação |
|------------|----------|--------------|
| **Amazon** | 1-10% | afiliados.amazon.com.br |
| **AliExpress** | 3-9% | portals.aliexpress.com |
| **Shopee** | 5-10% | shopee.com.br/afiliados — **ID 18387911117 ✅** |
| **Mercado Livre** | 3-12% | mercadolivre.com.br/afiliados |

---

## Estrutura do Projeto

```
RendaExtraCupuns/
│
├── package.json, tsconfig.json, jest.config.ts
├── config/
│   └── .env.example
├── data/                              # SQLite .db criado em runtime
│
├── src/
│   ├── index.ts                       # Entry point
│   ├── app.ts                         # Lifecycle: init DB → Telegram → WhatsApp
│   ├── processor.ts                   # Pipeline: extract → detect → affiliate → publish → DB
│   ├── cli.ts                         # Modo CLI interativo para inserir ofertas manualmente
│   ├── qr-only.ts                     # Geração isolada de QR Code WhatsApp
│   ├── discover-group.ts              # Descoberta de ID do grupo/broadcast
│   ├── types.ts                       # OfferData compartilhado
│   │
│   ├── coupons/
│   │   ├── types.ts                   # CouponData, interfaces de cupom
│   │   └── detector.ts                # Detector e extrator de cupons promocionais
│   │
│   ├── config/index.ts                # Config loader tipado
│   │
│   ├── utils/
│   │   ├── logger.ts                  # Winston (console + arquivo rotativo)
│   │   ├── helpers.ts                 # formatBRL, delay, deepMerge, slugify...
│   │   ├── product-fetcher.ts         # Busca dados do produto pela URL (og:title, preço, imagem)
│   │   └── index.ts                   # Re-export
│   │
│   ├── telegram/
│   │   ├── bot.ts                     # Telegraf singleton, webhook, shutdown
│   │   ├── templates.ts               # formatOfferMessage, formatFlashSale...
│   │   ├── buttons.ts                 # Inline keyboards
│   │   ├── commands.ts                # /start, /ofertas, /status, /help...
│   │   ├── publisher.ts               # publishOffer com rate limiter 30/h
│   │   └── index.ts                   # Re-export
│   │
│   ├── whatsapp/
│   │   ├── client.ts                  # LocalAuth, QR, reconexao exponencial
│   │   ├── parser.ts                  # extractLinks, isValidOffer, detectPlatform
│   │   ├── extractor.ts               # extractOfferData, precos BR, parsePrice
│   │   ├── monitor.ts                 # start/stopMonitoring, filtra Kotas #51
│   │   ├── types.ts                   # WhatsAppMessage, MonitoringState
│   │   └── index.ts                   # Re-export
│   │
│   ├── affiliates/
│   │   ├── index.ts                   # generateAffiliateLink unificado
│   │   ├── types.ts                   # Platform, AffiliateLink, configs
│   │   ├── amazon.ts                  # ASIN + link com tag (resolvedor amzn.to aprimorado)
│   │   ├── aliexpress.ts              # Product ID + link (graceful sem ID)
│   │   ├── shopee.ts                  # shopId/itemId + link (graceful sem ID)
│   │   ├── mercadolivre.ts            # MLB/produto ID + link
│   │   ├── mercadolivre-auth.ts       # OAuth: getValidToken + refresh automático
│   │   └── mercadolivre-search.ts     # API: /products/search + /products/{id}/items
│   │
│   └── database/
│       ├── index.ts                   # sql.js init, migrations, save/load
│       └── offers.ts                  # CRUD ofertas
│
├── dist/                              # Build de produção (30 .js)
├── ecosystem.config.cjs               # PM2 deploy config
├── _check_db.ts                       # Script utilitário: consulta DB
├── _dbcheck.ts                        # Script utilitário: debug do DB
├── tests/                             # 103 testes, 11 suites
│   ├── unit/
│   │   ├── utils/                     # helpers.test.ts, logger.test.ts
│   │   ├── whatsapp/                  # parser.test.ts, extractor.test.ts
│   │   ├── affiliates/               # amazon, aliexpress, shopee, mercadolivre, detectPlatform
│   │   └── database/                  # offers.test.ts
│   └── integration/
│       └── pipeline.test.ts           # Pipeline E2E
│
├── graphify-out/                      # Grafo interativo (734 nós)
├── ecosystem.config.cjs               # PM2 deploy config
├── WHATSAPP.md, TELEGRAM.md, AFFILIATES.md
├── FLUXO.md, contexto.md, SESSAO.txt
└── README.md                          # Este arquivo
```

---

## Setup Rápido

### 1. Requisitos

```bash
node --version   # v18.0.0 ou superior
npm --version    # v9.0.0 ou superior
```

### 2. Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/RendaExtraCupuns.git
cd RendaExtraCupuns

# Instalar dependências
npm install

# Copiar configuração
cp config/.env.example config/.env
```

### 3. Configuração

Editar `config/.env` e preencher:

```bash
# Telegram (obrigatório para rodar)
TELEGRAM_BOT_TOKEN=       # Criar em @BotFather
TELEGRAM_CHANNEL_ID=      # ID do canal

# Afiliados
AMAZON_AFFILIATE_TAG=     # Tag Amazon Associates
AMAZON_MARKETPLACE=       # www.amazon.com.br
ALIEXPRESS_AFFILIATE_ID=  # ID AliExpress (opcional, link direto sem)
SHOPEE_AFFILIATE_ID=      # ID Shopee (opcional, link direto sem)
MERCADOLIVRE_AFFILIATE_ID= # ID Mercado Livre

# Mercado Livre OAuth (para busca via API)
ML_CLIENT_ID=             # App ID do DevCenter
ML_SECRET_KEY=            # Secret Key do App
ML_ACCESS_TOKEN=          # Gerado pelo setup-ml-oauth.js
ML_REFRESH_TOKEN=         # Gerado pelo setup-ml-oauth.js

# WhatsApp (para monitoramento automático)
WHATSAPP_GROUP_IDS=       # IDs separados por vírgula
WHATSAPP_NEWSLETTER_ID=   # ID da newsletter (opcional)
WHATSAPP_SESSION_PATH=    # ./whatsapp-session
```

### 4. Executar

```bash
# Modo CLI (inserir ofertas manualmente sem WhatsApp)
npm run cli

# Descobrir ID do grupo/broadcast/newsletter do WhatsApp
npm run discover

# Gerar QR Code do WhatsApp (se sessão expirar)
npm run whatsapp:qr

# Setup OAuth Mercado Livre (primeira vez ou refresh)
node scripts/setup-ml-oauth.js

# Desenvolvimento (pipeline completo com WhatsApp + Telegram)
npm run dev

# Build para produção (copia .env + cria pastas data/ e logs/)
npm run build

# Rodar em produção
npm start

# Rodar com PM2 (recomendado para VPS)
npm run start:pm2
```

---

## Testes

```bash
# Rodar todos os testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes em watch mode
npm run test:watch
```

**Cobertura atual**: 103 testes, 11 suites, 100% passando
- WhatsApp: 100% | Utils: 100% | Database: 89% | Afiliados: 71% | Cupons: ✅

---

## Comandos Úteis

```bash
npm install            # Instalar dependências
npm run cli            # Modo CLI interativo (inserir ofertas manualmente)
npm run dev            # Rodar em desenvolvimento
npm run build          # Build TypeScript (copia .env + pastas)
npm start              # Rodar build em produção
npm run start:pm2      # Rodar com PM2 (recomendado)
npm test               # Rodar testes (103 tests)
npm run test:coverage  # Testes com relatório de cobertura
npm run lint           # Verificar erros TypeScript
```

---

## Módulos do Sistema

### 📱 WhatsApp (Fonte)
- Conecta a grupos do WhatsApp, listas de transmissão (broadcast) ou newsletters
- Suporte a múltiplas fontes simultâneas (WHATSAPP_GROUP_IDS + WHATSAPP_NEWSLETTER_ID)
- Autenticação via QR code (LocalAuth) com sessão persistente
- Reconexão exponencial automática (5s, 10s, 20s...)
- Script dedicado para gerar QR Code: `npm run whatsapp:qr`
- Script dedicado para descobrir IDs: `npm run discover`
- Filtro por lista de IDs de fonte (`@g.us`, `@broadcast`, `@newsletter`)
- Parser: extrai **todas as URLs** (não só de produto), detecta plataforma
- **Extração fallback**: busca URLs em `message._data` quando `message.body` não contém links
- **Resolução de URLs desconhecidas** (`resolveUnknownUrl`): segue redirect de domínios como tidd.ly, redetecta plataforma
- Extractor: nome do produto, preço BR, desconto

### 📢 Telegram (Destino)
- Bot via Telegraf v4.x
- Formatação com Markdown
- Inline buttons (oferta, categoria, alerta, relâmpago)
- Rate limiter: 30 mensagens/hora por canal
- Comandos: /start, /ofertas, /categorias, /alertas, /status, /help

### 🔗 Afiliados (Transformação)
- Gerador unificado: detecta plataforma → gera link correto
- **Amazon**: ASIN + tag, resolvedor amzn.to aprimorado (fallback HTML meta refresh)
- **AliExpress**: Product ID (graceful: sem ID, link direto). **Resolve URLs curtas** `s.click.aliexpress.com/e/_XXXXX` seguindo redirect HTTP
- **Shopee**: shopId/itemId com **ID 18387911117 ✅** — link `?af_id=18387911117`. **Resolve URLs curtas** `shp.ee/XXXXX` e `s.shopee.com.br/XXXXX` seguindo redirect. Extrai também do formato `/{texto}-i.{shopId}.{itemId}`
- **Mercado Livre**: MLB/produto ID + link afiliado
- **Mercado Livre**: Busca via OAuth — `/products/search` + `/products/{id}/items` (contorna 403 do /sites/MLB/search)
- **Mercado Livre**: Fallback automático para URLs meli.la que redirecionam para página social do Kotas
- AliExpress/Shopee sem ID de afiliado não travam o pipeline (link direto usado como fallback)

### 🗄️ Database (Persistência)
- SQLite via sql.js (WASM, sem necessidade de binário nativo)
- Migrations automáticas
- CRUD: insert, isDuplicate, getRecent, markAsPublished, getStats

### 🎟️ Cupons Promocionais
- Detector de cupons em mensagens do WhatsApp
- Extrai: código promocional, percentual de desconto, limite máximo, plataforma
- Adiciona parâmetro de afiliado automaticamente (ML e Amazon)
- Gatilho: palavra "cupom" OU **"cupons"** (plural: regex `/\bcupons?\b/i`)
- Fallback: retorna `null` sem travar o pipeline

### 💻 CLI Mode (Inserção Manual)
- Interface interativa via readline com prompt `oferta>`
- Inicializa apenas DB + config (sem Telegram/WhatsApp)
- Comandos: `help`, `preview`, `publish`, `stats`, `recent`, `exit`
- **Product Fetcher**: cole apenas o link → busca automática de nome, descrição, preço e imagem via HTTP
- Reaproveita pipeline existente (processOffer, extractOfferData)
- Ideal para testar antes de configurar contas externas

### ⚙️ Pipeline (Integração)
- `processor.ts`: extract → detect → affiliate → publish → DB
- `app.ts`: init DB → init Telegram → init WhatsApp → graceful shutdown
- Graceful shutdown: SIGINT/SIGTERM → para monitor → destrói WhatsApp → para Telegram → fecha DB

---

## Considerações Legais

### ⚠️ Obrigatório

1. **Identificar como afiliado** (Lei 14.448/2022)
   - Toda mensagem deve indicar que são links de afiliado
   - Ex: "Links de afiliado - podemos ganhar comissão"

2. **Transparência**
   - Não ocultar que ganha comissão
   - Informar preço real do produto

3. **Respeitar termos de uso**
   - Verificar regras de cada programa de afiliados
   - Não violar termos do WhatsApp/Telegram

### ✅ Boas Práticas

- Reescrever descrições (não copiar textos)
- Adicionar valor (opinião, contexto)
- Verificar qualidade dos produtos
- Responder dúvidas dos usuários

---

## Pendências (Deploy)

### ✅ Já configurado
- Bot Telegram @RendaExtraCuponsBot ✅
- Canal @Ofertas_cupons_agora (ID: -1004303411968) ✅
- Amazon Afiliados (tag: odcolares2026-20) ✅
- **Mercado Livre Afiliados (ID: 88981950)** ✅
- **Mercado Livre OAuth (API Search)** ✅
- WhatsApp (2 grupos + newsletter) ✅
- WhatsApp sessão salva ✅
- PM2 ecosystem.config.cjs ✅
- Build script com postbuild ✅
- **Ofertas multi-plataforma**: Shopee (PS5 Pro), ML (Caneca), Amazon — pipeline validado com +barto ofertas ✅
- **URL resolution**: Shopee (`shp.ee`, `s.shopee.com.br`), AliExpress (`s.click.aliexpress.com`), desconhecidas (`tidd.ly`) resolvidas via HTTP redirect ✅
- **Shopee Afiliados ID**: 18387911117 ✅ — links com `?af_id=18387911117`

### 🔴 Ainda necessário (voce) — quando tiver as contas
1. **AliExpress Afiliados** — https://portals.aliexpress.com → obter ID e colocar no .env (já preparado)
2. ~~**Shopee Afiliados**~~ → ✅ **Concluído! ID 18387911117**
3. **VPS para deploy 24/7** — Ubuntu 22.04, 2GB RAM, Node 18+

---

## Graphify

Análise arquitetural do código:

| Métrica | Valor |
|---------|-------|
| Nós | 734 |
| Arestas | 987 |
| Comunidades | 50 |

Acessar:
- [graph.html](./graphify-out/graph.html) — grafo interativo
- [GRAPH_REPORT.md](./graphify-out/GRAPH_REPORT.md) — relatório completo

---

## Comandos Graphify

```bash
graphify update .           # Reextrair código (sem LLM)
graphify query "pergunta"   # Perguntar ao grafo
graphify path "A" "B"       # Caminho entre conceitos
graphify explain "X"        # Explicar conceito
```

---

**Status**: **Alpha** operacional. WhatsApp Broadcast conectado. Amazon + Mercado Livre configurados e testados E2E. Deploy aguardando AliExpress e Shopee. 🚀

*Última atualização: 23/06/2026*
