/**
 * Testes do módulo de fontes (src/database/fontes.ts).
 *
 * Cobre, contra o banco SQLite LOCAL de teste:
 *  - Idempotência do sync (sem duplicatas ao re-executar)
 *  - Desativação de fontes WhatsApp removidas do env
 *  - Preservação de fontes criadas manualmente (URLs não-WhatsApp)
 *  - Incrementos atômicos (totalOffersFound/Published) e touch (lastChecked)
 *  - Entrada malformada (grupo vazio filtrado, nenhuma fonte criada)
 */

import {
  syncFontesFromConfig,
  touchFonte,
  incrementFonteFound,
  incrementFontePublished,
} from "../../src/database/fontes";
import { prisma } from "../../src/lib/prisma";
import { waitForTestDb } from "../helpers/local-db";

const TEST_TENANT_ID = "test-tenant-ci";

const GROUP_ID = "120363407937604970@g.us";
const BROADCAST_ID = "1734043269@broadcast";
const NEWSLETTER_ID = "120363421652731550@newsletter";

const FULL_CONFIG = {
  groupIds: [GROUP_ID, BROADCAST_ID],
  newsletterId: NEWSLETTER_ID,
};

beforeAll(async () => {
  await waitForTestDb();
  await syncFontesFromConfig(FULL_CONFIG);
});

describe("Fontes (Prisma/local SQLite)", () => {
  it("sync é idempotente: 3 fontes, todas ativas, sem duplicatas", async () => {
    const rows = await prisma.fonte.findMany({
      where: { tenantId: TEST_TENANT_ID },
    });

    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.isActive).toBe(true);
    }

    const urls = rows.map((r) => r.url).sort();
    expect(urls).toEqual([GROUP_ID, BROADCAST_ID, NEWSLETTER_ID].sort());

    // Re-executa o sync → continua 3 (sem duplicatas)
    await syncFontesFromConfig(FULL_CONFIG);
    const after = await prisma.fonte.findMany({
      where: { tenantId: TEST_TENANT_ID },
    });
    expect(after).toHaveLength(3);
  }, 15000);

  it("fonte removida do env é desativada; as demais permanecem ativas", async () => {
    await syncFontesFromConfig({
      groupIds: [GROUP_ID],
      newsletterId: NEWSLETTER_ID,
    });

    const broadcast = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: BROADCAST_ID },
    });
    expect(broadcast).not.toBeNull();
    expect(broadcast!.isActive).toBe(false);

    const group = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: GROUP_ID },
    });
    const newsletter = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: NEWSLETTER_ID },
    });
    expect(group!.isActive).toBe(true);
    expect(newsletter!.isActive).toBe(true);
  }, 15000);

  it("fonte criada manualmente (URL não-WhatsApp) nunca é desativada", async () => {
    const manualUrl = "https://exemplo.com/ofertas";
    await prisma.fonte.create({
      data: {
        name: "Fonte Manual",
        url: manualUrl,
        isActive: true,
        tenantId: TEST_TENANT_ID,
      },
    });

    // Sync com apenas o grupo + newsletter (broadcast fora do env)
    await syncFontesFromConfig({
      groupIds: [GROUP_ID],
      newsletterId: NEWSLETTER_ID,
    });

    const manual = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: manualUrl },
    });
    expect(manual).not.toBeNull();
    expect(manual!.isActive).toBe(true);
  }, 15000);

  it("incrementos atômicos e touch atualizam contadores/lastChecked", async () => {
    const row = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: GROUP_ID },
    });
    expect(row).not.toBeNull();
    if (!row) return;

    await incrementFonteFound(GROUP_ID);
    await incrementFonteFound(GROUP_ID);
    await incrementFontePublished(GROUP_ID);
    await touchFonte(GROUP_ID);

    const updated = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: GROUP_ID },
    });
    expect(updated!.totalOffersFound).toBe(2);
    expect(updated!.totalOffersPublished).toBe(1);

    const now = Date.now();
    expect(updated!.lastChecked.getTime()).toBeGreaterThan(now - 60_000);
    expect(updated!.lastChecked.getTime()).toBeLessThanOrEqual(now + 5_000);
  }, 15000);

  it("entrada malformada: grupo vazio é filtrado e nenhuma fonte é criada", async () => {
    const before = await prisma.fonte.count({
      where: { tenantId: TEST_TENANT_ID },
    });

    await syncFontesFromConfig({ groupIds: [""], newsletterId: null });

    const after = await prisma.fonte.count({
      where: { tenantId: TEST_TENANT_ID },
    });
    expect(after).toBe(before);
  }, 15000);
});