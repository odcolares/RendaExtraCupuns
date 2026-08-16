export interface ClickRow {
  offerId: string;
  sessionKey: string | null;
  createdAt: Date;
  offer: { title: string | null; platform: string | null; url: string } | null;
}

export interface TopProduct {
  offerId: string;
  title: string;
  platform: string;
  url: string;
  clicks: number;
}

export interface ClickStats {
  totalClicks: number;
  uniqueClicks: number;
  clicksToday: number;
  topProducts: TopProduct[];
  clicksByDay: { date: string; count: number }[];
  clicksByPlatform: { plataforma: string; quantidade: number }[];
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeStats(clicks: ClickRow[], days: number): ClickStats {
  void days; // period window is applied by the caller (query filter); kept for signature stability

  const totalClicks = clicks.length;

  const uniqueClicks = new Set(
    clicks.map((c) => c.sessionKey).filter((k): k is string => k !== null)
  ).size;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const clicksToday = clicks.filter((c) => c.createdAt >= startOfToday).length;

  // topProducts: group by offerId, take offer metadata from the first row of each offer
  const byOffer = new Map<
    string,
    { count: number; title: string; platform: string; url: string }
  >();
  for (const c of clicks) {
    if (!c.offer) continue;
    const existing = byOffer.get(c.offerId);
    if (existing) {
      existing.count += 1;
    } else {
      byOffer.set(c.offerId, {
        count: 1,
        title: c.offer.title ?? "",
        platform: c.offer.platform ?? "",
        url: c.offer.url,
      });
    }
  }
  const topProducts: TopProduct[] = [...byOffer.entries()]
    .map(([offerId, v]) => ({
      offerId,
      title: v.title,
      platform: v.platform,
      url: v.url,
      clicks: v.count,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // clicksByDay: group by local YYYY-MM-DD, sorted ascending
  const byDay = new Map<string, number>();
  for (const c of clicks) {
    const key = toLocalDateKey(c.createdAt);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const clicksByDay = [...byDay.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // clicksByPlatform: group by offer.platform (skip rows without offer)
  const byPlatform = new Map<string, number>();
  for (const c of clicks) {
    if (!c.offer) continue;
    const platform = c.offer.platform ?? "desconhecida";
    byPlatform.set(platform, (byPlatform.get(platform) ?? 0) + 1);
  }
  const clicksByPlatform = [...byPlatform.entries()].map(
    ([plataforma, quantidade]) => ({ plataforma, quantidade })
  );

  return {
    totalClicks,
    uniqueClicks,
    clicksToday,
    topProducts,
    clicksByDay,
    clicksByPlatform,
  };
}