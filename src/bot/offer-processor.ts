/**
 * OfferProcessor — Lógica de negócio isolada por tenant.
 *
 * Processa ofertas USANDO config do tenant (affiliateConfig, canales).
 * Sem estado — recebe tenant no construtor.
 */

import { Prisma } from "@/generated/prisma/client";
import { createModuleLogger } from "../utils";
import { extractOfferData } from "../whatsapp/extractor";
import { detectPlatform } from "../affiliates";
import { searchMercadoLivreProduct } from "../affiliates/mercadolivre-search";
import { buildTrackingUrl } from "../telegram/tracking";
import { extractCouponData } from "../coupons/detector";
import type { CouponData } from "../coupons/types";
import type { OfferData } from "../types";
import type { WhatsAppMessage, WhatsAppOfferData, ProcessResult } from "../whatsapp/types";
import type { Platform } from "../affiliates/types";
import type { ProcessedOffer, ManualOfferInput, TenantWithRelations } from "./types";
import { AffiliateLinkGenerator, NormalizedAffiliateConfig } from "./affiliate-generator";

const log = createModuleLogger("OfferProcessor");

// ==============================================================
// Helpers
// ==============================================================

function isShopeeCouponUrl(url: string): boolean {
  return /shopee\.com\.br\/m\/cupom-de-desconto\//i.test(url);
}

function isGenericProductName(name: string): boolean {
  // Nomes muito genéricos que provavelmente falham na busca
  const genericPatterns = [
    /^b[áa]sicas?\s+/i,
    /^promo[çc][ãa]o\s+/i,
    /^oferta\s+/i,
    /^desconto\s+/i,
    /^imperd[ií]vel\s+/i,
    /^super\s+oferta/i,
  ];
  return genericPatterns.some(p => p.test(name.trim()));
}

function isMismatchedProduct(
  originalPrice: number | null,
  mlPrice: number | null,
  originalName: string,
  mlName: string
): boolean {
  if (originalPrice && mlPrice && originalPrice > 0 && mlPrice > 0) {
    const ratio = Math.max(originalPrice, mlPrice) / Math.min(originalPrice, mlPrice);
    if (ratio > 5) return true;
  }
  return false;
}

// ==============================================================
// OfferProcessor Class
// ==============================================================

export class OfferProcessor {
  private tenant: TenantWithRelations;
  private affiliateGenerator: AffiliateLinkGenerator;
  private telegramChannelId: string | null = null;

  constructor(tenant: TenantWithRelations) {
    this.tenant = tenant;

    // Normaliza config de afiliado
    const normalizedConfig: NormalizedAffiliateConfig | null = tenant.affiliateConfig ? {
      amazon: tenant.affiliateConfig.amazonTag ? {
        tag: tenant.affiliateConfig.amazonTag,
        marketplace: process.env.AMAZON_MARKETPLACE || "www.amazon.com.br",
      } : undefined,
      aliexpress: tenant.affiliateConfig.aliexpressId ? {
        affiliateId: tenant.affiliateConfig.aliexpressId,
      } : undefined,
      shopee: tenant.affiliateConfig.shopeeId ? {
        affiliateId: tenant.affiliateConfig.shopeeId,
      } : undefined,
      mercadolivre: tenant.affiliateConfig.mlId ? {
        affiliateId: tenant.affiliateConfig.mlId,
        accessToken: process.env.ML_ACCESS_TOKEN || "",
      } : undefined,
    } : null;

    this.affiliateGenerator = new AffiliateLinkGenerator(normalizedConfig);

    // Encontra canal Telegram ativo
    const telegramChannel = tenant.channels.find(
      c => c.platform === "telegram" && c.isActive
    );
    this.telegramChannelId = telegramChannel?.channelId || null;
  }

  /**
   * Pipeline completo: raw message → oferta processada → salva no DB → retorna resultado
   */
  async process(message: WhatsAppMessage): Promise<ProcessResult> {
    const messageText = message.body || "";
    const urls = this.extractUrls(messageText);
    const sourceId = message.from;

    log.info("Iniciando pipeline", {
      tenantId: this.tenant.id,
      urlsFound: urls.length,
      sourceId,
    });

    for (const url of urls) {
      const result = await this.processSingleUrl(messageText, url, sourceId);
      if (result.success) {
        return result;
      }
    }

    return { success: false, error: "Nenhuma URL processada com sucesso" };
  }

