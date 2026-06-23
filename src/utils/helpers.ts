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
