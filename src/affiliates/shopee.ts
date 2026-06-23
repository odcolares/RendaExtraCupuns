/**
 * Gerador de link de afiliado da Shopee.
 *
 * Extrai shopId e itemId da URL e monta o link no formato:
 *   https://shopee.com.br/product/{shopId}/{itemId}?af_id={SHOPEE_AFFILIATE_ID}
 *
 * Se SHOPEE_AFFILIATE_ID não estiver configurado, gera o link
 * base do produto sem parâmetro de afiliado — o pipeline continua
 * funcionando, e o link pode ser atualizado depois.
 *
 * URLs encurtadas (s.shopee.com.br, shope.ee, shp.ee) são
 * resolvidas via redirect HTTP para obter a URL real do produto.
 */

import axios from "axios";
import { createModuleLogger } from "../utils";
import type { AffiliateLink } from "./types";

const log = createModuleLogger("AffiliateShopee");

/**
 * Gera um link de afiliado da Shopee.
 * Retorna null se os dados do produto não forem encontrados na URL.
 *
 * Se o affiliate ID não estiver configurado, retorna o link direto
 * do produto (sem afiliação) para não travar o pipeline.
 */
export async function generateShopeeLink(
  productUrl: string
): Promise<AffiliateLink | null> {
  try {
    // ── Resolver URL encurtada (ex: s.shopee.com.br) ──
    const resolvedUrl = await resolveShortUrl(productUrl);

    const productData = extractProductData(resolvedUrl);

    if (!productData) {
      log.warn("Dados do produto não encontrados na URL", {
        original: productUrl,
        resolvida: resolvedUrl,
      });
      return null;
    }

    const affiliateId = process.env.SHOPEE_AFFILIATE_ID;

    let affiliateUrl: string;
    if (affiliateId) {
      affiliateUrl = `https://shopee.com.br/product/${productData.shopId}/${productData.itemId}?af_id=${affiliateId}`;
      log.info("Link Shopee gerado com afiliação", {
        shopId: productData.shopId,
        itemId: productData.itemId,
      });
    } else {
      // Sem ID de afiliado: retorna o link direto do produto
      // para não travar o pipeline. Configure SHOPEE_AFFILIATE_ID
      // no .env quando tiver a conta de afiliado.
      affiliateUrl = resolvedUrl;
      log.warn("SHOPEE_AFFILIATE_ID não configurado — usando link direto", {
        productId: `${productData.shopId}/${productData.itemId}`,
        hint: "Defina SHOPEE_AFFILIATE_ID no .env para gerar link de afiliado",
      });
    }

    const result: AffiliateLink = {
      original: productUrl,
      affiliate: affiliateUrl,
      platform: "shopee",
      shopId: productData.shopId,
      itemId: productData.itemId,
    };

    return result;
  } catch (error) {
    log.error("Erro ao gerar link Shopee", {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Resolve URLs encurtadas da Shopee seguindo redirects HTTP.
 * Se a URL já é direta (product/...), retorna ela mesma.
 */
async function resolveShortUrl(url: string): Promise<string> {
  // Se já parece uma URL direta de produto, não precisa resolver
  if (/\/product\/\d+\/\d+/.test(url) || /-i\.\d+\.\d+/.test(url)) {
    return url;
  }

  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      timeout: 10000,
      responseType: "text",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Pega a URL final após redirects
    const finalUrl = response.request?.res?.responseUrl
      || response.request?._redirectable?._currentUrl
      || url;

    if (finalUrl && finalUrl !== url) {
      log.info("URL encurtada resolvida", { original: url, final: finalUrl });
      return finalUrl;
    }

    return url;
  } catch (err) {
    log.warn("Falha ao resolver URL encurtada, usando original", {
      url,
      error: (err as Error).message,
    });
    return url;
  }
}

/**
 * Extrai shopId e itemId de uma URL da Shopee.
 * Formato: /product/{shopId}/{itemId}
 */
export function extractProductData(
  url: string
): { shopId: string; itemId: string } | null {
  const patterns = [
    // /product/{shopId}/{itemId}
    /\/product\/(\d+)\/(\d+)/i,
    // /{product-name}-i.{shopId}.{itemId}
    /-i\.(\d+)\.(\d+)(?:\?|$|[/#])/i,
    // /{text}/{sellerId}/{itemId}? (formato: /opaanlp/1597425469/58205784410?params)
    /\/(?:[^/]+\/)?(\d+)\/(\d+)(?:\?|&|$|[/#])/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        shopId: match[1],
        itemId: match[2],
      };
    }
  }

  return null;
}
