# Manual de Funcionalidades - RendaExtraCupuns
## Módulos Principais
### 2. Gerador de Links Afiliados
### 3. Publicador Telegram
### 4. Dashboard do Cliente (/dashboard)
### 5. Painel Super Admin (/admin)
### 6. Onboarding Wizard
### 7. Branding White-Label
### 8. Múltiplos Planos
## Status dos Recursos
## Integrações Externas
## Principais Fluxos
## Segurança e Perfis
## Próximos Passos Recomendados

Para quem está começando a usar ou avaliando o sistema:

1. **Teste inicial:** Acesse a landing page e faça o tour pelo sistema
2. **Plano Free:** Configure com 2 grupos e teste o pipeline completo
3. **Upgrade:** Considere Pro se precisar de mais fontes ou Enterprise se tiver múltiplos grupos
4. **Branding:** Personalize o bot para sua marca assim que possível
5. **Monitoramento:** Acompanhe as métricas semanalmente nos primeiros meses
6. **Suporte:** Não hesite em contactar se tiver dúvidas ou problemas técnicos

---

*Manual gerado baseado na arquitetura do projeto RendaExtraCupuns*
*Última atualização: 07/09/2026*
*Formato: Markdown (.md)*
*Diretiva de comunicação: Portuguese do Brasil (pt-BR)*

### Perfis de Usuário

| Perfil | Acesso | Principais Funcionalidades |
|--------|--------|---------------------------|
| **Público** | /, /login | Landing page, login |
| **Cliente (Assinante)** | /dashboard | Painel completo, próprias funcionalidades |
| **Super Admin** | /admin | Gestão de todos os clientes, faturamento, configurações globais |

### Segurança

- **NextAuth.js** com provedor Credentials (apenas admin)
- **JWT** em cookie httpOnly
- **Middleware** Next.js protege rotas `/admin/*`
- **Role-based access control (RBAC):**
  - `super_admin`: Acesso total a todas as funcionalidades
  - `client`/`assinante`: Acesso às próprias funcionalidades no /dashboard
- **Rate limiting** por tenant (para evitar abusos)
- **Validação server-side** em todas as APIs
- **Dados isolados:** Cada cliente tem schema `tenant_{uuid}`, nunca misturam dados
- **Imports do Prisma no bot**: O código do bot usa caminhos relativos (`../generated/prisma/client`) em vez de aliases `@/`. Isso afeta apenas o código do bot (src/bot/), não o web app.

### Backup e Recuperação

- **Por cliente:** Backup/restore do schema `tenant_{uuid}`
- **Metadados globais:** Tabela `public.plans`, `public.tenants`, `public.admin_users`
- **Logs:** Centralizados, mantidos por 30 dias mínimo
- **Recuperação de QR code:** Se perder o QR, pode gerar novo em "Fontes" → "Conectar WhatsApp"

### Fluxo de Publicação de Oferta (Automático)

```
1. Monitor WhatsApp detecta nova mensagem em grupo
2. Extrai: nome, preço, plataforma, imagem, código cupom
3. Detecta plataforma (Amazon/ML/Shopee/AliExpress)
4. Gerador de Afiliados: cria link com parâmetros da plataforma
5. Publicador Telegram: formata mensagem em Markdown
6. Valida rate limit (30msgs/hora)
7. Publica no canal do cliente
8. Salva no banco de dados (Turso/tenant_{uuid}.offers)
9. Atualiza métricas no dashboard
10. Loop reinicia a cada few segundos
```

### Fluxo de Onboarding (Novo Cliente)

```
1. Cliente cadastra-se no sistema
2. Acesse /dashboard e vê onboarding wizard
3. Etapa 1: Scan QR code no WhatsApp → conectado
4. Etapa 2: Configurar Telegram (token + canal) → testado
5. Etapa 3: Configurar afiliados (4 plataformas) → validado
6. Etapa 4: Bot detecta primeira oferta → publicada
7. Etapa 5: Status " completo" → cliente pode usar normalmente
```

### Fluxo de Gerenciamento de Cliente (Super Admin)

```
1. Admin cria novo cliente no painel /admin
2. Sistema gera tenant_{uuid} no banco de dados
3. Cliente recebe e-mail de boas-vindas com login
4. Cliente acessa /dashboard e vê onboarding wizard
5. Admin pode configurar plano (Free/Pro/Enterprise)
6. Admin pode suspender/reativar/cancelar cliente
7. Admin vê métricas globais de todos os clientes
8. Worker do cliente é provisionado e inicia monitoramento
```

