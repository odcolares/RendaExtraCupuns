/**
 * Publicador de ofertas no Telegram.
 *
 * Envia mensagens formatadas para canais do Telegram com:
 * - Inline buttons contextuais
 * - Rate limiting (max 30 posts/hora por canal)
 * - Delay configurável entre envios
 * - Logging estruturado
 */

import { getBot } from "./bot";
import {
  formatOfferMessage,
  formatFlashSaleMessage,
} from "./templates";
import { formatCouponMessage } from "./coupon-templates";
import {
  createOfferButtons,
  createFlashSaleButtons,
} from "./buttons";
import { createModuleLogger, delay } from "../utils";
import { OfferData, PublishResult } from "../types";
import type { CouponData } from "../coupons/types";

const log = createModuleLogger("TelegramPublisher");

// ==============================================================
// Helper: send message with link preview + fallback sem preview
// ==============================================================

/**
 * Tenta enviar mensagem com preview do link habilitado.
 * Se a plataforma bloquear o preview (erro 400), reenvia sem preview.
 */
async function sendWithPreviewFallback(
  bot: import("telegraf").Telegraf,
  chatId: string,
  message: string,
  extra: Record<string, any> = {}
): Promise<void> {
  try {
    // Tenta com preview habilitado (padrão)
    await bot.telegram.sendMessage(chatId, message, {
      ...extra,
      link_preview_options: { is_disabled: false, prefer_large_media: true },
    });
  } catch (err: any) {
    // Se for erro 400 (preview bloqueado pela Amazon, etc), reenvia sem preview
    const isPreviewBlocked =
      err?.code === 400 ||
      err?.response?.error_code === 400 ||
      (typeof err?.message === "string" && err.message.includes("400"));

    if (isPreviewBlocked) {
      log.warn("Preview bloqueado, reenviando sem preview", {
        error: err?.message?.substring(0, 100),
      });
      await bot.telegram.sendMessage(chatId, message, {
        ...extra,
        link_preview_options: { is_disabled: true },
      });
    } else {
      // Erro real (não é do preview), propaga
      throw err;
    }
  }
}

// ==============================================================
// Rate Limiter (in-memory)
// ==============================================================

