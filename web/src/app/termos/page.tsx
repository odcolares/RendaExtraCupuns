import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Uso — RendaExtraCupuns",
  description:
    "Termos de uso do serviço RendaExtraCupuns: condições de uso, contas, planos, pagamentos e responsabilidades.",
};

const sections = [
  {
    title: "1. Aceitação dos termos",
    body: [
      "Ao criar uma conta e utilizar o RendaExtraCupuns, você declara ter lido, compreendido e aceitado integralmente estes Termos de Uso e a nossa Política de Privacidade. Se você não concordar com qualquer parte destes termos, não utilize o serviço.",
      "O aceite é registrado eletronicamente no momento do cadastro, com data e hora, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
    ],
  },
  {
    title: "2. Descrição do serviço",
    body: [
      "O RendaExtraCupuns é uma plataforma de automação de marketing de afiliados: o usuário conecta grupos de WhatsApp, configura suas plataformas de afiliados (Amazon, Shopee, Mercado Livre e AliExpress) e o sistema extrai ofertas, gera links com o identificador de afiliado do usuário e publica em um canal do Telegram.",
      "Em conformidade com a Lei nº 14.448/2022, todas as publicações geradas identificam que se trata de links de afiliado, dos quais o usuário pode receber comissão.",
    ],
  },
  {
    title: "3. Conta e cadastro",
    body: [
      "Você é responsável pela veracidade das informações fornecidas no cadastro (nome e e-mail) e pela guarda da sua senha. Não compartilhe suas credenciais com terceiros.",
      "O cadastro exige o aceite expresso destes Termos e da Política de Privacidade. Sem esse aceite, a conta não pode ser criada.",
      "Você deve ter capacidade legal para contratar. O serviço não é destinado a menores de 18 anos.",
    ],
  },
  {
    title: "4. Planos, pagamentos e cancelamento",
    body: [
      "O serviço oferece plano gratuito e planos pagos. Os pagamentos são processados exclusivamente pela Stripe, e os dados de pagamento são tratados conforme a Política de Privacidade da Stripe — o RendaExtraCupuns não armazena dados de cartão.",
      "Você pode cancelar a assinatura quando quiser, sem multa. Após o cancelamento, seus dados permanecem armazenados por 30 dias caso você mude de ideia; após esse período, são excluídos ou anonimizados.",
    ],
  },
  {
    title: "5. Uso aceitável",
    body: [
      "Você se compromete a utilizar o serviço em conformidade com a legislação brasileira e com os termos de uso das plataformas de afiliados e de mensageria (WhatsApp e Telegram).",
      "É proibido: usar o serviço para atividades ilícitas, spam, fraude, violação de direitos de terceiros, ou qualquer uso que possa prejudicar a operação da plataforma.",
    ],
  },
  {
    title: "6. Propriedade intelectual",
    body: [
      "O software, o design, os textos e demais elementos do RendaExtraCupuns são de propriedade do operador da plataforma. Você não adquire qualquer direito de propriedade sobre o serviço, apenas uma licença de uso limitada, revogável conforme estes Termos.",
    ],
  },
  {
    title: "7. Limitação de responsabilidade",
    body: [
      "O RendaExtraCupuns atua como ferramenta de automação e não garante resultados financeiros específicos. As comissões dependem de fatores externos, como políticas das plataformas de afiliados e comportamento do mercado.",
      "O serviço é fornecido \"no estado em que se encontra\". Na máxima extensão permitida por lei, o operador não se responsabiliza por lucros cessantes ou danos indiretos decorrentes do uso do serviço.",
    ],
  },
  {
    title: "8. Rescisão",
    body: [
      "Você pode encerrar sua conta a qualquer momento pelo painel ou entrando em contato conosco. O operador pode suspender ou encerrar contas que violem estes Termos, mediante aviso, sem prejuízo das demais medidas legais cabíveis.",
    ],
  },
  {
    title: "9. Alterações destes Termos",
    body: [
      "Estes Termos podem ser atualizados para refletir mudanças no serviço ou na legislação. A versão vigente estará sempre disponível nesta página, com a data da última atualização. O uso continuado do serviço após a publicação de alterações implica aceitação das novas condições.",
    ],
  },
  {
    title: "10. Contato",
    body: [
      "Dúvidas sobre estes Termos podem ser enviadas pelo canal oficial @RendaExtraCuponsBot no Telegram ou pela Central de ajuda dentro do painel.",
    ],
  },
];

export default function TermosPage() {
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
          Termos de Uso
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
          <Link href="/privacidade" className="hover:text-foreground">
            Política de Privacidade
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