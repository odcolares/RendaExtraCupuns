/**
 * Módulo de Afiliados — barrel export + gerador unificado.
 *
 * Uso principal:
 *   const link = await generateAffiliateLink(url, "amazon");
 *   // ou:
 *   const platform = detectPlatform(url);
 *   const link = await generateAffiliateLink(url, platform);
 */

import { generateAmazonLink } from "./amazon";
import { generateAliExpressLink } from "./aliexpress";
import { generateShopeeLink } from "./shopee";
import { generateMercadoLivreLink } from "./mercadolivre";
import { createModuleLogger } from "../utils";
import type { AffiliateLink, Platform } from "./types";

const log = createModuleLogger("Affiliates");

export type { AffiliateLink, Platform };

export { generateAmazonLink } from "./amazon";
export { generateAliExpressLink } from "./aliexpress";
export { generateShopeeLink } from "./shopee";
export { generateMercadoLivreLink } from "./mercadolivre";
export {
  searchMercadoLivreProduct,
  cleanSearchQuery,
} from "./mercadolivre-search";
export type { MercadoLivreProduct } from "./mercadolivre-search";

// ==============================================================
// Gerador unificado
// ==============================================================

/**
 * Gera um link de afiliado para a plataforma especificada.
 * Roteia para o gerador correto via switch.
 *
 * @param url - URL original do produto
 * @param platform - Plataforma (amazon, aliexpress, shopee, mercadolivre)
 * @returns AffiliateLink ou null se falhar
 */
export async function generateAffiliateLink(
  url: string,
  platform: Platform
): Promise<AffiliateLink | null> {
  log.info("Gerando link de afiliado", { platform });

  try {
    let result: AffiliateLink | null = null;

    switch (platform) {
      case "amazon":
        result = await generateAmazonLink(url);
        break;
      case "aliexpress":
        result = await generateAliExpressLink(url);
        break;
      case "shopee":
        result = await generateShopeeLink(url);
        break;
      case "mercadolivre":
        result = await generateMercadoLivreLink(url);
        break;
      default:
        log.error("Plataforma não suportada", { platform });
        return null;
    }

    if (result) {
      log.info("Link de afiliado gerado", {
        platform,
        affiliate: result.affiliate,
      });
    } else {
      log.warn("Não foi possível gerar link", { platform });
    }

    return result;
  } catch (error) {
    log.error("Erro ao gerar link de afiliado", {
      error: (error as Error).message,
      platform,
    });
    return null;
  }
}

// ==============================================================
// Utilitários de plataforma
// ==============================================================

/**
 * Detecta a plataforma a partir de uma URL.
 */
export function detectPlatform(url: string): Platform | null {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("amazon")) return "amazon";
  if (lowerUrl.includes("aliexpress")) return "aliexpress";
  if (lowerUrl.includes("shopee")) return "shopee";
  if (
    lowerUrl.includes("mercadolivre") ||
    lowerUrl.includes("ml.uv") ||
    lowerUrl.includes("meli.la") ||
    lowerUrl.includes("mercadolibre")
  )
    return "mercadolivre";
  if (lowerUrl.includes("magalu") || lowerUrl.includes("magazine luiza"))
    return "magalu";

  return null;
}

/**
 * Verifica se uma plataforma tem programa de afiliados suportado.
 */
export function hasAffiliateProgram(platform: Platform): boolean {
  const programs: Platform[] = [
    "amazon",
    "aliexpress",
    "shopee",
    "mercadolivre",
    "magalu",
  ];
  return programs.includes(platform);
}
