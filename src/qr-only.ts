/**
 * Script exclusivo para gerar QR Code do WhatsApp.
 * Roda apenas o necessário: config + whatsapp-web.js
 *
 * Uso: npx ts-node src/qr-only.ts
 */

import { Client, LocalAuth } from "whatsapp-web.js";
import qrcodeTerminal from "qrcode-terminal";
import QRCode from "qrcode";
import path from "path";

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
  webVersion: "2.3000.1041831138-alpha",
  webVersionCache: {
    type: "local",
    path: "./.wwebjs_cache",
    strict: true,
  },
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
  qrcodeTerminal.generate(qr, { small: false });
  console.log();

  const pngPath = path.resolve(__dirname, "../../whatsapp-qr.png");
  QRCode.toFile(pngPath, qr, { type: "png", width: 400, margin: 2 })
    .then(() => {
      console.log(`📷 QR salvo como imagem: ${pngPath}`);
      console.log("   Abra esta imagem no celular e escaneie com o WhatsApp.");
      console.log();
    })
    .catch((err) => console.error("Erro ao salvar PNG:", err));
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
