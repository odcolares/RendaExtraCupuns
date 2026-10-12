/**
 * TenantBot — Bot isolado por tenant.
 *
 * Encapsula: WhatsApp Client + Telegram Bot + Processor + Affiliate Config
 * Um TenantBot = 1 Tenant = 1 WhatsApp number = 1 Telegram bot
 */

import { Prisma } from "@/generated/prisma/client";
import { createModuleLogger } from "../utils";
import type { TenantBotStatus, ProcessResult, ManualOfferInput, ProcessedOffer, WhatsAppMessage } from "./types";
import { WhatsAppClient } from "../whatsapp/client";
import { TelegramPublisher } from "../telegram/publisher";
import { OfferProcessor } from "./offer-processor";
import { AffiliateLinkGenerator, NormalizedAffiliateConfig } from "./affiliate-generator";

const log = createModuleLogger("TenantBot");

// ==============================================================
// Tipos auxiliares locais
// ==============================================================

interface TenantWithRelations {
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
// TenantBot Class
// ==============================================================

export class TenantBot {
  private tenant: TenantWithRelations;
  private whatsappClient: WhatsAppClient | null = null;
  private telegramPublisher: TelegramPublisher | null = null;
  private processor: OfferProcessor;
  private affiliateGenerator: AffiliateLinkGenerator;
  private isRunning = false;
  private qrCodeData: string | null = null;
  private whatsappReady = false;
  private telegramTested = false;
  private lastWhatsAppConnected: Date | null = null;
  private offersProcessed24h = 0;
  private offersPublished24h = 0;
  private errors24h = 0;

  constructor(tenant: TenantWithRelations) {
    this.tenant = tenant;
    this.processor = new OfferProcessor(tenant);
    
    // Normaliza config de afiliado para o formato esperado pelo generator
    const normalizedConfig: NormalizedAffiliateConfig | null = tenant.affiliateConfig ? {
      amazon: tenant.affiliateConfig.amazonTag ? {
        tag: tenant.affiliateConfig.amazonTag,
        marketplace: process.env.AMAZON_MARKETPLACE || "www.amazon.com.br",
      } : undefined,
      aliexpress: tenant.affiliateConfig.aliexpressId ? {
        affiliateId: tenant.affiliateConfig.aliexpressId,
      } : undefined,
      shopee: tenant.affiliateConfig.shopeeId ? {
        affiliateId: tenant.affiliateConfig.shopeeId,
      } : undefined,
      mercadolivre: tenant.affiliateConfig.mlId ? {
        affiliateId: tenant.affiliateConfig.mlId,
        accessToken: process.env.ML_ACCESS_TOKEN || "",
      } : undefined,
    } : null;

    this.affiliateGenerator = new AffiliateLinkGenerator(normalizedConfig);
    this.processor = new OfferProcessor(tenant);
  }

  // ==================== LIFECYCLE ====================

  /**
   * Inicializa tudo: carrega sessão WhatsApp, conecta Telegram, valida canais
   * Retorna QR code (base64) se WhatsApp precisar de pareamento
   */
  async initialize(): Promise<{ qrCode?: string; telegramTested: boolean }> {
    log.info("Inicializando TenantBot", { tenantId: this.tenant.id, tenantName: this.tenant.name });

    // ── 1. WhatsApp Client ──
    const sessionBasePath = process.env.WHATSAPP_SESSION_BASE_PATH || "./whatsapp-sessions";
    const sessionPath = `${sessionBasePath}/${this.tenant.id}`;

    this.whatsappClient = new WhatsAppClient(this.tenant.id, sessionPath);

    // Event handlers
    this.whatsappClient.onQr((qrBase64: string) => {
      this.qrCodeData = qrBase64;
      log.debug("QR code gerado", { tenantId: this.tenant.id });
    });

    this.whatsappClient.onReady(() => {
      this.whatsappReady = true;
      this.lastWhatsAppConnected = new Date();
      log.info("WhatsApp conectado e pronto", { tenantId: this.tenant.id });
    });

    this.whatsappClient.onMessage(async (message: WhatsAppMessage) => {
      await this.processWhatsAppMessage(message);
    });

    this.whatsappClient.onDisconnected(async (reason: string) => {
      this.whatsappReady = false;
      this.qrCodeData = null;
      log.warn("WhatsApp desconectado", { tenantId: this.tenant.id, reason });
    });

    await this.whatsappClient.initialize();

    // ── 2. Telegram Publisher ──
    const telegramChannel = this.tenant.channels.find(c => c.platform === "telegram" && c.isActive);
    if (telegramChannel) {
      // O token do bot Telegram deve vir de uma variável de ambiente global ou do DB
      // Por enquanto usamos a global; no futuro pode ser por tenant
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        this.telegramPublisher = new TelegramPublisher(botToken, telegramChannel.channelId);
        log.info("Telegram publisher configurado", {
          tenantId: this.tenant.id,
          channelId: telegramChannel.channelId,
        });
      } else {
        log.warn("TELEGRAM_BOT_TOKEN não definido — publicação desabilitada", {
          tenantId: this.tenant.id,
        });
      }
    } else {
      log.warn("Nenhum canal Telegram ativo configurado", { tenantId: this.tenant.id });
    }