| Serviço | Finalidade | Status |
|---------|------------|--------|
| **Stripe** | Pagamentos de assinatura, webhooks | ✅ Ativo |
| **Turso** | Banco de dados serverless (SQLite compatível) | ✅ Ativo |
| **Vercel** | Deploy da aplicação web (auto via GitHub) | ✅ Ativo |
| **Baileys** | Cliente WhatsApp (WebSocket, TypeScript) | ✅ Ativo |
| **Telegraf** | Bot Telegram (v4, adaptado multi-tenant) | ✅ Ativo |
| **Prisma** | ORM, migrations, client gerado | ✅ Ativo |
| **NextAuth** | Autenticação (Credentials + JWT) | ✅ Ativo |

| Recurso | Status | Comentários |
|---------|--------|-------------|
| Monitor WhatsApp | ✅ Ativo | 98/98 testes passing |
| Links Afiliados (4 plataformas) | ✅ Ativo | Amazon/ML/Shopee/AliExpress |
| Publicador Telegram | ✅ Ativo | Rate limit 30msgs/hora |
| Dashboard Cliente | ✅ Ativo | Todas as métricas funcionando |
| Painel Super Admin | ✅ Ativo | Gestão completa de clientes |
| Onboarding Wizard | ✅ Ativo | Passo a passo guiado |
| Branding White-Label | ✅ Ativo | Por cliente |
| Múltiplos Planos | ✅ Ativo | Free/Pro/Enterprise |
| Stripe Payments | ✅ Ativo | Assinaturas funcionando |
| Turso Banco Dados | ✅ Ativo | Serverless, migrations aplicadas |
| Multi-tenant Isolation | ✅ Ativo | Schemas tenant_{uuid} |
| Deploy Vercel | ✅ Ativo | Live em https://web-gamma-hazel-30.vercel.app |

#### Funcionalidades
- Três níveis de plano com diferentes limites e funcionalidades
- Assinatura mensal via Stripe
- Upgrade/downgrade entre planos

#### Tabela de Planos

| Plano | Fontes WhatsApp | Canais Telegram | Branding | Preço (mês) | Público |
|-------|-----------------|-----------------|----------|-------------|---------|
| **Free** | 2 | 1 | Não | Grátis | Testadores, iniciais |
| **Pro** | 5 | 1 | Sim | R$ 29-49 | Pequenos afiliaidos |
| **Enterprise** | Ilimitado | Ilimitado | Sim + prioridade | R$ 79-149 | Empresas, múltiplos grupos |

#### Limites por Plano

| Recurso | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Fontes WhatsApp** | 2 | 5 | Ilimitado |
| **Canais Telegram** | 1 | 1 | Ilimitado |
| **Branding** | Não | Sim | Sim + prioridade de suporte |
| **Analytics** | Básico | Completo | Completo + relatórios customizados |
| **Suporte** | Comunidade | Email 24h | Prioridade + SLA |

#### Cycle de Assinatura
1. Cliente cadastra-se (plano Free inicial ou escolha de plano)
2. Pagamento via Stripe Checkout
3. Acesso imediato ao plano contratado
4. Pode fazer upgrade/downgrade a qualquer momento
5. Cancelamento: mantém acesso até o fim do período pago
6. Após cancelamento: volta para Free ou plano base

#### Migração
- **Free → Pro:** Acesso imediato após pagamento, limites aumentam
- **Pro → Enterprise:** Pode requerer configuração adicional, contato com suporte
- **Qualquer plano → Free:** Mantém acesso, mas volta aos limites do Free

#### Funcionalidades
- Cada cliente pode personalizar a identidade visual do seu bot
- Aplicável tanto no bot Telegram quanto nas mensagens publicadas

#### O Que Pode Ser Personalizado

| Elemento | Descrição | Padrão |
|----------|-----------|--------|
| **Nome do bot** | `@username` do Telegram | `Ofertas` |
| **Avatar/Logo** | Imagem do bot | - |
| **Cores primárias** | Hex color code | `#2563eb` (azul) |
| **Template de mensagem** | Formato texto das ofertas | Template padrão |
| **Texto de rodapé** | Texto que aparece no final da mensagem | `Links de afiliado - podemos ganhar comissão` |

#### Aplicação
- No bot Telegram: o nome muda o @username e o nome exibido nas informações do bot
- Nas mensagens: o template é usado na formatação da publicação
- No painel: exibido em "Configurações" → "Branding"
- Por cliente: cada cliente tem suas configurações isoladas no schema `tenant_{uuid}.branding`

