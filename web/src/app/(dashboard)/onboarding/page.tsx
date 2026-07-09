"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Smartphone, MessageCircle, Store, CreditCard, ArrowRight, Play, HelpCircle } from "lucide-react";
import Link from "next/link";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "in_progress" | "completed";
}

export default function OnboardingPage() {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const [currentStep, setCurrentStep] = useState("whatsapp");
  const [connectionStatus, setConnectionStatus] = useState([
    { platform: "WhatsApp", connected: true, configured: true, lastUpdated: new Date() },
    { platform: "Telegram", connected: true, configured: true, lastUpdated: new Date() },
    { platform: "Amazon", connected: false, configured: true, lastUpdated: undefined },
    { platform: "Shopee", connected: false, configured: true, lastUpdated: undefined },
    { platform: "Mercado Livre", connected: false, configured: true, lastUpdated: undefined },
    { platform: "AliExpress", connected: false, configured: true, lastUpdated: undefined },
  ]);

  const steps: Step[] = [
    {
      id: "whatsapp",
      title: "Conectar WhatsApp",
      description: "Conecte seu número WhatsApp secundário para monitorar ofertas",
      icon: <Smartphone className="h-6 w-6" />,
      status: "completed",
    },
    {
      id: "telegram",
      title: "Configurar Telegram",
      description: "Configure seu bot e canal do Telegram para publicar ofertas",
      icon: <MessageCircle className="h-6 w-6" />,
      status: "completed",
    },
    {
      id: "affiliates",
      title: "Configurar Afiliados",
      description: "Adicione seus IDs de afiliado para Amazon, Mercado Livre, Shopee e AliExpress",
      icon: <Store className="h-6 w-6" />,
      status: "in_progress",
    },
    {
      id: "payments",
      title: "Configurar Pagamentos",
      description: "Configure sua conta Stripe para receber comissões automaticamente",
      icon: <CreditCard className="h-6 w-6" />,
      status: "pending",
    },
    {
      id: "ready",
      title: "Pronto para Começar",
      description: "Sua máquina está pronta para gerar renda automaticamente",
      icon: <Play className="h-6 w-6" />,
      status: "pending",
    },
  ];

  const currentStepData = steps.find((step) => step.id === currentStep) || steps[0];

  const renderStepContent = () => {
    switch (currentStep) {
      case "whatsapp":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Configuração do WhatsApp</h4>
              <p className="text-sm text-blue-800">
                • Número WhatsApp secundário (não pessoal)
              </p>
              <p className="text-sm text-blue-800">
                • Conecte via QR Code (salvo em sessão)
              </p>
              <p className="text-sm text-blue-800">
                • Monitore grupos e newsletters existentes
              </p>
              <p className="text-sm text-blue-800">
                • Risco de ban = evite usar número pessoal
              </p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Grupos/Novidades Conectados</h4>
              <div className="space-y-2">
                {[
                  { name: "Grupo de Ofertas #1", members: 45, lastUpdate: "2h atrás" },
                  { name: "Newsletter Diária", members: 120, lastUpdate: "1h atrás" },
                  { name: "Cupons Separação", members: 28, lastUpdate: "3h atrás" },
                ].map((group, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.members} membros • Atualizado {group.lastUpdate}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Ativo
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "telegram":
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Bot Telegram Conectado</h4>
              <p className="text-sm text-green-800">
                • Token do bot: @RendaExtraCuponsBot (conectado)
              </p>
              <p className="text-sm text-green-800">
                • Canal: @Ofertas_cupons_agora (ID: -1004303411968)
              </p>
              <p className="text-sm text-green-800">
                • Permissões: publicação apenas
              </p>
              <p className="text-sm text-green-800">
                • Rate limit: 30 mensagens/hora por canal
              </p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Estatísticas do Canal</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                  <p className="text-lg font-bold">1.2k</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mensagens/Publicações</p>
                  <p className="text-lg font-bold">45</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Média de engajamento</p>
                  <p className="text-lg font-bold">8.2%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conversões hoje</p>
                  <p className="text-lg font-bold">3</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "affiliates":
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">Afiliados Configurados</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Amazon", id: "odcolares2026-20", status: "configured" },
                  { name: "Mercado Livre", id: "88981950", status: "configured" },
                  { name: "Shopee", id: "18387911117", status: "configured" },
                  { name: "AliExpress", id: "RendaExtraCupuns", status: "configured" },
                ].map((affiliate, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
                    <CheckCircle className="h-4 w-4 text-green-600" />
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
              <p className="text-sm text-orange-800">
                • Stripe conectado (modo teste)
              </p>
              <p className="text-sm text-orange-800">
                • Preço do plano Starter: R$ 29/mês
              </p>
              <p className="text-sm text-orange-800">
                • Preço do plano Professional: R$ 79/mês
              </p>
              <p className="text-sm text-orange-800">
                • Webhook de assinatura configurado
              </p>
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
      <div>
        <h1 className="text-3xl font-bold">Painel de Configuração - Onboarding</h1>
        <p className="text-muted-foreground mt-1">
          Configure sua máquina SaaS white-label passo a passo
        </p>
      </div>

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
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step.status === "completed"
                    ? "bg-green-50 border-green-500 text-green-600"
                    : step.status === "in_progress"
                      ? "bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-gray-50 border-gray-300 text-gray-400"
                  }`}
                >
                  {step.icon}
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
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = steps.findIndex((s) => s.id === currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1].id);
                }
              }}
              disabled={currentStep === "whatsapp"}
            >
              Anterior
            </Button>
            <Button
              onClick={() => {
                const currentIndex = steps.findIndex((s) => s.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id);
                }
              }}
              disabled={currentStep === "ready"}
            >
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
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
            <Link href="/dashboard/afiliados">
              <Button variant="ghost" className="w-full justify-start">
                <Store className="mr-2 h-4 w-4" />
                Configurar Afiliados
              </Button>
            </Link>
            <Link href="/dashboard/ofertas">
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