    // ── 3. Testar conexão Telegram ──
    this.telegramTested = false;
    if (this.telegramPublisher) {
      const testResult = await this.telegramPublisher.testConnection();
      this.telegramTested = testResult.success;
      if (testResult.success) {
        log.info("Teste de conexão Telegram bem-sucedido", { tenantId: this.tenant.id });
      } else {
        log.warn("Teste de conexão Telegram falhou", {
          tenantId: this.tenant.id,
          error: testResult.error,
        });
      }
    }

    return {
      qrCode: this.qrCodeData || undefined,
      telegramTested: this.telegramTested,
    };
  }

  /**
   * Inicia monitoramento WhatsApp + fila de publicação Telegram
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      log.warn("Bot já está rodando", { tenantId: this.tenant.id });
      return;
    }

    if (!this.whatsappClient) {
      throw new Error("Bot não inicializado. Chame initialize() primeiro.");
    }

    log.info("Iniciando TenantBot", { tenantId: this.tenant.id });

    await this.whatsappClient.connect();
    this.isRunning = true;

    log.info("✅ TenantBot iniciado", { tenantId: this.tenant.id });
  }

  /**
   * Para graciosamente: WhatsApp → Telegram → cleanup
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    log.info("Parando TenantBot", { tenantId: this.tenant.id });

    this.isRunning = false;

    if (this.whatsappClient) {
      await this.whatsappClient.disconnect();
    }

    log.info("⏹️ TenantBot parado", { tenantId: this.tenant.id });
  }

  /**
   * Destrói completamente (cleanup de arquivos de sessão)
   */
  async destroy(): Promise<void> {
    log.info("Destruindo TenantBot", { tenantId: this.tenant.id });

    await this.stop();

    if (this.whatsappClient) {
      await this.whatsappClient.destroy();
      this.whatsappClient = null;
    }

    this.telegramPublisher = null;
    this.qrCodeData = null;
    this.whatsappReady = false;
    this.telegramTested = false;
  }

  // ==================== STATUS ====================

  getStatus(): TenantBotStatus {
    const activeFontes = this.tenant.fontes.filter(f => f.isActive).length;
    const lastChecked = this.tenant.fontes.length > 0
      ? new Date(Math.max(...this.tenant.fontes.map(f => f.lastChecked.getTime())))
      : null;

    return {
      tenantId: this.tenant.id,
      tenantName: this.tenant.name,
      isRunning: this.isRunning,
      whatsapp: {
        ready: this.whatsappReady,
        qrCodeGenerated: !!this.qrCodeData,
        lastConnected: this.lastWhatsAppConnected,
        sessionPath: this.whatsappClient?.getSessionPath() || "",
      },
      telegram: {
        configured: !!this.telegramPublisher,
        tested: this.telegramTested,
        lastTested: this.telegramTested ? new Date() : null,
        botUsername: null, // TODO: obter do bot info
      },
      afiliados: {
        amazon: !!this.tenant.affiliateConfig?.amazonTag,
        shopee: !!this.tenant.affiliateConfig?.shopeeId,
        mercadolivre: !!this.tenant.affiliateConfig?.mlId,
        aliexpress: !!this.tenant.affiliateConfig?.aliexpressId,
      },
      fontes: {
        total: this.tenant.fontes.length,
        active: activeFontes,
        lastChecked,
      },
      stats: {
        offersProcessed24h: this.offersProcessed24h,
        offersPublished24h: this.offersPublished24h,
        errors24h: this.errors24h,
      },
    };
  }

