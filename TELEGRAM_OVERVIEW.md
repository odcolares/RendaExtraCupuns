# 📢 Visão Geral - Módulo Telegram

## Resumo Executivo

O módulo Telegram é o **destino final** das ofertas - é onde os usuários recebem as ofertas formatadas com links de afiliado para compra.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DO MÓDULO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📥 Dados da Oferta                                            │
│     │  • Nome do produto                                        │
│     │  • Preços (original + desconto)                           │
│     │  • Link de afiliado                                       │
│     │  • Plataforma                                             │
│     ▼                                                           │
│  📝 Formatação                                                  │
│     │  • Mensagem bonita com emojis                             │
│     │  • Cálculo de desconto                                    │
│     │  • Inline buttons (Comprar, Ver mais)                     │
│     ▼                                                           │
│  📤 Publicação                                                  │
│     │  • Envia para canal/grupo                                 │
│     │  • Rate limiting (não spammar)                            │
│     │  • Registro no banco                                      │
│     ▼                                                           │
│  👥 Usuários                                                    │
│     • Veem oferta → Clicam → Compram → Você ganha comissão     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes Principais

### 1. Bot Telegram (`bot.ts`)
| Função | Descrição |
|--------|-----------|
| `initializeBot()` | Configura e inicia o bot |
| `launchBot()` | Conecta ao Telegram |
| `stopBot()` | Para o bot |
| `getBot()` | Retorna instância do bot |

### 2. Publicador (`publisher.ts`)
| Função | Descrição |
|--------|-----------|
| `publishOffer()` | Publica oferta normal |
| `publishFlashSale()` | Publica oferta relâmpago |
| `publishToMultipleChannels()` | Publica em múltiplos canais |

### 3. Templates (`templates.ts`)
| Função | Descrição |
|--------|-----------|
| `formatOfferMessage()` | Formata oferta normal |
| `formatFlashSaleMessage()` | Formata oferta relâmpago |
| `formatDailyDealMessage()` | Formata oferta do dia |

### 4. Botões (`buttons.ts`)
| Função | Descrição |
|--------|-----------|
| `createOfferButtons()` | Botões para oferta normal |
| `createFlashSaleButtons()` | Botões para oferta relâmpago |
| `createCategoryButtons()` | Botões de categoria |
| `createAlertButtons()` | Botões de alerta |

### 5. Comandos (`commands.ts`)
| Comando | Descrição |
|---------|-----------|
| `/start` | Boas-vindas |
| `/ofertas` | Ver ofertas recentes |
| `/categorias` | Filtrar por categoria |
| `/alertas` | Configurar notificações |
| `/status` | Ver status do bot |
| `/help` | Ajuda |

---

## Fluxo de Publicação

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUXO DE PUBLICAÇÃO                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. RECEBER DADOS                                               │
│     └─> OfferData { nome, preço, link, plataforma }            │
│                                                                 │
│  2. FORMATAR MENSAGEM                                           │
│     └─> "🔥 OFERTA EXCLUSIVA\n📱 iPhone 14 Pro..."             │
│                                                                 │
│  3. CRIAR BOTÕES                                                │
│     └─> [🛒 Comprar Agora] [📦 Ver na Loja]                    │
│                                                                 │
│  4. ENVIAR PARA TELEGRAM                                        │
│     └─> bot.telegram.sendMessage(channelId, message)            │
│                                                                 │
│  5. REGISTRAR NO BANCO                                          │
│     └─> Salvar: produto, link, data, cliques                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Formato das Mensagens

### Oferta Normal
```
🔥 *OFERTA EXCLUSIVA*

📱 *iPhone 14 Pro Max 256GB*

💰 De R$ 7.499 por *R$ 3.749*
🏷️ *50% OFF*

⭐ 4.8 estrelas
🚚 Frete grátis

🔗 [Comprar agora →](link_afiliado)

⚡ *Últimas unidades!*
📌 Links de afiliado

━━━━━━━━━━━━━━━━━━━━━━
📦 Amazon | 🔥 Válido até esgotar
```

### Oferta Relâmpago
```
⚡ *OFERTA RELÂMPAGO*

⏰ *Tempo restante: 2h 30min*

📱 *iPhone 14 Pro Max 256GB*

💰 De R$ 7.499 por *R$ 3.749*
🏷️ *50% OFF*

🔗 [COMPRAR AGORA →](link_afiliado)

🚨 *ESTOQUE LIMITADO*
📌 Links de afiliado
```

### Oferta do Dia
```
🎯 *OFERTA DO DIA*

📅 12/06/2026

📱 *iPhone 14 Pro Max 256GB*

💰 *R$ 3.749*
🏷️ 50% OFF

🔗 [Ver oferta →](link_afiliado)

📌 Links de afiliado
```

---

## Inline Buttons

```
┌─────────────────────────────────────┐
│  🔥 iPhone 14 Pro - 50% OFF        │
│                                     │
│  [🛒 Comprar Agora]  ← link afil.  │
│  [📦 Ver na Loja]    ← link orig.  │
└─────────────────────────────────────┘
```

