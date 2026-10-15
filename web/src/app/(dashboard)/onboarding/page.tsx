import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Smartphone, MessageCircle, Store, CreditCard, Play, HelpCircle, Smartphone as SmartphoneIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ChannelConnect } from "@/components/channel-connect";
import { OnboardingStepNav } from "@/components/onboarding-step-nav";
import { getOnboardingStatusAction, getWhatsAppGroupsAction, getAffiliateDetailsAction, getStripeDetailsAction } from "@/actions/onboarding";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "pending" | "in_progress" | "completed";
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="h-6 w-6" />,
  MessageCircle: <MessageCircle className="h-6 w-6" />,
  Store: <Store className="h-6 w-6" />,
  CreditCard: <CreditCard className="h-6 w-6" />,
  Play: <Play className="h-6 w-6" />,
  SmartphoneIcon: <SmartphoneIcon className="h-6 w-6" />,
};

async function OnboardingContent() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [statusData, whatsappGroups, affiliateDetails, stripeDetails] = await Promise.all([
    getOnboardingStatusAction(),
    getWhatsAppGroupsAction(),
    getAffiliateDetailsAction(),
    getStripeDetailsAction(),
  ]);

  const steps: Step[] = statusData.steps;
  const connectionStatus = statusData.whatsappConnections;
  const telegramConfig = statusData.telegramConfig;
  const affiliateConfigs = affiliateDetails;

  const currentStep = steps.find(s => s.status === "in_progress") || steps[0];

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "whatsapp":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Configuração do WhatsApp</h4>
              <p className="text-sm text-blue-800">• Número WhatsApp secundário (não pessoal)</p>
              <p className="text-sm text-blue-800">• Conecte via QR Code (salvo em sessão)</p>
              <p className="text-sm text-blue-800">• Monitore grupos e newsletters existentes</p>
              <p className="text-sm text-blue-800">• Risco de ban = evite usar número pessoal</p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Grupos/Novidades Conectados</h4>
              <div className="space-y-2">
                {whatsappGroups.length > 0 ? (
                  whatsappGroups.map((group, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.members} ofertas encontradas • Atualizado {group.lastUpdate}
                          </p>
                        </div>
                      </div>
                      <Badge variant={connectionStatus[0]?.connected ? "default" : "secondary"} className="text-xs">
                        {connectionStatus[0]?.connected ? "Conectado" : "Desconectado"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum grupo conectado ainda. Provisione o bot para começar.</p>
                )}
              </div>
            </div>
          </div>
        );
      case "telegram":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <h4 className="mb-2 font-medium">Conecte seu canal</h4>
              <ChannelConnect />
            </div>
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Status da Conexão</h4>
              <div className="flex items-center gap-3 p-3 bg-white rounded border">
                {telegramConfig.configured ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Telegram configurado</p>
                      <p className="text-xs text-muted-foreground">
                        {telegramConfig.tested ? "Testado com sucesso" : "Clique em testar para verificar"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <p className="text-muted-foreground">Telegram não configurado</p>
                  </>
                )}
              </div>
            </div>
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Regras de publicação</h4>
              <p className="text-sm text-muted-foreground">• Ofertas criadas no painel são publicadas automaticamente no canal</p>
              <p className="text-sm text-muted-foreground">• Rate limit: 30 mensagens/hora por canal</p>
              <p className="text-sm text-muted-foreground">• Mensagem de teste é enviada ao conectar o canal</p>
            </div>
          </div>
        );
      case "affiliates":
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Afiliados Configurados</h4>
              <div className="grid grid-cols-2 gap-3">
                {affiliateConfigs.map((affiliate, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                    <CheckCircle className={affiliate.status === "configured" ? "h-4 w-4 text-green-600" : "h-4 w-4 text-muted-foreground"} />
                    <div>
                      <p className="font-medium text-sm">{affiliate.name}</p>
                      <p className="text-xs text-muted-foreground">{affiliate.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Ações Pendentes</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Revisar URLs de produto Amazon para incluir tag de afiliado</li>
                <li>• Otimizar busca de produtos Mercado Livre via API</li>
                <li>• Validar IDs de rastreamento Shopee/AliExpress</li>
              </ul>
            </div>
          </div>
        );
      case "payments":
        return (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">Stripe Configurado</h4>
              <p className="text-sm text-orange-800">• Plano atual: {stripeDetails.plan === "free" ? "Free" : stripeDetails.plan}</p>
              <p className="text-sm text-orange-800">• Modo: {stripeDetails.testMode ? "Teste" : "Produção"}</p>
              <p className="text-sm text-orange-800">• Status: {stripeDetails.connected ? "Conectado" : "Não conectado"}</p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Melhores Práticas de Pagamento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Modo de teste — sem cobrança até produção</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Dados de cartão de teste (4242 4242 4242 4242)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Reinicializar Assinaturas — renovar ou cancelar facilmente</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "ready":
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-medium text-green-900 mb-3">✨ Máquina SaaS Completa</h4>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Pronto para monitorar suas ofertas WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Transformar ofertas em links de afiliado automaticamente</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Publicar no seu canal do Telegram</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Enviar comissões via Stripe mensalmente</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Painel de controle SaaS para clientes</span>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Como Começar</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Conecte seu número WhatsApp secundário</li>
                <li>Configure IDs de afiliados para cada plataforma</li>
                <li>Revise suas configurações de afiliados (dashboard)</li>
                <li>Teste o pipeline completo com um teste</li>
                <li>Ative o modo produção e inicie</li>
              </ol>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Painel de Configuração"
        description="Configure sua máquina SaaS white-label passo a passo"
      />

      {/* Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Progresso do Onboarding
          </CardTitle>
          <CardDescription>
            5 de 5 etapas • ~15 min restante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step.status === "completed"
                      ? "bg-green-50 border-green-500 text-green-600"
                      : step.status === "in_progress"
                        ? "bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-gray-50 border-gray-300 text-gray-400"
                  }`}
                >
                  {ICON_MAP[step.icon] || <HelpCircle className="h-5 w-5" />}
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block w-16 h-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Conectar WhatsApp</span>
            <span>Telegram</span>
            <span className="hidden md:inline">Afiliados</span>
            <span className="hidden md:inline">Pagamentos</span>
            <span>Pronto</span>
          </div>
        </CardContent>
      </Card>

      {/* Navegação de etapas */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}

          <OnboardingStepNav steps={steps} currentStepId={currentStep.id} />
        </CardContent>
      </Card>

      {/* Menu lateral de atalhos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Atalhos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <CheckCircle className="mr-2 h-4 w-4" />
                Acessar Dashboard
              </Button>
            </Link>
            <Link href="/afiliados">
              <Button variant="ghost" className="w-full justify-start">
                <Store className="mr-2 h-4 w-4" />
                Configurar Afiliados
              </Button>
            </Link>
            <Link href="/ofertas">
              <Button variant="ghost" className="w-full justify-start">
                <MessageCircle className="mr-2 h-4 w-4" />
                Ver Histórico de Ofertas
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start">
              <HelpCircle className="mr-2 h-4 w-4" />
              Ajuda e Documentação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Carregando configurações...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}