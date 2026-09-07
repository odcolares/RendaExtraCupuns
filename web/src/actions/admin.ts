"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { botClient, type ProvisionResult } from "@/lib/railway";
import { PLAN_PRICES } from "@/lib/billing";

// ==============================================================
// Admin guard — all actions verify role === "admin"
// ==============================================================
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}

// ==============================================================
// Client listing with search, filter, pagination
// ==============================================================
export type ClientSummary = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  totalOffers: number;
  totalFontes: number;
  createdAt: Date;
  lastActivity: Date | null;
};

export async function getClientsAction(params: {
  search?: string;
  plan?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAdmin();

  const { search, plan, status, page = 1, pageSize = 20 } = params;

  const where: Prisma.TenantWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { users: { some: { email: { contains: search } } } },
    ];
  }
  if (plan) where.plan = plan as Prisma.EnumTenantPlanFilter["equals"];
  if (status) where.status = status as Prisma.EnumTenantStatusFilter["equals"];

  const [data, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: { select: { offers: true, fontes: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tenant.count({ where }),
  ]);

  const clients: ClientSummary[] = data.map((t) => ({
    id: t.id,
    name: t.users[0]?.name || t.name,
    email: t.users[0]?.email || "",
    plan: t.plan,
    status: t.status,
    totalOffers: t._count.offers,
    totalFontes: t._count.fontes,
    createdAt: t.createdAt,
    lastActivity: t.updatedAt,
  }));

  return {
    data: clients,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==============================================================
// Change tenant plan
// ==============================================================
export async function changePlanAction(
  tenantId: string,
  newPlan: "free" | "starter" | "professional"
) {
  await requireAdmin();

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: newPlan },
  });

  return { success: true };
}

// ==============================================================
// Toggle tenant status (active ↔ suspended)
// ==============================================================
export async function toggleTenantStatusAction(tenantId: string) {
  await requireAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { status: true },
  });

  if (!tenant) throw new Error("Cliente não encontrado");

  const newStatus =
    tenant.status === "active" ? "suspended" : "active";

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: newStatus },
  });

  return { success: true, newStatus };
}

// ==============================================================
// Cancel tenant
// ==============================================================
export async function cancelTenantAction(tenantId: string) {
  await requireAdmin();

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "cancelled" },
  });

  return { success: true };
}

// ==============================================================
// Get single client details
// ==============================================================
export async function getClientDetailAction(tenantId: string) {
  await requireAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
      affiliateConfig: true,
      _count: { select: { offers: true, fontes: true } },
    },
  });

  if (!tenant) throw new Error("Cliente não encontrado");

  const recentOffers = await prisma.offer.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      platform: true,
      status: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  const fontes = await prisma.fonte.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      isActive: true,
      lastChecked: true,
      totalOffersFound: true,
      totalOffersPublished: true,
    },
  });

  return { tenant, recentOffers, fontes };
}

