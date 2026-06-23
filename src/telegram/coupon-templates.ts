/**
 * Templates de mensagens para cupons no Telegram.
 *
 * Exemplo:
 * 🎟️ *CUPOM ENCONTRADO*
 *
 * 🔥 **10% OFF** 🔥
 * 📌 Código: `FUTNAVEIA`
 * 💰 Limite: R$ 40 OFF
 *
 * 🛒 [Ativar cupom →](link)
 *
 * 📍 Mercado Livre
 * 📌 Links de afiliado — podemos ganhar comissão
 */

import type { CouponData } from "../coupons/types";

// ==============================================================
// Helpers
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

// ==============================================================
// Template público
// ==============================================================

/**
 * Formata uma mensagem de cupom para publicação no Telegram.
 *
 * @param coupon - Dados do cupom extraídos
 * @returns Mensagem formatada em Markdown do Telegram
 */
export function formatCouponMessage(coupon: CouponData): string {
  let message = `🎟️ *CUPOM ENCONTRADO*\n\n`;

  // Desconto
  message += `🔥 *${escapeMarkdown(coupon.discount)}*`;
  if (coupon.limit !== null) {
    message += ` — limite ${coupon.limitCurrency} ${formatValue(coupon.limit)} OFF`;
  }
  message += `\n\n`;

  // Código
  message += `📌 Código: \`${coupon.code}\`\n\n`;

  // Link
  message += `🛒 [Ativar cupom →](${coupon.sourceUrl})\n\n`;

  // Rodapé
  message += `📍 *${escapeMarkdown(coupon.platform)}*\n`;
  message += `📌 Links de afiliado`;

  return message;
}

/**
 * Formata um cupom de forma compacta (para múltiplos cupons no mesmo post).
 */
export function formatCouponInline(coupon: CouponData): string {
  const limitStr =
    coupon.limit !== null
      ? ` (limite ${coupon.limitCurrency} ${formatValue(coupon.limit)})`
      : "";

  return `🎟️ *${escapeMarkdown(coupon.discount)}*${limitStr}\n   Código: \`${coupon.code}\` — [Ativar →](${coupon.sourceUrl})`;
}

function formatValue(value: number): string {
  return value.toFixed(2).replace(".", ",");
}
