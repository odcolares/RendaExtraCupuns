/**
 * Gerador de link de afiliado da Amazon.
 *
 * Extrai o ASIN da URL e monta o link no formato:
 *   https://{marketplace}/dp/{ASIN}?tag={AMAZON_AFFILIATE_TAG}
 *
 * - Resolve encurtadores (amzn.to, link.amazon) via redirect
 * - Valida se o produto existe (HTTP 200) antes de gerar o link
 * - Links 404 (produto expirado) são rejeitados
 */

import axios from "axios";
import { createModuleLogger } from "../utils";
import type { AffiliateLink } from "./types";

const log = createModuleLogger("AffiliateAmazon");

/** Regex para detectar encurtadores Amazon */
const SHORT_URL_RE = /https?:\/\/(?:amzn\.to|link\.amazon)\//;

/**
 * Segue redirects de encurtadores Amazon (amzn.to, link.amazon)
 * para obter a URL real contendo o ASIN.
 *
 * NOTA: amzn.to retorna HTTP 202 (Accepted) com uma página
 * intermediária contendo redirect via HTML/meta refresh.
 * O axios não segue isso automaticamente, então fazemos uma
 * segunda requisição para capturar a URL final.
 */
async function resolveShortUrl(url: string): Promise<string> {
  if (!SHORT_URL_RE.test(url)) return url;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,*/*;q=0.8",
      },
      timeout: 8000,
      maxRedirects: 5,
    });

    // Tenta extrair a URL final de várias fontes possíveis
    const finalUrl =
      // axios 1.x com follow-redirects
      (response as any).responseUrl ||
      // axios >= 1.7 com transition
      (response.request as any)?.res?.responseUrl ||
      // fallback para axios mais antigos
      (response.request as any)?._currentUrl ||
      url;

    // Se a URL final ainda for encurtada ou for genérica (amazon.com/)
    // tenta extrair do HTML body via meta refresh
    if (
      finalUrl === url ||
      /^https:\/\/(?:www\.)?amazon\.com(?:\.\w{2})?\/?$/.test(finalUrl)
    ) {
      const html = typeof response.data === "string" ? response.data : "";
      if (html) {
        // Procura por meta refresh: <meta http-equiv="refresh" content="0;url=...">
        const metaMatch = html.match(
          /<meta\s+http-equiv=["']refresh["']\s+content=["']\d*;url=['"]?([^'">\s]+)/
        );
        if (metaMatch) {
          const metaUrl = metaMatch[1];
          log.info("URL extraída de meta refresh", {
            original: url.substring(0, 40),
            final: metaUrl.substring(0, 60),
          });
          return metaUrl;
        }
      }
    }

    if (finalUrl !== url) {
      log.info("Link curto resolvido", {
        original: url.substring(0, 40),
        final: finalUrl.substring(0, 60),
      });
    }
    return finalUrl;
  } catch (err: any) {
    // Se for erro de rede/timeout, tenta com http.get() nativo
    // que segue redirects de forma mais agressiva
    if (err?.code === "ENOTFOUND" || err?.code === "ETIMEDOUT" || err?.code === "ECONNREFUSED") {
      log.warn("Rede indisponível ao resolver link curto", { url: url.substring(0, 40) });
      return url;
    }

    log.warn("Falha ao resolver link curto, usando original", {
      url: url.substring(0, 40),
      error: err?.message?.substring(0, 80),
    });
    return url;
  }
}

/**
 * Valida se o link do produto está acessível (HTTP 200).
 * Retorna true se OK, false se 404.
 */
async function validateAffiliateLink(url: string): Promise<boolean> {
  try {
    await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      timeout: 5000,
      maxRedirects: 3,
      validateStatus: (status) => status < 400,
    });
    return true;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      log.warn("Produto não encontrado (404)", { url: url.substring(0, 60) });
      return false;
    }
    // Erro de rede/timeout → não bloqueia
    log.warn("Validação falhou por erro externo, prosseguindo", {
      error: error?.message?.substring(0, 80),
    });
    return true;
  }
}

/**
 * Gera um link de afiliado da Amazon.
 * - Resolve encurtadores automaticamente
 * - Extrai o ASIN da URL real
 * - Valida se o produto existe (rejeita 404)
 */
export async function generateAmazonLink(
  productUrl: string
): Promise<AffiliateLink | null> {
  try {
    // 1. Resolver encurtadores (amzn.to, link.amazon)
    const resolvedUrl = await resolveShortUrl(productUrl);

    // 2. Extrair ASIN
    const asin = extractASIN(resolvedUrl);

    if (!asin) {
      log.warn("ASIN não encontrado na URL", { url: productUrl.substring(0, 50) });
      return null;
    }

    const tag = process.env.AMAZON_AFFILIATE_TAG;
    const marketplace = process.env.AMAZON_MARKETPLACE || "www.amazon.com.br";

    if (!tag) {
      log.error("AMAZON_AFFILIATE_TAG não definido no .env");
      return null;
    }

    const affiliateUrl = `https://${marketplace}/dp/${asin}?tag=${tag}`;

    // 3. Validar se o produto existe (pular se 404)
    const isValid = await validateAffiliateLink(affiliateUrl);
    if (!isValid) {
      log.warn("Link inválido (404), pulando publicação", { asin });
      return null;
    }

    const result: AffiliateLink = {
      original: productUrl,
      affiliate: affiliateUrl,
      platform: "amazon",
      asin,
      marketplace,
    };

    log.info("Link Amazon gerado e validado", { asin });
    return result;
  } catch (error) {
    log.error("Erro ao gerar link Amazon", {
      error: (error as Error).message,
    });
    return null;
  }
}

/**
 * Extrai o ASIN de uma URL Amazon.
 * Procura padrões como /dp/ASIN, /product/ASIN, etc.
 */
export function extractASIN(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}
