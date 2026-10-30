# Manual do Cliente - RendaExtraCupuns
## 🚀 Primeiros Passos (Onboarding)
### 1. Conectar seu WhatsApp
### 2. Configurar Telegram
### 3. Configurar Afiliados
### 4. Primeiras Ofertas Publicadas
## 📅 Dia a Dia
### Gerenciando Fontes
### Nível Pro: Dicas e Melhores Práticas
### Monitorando Performance
### ❓ Perguntas Frequentes (FAQ)
### 🛠️ Suporte
### 📈 Transformando em Renda Extra
*Última atualização: 07/09/2026*  
*Manual gerado baseado na arquitetura do projeto RendaExtraCupuns*  
*Diretiva de comunicação: Portuguese do Brasil (pt-BR) - todas as mensagens, explicações e perguntas devem ser em pt-BR*

**Como Maximizar Seus Ganhos:**

1. **Quantidade de grupos:** Mais grupos = mais ofertas potenciais. Plano Enterprise permite monitorar ilimitados.
2. **Qualidade dos grupos:** Grupos de ofertas, promoções e descontos geram mais vendas do que grupos gerais.
3. **Divulgação:** Compartilhe o canal do Telegram com amigos que também tenham grupos de ofertas.
4. **Stagger posting:** Espalhe as publicações ao longo do dia em vez de todas de uma vez (respectar o rate limit).
5. **Teste todas plataformas:** Alguns produtos vendem melhor no Mercado Livre que no Amazon, ou vice-versa.
6. **Acompanhe códigos de cupom:** Ofertas com códigos de desconto costumam ter mais conversão.

**Exemplos de Ganhos (Estimativa):**

- **Plano Free (2 grupos):** De R$ 50 a R$ 200/mês em comissões (dependendo do volume de ofertas)
- **Plano Pro (5 grupos):** De R$ 200 a R$ 500/mês
- **Plano Enterprise (ilimitados):** De R$ 500 a +R$ 2000/mês (dependendo do trabalho e volume)

*As comissões variam por plataforma e tipo de produto. Amazon geralmente paga a cada venda confirmada, Mercado Livre e Shopee têm prazos de 30 dias, AliExpress varia.*

**Canais de Suporte:**
- **Painel:** Acesse "/suporte" no menu lateral para tickets
- **Email:** suporte@rendaextra.app (planos Pro e Enterprise)
- **Tempo de resposta:** Até 24 horas úteis

**Informações para Suporte:**
Quando contactar suporte, inclua:
1. Qual plano você está usando (Free/Pro/Enterprise)
2. O que está acontecendo (erro, dúvida, problema técnico)
3. Passos que já tentou
4. Capturas de tela se possível
5. ID do seu tenant (visualizável em "Configurações" → "Informações")

**Horário de Funcionamento:**
- Dias úteis: 09:00 às 18:00 (horário de Brasília)
- Final de semana e feriados: plantão emergencial

**P:** "Por que nenhuma oferta foi publicada hoje?"
**R:** Verifique se:
- O bot WhatsApp está conectado (status "connected" no dashboard)
- Pelo menos uma fonte está ativa
- Os grupos têm mensagens novas com URLs de produtos
- O rate limit do Telegram não foi atingido (30/hora)
- O Chrome executável está configurado corretamente (verifique o caminho em `src/whatsapp/client.ts` e `src/qr-only.ts` se houver erros de versão web)

**P:** "Como cambio o nome do meu bot?"
**R:** Vá em "Branding" no painel e altere o nome do bot. Isso muda o @username e o nome exibido nas mensagens do Telegram.

**P:** "Como cancelar minha assinatura?"
**R:** Em "Assinatura" no painel, você pode cancelar o plano. O acesso continua até o fim do período pago. Após cancelar, volta para o plano Free (se já tinha conta) ou mantém as limitações do plano cancelado.

**P:** "O que fazer if o WhatsApp desconectar?"
**R:** Em "Fontes" será exibido um QR code para reconectar. Basta escanear com seu WhatsApp. Todas as configurações são salvas, só precisa reconectar.

**P:** "Posso usar em múltiplos grupos WhatsApp?"
**R:** Sim! O número de grupos depende do seu plano:
- Free: 2 fontes (grupos/broadcasts)
- Pro: 5 fontes
- Enterprise: Ilimitado

**P:** "As ofertas têm código de cupom?"
**R:** O sistema detecta automaticamente códigos de desconto em mensagens de grupos. Se houver, aparecem na oferta publicada no Telegram. Se não houver, o campo fica vazio.

**P:** "O que acontece se eu ultrapassar o rate limit do Telegram?"
**R:** O sistema para de publicar temporariamente e retoma após a janela de 1 hora. Você verá avisos no dashboard. Para publicar mais, crie um segundo canal Telegram.

**P:** "Meus dados estão seguros? Outro cliente vê minhas ofertas?"
**R:** **Não.** Cada cliente tem seu próprio schema no banco de dados (`tenant_{uuid}`). Dados de um cliente nunca são misturados com outro. Você só vê suas próprias ofertas, fontes e configurações.

