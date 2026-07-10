/**
 * CRUD de ofertas no banco via Prisma (Turso/libSQL).
 *
 * Substitui o sql.js local — agora grava no mesmo Turso que o web SaaS usa.
 */

import { prisma } from "../lib/prisma";
import { createModuleLogger } from "../utils";
import type { OfferData } from "../types";

const log = createModuleLogger("DatabaseOffers");

// ==============================================================
// Helpers
// ==============================================================

/**
 * Obtém o tenantId do cliente de teste (cliente@teste.com).
 * Cache em memória para evitar queries repetidas.
 */
let cachedTestTenantId: string | null = null;

async function getTestTenantId(): Promise<string> {
  if (cachedTestTenantId) return cachedTestTenantId;

  const user = await prisma.user.findUnique({
    where: { email: "cliente@teste.com" },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    throw new Error("Tenant do cliente de teste não encontrado. Rode o seed primeiro.");
  }

  cachedTestTenantId = user.tenantId;
  log.debug("Tenant de teste resolvido", { tenantId: cachedTestTenantId });
  return cachedTestTenantId;
}

/**
 * Mapeia plataforma do bot para enum do Prisma.
 */
function mapPlatform(platform: string): "amazon" | "shopee" | "mercadolivre" | "aliexpress" | "outros" {
  const p = platform.toLowerCase();
  if (p.includes("amazon")) return "amazon";
  if (p.includes("shopee")) return "shopee";
  if (p.includes("mercadolivre") || p.includes("ml.uv") || p.includes("meli.la")) return "mercadolivre";
  if (p.includes("aliexpress")) return "aliexpress";
  return "outros";
}

/**
 * Mapeia status do bot para enum do Prisma.
 */
function mapStatus(published: boolean): "pending" | "published" | "failed" {
  return published ? "published" : "pending";
}

// ==============================================================
// Insert
// ==============================================================

/**
 * Insere uma nova oferta no banco associada ao tenant de teste.
 * Retorna o ID gerado, ou null se já existir (url duplicada no dia).
 */
export async function insertOffer(
  offer: OfferData,
  affiliateLink?: string
): Promise<string | null> {
  const tenantId = await getTestTenantId();

  // Verificar duplicata (mesma URL no mesmo dia)
  if (await isDuplicate(offer.originalUrl || "")) {
    log.debug("Oferta duplicada ignorada", { url: offer.originalUrl });
    return null;
  }

  const created = await prisma.offer.create({
    data: {
      title: offer.name,
      description: offer.description ?? null,
      url: offer.originalUrl || "",
      platform: mapPlatform(offer.platform),
      price: offer.currentPrice ?? null,
      originalPrice: offer.originalPrice ?? null,
      discount: offer.discount ?? null,
      imageUrl: offer.imageUrl ?? null,
      status: "pending",
      tenantId,
    },
  });

  log.info("Oferta inserida no Turso", { id: created.id, produto: offer.name });
  return created.id;
}

// ==============================================================
// Select
// ==============================================================

/**
 * Busca uma oferta pelo ID.
 */
export async function getOfferById(id: string): Promise<{
  id: string;
  title: string;
  description: string | null;
  url: string;
  platform: string;
  price: number | null;
  originalPrice: number | null;
  discount: number | null;
  imageUrl: string | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  return prisma.offer.findUnique({
    where: { id },
  });
}

/**
 * Retorna as N ofertas mais recentes do tenant de teste.
 */
export async function getRecentOffers(limit: number = 10) {
  const tenantId = await getTestTenantId();
  return prisma.offer.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Busca ofertas por plataforma do tenant de teste.
 */
export async function getOffersByPlatform(
  platform: string,
  limit: number = 20
) {
  const tenantId = await getTestTenantId();
  return prisma.offer.findMany({
    where: {
      tenantId,
      platform: mapPlatform(platform),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ==============================================================
// Update
// ==============================================================

/**
 * Marca uma oferta como publicada no Telegram.
 */
export async function markAsPublished(offerId: string): Promise<void> {
  await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: "published",
      publishedAt: new Date(),
    },
  });
  log.info("Oferta marcada como publicada", { id: offerId });
}

/**
 * Atualiza o link de afiliado de uma oferta.
 */
export async function updateAffiliateLink(offerId: string, link: string): Promise<void> {
  await prisma.offer.update({
    where: { id: offerId },
    data: { url: link }, // Prisma usa 'url' para o link
  });
  log.debug("Link de afiliado atualizado", { id: offerId });
}

// ==============================================================
// Duplicate detection
// ==============================================================

/**
 * Verifica se uma URL já foi processada HOJE (dedup diário).
 *
 * Após a virada do dia (00:00), a mesma URL pode ser processada
 * novamente — útil para ofertas e cupons que reaparecem no dia
 * seguinte com o mesmo link.
 *
 * @param url - URL do produto ou cupom
 * @returns true se a URL já foi registrada no dia corrente
 */
export async function isDuplicate(url: string): Promise<boolean> {
  if (!url) return false;

  const tenantId = await getTestTenantId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const count = await prisma.offer.count({
    where: {
      tenantId,
      url,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return count > 0;
}

// ==============================================================
// Stats
// ==============================================================

/**
 * Retorna estatísticas básicas do banco do tenant de teste.
 */
export async function getStats(): Promise<{
  total: number;
  published: number;
  pending: number;
  byPlatform: Record<string, number>;
}> {
  const tenantId = await getTestTenantId();

  const [total, published, byPlatformRaw] = await Promise.all([
    prisma.offer.count({ where: { tenantId } }),
    prisma.offer.count({ where: { tenantId, status: "published" } }),
    prisma.offer.groupBy({
      by: ["platform"],
      where: { tenantId },
      _count: { platform: true },
    }),
  ]);

  const byPlatform: Record<string, number> = {};
  for (const row of byPlatformRaw) {
    byPlatform[row.platform] = row._count.platform;
  }

  return {
    total,
    published,
    pending: total - published,
    byPlatform,
  };
}

// ==============================================================
// Barrel (re-exporta funções de index.ts para compatibilidade)
// ==============================================================

export { initDatabase, getDb, closeDatabase, saveToDisk } from "./index";