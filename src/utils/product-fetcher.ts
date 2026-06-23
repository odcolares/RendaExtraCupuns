/**
 * Product Fetcher — Busca informações do produto diretamente da URL.
 *
 * Faz uma requisição HTTP à página do produto e extrai:
 * - Nome (og:title ou <title>)
 * - Descrição (og:description ou meta description)
 * - Imagem (og:image)
 * - Preço (pattern matching platform-specific)
 *
 * Isto permite que o CLI mode funcione com apenas um link,
 * sem precisar colar a mensagem inteira com descrição.
 */

import axios from "axios";
import { createModuleLogger } from "./logger";

const log = createModuleLogger("ProductFetcher");

// ==============================================================
// Tipos
// ==============================================================

export interface FetchedProductInfo {
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  originalPrice: number | null;
  platform: string | null;
}

// ==============================================================
// HTML Parsing helpers (sem dependências externas)
// ==============================================================

/**
 * Extrai o conteúdo de uma meta tag pelo nome ou propriedade.
 * Ex: <meta property="og:title" content="Produto X" />
 */
function extractMetaTag(html: string, attribute: string, value: string): string | null {
  // Tenta com aspas duplas primeiro
  const patterns = [
    new RegExp(
      `<meta\\s+[^>]*${attribute}\\s*=\\s*["']${escapeRegex(value)}["'][^>]*content\\s*=\\s*["']([^"']+)["']`,
      "i"
    ),
    // Ordem inversa: content antes do attribute
    new RegExp(
      `<meta\\s+[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*${attribute}\\s*=\\s*["']${escapeRegex(value)}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1].trim());
  }

  return null;
}

/**
 * Extrai o conteúdo da tag <title>.
 */
function extractPageTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (match) {
    let title = decodeHtmlEntities(match[1].trim());
    // Remove sufixos comuns de site (ex: " - Amazon.com.br")
    title = title.replace(/\s*[|–-]\s*.*$/, "").trim();
    return title || null;
  }
  return null;
}

/**
 * Extrai preço do HTML usando padrões específicos por plataforma.
 */
function extractPrice(html: string, platform: string | null): { price: number | null; originalPrice: number | null } {
  const result = { price: null as number | null, originalPrice: null as number | null };

  // Amazon — padrões comuns de preço no HTML
  if (!platform || platform === "amazon") {
    // Preço atual: a-price-whole + a-price-fraction
    const wholeMatch = html.match(/"a-price-whole"[^>]*>(\d[\d.,]*)</);
    const fractionMatch = html.match(/"a-price-fraction"[^>]*>(\d{2})</);
    if (wholeMatch) {
      const whole = wholeMatch[1].replace(/[.,]/g, "");
      const fraction = fractionMatch ? fractionMatch[1] : "00";
      result.price = parseFloat(`${whole}.${fraction}`);
    }
  }

  // Mercado Livre
  if (!platform || platform === "mercadolivre") {
    const mlPrice = html.match(/andes-money-amount__fraction[^>]*>(\d[\d.,]*)</);
    if (mlPrice) {
      result.price = parseBRLPrice(mlPrice[1]);
    }
  }

  // Shopee
  if (!platform || platform === "shopee") {
    const spPrice = html.match(/"price"(?:\s*:|=>)\s*(\d+)/i);
    if (spPrice) {
      result.price = parseInt(spPrice[1], 10) / 100000;
    }
  }

  // Fallback: padrões genéricos de preço
  if (!result.price) {
    const genericPrice = html.match(/["']price["'][^}]*?["']([\d.]+)["']/);
    if (genericPrice) {
      result.price = parseFloat(genericPrice[1]);
    }
  }

  return result;
}

// ==============================================================
// Utilitários
// ==============================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1), 10)));
}

/**
 * Converte string de preço brasileiro (ex: "1.299,99") para número.
 */
function parseBRLPrice(value: string): number {
  return parseFloat(value.replace(/\./g, "").replace(",", "."));
}

/**
 * Detecta plataforma da URL.
 */
function detectPlatformFromUrl(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes("amazon")) return "amazon";
  if (lower.includes("aliexpress")) return "aliexpress";
  if (lower.includes("shopee")) return "shopee";
  if (lower.includes("mercadolivre") || lower.includes("ml.uv")) return "mercadolivre";
  if (lower.includes("magalu") || lower.includes("magazine")) return "magalu";
  return null;
}

// ==============================================================
// Função principal
// ==============================================================

/**
 * Busca informações do produto a partir da URL.
 * Faz requisição HTTP, parseia HTML e extrai dados estruturados.
 *
 * @param url - URL do produto
 * @param timeout - Timeout em ms (default: 10000)
 * @returns FetchedProductInfo com dados encontrados (ou null quando não encontrado)
 */
export async function fetchProductInfo(
  url: string,
  timeout: number = 10000
): Promise<FetchedProductInfo> {
  const platform = detectPlatformFromUrl(url);
  log.info("Buscando produto", { url: url.substring(0, 60), platform });

  try {
    const response = await axios.get<string>(url, {
      timeout,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      maxRedirects: 5,
      responseType: "text",
    });

    const html = response.data;

    // Extrair meta tags Open Graph
    const ogTitle = extractMetaTag(html, "property", "og:title");
    const ogDescription = extractMetaTag(html, "property", "og:description");
    const ogImage = extractMetaTag(html, "property", "og:image");

    // Fallback para <title> se não tiver og:title
    const title = ogTitle || extractPageTitle(html);

    // Fallback para meta description
    const description =
      ogDescription ||
      extractMetaTag(html, "name", "description") ||
      extractMetaTag(html, "property", "description");

    // Extrair preços
    const { price, originalPrice } = extractPrice(html, platform);

    const info: FetchedProductInfo = {
      name: title || null,
      description: description || null,
      imageUrl: ogImage || null,
      price,
      originalPrice,
      platform,
    };

    log.info("Produto encontrado", {
      name: info.name,
      platform: info.platform,
      price: info.price,
    });

    return info;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      log.warn("Falha ao buscar produto", {
        url: url.substring(0, 60),
        status: error.response?.status,
        message: error.message,
      });
    } else {
      log.warn("Falha ao buscar produto", {
        url: url.substring(0, 60),
        error: (error as Error).message,
      });
    }

    return {
      name: null,
      description: null,
      imageUrl: null,
      price: null,
      originalPrice: null,
      platform,
    };
  }
}
