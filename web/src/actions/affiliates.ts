"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";

export async function getAffiliateConfigAction(tenantId: string) {
  const config = await prisma.affiliateConfig.findUnique({
    where: { tenantId },
    select: {
      amazonTag: true,
      shopeeId: true,
      mlId: true,
      aliexpressId: true,
    },
  });
  return config;
}

export async function updateAffiliateConfigAction(
  tenantId: string,
  data: {
    amazonTag?: string | null;
    shopeeId?: string | null;
    mlId?: string | null;
    aliexpressId?: string | null;
  }
) {
  const config = await prisma.affiliateConfig.upsert({
    where: { tenantId },
    update: data,
    create: { tenantId, ...data },
  });
  revalidatePath("/dashboard/afiliados");
  return config;
}

export async function getDashboardMetricsAction(tenantId: string) {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  const [
    totalOffers,
    publishedOffers,
    pendingOffers,
    failedOffers,
    todayOffers,
    thisMonthOffers,
    tenant,
    platformCounts,
    affiliateConfig,
  ] = await Promise.all([
    prisma.offer.count({ where: { tenantId } }),
    prisma.offer.count({ where: { tenantId, status: "published" } }),
    prisma.offer.count({ where: { tenantId, status: "pending" } }),
    prisma.offer.count({ where: { tenantId, status: "failed" } }),
    prisma.offer.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
    prisma.offer.count({ where: { tenantId, createdAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, status: true },
    }),
    prisma.offer.groupBy({
      by: ["platform"],
      where: { tenantId },
      _count: { platform: true },
      orderBy: { _count: { platform: "desc" } },
    }),
    prisma.affiliateConfig.findUnique({
      where: { tenantId },
      select: {
        amazonTag: true,
        shopeeId: true,
        mlId: true,
        aliexpressId: true,
      },
    }),
  ]);

  return {
    totalOffers,
    publishedOffers,
    pendingOffers,
    failedOffers,
    todayOffers,
    thisMonthOffers,
    activeSources: await prisma.fonte.count({ where: { tenantId, isActive: true }}),
    plan: tenant?.plan ?? "free",
    status: tenant?.status ?? "active",
    platformCounts: platformCounts.map((p) => ({
      platform: p.platform,
      count: p._count.platform,
    })),
    affiliateConfig,
  };
}

export async function getRecentOffersAction(tenantId: string, limit = 10) {
  return prisma.offer.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      platform: true,
      price: true,
      status: true,
      publishedAt: true,
      createdAt: true,
    },
  });
}

export async function getOffersByDayAction(tenantId: string, days = 7) {
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  since.setUTCHours(0, 0, 0, 0);

  const result = await prisma.offer.groupBy({
    by: ["createdAt"],
    where: { tenantId, createdAt: { gte: since } },
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const dayMap = new Map<string, number>();
  for (const r of result) {
    const key = r.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) || 0) + r._count.id);
  }

  const output = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    d.setUTCHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    output.push({ date: key, count: dayMap.get(key) || 0 });
  }
  return output;
}

export async function getPaginatedOffersAction(
  tenantId: string,
  filters: {
    search?: string;
    platform?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { search, platform, status, startDate, endDate, page = 1, pageSize = 20 } = filters;

  const where: Prisma.OfferWhereInput = { tenantId };
  if (search) where.title = { contains: search };
  if (platform) where.platform = platform as "amazon" | "shopee" | "mercadolivre" | "aliexpress" | "outros";
  if (status) where.status = status as "pending" | "published" | "failed";
  if (startDate || endDate) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (startDate) createdAt.gte = new Date(startDate);
    if (endDate) createdAt.lte = new Date(endDate);
    where.createdAt = createdAt;
  }

  const [data, total] = await Promise.all([
    prisma.offer.findMany({
      where: where as Prisma.OfferWhereInput,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        platform: true,
        price: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.offer.count({ where: where as Prisma.OfferWhereInput }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
export async function getFontesAction(tenantId: string) {
  return prisma.fonte.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      isActive: true,
      lastChecked: true,
      totalOffersFound: true,
      totalOffersPublished: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createFonteAction(
  tenantId: string,
  data: {
    name: string;
    url: string;
    isActive?: boolean;
  }
) {
  const fonte = await prisma.fonte.create({
    data: {
      tenantId,
      name: data.name,
      url: data.url,
      isActive: data.isActive ?? true,
    },
  const fonte = await prisma.fonte.update({
    where: { id, tenantId },
    data: {
      name: data.name,
      url: data.url,
      isActive: data.isActive,
    },
  });
  revalidatePath("/dashboard");
  return fonte;
}

export async function updateFonteAction(
  id: string,
  data: {
    name?: string;
    url?: string;
    isActive?: boolean;
  }
) {
  const fonte = await prisma.fonte.update({
    where: { id },
    data: {
      name: data.name,
      url: data.url,
      isActive: data.isActive,
    },
  });
  revalidatePath("/dashboard");
  return fonte;
}

export async function deleteFonteAction(id: string) {
  await prisma.fonte.delete({
    where: { id },
  });
  revalidatePath("/dashboard");
}
