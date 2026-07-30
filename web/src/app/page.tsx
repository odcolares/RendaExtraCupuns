"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PLANS } from "@/lib/stripe";
import {
  Sparkles,
  Check,
  ArrowRight,
  Smartphone,
  Settings2,
  Zap,
} from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    title: "Conecte",
    description:
      "Adicione o bot aos grupos de WhatsApp que monitoram ofertas. Escaneie o QR Code uma única vez.",
  },
  {
    icon: Settings2,
    title: "Configure",
    description:
      "Escolha suas plataformas de afiliados (Amazon, Shopee, ML, AliExpress) e configure o canal do Telegram.",
  },
  {
    icon: Zap,
    title: "Automatize",
    description:
      "O bot extrai ofertas, gera links com seu ID de afiliado e publica no canal automaticamente.",
  },
];

const faqs = [
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
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        [data-animate] {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        [data-animate].animate-fade-in-up {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <div className="flex flex-col min-h-screen">
        {/* ── Header ── */}
        <header
          className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled
              ? "border-gradient"
              : "border-b border-transparent"
          }`}
        >
          <div
            className={`transition-all duration-300 ${
              scrolled ? "bg-background" : "bg-background/95 backdrop-blur-lg"
            }`}
          >
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-xl cursor-pointer"
              >
                <span className="text-gradient">RendaExtra</span>
                <span className="text-muted-foreground">Cupuns</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link
                  href="#como-funciona"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  Como funciona
                </Link>
                <Link
                  href="#planos"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  Planos
                </Link>
                <Link
                  href="#faq"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  FAQ
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="cursor-pointer">
                    Entrar
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="cursor-pointer">Começar Grátis</Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-brand-gradient opacity-5"
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
          <div className="relative container mx-auto px-4 py-24 md:py-36">
            <div className="mx-auto max-w-3xl text-center">
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-1.5 text-sm gap-1.5 rounded-full bg-gradient-to-r from-brand-pink/15 to-brand-cyan/15 text-brand-pink border-brand-pink/20 cursor-pointer"
              >
                <Sparkles className="size-3.5 text-brand-cyan" />
                Agora com painel web
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-tight">
                Transforme ofertas do WhatsApp em{" "}
                <span className="text-gradient">renda extra</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                Monitore grupos do WhatsApp, gere links de afiliado (Amazon,
                Shopee, Mercado Livre, AliExpress) e publique no Telegram — tudo
                automático. Gerencie tudo pelo seu painel web.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4 flex-col sm:flex-row">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="text-base cursor-pointer group"
                  >
                    Começar Grátis
                    <ArrowRight className="size-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link href="#como-funciona">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base cursor-pointer"
                  >
                    Saiba mais
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Como Funciona ── */}
        <section
          id="como-funciona"
          className="relative overflow-hidden border-t bg-muted/50 py-20 md:py-28"
        >
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand-pink/10 blur-3xl pointer-events-none"
          />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-12" data-animate>
              <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Três passos simples para começar a gerar renda com links de
                afiliado.
              </p>
            </div>
            <div
              className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
              data-animate
            >
              {steps.map((item, i) => (
                <Card
                  key={item.title}
                  className="text-center border-0 bg-card shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-300 cursor-pointer"
                >
                  <CardHeader>
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm">
                      <item.icon className="size-6" />
                    </div>
                    <CardTitle className="mt-4 flex items-center justify-center gap-2">
                      <span className="inline-flex items-center justify-center size-7 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        0{i + 1}
                      </span>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Planos ── */}
        <section id="planos" className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12" data-animate>
              <h2 className="text-3xl font-bold mb-4">Planos</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano ideal para o seu negócio. Cancele quando quiser.
              </p>
            </div>
            <div
              className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
              data-animate
            >
              {(
                ["free", "starter", "professional"] as Array<keyof typeof PLANS>
              ).map((key) => {
                const plan = PLANS[key];
                const isPopular = key === "starter";
                return (
                  <Card
                    key={key}
                    className={`relative flex flex-col transition-all duration-200 hover:-translate-y-[2px] cursor-pointer ${
                      isPopular
                        ? "border-gradient shadow-[0_0_24px_oklch(0.65_0.25_350/0.15)]"
                        : "shadow-sm hover:shadow-md"
                    }`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-brand-pink to-[oklch(0.65_0.15_260)] text-white border-0 cursor-pointer">
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
                          <span className="text-muted-foreground ml-1">
                            /mês
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="flex flex-col gap-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="size-4 text-brand-pink mt-0.5 shrink-0" />
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Link
                        href={
                          key === "free" ? "/signup" : `/signup?plan=${key}`
                        }
                        className="w-full"
                      >
                        <Button
                          variant={isPopular ? "default" : "outline"}
                          className="w-full cursor-pointer"
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

        {/* ── FAQ ── */}
        <section id="faq" className="border-t bg-muted/50 py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12" data-animate>
              <h2 className="text-3xl font-bold mb-4">
                Perguntas Frequentes
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Tire suas dúvidas sobre o RendaExtraCupuns.
              </p>
            </div>
            <div data-animate>
              <Accordion
                defaultValue={["item-0"]}
                className="w-full"
              >
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={faq.q}
                    value={`item-${i}`}
                    className="border-border/50"
                  >
                    <AccordionTrigger className="text-base font-medium py-4 hover:no-underline cursor-pointer">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pr-6">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* ── CTA Final ── */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-dot-pattern opacity-30"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-brand-gradient"
          />
          <div className="relative container mx-auto px-4 text-center">
            <h2
              className="text-3xl font-bold text-white mb-4"
              data-animate
            >
              Pronto para começar?
            </h2>
            <p
              className="text-white/80 mb-8 max-w-lg mx-auto"
              data-animate
            >
              Crie sua conta grátis em menos de 2 minutos. Sem compromisso.
            </p>
            <div data-animate>
              <Link href="/signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white text-white hover:bg-white hover:text-brand-pink transition-all duration-300 cursor-pointer text-base"
                >
                  Começar Grátis
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border/50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-10 md:gap-8 mb-10">
              <div>
                <Link
                  href="/"
                  className="font-bold text-lg cursor-pointer"
                >
                  <span className="text-gradient">RendaExtra</span>
                  <span className="text-muted-foreground"> Cupuns</span>
                </Link>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
                  Monitore, automatize e ganhe com links de afiliado.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-4">Produto</h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li>
                    <Link
                      href="#como-funciona"
                      className="hover:text-foreground transition-colors duration-200 cursor-pointer"
                    >
                      Como funciona
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#planos"
                      className="hover:text-foreground transition-colors duration-200 cursor-pointer"
                    >
                      Planos
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#faq"
                      className="hover:text-foreground transition-colors duration-200 cursor-pointer"
                    >
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-4">Suporte</h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li>
                    <span className="hover:text-foreground transition-colors duration-200 cursor-pointer">
                      Central de ajuda
                    </span>
                  </li>
                  <li>
                    <span className="hover:text-foreground transition-colors duration-200 cursor-pointer">
                      Documentação
                    </span>
                  </li>
                  <li>
                    <span className="hover:text-foreground transition-colors duration-200 cursor-pointer">
                      Status
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-4">Legal</h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li>
                    <span className="hover:text-foreground transition-colors duration-200 cursor-pointer">
                      Privacidade
                    </span>
                  </li>
                  <li>
                    <span className="hover:text-foreground transition-colors duration-200 cursor-pointer">
                      Termos de uso
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} RendaExtraCupuns. Links de
              afiliado &mdash; podemos ganhar comissão.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
