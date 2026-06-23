/**
 * Gerador de link de afiliado do Mercado Livre.
 *
 * Extrai o product ID da URL e monta o link no formato:
 *   https://www.mercadolivre.com.br/produto/{id}?matt_tool={MERCadolivre_AFFILIATE_ID}
 *
 * Suporta URLs completas e encurtadas (meli.la, ML.B, meu.ml.uv).
 */

import axios from "axios";
import { createModuleLogger } from "../utils";
import type { AffiliateLink } from "./types";

const log = createModuleLogger("AffiliateMercadoLivre");

/**
 * Gera um link de afiliado do Mercado Livre.
 * Retorna null se o product ID não for encontrado.
 *
 * Para URLs encurtadas (meli.la, meu.ml.uv), resolve o redirect
 * automaticamente para extrair o product ID.
 */
export async function generateMercadoLivreLink(
  productUrl: string
): Promise<AffiliateLink | null> {
  try {
    // Se for URL encurtada, resolve o redirect primeiro
    let urlToExtract = productUrl;
    if (isShortUrl(productUrl)) {
      const resolved = await resolveShortUrl(productUrl);
      if (resolved) {
        urlToExtract = resolved;
        // Verificar se a URL resolvida é de produto ou social
        if (urlToExtract.includes("/social/")) {
          log.warn("URL redireciona para página social do ML, não para produto", {
            url: productUrl,
            resolved: urlToExtract.substring(0, 80),
          });
          return null;
        }
      }
    }

    const productId = extractProductId(urlToExtract);

    if (!productId) {
      log.warn("Product ID não encontrado na URL", { url: productUrl });
      return null;
    }

    const affiliateId = process.env.MERCADOLIVRE_AFFILIATE_ID;

    if (!affiliateId) {
      log.error("MERCADOLIVRE_AFFILIATE_ID não definido no .env");
      return null;
    }

    const affiliateUrl = `https://www.mercadolivre.com.br/p/MLB${productId}?matt_tool=${affiliateId}`;

    const result: AffiliateLink = {
      original: productUrl,
      affiliate: affiliateUrl,
      platform: "mercadolivre",
      productId,
    };

    log.info("Link Mercado Livre gerado", { productId });
    return result;
  } catch (error) {
    log.error("Erro ao gerar link Mercado Livre", {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Resolve URLs encurtadas do Mercado Livre (meli.la, ML.B, meu.ml.uv)
 * seguindo o redirect HTTP para obter a URL completa do produto.
 *
 * IMPORTANTE: URLs do Kotas (meli.la) redirecionam para a página social
 * do clube (mercadolivre.com.br/social/clubekotas), NÃO para uma página
 * de produto individual. Nesses casos, não é possível gerar link de afiliado.
 *
 * Usa http.get() nativo para seguir redirects manualmente.
 *
 * @param url - URL encurtada do Mercado Livre
 * @returns URL completa após redirects, ou null se não conseguir resolver
 */
function resolveShortUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const http = url.startsWith("https") ? require("https") : require("http");

    const follow = (currentUrl: string, depth: number) => {
      if (depth > 5) {
        log.warn("Muitos redirects ao resolver URL", { url: currentUrl });
        resolve(null);
        return;
      }

      const parsed = new URL(currentUrl);
      const opts = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      };

      const req = http.request(opts, (res: any) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          // Seguir redirect
          const nextUrl = res.headers.location.startsWith("http")
            ? res.headers.location
            : `${parsed.origin}${res.headers.location}`;
          log.info("Redirect seguido", {
            from: currentUrl,
            to: nextUrl.substring(0, 80),
          });
          follow(nextUrl, depth + 1);
        } else {
          // URL final (não é redirect)
          res.resume(); // Consumir resposta
          if (currentUrl !== url) {
            log.info("URL encurtada resolvida", {
              original: url,
              final: currentUrl.substring(0, 100),
            });
          }
          resolve(currentUrl);
        }
      });

      req.on("error", (err: Error) => {
        log.warn("Erro ao resolver URL encurtada", {
          url,
          error: err.message,
        });
        resolve(null);
      });

      req.end();
    };

    follow(url, 0);
  });
}

/**
 * Verifica se a URL é encurtada (precisa de resolução).
 */
function isShortUrl(url: string): boolean {
  return /https?:\/\/(?:meli\.la|meu\.ml(?:\.uv)?)\//i.test(url);
}

/**
 * Extrai o product ID de uma URL do Mercado Livre.
 * Formatos: /produto/{id}, /product/{id}, MLB-{id}, MLB{id}
 *
 * Nota: Para URLs encurtadas (meli.la), o redirect é resolvido
 * em generateMercadoLivreLink antes de chamar esta função.
 */
export function extractProductId(url: string): string | null {
  const patterns = [
    /\/produto\/(\d+)/i,
    /\/product\/(\d+)/i,
    /MLB-?(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}