  /**
   * Processa uma única URL extraída da mensagem
   */
  private async processSingleUrl(
    messageText: string,
    url: string,
    sourceId?: string
  ): Promise<ProcessResult> {
    // ── 1. Verificar duplicata ──
    if (await this.isDuplicate(url)) {
      log.warn("Oferta duplicada ignorada", { tenantId: this.tenant.id, url });
      return { success: false, error: "duplicate" };
    }

    const extractedForDedup = extractOfferData(messageText, url);
    if (await this.isDuplicateByName(extractedForDedup.name)) {
      log.warn("Oferta duplicada por nome ignorada", {
        tenantId: this.tenant.id,
        name: extractedForDedup.name.substring(0, 60),
      });
      return { success: false, error: "duplicate" };
    }

    // ── 2. Extrair dados da oferta ──
    const offerData: WhatsAppOfferData = extractOfferData(messageText, url);

    // Enriquecer nome genérico
    if (isGenericProductName(offerData.name) && url) {
      log.info("Nome genérico detectado, buscando nome oficial via URL", {
        tenantId: this.tenant.id,
        nomeAtual: offerData.name.substring(0, 50),
      });
      const productInfo = await this.fetchProductInfo(url);
      if (productInfo.name) {
        log.info("Nome enriquecido via URL", {
          tenantId: this.tenant.id,
          antes: offerData.name.substring(0, 50),
          depois: productInfo.name.substring(0, 50),
        });
        offerData.name = productInfo.name;
      }
    }

    log.info("Dados extraídos", {
      tenantId: this.tenant.id,
      produto: offerData.name,
      plataforma: offerData.platform,
      preco: offerData.currentPrice,
      temImagem: !!offerData.imageUrl,
    });

    // ── 3. Detectar plataforma ──
    const platform = detectPlatform(url);
    if (!platform) {
      log.warn("Plataforma não reconhecida, salvando mesmo assim", { tenantId: this.tenant.id, url });
    }
    const effectivePlatform = (platform || offerData.platform) as Platform | null;

    // ── 4. Detectar URL de cupom Shopee ──
    const isCouponUrl = isShopeeCouponUrl(url);
    if (isCouponUrl) {
      log.info("URL de cupom Shopee detectada — pulando link de produto", { tenantId: this.tenant.id, url });
    }

    // ── 5. Gerar link de afiliado ──
    let affiliateLink: string | null = null;

    if (effectivePlatform && !isCouponUrl) {
      try {
        const linkResult = await this.affiliateGenerator.generate(effectivePlatform, url);
        if (linkResult) {
          affiliateLink = linkResult.affiliate;
          log.info("Link de afiliado gerado", { tenantId: this.tenant.id, link: affiliateLink });
        }
      } catch (err) {
        log.error("Erro na geração de link de afiliado", {
          tenantId: this.tenant.id,
          error: (err as Error).message,
        });
      }
    }

    // ── 6. Fallback: buscar no ML pelo nome ──
    if (!affiliateLink && effectivePlatform === "mercadolivre" && offerData.name) {
      log.info("Tentando buscar produto no ML pelo nome", {
        tenantId: this.tenant.id,
        produto: offerData.name.substring(0, 60),
      });

      try {
        const searchResult = await searchMercadoLivreProduct(offerData.name);

        if (searchResult) {
          log.info("Produto encontrado no ML via busca", {
            tenantId: this.tenant.id,
            id: searchResult.id,
            title: searchResult.title.substring(0, 60),
            mlPrice: searchResult.price,
          });

          const shouldSkip = isMismatchedProduct(
            offerData.currentPrice,
            searchResult.price,
            offerData.name,
            searchResult.title
          );

          if (shouldSkip) {
            log.warn("Produto do ML não corresponde à oferta — ignorando", {
              tenantId: this.tenant.id,
              originalProduct: offerData.name.substring(0, 40),
              mlProduct: searchResult.title.substring(0, 40),
              originalPrice: offerData.currentPrice,
              mlPrice: searchResult.price,
            });
          } else {
            // Atualiza dados com info do produto REAL do ML
            offerData.name = searchResult.title;
            if (searchResult.price) offerData.currentPrice = searchResult.price;
            if (!offerData.imageUrl && searchResult.imageUrl) offerData.imageUrl = searchResult.imageUrl;

            const mlAffiliateId = this.tenant.affiliateConfig?.mlId || process.env.MERCADOLIVRE_AFFILIATE_ID;
            if (mlAffiliateId && searchResult.permalink) {
              const separator = searchResult.permalink.includes("?") ? "&" : "?";
              affiliateLink = `${searchResult.permalink}${separator}matt_tool=${mlAffiliateId}`;
              log.info("Link de afiliado gerado via busca no ML", {
                tenantId: this.tenant.id,
                link: affiliateLink,
              });
            }
          }
        }
      } catch (err) {
        log.error("Erro na busca de produto no ML", {
          tenantId: this.tenant.id,
          error: (err as Error).message,
        });
      }
    }

    // ── 7. Fallback: cupom promocional ──
    let couponData: CouponData | null = null;
    if (!affiliateLink) {
      try {
        couponData = extractCouponData(messageText, url);
        if (couponData) {
          log.info("Cupom detectado na mensagem", {
            tenantId: this.tenant.id,
            code: couponData.code,
            discount: couponData.discount,
            platform: couponData.platform,
          });
        }
      } catch (err) {
        log.error("Erro ao detectar cupom", {
          tenantId: this.tenant.id,
          error: (err as Error).message,
        });
      }
    }

    // ── 8. Salvar no banco ──
    let dbId: string | null = null;
    let couponOffer: OfferData | null = null;
    const source = sourceId ? "whatsapp" : "cli";

    if (couponData) {
      couponOffer = {
        name: `CUPOM ${couponData.discount} — ${couponData.code}`,
        originalPrice: null,
        currentPrice: null,
        discount: couponData.discountValue,
        platform: `cupom:${couponData.platformKey}`,
        originalUrl: couponData.sourceUrl,
        description: `Cupom ${couponData.discount} | Código: ${couponData.code}${
          couponData.limit !== null ? ` | Limite: R$ ${couponData.limit}` : ""
        }`,
        source,
      };

      dbId = await this.insertOffer(couponOffer, undefined);
    } else {
      const offerForDb: OfferData = {
        name: offerData.name,
        originalPrice: offerData.originalPrice,
        currentPrice: offerData.currentPrice,
        discount: offerData.discount,
        platform: offerData.platform,
        originalUrl: url,
        imageUrl: offerData.imageUrl,
        source,
      };

      dbId = await this.insertOffer(offerForDb, affiliateLink || undefined);

      if (dbId && affiliateLink) {
        await this.updateAffiliateLink(dbId, affiliateLink);
      }
    }

    // ── 9. Publicar no Telegram ──
    let published = false;
    if (dbId && affiliateLink) {
      try {
        const processedOffer: ProcessedOffer = {
          ...offerData,
          affiliateLink,
          trackingUrl: buildTrackingUrl(dbId),
          tenantId: this.tenant.id,
        };

        published = await this.publishToTelegram(processedOffer);
        if (published) {
          await this.markAsPublished(dbId);
          if (sourceId) await this.incrementFontePublished(sourceId);
        }
      } catch (err) {
        log.error("Erro ao publicar no Telegram", {
          tenantId: this.tenant.id,
          error: (err as Error).message,
        });
      }
    } else if (dbId && couponData) {
      try {
        published = await this.publishCoupon(couponData, buildTrackingUrl(dbId));
        if (published) {
          await this.markAsPublished(dbId);
          if (sourceId) await this.incrementFontePublished(sourceId);
        }
      } catch (err) {
        log.error("Erro ao publicar cupom", {
          tenantId: this.tenant.id,
          error: (err as Error).message,
        });
      }
    }

    if (couponData) {
      return {
        success: true,
        offer: { ...couponOffer!, rawMessage: messageText } as import("../whatsapp/types").WhatsAppOfferData,
        dbId: dbId ?? undefined,
      };
    }

    return {
      success: true,
      offer: {
        ...offerData,
        affiliateLink: affiliateLink || undefined,
        trackingUrl: dbId ? buildTrackingUrl(dbId) : undefined,
        tenantId: this.tenant.id,
      } as ProcessedOffer,
      dbId: dbId ?? undefined,
    };
  }

