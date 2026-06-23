/**
 * Parser de links e validação de ofertas em mensagens do WhatsApp.
 *
 * - extractLinksFromMessage(): extrai URLs de produto
 * - isValidOfferMessage(): verifica se mensagem contém oferta
 * - detectPlatform(): identifica plataforma pela URL
 * - isProductLink(): verifica se URL é de produto
 * - cleanUrl(): remove parâmetros de tracking
 */

// ==============================================================
// Padrões de URL por plataforma
// ==============================================================

const URL_PATTERNS: Record<string, RegExp[]> = {
  amazon: [
    /https?:\/\/(?:www\.)?amazon\.com\.br(?:\/[a-zA-Z0-9-]+)*\/dp\/[A-Z0-9]{10}/i,
    /https?:\/\/(?:www\.)?amazon\.com(?:\/[a-zA-Z0-9-]+)*\/dp\/[A-Z0-9]{10}/i,
    /https?:\/\/amzn\.to\/[a-zA-Z0-9]+/i,
    /https?:\/\/link\.amazon\/[a-zA-Z0-9]+/i,
  ],
  aliexpress: [
    /https?:\/\/(?:www\.)?aliexpress\.com\/item\/\d+\.html/i,
    /https?:\/\/s\.click\.aliexpress\.com\/[a-zA-Z0-9]+/i,
  ],
  shopee: [
    /https?:\/\/(?:www\.)?shopee\.com\.br\/product\/\d+\/\d+/i,
    /https?:\/\/(?:www\.)?shopee\.com\.br\/[^/\s]+-i\.\d+\.\d+/i,
    /https?:\/\/shope\.ee\/[a-zA-Z0-9]+/i,
    /https?:\/\/shp\.ee\/[a-zA-Z0-9]+/i,
    /https?:\/\/s\.shopee\.com\.br\/[a-zA-Z0-9]+/i,
  ],
  mercadolivre: [
    /https?:\/\/(?:www\.)?mercadolivre\.com\.br\/[^\s]+/i,
    /https?:\/\/meu\.ml(?:\.uv)?\/[a-zA-Z0-9]+/i,
    /https?:\/\/meli\.la\/[a-zA-Z0-9]+/i,
  ],
};

// ==============================================================
// Palavras-chave que indicam oferta
// ==============================================================

const OFFER_KEYWORDS = [
  "oferta",
  "desconto",
  "off",
  "%",
  "promoção",
  "promo",
  "cupom",
  "frete grátis",
  "entrega grátis",
  "relâmpago",
  "limitado",
  "últimas unidades",
  "esgotando",
];

// ==============================================================
// Funções públicas
// ==============================================================

/**
 * Extrai todas as URLs de uma mensagem.
 * Não filtra mais por isProductLink — a detecção de plataforma
 * é feita no handleMessage com resolução de URLs encurtadas.
 *
 * Use isProductLink() separadamente se precisar filtrar.
 */
export function extractLinksFromMessage(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = text.match(urlRegex) || [];

  return urls.map((url) => cleanUrl(url));
}

/**
 * Verifica se uma mensagem é uma oferta válida.
 * Checa por palavras-chave, link de produto ou padrão de preço.
 */
export function isValidOfferMessage(text: string): boolean {
  const lowerText = text.toLowerCase();

  const hasOfferKeyword = OFFER_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );

  const hasProductLink = Object.values(URL_PATTERNS).some((patterns) =>
    patterns.some((pattern) => pattern.test(text))
  );

  const hasPrice = /R\$\s*\d+/.test(text);

  return hasOfferKeyword || hasProductLink || hasPrice;
}

/**
 * Identifica a plataforma de uma URL.
 */
export function detectPlatform(url: string): string | null {
  for (const [platform, patterns] of Object.entries(URL_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(url))) {
      return platform;
    }
  }
  return null;
}

/**
 * Verifica se uma URL é de produto em alguma plataforma suportada.
 */
export function isProductLink(url: string): boolean {
  return Object.values(URL_PATTERNS).some((patterns) =>
    patterns.some((pattern) => pattern.test(url))
  );
}

/**
 * Limpa parâmetros de tracking desnecessários da URL.
 */
export function cleanUrl(url: string): string {
  return url.split("?")[0];
}
