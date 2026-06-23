/**
 * Inline Buttons para mensagens do Telegram.
 *
 * Fornece botões contextuais para ofertas:
 * - createOfferButtons: Comprar agora + Ver na loja
 * - createFlashSaleButtons: Compra urgente + Mais ofertas
 * - createCategoryButtons: Navegação por categoria
 * - createAlertButtons: Ativar alerta / Ignorar
 */

import { InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";

/**
 * Botões para oferta padrão.
 * - 🛒 Comprar Agora (link de afiliado)
 * - 📦 Ver na Loja (URL original, se diferente do afiliado)
 */
export function createOfferButtons(
  affiliateLink: string,
  originalUrl?: string
): InlineKeyboardMarkup {
  const buttons: InlineKeyboardMarkup["inline_keyboard"] = [
    [{ text: "🛒 Comprar Agora", url: affiliateLink }],
  ];

  if (originalUrl && originalUrl !== affiliateLink) {
    buttons.push([{ text: "📦 Ver na Loja", url: originalUrl }]);
  }

  return { inline_keyboard: buttons };
}

/**
 * Botões para oferta relâmpago.
 * - ⚡ COMPRAR AGORA (link de afiliado)
 * - 📊 Ver mais ofertas (callback)
 */
export function createFlashSaleButtons(
  affiliateLink: string
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: "⚡ COMPRAR AGORA", url: affiliateLink }],
      [{ text: "📊 Ver mais ofertas", callback_data: "more_offers" }],
    ],
  };
}

/**
 * Botões de navegação por categoria.
 * Gera uma linha por categoria com callback_data.
 */
export function createCategoryButtons(
  categories: string[]
): InlineKeyboardMarkup {
  const buttons = categories.map((category) => [
    { text: category, callback_data: `category_${category.toLowerCase()}` },
  ]);

  return { inline_keyboard: buttons };
}

/**
 * Botões de alerta para um produto específico.
 * - 🔔 Ativar alerta
 * - 🚫 Ignorar
 */
export function createAlertButtons(
  productId: string
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🔔 Ativar alerta", callback_data: `alert_${productId}` },
        { text: "🚫 Ignorar", callback_data: `ignore_${productId}` },
      ],
    ],
  };
}