interface ChannelLimit {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, ChannelLimit>();

const MAX_POSTS_PER_HOUR = 30;
const WINDOW_MS = 60 * 60 * 1000; // 1 hora

function checkRateLimit(channelId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(channelId);

  if (!entry || now > entry.resetAt) {
    // Reinicia a janela
    rateLimitStore.set(channelId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_POSTS_PER_HOUR) {
    log.warn("Rate limit excedido para canal", {
      channelId,
      max: MAX_POSTS_PER_HOUR,
    });
    return false;
  }

  entry.count++;
  return true;
}

// ==============================================================
// Publicação individual
// ==============================================================

/**
 * Publica uma oferta padrão em um canal.
 * Retorna true se bem-sucedido.
 */
export async function publishOffer(
  offer: OfferData,
  affiliateLink: string,
  channelId?: string,
  options: {
    useButtons?: boolean;
    disableNotification?: boolean;
  } = {}
): Promise<boolean> {
  const bot = getBot();
  if (!bot) {
    log.error("Bot não inicializado ao tentar publicar");
    return false;
  }

  const targetChannel = channelId || process.env.TELEGRAM_CHANNEL_ID;
  if (!targetChannel) {
    log.error("TELEGRAM_CHANNEL_ID não definido");
    return false;
  }

  // Rate limiting
  if (!checkRateLimit(targetChannel)) {
    return false;
  }

  try {
    const message = formatOfferMessage(offer, affiliateLink);

    const replyMarkup =
      options.useButtons !== false
        ? createOfferButtons(affiliateLink, offer.originalUrl)
        : undefined;

    if (offer.imageUrl) {
      // Tenta enviar com foto + legenda; fallback para texto se falhar
      try {
        await bot.telegram.sendPhoto(targetChannel, offer.imageUrl, {
          caption: message,
          parse_mode: "Markdown" as const,
          disable_notification: options.disableNotification,
          reply_markup: replyMarkup,
        });
      } catch {
        // Imagem não disponível (ex: Amazon bloqueia hotlink) → só texto
        log.warn("Foto não disponível, enviando apenas texto", {
          url: offer.imageUrl.substring(0, 60),
        });
        await sendWithPreviewFallback(bot, targetChannel, message, {
          parse_mode: "Markdown" as const,
          disable_notification: options.disableNotification,
          reply_markup: replyMarkup,
        });
      }
    } else {
      // Sem imagem: envia texto com preview do link
      await sendWithPreviewFallback(bot, targetChannel, message, {
        parse_mode: "Markdown" as const,
        disable_notification: options.disableNotification,
        reply_markup: replyMarkup,
      });
    }

    log.info("Oferta publicada", {
      produto: offer.name,
      canal: targetChannel,
    });
    return true;
  } catch (error) {
    log.error("Erro ao publicar oferta", {
      error: (error as Error).message,
      produto: offer.name,
    });
    return false;
  }
}

/**
 * Publica uma oferta relâmpago com countdown.
 */
export async function publishFlashSale(
  offer: OfferData,
  affiliateLink: string,
  endTime: Date,
  channelId?: string
): Promise<boolean> {
  const bot = getBot();
  if (!bot) {
    log.error("Bot não inicializado ao tentar publicar flash sale");
    return false;
  }

  const targetChannel = channelId || process.env.TELEGRAM_CHANNEL_ID;
  if (!targetChannel) {
    log.error("TELEGRAM_CHANNEL_ID não definido");
    return false;
  }

  if (!checkRateLimit(targetChannel)) {
    return false;
  }

  try {
    const message = formatFlashSaleMessage(offer, affiliateLink, endTime);
    const replyMarkup = createFlashSaleButtons(affiliateLink);

    if (offer.imageUrl) {
      try {
        await bot.telegram.sendPhoto(targetChannel, offer.imageUrl, {
          caption: message,
          parse_mode: "Markdown" as const,
          reply_markup: replyMarkup,
        });
      } catch {
        log.warn("Foto não disponível no flash sale, enviando apenas texto", {
          url: offer.imageUrl.substring(0, 60),
        });
        await sendWithPreviewFallback(bot, targetChannel, message, {
          parse_mode: "Markdown" as const,
          reply_markup: replyMarkup,
        });
      }
    } else {
      await sendWithPreviewFallback(bot, targetChannel, message, {
        parse_mode: "Markdown" as const,
        reply_markup: replyMarkup,
      });
    }

    log.info("Flash sale publicada", {
      produto: offer.name,
      canal: targetChannel,
    });
    return true;
  } catch (error) {
    log.error("Erro ao publicar flash sale", {
      error: (error as Error).message,
      produto: offer.name,
    });
    return false;
  }
}

/**
 * Publica uma oferta em múltiplos canais com delay de 1s entre cada.
 * Retorna um Map<channelId, success>.
 */
export async function publishToMultipleChannels(
  offer: OfferData,
  affiliateLink: string,
  channelIds: string[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  for (const channelId of channelIds) {
    const success = await publishOffer(offer, affiliateLink, channelId);
    results.set(channelId, success);

    // Delay de 1s entre envios para evitar flood
    await delay(1000);
  }

  log.info("Publicação multi-canal concluída", {
    total: channelIds.length,
    sucessos: Array.from(results.values()).filter(Boolean).length,
  });

  return results;
}

// ==============================================================
// Publicação de cupons
// ==============================================================

/**
 * Publica um cupom no canal do Telegram.
 *
 * Cupons não exigem link de afiliado — usam a URL original diretamente.
 * A URL já pode conter parâmetro de tracking (matt_tool, tag, etc)
 * adicionado pelo detector.
 *
 * @param coupon - Dados do cupom
 * @param channelId - ID do canal (opcional, usa TELEGRAM_CHANNEL_ID por padrão)
 * @returns true se publicado com sucesso
 */
export async function publishCoupon(
  coupon: CouponData,
  channelId?: string
): Promise<boolean> {
  const bot = getBot();
  if (!bot) {
    log.error("Bot não inicializado ao tentar publicar cupom");
    return false;
  }

  const targetChannel = channelId || process.env.TELEGRAM_CHANNEL_ID;
  if (!targetChannel) {
    log.error("TELEGRAM_CHANNEL_ID não definido");
    return false;
  }

  if (!checkRateLimit(targetChannel)) {
    return false;
  }

  try {
    const message = formatCouponMessage(coupon);

    await sendWithPreviewFallback(bot, targetChannel, message, {
      parse_mode: "Markdown" as const,
    });

    log.info("Cupom publicado", {
      code: coupon.code,
      discount: coupon.discount,
      platform: coupon.platform,
      canal: targetChannel,
    });
    return true;
  } catch (error) {
    log.error("Erro ao publicar cupom", {
      error: (error as Error).message,
      code: coupon.code,
    });
    return false;
  }
}
