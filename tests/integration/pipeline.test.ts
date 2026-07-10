/**
 * Teste de integração E2E — pipeline completo.
 *
 * Simula o fluxo: mensagem WhatsApp mock → processOffer → database
 *
 * NOTA: Depende de tokens para testar afiliados (AMAZON_AFFILIATE_TAG)
 * e Telegram (TELEGRAM_BOT_TOKEN). Sem tokens, testa até onde possível.
 */

import fs from "fs";
import { initDatabase, closeDatabase } from "../../src/database/index";
import { getRecentOffers, getStats } from "../../src/database/offers";
import { processOffer } from "../../src/processor";

const TEST_DB = "./data/test-integration.db";

// Unique suffix for each test run to avoid duplicates
const TEST_RUN_ID = Date.now().toString(36);

beforeAll(async () => {
  // Remove database anterior se existir (garante estado limpo)
  if (fs.existsSync(TEST_DB)) {
    fs.unlinkSync(TEST_DB);
  }
  await initDatabase(TEST_DB);
});

afterAll(async () => {
  await closeDatabase();
});

describe("Pipeline de Integração", () => {
  it("processa oferta Amazon do início ao DB", async () => {
    const msg = `🔥 OFERTA EXCLUSIVA
iPhone 14 Pro Max 256GB
De R$ 7.499 por R$ 3.749
50% OFF
https://www.amazon.com.br/dp/B0BJLXMVMV_${TEST_RUN_ID}`;

    const result = await processOffer(
      msg,
      `https://www.amazon.com.br/dp/B0BJLXMVMV_${TEST_RUN_ID}`
    );

    expect(result.success).toBe(true);
    expect(result.offer).toBeDefined();
    expect(result.offer!.name).toBeDefined();
    expect(result.offer!.platform).toBe("amazon");
  });

  it("rejeita oferta duplicada", async () => {
    const msg = `Duplicata https://www.amazon.com.br/dp/B0BJLXMVMV_${TEST_RUN_ID}`;

    const result = await processOffer(
      msg,
      `https://www.amazon.com.br/dp/B0BJLXMVMV_${TEST_RUN_ID}`
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("duplicate");
  });

  it("processa oferta AliExpress", async () => {
    const msg = `⚡ OFERTA RELÂMPAGO
Smartwatch X100
De R$ 299 por R$ 149
https://www.aliexpress.com/item/100500384912345_${TEST_RUN_ID}.html`;

    const result = await processOffer(
      msg,
      `https://www.aliexpress.com/item/100500384912345_${TEST_RUN_ID}.html`
    );

    expect(result.success).toBe(true);
    expect(result.offer).toBeDefined();
  });

  it("processa oferta Shopee", async () => {
    const msg = `Fone Bluetooth
De R$ 199 por R$ 89
https://shopee.com.br/product/111/222_${TEST_RUN_ID}`;

    const result = await processOffer(
      msg,
      `https://shopee.com.br/product/111/222_${TEST_RUN_ID}`
    );

    expect(result.success).toBe(true);
    expect(result.offer!.platform).toBe("shopee");
  });

  it("processa oferta Mercado Livre", async () => {
    const msg = `Notebook Dell
De R$ 4.999 por R$ 3.499
https://www.mercadolivre.com.br/produto/98765_${TEST_RUN_ID}`;

    const result = await processOffer(
      msg,
      `https://www.mercadolivre.com.br/produto/98765_${TEST_RUN_ID}`
    );

    expect(result.success).toBe(true);
    expect(result.offer!.platform).toBe("mercadolivre");
  });

  it("registra todas as ofertas no banco", async () => {
    const offers = await getRecentOffers(10);
    // Amazon + AliExpress + Shopee + Mercado Livre = 4 (1 duplicata ignorada)
    expect(offers.length).toBeGreaterThanOrEqual(4);
  });

  it("estatísticas do banco estão coerentes", async () => {
    const stats = await getStats();
    expect(stats.total).toBeGreaterThanOrEqual(4);
    expect(stats.pending).toBeGreaterThanOrEqual(4); // sem token não publica
  });
});
