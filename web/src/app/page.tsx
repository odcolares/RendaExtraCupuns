import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANS } from "@/lib/stripe";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">RendaExtra</span>
            <span className="text-muted-foreground">Cupuns</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="#como-funciona"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Como funciona
            </Link>
            <Link
              href="#planos"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Planos
            </Link>
            <Link
              href="#faq"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/signup">
              <Button>Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              🚀 Agora com painel web
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Transforme ofertas do WhatsApp em{" "}
              <span className="text-primary">renda extra</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Monitore grupos do WhatsApp, gere links de afiliado (Amazon,
              Shopee, Mercado Livre, AliExpress) e publique no Telegram — tudo
              automático. Gerencie tudo pelo seu painel web.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="text-base">
                  Começar Grátis
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button variant="outline" size="lg" className="text-base">
                  Saiba mais
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section
        id="como-funciona"
        className="border-t bg-muted/50 py-20 md:py-28"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como funciona
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Conecte",
                description:
                  "Adicione o bot aos grupos de WhatsApp que monitoram ofertas. Escaneie o QR Code uma vez.",
              },
              {
                step: "2",
                title: "Configure",
                description:
                  "Escolha suas plataformas de afiliados (Amazon, Shopee, ML, AliExpress) e configure o canal do Telegram.",
              },
              {
                step: "3",
                title: "Automatize",
                description:
                  "O bot extrai ofertas, gera links com seu ID de afiliado e publica no canal automaticamente.",
              },
            ].map((item) => (
              <Card key={item.step} className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                    {item.step}
                  </div>
                  <CardTitle className="mt-4">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Planos</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Cancele quando quiser.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(
              [
                "free",
                "starter",
                "professional",
              ] as Array<keyof typeof PLANS>
            ).map((key) => {
              const plan = PLANS[key];
              const isPopular = key === "starter";
              return (
                <Card
                  key={key}
                  className={`relative flex flex-col ${
                    isPopular
                      ? "border-primary shadow-lg scale-105"
                      : ""
                  }`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Mais popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.price === 0 ? "Grátis" : `R$ ${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground ml-1">/mês</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✓</span>
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link
                      href={key === "free" ? "/signup" : `/signup?plan=${key}`}
                      className="w-full"
                    >
                      <Button
                        variant={isPopular ? "default" : "outline"}
                        className="w-full"
                      >
                        {key === "free" ? "Começar Grátis" : "Assinar"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="border-t bg-muted/50 py-20 md:py-28"
      >
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Preciso ter um servidor para usar?",
                a: "Não! O painel web é hospedado na Vercel (grátis). O bot de monitoramento roda no seu computador ou numa VPS simples quando você precisar de mais clientes.",
              },
              {
                q: "Preciso de um número de WhatsApp dedicado?",
                a: "Sim, cada cliente precisa de um número de WhatsApp para monitorar grupos. Você pode usar um número secundário ou adquirir um número virtual.",
              },
              {
                q: "Quanto posso ganhar como afiliado?",
                a: "Depende do volume de ofertas e das plataformas. As comissões variam de 3% a 12% por venda. Com centenas de ofertas por dia, o potencial é significativo.",
              },
              {
                q: "Posso cancelar a assinatura?",
                a: "Sim, cancele quando quiser sem multa. Seus dados ficam armazenados por 30 dias caso mude de ideia.",
              },
            ].map((faq) => (
              <Card key={faq.q}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} RendaExtraCupuns. Links de afiliado —
            podemos ganhar comissão.
          </p>
        </div>
      </footer>
    </div>
  );
}
