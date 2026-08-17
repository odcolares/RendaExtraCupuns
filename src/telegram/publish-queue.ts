/**
 * Fila de publicação de ofertas manuais (criadas na web).
 *
 * Ofertas criadas em /dashboard/ofertas entram com status "pending".
 * Este daemon:
 *   1. Faz polling das ofertas "pending" no Turso (DB compartilhado com a web)
 *   2. Resolve o canal do Telegram do tenant (TenantChannel) ou usa o canal
 *      padrão do operador (TELEGRAM_CHANNEL_ID)
 *   3. Gera o link de afiliado (best-effort) e publica via publishOffer
 *   4. Marca "published" (sucesso) ou "failed" (após N tentativas)
 *
 * NOTA sobre o fluxo WhatsApp (pipeline direto): lá o insert já grava o
 * status final ("published" quando publicado) — ver processor.ts. Portanto,
 * ofertas que chegam aqui são exclusivamente manuais (web) ou falhas que
 * ainda não foram publicadas (retry gentil).
 */

import { prisma } from "../lib/prisma";
import { publishOffer } from "./publisher";
import { buildTrackingUrl } from "./tracking";
import {
  markAsFailed,
  markAsPublished,
  getTenantTelegramChannel,
} from "../database/offers";
import { generateAffiliateLink } from "../affiliates";
import type { Platform } from "../affiliates/types";
import type { OfferData } from "../types";
import { createModuleLogger } from "../utils";

const log = createModuleLogger("PublishQueue");

// ==============================================================
// Configuração
// ==============================================================

const POLL_INTERVAL_MS = 30_000; // 30s entre ciclos
const MAX_OFFERS_PER_CYCLE = 20;
const MAX_RETRIES = 5; // depois disso, marca "failed"
const RETRY_WINDOW_MS = 5 * 60 * 1000; // reinicia o contador de tentativas

// ==============================================================
// Estado
// ==============================================================

let timer: NodeJS.Timeout | null = null;
let running = false;

/** Contador de tentativas por oferta (para retry gentil + rate limit) */
const attempts = new Map<
  string,
  { count: number; lastAt: number }
>();

// ==============================================================
// Lifecycle
// ==============================================================

export function startPublishQueue(): void {
  if (timer) return;
  log.info("Fila de publicação manual iniciada (polling a cada 30s)");
  timer = setInterval(() => void runCycle(), POLL_INTERVAL_MS);
  // Primeiro ciclo imediato
  void runCycle();
}

export function stopPublishQueue(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  log.info("Fila de publicação manual parada");
}

// ==============================================================
// Ciclo principal
// ==============================================================

async function runCycle(): Promise<void> {
  if (running) return;
  running = true;

  try {
    const offers = await prisma.offer.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: MAX_OFFERS_PER_CYCLE,
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        platform: true,
        price: true,
        originalPrice: true,
        discount: true,
        imageUrl: true,
        tenantId: true,
        createdAt: true,
      },
    });

    if (offers.length === 0) return;

    log.info("Fila encontrou ofertas pendentes", { total: offers.length });

    for (const offer of offers) {
      await processPendingOffer(offer);
    }

    // Limpa tentativas antigas
    const now = Date.now();
    for (const [id, entry] of attempts) {
      if (now - entry.lastAt > RETRY_WINDOW_MS) {
        attempts.delete(id);
      }
    }
  } catch (err) {
    log.error("Erro no ciclo da fila de publicação", {
      error: (err as Error).message,
    });
  } finally {
    running = false;
  }
}

async function processPendingOffer(offer: {
  id: string;
  title: string;
  description: string | null;
  url: string;
  platform: string;
  price: number | null;
  originalPrice: number | null;
  discount: number | null;
  imageUrl: string | null;
  tenantId: string;
  createdAt: Date;
}): Promise<void> {
  // 1. Resolver canal do tenant (fallback: canal do operador)
  const channel = await getTenantTelegramChannel(offer.tenantId);
  const channelId = channel?.channelId || process.env.TELEGRAM_CHANNEL_ID;
  if (!channelId) {
    log.warn("Sem canal configurado para publicar oferta", {
      offerId: offer.id,
    });
    return; // mantém "pending" — aguarda o tenant conectar o canal
  }

  // 2. Montar OfferData e gerar link de afiliado (best-effort)
  const platform = normalizePlatform(offer.platform);
  const offerData: OfferData = {
    name: offer.title,
    originalPrice: offer.originalPrice,
    currentPrice: offer.price,
    discount: offer.discount,
    platform: platform || "outros",
    originalUrl: offer.url,
    description: offer.description || undefined,
    imageUrl: offer.imageUrl || undefined,
  };

  let affiliateLink = offer.url;
  if (platform) {
    try {
      const link = await generateAffiliateLink(offer.url, platform);
      if (link?.affiliate) {
        affiliateLink = link.affiliate;
      }
    } catch (err) {
      log.warn("Falha ao gerar link de afiliado (usa URL original)", {
        offerId: offer.id,
        error: (err as Error).message,
      });
    }
  }

  // 3. Publicar (link de rastreio /r/<id>)
  const publishResult = await publishOffer(
    offerData,
    buildTrackingUrl(offer.id),
    channelId
  );

  if (publishResult.success) {
    await markAsPublished(offer.id);
    attempts.delete(offer.id);
    return;
  }

  // 4. Falhou — retry gentil (rate limit 30/h do publisher ou erro transitório)
  const entry = attempts.get(offer.id) ?? { count: 0, lastAt: Date.now() };
  entry.count += 1;
  entry.lastAt = Date.now();
  attempts.set(offer.id, entry);

  if (entry.count >= MAX_RETRIES) {
    await markAsFailed(offer.id, publishResult.reason);
    attempts.delete(offer.id);
  } else {
    log.warn("Publicação falhou (tentativa #{}) — será re-tentado", {
      offerId: offer.id,
      attempt: entry.count,
      reason: publishResult.reason,
    });
  }
}

// ==============================================================
// Utilitários
// ==============================================================

const PLATFORM_MAP: Record<string, Platform> = {
  amazon: "amazon",
  shopee: "shopee",
  mercadolivre: "mercadolivre",
  aliexpress: "aliexpress",
};

function normalizePlatform(platform: string): Platform | null {
  const p = platform.toLowerCase();
  if (p in PLATFORM_MAP) return PLATFORM_MAP[p];
  if (p.includes("mercadolivre") || p.includes("meli.la")) return "mercadolivre";
  if (p.includes("amazon")) return "amazon";
  if (p.includes("shopee")) return "shopee";
  if (p.includes("aliexpress")) return "aliexpress";
  return null;
}