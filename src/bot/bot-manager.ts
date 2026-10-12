/**
 * BotManager — Orquestrador singleton de TenantBots.
 *
 * Gerencia ciclo de vida de TODOS os TenantBots ativos:
 * - Carrega tenants ativos do banco na inicialização
 * - Monitora health (restart automático se cair)
 * - API para Admin: start/stop/restart/status por tenant
 * - Graceful shutdown global
 */

import { Prisma } from "@/generated/prisma/client";
import { createModuleLogger } from "../utils";
import { prisma } from "../lib/prisma";
import { TenantBot } from "./tenant-bot";
import type { TenantBotStatus, TenantWithRelations } from "./types";

const log = createModuleLogger("BotManager");

// ==============================================================
// Singleton
// ==============================================================

let instance: BotManager | null = null;

export function getBotManager(): BotManager {
  if (!instance) {
    instance = new BotManager();
  }
  return instance!;
}

// ==============================================================
// BotManager Class
// ==============================================================

export class BotManager {
  private bots: Map<string, TenantBot> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;
  private tenantCache: TenantWithRelations[] = [];
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 60_000; // 1 minuto

  constructor() {}

  // ==================== LIFECYCLE GLOBAL ====================

  /**
   * Inicia bots de todos tenants com status=active e plan!=free
   */
  async startAll(): Promise<{ started: string[]; failed: string[] }> {
    log.info("Iniciando todos os bots ativos...");

    const tenants = await this.getActiveTenants();
    const started: string[] = [];
    const failed: string[] = [];

    for (const tenant of tenants) {
      try {
        await this.startTenant(tenant.id);
        started.push(tenant.id);
      } catch (error) {
        log.error("Falha ao iniciar bot do tenant", {
          tenantId: tenant.id,
          error: (error as Error).message,
        });
        failed.push(tenant.id);
      }
    }

    log.info("Inicialização em lote concluída", { started: started.length, failed: failed.length });
    return { started, failed };
  }

  /**
   * Para todos os bots graciosamente
   */
  async stopAll(): Promise<void> {
    log.info("Parando todos os bots...");

    this.isShuttingDown = true;
    this.stopHealthCheck();

    const stopPromises = Array.from(this.bots.entries()).map(async ([tenantId, bot]) => {
      try {
        await bot.stop();
      } catch (error) {
        log.error("Erro ao parar bot", { tenantId, error: (error as Error).message });
      }
    });

    await Promise.all(stopPromises);
    this.bots.clear();

    log.info("Todos os bots parados");
  }

  // ==================== TENANT OPERATIONS ====================

  /**
   * Inicia bot de um tenant específico
   */
  async startTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
    if (this.bots.has(tenantId)) {
      const existingBot = this.bots.get(tenantId)!;
      if (existingBot.isHealthy()) {
        return { success: true, error: "Bot já está rodando" };
      }
      // Bot existe mas não saudável → reinicia
      await this.stopTenant(tenantId);
    }

    const tenant = await this.getTenantWithRelations(tenantId);
    if (!tenant) {
      return { success: false, error: "Tenant não encontrado" };
    }

    if (tenant.status !== "active") {
      return { success: false, error: `Tenant status é ${tenant.status}, não active` };
    }

    if (tenant.plan === "free") {
      return { success: false, error: "Plano free não tem bot" };
    }

