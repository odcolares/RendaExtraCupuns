/**
 * Tipos do módulo Bot Multi-Tenant
 */

import type { OfferData } from "../types";
import type { WhatsAppMessage, ProcessResult } from "../whatsapp/types";
import { Prisma } from "@/generated/prisma/client";

// ==============================================================
// Tenant com relações (usado para inicializar TenantBot)
// ==============================================================

export interface TenantWithRelations {
  id: string;
  name: string;
  plan: Prisma.EnumTenantPlanFilter["equals"];
  status: Prisma.EnumTenantStatusFilter["equals"];
  channels: Array<{
    id: string;
    platform: "telegram" | "whatsapp";
    channelId: string;
    label: string | null;
    isActive: boolean;
  }>;
  affiliateConfig: {
    amazonTag: string | null;
    shopeeId: string | null;
    mlId: string | null;
    aliexpressId: string | null;
  } | null;
  fontes: Array<{
    id: string;
    name: string;
    url: string;
    isActive: boolean;
    lastChecked: Date;
    totalOffersFound: number;
    totalOffersPublished: number;
  }>;
}

// ==============================================================
// Status do TenantBot
// ==============================================================

export interface TenantBotStatus {
  tenantId: string;
  tenantName: string;
  isRunning: boolean;
  whatsapp: {
    ready: boolean;
    qrCodeGenerated: boolean;
    lastConnected: Date | null;
    sessionPath: string;
  };
  telegram: {
    configured: boolean;
    tested: boolean;
    lastTested: Date | null;
    botUsername: string | null;
  };
  afiliados: {
    amazon: boolean;
    shopee: boolean;
    mercadolivre: boolean;
    aliexpress: boolean;
  };
  fontes: {
    total: number;
    active: number;
    lastChecked: Date | null;
  };
  stats: {
    offersProcessed24h: number;
    offersPublished24h: number;
    errors24h: number;
  };
}

// Re-export ProcessResult from shared types
export type { ProcessResult };

// ==============================================================
// Oferta processada (pronta para publicação)
// ==============================================================

export interface ProcessedOffer extends OfferData {
  affiliateLink: string;
  trackingUrl: string;
  tenantId: string;
}

// ==============================================================
// Entrada para publicação manual
// ==============================================================

export interface ManualOfferInput {
  name: string;
  originalPrice: number | null;
  currentPrice: number | null;
  discount: number | null;
  platform: string;
  originalUrl: string;
  imageUrl?: string;
  description?: string;
  tenantId: string;
}

// ==============================================================
// Eventos do WhatsAppClient
// ==============================================================

export type WhatsAppClientEvents = {
  qr: (qrBase64: string) => void;
  ready: () => void;
  message: (message: WhatsAppMessage) => void;
  disconnected: (reason: string) => void;
};

// ==============================================================
// Configuração do BotManager
// ==============================================================

export interface BotManagerConfig {
  healthCheckIntervalMs: number;
  maxMemoryMb: number;
  whatsappReconnectThresholdMs: number;
  inactivityAlertHours: number;
}

// Re-export
export type { WhatsAppMessage, OfferData };