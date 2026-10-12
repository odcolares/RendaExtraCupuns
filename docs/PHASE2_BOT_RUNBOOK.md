# Phase 2 Multi-Tenant Bot — Runbook Operacional

**Versão:** 1.0  
**Data:** 2026-08-22  
**Status:** Produção

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA MULTI-TENANT                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Tenant A    │     │  Tenant B    │     │  Tenant C    │
│  (Railway)   │     │  (Railway)   │     │  (Railway)   │
│              │     │              │     │              │
│ ┌──────────┐ │     │ ┌──────────┐ │     │ ┌──────────┐ │
│ │WhatsApp  │ │     │ │WhatsApp  │ │     │ │WhatsApp  │ │
│ │Client    │ │     │ │Client    │ │     │ │Client    │ │
│ └──────────┘ │     │ └──────────┘ │     │ └──────────┘ │
│ ┌──────────┐ │     │ ┌──────────┐ │     │ ┌──────────┐ │
│ │Telegram  │ │     │ │Telegram  │ │     │ │Telegram  │ │
│ │Publisher │ │     │ │Publisher │ │     │ │Publisher │ │
│ └──────────┘ │     │ └──────────┘ │     │ └──────────┘ │
│ ┌──────────┐ │     │ ┌──────────┐ │     │ ┌──────────┐ │
│ │Processor │ │     │ │Processor │ │     │ │Processor │ │
│ └──────────┘ │     │ └──────────┘ │     │ └──────────┘ │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                   ┌─────────────────┐
                   │   Turso DB      │
                   │   (Shared)      │
                   │                 │
                   │ Tenant isolation│
                   │ via tenantId    │
                   └─────────────────┘
```

**Princípio Fundamental:** 1 Container = 1 Tenant = Isolamento Total

---

## 2. Componentes do Sistema

| Componente | Descrição | Arquivo |
|------------|-----------|---------|
| **TenantBot** | Bot isolado por tenant (WhatsApp + Telegram + Processor) | `src/bot/tenant-bot.ts` |
| **BotManager** | Orquestrador singleton gerencia N TenantBots | `src/bot/bot-manager.ts` |
| **OfferProcessor** | Pipeline tenant-scoped (extract → affiliate → save → publish) | `src/bot/offer-processor.ts` |
| **AffiliateLinkGenerator** | Gera links usando config do tenant (fallback graceful) | `src/bot/affiliate-generator.ts` |
| **WhatsAppClient** | Multi-sessão, sessionPath isolado por tenant | `src/whatsapp/client.ts` |
| **TelegramPublisher** | Multi-bot, rate limit 30msg/h por instância | `src/telegram/publisher.ts` |

---

## 3. Variáveis de Ambiente

### Compartilhadas (Web + Bot)

```env
# Banco
DATABASE_URL=libsql://seu-db.turso.io
TURSO_AUTH_TOKEN=xxx

# Auth/Stripe/Email (Web)
NEXTAUTH_SECRET=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
RESEND_API_KEY=re_xxx
NEXTAUTH_URL=https://seu-dominio.vercel.app

# Mercado Livre OAuth (globais)
ML_CLIENT_ID=xxx
ML_SECRET_KEY=xxx
ML_ACCESS_TOKEN=xxx
ML_REFRESH_TOKEN=xxx

# Afiliados globais (fallback)
AMAZON_AFFILIATE_TAG=xxx
SHOPEE_AFFILIATE_ID=18387911117
ALIEXPRESS_AFFILIATE_ID=xxx
MERCADOLIVRE_AFFILIATE_ID=xxx
```

### Por Tenant (Injetadas no Container Railway)

```env
# Injetadas automaticamente pelo provisionamento
TENANT_ID=abc123
WHATSAPP_SESSION_BASE_PATH=/data/whatsapp-sessions

