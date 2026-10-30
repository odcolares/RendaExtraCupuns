# Manual de Usuário - RendaExtraCupuns SaaS
## Perfis de Usuário
## Navegação no Sistema
## Fluxos Comuns
## Permissões por Rota
## Notas Técnicas
## Próximos Passos para Testes

Para testar o sistema:

1. Acesse https://web-gamma-hazel-30.vercel.app (landing page)
2. Faça login com credenciais de teste
3. Como Cliente: Navegue por /dashboard e teste todas as funcionalidades
4. Como Super Admin: Acesse /admin e teste gerenciamento de clientes
5. Teste o pipeline: Use npm run cli ou npm run dev:bot para testar processamento de mensagens WhatsApp
6. Teste afiliados: Use o script npm run cli com URLs de produtos das 4 plataformas

---

*Última atualização: 07/09/2026 - Sessão 21: fechamento de gaps do Super Admin*
*Manual gerado baseado na arquitetura do projeto RendaExtraCupuns*

### Branding White-Label
Cada cliente pode personalizar:
- Nome do bot (@seudonome)
- Avatar/Logo
- Cores primárias (hex: #2563eb padrão)
- Template de mensagem
- Texto de rodapé

### Multi-tenant Isolation
- Cada cliente tem schema no PostgreSQL (`tenant_{uuid}`)
- Dados isolados - nunca misturam dados de clientes diferentes
- Backup/restore por cliente
- Worker isolado por cliente (PM2 fork mode)

### Segurança
- NextAuth com JWT em cookie httpOnly
- Middleware protege rotas /admin/*
- Role-based access control (RBAC)
- Rate limiting por tenant
- **Imports do Prisma no bot**: O código do bot usa caminhos relativos (`../generated/prisma/client`) em vez de aliases `@/`. Isso afeta apenas o código do bot (src/bot/), não o web app.
- Validação server-side em todas as APIs

### Deploy
- Web: Vercel (auto-deploy via GitHub)
- Workers: VPS com PM2 ou Docker
- Banco: Turso (SQLite compatível, serverless)
- Rate limit: 30 mensagens/hora por canal Telegram

### Cliente (role: "client" ou "assinante"):
- ✅ /dashboard, /ofertas, /afiliados, /fontes
- ✅ /onboarding, /analytics, /assinatura, /conta, /suporte

### Super Admin (role: "super_admin"):
- ✅ Todas as rotas do cliente + /admin, /admin/clientes
- ✅ /admin/clientes/[id], /admin/ofertas, /admin/faturamento
- ✅ /admin/afiliados, /admin/bot, /admin/logs

###Público (Não autenticado):
- ✅ /, /login
- ❌ Todas as rotas protegidas (redireciona para /login)

### Onboarding (Novo Cliente):
1. Cadastro (plano Free inicial)
2. Conectar WhatsApp (QR code)
3. Configurar Telegram (bot token + canal)
4. Definir Afiliados (IDs das plataformas)
5. Primeira Publicação (bot monitora e publica)
6. Upgrade (migrar para Pro/Enterprise)

### Admin Gerenciar Cliente:
1. Criar cliente (novo tenant)
2. Assign plan (definir plano)
3. Gerar QR Code (conexão WhatsApp)
4. Monitorar (status e ofertas)
5. Ajustar (suspender/reativar/mudar plano)
6. Relatórios (faturamento/offers)

### Publicação de Ofertas (Automático):
1. Monitor WhatsApp (detecta mensagem)
2. Processor (extrai dados: nome, preço, plataforma)
3. Affiliate (gera link de afiliado)
4. Coupon (detecta códigos promocionais)
5. Telegram (publica no canal)
6. DB (salva no banco)
7. Metrics (atualiza contagens)

### Menu Lateral - Cliente (/dashboard):
- Dashboard, Ofertas, Afiliados, Fontes, Onboarding, Analytics, Assinatura, Minha Conta, Suporte

### Menu Lateral - Super Admin (/admin):
- Clientes, Ofertas Globais, Faturamento, Afiliados, Branding, Bot Manager, Logs, Planos, Configurações

### Rotas Principais:
| Rota | Perfil | Descrição |
|------|--------|-----------|
| `/` | Público | Landing page |
| `/login` | Todos | Login via NextAuth |
| `/dashboard` | Cliente | Painel completo |
| `/admin` | Super Admin | Painel administrativo |

### Cliente (Assinante)
- Acesso: /dashboard
- Planos disponíveis: Free, Pro, Enterprise
- Funcionalidades principais: Dashboard, Afiliados, Fontes WhatsApp, Telegram, Onboarding, Histórico de Ofertas, Minha Conta, Assinatura

### Super Admin
- Acesso: /admin
- Funcionalidades: Painel global, Gestão de clientes, Ofertas globais, Configurações, Bot Lifecycle, Faturamento e Relatórios

Este manual descreve as funções e possibilidades para cada tipo de usuário no sistema RendaExtraCupuns SaaS.
