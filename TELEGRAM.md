# 📢 Telegram - Publicador de Ofertas

## Visão Geral

Módulo responsável por publicar ofertas formatadas no canal/grupo do Telegram, com inline buttons para compra.

---

## Sumário

1. [Objetivo](#objetivo)
2. [Arquitetura](#arquitetura)
3. [Requisitos](#requisitos)
4. [Configuração](#configuração)
5. [Implementação](#implementação)
6. [Recursos](#recursos)
7. [Desafios](#desafios)
8. [Comandos](#comandos)

---

## Objetivo

- ✅ Criar bot no Telegram
- ✅ Criar canal para publicar ofertas
- ✅ Formatar mensagens atraentes
- ✅ Adicionar inline buttons (Comprar, Ver mais)
- ✅ Publicar ofertas automaticamente
- ✅ Publicar com imagem do produto via sendPhoto
- ✅ Fallback automático para texto quando imagem é bloqueada
- ✅ Gerenciar múltiplos canais/grupos

---

## Arquitetura

```
┌─────────────────────────────────────────┐
│        MÓDULO DE PROCESSAMENTO          │
│    (gera link de afiliado, valida)       │
└──────────────────┬──────────────────────┘
                   │
                   │ Dados da oferta formatada
                   ▼
┌─────────────────────────────────────────┐
│       MÓDULO PUBLICADOR TELEGRAM        │
├─────────────────────────────────────────┤
│                                         │
│  1. Recebe dados da oferta              │
│  2. Formata mensagem bonita             │
│  3. Adiciona inline buttons             │
│  4. Envia para canal/grupo              │
│  5. Registra envio no banco             │
│                                         │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│        CANAL/GRUPO TELEGRAM             │
│     @ofertas_afiliado_br                │
└─────────────────────────────────────────┘
```

---

## Requisitos

### Conta Telegram

| Item | Descrição |
|------|-----------|
| **Conta pessoal** | Necessária para criar bot e canal |
| **BotFather** | Para criar o bot |
| **Canal** | Para publicar as ofertas |

### Software

| Componente | Versão | Obrigatório |
|------------|--------|-------------|
| **Node.js** | 18+ | ✅ |
| **Telegraf** | 4.x | ✅ |
| **TypeScript** | 5.x | Recomendado |

---

## Configuração

### 1. Criar Bot no Telegram

```
1. Abra o Telegram
2. Procure por @BotFather
3. Envie /newbot
4. Escolha um nome: "Ofertas Afiliado BR"
5. Escolha um username: ofertas_afiliado_br_bot
6. Copie o token recebido
```

**Formato do token:**
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 2. Criar Canal no Telegram

```
1. Clique em "Novo Canal" (menu principal)
2. Nome: "Ofertas Afiliado BR"
3. Username: @ofertas_afiliado_br
4. Tipo: Público
5. Descrição: "Melhores ofertas com links de afiliado"
```

### 3. Adicionar Bot ao Canal

```
1. Abra as configurações do canal
2. Clique em "Administradores"
3. Adicione seu bot (@ofertas_afiliado_br_bot)
4. Permissões: Enviar mensagens
```

### 4. Obter ID do Canal

```
1. Envie /start para seu bot
2. Acesse: https://api.telegram.org/bot<SEU_TOKEN>/getUpdates
3. Procure por "chat":{"id":-100...}
4. O ID numérico é o que precisamos
```

### 5. Variáveis de Ambiente

```bash
# config/.env

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=-1001234567890
TELEGRAM_CHANNEL_USERNAME=@ofertas_afiliado_br

# Configurações
TELEGRAM_DELAY_BETWEEN_POSTS=5
TELEGRAM_MAX_POSTS_PER_HOUR=30
TELEGRAM_PARSE_MODE=Markdown
```

### 6. Arquivo de Configuração

```json
// config/telegram.config.json
{
  "bot": {
    "token": "${TELEGRAM_BOT_TOKEN}",
    "username": "ofertas_afiliado_br_bot"
  },
  "channel": {
    "id": "${TELEGRAM_CHANNEL_ID}",
    "username": "${TELEGRAM_CHANNEL_USERNAME}",
    "name": "Ofertas Afiliado BR"
  },
  "settings": {
    "delayBetweenPosts": 5,
    "maxPostsPerHour": 30,
    "parseMode": "Markdown",
    "disableWebPagePreview": false,
    "disableNotification": false
  },
  "templates": {
    "offer": "default",
    "flashSale": "flash",
    "dailyDeal": "daily"
  }
}
```

---

## Implementação

### Estrutura de Diretórios

```
src/telegram/
├── index.ts                 # Ponto de entrada
├── bot.ts                   # Configuração do bot
├── publisher.ts             # Publicador principal
├── templates.ts             # Templates de mensagens
├── buttons.ts               # Inline buttons
├── commands.ts              # Comandos do bot
├── types.ts                 # Interfaces
└── utils/
    ├── logger.ts            # Logs
    └── helpers.ts           # Funções auxiliares
```

### Código Principal

#### Bot Telegram

```typescript
// src/telegram/bot.ts
import { Telegraf } from 'telegraf';

let bot: Telegraf | null = null;

export function initializeBot(token: string): Telegraf {
  if (bot) return bot;

  bot = new Telegraf(token);

  // Configurações do bot
  bot.catch((err, ctx) => {
    console.error(`❌ Erro no bot:`, err);
    console.error(`Contexto:`, ctx.update);
  });

  return bot;
}

export function getBot(): Telegraf | null {
  return bot;
}

export async function launchBot(): Promise<void> {
  if (!bot) {
    throw new Error('Bot não inicializado');
  }

  await bot.launch();
  console.log('✅ Bot Telegram iniciado!');
}

export async function stopBot(): Promise<void> {
  if (bot) {
    bot.stop();
    bot = null;
    console.log('⏹️ Bot Telegram parado');
  }
}
```

#### Publicador de Ofertas

```typescript
// src/telegram/publisher.ts
import { Telegraf } from 'telegraf';
import { getBot } from './bot';
import { formatOfferMessage, formatFlashSaleMessage } from './templates';
import { createOfferButtons, createFlashSaleButtons } from './buttons';
import { OfferData } from '../types';

interface PublishOptions {
  useButtons?: boolean;
  disableNotification?: boolean;
  disableWebPagePreview?: boolean;
}

export async function publishOffer(
  offer: OfferData,
  affiliateLink: string,
  options: PublishOptions = {}
): Promise<boolean> {
  const bot = getBot();
  
  if (!bot) {
    console.error('❌ Bot não inicializado');
    return false;
  }

  const channelId = process.env.TELEGRAM_CHANNEL_ID!;
  
  try {
    // Formatar mensagem
    const message = formatOfferMessage(offer, affiliateLink);
    
    // Criar buttons (se habilitado)
    const replyMarkup = options.useButtons !== false
      ? createOfferButtons(affiliateLink, offer.originalUrl)
      : undefined;

    // Enviar mensagem
    await bot.telegram.sendMessage(channelId, message, {
      parse_mode: process.env.TELEGRAM_PARSE_MODE as any || 'Markdown',
      disable_notification: options.disableNotification,
      disable_web_page_preview: options.disableWebPagePreview,
      reply_markup: replyMarkup
    });

    console.log(`✅ Oferta publicada: ${offer.name}`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao publicar oferta:', error);
    return false;
  }
}

export async function publishFlashSale(
  offer: OfferData,
  affiliateLink: string,
  endTime: Date
): Promise<boolean> {
  const bot = getBot();
  
  if (!bot) {
    console.error('❌ Bot não inicializado');
    return false;
  }

  const channelId = process.env.TELEGRAM_CHANNEL_ID!;
  
  try {
    // Formatar mensagem de oferta relâmpago
    const message = formatFlashSaleMessage(offer, affiliateLink, endTime);
    
    // Criar buttons específicos
    const replyMarkup = createFlashSaleButtons(affiliateLink);

    // Enviar com notificação
    await bot.telegram.sendMessage(channelId, message, {
      parse_mode: 'Markdown',
      reply_markup: replyMarkup
    });

    console.log(`⚡ Oferta relâmpago publicada: ${offer.name}`);
    return true;

  } catch (error) {
    console.error('❌ Erro ao publicar oferta relâmpago:', error);
    return false;
  }
}

export async function publishToMultipleChannels(
  offer: OfferData,
  affiliateLink: string,
  channelIds: string[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  for (const channelId of channelIds) {
    const success = await publishToChannel(offer, affiliateLink, channelId);
    results.set(channelId, success);
    
    // Delay entre envios
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

async function publishToChannel(
  offer: OfferData,
  affiliateLink: string,
  channelId: string
): Promise<boolean> {
  const bot = getBot();
  
  if (!bot) return false;

  try {
    const message = formatOfferMessage(offer, affiliateLink);
    const replyMarkup = createOfferButtons(affiliateLink, offer.originalUrl);

    await bot.telegram.sendMessage(channelId, message, {
      parse_mode: 'Markdown',
      reply_markup: replyMarkup
    });

    return true;
  } catch (error) {
    console.error(`❌ Erro ao publicar no canal ${channelId}:`, error);
    return false;
  }
}
```

#### Templates de Mensagens

```typescript
// src/telegram/templates.ts
import { OfferData } from '../types';

export function formatOfferMessage(
  offer: OfferData,
  affiliateLink: string
): string {
  const discount = calculateDiscount(offer.originalPrice, offer.currentPrice);
  
  let message = `🔥 *OFERTA EXCLUSIVA*\n\n`;
  
  // Nome do produto
  message += `📱 *${escapeMarkdown(offer.name)}*\n\n`;
  
  // Preços
  if (offer.originalPrice && offer.currentPrice) {
    message += `💰 De R$ ${formatPrice(offer.originalPrice)} por *R$ ${formatPrice(offer.currentPrice)}*\n`;
    if (discount) {
      message += `🏷️ *${discount}% OFF*\n`;
    }
  }
  
  // Avaliação
  if (offer.rating) {
    message += `⭐ ${offer.rating} estrelas\n`;
  }
  
  // Frete grátis
  if (offer.freeShipping) {
    message += `🚚 Frete grátis\n`;
  }
  
  // Link de compra
  message += `\n🔗 [Comprar agora →](${affiliateLink})\n\n`;
  
  // Urgência
  message += `⚡ *Últimas unidades!*\n`;
  
  // Disclaimer legal
  message += `📌 Links de afiliado\n`;
  
  // Separador e plataforma
  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📦 ${offer.platform} | 🔥 Válido até esgotar`;
  
  return message;
}

export function formatFlashSaleMessage(
  offer: OfferData,
  affiliateLink: string,
  endTime: Date
): string {
  const timeLeft = getTimeLeft(endTime);
  
  let message = `⚡ *OFERTA RELÂMPAGO*\n\n`;
  message += `⏰ *Tempo restante: ${timeLeft}*\n\n`;
  
  message += `📱 *${escapeMarkdown(offer.name)}*\n\n`;
  
  if (offer.originalPrice && offer.currentPrice) {
    message += `💰 De R$ ${formatPrice(offer.originalPrice)} por *R$ ${formatPrice(offer.currentPrice)}*\n`;
    const discount = calculateDiscount(offer.originalPrice, offer.currentPrice);
    if (discount) {
      message += `🏷️ *${discount}% OFF*\n`;
    }
  }
  
  message += `\n🔗 [COMPRAR AGORA →](${affiliateLink})\n\n`;
  message += `🚨 *ESTOQUE LIMITADO*\n`;
  message += `📌 Links de afiliado`;
  
  return message;
}

export function formatDailyDealMessage(
  offer: OfferData,
  affiliateLink: string
): string {
  let message = `🎯 *OFERTA DO DIA*\n\n`;
  message += `📅 ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  
  message += `📱 *${escapeMarkdown(offer.name)}*\n\n`;
  
  if (offer.originalPrice && offer.currentPrice) {
    message += `💰 *R$ ${formatPrice(offer.currentPrice)}*\n`;
    const discount = calculateDiscount(offer.originalPrice, offer.currentPrice);
    if (discount) {
      message += `🏷️ ${discount}% OFF\n`;
    }
  }
  
  message += `\n🔗 [Ver oferta →](${affiliateLink})\n\n`;
  message += `📌 Links de afiliado`;
  
  return message;
}

function calculateDiscount(
  original: number | null,
  current: number | null
): number | null {
  if (!original || !current || original <= current) {
    return null;
  }
  return Math.round((1 - current / original) * 100);
}

function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',');
}

function escapeMarkdown(text: string): string {
  // Escapar caracteres especiais do Markdown
  return text
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function getTimeLeft(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'Encerrada!';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} minutos`;
}
```

#### Inline Buttons

```typescript
// src/telegram/buttons.ts
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

export function createOfferButtons(
  affiliateLink: string,
  originalUrl?: string
): InlineKeyboardMarkup {
  const buttons = [
    [{ text: '🛒 Comprar Agora', url: affiliateLink }]
  ];

  if (originalUrl && originalUrl !== affiliateLink) {
    buttons.push([{ text: '📦 Ver na Loja', url: originalUrl }]);
  }

  return { inline_keyboard: buttons };
}

export function createFlashSaleButtons(
  affiliateLink: string
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '⚡ COMPRAR AGORA', url: affiliateLink }],
      [{ text: '📊 Ver mais ofertas', callback_data: 'more_offers' }]
    ]
  };
}

export function createCategoryButtons(
  categories: string[]
): InlineKeyboardMarkup {
  const buttons = categories.map(category => [
    { text: category, callback_data: `category_${category.toLowerCase()}` }
  ]);

  return { inline_keyboard: buttons };
}

export function createAlertButtons(
  productId: string
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🔔 Ativar alerta', callback_data: `alert_${productId}` },
        { text: '🚫 Ignorar', callback_data: `ignore_${productId}` }
      ]
    ]
  };
}
```

#### Comandos do Bot

```typescript
// src/telegram/commands.ts
import { Telegraf, Context } from 'telegraf';