    try {
      const bot = new TenantBot(tenant);
      await bot.initialize();
      await bot.start();

      this.bots.set(tenantId, bot);
      log.info("Bot iniciado com sucesso", { tenantId });

      return { success: true };
    } catch (error) {
      log.error("Erro ao iniciar bot do tenant", {
        tenantId,
        error: (error as Error).message,
      });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Para bot de um tenant
   */
  async stopTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
    const bot = this.bots.get(tenantId);
    if (!bot) {
      return { success: false, error: "Bot não encontrado" };
    }

    try {
      await bot.stop();
      await bot.destroy();
      this.bots.delete(tenantId);
      log.info("Bot parado e destruído", { tenantId });
      return { success: true };
    } catch (error) {
      log.error("Erro ao parar bot", { tenantId, error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Reinicia bot (útil após mudança de config)
   */
  async restartTenant(tenantId: string): Promise<{ success: boolean; error?: string }> {
    log.info("Reiniciando bot", { tenantId });

    await this.stopTenant(tenantId);
    return this.startTenant(tenantId);
  }

  /**
   * Retorna instância do bot (para admin ações diretas)
   */
  getBot(tenantId: string): TenantBot | undefined {
    return this.bots.get(tenantId);
  }

  /**
   * Status agregado de todos os bots
   */
  getAllStatus(): TenantBotStatus[] {
    return Array.from(this.bots.values()).map(bot => bot.getStatus());
  }

  /**
   * Status de um tenant
   */
  getTenantStatus(tenantId: string): TenantBotStatus | null {
    const bot = this.bots.get(tenantId);
    return bot ? bot.getStatus() : null;
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Inicia health check periódico (padrão: 5 min)
   */
  startHealthCheck(intervalMs: number = 300_000): void {
    if (this.healthCheckInterval) {
      log.warn("Health check já está rodando");
      return;
    }

    log.info("Iniciando health check", { intervalMs });

    this.healthCheckInterval = setInterval(async () => {
      if (this.isShuttingDown) return;
      await this.runHealthChecks();
    }, intervalMs);

    // Executa uma vez imediatamente
    this.runHealthChecks().catch(log.error);
  }

  /**
   * Para health check
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      log.info("Health check parado");
    }
  }

  /**
   * Executa health checks em todos os bots
   */
  private async runHealthChecks(): Promise<void> {
    const tenantIds = Array.from(this.bots.keys());

    for (const tenantId of tenantIds) {
      try {
        await this.checkAndHeal(tenantId);
      } catch (error) {
        log.error("Erro no health check", { tenantId, error: (error as Error).message });
      }
    }
  }

  /**
   * Verifica saúde de um bot e reinicia se necessário
   */
  private async checkAndHeal(tenantId: string): Promise<void> {
    const bot = this.bots.get(tenantId);
    if (!bot) return;

    const status = bot.getStatus();
    const now = Date.now();

    // 1. WhatsApp desconectado há > 5 min → reconectar
    if (status.whatsapp.ready && status.whatsapp.lastConnected) {
      const disconnectedMs = now - status.whatsapp.lastConnected.getTime();
      if (disconnectedMs > 5 * 60 * 1000) {
        log.warn("WhatsApp desconectado há >5min, reconectando...", { tenantId });
        try {
          await bot.reconnectWhatsApp();
          log.info("WhatsApp reconectado via health check", { tenantId });
        } catch (error) {
          log.error("Falha ao reconectar WhatsApp", { tenantId, error: (error as Error).message });
        }
      }
    }

    // 2. Memória > 800MB → restart
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    if (memUsage > 800) {
      log.warn("Memória alta, reiniciando bot", { tenantId, memUsageMB: Math.round(memUsage) });
      await this.restartTenant(tenantId);
      return;
    }

    // 3. Inatividade > 24h com fontes ativas → alertar admin
    if (status.fontes.active > 0 && status.stats.offersProcessed24h === 0) {
      log.warn("Bot inativo há 24h com fontes ativas", { tenantId });
      await this.notifyAdminInactivity(tenantId);
    }
  }

  /**
   * Notifica admin sobre inatividade (log por enquanto, webhook no futuro)
   */
  private async notifyAdminInactivity(tenantId: string): Promise<void> {
    log.warn("ALERTA ADMIN: Bot inativo 24h", { tenantId });
    // TODO: integrar com webhook/email/Telegram admin
  }

  // ==================== HELPERS ====================

  /**
   * Busca tenants ativos com plano pago (cached)
   */
  private async getActiveTenants(): Promise<TenantWithRelations[]> {
    const now = Date.now();

    if (this.tenantCache.length > 0 && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.tenantCache;
    }

    this.tenantCache = await prisma.tenant.findMany({
      where: {
        status: "active",
        plan: { not: "free" },
      },
      include: {
        channels: {
          where: { isActive: true },
          select: {
            id: true,
            platform: true,
            channelId: true,
            label: true,
            isActive: true,
          },
        },
        affiliateConfig: true,
        fontes: {
          select: {
            id: true,
            name: true,
            url: true,
            isActive: true,
            lastChecked: true,
            totalOffersFound: true,
            totalOffersPublished: true,
          },
        },
      },
    });

    this.cacheTimestamp = now;
    return this.tenantCache;
  }

  /**
   * Busca tenant completo por ID
   */
  private async getTenantWithRelations(tenantId: string): Promise<TenantWithRelations | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        channels: {
          where: { isActive: true },
          select: {
            id: true,
            platform: true,
            channelId: true,
            label: true,
            isActive: true,
          },
        },
        affiliateConfig: true,
        fontes: {
          select: {
            id: true,
            name: true,
            url: true,
            isActive: true,
            lastChecked: true,
            totalOffersFound: true,
            totalOffersPublished: true,
          },
        },
      },
    });

    return tenant;
  }

  /**
   * Invalida cache de tenants
   */
  invalidateTenantCache(): void {
    this.tenantCache = [];
    this.cacheTimestamp = 0;
  }
}