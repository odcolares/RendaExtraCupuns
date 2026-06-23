/**
 * Módulo Telegram — barrel export.
 *
 * Uso:
 *   import { initializeBot, launchBot } from "./telegram";
 *   import { formatOfferMessage, createOfferButtons } from "./telegram";
 */

export {
  initializeBot,
  getBot,
  launchBot,
  launchBotWebhook,
  stopBot,
} from "./bot";

export {
  formatOfferMessage,
  formatFlashSaleMessage,
  formatDailyDealMessage,
} from "./templates";

export {
  createOfferButtons,
  createFlashSaleButtons,
  createCategoryButtons,
  createAlertButtons,
} from "./buttons";

export { setupCommands } from "./commands";
export { publishOffer, publishFlashSale, publishToMultipleChannels } from "./publisher";