# Telegram (vêm do TenantChannel no DB)
# TELEGRAM_BOT_TOKEN e TELEGRAM_CHANNEL_ID configurados via onboarding

# Afiliados (vêm do AffiliateConfig no DB)
# Sobrescrevem globais se configurados
```

---

## 4. Provisionamento de Novo Bot

### Método Automatizado (Recomendado)

```bash
# 1. Configure credenciais Railway no .env
RAILWAY_TOKEN=xxx
RAILWAY_PROJECT_ID=xxx

# 2. Execute provisionamento
npx ts-node scripts/provision-bot.ts <tenantId>

# Exemplo:
npx ts-node scripts/provision-bot.ts abc123def456
```

**O script faz automaticamente:**
1. Cria service Railway com Dockerfile
2. Configura variáveis de ambiente (compartilhadas + tenant-specific)
3. Cria volume `whatsapp-session-{tenantId}` em `/data/whatsapp-sessions`
4. Aguarda service ficar RUNNING
5. Retorna serviceId e serviceUrl

### Método Manual (Fallback)

Se automação falhar:

1. **Railway Dashboard** → New Service → Deploy from GitHub
2. **Repository:** `odcolares/RendaExtraCupuns` | Branch: `main`
3. **Dockerfile:** `./Dockerfile`
4. **Environment Variables:** (copie de `.env.example` + adicione)
   ```
   TENANT_ID=<tenantId>
   DATABASE_URL=<shared>
   TURSO_AUTH_TOKEN=<shared>
   TELEGRAM_BOT_TOKEN=<shared>
   WHATSAPP_SESSION_BASE_PATH=/data/whatsapp-sessions
   # ... afiliados globais
   ```
5. **Volumes:** Adicione `whatsapp-session-{tenantId}` → `/data/whatsapp-sessions`

---

## 5. Operações Admin (Dashboard)

### Acesso: `/admin/clientes/[id]` → Aba "🤖 Bot"

| Ação | Descrição | Quando Usar |
|------|-----------|-------------|
| **Provisionar Bot** | Cria service Railway + volume | Novo cliente Starter/Professional |
| **Iniciar Bot** | Inicia TenantBot (WhatsApp + Telegram) | Após provisionar ou se parou |
| **Parar Bot** | Para graciosamente (WhatsApp → Telegram) | Manutenção, cancelamento |
| **Reiniciar Bot** | Stop + Start | Após mudança de config, erro |
| **QR Code** | Exibe QR para pareamento WhatsApp | Primeira conexão, re-pareamento |
| **Testar Telegram** | Envia msg "🤖 Bot conectado!" no canal | Validar bot token + channelId |
| **Sincronizar Fontes** | Atualiza lista grupos do WhatsApp monitorados | Novos grupos adicionados |

### Fluxo Padrão Novo Cliente

```
1. Cliente assina Starter/Professional → Stripe webhook → tenant.status=active
2. Admin → /admin/clientes/[id] → Aba Bot → "Provisionar Bot"
3. Aguarda service RUNNING (2-3 min)
4. Clica "QR Code" → Exibe QR → Cliente escaneia no WhatsApp
5. WhatsApp conectado → Badge fica verde "Conectado"
6. Cliente configura Telegram no onboarding (bot token + channelId)
7. Clica "Testar Conexão" → Msg enviada ao canal
8. Clica "Sincronizar Fontes" → Lista grupos atualizada
9. ✅ Bot rodando e monitorando
```

---

## 6. Monitoramento & Health Check

### Health Check Automático (BotManager)

Roda a cada **5 minutos** para cada TenantBot ativo:

| Check | Threshold | Ação |
|-------|-----------|------|
| WhatsApp desconectado | > 5 min | `reconnectWhatsApp()` |
| Memória heap | > 800 MB | `restartTenant()` |
| Inatividade (ofertas) | > 24h com fontes ativas | Log alerta admin |

### Logs Estruturados

Todos logs incluem `tenantId` para rastreamento:

```json
{
  "timestamp": "2026-08-22T10:30:00.000Z",
  "level": "info",
  "module": "TenantBot",
  "tenantId": "abc123",
  "message": "Oferta processada",
  "offerId": "xyz789",
  "platform": "shopee",
  "durationMs": 145
}
```

### Métricas Principais (por tenant)

- `offers_processed_24h` — Ofertas processadas nas últimas 24h
- `offers_published_24h` — Publicadas no Telegram
- `errors_24h` — Erros de pipeline
- `whatsapp_connected` — 0/1
- `telegram_connected` — 0/1
- `memory_mb` — Heap usado

---

## 7. Troubleshooting Comum

### QR Code não aparece / expira rápido

**Sintoma:** QR não gera ou "QR Code não disponível"

**Causas & Soluções:**
| Causa | Solução |
|-------|---------|
| Bot não provisionado | Provisionar Bot primeiro |
| Container parado | Iniciar Bot |
| Sessão corrompida | Parar Bot → Deletar pasta session → Iniciar Bot |
| Chromium não instalado | Verificar Dockerfile + Railway tem Chromium |

**Forçar novo QR:**
```bash
# Via admin: clicar "Atualizar QR" (polling 5s auto)
# Ou reiniciar: Parar Bot → Iniciar Bot
```

### WhatsApp desconecta frequentemente

**Sintoma:** Logs mostram "WhatsApp desconectado" repetidamente

| Causa | Solução |
|-------|---------|
| Sessão expirada | Re-parear (novo QR) |
| IP alterado (VPN/proxy) | Usar IP fixo, evitar VPN |
| Muitos containers no host | Limitar a 1 bot por 2GB RAM |
| Chromium crash | Health check reinicia auto (5 min) |

### Telegram "bot não inicializado" / rate limit

**Sintoma:** Publicação falha com "bot não inicializado" ou "rate limit atingido"

| Causa | Solução |
|-------|---------|
| TELEGRAM_BOT_TOKEN inválido | Testar Conexão no admin → regenerar token no @BotFather |
| Canal não tem bot como admin | Adicionar bot como administrador do canal |
| Rate limit (30/hora) | Aguardar hora virar; não spammar |
| Channel ID errado | Verificar com @RawDataBot (formato: -100xxxxxxxxxx) |

### Memória alta / Container reiniciando

**Sintoma:** Container reinicia sozinho, logs "Memória alta, reiniciando bot"

| Causa | Solução |
|-------|---------|
| Memory leak WhatsApp Web.js | Health check reinicia auto (800MB threshold) |
| Muitos grupos monitorados | Reduzir fontes ativas |
| Chromium zombie processes | Dockerfile tem `--disable-gpu` etc |

---

## 7.1 Comandos Úteis de Diagnóstico

```bash
# Ver status de todos bots (via admin API)
curl -H "Cookie: <auth>" https://app.com/api/admin/bot/status?tenantId=xxx

