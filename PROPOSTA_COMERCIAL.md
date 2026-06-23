# Proposta Comercial — Sistema Automatizado de Afiliados

## O Problema

Ganhar dinheiro com marketing de afiliados exige **tempo e disciplina**:
- Passar horas caçando ofertas em grupos de WhatsApp
- Copiar links, gerar manualmente links de afiliado
- Publicar em canais, repetir dezenas de vezes por dia
- Perder oportunidades enquanto dorme ou trabalha

O resultado: **pouca consistência, muito esforço manual, baixo volume.**

---

## A Solução

Um **robô inteligente** que faz todo o trabalho braçal automaticamente:

```
GRUPOS WHATSAPP  →  ROBÔ AUTOMATIZADO  →  CANAL TELEGRAM
  (fontes de          (24h/dia, sem       (ofertas com
   ofertas)            intervenção)        link de afiliado)
```

### O que ele faz em 3 segundos:

| Etapa | O robô... | Você precisava fazer antes |
|-------|-----------|---------------------------|
| **1. Monitora** | Escuta grupos e newsletters 24h/dia | Ficar de olho no celular |
| **2. Extrai** | Pega o link, nome do produto, preço | Copiar e colar manualmente |
| **3. Gera link afiliado** | Converte para link Amazon/ML/Shopee com **seu ID** | Gerar link manual em cada plataforma |
| **4. Publica** | Envia para o Telegram com foto + botão | Escrever post, formatar, agendar |
| **5. Registra** | Salva no banco de dados | Planilha manual |

**Tudo em segundos. Sem você levantar um dedo.**

---

## Plataformas Integradas

| Plataforma | Comissão | Status |
|------------|----------|--------|
| **Amazon** | 1 a 10% | ✅ Ativo (tag: `odcolares2026-20`) |
| **Shopee** | 5 a 10% | ✅ Ativo (ID: `18387911117`) |
| **Mercado Livre** | 3 a 12% | ✅ Ativo (ID: `88981950`) |
| **AliExpress** | 3 a 9% | 🔧 Pronto (sem ID ainda) |

**4 plataformas na prática.** Se o link for de qualquer uma delas, o robô gera o link de afiliado automaticamente.

---

## Resultados Reais

### Ofertas Processadas

| Métrica | Número |
|---------|--------|
| Ofertas no banco | 150+ |
| Publicadas no Telegram | 50+ |
| Fontes monitoradas | **4** (2 grupos + 1 broadcast + 1 newsletter) |
| Testes automatizados | **103** passando |

### Exemplos de ofertas que o robô já publicou sozinho:

```
🔥 Controle Dualsense PS5 Midnight Black
   De: R$ 499  →  Por: R$ 331
   Amazon → link afiliado → Telegram ✅

🔥 Fone Bluetooth Pulse PH430
   De: R$ 149  →  Por: R$ 89
   Mercado Livre → link afiliado → Telegram ✅

🔥 PlayStation 5 Pro
   Shopee → link afiliado → Telegram ✅
```

### Tempo real de execução:

```
Oferta chega no WhatsApp       →  12:57:43
Link de afiliado gerado        →  12:57:47  (4 segundos)
Publicado no Telegram          →  12:57:48  (5 segundos)
```

---

## Diferenciais Técnicos

### 🔗 URLs Curtas? Resolvidas.
O robô segue redirecionamentos automaticamente:

| Tipo de Link | Exemplo | O robô... |
|-------------|---------|-----------|
| Amazon curto | `amzn.to/XXXX` | Segue redirect → extrai ASIN → link afiliado |
| Shopee curto | `shp.ee/XXXX` | Segue redirect → shopId+itemId → link afiliado |
| ML curto | `meli.la/XXXX` | Segue redirect → detecta produto ou página social |
| AliExpress curto | `s.click.aliexpress.com/...` | Segue redirect → productId → link |
| Desconhecido | `tidd.ly/XXXX` | Segue redirect → descobre qual plataforma |

### 🧠 Fallback Inteligente
Se o link for uma **página social** do Mercado Livre (sem productId visível), o robô:
1. Pega o **nome do produto** da mensagem
2. Busca na **API oficial do Mercado Livre**
3. Encontra o item correto
4. Gera o link de afiliado

### 🎯 Cupons Também São Detectados
O robô reconhece mensagens com "cupom" ou "cupons" e extrai código, desconto e validade.

### 🛡️ Tratamento Legal
Toda mensagem publicada inclui:
> 📌 *Links de afiliado — podemos ganhar comissão*

Conformidade com a **Lei 14.448/2022**.

---

## Como Funciona na Prática

```
VOCÊ                              ROBÔ
─────                             ─────
1. Entra em grupos de ofertas     │
   (Kotas, Pelando, +Barto...)    │
                                  │
2. Configura o robô uma vez       │
   (5 minutos)                    │
                                  │
3. ───────────────────────────────┼──→  Monitora 24h/dia
                                  │    Extrai ofertas automaticamente
                                  │    Gera link de afiliado
                                  │    Publica no Telegram
                                  │    Tudo sem você fazer nada
                                  │
4. Usuários clicam nos links      │
   Compram → Você ganha comissão  │
```

### O que você precisa fornecer:

| Item | Como obter | Tempo |
|------|-----------|-------|
| Número WhatsApp secundário | Chip pré-pago (R$ 10) | 1 dia |
| Conta Amazon Afiliados | afiliados.amazon.com.br | 1-3 dias |
| Conta Shopee Afiliados | shopee.com.br/afiliados | 1-3 dias |
| Conta ML Afiliados | mercadolivre.com.br/afiliados | 1-7 dias |
| Bot Telegram | @BotFather (2 minutos) | Instantâneo |
| Canal Telegram | Criar canal público | 1 minuto |

---

## Modelos de Parceria

### 🚀 Modelo A — Licença de Uso
- Código configurado com **seus IDs de afiliado**
- Instalação em servidor próprio (ou na nuvem)
- **Você fica com 100% das comissões**
- Suporte técnico incluso

### 🤝 Modelo B — Parceria Operacional
- Eu opero o robô 24h/dia no meu servidor
- Divisão de comissão: **60% você / 40% operação**
- Acompanhamento mensal de resultados

### 🔧 Modelo C — Personalizado
- Adaptações específicas (novas plataformas, formatos de mensagem, fontes extras)
- Orçamento sob consulta

---

## Perguntas Frequentes

### "Preciso deixar o WhatsApp conectado?"
Sim, o robô precisa de um número WhatsApp secundário (chip barato). A sessão fica salva — você só escaneia o QR Code **uma vez**.

### "O WhatsApp não bloqueia?"
whatsapp-web.js usa a mesma interface do WhatsApp Web. Com um número secundário e bom senso, o risco é mínimo.

### "Funciona 24h?"
Sim. O robô roda em servidor VPS (recomendado 2GB RAM). Com PM2, ele reinicia automaticamente se cair.

### "Quantas ofertas consigo publicar por dia?"
Dezenas. O rate limit é de **30 mensagens/hora** no Telegram por canal.

### "Preciso saber programar?"
**Não.** A configuração inicial é feita uma vez. Depois o robô trabalha sozinho.

---

## Próximo Passo

```
1. Escolher modelo (A, B ou C)
2. Criar contas de afiliados
3. Configurar (5 minutos)
4. Robô começa a publicar
5. Você ganha comissão dormindo
```

**Interessado? Vamos conversar.** 🚀

---

*Documento gerado em: 23/06/2026*
*Sistema: RendaExtraCupuns — v1.0 (Alpha)*
