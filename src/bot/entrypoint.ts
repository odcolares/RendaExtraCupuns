#!/usr/bin/env node
/**
 * Bot Entrypoint - Inicializa TenantBot para um tenant específico
 * 
 * Uso: node dist/bot/entrypoint.js --tenant-id=xxx
 * 
 * Este arquivo é compilado de src/bot/entrypoint.ts
 */

import { prisma } from "../lib/prisma";
import { getBotManager, BotManager } from "./bot-manager";
import { createModuleLogger } from "../utils";

const log = createModuleLogger("BotEntrypoint");

interface TenantWithRelations {
  id: string;
  name: string;
  plan: string;
  status: string;
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

async function main() {
  const args = process.argv.slice(2);
  const tenantIdArg = args.find(a => a.startsWith("--tenant-id="));
  const TENANT_ID = tenantIdArg?.split("=")[1];

  if (!TENANT_ID) {
    console.error("ERRO: --tenant-id é obrigatório");
    console.error("Uso: node dist/bot/entrypoint.js --tenant-id=<tenant-id>");
    process.exit(1);
  }

  log.info("Iniciando bot entrypoint", { tenantId: TENANT_ID });

  try {
    // Busca tenant com relações
    const tenant = await prisma.tenant.findUnique({
      where: { id: TENANT_ID },
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
    }) as TenantWithRelations | null;

    if (!tenant) {
      log.error("Tenant não encontrado", { tenantId: TENANT_ID });
      process.exit(0); // Exit 0 para não reiniciar container infinitamente
    }

    if (tenant.status !== "active") {
      log.info("Tenant não está ativo, encerrando", { 
        tenantId: TENANT_ID, 
        status: tenant.status 
      });
      process.exit(0);
    }

    if (tenant.plan === "free") {
      log.info("Tenant é plano free, bot não necessário", { tenantId: TENANT_ID });
      process.exit(0);
    }

    log.info("Tenant validado, iniciando BotManager", { 
      tenantId: TENANT_ID,
      plan: tenant.plan,
      channels: tenant.channels.length,
      fontes: tenant.fontes.length,
    });

    // Inicializa BotManager e inicia o tenant
    const botManager = getBotManager();
    await botManager.startTenant(TENANT_ID);

    log.info("Bot iniciado com sucesso, aguardando sinais", { tenantId: TENANT_ID });

    // Mantém processo vivo e trata sinais
    const shutdown = async (signal: string) => {
      log.info(`${signal} recebido, encerrando graciosamente`, { tenantId: TENANT_ID });
      try {
        await botManager.stopTenant(TENANT_ID);
        log.info("Bot parado com sucesso", { tenantId: TENANT_ID });
      } catch (error) {
        log.error("Erro ao parar bot", { tenantId: TENANT_ID, error: (error as Error).message });
      }
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    // Heartbeat para não deixar processo morrer
    setInterval(() => {
      log.debug("Heartbeat", { tenantId: TENANT_ID });
    }, 60000);

  } catch (error) {
    log.error("Erro fatal no entrypoint", { 
      tenantId: TENANT_ID, 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });
    process.exit(1);
  }
}

main();