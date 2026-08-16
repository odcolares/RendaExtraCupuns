"use server";

import { prisma } from "@/lib/prisma";
import { computeStats, ClickStats } from "@/lib/click-stats";

export async function getClickStatsAction(
  tenantId: string,
  periodDays: number
): Promise<ClickStats> {
  if (!tenantId || ![7, 30, 90].includes(periodDays)) {
    return {
      totalClicks: 0,
      uniqueClicks: 0,
      clicksToday: 0,
      topProducts: [],
      clicksByDay: [],
      clicksByPlatform: [],
    };
  }
  const since = new Date(Date.now() - periodDays * 86_400_000);
  const clicks = await prisma.click.findMany({
    where: { tenantId, createdAt: { gte: since } },
    select: {
      offerId: true,
      sessionKey: true,
      createdAt: true,
      offer: { select: { title: true, platform: true, url: true } },
    },
  });
  return computeStats(clicks, periodDays);
}