#### Exemplo
```
Antes: Bot @RendaExtraCupunsOficial
Depois: Bot @MinhasOfertasOficiais

Mensagem: "Oferta do dia: ..." (padrão)
Depois: "Promoção exclusiva: ..." (customizado pelo cliente)
```

#### Funcionalidades
- Passo a passo guiado para novo cliente configurar tudo
- Progresso visual (0% a 100%)
- Validação em cada etapa

#### Etapas do Onboarding

1. **Conectar WhatsApp** (0-20%)
   - Scan QR code
   - Verificar conexão
   - Status: connecting → connected

2. **Configurar Telegram** (20-40%)
   - Inserir token do BotFather
   - Inserir ID do canal
   - Testar publicação
   - Status: testando → ativo/inativo

3. **Definir Afiliados** (40-60%)
   - Configurar Amazon (tag)
   - Configurar Mercado Livre (ID)
   - Configurar Shopee (ID)
   - Configurar AliExpress (tag)
   - Status: pendente → ativo para cada plataforma

4. **Primeira Publicação** (60-80%)
   - Bot detecta primeira oferta
   - Oferta publicada no Telegram
   - Status: aguardando → primeira publicação ✅

5. **Pronto para uso** (80-100%)
   - Todas as configurações concluídas
   - Cliente pode usar normalmente
   - Status: completo → ativo

#### Indicadores Visuais
- Barra de progresso colorida
- Checkmarks por etapa concluída
- Mensagens de orientação em cada passo
- Link direto para próxima etapa caso pule

#### Funcionalidades
- Gestão completa de todos os clientes do sistema
- Visão geral do faturamento e doenges
- Controle de workers (bots) por cliente
- Ofertas globais (de todos os clientes)

#### Seções Principais

| Seção | Conteúdo |
|-------|----------|
| **Clientes** | Lista com busca/paginação, detalhe por ID, controle de planos (suspender/reativar/cancelar), branding por cliente |
| **Ofertas Globais** | Visão de todas as ofertas de todos os clientes, filtro por plataforma/status/período, ações bulk |
| **Faturamento** | MRR estimado por plano, breakdown de clientes por plano, status dos clientes, histórico de pagamentos Stripe |
| **Afiliados** | Configurações globais de afiliados do sistema |
| **Branding** | Personalização por cliente: nome do bot, logo, cores, template de mensagem |
| **Bot Manager** | Lifecycle do workers: provision/start/stop/restart/QR Code, health check |
| **Logs** | Logs centralizados do sistema, health check status |
| **Planos** | Tabela de planos: Free/Pro/Enterprise, definição de limites e preços |

#### Acesso
- Apenas super_admin autenticado
- Rota: `/admin`
- Protegido por middleware Next.js e role-based access control

#### Funcionalidades
- Visão geral do desempenho do cliente
- Gestão de fontes WhatsApp
- Configuração de afiliados
- Histórico de ofertas publicadas
- Métricas de desempenho

#### Seções Principais

| Seção | Conteúdo |
|-------|----------|
| **Dashboard** | Métricas principais: ofertas hoje/total, fontes ativas/total, status do bot, gráficos de desempenho |
| **Ofertas** | Histórico buscável/filtrable: por plataforma, por período, detalhes de cada oferta |
| **Afiliados** | Configuração por plataforma: status, IDs/tags, testar geração de link |
| **Fontes** | CRUD completo: criar/editar/excluir fontes WhatsApp, grupos/broadcast/newsletters |
| **Onboarding** | Passo a passo guiado para configuração inicial |
| **Analytics** | Gráficos de desempenho: ofertas por período, por plataforma, fontes mais ativas |

#### Métricas Exibidas
- Ofertas publicadas hoje
- Ofertas totais (desde início)
- Fontes ativas / Total (limite do plano)
- Fontes ultimamente verificadas
- Status do bot (connected/connecting/expired/blocked)
- Gráficos de ofertas ao longo do tempo

#### Acesso
- Apenas clientes autenticados (role: "client")
- Rota: `/dashboard`
- Protegido por middleware Next.js

#### Funcionalidades
- Publica ofertas formatadas no canal Telegram do cliente
- Rate limiting: 30 mensagens por hora por canal
- Formatação Markdown com preview de links
- Botões inline (máximo 8 por mensagem)

#### Formato de Mensagem