// ==============================================================
// Global offers (all tenants)
// ==============================================================
export async function getGlobalOffersAction(params: {
  search?: string;
  platform?: string;
  status?: string;
  tenantId?: string;
  page?: number;
  pageSize?: number;
}) {
  await requireAdmin();

  const {
    search,
    platform,
    status,
    tenantId,
    page = 1,
    pageSize = 20,
  } = params;

  const where: Prisma.OfferWhereInput = {};
  if (search) where.title = { contains: search };
  if (platform) where.platform = platform as Prisma.EnumOfferPlatformFilter["equals"];
  if (status) where.status = status as Prisma.EnumOfferStatusFilter["equals"];
  if (tenantId) where.tenantId = tenantId;

  const [data, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            users: { select: { name: true, email: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    data: data.map((offer) => ({
      id: offer.id,
      title: offer.title,
      platform: offer.platform,
      price: offer.price,
      status: offer.status,
      clientName: offer.tenant.users[0]?.name || offer.tenant.name,
      clientEmail: offer.tenant.users[0]?.email,
      createdAt: offer.createdAt,
      publishedAt: offer.publishedAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==============================================================
// Revenue / Billing overview
// ==============================================================
export async function getBillingOverviewAction() {
  await requireAdmin();

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      plan: true,
      status: true,
      stripeSubscriptionId: true,
      createdAt: true,
    },
  });

  const activeTenants = tenants.filter((t) => t.status === "active");
  const payingTenants = activeTenants.filter((t) => t.plan !== "free");

  const planBreakdown = {
    free: activeTenants.filter((t) => t.plan === "free").length,
    starter: activeTenants.filter((t) => t.plan === "starter").length,
    professional: activeTenants.filter((t) => t.plan === "professional").length,
  };

  const estimatedMRR =
    planBreakdown.starter * PLAN_PRICES.starter + planBreakdown.professional * PLAN_PRICES.professional;

  const totalOffers = await prisma.offer.count();
  const publishedOffers = await prisma.offer.count({
    where: { status: "published" },
  });

  return {
    totalTenants: tenants.length,
    activeTenants: activeTenants.length,
    payingTenants: payingTenants.length,
    cancelledTenants: tenants.filter((t) => t.status === "cancelled").length,
    planBreakdown,
    estimatedMRR,
    totalOffers,
    publishedOffers,
  };
}

// ==============================================================
// Bot Lifecycle Management (Phase 2 - Multi-tenant)
// ==============================================================

export type BotStatus = {
  tenantId: string;
  tenantName: string;
  isRunning: boolean;
  whatsapp: {
    ready: boolean;
    qrCodeGenerated: boolean;
    lastConnected: Date | null;
    sessionPath: string;
  };
  telegram: {
    configured: boolean;
    tested: boolean;
    lastTested: Date | null;
    botUsername: string | null;
  };
  afiliados: {
    amazon: boolean;
    shopee: boolean;
    mercadolivre: boolean;
    aliexpress: boolean;
  };
  fontes: {
    total: number;
    active: number;
    lastChecked: Date | null;
  };
  stats: {
    offersProcessed24h: number;
    offersPublished24h: number;
    errors24h: number;
  };
};

export async function provisionBotAction(tenantId: string): Promise<ProvisionResult> {
  await requireAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      channels: { where: { isActive: true } },
      affiliateConfig: true,
    },
  });

  if (!tenant) {
    return { success: false, error: "Tenant não encontrado" };
  }

  if (tenant.status !== "active") {
    return { success: false, error: "Tenant deve ter status active" };
  }

  if (tenant.plan === "free") {
    return { success: false, error: "Plano free não suporta bot" };
  }

  // Prepara variáveis de ambiente para o container
  const envVars: Record<string, string> = {
    TENANT_ID: tenantId,
    DATABASE_URL: process.env.DATABASE_URL!,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN!,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
    WHATSAPP_SESSION_BASE_PATH: "/data/whatsapp-sessions",
    // Afiliados globais (fallback)
    AMAZON_AFFILIATE_TAG: process.env.AMAZON_AFFILIATE_TAG || "",
    SHOPEE_AFFILIATE_ID: process.env.SHOPEE_AFFILIATE_ID || "",
    ALIEXPRESS_AFFILIATE_ID: process.env.ALIEXPRESS_AFFILIATE_ID || "",
    MERCADOLIVRE_AFFILIATE_ID: process.env.MERCADOLIVRE_AFFILIATE_ID || "",
    ML_CLIENT_ID: process.env.ML_CLIENT_ID || "",
    ML_SECRET_KEY: process.env.ML_SECRET_KEY || "",
    ML_ACCESS_TOKEN: process.env.ML_ACCESS_TOKEN || "",
    ML_REFRESH_TOKEN: process.env.ML_REFRESH_TOKEN || "",
  };

  // Adiciona config de afiliados do tenant (sobrescreve globals se existirem)
  if (tenant.affiliateConfig) {
    if (tenant.affiliateConfig.amazonTag) envVars.AMAZON_AFFILIATE_TAG = tenant.affiliateConfig.amazonTag;
    if (tenant.affiliateConfig.shopeeId) envVars.SHOPEE_AFFILIATE_ID = tenant.affiliateConfig.shopeeId;
    if (tenant.affiliateConfig.aliexpressId) envVars.ALIEXPRESS_AFFILIATE_ID = tenant.affiliateConfig.aliexpressId;
    if (tenant.affiliateConfig.mlId) envVars.MERCADOLIVRE_AFFILIATE_ID = tenant.affiliateConfig.mlId;
  }

  const result = await botClient.provisionBot(tenantId);

  // Se provisionamento falhou, tenta buscar QR code do bot local
  if (!result.success && result.qrCode === undefined) {
    const qrResult = await botClient.getQrCode?.(tenantId);
    if (qrResult?.qrCode) {
      result.qrCode = qrResult.qrCode;
    }
  }

  return result;
}

export async function getBotQrCodeAction(tenantId: string): Promise<{ qrCode: string | null }> {
  await requireAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { qrCode: null };
  }

  // Tenta buscar QR code do bot
  const qrResult = await botClient.getQrCode?.(tenantId);
  return { qrCode: qrResult?.qrCode || null };
}

