/**
 * RendaExtraCupuns — Bot de Ofertas Afiliado Automatizado
 *
 * Monitora ofertas no WhatsApp (Clube Kotas #51),
 * gera links de afiliado e publica no Telegram.
 *
 * Uso:
 *   npm run dev         → inicia o bot completo
 *   npm run dev:core    → inicia apenas DB + Telegram (sem WhatsApp)
 */

import { startApp } from "./app";

startApp().catch((err) => {
  console.error("Falha ao iniciar aplicação:", err);
  process.exit(1);
});
