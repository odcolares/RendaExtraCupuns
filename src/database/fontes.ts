/**
 * Sincronização das fontes monitoradas (grupos/broadcast/newsletter do
 * WhatsApp) com a tabela Fonte do Prisma.
 *
 * - syncFontesFromConfig(): cria/atualiza as fontes do env e desativa as
 *   fontes WhatsApp que saíram do env (sem tocar em fontes manuais).
 * - touchFonte()/incrementFonteFound()/incrementFontePublished(): atualizações
 *   atômicas via updateMany, usando o tenant do bot em cache (nunca resolvem
 *   o tenant por incremento).
 */

import { prisma } from "../lib/prisma";
import { getTestTenantId } from "./offers";
import { getSourcesFromConfig } from "../whatsapp/sources";
import { loadConfig } from "../config";
import { createModuleLogger } from "../utils";

const log = createModuleLogger("FonteSync");

// Cache do tenant do bot, resolvido no sync, usado pelos incrementos.
let botTenantId: string | null = null;

/**
 * Sincroniza as fontes do config com a tabela Fonte do tenant do bot.
 * Idempotente: re-executar não cria duplicatas (findFirst + create/update,
 * pois não há @@unique em (tenantId, url)).
 */
export async function syncFontesFromConfig(
  whatsappConfig?: { groupIds: string[]; newsletterId: string | null }
): Promise<void> {
  const tenantId = await getTestTenantId(); // pode throw se seed faltar (caller trata)
  botTenantId = tenantId;
  const cfg = whatsappConfig ?? loadConfig().whatsapp;
  const sources = getSourcesFromConfig(cfg);

  for (const s of sources) {
    const existing = await prisma.fonte.findFirst({ where: { tenantId, url: s.id } });
    if (existing) {
      await prisma.fonte.update({ where: { id: existing.id }, data: { name: s.name, isActive: true } });
    } else {
      await prisma.fonte.create({ data: { name: s.name, url: s.id, isActive: true, tenantId } });
    }
  }

  // Desativa fontes do padrão WhatsApp que saíram do env (não mexe em fontes criadas manualmente)
  const currentUrls = sources.map((s) => s.id);
  await prisma.fonte.updateMany({
    where: {
      tenantId,
      AND: [
        { url: { notIn: currentUrls } },
        { OR: [
          { url: { endsWith: "@g.us" } },
          { url: { endsWith: "@broadcast" } },
          { url: { endsWith: "@newsletter" } },
        ] },
      ],
    },
    data: { isActive: false },
  });

  log.info("Fontes sincronizadas", { tenantId, total: sources.length });
}

/**
 * Marca a fonte como verificada agora (lastChecked = now).
 * No-op se o sync ainda não resolveu o tenant do bot.
 */
export async function touchFonte(sourceId: string): Promise<void> {
  if (!botTenantId) return;
  await prisma.fonte.updateMany({
    where: { tenantId: botTenantId, url: sourceId },
    data: { lastChecked: new Date() },
  });
}

/**
 * Incrementa atomicamente o contador de ofertas encontradas da fonte.
 * No-op se o sync ainda não resolveu o tenant do bot.
 */
export async function incrementFonteFound(sourceId: string): Promise<void> {
  if (!botTenantId) return;
  await prisma.fonte.updateMany({
    where: { tenantId: botTenantId, url: sourceId },
    data: { totalOffersFound: { increment: 1 } },
  });
}

/**
 * Incrementa atomicamente o contador de ofertas publicadas da fonte.
 * No-op se o sync ainda não resolveu o tenant do bot.
 */
export async function incrementFontePublished(sourceId: string): Promise<void> {
  if (!botTenantId) return;
  await prisma.fonte.updateMany({
    where: { tenantId: botTenantId, url: sourceId },
    data: { totalOffersPublished: { increment: 1 } },
  });
}