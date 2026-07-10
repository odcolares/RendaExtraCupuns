/**
 * Comandos do Bot Telegram.
 *
 * Registra todos os comandos via bot.command() no formato:
 *   bot.command("nome", handler)
 *
 * Comandos: /start, /ofertas, /categorias, /alertas, /status, /help
 */

import { Telegraf, Context } from "telegraf";
import { getRecentOffers, getStats } from "../database/offers";
import { createModuleLogger } from "../utils";

const log = createModuleLogger("TelegramCommands");

// ==============================================================
// Tipos de callback data (compartilhados com buttons.ts)
// ==============================================================

export const CALLBACK_MORE_OFFERS = "more_offers";
export const CALLBACK_PREFIX_CATEGORY = "category_";
export const CALLBACK_PREFIX_ALERT = "alert_";
export const CALLBACK_PREFIX_IGNORE = "ignore_";

// ==============================================================
// Registro de comandos
// ==============================================================

export function setupCommands(bot: Telegraf): void {
  // ── /start ──────────────────────────────────────────────────
  bot.start((ctx: Context) => {
    const welcomeMessage = `
🔥 *Bem-vindo ao Canal de Ofertas!*

Aqui você encontra as melhores ofertas com links de afiliado.

📌 *Comandos disponíveis:*

/ofertas - Ver ofertas recentes
/categorias - Ver por categoria
/alertas - Configurar alertas
/status - Ver status do bot
/help - Ajuda

💡 *Dica:* Ative as notificações para não perder ofertas relâmpago!
    `;

    ctx.reply(welcomeMessage, { parse_mode: "Markdown" });
  });

  // ── /ofertas ────────────────────────────────────────────────
  bot.command("ofertas", async (ctx: Context) => {
    try {
      const offers = getRecentOffers(10);
      const stats = getStats();

      if (offers.length === 0) {
        await ctx.reply(
          "📋 *Nenhuma oferta encontrada.*\n\n" +
            "As ofertas aparecerão aqui conforme forem detectadas no WhatsApp.",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const lines = offers.map((o, i) => {
        const price = o.current_price
          ? `R$ ${o.current_price.toFixed(2)}`
          : "Preço não informado";
        const emoji =
          o.platform === "amazon"
            ? "📦"
            : o.platform === "mercadolivre"
              ? "🟡"
              : o.platform === "shopee"
                ? "🛒"
                : o.platform === "aliexpress"
                  ? "🇨🇳"
                  : "🔗";
        return `${i + 1}${emoji} *${o.name}* — ${price}`;
      });

      const message = [
        `📋 *Últimas ofertas (${stats.total} total, ${stats.published} publicadas):*\n`,
        ...lines,
        "",
        "💡 Dica: Ative as notificações para não perder ofertas!",
      ].join("\n");

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (err) {
      log.error("Erro ao buscar ofertas", { error: (err as Error).message });
      await ctx.reply(
        "❌ Erro ao carregar ofertas. Tente novamente mais tarde."
      );
    }
  });

  // ── /categorias ─────────────────────────────────────────────
  bot.command("categorias", async (ctx: Context) => {
    const categories = [
      "📱 Eletrônicos",
      "👕 Moda",
      "🏠 Casa",
      "🎮 Games",
      "👶 Bebê",
      "💄 Beleza",
    ];

    const message = `
📂 *Categorias disponíveis:*

${categories.join("\n")}

Digite o nome da categoria para filtrar.
    `;

    await ctx.reply(message, { parse_mode: "Markdown" });
  });

  // ── /alertas ────────────────────────────────────────────────
  bot.command("alertas", async (ctx: Context) => {
    const message = `
🔔 *Configurar Alertas*

Você pode receber notificações quando:
- Uma oferta específica aparecer
- Produtos de uma categoria estiverem em promoção
- Ofertas relâmpago começarem

Para configurar, use:
/alertas categorias [nome]
/alertas produto [palavra-chave]
    `;

    await ctx.reply(message, { parse_mode: "Markdown" });
  });

  // ── /status ─────────────────────────────────────────────────
  bot.command("status", async (ctx: Context) => {
    try {
      const stats = getStats();
      const recent = getRecentOffers(1);
      const ultima = recent.length > 0 ? recent[0].detected_at : "—";
      const porPlataforma = Object.entries(stats.byPlatform)
        .map(([p, c]) => `  • ${p}: ${c}`)
        .join("\n");

      const message = `
📊 *Status do Bot*

🤖 Bot: Online
📦 Ofertas totais: ${stats.total}
✅ Publicadas: ${stats.published}
⏳ Pendentes: ${stats.pending}
🕐 Última oferta: ${ultima}

*Por plataforma:*
${porPlataforma || "  —"}
      `;

      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (err) {
      log.error("Erro ao buscar status", { error: (err as Error).message });
      await ctx.reply("📊 *Status do Bot*\n\n🤖 Bot: Online\n📦 Dados: indisponíveis", {
        parse_mode: "Markdown",
      });
    }
  });

  // ── /help ───────────────────────────────────────────────────
  bot.command("help", async (ctx: Context) => {
    const message = `
❓ *Ajuda*

*Comandos:*
/start - Iniciar bot
/ofertas - Ver ofertas
/categorias - Filtrar por categoria
/alertas - Configurar notificações
/status - Ver status
/help - Esta ajuda

💡 *Dica:* Ative as notificações para não perder ofertas!
    `;

    await ctx.reply(message, { parse_mode: "Markdown" });
  });
}
