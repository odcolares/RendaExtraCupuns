/**
 * Aplicação principal — inicialização e ciclo de vida do bot.
 *
 * Ordem de inicialização:
 *   1. Config (.env)
 *   2. Database (SQLite)
 *   3. Telegram Bot (se token disponível)
 *   4. WhatsApp Client (opcional, via startMonitoring)
 *
 * Ordem de shutdown:
 *   WhatsApp → Telegram → Database
 */

import { loadConfig } from "./config";
import { initDatabase, closeDatabase } from "./database/index";
import { initializeBot, launchBot, stopBot, getBot } from "./telegram/bot";
import { setupCommands } from "./telegram/commands";
import { initializeWhatsApp, startClient, destroyClient } from "./whatsapp/client";
import { startMonitoring, stopMonitoring } from "./whatsapp/monitor";
import { createModuleLogger } from "./utils";
import { processOffer } from "./processor";

const log = createModuleLogger("App");

// ==============================================================
// Estado da aplicação
// ==============================================================

export interface AppState {
  configLoaded: boolean;
  databaseReady: boolean;
  telegramReady: boolean;
  whatsappReady: boolean;
  monitoring: boolean;
}

let appState: AppState = {
  configLoaded: false,
  databaseReady: false,
  telegramReady: false,
  whatsappReady: false,
  monitoring: false,
};

export function getAppState(): AppState {
  return { ...appState };
}

// ==============================================================
// Inicialização
// ==============================================================

/**
 * Inicia todos os módulos do bot.
 */
export async function startApp(options?: {
  whatsapp?: boolean;
  telegram?: boolean;
}): Promise<void> {
  log.info("Iniciando RendaExtraCupuns...");

  // ── 1. Config ──
  try {
    loadConfig();
    appState.configLoaded = true;
    log.info("Configuração carregada");
  } catch (err) {
    log.error("Falha ao carregar configuração", {
      error: (err as Error).message,
    });
    log.info("Crie config/.env a partir de config/.env.example");
    // Não aborta — permite rodar sem .env completo em dev
  }

  // ── 2. Database ──
  try {
    await initDatabase();
    appState.databaseReady = true;
  } catch (err) {
    log.error("Falha ao inicializar database", {
      error: (err as Error).message,
    });
  }

  // ── 3. Telegram Bot ──
  const shouldInitTelegram = options?.telegram !== false;
  if (shouldInitTelegram && process.env.TELEGRAM_BOT_TOKEN) {
    try {
      const bot = initializeBot(process.env.TELEGRAM_BOT_TOKEN);
      setupCommands(bot);
      launchBot();
      appState.telegramReady = true;
    } catch (err) {
      log.warn("Telegram bot não iniciado (token pode estar inválido)", {
        error: (err as Error).message,
      });
    }
  } else {
    log.info("Telegram bot não iniciado (sem token ou desabilitado via options)");
  }

  // ── 4. WhatsApp ──
  const shouldInitWhatsApp = options?.whatsapp !== false;
  if (shouldInitWhatsApp && process.env.WHATSAPP_GROUP_IDS) {
    try {
      initializeWhatsApp(process.env.WHATSAPP_SESSION_PATH);
      log.info("WhatsApp client initialized, connecting...");
      appState.whatsappReady = true;

      await startClient();
      await startMonitoring();
      appState.monitoring = true;
      log.info("QR code gerado — escaneie com o WhatsApp para conectar");
    } catch (err) {
      log.warn("WhatsApp não inicializado", {
        error: (err as Error).message,
      });
    }
  } else {
    log.info("WhatsApp não inicializado (desabilitado via options)");
  }

  log.info("RendaExtraCupuns pronto!", {
    database: appState.databaseReady,
    telegram: appState.telegramReady,
    whatsapp: appState.whatsappReady,
  });
}

/**
 * Inicia o monitoramento do WhatsApp.
 * Deve ser chamado após startApp() se o cliente WhatsApp estiver pronto.
 */
export async function startWhatsAppMonitor(): Promise<void> {
  if (!appState.whatsappReady) {
    log.warn("WhatsApp não está pronto para monitorar");
    return;
  }

  try {
    await startClient();
    await startMonitoring();
    appState.monitoring = true;
    log.info("Monitoramento WhatsApp ativo");
  } catch (err) {
    log.error("Falha ao iniciar monitoramento WhatsApp", {
      error: (err as Error).message,
    });
  }
}

// ==============================================================
// Shutdown gracioso
// ==============================================================

/**
 * Para todos os módulos graciosamente.
 * Ordem inversa da inicialização.
 */
export async function stopApp(): Promise<void> {
  log.info("Parando RendaExtraCupuns...");

  // 1. Parar monitor WhatsApp
  if (appState.monitoring) {
    await stopMonitoring();
    appState.monitoring = false;
  }

  // 2. Destruir cliente WhatsApp
  if (appState.whatsappReady) {
    await destroyClient();
    appState.whatsappReady = false;
  }

  // 3. Parar bot Telegram
  if (appState.telegramReady) {
    await stopBot();
    appState.telegramReady = false;
  }

  // 4. Fechar database
  if (appState.databaseReady) {
    await closeDatabase();
    appState.databaseReady = false;
  }

  appState.configLoaded = false;
  log.info("RendaExtraCupuns parado.");
}

// ==============================================================
// Handler de sinais para graceful shutdown
// ==============================================================

process.once("SIGINT", async () => {
  log.info("SIGINT recebido");
  await stopApp();
  process.exit(0);
});

process.once("SIGTERM", async () => {
  log.info("SIGTERM recebido");
  await stopApp();
  process.exit(0);
});
