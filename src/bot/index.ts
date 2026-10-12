/**
 * Bot Multi-Tenant — Barrel Export
 */

export { TenantBot } from "./tenant-bot";
export { BotManager, getBotManager } from "./bot-manager";
export { OfferProcessor } from "./offer-processor";
export { AffiliateLinkGenerator } from "./affiliate-generator";

export type {
  TenantBotStatus,
  ProcessResult,
  ProcessedOffer,
  ManualOfferInput,
  TenantWithRelations,
  WhatsAppMessage,
  BotManagerConfig,
  WhatsAppClientEvents,
} from "./types";