  /**
   * Publica oferta manual (via dashboard)
   */
  async processManual(input: ManualOfferInput): Promise<ProcessResult> {
    log.info("Processando oferta manual", { tenantId: this.tenant.id, name: input.name });

    const platform = detectPlatform(input.originalUrl);
    const effectivePlatform = (platform || input.platform) as Platform | null;

    let affiliateLink: string | null = null;
    if (effectivePlatform) {
      try {
        const linkResult = await this.affiliateGenerator.generate(effectivePlatform, input.originalUrl);
        if (linkResult) affiliateLink = linkResult.affiliate;
      } catch (err) {
        log.error("Erro gerando link para oferta manual", {
          tenantId: this.tenant.id,
          error: (err as Error).message,
        });
      }
    }

    const offerForDb: OfferData = {
      name: input.name,
      originalPrice: input.originalPrice,
      currentPrice: input.currentPrice,
      discount: input.discount,
      platform: input.platform,
      originalUrl: input.originalUrl,
      imageUrl: input.imageUrl,
      description: input.description,
      source: "web",
    };

    const dbId = await this.insertOffer(offerForDb, affiliateLink || undefined);

    if (dbId && affiliateLink) {
      await this.updateAffiliateLink(dbId, affiliateLink);
    }

    if (dbId && affiliateLink) {
      const processedOffer: ProcessedOffer = {
        ...offerForDb,
        affiliateLink,
        trackingUrl: buildTrackingUrl(dbId),
        tenantId: this.tenant.id,
      };

      const published = await this.publishToTelegram(processedOffer);
      if (published) {
        await this.markAsPublished(dbId);
      }

      return {
        success: true,
        offer: processedOffer,
        dbId,
      };
    }

    return { success: false, error: "Falha ao processar oferta manual" };
  }

