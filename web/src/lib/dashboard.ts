import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";
import type { Prisma } from "@/generated/prisma/client";

// ==============================================================
// Tipos compartilhados
// ==============================================================

export interface DashboardMetrics {
  totalOffers: number;
  publishedOffers: number;
  pendingOffers: number;
  failedOffers: number;
  todayOffers: number;
  thisMonthOffers: number;
  activeSources: number;
  plan: string;
  status: string;
}

export interface OffersByPlatform {
  platform: string;
  count: number;
}

export interface OffersByDay {
  date: string;
  count: number;
}

export interface RecentOffer {
  id: string;
  title: string;
  platform: string;
  price: number | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface OfferFilters {
  search?: string;
  platform?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==============================================================
// Dashboard Metrics
// ==============================================================

export async function getDashboardMetrics(
  tenantId: string
): Promise<DashboardMetrics> {
  const now = new Date();
  // Calculate today's start (00:00:00 UTC)
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  // Calculate month's start and end (00:00:00 to 23:59:59 UTC)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));

  const [totalOffers, publishedOffers, pendingOffers, failedOffers, todayOffers, thisMonthOffers, tenant] =
    await Promise.all([
      prisma.offer.count({ where: { tenantId } }),
      prisma.offer.count({ where: { tenantId, status: "published" } }),
      prisma.offer.count({ where: { tenantId, status: "pending" } }),
      prisma.offer.count({ where: { tenantId, status: "failed" } }),
      prisma.offer.count({
        where: { tenantId, createdAt: { gte: todayStart } },
      }),
      prisma.offer.count({
        where: { tenantId, createdAt: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true, status: true },
      }),
    ]);

  return {
    totalOffers,
    publishedOffers,
    pendingOffers,
    failedOffers,
    todayOffers,
    thisMonthOffers,
    activeSources: 0, // será populado quando tivermos fontes cadastradas
    plan: tenant?.plan ?? "free",
    status: tenant?.status ?? "active",
  };
}

// ==============================================================
// Offers by Platform
// ==============================================================

export async function getOffersByPlatform(
  tenantId: string
): Promise<OffersByPlatform[]> {
  const result = await prisma.offer.groupBy({
    by: ["platform"],
    where: { tenantId },
    _count: { platform: true },
    orderBy: { _count: { platform: "desc" } },
  });

  return result.map((r) => ({
    platform: r.platform,
    count: r._count.platform,
  }));
}

// ==============================================================
// Offers by Day (last N days)
// ==============================================================

export async function getOffersByDay(
  tenantId: string,
  days: number = 7
): Promise<OffersByDay[]> {
  const since = startOfDay(subDays(new Date(), days - 1));

  const result = await prisma.offer.groupBy({
    by: ["createdAt"],
    where: {
      tenantId,
      createdAt: { gte: since },
    },
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  });

  // Aggregates by day key
  const dayMap = new Map<string, number>();
  for (const r of result) {
    const key = r.createdAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) || 0) + r._count.id);
  }

  // Fill in missing days with zero
  const output: OffersByDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), days - 1 - i);
    const key = d.toISOString().slice(0, 10);
    output.push({ date: key, count: dayMap.get(key) || 0 });
  }

  return output;
}

// ==============================================================
// Recent Offers
// ==============================================================

export async function getRecentOffers(
  tenantId: string,
  limit: number = 10
): Promise<RecentOffer[]> {
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

// ==============================================================
// Paginated Offers with Filters
// ==============================================================

export async function getPaginatedOffers(
  tenantId: string,
  filters: OfferFilters = {}
): Promise<PaginatedResult<RecentOffer>> {
  const {
    search,
    platform,
    status,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
  } = filters;

  const where: Prisma.OfferWhereInput = { tenantId };

  if (search) {
    where.title = { contains: search };
  }

  if (platform) {
    where.platform = platform as "amazon" | "shopee" | "mercadolivre" | "aliexpress" | "outros";
  }

  if (status) {
    where.status = status as "pending" | "published" | "failed";
  }

  if (startDate || endDate) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (startDate) createdAt.gte = new Date(startDate);
    if (endDate) createdAt.lte = new Date(endDate);
    where.createdAt = createdAt;
  }

  const [data, total] = await Promise.all([
    prisma.offer.findMany({
      where,
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
    prisma.offer.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==============================================================
// Update Affiliate Config
// ==============================================================

export async function getAffiliateConfig(tenantId: string) {
  return prisma.affiliateConfig.findUnique({
    where: { tenantId },
  });
}

export async function updateAffiliateConfig(
  tenantId: string,
  data: {
    amazonTag?: string | null;
    shopeeId?: string | null;
    mlId?: string | null;
    aliexpressId?: string | null;
  }
) {
  const existing = await prisma.affiliateConfig.findUnique({
    where: { tenantId },
  });

  if (existing) {
    return prisma.affiliateConfig.update({
      where: { tenantId },
      data,
    });
  }

  return prisma.affiliateConfig.create({
    data: { tenantId, ...data },
  });
}
