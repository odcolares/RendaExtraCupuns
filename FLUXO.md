# FLUXO DE TRABALHO - PADRAO DE EXECUCAO

## REGRA DE OURO

> **ANTES de qualquer demanda nova, seguir este fluxo.**
> Sem excecoes. Sem atalhos.

---

## SUMARIO

1. [Visao Geral](#visao-geral)
2. [Fases do Fluxo](#fases-do-fluxo)
3. [Skills por Fase](#skills-por-fase)
4. [Checkpoints Obrigatorios](#checkpoints-obrigatorios)
5. [Tabela de Decisoes](#tabela-de-decisoes)
6. [Exemplos Praticos](#exemplos-praticos)
7. [Template de Execucao](#template-de-execucao)

---

## Visao Geral

```
   TODA DEMANDA NOVA DEVE PASSAR POR:

   1. ENTENDER   -> O que esta sendo pedido?
   2. CONTEXTO   -> Que informacoes ja temos?
   3. PLANEJAR   -> Como vamos fazer?
   4. EXECUTAR   -> Fazer o que foi planejado
   5. VALIDAR    -> Ficou como esperado?
   6. REGISTRAR  -> O que aprendemos?
   7. DEPLOY     -> Colocar em producao
```

---

## Fases do Fluxo

### Fase 1: ENTENDER

**Objetivo:** Compreender completamente a demanda

| Acao | Descricao |
|------|-----------|
| Ler solicitacao | Entender exatamente o que foi pedido |
| Fazer perguntas | Esclarecer duvidas antes de comecar |
| Definir escopo | O que esta dentro e fora do escopo |
| Identificar dependencias | O que precisa existir antes |

**Skills:** Nenhuma (leitura e compreensao)

**Checkpoint:**
- [ ] Entendi o que foi pedido?
- [ ] Tenho todas as informacoes necessarias?
- [ ] O escopo esta claro?
- [ ] Identifiquei dependencias?

---

### Fase 2: CONTEXTO

**Objetivo:** Carregar todas as informacoes relevantes

| Acao | Descricao |
|------|-----------|
| Ler contexto.md | Onde estamos no projeto |
| Ler documentacao existente | O que ja foi feito |
| Verificar graphify | Analise de arquitetura |
| Verificar sessoes anteriores | Decisoes passadas |

**Skills:** Read, graphify

**Arquivos obrigatorios:**
```
1. contexto.md     -> Status do projeto
2. FLUXO.md        -> Este arquivo (relembrar)
3. SESSAO.txt      -> Ultima sessao
4. Docs relevantes -> README.md, TELEGRAM.md, etc.
```

**Checkpoint:**
- [ ] Li o contexto.md?
- [ ] Li a documentacao relevante?
- [ ] Verifiquei o graphify (se aplicavel)?
- [ ] Sei onde paramos na ultima sessao?

---

### Fase 3: PLANEJAR

**Objetivo:** Definir como executar a tarefa

| Acao | Descricao |
|------|-----------|
| Buscar documentacao | Docs atualizadas de libs externas |
| Criar tarefas | Decompor em passos menores |
| Definir ordem | Dependencias entre tarefas |
| Estimar esforco | Quanto tempo vai levar |

**Skills:** context7, task-management, ContextScout

**Checkpoint:**
- [ ] Busquei docs das bibliotecas que vou usar?
- [ ] Criei tarefas detalhadas?
- [ ] Defini a ordem de execucao?
- [ ] Identifiquei pontos de atencao?

---

### Fase 4: EXECUTAR

**Objetivo:** Implementar o que foi planejado

| Acao | Descricao |
|------|-----------|
| Codar modulo por modulo | Seguir a ordem definida |
| Testar incrementalmente | Cada pedaco antes de seguir |
| Atualizar tarefas | Marcar como concluido |
| Documentar codigo | Comentarios e docs |

**Skills:** CoderAgent, code-reviewer

**Regras:**
```
1. NAO pular etapas
2. TESTAR antes de seguir
3. ATUALIZAR tarefas ao concluir
4. DOCUMENTAR decisoes tomadas
```

**Checkpoint:**
- [ ] Segui a ordem planejada?
- [ ] Testei cada parte?
- [ ] Atualizei as tarefas?
- [ ] Codigo esta funcionando?

---

### Fase 5: VALIDAR

**Objetivo:** Garantir que o resultado esta correto

| Acao | Descricao |
|------|-----------|
| Testar fluxo completo | Do inicio ao fim |
| Revisar codigo | Qualidade e boas praticas |
| Verificar edge cases | O que pode dar errado? |
| Conferir documentacao | Esta atualizada? |

**Skills:** code-reviewer, TestEngineer, BuildAgent

**Checkpoint:**
- [ ] Testei o fluxo completo?
- [ ] Revi o codigo?
- [ ] Verifiquei casos extremos?
- [ ] Documentacao esta atualizada?

---

### Fase 6: REGISTRAR

**Objetivo:** Documentar o que foi feito e aprendido

| Acao | Descricao |
|------|-----------|
| Atualizar contexto.md | Novas decisoes, status |
| Atualizar SESSAO.txt | O que foi feito hoje |
| Atualizar documentacao | Mudancas feitas |
| Rodar graphify --update | Atualizar analise (se codigo mudou) |

**Skills:** graphify --update, Read/Write

**Checkpoint:**
- [ ] Atualizei contexto.md?
- [ ] Atualizei SESSAO.txt?
- [ ] Atualizei documentacao?
- [ ] Graphify atualizado (se aplicavel)?

---

### Fase 7: DEPLOY

**Objetivo:** Colocar o sistema em producao

> ⚠️ **Estratégia atual (Sessão 15, 07/07/2026):** O projeto está migrando de "monólito no VPS" para **SaaS self-service com painel web**. Veja abaixo os dois caminhos.

#### Caminho A — Monólito (legado)
Para deploy do bot monousuário original:

| Acao | Descricao |
|------|-----------|
| Configurar ambiente | .env com tokens reais, variaveis de producao |
| Criar contas externas | Bot Telegram, canais, programas de afiliados |
| Configurar .env | Preencher tokens e IDs reais |
| Testar E2E real | npm run cli / npm run dev com .env configurado |
| Configurar PM2 | ecosystem.config.cjs (logs, restart, memoria) |
| Build de producao | npm run build (postbuild copia .env + pastas) |
| Deploy em VPS/cloud | Servidor 24/7 para execucao continua |

**Skills:** CLI, dotenv, deploy (VPS/cloud)

**Checkpoint:**
- [ ] Contas externas criadas?
- [ ] .env configurado com tokens reais?
- [ ] Teste E2E real passou?
- [ ] Bot rodando 24/7?

#### Caminho B — SaaS Self-Service (ativo)
Para o módulo web + painel do cliente com assinatura:

| Acao | Descricao |
|------|-----------|
| Projeto Next.js | App com landing, auth, dashboard |
| Prisma + SQLite (piloto) | Schema: User, Tenant, Offer, AffiliateConfig |
| NextAuth com roles | admin (super) / client (assinante) |
| Landing + Planos + Signup | Free / R$29 / R$79 — checkout Stripe/MP |
| Painel do cliente | Dashboard, config grupos/afiliados/TG, métricas |
| Super admin | Lista clientes, ofertas globais, controle de planos |
| Deploy Vercel | Auto-deploy via GitHub, HTTPS, grátis |
| Bot local (fonte) | npm run dev mantido — alimenta o DB compartilhado |

**Skills:** Next.js, Prisma, NextAuth, Stripe/Mercado Pago, Vercel

**Checkpoint:**
- [ ] Landing + Signup + Login funcionando?
- [ ] Cliente consegue configurar afiliados e Telegram?
- [ ] Bot + Web compartilham o mesmo DB?
- [ ] Admin vê todos os clientes?
- [ ] Deploy no Vercel funcionando?

---

## Skills por Fase

```
FASE                SKILLS
─────────────────────────────────────────────────────────
1. ENTENDER         Nenhuma (leitura apenas)

2. CONTEXTO         Read, graphify

3. PLANEJAR         context7, task-management, ContextScout

4. EXECUTAR         CoderAgent, code-reviewer

5. VALIDAR          code-reviewer, TestEngineer, BuildAgent

6. REGISTRAR        graphify --update, Read/Write

7. DEPLOY           CLI, dotenv, deploy (VPS/cloud)
                    Next.js, Prisma, NextAuth, Stripe/MP, Vercel (SaaS)
```

---

## Checkpoints Obrigatorios

### Checkpoint de Inicio
Antes de comecar QUALQUER tarefa:

- [ ] Li este arquivo (FLUXO.md)?
- [ ] Li contexto.md?
- [ ] Li SESSAO.txt?
- [ ] Entendi a demanda?
- [ ] Tenho todas as informacoes?

> **Se NAO em qualquer item -> PARE e resolva antes de seguir.**

---

### Checkpoint de Execucao
Antes e durante a execucao:

- [ ] Busquei docs das bibliotecas (context7)?
- [ ] Criei tarefas (task-management)?
- [ ] Defini ordem de execucao?
- [ ] Identifiquei riscos?
- [ ] Estou seguindo o plano?
- [ ] Testei cada parte?

> **Se NAO em qualquer item -> PARE e complete antes de executar.**

---

### Checkpoint de Finalizacao
Ao concluir a demanda:

- [ ] Testei o fluxo completo?
- [ ] Revi o codigo (code-reviewer)?
- [ ] Atualizei contexto.md?
- [ ] Atualizei SESSAO.txt?
- [ ] Atualizei documentacao?
- [ ] Graphify atualizado?

> **Se NAO em qualquer item -> PARE e complete antes de finalizar.**

---

## Tabela de Decisoes

| Situacao | Skill | Fase |
|----------|-------|------|
| Preciso de docs atualizadas | context7 | 3. Planejar |
| Preciso criar tarefas | task-management | 3. Planejar |
| Preciso revisar codigo | code-reviewer | 4/5. Executar/Validar |
| Preciso analisar arquitetura | graphify | 2. Contexto ou 6. Registrar |
| Preciso testar | TestEngineer | 5. Validar |
| Preciso de UI/frontend | frontend-design, ui-ux-pro-max, shadcn/ui | 4. Executar (SaaS) |
| Preciso de autenticação | NextAuth.js | 4. Executar (SaaS) |
| Preciso de ORM/banco | Prisma | 4. Executar (SaaS) |
| Preciso de pagamento | Stripe / Mercado Pago | 4. Executar (SaaS) |
| Preciso descobrir mais skills | find-skills | Qualquer fase |

---

## Exemplos Praticos

### Exemplo: "Implementar bot Telegram"

```
FASE 1 - ENTENDER
  Criar bot que publica ofertas no Telegram

FASE 2 - CONTEXTO
  Ler: contexto.md, TELEGRAM.md, FLUXO.md

FASE 3 - PLANEJAR
  context7: buscar docs do Telegraf
  task-management: criar tarefas
  Ordem: bot.ts -> publisher.ts -> templates.ts -> buttons.ts

FASE 4 - EXECUTAR
  Codar bot.ts -> code-reviewer revisar
  Codar publisher.ts -> code-reviewer revisar
  Codar templates.ts -> code-reviewer revisar

FASE 5 - VALIDAR
  Testar publicacao manual
  code-reviewer: revisao final
  Testar edge cases

FASE 6 - REGISTRAR
  Atualizar contexto.md
  Atualizar SESSAO.txt
  graphify --update
```

---

### Exemplo: "Corrigir bug no publisher"

```
FASE 1 - ENTENDER
  Mensagem nao esta sendo formatada corretamente

FASE 2 - CONTEXTO
  Ler: contexto.md, TELEGRAM.md
  Verificar qual a mensagem de erro

FASE 3 - PLANEJAR
  Identificar causa raiz
  Definir correcao
  Estimar impacto

FASE 4 - EXECUTAR
  Corrigir codigo
  Testar correcao

FASE 5 - VALIDAR
  Testar com diferentes mensagens
  Verificar se nao quebrou nada

FASE 6 - REGISTRAR
  Documentar bug e correcao
  Atualizar contexto.md se necessario
```

---

### Exemplo: "Adicionar nova plataforma de afiliados"

```
FASE 1 - ENTENDER
  Adicionar suporte a Magazine Luiza

FASE 2 - CONTEXTO
  Ler: AFFILIATES.md, contexto.md
  Verificar implementacao das outras plataformas

FASE 3 - PLANEJAR
  context7: buscar docs Magalu Afiliados
  task-management: criar tarefas
  Ordem: config -> generator -> integration -> test

FASE 4 - EXECUTAR
  Implementar por partes
  Testar cada parte

FASE 5 - VALIDAR
  Testar geracao de links
  Testar fluxo completo

FASE 6 - REGISTRAR
  Atualizar AFFILIATES.md
  Atualizar contexto.md
  graphify --update
```

---

## Regras Inegociaveis

1. **SEMPRE leia contexto.md antes de comecar**
2. **SEMPRE use context7 para docs externas**
3. **SEMPRE teste antes de finalizar**
4. **SEMPRE registre o que foi feito**
5. **NUNCA pule fases**
6. **NUNCA execute sem aprovacao previa**

---

## Fluxo GitHub (Branch + PR)

**Toda demanda nova — seja feature, fix, melhoria ou infra — DEVE seguir este fluxo.**

Nao existe "push direto na master". Nao existe "commit sem PR". Nao existe "excecao".

```
1. git checkout master && git pull
2. git checkout -b feature/descricao-da-demanda
3. Fazer as mudancas necessarias
4. git add . && git commit -m "tipo: descricao"
5. git push origin feature/descricao-da-demanda
6. Abrir Pull Request no GitHub para master
   └── CI roda automaticamente (typecheck + testes + build)
7. Aguardar CI passar + 1 aprovacao de revisao
8. Clicar "Merge pull request"
   └── Branch deletada automaticamente
```

### Exemplo pratico

```bash
# Assumindo que a demanda é "Adicionar suporte ao AliExpress"
git checkout master && git pull
git checkout -b feature/aliexpress-integration
# ... implementa o codigo ...
git add src/affiliates/aliexpress.ts src/affiliates/index.ts
git commit -m "feat: adicionar geracao de links afiliados AliExpress"
git push origin feature/aliexpress-integration
# → Abrir PR no GitHub
# → CI valida
# → Revisar
# → Merge
# → Branch deletada
```

### Convencao de nomes de branch

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| Nova funcionalidade | `feature/` | `feature/aliexpress-integration` |
| Correcao de bug | `fix/` | `fix/whatsapp-parse-error` |
| Melhoria | `enhancement/` | `enhancement/command-ofertas-db` |
| Documentacao | `docs/` | `docs/vps-deploy-guide` |
| Refatoracao | `refactor/` | `refactor/database-module` |
| Infra/CI | `infra/` | `infra/docker-setup` |

### Branch Protection (ativo no GitHub)

A branch `master` possui protecao que IMPEDE:
- ❌ Push direto na master
- ❌ Merge sem CI passar
- ❌ Merge sem 1 aprovacao de revisao
- ❌ Merge com branch desatualizada (precisa estar sync com master)

Isso vale para TODOS, inclusive admins.

---

Para cada nova demanda, copie e preencha:

```
## Demanda: [descricao]

### Fase 1: ENTENDER
- [ ] Entendi o que foi pedido
- [ ] Tenho todas as informacoes
- [ ] Escopo definido

### Fase 2: CONTEXTO
- [ ] Li contexto.md
- [ ] Li documentacao relevante
- [ ] Verifiquei graphify

### Fase 3: PLANEJAR
- [ ] Busquei docs externas (context7)
- [ ] Criei tarefas (task-management)
- [ ] Defini ordem de execucao

### Fase 4: EXECUTAR
- [ ] Implementei parte 1
- [ ] code-reviewer revisou
- [ ] Implementei parte 2
- [ ] code-reviewer revisou

### Fase 5: VALIDAR
- [ ] Testei fluxo completo
- [ ] code-reviewer revisao final
- [ ] Edge cases testados
- [ ] Documentacao conferida

### Fase 6: REGISTRAR
- [ ] contexto.md atualizado
- [ ] SESSAO.txt atualizado
- [ ] Documentacao atualizada
- [ ] graphify --update (se necessario)
```

---

## Arquivos Relacionados

```
.github/workflows/ci.yml                -> CI automation
.github/workflows/pr.yml                -> PR review + cleanup
.github/ISSUE_TEMPLATE/demanda.md       -> Template de issue
.github/PULL_REQUEST_TEMPLATE/pull_request.md -> Template de PR
contexto.md                             -> Status e decisoes do projeto
SESSAO.txt                              -> Checklist de sessoes
FLUXO.md                                -> Este arquivo - fluxo de trabalho
```

---

*Última atualização: 07/07/2026 — Incluído Caminho B (SaaS Self-Service) na Fase 7*
