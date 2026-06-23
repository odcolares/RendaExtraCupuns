# 📱 WhatsApp - Monitor de Ofertas

## Visão Geral

Módulo responsável por monitorar grupos ou listas de transmissão (broadcast) no WhatsApp, extrair ofertas e enviar para processamento.

---

## Sumário

1. [Objetivo](#objetivo)
2. [Arquitetura](#arquitetura)
3. [Requisitos](#requisitos)
4. [Configuração](#configuração)
5. [Implementação](#implementação)
6. [Desafios](#desafios)
7. [Comandos](#comandos)

---

## Objetivo

- ✅ Conectar ao WhatsApp Web
- ✅ Monitorar mensagens de grupos (`@g.us`), listas de transmissão (`@broadcast`) e newsletters (`@newsletter`)
- ✅ Suporte a múltiplas fontes simultâneas (WHATSAPP_GROUP_IDS + WHATSAPP_NEWSLETTER_ID)
- ✅ Extrair links de ofertas
- ✅ Identificar plataforma (Amazon, AliExpress, etc)
- ✅ Enviar dados para o módulo de afiliados

---

## Arquitetura

```
┌──────────────────────────────────────────────────┐
│  WHATSAPP (2 Grupos + Newsletter + Broadcast)   │
│    message.from em WHATSAPP_GROUP_IDS[]         │
│    message.from === WHATSAPP_NEWSLETTER_ID      │
└───────────────────┬──────────────────────────────┘
                    │
                    │ Mensagens com ofertas
                    ▼
┌──────────────────────────────────────────────┐
│         MÓDULO WHATSAPP MONITOR              │
├──────────────────────────────────────────────┤
│                                              │
│  1. Conecta via WhatsApp Web (LocalAuth)     │
│  2. Escuta mensagens em tempo real           │
│  3. Filtra por lista de IDs configurados     │
│  4. Loga nome da fonte (grupo/newsletter)    │
│  5. Extrai links (URLs)                      │
│  6. Valida se é link de produto              │
│  7. Envia para Processor                     │
│                                              │
└───────────────────┬──────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────┐
│         MÓDULO PARSER DE OFERTAS             │
│  (extrai nome, preço, plataforma)            │
└──────────────────────────────────────────────┘
```

---

## Requisitos

### Software

| Componente | Versão | Obrigatório |
|------------|--------|-------------|
| **Node.js** | 18+ | ✅ |
| **npm** | 9+ | ✅ |
| **Chrome/Chromium** | Última | ✅ (para Puppeteer) |
| **Celular com WhatsApp** | - | ✅ (para autenticação) |

### Hardware

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **RAM** | 2GB | 4GB+ |
| **CPU** | 2 cores | 4 cores |
| **Disco** | 1GB | 5GB |
| **Internet** | 10 Mbps | 50 Mbps |

### Conta WhatsApp

- ⚠️ **Use um número secundário** (não o pessoal)
- ⚠️ Risko de ban se usar automação intensa
- ✅ Número dedicado para o bot

---

## Configuração

### 1. Variáveis de Ambiente

```bash
# config/.env

# WhatsApp
WHATSAPP_GROUP_IDS=5511999999999@g.us,5511888888888@g.us   # IDs dos grupos (separados por vírgula)
WHATSAPP_NEWSLETTER_ID=5511777777777@newsletter            # ID da newsletter (opcional)
WHATSAPP_SESSION_PATH=./whatsapp-session                   # Pasta onde a sessão será salva
```

### 2. Identificar o ID do Grupo/Broadcast/Newsletter

**Opção A — Usar o script automático (recomendado):**

```bash
npm run discover
```

O script conecta ao WhatsApp (sessão salva) e escuta TODAS as mensagens por 5 minutos. Quando chegar uma mensagem, exibe:

```
📩 MENSAGEM RECEBIDA
   ┌─ De:     120363407937604970@g.us   ← COPIE ISSO
   ├─ Nome:   Grupo de Ofertas
   └─ Msg:    ...
```

**Opção B — Manual:**

```
1. Abra o WhatsApp Web
2. Entre no grupo ou abra a conversa
3. O ID aparece na URL ou nos dados
```

**Formatos de ID:**
```
5511999999999@g.us            # Grupo do WhatsApp
5511999999999@broadcast       # Lista de Transmissão
5511999999999@newsletter      # Newsletter (para canais de transmissão)
```

> **Nota:** Para monitorar múltiplas fontes, configure `WHATSAPP_GROUP_IDS` com os IDs separados por vírgula. O monitor aceita grupos (`@g.us`), listas de transmissão (`@broadcast`) e newsletters (`@newsletter`).

### 3. Configuração do Cliente WhatsApp

```typescript
// config/whatsapp.config.ts
export const whatsappConfig = {
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  },
  session: {
    path: './session'
  }
};
```

---

## Implementação

### Estrutura de Diretórios

```
src/whatsapp/
├── index.ts                 # Ponto de entrada
├── client.ts                # Cliente WhatsApp
├── monitor.ts               # Monitor de mensagens
├── parser.ts                # Extrator de links
├── validator.ts             # Validador de ofertas
├── types.ts                 # Interfaces
└── utils/
    ├── logger.ts            # Logs
    └── helpers.ts           # Funções auxiliares
```

### Código Principal

#### Cliente WhatsApp

```typescript
// src/whatsapp/client.ts
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { whatsappConfig } from '../../config/whatsapp.config';

let client: Client | null = null;

export async function initializeWhatsApp(): Promise<Client> {
  if (client) return client;

  client = new Client({
    authStrategy: new LocalAuth({
      path: whatsappConfig.session.path
    }),
    puppeteer: whatsappConfig.puppeteer
  });

  // Evento: QR Code para autenticação
  client.on('qr', (qr) => {
    console.log('\n📱 QR Code para autenticação WhatsApp:\n');
    qrcode.generate(qr, { small: true });
    console.log('\n⏳ Escaneie com seu WhatsApp...\n');
  });

  // Evento: Autenticado com sucesso
  client.on('authenticated', () => {
    console.log('✅ WhatsApp autenticado!');
  });

  // Evento: Pronto para uso
  client.on('ready', () => {
    console.log('✅ WhatsApp conectado e pronto!');
  });

  // Evento: Erro de autenticação
  client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    client = null;
  });

  // Evento: Desconectado
  client.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp desconectado:', reason);
    client = null;
  });

  await client.initialize();
  return client;
}

export function getClient(): Client | null {
  return client;
}
```

#### Monitor de Mensagens

> **Nota:** O filtro funciona tanto para grupos (`@g.us`) quanto para listas de transmissão (`@broadcast`). Ambos usam `message.from` para identificação.

```typescript
// src/whatsapp/monitor.ts
import { Message } from 'whatsapp-web.js';
import { getClient } from './client';
import { extractLinksFromMessage, isValidOfferMessage } from './parser';
import { processOffer } from '../processor';
import { createModuleLogger } from '../utils';

const log = createModuleLogger("WhatsAppMonitor");
const GROUP_ID = process.env.WHATSAPP_GROUP_ID!;

let isMonitoring = false;

export async function startMonitoring(): Promise<void> {
  const client = getClient();
  
  if (!client) {
    throw new Error('WhatsApp não inicializado');
  }

  if (isMonitoring) {
    log.warn('Monitor já está ativo');
    return;
  }

  client.on('message', handleMessage);
  isMonitoring = true;
  
  log.info('Monitoramento iniciado', { groupId: GROUP_ID });
}

export async function stopMonitoring(): Promise<void> {
  const client = getClient();
  
  if (client) {
    client.removeListener('message', handleMessage);
  }
  
  isMonitoring = false;
  log.info('Monitoramento parado');
}

async function handleMessage(message: Message): Promise<void> {
  try {
    // Verifica se é do grupo/broadcast configurado
    if (message.from !== GROUP_ID) {
      return;
    }

    // Verificar se é uma mensagem de oferta
    if (!isValidOfferMessage(message.body)) {
      return;
    }

    log.info('Oferta detectada', { preview: message.body.substring(0, 80) });

    // Extrair links
    const links = extractLinksFromMessage(message.body);
    
    if (links.length === 0) {
      log.warn('Nenhum link de produto encontrado');
      return;
    }

    // Processar cada link
    for (const link of links) {
      log.info('Processando link', { link });
      await processOffer(message.body, link);
    }

  } catch (error) {
    log.error('Erro ao processar mensagem', { error: (error as Error).message });
  }
}
```

#### Parser de Links

```typescript
// src/whatsapp/parser.ts

// Padrões de URL por plataforma
const URL_PATTERNS = {
  amazon: [
    /https?:\/\/(?:www\.)?amazon\.com\.br\/dp\/[A-Z0-9]{10}/g,
    /https?:\/\/(?:www\.)?amazon\.com\/dp\/[A-Z0-9]{10}/g,
    /https?:\/\/amzn\.to\/[a-zA-Z0-9]+/g
  ],
  aliexpress: [
    /https?:\/\/(?:www\.)?aliexpress\.com\/item\/\d+\.html/g,
    /https?:\/\/s\.click\.aliexpress\.com\/[a-zA-Z0-9]+/g
  ],
  shopee: [
    /https?:\/\/(?:www\.)?shopee\.com\.br\/product\/\d+\/\d+/g,
    /https?:\/\/shope\.ee\/[a-zA-Z0-9]+/g
  ],
  mercadolivre: [
    /https?:\/\/(?:www\.)?mercadolivre\.com\.br\/[^'\s]+/g,
    /https?:\/\/meu\.ml\.uv\/[a-zA-Z0-9]+/g
  ]
};

// Palavras-chave que indicam oferta
const OFFER_KEYWORDS = [
  'oferta', 'desconto', 'off', '%', 'promoção', 'promo',
  'cupom', 'frete grátis', 'entrega grátis', 'relâmpago',
  'limitado', 'últimas unidades', 'esgotando'
];

export function extractLinksFromMessage(text: string): string[] {
  const links: string[] = [];
  
  // Extrair todas as URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlRegex) || [];
  
  for (const url of urls) {
    // Verificar se é link de produto
    if (isProductLink(url)) {
      links.push(cleanUrl(url));
    }
  }
  
  return links;
}

export function isValidOfferMessage(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Verificar se contém palavras-chave de oferta
  const hasOfferKeyword = OFFER_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  // Verificar se contém link de produto
  const hasProductLink = Object.values(URL_PATTERNS).some(patterns =>
    patterns.some(pattern => pattern.test(text))
  );
  
  // Verificar se contém preço
  const hasPrice = /R\$\s*\d+/.test(text);
  
  return hasOfferKeyword || hasProductLink || hasPrice;
}

function isProductLink(url: string): boolean {
  return Object.values(URL_PATTERNS).some(patterns =>
    patterns.some(pattern => pattern.test(url))
  );
}

function cleanUrl(url: string): string {
  // Remover tracking parameters desnecessários
  const cleanUrl = url.split('?')[0];
  return cleanUrl;
}

export function detectPlatform(url: string): string | null {
  for (const [platform, patterns] of Object.entries(URL_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(url))) {
      return platform;
    }
  }
  return null;
}
```

#### Extrator de Informações

```typescript
// src/whatsapp/extractor.ts

interface OfferData {
  name: string;
  originalPrice: number | null;
  currentPrice: number | null;
  discount: number | null;
  platform: string;
  url: string;
  imageUrl: string | null;
}

export function extractOfferData(
  messageText: string,
  url: string
): OfferData {
  return {
    name: extractProductName(messageText),
    originalPrice: extractOriginalPrice(messageText),
    currentPrice: extractCurrentPrice(messageText),
    discount: extractDiscount(messageText),
    platform: detectPlatform(url),
    url: url,
    imageUrl: null
  };
}

function extractProductName(text: string): string {
  // Tenta extrair o nome do produto
  // Geralmente está antes do preço ou link
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    const cleanLine = line.trim();
    
    // Pular linhas muito curtas ou que são apenas links
    if (cleanLine.length < 5 || cleanLine.startsWith('http')) {
      continue;
    }
    
    // Pular linhas que são apenas preços
    if (/^R\$\s*\d+/.test(cleanLine)) {
      continue;
    }
    
    // Retornar primeira linha significativa
    return cleanLine.substring(0, 100);
  }
  
  return 'Produto sem nome';
}

function extractOriginalPrice(text: string): number | null {
  // Procurar por "De R$ X.XXX" ou "R$ X.XXX (antes)"
  
  const patterns = [
    /(?:de|antes|was)[:\s]*R\$\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)\s*(?:->|→|por|for)/i,
    /~~R\$\s*([\d.,]+)~~/ // Markdown strikethrough
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parsePrice(match[1]);
    }
  }
  
  return null;
}

function extractCurrentPrice(text: string): number | null {
  // Procurar por "R$ X.XXX" ou "por R$ X.XXX"
  
  const patterns = [
    /(?:por|now|actual)[:\s]*R\$\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)\s*(?:\(|$)/i,
    /por\s*R\$\s*([\d.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parsePrice(match[1]);
    }
  }
  
  return null;
}

function extractDiscount(text: string): number | null {
  // Procurar por "50% OFF" ou "-50%"
  
  const patterns = [
    /(\d+)%\s*(?:off|desconto)/i,
    /-(\d+)%/i,
    /(\d+)%\s*de\s*desconto/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return null;
}

function parsePrice(priceStr: string): number {
  // Converter "1.299,99" para 1299.99
  return parseFloat(
    priceStr
      .replace(/\./g, '')
      .replace(',', '.')
  );
}

function detectPlatform(url: string): string {
  if (url.includes('amazon')) return 'Amazon';
  if (url.includes('aliexpress')) return 'AliExpress';
  if (url.includes('shopee')) return 'Shopee';
  if (url.includes('mercadolivre') || url.includes('ml.uv')) return 'Mercado Livre';
  return 'Outra';
}
```

---

## Desafios

| Desafio | Solução |
|---------|---------|
| **WhatsApp bloqueia automação** | Usar número dedicado, limitar taxa |
| **Celular precisa estar ligado** | Rodar 24/7 ou usar VPS |
| **QR Code expira** | Reconectar automaticamente com `LocalAuth` |
| **Sessão expira** | Salvar sessão em disco (`.wwebjs_auth/session/`) |
| **Mensagens de outros grupos** | Filtrar por lista de IDs configurados |
| **Links quebrados** | Validar antes de processar |
| **Ofertas duplicadas** | Cache no banco de dados |
| **Broadcast vs Grupo vs Newsletter** | Todos funcionam — monitor aceita `@g.us`, `@broadcast`, `@newsletter` |
| **QR Code travando no `npm run dev`** | Script isolado `npm run whatsapp:qr` só com WhatsApp |
| **Descobrir ID do broadcast** | `npm run discover` — escuta 5 min e exibe IDs |
| **Múltiplas fontes simultâneas** | `WHATSAPP_GROUP_IDS` (CSV) + `WHATSAPP_NEWSLETTER_ID` — monitor loga nome de cada fonte |
| **URLs curtas Shopee (shp.ee, s.shopee.com.br)** | Resolvedor no `shopee.ts` — segue redirect HTTP (302) e extrai shopId+itemId da URL final |
| **URLs curtas AliExpress (s.click.aliexpress.com)** | Resolvedor no `aliexpress.ts` — segue redirect e extrai productId do formato `/item/{id}.html` |
| **URLs desconhecidas (tidd.ly, etc)** | `resolveUnknownUrl()` no monitor — segue redirect, re-detecta plataforma (Magalu, Kabum, etc) |
| **Cupom "cupons" (plural)** | Regex `/\bcupons?\b/i` — detecta tanto "cupom" quanto "cupons" |
| **Links sem match de plataforma** | `extractLinksFromMessage` agora retorna TODAS as URLs (não só de produto). Resolução + detecção no `handleMessage`, permitindo resolver shorteners de domínios desconhecidos |
| **Fallback _data do WhatsApp** | Quando `message.body` não contém URLs, busca em `message._data` (canonicalUrl, matchedText, url, link, title, description, body) |
| **Query params no final de URLs Shopee** | Regex `/\/(\d+)\/(\d+)(?:\?|&|$|[/#])/i` tolera `?__mobile__=1&...` |
| **Formato -i.{shopId}.{itemId} Shopee** | Padrão `/-i\.(\d+)\.(\d+)/g` extrai dados de URLs como `/{texto}-i.12345.67890` |

---

## Comandos

### Setup

```bash
# Instalar dependências
npm install whatsapp-web.js qrcode-terminal

# Criar diretório de sessão
mkdir -p whatsapp-session
```

### Descoberta de ID

```bash
# Descobrir o ID do grupo ou lista de transmissão
npm run discover
```

### Autenticação

```bash
# Gerar QR Code (isolado, sem Telegram/DB)
npm run whatsapp:qr

# Após escanear, a sessão fica salva em ./whatsapp-session/
```

### Desenvolvimento

```bash
# Rodar bot completo (WhatsApp + Telegram + DB)
npm run dev
```

### Manutenção

```bash
# Forçar novo QR Code (se sessão expirar)
npm run whatsapp:qr

# Limpar sessão (reautenticar do zero)
rm -rf whatsapp-session .wwebjs_auth
```

---

## Notas Importantes

### ⚠️ Avisos

1. **Use número secundário** - Não use seu WhatsApp pessoal
2. **Limite de mensagens** - Não envie mais de 10 msg/minuto
3. **Não spamme** - Respeite os limites do WhatsApp
4. **Mantenha sigilo** - Não exponha dados de usuários
5. **Monitorie** - Verifique os logs regularmente

### ✅ Boas Práticas

- Mantenha o celular carregado e com internet
- Não altere o número após autenticar
- Faça backup da pasta `session/` periodicamente
- Use PM2 para manter o processo rodando
- Configure alertas de erro

---

*Última atualização: 23/06/2026*