- **Muitas ofertas mas poucas cliques?** - Verifique se os links afiliados estão funcionando
- **Nenhuma oferta publicada?** - Verifique se os grupos estão corretos e o bot está conectado
- **Muitas ofertas da mesma plataforma?** - Considere focar nela ou configurar melhores códigos de cupom
- **Taxa de erro alta?** - Verifique se URLs estão válidas e sites não estão bloqueando hotlink

1. **Experimente todas as 4 plataformas afiliadas** - algumas funcionam melhor dependendo dos seus grupos
2. **Acompanhe as métricas semanalmente** - identifique quais grupos têm mais ofertas de qualidade
3. **Ajuste o rate limit do Telegram** se precisar publicar mais de 30 mensagens/hora (pode criar múltiplos canais)
4. **Use o branding white-label** para deixar o bot com a identidade da sua marca
5. **Faça upgrade de plano** se precisar de mais fontes ou canais Telegram
6. **Fique atento ao status do bot** - se estiver "blocked" ou "expired", reconecte via QR code

**Adicionando novas fontes:**
1. Em "Fontes" → "Adicionar nova fonte"
2. Selecione o tipo: Grupo, Broadcast ou Newsletter
3. Insira o ID do grupo (termina em @g.us, @broadcast ou @newsletter)
4. Confirme/verifique o grupo
5. A fonte ficará ativa para monitoramento

**Removendo fontes:**
1. Em "Fontas" → encontre a fonte na lista
2. Clique em "Excluir" ou "Desativar"
3. A fonte deixa de ser monitoramento

### Consultando Métricas

**Painel Principal (/dashboard):**
- **Ofertas hoje:** Quantas ofertas foram publicadas hoje
- **Ofertas totais:** Total desde que começou a monitorar
- **Fontes ativas:** Quantos grupos estão sendo monitorados
- **Fontes totais:** Limite do seu plano (Free=2, Pro=5, Enterprise=ilimitado)
- **Bot status:** Connected/Connecting/Expired/Blocked

**Gráficos de Desempenho:**
- Ofertas ao longo do tempo (dias/semanas/mês)
- Ofertas por plataforma (Amazon, ML, Shopee, AliExpress)
- Fontes mais ativas (quais grupos geram mais ofertas)

**O que fazer:**
- Depois de conectar WhatsApp e configurar Telegram/afiliados, o bot já está monitorando
- Entre em "Histórico de Ofertas" para ver ofertas publicadas
- O bot detecta ofertas em tempo real (a cada few segundos)
- Você verá: nome do produto, preço, plataforma, link afiliado, código cupom (se houver)
- As ofertas aparecem no canal do Telegram automaticamente

**Dica:** As primeiras ofertas podem demorar alguns minutos para aparecerem - o bot precisa monitorar novas mensagens nos grupos.

**O que fazer:**
- Vá em "Afiliados" no menu lateral
- Você verá 4 plataformas: Amazon, Mercado Livre, Shopee, AliExpress
- Para cada uma:
  - **Amazon:** Insira sua tag (ex: `odcolares2026-20`). Já vem configurada por padrão.
  - **Mercado Livre:** Insira seu ID (ex: `88981950`). Já vem configurado.
  - **Shopee:** Insira seu ID (ex: `18387911117`). Já vem configurado.
  - **AliExpress:** Insira sua tag de afiliado.
- Clique em "Salvar" para cada uma

**O que acontece:**
- O sistema valida os IDs/tags
- Links de afiliado serão gerados automaticamente nas ofertas
- Você pode ver o status "ativo" ou "inativo" para cada plataforma

**Importante:** Se não configurar alguma plataforma, ofertas desse tipo terão link direto (sem comissão), mas o pipeline não quebra.

**O que fazer:**
- No painel, vá em "Configurações" → "Telegram"
- Copie o token do @BotFather
- Cole o token no campo apropriado
- Copie o ID do seu canal de destino
- Cole o ID do canal
- Clique em "Testar Publicação"

**O que acontece:**
- O sistema testa conectar no bot Telegram
- Envia uma mensagem de teste para o seu canal
- Você verá se o status ficou "ativo" ou "inativo"

**Dica:** O rate limit é de 30 mensagens por hora - o contador reinicia a cada hora.

**O que fazer:**
- Acesse seu painel em `https://seusistema.vercel.app`
- Faça login com seu e-mail/senha
- Vá em "Fontes" ou "Onboarding" no menu lateral
- Escaneie o QR code com seu WhatsApp
- Aguarde conexão (30 segundos a 1 minuto)

**O que acontece:**
- Seu bot WhatsApp se conecta aos grupos que você participa
- O monitor começa a observar novas mensagens
- Você verá o status mudar de "connecting" para "connected"

**Dica:** Se desconectar, basta escanear o QR code novamente em "Fontes".

## Bem-vindo ao RendaExtraCupuns!

### 🎉 Parabéns por assinar o RendaExtraCupuns!

Você agora tem uma ferramenta que transforma ofertas dos seus grupos WhatsApp em renda extra via afiliados - todo automaticamente.