```
🔖 *Nome do Produto*

💲 Preço: R$ xxx,xx
🛒 Link: https://...

📦 Descrição breve da oferta

⚡ Código de desconto: CUPOM10 (se houver)
```

#### Características Técnicas

| Característica | Detalhe |
|----------------|---------|
| **Parse mode** | `Markdown` |
| **Escape required** | `*`, `_`, `[`, `]`, `(`, `)`, `~`, `` ` `` |
| **Inline buttons** | Máximo 8 por mensagem |
| **Link preview** | `is_disabled: false, prefer_large_media: true` |
| **Rate limit** | 30 mensagens/hora por canal (reinicia a cada hora) |
| **Fallback imagem** | Se imagem bloqueada, usa texto automático |
| **Rate limit reset** | Contador reinicia após 1 hora exata |

#### Integração
- Token do BotFather necessário para cada cliente
- ID do canal de destino configurável por cliente
- `telegram/publisher.ts` - responsável pela publicação
- Templates de mensagem em `src/telegram/templates.md`

#### Funcionalidades
- Detecta a plataforma do produto na URL
- Gera link de afiliado com parâmetros corretos por plataforma
- Suporta 4 plataformas principais
- Fallback para link direto se não houver afiliado configurado

#### Suporte por Plataforma

| Plataforma | Identificador | Formato de Link |
|------------|---------------|-----------------|
| **Amazon** | Tag `odcolares2026-20` | ASIN + tag afiliada → link amzn.to otimizado |
| **Mercado Livre** | ID 88981950 | ID do vendedor + parâmetros de comissão |
| **Shopee** | ID 18387911117 | URL curta shp.ee ou s.shopee.com.br com parâmetros |
| **AliExpress** | Tag de afiliado | Tracking parameters para comissão |

#### Comportamento
- **Detecção:** O sistema identifica a plataforma automaticamente pela URL
- **Geração:** Cria o link com os parâmetros de afiliado corretos
- **Fallback (Graceful degradation):** Se o cliente não tem afiliado configurado para uma plataforma:
  - O pipeline **não quebra**
  - O link gerado é o **link direto** (sem parâmetros de comissão)
  - A oferta ainda é publicada, mas sem comissão para esse cliente
  - Isso permite que o sistema funcione mesmo sem configuração completa

#### Configuração
- Acesso: `/dashboard` → `Afiliados` ou `/admin` → `Afiliados`
- Cada plataforma tem campo para ID/tag
- Validação server-side ao salvar
- Status exibido: ativo/inativo

### 1. Monitor WhatsApp

#### Funcionalidades
- Monitora grupos, broadcast e newsletters configurados pelo cliente
- Detecta mensagens com URLs de produtos/ocêr
- Filtra apenas pelas fontes configuradas pelo cliente
- Ignora mensagens sem URLs relevantes

#### Características Técnicas
- **Fonte de dados:** Mensagens recebidas nos grupos WhatsApp do cliente
- **Tipos de fonte Suportados:** Grupo (@g.us), Broadcast (@broadcast), Newsletter (@newsletter)
- **Frequência:** A cada few seconds (polling contínuo)
- **Isolamento:** Cada cliente tem seu próprio worker isolado
- **Graceful degradation:** Se falhar em uma plataforma, continua nas outras

#### Integração
- Utiliza Baileys (WebSocket, ~30MB por sessão)
- TypeScript com tipos definidos em `src/types.ts`
- Pipeline: `message.body` → `extractLinksFromMessage()` → `processOffer()`

## Visão Geral do Sistema

O **RendaExtraCupuns** é uma plataforma SaaS que permite a cada cliente conectar seu WhatsApp a grupos de ofertas, monitorar automaticamente as mensagens, transformar produtos encontrados em links de afiliado e publicar esses links em seu canal no Telegram - transformando ofertas espontâneas em comissão de afiliado.

### Propósito do Sistema

- **Auto-monitoramento:** O agente monitora grupos WhatsApp 24/7 sem intervenção manual
- **Transformação automática:** Ofertas postadas nos grupos são detectadas e transformadas em links de afiliado
- **Múltiplas plataformas:** Suporta Amazon, Mercado Livre, Shopee e AliExpress
- **Destino automatizado:** Publicações automáticas no canal Telegram do cliente
- **White-label:** Cada cliente pode personalizar o bot com sua marca, nome e cores

### Arquitetura Resumo

```
Cliente WhatsApp --> Bot Monitor --> Processor (extrai/detecta) --> Affiliate Generator --> Telegram Publisher --> Canal do Cliente
```