# Ver logs Railway
railway logs -s renda-extra-abc123

# Ver containers locais
docker ps -a | grep renda-extra

# Verificar sessão WhatsApp
ls -la ./whatsapp-sessions/abc123/

# Testar conectividade Turso
curl -H "Authorization: Bearer $TURSO_AUTH_TOKEN" \
  "$DATABASE_URL" -X POST -d '{"sql":"select 1"}'
```

---

## 8. Backup & Recuperação

### Sessão WhatsApp (Crítico)

| Item | Frequência | Local |
|------|------------|-------|
| Pasta session | Diário (Railway volume snapshot) | `/data/whatsapp-sessions/{tenantId}/` |
| Arquivo `creds.json` | Incluído no volume | Essencial para re-parear |

**Recuperação:**
1. Railway Dashboard → Volumes → Restore snapshot
2. Ou: `railway volume restore whatsapp-session-abc123 --snapshot=<id>`
3. Reiniciar bot: Parar → Iniciar

### Banco de Dados (Turso)

- **Backups automáticos:** Turso faz snapshots diários
- **Point-in-time recovery:** Disponível no plano pago
- **Export manual:** `turso db dump <db-name> > backup.sql`

---

## 9. Custos Estimados

### Por Tenant (Railway)

| Item | Custo Mensal |
|------|--------------|
| Service (512MB RAM, 0.5 vCPU) | ~$5/mês |
| Volume 1GB (sessão WhatsApp) | ~$0.10/mês |
| **Total por bot** | **~$5.10/mês** |

### Shared (Independente de tenants)

| Item | Custo |
|------|-------|
| Turso (até 9GB, 1B reads) | Free tier |
| Vercel (Web) | Free tier |
| GitHub Actions | Free tier |

### Exemplo: 10 Clientes Pagantes

| Custo | Valor |
|-------|-------|
| 10 bots Railway | $51/mês |
| Turso + Vercel | $0 |
| **Total** | **~$51/mês** |
| Receita (10 × $29) | $290/mês |
| **Margem** | **~82%** |

---

## 10. Escala & Limites

### Limites Atuais

| Limite | Valor | Mitigação Futura |
|--------|-------|------------------|
| Bots por Railway project | ~50 services | Multi-project |
| WhatsApp Web.js por container | 1 sessão | Nativo |
| Telegram rate limit | 30 msg/h/canal | Fila + backoff |
| Turso connections | 100 simultâneas | Pool Prisma |
| Railway RAM por service | 512MB default | Upgrade para 1GB+ |

### Roadmap Escala

| Fase | Gatilho | Solução |
|------|---------|---------|
| 10-20 clientes | Railway limits | Múltiplos projects |
| 50+ clientes | Custo linear | WhatsApp Business API (Meta) |
| 100+ clientes | Operacional | Kubernetes + operador custom |

---

## 11. Checklist de Deploy (Novo Tenant)

- [ ] Tenant criado via Stripe (status=active, plan≠free)
- [ ] `provision-bot.ts` executado com sucesso
- [ ] Service Railway RUNNING (2-3 min)
- [ ] QR Code exibido no admin
- [ ] Cliente escaneou QR → WhatsApp "Conectado"
- [ ] Cliente configurou Telegram (token + channelId)
- [ ] "Testar Conexão" → Sucesso (msg no canal)
- [ ] "Sincronizar Fontes" → Lista grupos > 0
- [ ] Oferta teste publicada no canal
- [ ] Dashboard do cliente mostra métricas

---

## 12. Rollback Procedure

### Bot com Problemas Críticos

```bash
# 1. Parar bot imediatamente
# Admin → Bot → Parar Bot

# 2. Se sessão corrompida
# Railway → Volume → Restore snapshot anterior

# 3. Se código com bug
# Reverter commit → Railway auto-deploy

# 4. Se banco com problema
# Turso → Point-in-time recovery
```

### Contatos de Escalação

| Nível | Contato | SLA |
|-------|---------|-----|
| N1 - Admin | Dashboard / Logs | 15 min |
| N2 - Dev | GitHub Issues / Discord | 1 hora |
| N3 - Infra | Railway Support / Turso Support | 4 horas |

---

## 13. Referências Rápidas

| Documento | Link |
|-----------|------|
| SPEC Completa | `SPEC_PHASE2_MULTITENANT_BOT.md` |
| Work Plan | `.omo/plans/phase2-multitenant-bot.md` |
| Railway Dashboard | https://railway.app/project/xxx |
| Turso Dashboard | https://turso.tech/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |
| GitHub Repo | https://github.com/odcolares/RendaExtraCupuns |

---

## 14. Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-08-22 | Release inicial Phase 2 - Multi-tenant bot architecture |

---

**Fim do Runbook**  
*Mantenha este documento atualizado a cada deploy significativo.*