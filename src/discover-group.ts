/**
 * discover-group.ts — Descobre o ID real do grupo do WhatsApp.
 *
 * Uso: npm run discover
 *
 * O script conecta no WhatsApp (usando sessão salva) e escuta
 * TODAS as mensagens por 60 segundos, mostrando o ID de cada
 * grupo que enviar mensagem.
 *
 * Basta enviar uma mensagem no grupo enquanto o script roda.
 * O ID aparecerá no terminal — copie para o .env.
 */

import { loadConfig } from "./config";
import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

async function discover() {
  loadConfig();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║     🔍 DISCOVER — Descobrir ID do Grupo         ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║  O bot vai escutar TODAS as mensagens por 60s   ║");
  console.log("║  Envie UMA mensagem no seu grupo do WhatsApp    ║");
  console.log("║  e o ID real aparecerá aqui no terminal.        ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: process.env.WHATSAPP_SESSION_PATH || "./whatsapp-session",
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  });

  client.on("qr", (qr) => {
    console.log("\n⚠️  Sessão expirou! Escaneie o QR Code:\n");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp conectado com sessão salva!\n");
    console.log("📡 AGUARDANDO... Faça isso AGORA:");
    console.log("   1. Pegue seu celular");
    console.log("   2. Abra o WhatsApp");
    console.log("   3. Entre no GRUPO de ofertas");
    console.log("   4. Digite qualquer mensagem (ex: 'teste')");
    console.log("");
    console.log("   ⏱️  O script escuta por 5 minutos.");
    console.log("   (ou pressione Ctrl+C para sair antes)\n");
  });

  client.on("message", (message: Message) => {
    const from = message.from;
    const raw = (message as any)._data;
    const name = raw?.notifyName || "(sem nome)";
    const body = message.body?.substring(0, 100) || "(mídia sem texto)";

    console.log(`\n📩 MENSAGEM RECEBIDA`);
    console.log(`   ┌─ De:     ${from}`);
    console.log(`   ├─ Nome:   ${name}`);
    console.log(`   └─ Msg:    ${body}`);

    if (from.endsWith("@g.us")) {
      console.log(`\n   ✅👈 É UM GRUPO! Copie este ID:`);
      console.log(`   ┌─────────────────────────────────────────────`);
      console.log(`   │ WHATSAPP_GROUP_ID=${from}`);
      console.log(`   └─────────────────────────────────────────────`);
      console.log(`   📝 Cole esse valor no arquivo config/.env`);
    }
    console.log("");
  });

  client.on("disconnected", (reason) => {
    console.log(`\n⚠️  Desconectado: ${reason}`);
    process.exit(1);
  });

  await client.initialize();

  // Contagem regressiva — avisa a cada 30s por 5 minutos
  const DURACAO_MS = 300_000; // 5 minutos
  const INTERVALO_AVISO = 30_000; // 30 segundos

  let tempoRestante = DURACAO_MS / 1000;
  const timer = setInterval(() => {
    tempoRestante -= INTERVALO_AVISO / 1000;
    if (tempoRestante > 0) {
      const min = Math.floor(tempoRestante / 60);
      const seg = tempoRestante % 60;
      console.log(`   ⏱️  Ainda escutando... ${min}m${seg}s restantes`);
    }
  }, INTERVALO_AVISO);

  setTimeout(async () => {
    clearInterval(timer);
    console.log("\n⏰ Tempo esgotado (5 min). Encerrando...");
    await client.destroy();
    console.log("\n✅ Script concluído.");
    console.log("   Se apareceu um ID de grupo (terminando em @g.us),");
    console.log("   copie e cole no config/.env.");
    console.log("   Se NÃO apareceu nenhuma mensagem, execute de novo:");
    console.log("   npm run discover");
    console.log("   E desta vez envie a mensagem no grupo ☝️\n");
    process.exit(0);
  }, DURACAO_MS);
}

discover().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
