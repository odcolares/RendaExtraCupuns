"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSubscriptionAction } from "@/actions/assinatura";
import { getAffiliateConfigAction } from "@/actions/affiliates";
import { getBotStatusAction } from "@/actions/admin";

export interface OnboardingStatus {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "pending" | "in_progress" | "completed";
}

export interface WhatsAppConnection {
  platform: string;
  connected: boolean;
  configured: boolean;
  lastUpdated: Date | null;
  qrCodeGenerated: boolean;
}

export interface AffiliateConfig {
  name: string;
  id: string;
  status: "configured" | "not_configured";
}

export interface TelegramConfig {
  configured: boolean;
  tested: boolean;
  channelId: string | null;
}

export interface StripeConfig {
  connected: boolean;
  plan: string;
  testMode: boolean;
}

export async function getOnboardingStatusAction(): Promise<{
  steps: OnboardingStatus[];
  whatsappConnections: WhatsAppConnection[];
  affiliateConfigs: AffiliateConfig[];
  telegramConfig: TelegramConfig;
  stripeConfig: StripeConfig;
}> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId || "";

  // Fetch all required data
  const [
    metrics,
    subscription,
    affiliateConfig,
    botStatus,
  ] = await Promise.all([
    import("@/actions/affiliates").then(m => m.getDashboardMetricsAction(tenantId)),
    getSubscriptionAction(),
    getAffiliateConfigAction(tenantId),
    getBotStatusAction(tenantId).catch(() => null), // May fail if not admin
  ]);

  // WhatsApp connections from bot status
  const whatsappConnections: WhatsAppConnection[] = botStatus ? [
    {
      platform: "WhatsApp",
      connected: botStatus.whatsapp.ready,
      configured: true,
      lastUpdated: botStatus.whatsapp.lastConnected,
      qrCodeGenerated: botStatus.whatsapp.qrCodeGenerated,
    },
    {
      platform: "Telegram",
      connected: botStatus.telegram.configured,
      configured: botStatus.telegram.configured,
      lastUpdated: botStatus.telegram.lastTested,
      qrCodeGenerated: false,
    },
  ] : [
    { platform: "WhatsApp", connected: false, configured: false, lastUpdated: null, qrCodeGenerated: false },
    { platform: "Telegram", connected: false, configured: false, lastUpdated: null, qrCodeGenerated: false },
  ];

  // Affiliate configs
  const affiliateConfigs: AffiliateConfig[] = affiliateConfig ? [
    { name: "Amazon", id: affiliateConfig.amazonTag || "não configurado", status: affiliateConfig.amazonTag ? "configured" : "not_configured" },
    { name: "Mercado Livre", id: affiliateConfig.mlId || "não configurado", status: affiliateConfig.mlId ? "configured" : "not_configured" },
    { name: "Shopee", id: affiliateConfig.shopeeId || "não configurado", status: affiliateConfig.shopeeId ? "configured" : "not_configured" },
    { name: "AliExpress", id: affiliateConfig.aliexpressId || "não configurado", status: affiliateConfig.aliexpressId ? "configured" : "not_configured" },
  ] : [
    { name: "Amazon", id: "não configurado", status: "not_configured" },
    { name: "Mercado Livre", id: "não configurado", status: "not_configured" },
    { name: "Shopee", id: "não configurado", status: "not_configured" },
    { name: "AliExpress", id: "não configurado", status: "not_configured" },
  ];

  // Telegram config
  const telegramConfig: TelegramConfig = botStatus ? {
    configured: botStatus.telegram.configured,
    tested: botStatus.telegram.tested,
    channelId: botStatus.telegram.botUsername || null,
  } : {
    configured: false,
    tested: false,
    channelId: null,
  };

  // Stripe config from subscription
  const stripeConfig: StripeConfig = subscription ? {
    connected: !!subscription,
    plan: subscription.plan || "free",
    testMode: true, // TODO: determine from Stripe
  } : {
    connected: false,
    plan: "free",
    testMode: true,
  };

  // Determine step statuses based on real data
  const whatsappConnected = whatsappConnections[0]?.connected || false;
  const telegramConnected = whatsappConnections[1]?.connected || false;
  const hasAffiliateConfig = affiliateConfigs.some(a => a.status === "configured");
  const stripeConnected = stripeConfig.connected;

  const steps: OnboardingStatus[] = [
    {
      id: "whatsapp",
      title: "Conectar WhatsApp",
      description: "Conecte seu número WhatsApp secundário para monitorar ofertas",
      icon: "Smartphone",
      status: whatsappConnected ? "completed" : "pending",
    },
    {
      id: "telegram",
      title: "Configurar Telegram",
      description: "Configure seu bot e canal do Telegram para publicar ofertas",
      icon: "MessageCircle",
      status: telegramConnected ? "completed" : (whatsappConnected ? "in_progress" : "pending"),
    },
    {
      id: "affiliates",
      title: "Configurar Afiliados",
      description: "Adicione seus IDs de afiliado para Amazon, Mercado Livre, Shopee e AliExpress",
      icon: "Store",
      status: hasAffiliateConfig ? "completed" : (telegramConnected ? "in_progress" : "pending"),
    },
    {
      id: "payments",
      title: "Configurar Pagamentos",
      description: "Configure sua conta Stripe para receber comissões automaticamente",
      icon: "CreditCard",
      status: stripeConnected ? "completed" : (hasAffiliateConfig ? "in_progress" : "pending"),
    },
    {
      id: "ready",
      title: "Pronto para Começar",
      description: "Sua máquina está pronta para gerar renda automaticamente",
      icon: "Play",
      status: stripeConnected ? "completed" : "pending",
    },
  ];

  return {
    steps,
    whatsappConnections,
    affiliateConfigs,
    telegramConfig,
    stripeConfig,
  };
}

