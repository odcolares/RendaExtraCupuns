/**
 * Comandos do Bot Telegram.
 *
 * Registra todos os comandos via bot.command() no formato:
 *   bot.command("nome", handler)
 *
 * Comandos: /start, /ofertas, /categorias, /alertas, /status, /help
 */

import { Telegraf, Context } from "telegraf";

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
    await ctx.reply("⏳ Carregando ofertas recentes...", {
      parse_mode: "Markdown",
    });

    // TODO: buscar do banco quando o módulo database estiver pronto
    const mockMessage = `
📋 *Últimas ofertas:*

1️⃣ iPhone 14 Pro - R$ 3.749
2️⃣ Samsung S23 - R$ 2.999
3️⃣ AirPods Pro - R$ 1.499

Digite o número para ver detalhes.
    `;

    await ctx.reply(mockMessage, { parse_mode: "Markdown" });
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
    const message = `
📊 *Status do Bot*

🤖 Bot: Online
📢 Canal: @ofertas_afiliado_br
👥 Inscritos: pendente
📦 Ofertas hoje: pendente
⏰ Última oferta: pendente
    `;

    await ctx.reply(message, { parse_mode: "Markdown" });
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
