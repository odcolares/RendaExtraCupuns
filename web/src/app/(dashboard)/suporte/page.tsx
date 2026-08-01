import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, MessageCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const faqItems = [
  {
    question: "Preciso ter um servidor para usar?",
    answer:
      "Não! O painel web é hospedado na Vercel (grátis). O bot de monitoramento roda no seu computador. Quando precisar de mais clientes, podemos migrar para uma VPS.",
  },
  {
    question: "Como configuro o WhatsApp?",
    answer:
      "Vá em Fontes do WhatsApp no menu lateral e adicione o ID do grupo ou newsletter. Use o bot do WhatsApp escaneando o QR Code disponível no painel.",
  },
  {
    question: "Quanto posso ganhar como afiliado?",
    answer:
      "As comissões variam de 3% a 12% por venda dependendo da plataforma (Amazon, Shopee, Mercado Livre, AliExpress). Com centenas de ofertas por dia, o potencial de ganhos é significativo.",
  },
  {
    question: "Como funciona o período de teste?",
    answer:
      "O plano Free permite testar o produto com até 10 ofertas por dia e 1 canal no Telegram. Sem compromisso, sem cartão de crédito.",
  },
  {
    question: "Posso cancelar a assinatura?",
    answer:
      "Sim, você pode cancelar quando quiser sem multa. Seus dados ficam armazenados por 30 dias caso mude de ideia. Para cancelar, vá em Assinatura no menu lateral.",
  },
  {
    question: "Como faço para obter suporte?",
    answer:
      "Envie um email para suporte@rendaextra.app. Respondemos em até 24 horas em dias úteis. Clientes Starter e Professional têm suporte prioritário.",
  },
];

export default async function SuportePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        eyebrow="Suporte"
        title="Suporte"
        description="Tire suas dúvidas e entre em contato"
      />

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-muted-foreground" />
            <CardTitle>Perguntas Frequentes</CardTitle>
          </div>
          <CardDescription>
            As respostas para as dúvidas mais comuns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Contato</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-muted-foreground" />
                <CardTitle>Email</CardTitle>
              </div>
              <CardDescription>
                Envie um email para suporte@rendaextra.app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:suporte@rendaextra.app"
                className="text-sm text-primary hover:underline"
              >
                suporte@rendaextra.app
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-muted-foreground" />
                <CardTitle>Telegram</CardTitle>
              </div>
              <CardDescription>
                Acompanhe as ofertas no nosso canal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href="https://t.me/Ofertas_cupons_agora"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                @Ofertas_cupons_agora
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
        <Card>
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
            <CardDescription>
              Status atual dos serviços da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span className="text-sm">Bot de monitoramento: Online</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span className="text-sm">Painel web: Online</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span className="text-sm">API Stripe: Configurada</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span className="text-sm">Banco de dados: Operacional</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
