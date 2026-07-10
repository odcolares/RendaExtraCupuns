"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";

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
    planBreakdown.starter * 29 + planBreakdown.professional * 79;

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