  getQrCode(): string | null {
    return this.qrCodeData;
  }

  isHealthy(): boolean {
    return this.isRunning && this.whatsappReady;
  }

  // ==================== WHATSAPP ====================

  /**
   * Gera QR code para pareamento (retorna base64 data URL)
   */
  async generateQrCode(): Promise<string> {
    if (!this.whatsappClient) {
      throw new Error("WhatsApp client não inicializado");
    }

    // O QR code é gerado automaticamente via evento 'qr'
    // Se já temos, retorna; senão força reconexão
    if (this.qrCodeData) {
      return this.qrCodeData;
    }

    // Força nova geração de QR reiniciando o cliente
    await this.reconnectWhatsApp();

    // Aguarda até 10s pelo QR
    for (let i = 0; i < 20; i++) {
      if (this.qrCodeData) return this.qrCodeData;
      await new Promise(r => setTimeout(r, 500));
    }

    throw new Error("Timeout gerando QR code");
  }

  /**
   * Verifica se WhatsApp está conectado e pronto
   */
  isWhatsAppReady(): boolean {
    return this.whatsappReady;
  }

  /**
   * Reconecta WhatsApp (útil após erro)
   */
  async reconnectWhatsApp(): Promise<void> {
    if (!this.whatsappClient) {
      throw new Error("WhatsApp client não inicializado");
    }

    log.info("Reconectando WhatsApp", { tenantId: this.tenant.id });

    this.whatsappReady = false;
    this.qrCodeData = null;

    await this.whatsappClient.disconnect();
    await new Promise(r => setTimeout(r, 2000));
    await this.whatsappClient.connect();
  }

  // ==================== TELEGRAM ====================

  /**
   * Testa conexão Telegram (envia msg de teste no canal)
   */
  async testTelegramConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.telegramPublisher) {
      return { success: false, error: "Telegram não configurado" };
    }

    const result = await this.telegramPublisher.testConnection();
    this.telegramTested = result.success;
    return result;
  }

  /**
   * Publica oferta no canal Telegram do tenant
   */
  async publishToTelegram(offer: ProcessedOffer): Promise<{ success: boolean; messageId?: number }> {
    if (!this.telegramPublisher) {
      return { success: false, messageId: undefined };
    }

    try {
      const result = await this.telegramPublisher.publish(offer, offer.affiliateLink);
      if (result.success) {
        this.offersPublished24h++;
      }
      return { success: result.success, messageId: result.messageId };
    } catch (error) {
      this.errors24h++;
      log.error("Erro ao publicar no Telegram", {
        tenantId: this.tenant.id,
        error: (error as Error).message,
      });
      return { success: false, messageId: undefined };
    }
  }

  // ==================== PROCESSAMENTO ====================

  /**
   * Processa mensagem bruta do WhatsApp → oferta → salva → publica
   */
  async processWhatsAppMessage(message: WhatsAppMessage): Promise<ProcessResult> {
    if (!this.isRunning) {
      return { success: false, error: "bot não está rodando" };
    }

    log.debug("Processando mensagem WhatsApp", {
      tenantId: this.tenant.id,
      messageLength: message.body?.length || 0,
    });

    this.offersProcessed24h++;

    try {
      const result = await this.processor.process(message);

      if (result.success && result.offer) {
        // Publica no Telegram se tiver link de afiliado
        if (result.offer.affiliateLink) {
          await this.publishToTelegram(result.offer as unknown as ProcessedOffer);
        }
      }

      return result;
    } catch (error) {
      this.errors24h++;
      log.error("Erro no processamento da mensagem", {
        tenantId: this.tenant.id,
        error: (error as Error).message,
      });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Publica oferta manual (via dashboard)
   */
  async publishManualOffer(offerData: ManualOfferInput): Promise<ProcessResult> {
    log.info("Publicando oferta manual", { tenantId: this.tenant.id });

    try {
      const result = await this.processor.processManual(offerData);

      if (result.success && result.offer && result.offer.affiliateLink) {
        await this.publishToTelegram(result.offer as unknown as ProcessedOffer);
      }

      return result;
    } catch (error) {
      this.errors24h++;
      log.error("Erro na publicação manual", {
        tenantId: this.tenant.id,
        error: (error as Error).message,
      });
      return { success: false, error: (error as Error).message };
    }
  }
}