export async function getBotStatusAction(tenantId: string): Promise<BotStatus | null> {
  await requireAdmin();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      channels: { where: { isActive: true } },
      affiliateConfig: true,
      fontes: {
        select: {
          id: true,
          isActive: true,
          lastChecked: true,
          totalOffersFound: true,
          totalOffersPublished: true,
        },
      },
    },
  });

  if (!tenant) return null;

  // Busca status do bot remoto
  const remoteStatus = await botClient.getStatus?.(tenantId);

  const activeFontes = tenant.fontes.filter(f => f.isActive).length;
  const lastChecked = tenant.fontes.length > 0
    ? new Date(Math.max(...tenant.fontes.map(f => f.lastChecked.getTime())))
    : null;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    isRunning: remoteStatus?.isRunning || false,
    whatsapp: {
      ready: remoteStatus?.whatsapp?.ready || false,
      qrCodeGenerated: remoteStatus?.whatsapp?.qrCodeGenerated || false,
      lastConnected: remoteStatus?.whatsapp?.lastConnected || null,
      sessionPath: remoteStatus?.whatsapp?.sessionPath || "",
    },
    telegram: {
      configured: !!tenant.channels.find(c => c.platform === "telegram" && c.isActive),
      tested: remoteStatus?.telegram?.tested || false,
      lastTested: remoteStatus?.telegram?.lastTested || null,
      botUsername: remoteStatus?.telegram?.botUsername || null,
    },
    afiliados: {
      amazon: !!tenant.affiliateConfig?.amazonTag,
      shopee: !!tenant.affiliateConfig?.shopeeId,
      mercadolivre: !!tenant.affiliateConfig?.mlId,
      aliexpress: !!tenant.affiliateConfig?.aliexpressId,
    },
    fontes: {
      total: tenant.fontes.length,
      active: activeFontes,
      lastChecked,
    },
    stats: {
      offersProcessed24h: remoteStatus?.stats?.offersProcessed24h || 0,
      offersPublished24h: remoteStatus?.stats?.offersPublished24h || 0,
      errors24h: remoteStatus?.stats?.errors24h || 0,
    },
  };
}

export async function startBotAction(tenantId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  return botClient.startBot(tenantId);
}

export async function stopBotAction(tenantId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  return botClient.stopBot(tenantId);
}

export async function restartBotAction(tenantId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  return botClient.restartBot(tenantId);
}

export async function testTelegramConnectionAction(tenantId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  return botClient.testTelegram(tenantId);
}

export async function syncTenantFontesAction(tenantId: string): Promise<{ synced: number; error?: string }> {
  await requireAdmin();
  return botClient.syncFontes(tenantId);
}

export async function saveTelegramChannelAction(
  tenantId: string,
  channelId: string,
  label?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  if (!channelId.trim()) {
    return { success: false, error: "Channel ID é obrigatório" };
  }

  const trimmedChannelId = channelId.trim();

  if (!trimmedChannelId.startsWith("-100") && !trimmedChannelId.startsWith("@")) {
    return { success: false, error: "Channel ID deve começar com -100 ou @username" };
  }

  await prisma.tenantChannel.upsert({
    where: {
      tenantId_platform: {
        tenantId,
        platform: "telegram",
      },
    },
    update: {
      channelId: trimmedChannelId,
      label: label?.trim() || "Canal Telegram",
      isActive: true,
      validatedAt: new Date(),
    },
    create: {
      tenantId,
      platform: "telegram",
      channelId: trimmedChannelId,
      label: label?.trim() || "Canal Telegram",
      isActive: true,
      validatedAt: new Date(),
    },
  });

  return { success: true };
}

// ==============================================================
// Fontes CRUD
// ==============================================================

export async function createFonteAction(
  tenantId: string,
  name: string,
  url: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  if (!name.trim()) {
    return { success: false, error: "Nome é obrigatório" };
  }

  if (!url.trim()) {
    return { success: false, error: "URL é obrigatória" };
  }

  await prisma.fonte.create({
    data: {
      tenantId,
      name: name.trim(),
      url: url.trim(),
    },
  });

  return { success: true };
}

export async function deleteFonteAction(fonteId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  const fonte = await prisma.fonte.findUnique({
    where: { id: fonteId },
    select: { id: true },
  });

  if (!fonte) {
    return { success: false, error: "Fonte não encontrada" };
  }

  await prisma.fonte.delete({
    where: { id: fonteId },
  });

  return { success: true };
}
