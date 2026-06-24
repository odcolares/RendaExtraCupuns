/**
 * Helpers utilitários compartilhados entre todos os módulos.
 */

// ==============================================================
// Formatação de Data/Hora (locale brasileiro)
// ==============================================================

export function formatDateBR(date: Date = new Date()): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTimeBR(date: Date = new Date()): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==============================================================
// Formatação de Preço (BRL)
// ==============================================================

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// ==============================================================
// Manipulação de Strings
// ==============================================================

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>&"']/g, "")     // remove HTML entities
    .replace(/\s+/g, " ")        // normaliza espaços
    .trim();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ==============================================================
// Async / Timer
// ==============================================================

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==============================================================
// Objetos
// ==============================================================

// ==============================================================
// Product Name Validation
// ==============================================================

/**
 * Verifica se um nome de produto extraído do WhatsApp é genérico
 * (chamada promocional sem nome real do produto).
 *
 * Usado pelo processor para decidir se deve buscar nome oficial via URL.
 *
 * Exemplos de nomes genéricos:
 * - "BÁSICAS PRO DIA A DIA" (all-caps, sem identificação de produto)
 * - "OFERTA" (muito curto)
 * - "LANÇAMENTO IMPERDÍVEL" (apenas chamada promocional)
 *
 * Exemplos de nomes reais:
 * - "iPhone 14 Pro Max 256GB"
 * - "Smart TV 50 Polegadas 4K"
 * - "Fone de Ouvido Gamer Headset Havit H2015d"
 */
export function isGenericProductName(name: string): boolean {
  if (!name || name === "Produto sem nome") return true;

  // Muito curto para ser nome real de produto
  if (name.length < 8) return true;

  // Muito longo — provavelmente lixo
  if (name.length > 120) return true;

  // Apenas números ou símbolos
  if (/^[\d\s%°\-><]+$/.test(name)) return true;

  // Predominantemente MAIÚSCULO (>85%) = chamada promocional genérica
  const letters = name.match(/[a-zA-ZÀ-ÿ]/g);
  if (letters && letters.length >= 4) {
    const upper = (name.match(/[A-ZÀ-Ú]/g) || []).length;
    if (upper / letters.length > 0.85) return true;
  }

  // Padrões de texto genérico (chamadas promocionais comuns)
  const genericPatterns = [
    /^(LANÇAMENTO|PROMOÇÃO|LIQUIDA|QUEIMA|OFERTA|PROMO).{0,20}$/i,
    /^[A-Z\sÀ-Ú]{8,}$/,                                    // tudo maiúsculo
    /^\d+\s*[xX]\s*\d+/,                                    // "12x 49,90"
    /\b(CxB|custo.?benefício|imperdível|imperdivel)\b/i,
  ];

  for (const pattern of genericPatterns) {
    if (pattern.test(name.trim())) return true;
  }

  return false;
}

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const output = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const val = source[key];
    if (val !== undefined) {
      if (
        val !== null &&
        typeof val === "object" &&
        !Array.isArray(val) &&
        typeof target[key] === "object" &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        output[key] = deepMerge(
          target[key] as Record<string, unknown>,
          val as Record<string, unknown>
        ) as T[keyof T];
      } else {
        output[key] = val as T[keyof T];
      }
    }
  }

  return output;
}
