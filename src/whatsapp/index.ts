/**
 * Módulo WhatsApp — barrel export.
 *
 * Uso:
 *   import { initializeWhatsApp, startMonitoring } from "./whatsapp";
 */

export { initializeWhatsApp, getClient, startClient, destroyClient } from "./client";

export {
  extractLinksFromMessage,
  isValidOfferMessage,
  detectPlatform,
  isProductLink,
  cleanUrl,
} from "./parser";

export {
  extractOfferData,
  extractProductName,
  extractOriginalPrice,
  extractCurrentPrice,
  extractDiscount,
  parsePrice,
} from "./extractor";

export {
  startMonitoring,
  stopMonitoring,
  processOffer,
  isMonitoringActive,
} from "./monitor";

export type { WhatsAppOfferData, ProcessResult } from "./types";