  // ==================== Helpers de banco (delegam para database/offers.ts adaptado) ====================

  private async insertOffer(offer: OfferData, affiliateLink?: string): Promise<string | null> {
    const { prisma } = await import("../lib/prisma");

    // Verificar duplicata
    if (await this.isDuplicate(offer.originalUrl || "")) {
      return null;
    }

    const created = await prisma.offer.create({
      data: {
        title: offer.name,
        description: offer.description ?? null,
        url: affiliateLink || offer.originalUrl || "",
        platform: this.mapPlatform(offer.platform),
        price: offer.currentPrice ?? null,
        originalPrice: offer.originalPrice ?? null,
        discount: offer.discount ?? null,
        imageUrl: offer.imageUrl ?? null,
        status: "pending",
        source: offer.source ?? null,
        tenantId: this.tenant.id,
      },
    });

    log.info("Oferta inserida no Turso", { tenantId: this.tenant.id, id: created.id, produto: offer.name });
    return created.id;
  }

  private async isDuplicate(url: string): Promise<boolean> {
    if (!url) return false;

    const { prisma } = await import("../lib/prisma");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.offer.count({
      where: {
        tenantId: this.tenant.id,
        url,
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    return count > 0;
  }

  private async isDuplicateByName(name: string): Promise<boolean> {
    if (!name || name.trim().length === 0) return false;

    const { prisma } = await import("../lib/prisma");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.offer.count({
      where: {
        tenantId: this.tenant.id,
        title: { equals: name },
        createdAt: { gte: today, lt: tomorrow },
      },
    });

    return count > 0;
  }

  private async markAsPublished(offerId: string): Promise<void> {
    const { prisma } = await import("../lib/prisma");
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "published", publishedAt: new Date() },
    });
  }

  private async updateAffiliateLink(offerId: string, link: string): Promise<void> {
    const { prisma } = await import("../lib/prisma");
    await prisma.offer.update({
      where: { id: offerId },
      data: { url: link },
    });
  }

  private async incrementFontePublished(sourceId: string): Promise<void> {
    const { prisma } = await import("../lib/prisma");
    await prisma.fonte.updateMany({
      where: { tenantId: this.tenant.id, url: sourceId },
      data: { totalOffersPublished: { increment: 1 } },
    });
  }

  private async publishToTelegram(offer: ProcessedOffer): Promise<boolean> {
    if (!this.telegramChannelId) {
      log.warn("Nenhum canal Telegram configurado", { tenantId: this.tenant.id });
      return false;
    }

    const { publishOffer } = await import("../telegram/publisher");
    const { getBot } = await import("../telegram/bot");

    const bot = getBot();
    if (!bot) {
      log.error("Bot Telegram não inicializado");
      return false;
    }

    // Usa o publisher existente mas com canal do tenant
    const result = await publishOffer(offer, offer.trackingUrl, this.telegramChannelId);
    return result.success;
  }

  private async publishCoupon(coupon: CouponData, trackingUrl: string): Promise<boolean> {
    if (!this.telegramChannelId) return false;

    const { publishCoupon } = await import("../telegram/publisher");
    return publishCoupon(coupon, this.telegramChannelId, trackingUrl);
  }

  private async fetchProductInfo(url: string): Promise<import("../utils/product-fetcher").FetchedProductInfo> {
    const { fetchProductInfo } = await import("../utils/product-fetcher");
    return fetchProductInfo(url);
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  private mapPlatform(platform: string): "amazon" | "shopee" | "mercadolivre" | "aliexpress" | "outros" {
    const p = platform.toLowerCase();
    if (p.includes("amazon")) return "amazon";
    if (p.includes("shopee")) return "shopee";
    if (p.includes("mercadolivre") || p.includes("ml.uv") || p.includes("meli.la")) return "mercadolivre";
    if (p.includes("aliexpress")) return "aliexpress";
    return "outros";
  }
}