/**
 * WhatsApp Client — inicialização com LocalAuth, QR code e reconexão.
 *
 * Singleton: initializeWhatsApp() → getClient()
 * Usa whatsapp-web.js com LocalAuth para persistência de sessão.
 */

import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { createModuleLogger } from "../utils";

const log = createModuleLogger("WhatsAppClient");

let client: Client | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY_MS = 5000;

/**
 * Inicializa (ou retorna) a instância singleton do cliente WhatsApp.
 */
export function initializeWhatsApp(
  sessionPath?: string
): Client {
  if (client) {
    log.debug("Cliente WhatsApp já inicializado");
    return client;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionPath || "./.wwebjs_auth",
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
    qrMaxRetries: 3,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 60000,
  });

  // ── QR Code ──
  client.on("qr", (qr: string) => {
    log.info("QR code recebido — escaneie com o WhatsApp");
    qrcode.generate(qr, { small: true });
  });

  // ── Autenticado ──
  client.on("authenticated", () => {
    log.info("WhatsApp autenticado com sucesso");
    reconnectAttempts = 0;
  });

  // ── Pronto ──
  client.on("ready", () => {
    log.info("✅ Cliente WhatsApp pronto e conectado");
  });

  // ── Falha de autenticação ──
  client.on("auth_failure", (msg: string) => {
    log.error("Falha na autenticação do WhatsApp", { message: msg });
  });

  // ── Desconectado (com reconexão exponencial) ──
  client.on("disconnected", async (reason: string) => {
    log.warn("WhatsApp desconectado", { reason, attempt: reconnectAttempts + 1 });

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      log.error("Número máximo de tentativas de reconexão atingido");
      client = null;
      return;
    }

    reconnectAttempts++;
    const delayMs = INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1);
    log.info("Tentando reconectar...", { attempt: reconnectAttempts, delayMs });

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      await client?.initialize();
    } catch (err) {
      log.error("Falha na reconexão", { error: (err as Error).message });
    }
  });

  return client;
}

/**
 * Retorna a instância do cliente (null se não inicializado).
 */
export function getClient(): Client | null {
  return client;
}

/**
 * Inicia o cliente (dispara QR code se necessário).
 */
export async function startClient(): Promise<void> {
  if (!client) {
    throw new Error("WhatsApp não inicializado. Chame initializeWhatsApp() primeiro.");
  }

  try {
    await client.initialize();
    log.info("Cliente WhatsApp inicializado");
  } catch (err) {
    log.error("Falha ao inicializar cliente WhatsApp", {
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Destroi o cliente e limpa a instância.
 */
export async function destroyClient(): Promise<void> {
  if (client) {
    await client.destroy();
    client = null;
    reconnectAttempts = 0;
    log.info("Cliente WhatsApp destruído");
  }
}
