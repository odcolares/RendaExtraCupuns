/**
 * Carregador de configurações centralizado.
 * Lê variáveis do .env e exporta objetos tipados por módulo.
 */

import dotenv from "dotenv";
import path from "path";

// Carrega .env do diretório config/
dotenv.config({ path: path.resolve(__dirname, "../../config/.env") });

// ==============================================================
// Interfaces
// ==============================================================

export interface TelegramConfig {
  botToken: string;
  channelId: string;
}

export interface WhatsAppConfig {
  groupIds: string[];
  newsletterId: string | null;
  sessionPath: string;
}

export interface AffiliatesConfig {
  amazon: { tag: string };
  aliexpress: { id: string };
  shopee: { id: string };
  mercadolivre: { id: string };
}

export interface AppConfig {
  telegram: TelegramConfig;
  whatsapp: WhatsAppConfig;
  affiliates: AffiliatesConfig;
}

// ==============================================================
// Helpers
// ==============================================================

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
  }
  return value;
}

// ==============================================================
// Config loaders
// ==============================================================

export function loadTelegramConfig(): TelegramConfig {
  return {
    botToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    channelId: requireEnv("TELEGRAM_CHANNEL_ID"),
  };
}

export function loadWhatsAppConfig(): WhatsAppConfig {
  const raw = requireEnv("WHATSAPP_GROUP_IDS");
  return {
    groupIds: raw.split(",").map((id) => id.trim()).filter(Boolean),
    newsletterId: process.env.WHATSAPP_NEWSLETTER_ID || null,
    sessionPath: process.env.WHATSAPP_SESSION_PATH || "./whatsapp-session",
  };
}

export function loadAffiliatesConfig(): AffiliatesConfig {
  return {
    amazon: { tag: requireEnv("AMAZON_AFFILIATE_TAG") },
    aliexpress: { id: requireEnv("ALIEXPRESS_AFFILIATE_ID") },
    shopee: { id: requireEnv("SHOPEE_AFFILIATE_ID") },
    mercadolivre: { id: requireEnv("MERCADOLIVRE_AFFILIATE_ID") },
  };
}

// ==============================================================
// Config unificada (valida tudo no startup)
// ==============================================================

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (!_config) {
    _config = {
      telegram: loadTelegramConfig(),
      whatsapp: loadWhatsAppConfig(),
      affiliates: loadAffiliatesConfig(),
    };
  }
  return _config;
}

export default loadConfig;
