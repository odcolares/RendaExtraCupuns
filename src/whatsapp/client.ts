/**
 * WhatsApp Client — inicialização com LocalAuth, QR code e reconexão.
 *
 * Singleton: initializeWhatsApp() → getClient()
 * Usa whatsapp-web.js com LocalAuth para persistência de sessão.
 */

import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import { createModuleLogger } from "../utils";
import type { WhatsAppMessage } from "./types";

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
    qrMaxRetries: 3,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 60000,
  });

  // ── QR Code ──
  client.on("qr", (qr: string) => {
    log.info("QR code recebido — escaneie com o WhatsApp");
    qrcode.generate(qr, { small: true });
    QRCode.toFile("whatsapp-qr.png", qr, { type: "png", width: 400, margin: 2 })
      .then(() => log.info("QR salvo em whatsapp-qr.png"))
      .catch((err) => log.warn("Falha ao salvar QR PNG", { error: (err as Error).message }));
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
      log.error("Número máximo de tentativas de reconexão atingido — encerrando para reinício via PM2");
      await safeDestroy();
      client = null;
      process.exit(1);
      return;
    }

    reconnectAttempts++;
    const delayMs = INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1);
    log.info("Tentando reconectar...", { attempt: reconnectAttempts, delayMs: delayMs });

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    try {
      // A página puppeteer pode ter navegado/destroyed (causa do erro
      // "Execution context was destroyed" durante o inject). Destruímos a
      // instância atual e criamos um cliente novo e limpo para reconectar.
      await safeDestroy();
      client = null;
      const fresh = initializeWhatsApp();
      await fresh.initialize();
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
 * Destrói o cliente puppeteer de forma segura, ignorando erros quando a
 * página já foi fechada ou o contexto foi destruído por uma navegação.
 */
async function safeDestroy(): Promise<void> {
  try {
    if (client) {
      await client.destroy();
    }
  } catch (err) {
    log.warn("Erro ao destruir cliente (ignorado)", {
      error: (err as Error)?.message,
    });
  }
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
 * Destrói o cliente e limpa a instância.
 */
export async function destroyClient(): Promise<void> {
  if (client) {
    await client.destroy();
    client = null;
    reconnectAttempts = 0;
    log.info("Cliente WhatsApp destruído");
  }
}

// ==============================================================
// WhatsAppClient — Wrapper classe para multi-tenant (um cliente por tenant)
// ==============================================================

export interface WhatsAppClientEvents {
  qr: (qrBase64: string) => void;
  ready: () => void;
  message: (message: WhatsAppMessage) => void;
  disconnected: (reason: string) => void;
}

export class WhatsAppClient {
  private client: Client | null = null;
  private readonly tenantId: string;
  private readonly sessionPath: string;
  private handlers: Partial<WhatsAppClientEvents> = {};

  constructor(tenantId: string, sessionPath: string) {
    this.tenantId = tenantId;
    this.sessionPath = sessionPath;
  }

  onQr(handler: (qrBase64: string) => void): this {
    this.handlers.qr = handler;
    return this;
  }

  onReady(handler: () => void): this {
    this.handlers.ready = handler;
    return this;
  }

  onMessage(handler: (message: WhatsAppMessage) => void): this {
    this.handlers.message = handler;
    return this;
  }

  onDisconnected(handler: (reason: string) => void): this {
    this.handlers.disconnected = handler;
    return this;
  }

  async initialize(): Promise<void> {
    if (this.client) {
      log.debug("WhatsAppClient já inicializado", { tenantId: this.tenantId });
      return;
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: this.tenantId,
        dataPath: this.sessionPath,
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
      qrMaxRetries: 3,
      takeoverOnConflict: true,
      takeoverTimeoutMs: 60000,
    });

    if (this.handlers.qr) {
      this.client.on("qr", (qr: string) => {
        QRCode.toDataURL(qr, { width: 400 })
          .then((dataUrl: string) => this.handlers.qr!(dataUrl))
          .catch(() => this.handlers.qr!(qr));
      });
    }

    if (this.handlers.ready) {
      this.client.on("ready", () => this.handlers.ready!());
    }

    if (this.handlers.message) {
      this.client.on("message", (msg: Message) => {
        this.handlers.message!({
          body: msg.body,
          from: msg.from,
        });
      });
    }

    if (this.handlers.disconnected) {
      this.client.on("disconnected", (reason: string) => {
        this.handlers.disconnected!(reason);
      });
    }
  }

  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error("Client não inicializado. Chame initialize() primeiro.");
    }
    await this.client.initialize();
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }
  }

  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
    this.handlers = {};
  }

  getSessionPath(): string {
    return this.sessionPath;
  }

  isReady(): boolean {
    return this.client !== null;
  }
}