**Tipos de botões:**
- **Comprar Agora** → Link de afiliado (conversão)
- **Ver na Loja** → Link original (verificação)
- **Ver mais ofertas** → Callback para outras ofertas
- **Ativar alerta** → Callback para configuração

---

## Configuração

### Variáveis de Ambiente
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=-1001234567890
TELEGRAM_CHANNEL_USERNAME=@ofertas_afiliado_br
```

### Setup do Bot
```
1. Abra Telegram
2. Procure @BotFather
3. Envie /newbot
4. Nome: "Ofertas Afiliado BR"
5. Username: ofertas_afiliado_br_bot
6. Copie o token
```

### Setup do Canal
```
1. Crie novo canal no Telegram
2. Nome: "Ofertas Afiliado BR"
3. Username: @ofertas_afiliado_br
4. Tipo: Público
5. Adicione bot como administrador
```

---

## Taxas e Limites

| Limite | Valor | Ação |
|--------|-------|------|
| **Posts por hora** | 30 máx | Rate limiting |
| **Delay entre posts** | 5 segundos | Espera automática |
| **Tamanho da mensagem** | 4096 chars | Truncar se exceder |
| **Botões por mensagem** | 8 máx | Limitar opções |
| **Parse mode** | Markdown/HTML | Validar formatação |

---

## Tratamento de Erros

| Erro | Causa | Solução |
|------|-------|---------|
| **400 Bad Request** | Formatação inválida | Validar Markdown |
| **403 Forbidden** | Bot não é admin | Adicionar ao canal |
| **429 Too Many Requests** | Rate limit | Aumentar delay |
| **Message too long** | Mensagem > 4096 chars | Truncar ou dividir |
| **Chat not found** | Channel ID incorreto | Verificar config |

---

## Integração com Outros Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                INTEGRAÇÃO ENTRE MÓDULOS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WhatsApp Monitor ──> Parser ──> Affiliates ──> Telegram       │
│       │                  │            │              │          │
│       │                  │            │              │          │
│       ▼                  ▼            ▼              ▼          │
│  Extrai ofertas    Formata dados   Gera link     Publica       │
│  do grupo Kotas    (nome, preço)   de afiliado   no canal      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dados Recebidos
```typescript
interface OfferData {
  name: string;           // Nome do produto
  originalPrice: number;  // Preço original
  currentPrice: number;   // Preço com desconto
  discount: number;       // Porcentagem de desconto
  platform: string;       // Amazon, AliExpress, etc.
  url: string;            // Link original
  imageUrl?: string;      // Imagem (opcional)
  rating?: number;        // Avaliação (opcional)
  freeShipping?: boolean; // Frete grátis (opcional)
}
```

### Dados Enviados
```typescript
interface TelegramMessage {
  text: string;           // Mensagem formatada
  parse_mode: string;     // Markdown ou HTML
  reply_markup: {         // Botões inline
    inline_keyboard: Array<{
      text: string;       // Texto do botão
      url?: string;       // Link (para botões de URL)
      callback_data?: string; // Dados (para botões de callback)
    }>;
  };
}
```

---

## Métricas Importantes

| Métrica | Descrição | Como medir |
|---------|-----------|------------|
| **Cliques** | Quantos clicaram no link | Analytics do Telegram |
| **Conversões** | Quantos compraram | Dashboard de afiliados |
| **Engajamento** | Curtidas, compartilhamentos | Estatísticas do canal |
| **Crescimento** | Novos inscritos | Estatísticas do canal |
| **Receita** | Valor gerado | Dashboard de afiliados |

---

## Checklist de Implementação

### Fase 1: Setup
- [ ] Criar bot no Telegram
- [ ] Criar canal no Telegram
- [ ] Configurar variáveis de ambiente
- [ ] Testar conexão com bot

### Fase 2: Core
- [ ] Implementar `bot.ts`
- [ ] Implementar `publisher.ts`
- [ ] Implementar `templates.ts`
- [ ] Implementar `buttons.ts`

### Fase 3: Comandos
- [ ] Implementar `/start`
- [ ] Implementar `/ofertas`
- [ ] Implementar `/categorias`
- [ ] Implementar `/alertas`

### Fase 4: Refinamento
- [ ] Formatação de mensagens
- [ ] Rate limiting
- [ ] Tratamento de erros
- [ ] Logs detalhados

### Fase 5: Testes
- [ ] Testar publicação manual
- [ ] Testar inline buttons
- [ ] Testar rate limiting
- [ ] Testar tratamento de erros

---

## Próximos Passos

1. **Criar bot no Telegram** (5 min)
2. **Criar canal no Telegram** (5 min)
3. **Configurar variáveis de ambiente** (10 min)
4. **Implementar `bot.ts`** (30 min)
5. **Implementar `publisher.ts`** (30 min)
6. **Testar publicação manual** (15 min)

---

## Referências

- [TELEGRAM.md](./TELEGRAM.md) - Documentação completa
- [Telegraf](https://telegraf.js.org/) - Lib Telegram
- [Telegram Bot API](https://core.telegram.org/bots/api) - API oficial

---

*Última atualização: 22/06/2026*