export async function getWhatsAppGroupsAction(): Promise<Array<{
  name: string;
  members: number;
  lastUpdate: string;
}>> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId || "";

  // Get WhatsApp fontes from database
  const fontes = await prisma.fonte.findMany({
    where: { tenantId },
    select: {
      name: true,
      isActive: true,
      lastChecked: true,
      totalOffersFound: true,
      totalOffersPublished: true,
    },
    orderBy: { lastChecked: "desc" },
  });

  return fontes.map(f => ({
    name: f.name,
    members: f.totalOffersFound, // Using offers found as proxy for group size
    lastUpdate: f.lastChecked.toLocaleString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    }),
  }));
}

export async function getAffiliateDetailsAction(): Promise<AffiliateConfig[]> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId || "";
  const config = await getAffiliateConfigAction(tenantId);

  if (!config) {
    return [
      { name: "Amazon", id: "não configurado", status: "not_configured" },
      { name: "Mercado Livre", id: "não configurado", status: "not_configured" },
      { name: "Shopee", id: "não configurado", status: "not_configured" },
      { name: "AliExpress", id: "não configurado", status: "not_configured" },
    ];
  }

  return [
    { name: "Amazon", id: config.amazonTag || "não configurado", status: config.amazonTag ? "configured" : "not_configured" },
    { name: "Mercado Livre", id: config.mlId || "não configurado", status: config.mlId ? "configured" : "not_configured" },
    { name: "Shopee", id: config.shopeeId || "não configurado", status: config.shopeeId ? "configured" : "not_configured" },
    { name: "AliExpress", id: config.aliexpressId || "não configurado", status: config.aliexpressId ? "configured" : "not_configured" },
  ];
}

export async function getStripeDetailsAction(): Promise<StripeConfig> {
  const subscription = await getSubscriptionAction();
  return {
    connected: !!subscription,
    plan: subscription?.plan || "free",
    testMode: true,
  };
}

export async function completeOnboardingStepAction(stepId: string): Promise<{ success: boolean }> {
  // For now, just return success - in a real implementation this might
  // track completion in the database
  return { success: true };
}