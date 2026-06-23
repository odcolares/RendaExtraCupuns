/**
 * Telegram Bot — inicialização, erro global e graceful shutdown.
 *
 * Singleton: initializeBot() → getBot() → launchBot() / stopBot()
 * Usa Telegraf 4.x com long polling (dev) e webhook (produção).
 */

import { Telegraf } from "telegraf";
import { createModuleLogger } from "../utils";

const log = createModuleLogger("TelegramBot");

let bot: Telegraf | null = null;

/**
 * Inicializa (ou retorna) a instância singleton do bot.
 */
export function initializeBot(token: string): Telegraf {
  if (bot) {
    log.debug("Bot já inicializado, retornando instância existente");
    return bot;
  }

  bot = new Telegraf(token);
  log.info("Instância do Telegraf criada");

  // ── Global error handler ──
  bot.catch((err, ctx) => {
    log.error("Erro não tratado no bot", {
      error: (err as Error).message,
      updateId: ctx.update.update_id,
    });
  });

  return bot;
}

/**
 * Retorna a instância do bot (null se não inicializado).
 */
export function getBot(): Telegraf | null {
  return bot;
}

/**
 * Inicia o bot em modo long polling (recomendado para dev).
 *
 * ATENÇÃO: O `bot.launch()` do Telegraf 4.x usa um loop infinito de polling.
 * Por isso NÃO usamos `await` — o polling roda em background mantendo
 * o event loop ativo. Tratamos erros via `.catch()`.
 */
export function launchBot(): void {
  if (!bot) {
    throw new Error("Bot não inicializado. Chame initializeBot() primeiro.");
  }

  bot.launch().catch((err) => {
    log.error("Falha no bot Telegram", { error: (err as Error).message });
  });
  log.info("✅ Bot Telegram iniciado (long polling)");
}

/**
 * Inicia o bot em modo webhook (recomendado para produção).
 */
export async function launchBotWebhook(
  domain: string,
  port: number = 443,
  path?: string,
  secretToken?: string
): Promise<void> {
  if (!bot) {
    throw new Error("Bot não inicializado. Chame initializeBot() primeiro.");
  }

  try {
    await bot.launch({
      webhook: {
        domain,
        port,
        path,
        secretToken,
      },
    });
    log.info("✅ Bot Telegram iniciado (webhook)", { domain, port });
  } catch (err) {
    log.error("Falha ao iniciar bot com webhook", {
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Para o bot graciosamente.
 */
export async function stopBot(): Promise<void> {
  if (bot) {
    bot.stop();
    bot = null;
    log.info("⏹️ Bot Telegram parado");
  }
}
