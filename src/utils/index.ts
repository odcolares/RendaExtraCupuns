/**
 * Utilitários compartilhados — barrel export.
 */

export { default as logger, createModuleLogger } from "./logger";

export {
  formatDateBR,
  formatDateTimeBR,
  formatBRL,
  truncateText,
  sanitizeText,
  slugify,
  delay,
  deepMerge,
} from "./helpers";

export { fetchProductInfo } from "./product-fetcher";
export type { FetchedProductInfo } from "./product-fetcher";
