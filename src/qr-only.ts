/**
 * Script exclusivo para gerar QR Code do WhatsApp.
 * Roda apenas o necessário: config + whatsapp-web.js
 *
 * Uso: npx ts-node src/qr-only.ts
 */

import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

console.log("═══════════════════════════════════════════");
console.log("  RendaExtraCupuns — Gerador de QR Code");
console.log("═══════════════════════════════════════════");
console.log();
console.log("⏳ Iniciando WhatsApp... (pode levar alguns segundos)");
console.log();

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  },
  qrMaxRetries: 10,
});

client.on("qr", (qr: string) => {
  console.log("\n📱 ESCANEIE O QR CODE ABAIXO com o WhatsApp do chip novo:");
  console.log("   (WhatsApp → ⋮ → Dispositivos Linkados → Linkar)");
  console.log();
  qrcode.generate(qr, { small: false });
  console.log();
});

client.on("authenticated", () => {
  console.log("✅ WhatsApp autenticado com sucesso!");
});

client.on("ready", () => {
  console.log("✅ Cliente WhatsApp pronto e conectado!");
  console.log();
  console.log("═══════════════════════════════════════════");
  console.log("  Agora o bot está conectado!");
  console.log("  Pode fechar este terminal com Ctrl+C");
  console.log("  Na próxima vez, use: npm run dev");
  console.log("═══════════════════════════════════════════");
  process.exit(0);
});

client.on("auth_failure", (msg: string) => {
  console.error("❌ Falha na autenticação:", msg);
  process.exit(1);
});

client.on("disconnected", (reason: string) => {
  console.warn("⚠ Desconectado:", reason);
});

client.initialize();
