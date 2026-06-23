/**
 * Gerador de link de afiliado do AliExpress.
 *
 * Extrai o product ID da URL e monta o link no formato:
 *   https://s.click.aliexpress.com/e/_AXQ7a9M?productId={id}&aff_id={ALIEXPRESS_AFFILIATE_ID}
 *
 * Se ALIEXPRESS_AFFILIATE_ID não estiver configurado, gera o link
 * base do produto sem parâmetro de afiliado — o pipeline continua
 * funcionando, e o link pode ser atualizado depois.
 */

import axios from "axios";
import { createModuleLogger } from "../utils";
import type { AffiliateLink } from "./types";

const log = createModuleLogger("AffiliateAliExpress");

/**
 * Gera um link de afiliado do AliExpress.
 * Retorna null se o product ID não for encontrado na URL.
 *
 * Se o affiliate ID não estiver configurado, retorna o link direto
 * do produto (sem afiliação) para não travar o pipeline.
 */
export async function generateAliExpressLink(
  productUrl: string
): Promise<AffiliateLink | null> {
  try {
    // ── Resolver URL encurtada (ex: s.click.aliexpress.com/e/_XXXXX) ──
    const resolvedUrl = await resolveAliExpressShortUrl(productUrl);

    const productId = extractProductId(resolvedUrl);

    if (!productId) {
      log.warn("Product ID não encontrado na URL", {
        original: productUrl,
        resolvida: resolvedUrl,
      });
      return null;
    }

    const affiliateId = process.env.ALIEXPRESS_AFFILIATE_ID;

    let affiliateUrl: string;
    if (affiliateId) {
      affiliateUrl = `https://s.click.aliexpress.com/e/_AXQ7a9M?productId=${productId}&aff_id=${affiliateId}`;
      log.info("Link AliExpress gerado com afiliação", { productId });
    } else {
      // Sem ID de afiliado: retorna o link direto do produto
      // para não travar o pipeline. Configure ALIEXPRESS_AFFILIATE_ID
      // no .env quando tiver a conta de afiliado.
      affiliateUrl = resolvedUrl;
      log.warn("ALIEXPRESS_AFFILIATE_ID não configurado — usando link direto", {
        productId,
        hint: "Defina ALIEXPRESS_AFFILIATE_ID no .env para gerar link de afiliado",
      });
    }

    const result: AffiliateLink = {
      original: productUrl,
      affiliate: affiliateUrl,
      platform: "aliexpress",
      productId,
    };

    return result;
  } catch (error) {
    log.error("Erro ao gerar link AliExpress", {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Resolve URLs encurtadas do AliExpress seguindo redirects HTTP.
 * Se a URL já é direta (item/XXXX.html), retorna ela mesma.
 */
async function resolveAliExpressShortUrl(url: string): Promise<string> {
  // Se já parece uma URL direta de produto, não precisa resolver
  if (/\/item\/\d+\.html/.test(url) || /\/product\/\d+/.test(url)) {
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

    const finalUrl = response.request?.res?.responseUrl
      || response.request?._redirectable?._currentUrl
      || url;

    if (finalUrl && finalUrl !== url) {
      log.info("URL AliExpress encurtada resolvida", { original: url, final: finalUrl });
      return finalUrl;
    }

    return url;
  } catch (err) {
    log.warn("Falha ao resolver URL AliExpress, usando original", {
      url,
      error: (err as Error).message,
    });
    return url;
  }
}

/**
 * Extrai o product ID de uma URL do AliExpress.
 * Formatos: /item/{id}.html, /product/{id}, productId={id}
 */
export function extractProductId(url: string): string | null {
  const patterns = [
    /\/item\/(\d+)\.html/i,
    /\/product\/(\d+)/i,
    /productId=(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
