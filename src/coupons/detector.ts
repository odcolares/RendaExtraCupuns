/**
 * Detector e extrator de cupons promocionais.
 *
 * Identifica padrões como:
 *   🎟️10% OFF, Limite de R$ 40 OFF: FUTNAVEIA
 *   CUPOM 20% OFF - CÓDIGO: PROMO20
 *   USE O CUPOM XTUDO10 e ganhe 15% OFF
 *
 * Retorna CouponData estruturado ou null se não for cupom.
 */

import { createModuleLogger } from "../utils";
import type { CouponData } from "./types";

const log = createModuleLogger("CouponDetector");

// ==============================================================
// Padrões de extração
// ==============================================================

/** Captura o percentual de desconto: 10% OFF, 15% de desconto */
const DISCOUNT_PERCENT_PATTERN = /(\d+)\s*%\s*(?:de\s*)?(?:OFF|desconto|off)/i;

/** Captura o limite máximo: Limite de R$ 40 OFF */
const LIMIT_PATTERN = /limite\s*(?:de\s*)?R\$\s*(\d+(?:[.,]\d{2})?)\s*(?:OFF|de\s*desconto)?/i;

/** Captura o código do cupom após dois-pontos ou "código:" */
const CODE_AFTER_COLON = /[:\-–—]\s*([A-Z0-9]{4,20})(?:\s|$)/i;

/** Captura o código após "código:" */
const CODE_AFTER_LABEL = /c[oó]digo\s*[:\-–—]\s*([A-Z0-9]{3,20})/i;

/** Captura o código após "cupom:" */
const CODE_AFTER_CUPOM = /cupom\s*[:\-–—]\s*([A-Z0-9]{3,20})/i;

/** Captura o código solto em ALL CAPS no final da linha de desconto */
const CODE_UPPER_LINE = /OFF\s*[:\-–—]\s*([A-Z0-9]{4,20})/i;

/** Nomes de plataforma no texto da mensagem */
const PLATFORM_NAMES: Record<string, RegExp[]> = {
  mercadolivre: [/mercadolivre/i, /mercado\s*livre/i, /mercadolibre/i],
  amazon: [/amazon/i],
  aliexpress: [/aliexpress/i],
  shopee: [/shopee/i],
};

// ==============================================================
// Detector principal
// ==============================================================

/**
 * Extrai dados de um cupom promocional a partir do texto da mensagem.
 *
 * @param messageText - Texto completo da mensagem do WhatsApp
 * @param url - URL extraída da mensagem (para detectar plataforma)
 * @returns CouponData ou null se não reconhecer como cupom
 */
export function extractCouponData(
  messageText: string,
  url: string
): CouponData | null {
  const text = messageText.trim();
  if (!text) return null;

  // ── Pré-filtro: só processar se tiver palavra "cupom" ou "cupons" ──
  if (!/\bcupons?\b/i.test(text)) {
    return null;
  }

  // ── Extrair desconto percentual ──
  const percentMatch = text.match(DISCOUNT_PERCENT_PATTERN);
  if (!percentMatch) {
    log.debug("Mensagem tem 'cupom' mas sem percentual de desconto");
    return null;
  }

  const discountValue = parseInt(percentMatch[1], 10);
  const discount = `${discountValue}% OFF`;

  // ── Extrair limite (opcional) ──
  const limitMatch = text.match(LIMIT_PATTERN);
  let limit: number | null = null;
  if (limitMatch) {
    limit = parseFloat(limitMatch[1].replace(",", "."));
  }

  // ── Extrair código do cupom ──
  const code = extractCouponCode(text);
  if (!code) {
    log.debug("Mensagem com cupom mas sem código identificável");
    return null;
  }

  // ── Detectar plataforma ──
  const platformInfo = detectCouponPlatform(text, url);

  // ── Montar URL com tracking de afiliado (se possível) ──
  const trackedUrl = addAffiliateParam(url, platformInfo.key);

  const coupon: CouponData = {
    code,
    discount,
    discountValue,
    discountType: "percent",
    limit,
    limitCurrency: limit !== null ? "R$" : "",
    platform: platformInfo.display,
    platformKey: platformInfo.key,
    sourceUrl: trackedUrl,
    rawMessage: messageText,
  };

  log.info("Cupom extraído", {
    code,
    discount,
    limit,
    platform: platformInfo.display,
  });

  return coupon;
}

// ==============================================================
// Helpers
// ==============================================================

/**
 * Tenta extrair o código do cupom usando múltiplas estratégias.
 */
function extractCouponCode(text: string): string | null {
  // 1. "código: XXXX"
  const labelMatch = text.match(CODE_AFTER_LABEL);
  if (labelMatch) return labelMatch[1].toUpperCase();

  // 2. "cupom: XXXX"
  const cupomMatch = text.match(CODE_AFTER_CUPOM);
  if (cupomMatch) return cupomMatch[1].toUpperCase();

  // 3. "OFF: XXXX" no final
  const offMatch = text.match(CODE_UPPER_LINE);
  if (offMatch) return offMatch[1].toUpperCase();

  // 4. Dois-pontos seguido de ALL CAPS (ex: "R$ 40 OFF: FUTNAVEIA")
  const colonMatch = text.match(CODE_AFTER_COLON);
  if (colonMatch) return colonMatch[1].toUpperCase();

  // 5. Último ALL CAPS com 4+ caracteres que parece um código
  const upperCodes = text.match(/\b([A-Z]{4,20})\b/g);
  if (upperCodes && upperCodes.length > 0) {
    // Pega o último — geralmente é o código
    return upperCodes[upperCodes.length - 1];
  }

  return null;
}

/**
 * Detecta a plataforma a partir do texto da mensagem e da URL.
 */
function detectCouponPlatform(
  text: string,
  url: string
): { key: string; display: string } {
  // Tenta detectar pelo texto
  for (const [key, patterns] of Object.entries(PLATFORM_NAMES)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { key, display: capitalize(key) };
      }
    }
  }

  // Fallback: detectar pela URL
  const urlLower = url.toLowerCase();
  if (urlLower.includes("mercadolivre") || urlLower.includes("meli.la")) {
    return { key: "mercadolivre", display: "Mercado Livre" };
  }
  if (urlLower.includes("amazon")) {
    return { key: "amazon", display: "Amazon" };
  }
  if (urlLower.includes("aliexpress")) {
    return { key: "aliexpress", display: "AliExpress" };
  }
  if (urlLower.includes("shopee")) {
    return { key: "shopee", display: "Shopee" };
  }

  return { key: "unknown", display: text.match(/mercado\s*livre/i) ? "Mercado Livre" : "Desconhecida" };
}

/**
 * Adiciona parâmetro de afiliado à URL se houver ID configurado.
 */
function addAffiliateParam(url: string, platformKey: string): string {
  let affiliateId: string | undefined;

  switch (platformKey) {
    case "mercadolivre":
      affiliateId = process.env.MERCADOLIVRE_AFFILIATE_ID;
      break;
    case "amazon":
      affiliateId = process.env.AMAZON_AFFILIATE_TAG || process.env.AMAZON_TAG;
      break;
    case "shopee":
      affiliateId = process.env.SHOPEE_AFFILIATE_ID;
      break;
  }

  if (!affiliateId) return url;

  const separator = url.includes("?") ? "&" : "?";

  if (platformKey === "mercadolivre") {
    return `${url}${separator}matt_tool=${affiliateId}`;
  }
  if (platformKey === "amazon") {
    return `${url}${separator}tag=${affiliateId}`;
  }
  if (platformKey === "shopee") {
    return `${url}${separator}af_id=${affiliateId}`;
  }

  return url;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
