/**
 * AffiliateLinkGenerator — Gera links de afiliado usando config do tenant.
 *
 * Recebe AffiliateConfig do tenant no construtor.
 * Fallback graceful: sem ID configurado → link direto (não trava pipeline).
 */

import { createModuleLogger } from "../utils";
import type { Platform, AffiliateLink } from "../affiliates/types";
import { generateAmazonLink } from "../affiliates/amazon";
import { generateAliExpressLink } from "../affiliates/aliexpress";
import { generateShopeeLink } from "../affiliates/shopee";
import { generateMercadoLivreLink } from "../affiliates/mercadolivre";

// Config normalizada (sem id/tenantId do Prisma)
export interface NormalizedAffiliateConfig {
  amazon?: { tag: string; marketplace: string };
  aliexpress?: { affiliateId: string };
  shopee?: { affiliateId: string };
  mercadolivre?: { affiliateId: string; accessToken: string };
}

const log = createModuleLogger("AffiliateLinkGenerator");

// ==============================================================
// AffiliateLinkGenerator Class
// ==============================================================

export class AffiliateLinkGenerator {
  private config: NormalizedAffiliateConfig | null;

  constructor(config: NormalizedAffiliateConfig | null) {
    this.config = config;
  }

  /**
   * Gera link de afiliado para a plataforma especificada.
   * Fallback: se não tem config → retorna link original (graceful).
   */
  async generate(platform: Platform, productIdOrUrl: string): Promise<AffiliateLink | null> {
    log.info("Gerando link de afiliado", { tenantPlatform: platform, hasConfig: !!this.config });

    if (!this.config) {
      log.warn("Sem config de afiliado — retornando link original (graceful fallback)", {
        platform,
      });
      return { original: productIdOrUrl, affiliate: productIdOrUrl, platform };
    }

    try {
      let result: AffiliateLink | null = null;

      switch (platform) {
        case "amazon":
          result = await this.generateAmazon(productIdOrUrl);
          break;
        case "aliexpress":
          result = await this.generateAliExpress(productIdOrUrl);
          break;
        case "shopee":
          result = await this.generateShopee(productIdOrUrl);
          break;
        case "mercadolivre":
          result = await this.generateMercadoLivre(productIdOrUrl);
          break;
        default:
          log.error("Plataforma não suportada", { platform });
          return { original: productIdOrUrl, affiliate: productIdOrUrl, platform };
      }

      if (result) {
        log.info("Link de afiliado gerado", { platform, affiliate: result.affiliate });
      } else {
        log.warn("Não foi possível gerar link — fallback para original", { platform });
        return { original: productIdOrUrl, affiliate: productIdOrUrl, platform };
      }

      return result;
    } catch (error) {
      log.error("Erro ao gerar link de afiliado", {
        error: (error as Error).message,
        platform,
      });
      // Graceful fallback: retorna link original em caso de erro
      return { original: productIdOrUrl, affiliate: productIdOrUrl, platform };
    }
  }

  // ==================== Geradores por plataforma ====================

  private async generateAmazon(urlOrAsin: string): Promise<AffiliateLink | null> {
    if (!this.config?.amazon) return null;

    try {
      const result = await generateAmazonLink(urlOrAsin, {
        tag: this.config.amazon.tag,
        marketplace: this.config.amazon.marketplace,
      });
      return result;
    } catch (error) {
      log.error("Erro ao gerar link Amazon", { error: (error as Error).message });
      return null;
    }
  }

  private async generateAliExpress(url: string): Promise<AffiliateLink | null> {
    if (!this.config?.aliexpress) return null;

    try {
      const result = await generateAliExpressLink(url, {
        affiliateId: this.config.aliexpress.affiliateId,
      });
      return result;
    } catch (error) {
      log.error("Erro ao gerar link AliExpress", { error: (error as Error).message });
      return null;
    }
  }

  private async generateShopee(url: string): Promise<AffiliateLink | null> {
    if (!this.config?.shopee) return null;

    try {
      const result = await generateShopeeLink(url, {
        affiliateId: this.config.shopee.affiliateId,
      });
      return result;
    } catch (error) {
      log.error("Erro ao gerar link Shopee", { error: (error as Error).message });
      return null;
    }
  }

  private async generateMercadoLivre(url: string): Promise<AffiliateLink | null> {
    if (!this.config?.mercadolivre) return null;

    try {
      const result = await generateMercadoLivreLink(url, {
        affiliateId: this.config.mercadolivre.affiliateId,
        accessToken: this.config.mercadolivre.accessToken,
      });
      return result;
    } catch (error) {
      log.error("Erro ao gerar link Mercado Livre", { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Verifica se uma plataforma tem config válida
   */
  hasConfig(platform: Platform): boolean {
    if (!this.config) return false;

    switch (platform) {
      case "amazon":
        return !!this.config.amazon?.tag;
      case "aliexpress":
        return !!this.config.aliexpress?.affiliateId;
      case "shopee":
        return !!this.config.shopee?.affiliateId;
      case "mercadolivre":
        return !!this.config.mercadolivre?.affiliateId;
      default:
        return false;
    }
  }

  /**
   * Retorna lista de plataformas com config válida
   */
  getConfiguredPlatforms(): Platform[] {
    const platforms: Platform[] = [];
    if (this.hasConfig("amazon")) platforms.push("amazon");
    if (this.hasConfig("aliexpress")) platforms.push("aliexpress");
    if (this.hasConfig("shopee")) platforms.push("shopee");
    if (this.hasConfig("mercadolivre")) platforms.push("mercadolivre");
    return platforms;
  }
}