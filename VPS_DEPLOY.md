# 🖥️ VPS - Deploy para Produção 24/7

## Visão Geral

Guia completo para contratar, configurar e fazer deploy do bot RendaExtraCupuns em uma VPS (servidor cloud), permitindo que ele funcione 24 horas por dia, 7 dias por semana sem depender de um computador local.

---

## Sumário

1. [Objetivo](#objetivo)
2. [Arquitetura](#arquitetura)
3. [Requisitos da VPS](#requisitos-da-vps)
4. [Provedores Recomendados](#provedores-recomendados)
5. [Custos Mensais](#custos-mensais)
6. [Pré-requisitos](#pré-requisitos)
7. [Setup Passo a Passo](#setup-passo-a-passo)
8. [WhatsApp Session Management](#whatsapp-session-management)
9. [PM2 - Gerenciamento do Processo](#pm2---gerenciamento-do-processo)
10. [Monitoramento](#monitoramento)
11. [Segurança](#segurança)
12. [Atualizações do Bot](#atualizações-do-bot)
13. [Troubleshooting](#troubleshooting)
14. [Pós-Deploy](#pós-deploy)
15. [Próximos Passos](#próximos-passos)

---

## Objetivo

- ✅ Contratar VPS com recursos suficientes para Node.js + Chromium
- ✅ Instalar dependências (Node, npm, PM2, Chromium)
- ✅ Clonar repositório e configurar ambiente
- ✅ Restaurar sessão WhatsApp (ou gerar novo QR Code)
- ✅ Iniciar bot com PM2 (auto-restart + startup com o sistema)
- ✅ Monitorar logs e health-check
- ✅ Estabelecer rotina de atualizações

---

## Arquitetura

```
🌐 Internet
    │
    ├── WhatsApp (grupos de ofertas)
    │       │  conexão via whatasapp-web.js (WebSocket)
    │       ▼
    ┌────────────── VPS ──────────────────┐
    │                                      │
    │  ┌── PM2 (process manager) ──────┐   │
    │  │  ┌─ Bot RendaExtraCupuns ──┐  │   │
    │  │  │  Node.js (dist/index.js) │  │   │
    │  │  │  ├── whatasapp-web.js    │  │   │
    │  │  │  ├── Chromium (headless) │  │   │
    │  │  │  ├── Telegraf            │  │   │
    │  │  │  └── SQLite (data/*.db)  │  │   │
    │  │  └──────────────────────────┘  │   │
    │  │  logs: logs/{error,out}.log    │   │
    │  └────────────────────────────────┘   │
    │                                      │
    └──────────────────────────────────────┘
            │
            ▼
    Telegram @Ofertas_cupons_agora
            │
            ▼
    Seguidores → clicam → compram → comissão
```

### Fluxo de Dados na VPS

```
WhatsApp grupos
    ↓ (WebSocket)
whatasapp-web.js + Chromium
    ↓ (evento: message)
Monitor (src/whatsapp/monitor.ts)
    ↓ (filtra fonte + extrai link)
Pipeline (src/processor.ts)
    ↓ (detecta plataforma + gera link afiliado)
Telegram Publisher (src/telegram/publisher.ts)
    ↓ (HTTP POST para API Telegram)
Canal @Ofertas_cupons_agora
```

---

## Requisitos da VPS

### Mínimos (pode funcionar, mas com risco de travamentos)

| Requisito | Valor | Motivo |
|-----------|-------|--------|
| **RAM** | 1 GB | Chromium ~400MB + Node ~200MB = ~600MB |
| **vCPU** | 1 | Processamento leve |
| **Disco** | 20 GB SSD | SO + Node modules + sessão WhatsApp + logs |
| **SO** | Ubuntu 22.04 LTS | Mais suportado, pacotes estáveis |

### Recomendados (para operação tranquila)

| Requisito | Valor | Motivo |
|-----------|-------|--------|
| **RAM** | **2 GB** | Chromium pode peaks de 600MB + Node 300MB, sobra para o SO |
| **vCPU** | **2** | Processamento paralelo Chromium + Node |
| **Disco** | 30 GB SSD | Espaço para crescimento de logs e session |
| **SO** | Ubuntu 22.04 LTS ou 24.04 LTS | |

### Software Necessário

| Software | Versão | Instalação |
|----------|--------|------------|
| Node.js | >= 18.x (recomendado 20.x LTS) | `nodesource.com` |
| npm | (vem com Node) | Incluso |
| PM2 | Última | `npm i -g pm2` |
| Chromium | (vem com whatasapp-web.js) | `apt install chromium-browser` |
| Git | Última | `apt install git` |
| build-essential | Última | `apt install build-essential` |

---

## Provedores Recomendados

| Provedor | Plano | RAM | Preço | Notas |
|----------|-------|-----|-------|-------|
| **Oracle Cloud Free Tier** | VM.Standard.A1.Flex | **4 GB** | **Grátis** | 🏆 Melhor custo-benefício, ARM (Ampere), solicitação de upgrade pode demorar |
| **Hetzner** | CX22 | 4 GB | ~€8/mês (~R$48) | Excelente custo-benefício, Alemanha/FIN, painel simples |
| **DigitalOcean** | Basic | 2 GB | ~$12/mês (~R$60) | Simples, bom para iniciantes, painel amigável |
| **Contabo** | Cloud VPS S | 4 GB | ~€6/mês (~R$36) | Barato, mas desempenho inferior (compartilhado) |
| **AWS EC2** | t3a.small | 2 GB | ~$15/mês (~R$75) | Mais complexo, free tier 1 ano |
| **Google Cloud** | e2-small | 2 GB | ~$13/mês (~R$65) | Free tier 3 meses |

### Recomendação por perfil

| Perfil | Provedor |
|--------|----------|
| **Custo zero** | Oracle Cloud Free Tier (4GB ARM) |
| **Melhor custo-benefício** | Hetzner CX22 (~R$48/mês) |
| **Mais simples de configurar** | DigitalOcean (~R$60/mês) |
| **Mais barato pago** | Contabo (~R$36/mês) |

---

## Custos Mensais

| Item | Custo Estimado |
|------|---------------|
| **VPS** | R$ 0 (Oracle Free) a ~R$ 80 (DigitalOcean) |
| **Chip WhatsApp** (opcional, para não usar número pessoal) | R$ 10-15/mês (pré-pago) |
| **Domínio** (opcional) | ~R$ 30-50/ano |
| **Total mensal** | **R$ 0 a R$ 95/mês** |

> 💡 O custo se paga com **1-2 vendas de afiliado por mês**.

---

## Pré-requisitos

Antes de começar, tenha em mãos:

- [ ] **Conta na VPS** contratada (acesso SSH + IP)
- [ ] **Repositório GitHub** clonável: `https://github.com/odcolares/RendaExtraCupuns.git`
- [ ] **Arquivo `.env` completo** com:
  - `TELEGRAM_BOT_TOKEN` ✅
  - `TELEGRAM_CHANNEL_ID` ✅
  - `AMAZON_AFFILIATE_TAG` ✅
  - `ALIEXPRESS_AFFILIATE_ID` ✅
  - `SHOPEE_AFFILIATE_ID` ✅
  - `MERCADOLIVRE_AFFILIATE_ID` ✅
  - `ML_CLIENT_ID` + `ML_SECRET_KEY` + tokens OAuth ✅
  - `WHATSAPP_GROUP_IDS` ✅
- [ ] **Número WhatsApp** disponível para escanear QR Code (ou sessão `whatsapp-session/` para copiar)

---

## Setup Passo a Passo

### 1. Conectar na VPS

```bash
ssh root@ip-da-vps
# ou
ssh usuario@ip-da-vps
```

### 2. Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Instalar Node.js 20.x LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version   # v20.x.x
npm --version    # 10.x.x
```

### 4. Instalar dependências de sistema

```bash
# Git (para clonar o repositório)
sudo apt install -y git

# Chromium + dependências (necessário para whatasapp-web.js)
sudo apt install -y chromium-browser ca-certificates fonts-liberation \
  libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libnss3 \
  libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils \
  libgbm-dev

# build-essential (para compilar módulos nativos)
sudo apt install -y build-essential
```

### 5. Instalar PM2 globalmente

```bash
npm install -g pm2

# Verificar
pm2 --version   # 5.x.x
```

### 6. Clonar o repositório

```bash
git clone https://github.com/odcolares/RendaExtraCupuns.git
cd RendaExtraCupuns
```

### 7. Instalar dependências do projeto

```bash
npm install
```

### 8. Configurar arquivo .env

```bash
# Criar o .env a partir do exemplo
cp config/.env.example config/.env

# Editar com suas credenciais
nano config/.env
```

Conteúdo mínimo do `.env`:

```env
# ── Telegram ──
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHANNEL_ID=@seud_canal

# ── WhatsApp ──
WHATSAPP_GROUP_IDS=120363000000000000@g.us,120363000000000001@g.us
WHATSAPP_NEWSLETTER_ID=
WHATSAPP_SESSION_PATH=./whatsapp-session

# ── Amazon ──
AMAZON_AFFILIATE_TAG=odcolares2026-20
AMAZON_MARKETPLACE=www.amazon.com.br

# ── AliExpress ──
ALIEXPRESS_AFFILIATE_ID=RendaExtraCupuns

# ── Shopee ──
SHOPEE_AFFILIATE_ID=18387911117

# ── Mercado Livre ──
MERCADOLIVRE_AFFILIATE_ID=88981950

# ── Mercado Livre OAuth ──
ML_CLIENT_ID=seu_app_id
ML_SECRET_KEY=sua_secret_key
ML_ACCESS_TOKEN=token_gerado_pelo_oauth
ML_REFRESH_TOKEN=refresh_token_gerado_pelo_oauth
```

### 9. Build do projeto

```bash
npm run build
```

> O `postbuild` já copia o `.env` para `dist/config/` e cria as pastas `data/` e `logs/`.

### 10. Configurar sessão WhatsApp

A sessão WhatsApp é o ponto mais crítico. Duas abordagens:

#### Opção A: Copiar sessão do computador local (recomendado)

No seu computador local (onde o bot já funciona):

```bash
# No PowerShell (Windows) - compactar a pasta de sessão
Compress-Archive -Path whatsapp-session -DestinationPath whatsapp-session.zip
```

Envie o arquivo para a VPS:

```bash
# No seu computador local
scp whatsapp-session.zip root@ip-da-vps:~/RendaExtraCupuns/
```

Na VPS:

```bash
cd ~/RendaExtraCupuns
unzip whatsapp-session.zip
rm whatsapp-session.zip
```

#### Opção B: Gerar QR Code na VPS (se não tiver sessão salva)

```bash
# Na VPS, rode o modo QR Code isolado
npm run whatsapp:qr
```

⚠️ **Atenção**: O QR Code no terminal SSH pode não renderizar corretamente em alguns clientes. Soluções:

1. Use `ssh -X` se tiver X11 forwarding
2. Ou gere o QR Code em um computador com interface gráfica e copie a pasta `whatsapp-session/` gerada para a VPS (Opção A)

### 11. Iniciar o bot com PM2

```bash
# Iniciar
npm run start:pm2

# Verificar status
pm2 status

# Ver logs para confirmar que está tudo ok
pm2 logs renda-extra-cupuns --lines 30
```

### 12. Configurar PM2 para iniciar com o sistema

```bash
# Salvar a configuração atual do PM2
pm2 save

# Gerar script de startup (siga as instruções que aparecem)
pm2 startup
```

---

## WhatsApp Session Management

### Estrutura da Sessão

```
whatsapp-session/
├── Default/                    # Pasta de sessão do whatasapp-web.js
│   ├── auth_info.json         # Credenciais de autenticação
│   └── ...                    # Outros arquivos de sessão
└── session.data.json          # Estado da sessão
```

### Ciclo de Vida da Sessão

```
QR Code escaneado → Sessão criada em whatsapp-session/
       │
       ▼
Bot reinicia → Sessão restaurada automaticamente (sem novo QR)
       │
       ▼
Sessão expira (raro) → Novo QR Code necessário → npm run whatsapp:qr
       │
       ▼
Bot migra de VPS → Copiar pasta whatsapp-session/ para nova VPS
```

### Renovação do QR Code

Se a sessão expirar (apenas se o WhatsApp for desconectado manualmente ou após meses sem uso):

```bash
# Opção 1: Via terminal (se funcionar em SSH)
npm run whatsapp:qr

# Opção 2: Rodar o bot completo (ele mostra QR se precisar)
npm run dev
```

### Migração da Sessão entre Servidores

```bash
# Na VPS antiga
cd ~/RendaExtraCupuns
tar -czf whatsapp-session.tar.gz whatsapp-session/

# Transferir para nova VPS
scp whatsapp-session.tar.gz root@nova-vps:~/RendaExtraCupuns/

# Na nova VPS
cd ~/RendaExtraCupuns
tar -xzf whatsapp-session.tar.gz
rm whatsapp-session.tar.gz
```

---

## PM2 - Gerenciamento do Processo

### Comandos Essenciais

| Comando | Descrição |
|---------|-----------|
| `pm2 status` | Status de todos os processos |
| `pm2 logs renda-extra-cupuns` | Logs em tempo real |
| `pm2 logs renda-extra-cupuns --lines 50` | Últimas 50 linhas |
| `pm2 monit` | Dashboard CPU/RAM em tempo real |
| `pm2 restart renda-extra-cupuns` | Reiniciar o bot |
| `pm2 stop renda-extra-cupuns` | Parar o bot |
| `pm2 start renda-extra-cupuns` | Iniciar o bot |
| `pm2 delete renda-extra-cupuns` | Remover do PM2 |
| `pm2 save` | Salvar lista de processos |
| `pm2 startup` | Iniciar PM2 com o sistema |
| `pm2 flush` | Limpar logs |

### Logs

Local dos arquivos de log (definido no `ecosystem.config.cjs`):

```bash
# Log de erro
tail -f logs/error.log

# Log de saída padrão
tail -f logs/out.log
```

### Configuração do PM2 (ecosystem.config.cjs)

```javascript
// Já configurado no projeto — não precisa mexer
{
  name: "renda-extra-cupuns",
  script: "dist/index.js",
  env_file: "./config/.env",
  autorestart: true,
  max_restarts: 10,
  restart_delay: 5000,
  exp_backoff_restart_delay: 100, // Backoff exponencial
  max_memory_restart: "500M",     // Reinicia se >500MB RAM
  instances: 1,                    // Single instance (whatsapp-web.js)
  kill_timeout: 10000,             // 10s graceful shutdown
  listen_timeout: 30000            // 30s para iniciar
}
```

### Graceful Shutdown

O bot já trata `SIGINT` e `SIGTERM` para parar graciosamente:

1. Para o monitor WhatsApp
2. Destrói o cliente WhatsApp
3. Para o bot Telegram
4. Fecha o banco de dados SQLite

---

## Monitoramento

### Health Check Rápido

```bash
# Verificar se o processo está vivo
pm2 status
# Saída esperada: renda-extra-cupuns → online

# Verificar última atividade nos logs
pm2 logs renda-extra-cupuns --lines 10

# Verificar consumo de recursos
pm2 monit
# RAM esperada: ~200-500MB
# CPU esperada: ~0-5% (ocioso), ~10-30% (processando oferta)
```

### Verificação Manual do Canal Telegram

Periodicamente, verifique se o canal @Ofertas_cupons_agora está recebendo ofertas novas. Se parou de publicar:

```bash
# 1. Verificar se o bot está rodando
pm2 status

# 2. Verificar logs de erro
tail -f logs/error.log

# 3. Verificar conexão WhatsApp
pm2 logs renda-extra-cupuns --lines 30 | grep -i "whatsapp"

# 4. Verificar pipeline
pm2 logs renda-extra-cupuns --lines 30 | grep -i "offer\|pipeline\|public"
```

### Notificação de Falhas (opcional)

Se quiser ser notificado se o bot cair:

```bash
# Instalar plugin de notificação do PM2
pm2 install pm2-slack
# ou
pm2 install pm2-telegram
```

---

## Segurança

### Firewall (UFW)

```bash
# Habilitar firewall — apenas SSH (porta 22)
sudo ufw allow 22
sudo ufw enable
sudo ufw status
```

> O bot não precisa de portas abertas — ele **conecta para fora** (Telegram API, WhatsApp Web), não recebe conexões externas.

### Usuário não-root (recomendado)

```bash
# Criar usuário para rodar o bot
sudo adduser botuser
sudo usermod -aG sudo botuser

# Migrar o projeto
sudo mv ~/RendaExtraCupuns /home/botuser/
sudo chown -R botuser:botuser /home/botuser/RendaExtraCupuns

# Conectar como botuser
su - botuser
```

### .env Seguro

```bash
# Apenas o usuário do bot pode ler o .env
chmod 600 config/.env

# Verificar
ls -la config/.env
# -rw------- 1 botuser botuser 350 jun 25 12:00 config/.env
```

### Backup da Sessão WhatsApp

A sessão é o ativo mais crítico — perdê-la significa ter que escanear QR Code novamente:

```bash
# Backup manual
tar -czf backup-session-$(date +%Y%m%d).tar.gz whatsapp-session/

# Recomendação: agendar backup semanal
# sudo crontab -e
# Adicionar:
# 0 3 * * 0 tar -czf /home/botuser/backups/session-$(date +\%Y\%m\%d).tar.gz -C /home/botuser/RendaExtraCupuns whatsapp-session/
```

---

## Atualizações do Bot

### Fluxo de Update

Quando houver novas funcionalidades no GitHub (merge na master):

```bash
# 1. Conectar na VPS
ssh root@ip-da-vps

# 2. Ir para o diretório do projeto
cd ~/RendaExtraCupuns

# 3. Atualizar o código
git pull origin master

# 4. Reinstalar dependências (se houver mudanças)
npm install

# 5. Build
npm run build

# 6. Reiniciar o bot
pm2 restart renda-extra-cupuns

# 7. Verificar logs
pm2 logs renda-extra-cupuns --lines 10
```

### Rollback (se algo der errado)

```bash
# Ver versões anteriores
git log --oneline -10

# Voltar para um commit específico
git checkout abc1234

# Build e restart
npm run build
pm2 restart renda-extra-cupuns
```

---

## Troubleshooting

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| **Bot não inicia** | .env incompleto | Verificar se TOKENS estão preenchidos |
| **Chromium crash** | Falta dependências | `sudo apt install -y libgbm-dev libnspr4 libnss3` |
| **WhatsApp desconectou** | Sessão expirou | Rodar `npm run whatsapp:qr` e escanear |
| **QR Code não aparece no SSH** | Terminal sem suporte gráfico | Gerar QR no PC local e copiar sessão |
| **Memória estourando** | Vazamento Chromium | `pm2 restart renda-extra-cupuns` (ou aumentar RAM) |
| **Logs cheios de "Oferta duplicada"** | Comportamento normal | Bot já processou aquela oferta, está ignorando |
| **Nada publicado no Telegram** | WhatsApp desconectado | Verificar `pm2 logs` por "WhatsApp cliente conectado" |
| **Erro "Mercado Livre OAuth token expirado"** | Token expirou | Renovar com `node scripts/setup-ml-oauth.js` |
| **PM2 não inicia com o sistema** | `pm2 startup` não rodou | Rodar `pm2 startup` e seguir instruções |
| **Disco cheio** | Logs acumulados | Rodar `pm2 flush` ou configurar log rotate: `pm2 install pm2-logrotate` |

### Resolução de URLs Curtas (se links não estiverem sendo resolvidos)

O bot usa `axios` para seguir redirects de URLs encurtadas. Se não estiver funcionando:

```bash
# Verificar conectividade
curl -I https://amzn.to/teste
```

---

## Pós-Deploy

### Checklist de Verificação

Após o deploy completo, execute esta checklist:

- [ ] `pm2 status` → `online` ✅
- [ ] `pm2 logs` → "WhatsApp cliente conectado" ou "QR code gerado" ✅
- [ ] `pm2 logs` → "Telegram bot conectado" ou "Bot Telegram conectado" ✅
- [ ] `pm2 logs` → "RendaExtraCupuns pronto!" ✅
- [ ] Canal Telegram recebendo ofertas (aguardar ~30min após sessão WhatsApp conectar) ✅
- [ ] `pm2 startup` configurado (bot reinicia se VPS reiniciar) ✅
- [ ] Firewall ativo (UFW) ✅
- [ ] `.env` com permissão `600` ✅
- [ ] Backup da sessão WhatsApp salvo ✅

### Comandos de Verificação Rápida

```bash
# 1. Status
pm2 status | grep renda-extra-cupuns

# 2. Memória
pm2 monit

# 3. Últimas ofertas publicadas
pm2 logs renda-extra-cupuns --lines 20 | grep -i "public"

# 4. Conexão WhatsApp
pm2 logs renda-extra-cupuns --lines 5 | grep -i "whatsapp"

# 5. Banco de dados (total de ofertas)
cat logs/out.log | grep -i "estatísticas" | tail -1
```

---

## Próximos Passos

Após o deploy bem-sucedido:

### Curto Prazo (primeira semana)

- [ ] Monitorar logs diariamente para garantir estabilidade
- [ ] Verificar se as ofertas estão chegando no Telegram com links corretos
- [ ] Ajustar fontes WhatsApp (adicionar/remover grupos) conforme necessidade
- [ ] Verificar consumo de RAM e ajustar se necessário

### Médio Prazo (primeiro mês)

- [ ] Configurar backup automático da sessão WhatsApp (cron job)
- [ ] Configurar log rotate do PM2 para não encher o disco
- [ ] Analisar métricas: quantas ofertas/dia, quantos cliques, comissão gerada
- [ ] Avaliar se precisa de mais RAM ou outro plano

### Longo Prazo (escalar)

- [ ] **Quando a comissão justificar**: considerar WhatsApp Business API como segundo canal de publicação
- [ ] **Se o público crescer**: adicionar mais fontes de ofertas (mais grupos WhatsApp)
- [ ] **Otimização**: ajustar templates de mensagem baseado em CTR (click-through rate)
- [ ] **Dashboard**: criar página simples para ver ofertas publicadas e cliques

### Roteiro de Expansão

```
Fase 7.0: Deploy VPS (atual)
  ↓
Fase 7.1: Monitoramento + estabilidade
  ↓
Fase 7.2: Otimização de templates / CTR
  ↓
Fase 7.3: Novas fontes de ofertas
  ↓
Fase 7.4: WhatsApp Business API (quando escalar)
```

---

## Referências

| Arquivo | Link |
|---------|------|
| PM2 config | [`ecosystem.config.cjs`](./ecosystem.config.cjs) |
| Env example | [`config/.env.example`](./config/.env.example) |
| WhatsApp doc | [`WHATSAPP.md`](./WHATSAPP.md) |
| Telegram doc | [`TELEGRAM.md`](./TELEGRAM.md) |
| Afiliados | [`AFFILIATES.md`](./AFFILIATES.md) |
| Fluxo de trabalho | [`FLUXO.md`](./FLUXO.md) |
| Status do projeto | [`contexto.md`](./contexto.md) |

---

## Informações do Projeto

| Item | Valor |
|------|-------|
| Repositório | `https://github.com/odcolares/RendaExtraCupuns` |
| Telegram Channel | `@Ofertas_cupons_agora` |
| Telegram Bot | `@RendaExtraCuponsBot` |
| Node | >= 18.x (recomendado 20.x LTS) |
| WhatsApp | whatasapp-web.js v1.25+ |
| Telegram | Telegraf v4.16+ |
| PM2 | v5.x |
| Deploy | Guia neste documento |

---

*Última atualização: 26/06/2026*