export function setupCommands(bot: Telegraf): void {
  // Comando /start
  bot.start((ctx: Context) => {
    const welcomeMessage = `
🔥 *Bem-vindo ao Canal de Ofertas!*

Aqui você encontra as melhores ofertas com links de afiliado.

📌 *Comandos disponíveis:*

/ofertas - Ver ofertas recentes
/categorias - Ver por categoria
/alertas - Configurar alertas
/status - Ver status do bot
/help - Ajuda

💡 *Dica:* Ative as notificações para não perder ofertas relâmpago!
    `;

    ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
  });

  // Comando /ofertas
  bot.command('ofertas', async (ctx: Context) => {
    await ctx.reply('⏳ Carregando ofertas recentes...');
    
    // Aqui você buscaria as ofertas do banco
    // const offers = await getRecentOffers(10);
    
    const mockMessage = `
📋 *Últimas ofertas:*

1️⃣ iPhone 14 Pro - R$ 3.749
2️⃣ Samsung S23 - R$ 2.999
3️⃣ AirPods Pro - R$ 1.499

Digite o número para ver detalhes.
    `;

    await ctx.reply(mockMessage, { parse_mode: 'Markdown' });
  });

  // Comando /categorias
  bot.command('categorias', async (ctx: Context) => {
    const categories = [
      '📱 Eletrônicos',
      '👕 Moda',
      '🏠 Casa',
      '🎮 Games',
      '👶 Bebê',
      '💄 Beleza'
    ];

    const message = `
📂 *Categorias disponíveis:*

${categories.join('\n')}

Digite o nome da categoria para filtrar.
    `;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  // Comando /alertas
  bot.command('alertas', async (ctx: Context) => {
    const message = `
🔔 *Configurar Alertas*

Você pode receber notificações quando:
- Uma oferta específica aparecer
- Produtos de uma categoria estiverem em promoção
- Ofertas relâmpago começarem

Para configurar, use:
/alertas categorias [nome]
/alertas produto [palavra-chave]
    `;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  // Comando /status
  bot.command('status', async (ctx: Context) => {
    const message = `
📊 *Status do Bot*

🤖 Bot: Online
📢 Canal: @ofertas_afiliado_br
👥 Inscritos: [número]
📦 Ofertas hoje: [número]
⏰ Última oferta: [horário]
    `;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  // Comando /help
  bot.command('help', async (ctx: Context) => {
    const message = `
❓ *Ajuda*

*Comandos:*
/start - Iniciar bot
/ofertas - Ver ofertas
/categorias - Filtrar por categoria
/alertas - Configurar notificações
/status - Ver status
/help - Esta ajuda

*Suporte:*
Dúvidas? Entre em contato com @suporte
    `;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });
}
```

---

## Recursos

### Tipos de Mensagem

| Tipo | Uso | Exemplo |
|------|-----|---------|
| **Oferta normal** | Promoção padrão | iPhone com 30% OFF |
| **Oferta relâmpago** | Tempo limitado | 50% OFF - próximas 2h |
| **Oferta do dia** | Destaque diário | Melhor oferta do dia |
| **Comparativo** | vs concorrência | Mais barato que Magazine Luiza |

### Formatação

```
🔥 OFERTA EXCLUSIVA

📱 iPhone 14 Pro Max 256GB

💰 De R$ 7.499 por R$ 3.749
🏷️ 50% OFF

⭐ 4.8 estrelas
🚚 Frete grátis

🔗 Comprar agora →

⚡ Últimas unidades!
📌 Links de afiliado

━━━━━━━━━━━━━━━━━━━━━━
📦 Amazon | 🔥 Válido até esgotar
```

### Botões Inline

```
┌─────────────────────────────────────┐
│  🔥 iPhone 14 Pro - 50% OFF        │
│                                     │
│  [🛒 Comprar Agora]                 │
│  [📦 Ver na Loja]                   │
│  [📊 Ver mais ofertas]              │
└─────────────────────────────────────┘
```

---

## Desafios

| Desafio | Solução |
|---------|---------|
| **Rate limiting** | Delay entre posts (5 seg) |
| **Mensagem muito longa** | Truncar ou dividir |
| **Parse mode error** | Validar Markdown antes de enviar |
| **Canal privado** | Verificar permissões do bot |
| **Spam** | Limitar posts por hora |
| **Links quebrados** | Validar antes de publicar |

---

## Comandos

### Setup

```bash
# Instalar dependências
npm install telegraf

# Configurar variáveis
cp config/.env.example config/.env
```

### Desenvolvimento

```bash
# Rodar apenas módulo Telegram
npm run dev:telegram

# Ver logs do Telegram
npm run logs:telegram

# Testar bot
npm run test:telegram
```

### Produção

```bash
# Build (copia .env + pastas)
npm run build

# Iniciar com PM2 (recomendado)
npm run start:pm2

# Logs
pm2 logs renda-extra-cupuns

# Monitorar
pm2 monit
```

### Debug

```bash
# Testar envio manual
npm run telegram:send "Teste de mensagem"

# Verificar webhooks
npm run telegram:webhook

# Limpar updates pendentes
npm run telegram:clear
```

---

## Notas Importantes

### ✅ Boas Práticas

1. **Não spamme** - Limite de 30 posts/hora
2. **Valide mensagens** - Envie apenas formatação válida
3. **Use botões** - Melhor experiência do usuário
4. **Monitore erros** - Configure alertas
5. **Faça backup** - Exporte configurações

### ⚠️ Avisos

1. **Telegram Proíbe spam** - Sua conta pode ser bloqueada
2. **Canais públicos** - Qualquer um pode ver
3. **Botões são limitados** - Máximo 8 por mensagem
4. **Markdown tem regras** - Escape caracteres especiais
5. **Imagens bloqueadas** - Amazon e outros sites bloqueiam hotlink; publisher faz fallback automático para texto

### 📊 Métricas

| Métrica | Importância |
|---------|-------------|
| **Cliques no link** | Quantos clicaram para comprar |
| **Engajamento** | Curtidas, compartilhamentos |
| **Conversões** | Quantos realmente compraram |
| **Crescimento** | Novos inscritos por dia |

---

*Última atualização: 22/06/2026*
