/**
 * Templates de mensagens para publicação no Telegram.
 *
 * Formata ofertas com Markdown do Telegram, incluindo:
 * - Oferta padrão (formatOfferMessage)
 * - Oferta relâmpago (formatFlashSaleMessage)
 * - Oferta do dia (formatDailyDealMessage)
 */

import { OfferData } from "../types";

// ==============================================================
// Helpers internos
// ==============================================================

function escapeMarkdown(text: string): string {
  return text
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`");
}

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function calculateDiscount(
  original: number | null,
  current: number | null
): number | null {
  if (!original || !current || original <= current) return null;
  return Math.round((1 - current / original) * 100);
}

function getTimeLeft(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) return "Encerrada!";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} minutos`;
}

// ==============================================================
// Templates públicos
// ==============================================================

/**
 * Formata uma oferta padrão para publicação.
 *
 * Exemplo:
 * 🔥 OFERTA EXCLUSIVA
 *
 * 📱 iPhone 14 Pro Max 256GB
 *
 * 💰 De R$ 7.499 por R$ 3.749
 * 🏷️ 50% OFF
 * ⭐ 4.8 estrelas
 * 🚚 Frete grátis
 *
 * 🔗 Comprar agora →
 *
 * ⚡ Últimas unidades!
 * 📌 Links de afiliado
 *
 * ━━━━━━━━━━━━━━━━━━━━━━
 * 📦 Amazon | 🔥 Válido até esgotar
 */
export function formatOfferMessage(
  offer: OfferData,
  affiliateLink: string
): string {
  const discount = calculateDiscount(offer.originalPrice, offer.currentPrice);

  let message = `🔥 *OFERTA EXCLUSIVA*\n\n`;

  // Nome do produto
  message += `📱 *${escapeMarkdown(offer.name)}*\n\n`;

  // Preços
  if (offer.originalPrice !== null && offer.currentPrice !== null) {
    message += `💰 De R$ ${formatPrice(offer.originalPrice)} por *R$ ${formatPrice(offer.currentPrice)}*\n`;
    if (discount) {
      message += `🏷️ *${discount}% OFF*\n`;
    }
  }

  // Avaliação
  if (offer.rating) {
    message += `⭐ ${offer.rating} estrelas\n`;
  }

  // Frete grátis
  if (offer.freeShipping) {
    message += `🚚 Frete grátis\n`;
  }

  // Link de compra
  message += `\n🔗 [Comprar agora →](${affiliateLink})\n\n`;

  // Urgência
  message += `⚡ *Últimas unidades!*\n`;

  // Disclaimer legal
  message += `📌 Links de afiliado\n`;

  // Separador e plataforma
  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📦 ${offer.platform} | 🔥 Válido até esgotar`;

  return message;
}

/**
 * Formata uma oferta relâmpago com countdown.
 *
 * Exemplo:
 * ⚡ OFERTA RELÂMPAGO
 * ⏰ Tempo restante: 2h 30min
 *
 * 📱 iPhone 14 Pro Max 256GB
 *
 * 💰 De R$ 7.499 por R$ 3.749
 * 🏷️ 50% OFF
 *
 * 🔗 COMPRAR AGORA →
 *
 * 🚨 ESTOQUE LIMITADO
 * 📌 Links de afiliado
 */
export function formatFlashSaleMessage(
  offer: OfferData,
  affiliateLink: string,
  endTime: Date
): string {
  const timeLeft = getTimeLeft(endTime);

  let message = `⚡ *OFERTA RELÂMPAGO*\n\n`;
  message += `⏰ *Tempo restante: ${timeLeft}*\n\n`;

  message += `📱 *${escapeMarkdown(offer.name)}*\n\n`;

  if (offer.originalPrice !== null && offer.currentPrice !== null) {
    message += `💰 De R$ ${formatPrice(offer.originalPrice)} por *R$ ${formatPrice(offer.currentPrice)}*\n`;
    const discount = calculateDiscount(offer.originalPrice, offer.currentPrice);
    if (discount) {
      message += `🏷️ *${discount}% OFF*\n`;
    }
  }

  message += `\n🔗 [COMPRAR AGORA →](${affiliateLink})\n\n`;
  message += `🚨 *ESTOQUE LIMITADO*\n`;
  message += `📌 Links de afiliado`;

  return message;
}

/**
 * Formata a oferta do dia.
 *
 * Exemplo:
 * 🎯 OFERTA DO DIA
 * 📅 15/06/2026
 *
 * 📱 iPhone 14 Pro Max 256GB
 *
 * 💰 R$ 3.749
 * 🏷️ 50% OFF
 *
 * 🔗 Ver oferta →
 *
 * 📌 Links de afiliado
 */
export function formatDailyDealMessage(
  offer: OfferData,
  affiliateLink: string
): string {
  let message = `🎯 *OFERTA DO DIA*\n\n`;
  message += `📅 ${new Date().toLocaleDateString("pt-BR")}\n\n`;

  message += `📱 *${escapeMarkdown(offer.name)}*\n\n`;

  if (offer.originalPrice !== null && offer.currentPrice !== null) {
    message += `💰 *R$ ${formatPrice(offer.currentPrice)}*\n`;
    const discount = calculateDiscount(offer.originalPrice, offer.currentPrice);
    if (discount) {
      message += `🏷️ ${discount}% OFF\n`;
    }
  }

  message += `\n🔗 [Ver oferta →](${affiliateLink})\n\n`;
  message += `📌 Links de afiliado`;

  return message;
}
