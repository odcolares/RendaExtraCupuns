import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade — RendaExtraCupuns",
  description:
    "Política de privacidade do RendaExtraCupuns em conformidade com a LGPD (Lei nº 13.709/2018): dados coletados, finalidades, base legal, compartilhamento e direitos do titular.",
};

const sections = [
  {
    title: "1. Quem somos",
    body: [
      "O RendaExtraCupuns é uma plataforma de automação de marketing de afiliados que monitora ofertas em grupos de WhatsApp, gera links de afiliado e publica em canais do Telegram. Esta Política de Privacidade descreve como tratamos os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).",
    ],
  },
  {
    title: "2. Dados que coletamos",
    body: [
      "Dados fornecidos pelo usuário: nome, e-mail e senha (armazenada apenas em formato de hash criptográfico, nunca em texto puro).",
      "Dados de uso: registros de acesso (logs), endereço IP, tipo de navegador e dispositivo, páginas visitadas e interações com o painel, coletados para segurança e melhoria do serviço.",
      "Dados de pagamento: quando você assina um plano pago, o processamento é feito integralmente pela Stripe. Não armazenamos números de cartão ou dados completos de pagamento.",
    ],
  },
  {
    title: "3. Finalidades do tratamento",
    body: [
      "Utilizamos seus dados para: criar e gerenciar sua conta; autenticar seu acesso; processar assinaturas e cobranças; enviar comunicações transacionais (confirmação de cadastro, recuperação de senha); garantir a segurança da plataforma; cumprir obrigações legais e regulatórias.",
      "Não utilizamos seus dados para finalidades incompatíveis com as descritas nesta Política sem informá-lo previamente.",
    ],
  },
  {
    title: "4. Base legal (LGPD, art. 7º)",
    body: [
      "O tratamento dos seus dados tem como base legal: o consentimento livre, informado e inequívoco (art. 7º, I — registrado no momento do cadastro, com data e hora); e a execução do contrato de prestação de serviços (art. 7º, V).",
      "O consentimento pode ser revogado a qualquer momento, sem prejuízo da legalidade do tratamento realizado antes da revogação.",
    ],
  },
  {
    title: "5. Compartilhamento com terceiros",
    body: [
      "Para operar o serviço, compartilhamos dados com prestadores essenciais, sempre na medida do necessário e sob obrigações de confidencialidade:",
      "Stripe — processamento de pagamentos (dados de cobrança e assinatura);",
      "Resend — envio de e-mails transacionais (e-mail do usuário);",
      "Vercel — hospedagem da aplicação (dados de acesso e logs de infraestrutura);",
      "Turso — banco de dados serverless onde os dados da conta são armazenados.",
      "Não vendemos nem alugamos dados pessoais a terceiros.",
    ],
  },
  {
    title: "6. Cookies",
    body: [
      "Utilizamos cookies estritamente necessários para o funcionamento da plataforma (sessão de autenticação, preferências de tema) e cookies de análise para entender o uso do serviço. Você pode gerenciar os cookies nas configurações do seu navegador; a desativação de cookies necessários pode impedir o funcionamento de áreas do serviço.",
    ],
  },
  {
    title: "7. Retenção de dados",
    body: [
      "Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento da conta, os dados permanecem armazenados por 30 dias, conforme nossa política de cancelamento, caso você mude de ideia. Decorrido esse prazo, os dados são excluídos ou anonimizados, salvo quando a legislação exigir retenção por prazo superior.",
    ],
  },
  {
    title: "8. Direitos do titular (LGPD, art. 18)",
    body: [
      "Você pode, a qualquer momento, exercer os seguintes direitos: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos; portabilidade dos dados a outro fornecedor; eliminação dos dados tratados com base no consentimento; informação sobre compartilhamento; e revogação do consentimento.",
      "Para exercer seus direitos, entre em contato pelos canais indicados na seção 11. Responderemos no prazo legal.",
    ],
  },
  {
    title: "9. Segurança",
    body: [
      "Adotamos medidas técnicas e organizacionais para proteger seus dados: senhas armazenadas com hash criptográfico (bcrypt), comunicação criptografada (HTTPS), controle de acesso e monitoramento de atividades suspeitas. Nenhum sistema é 100% seguro; em caso de incidente que possa gerar risco aos titulares, notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD), quando aplicável.",
    ],
  },
  {
    title: "10. Alterações desta Política",
    body: [
      "Esta Política pode ser atualizada para refletir mudanças no serviço ou na legislação. A versão vigente estará sempre disponível nesta página, com a data da última atualização. Alterações relevantes serão comunicadas pelos canais de contato disponíveis.",
    ],
  },
  {
    title: "11. Contato e Encarregado de Dados (DPO)",
    body: [
      "Dúvidas sobre esta Política ou sobre o tratamento dos seus dados, e pedidos de exercício de direitos, podem ser enviados pelo canal oficial @RendaExtraCupunsBot no Telegram ou pela Central de ajuda dentro do painel. Atenderemos sua solicitação no prazo previsto na LGPD.",
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/50">
        <div className="container mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            RendaExtra<span className="text-brand-primary">Cupuns</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl flex-1 px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
          Documento legal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 17 de agosto de 2026
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-2 text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border/50 py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto max-w-3xl px-4">
          <Link href="/termos" className="hover:text-foreground">
            Termos de Uso
          </Link>
          <span className="mx-2">·</span>
          <Link href="/" className="hover:text-foreground">
            Início
          </Link>
        </div>
      </footer>
    </div>
  );
}