/**
 * Teste de integração — wiring processOffer → Fonte.totalOffersPublished.
 *
 * Prova que, quando um cupom é efetivamente publicado no Telegram
 * (publishCoupon retorna true), o contador totalOffersPublished da Fonte
 * correspondente (sourceId) é incrementado atomicamente — e que NÃO é
 * incrementado quando a publicação falha (publishCoupon retorna false).
 *
 * O Telegram é mockado (jest.mock de src/telegram/publisher) — nenhuma
 * chamada real de rede. O banco é o SQLite LOCAL de teste (tests/setup.ts),
 * não o Turso remoto.
 */

import { processOffer } from "../../src/processor";
import { syncFontesFromConfig } from "../../src/database/fontes";
import { prisma } from "../../src/lib/prisma";
import { waitForTestDb } from "../helpers/local-db";
import { publishCoupon } from "../../src/telegram/publisher";

// Mock do módulo de publicação do Telegram: nenhuma chamada real de rede.
// processOffer importa publishOffer/publishFlashSale/publishCoupon de
// "./telegram/publisher" — o mock precisa expor os três.
jest.mock("../../src/telegram/publisher", () => ({
  publishOffer: jest.fn(),
  publishFlashSale: jest.fn(),
  publishCoupon: jest.fn(),
}));

const mockPublishCoupon = jest.mocked(publishCoupon);

const TEST_TENANT_ID = "test-tenant-ci";
const SOURCE_ID = "120363407937604970@g.us";

// Sufixo único por execução para evitar duplicatas (isDuplicate/isDuplicateByName)
const TEST_RUN_ID = Date.now().toString(36);

// Mensagens de cupom que satisfazem extractCouponData:
//  - palavra "cupom" (singular, regex /\bcupom\b|\bcupons?\b/i — casa
//    "cupom", "cupon" e "cupons")
//  - desconto percentual "X% OFF"
//  - código após dois-pontos (ex: "R$ 40: FUTNAVEIA")
//  - plataforma detectada pela URL (shopee)
// URL de cupom Shopee (/m/cupom-de-desconto/) → isShopeeCouponUrl = true
// → pula geração de link de afiliado → affiliateLink = null → caminho de cupom.
const COUPON_MESSAGE = `🎟️ CUPOM 10% OFF, Limite R$ 40: FUTNAVEIA
https://shopee.com.br/m/cupom-de-desconto/12345_${TEST_RUN_ID}`;

const COUPON_URL = `https://shopee.com.br/m/cupom-de-desconto/12345_${TEST_RUN_ID}`;

const COUPON_MESSAGE_FAIL = `🎟️ CUPOM 20% OFF, Limite R$ 50: PROMO20
https://shopee.com.br/m/cupom-de-desconto/67890_${TEST_RUN_ID}`;

const COUPON_URL_FAIL = `https://shopee.com.br/m/cupom-de-desconto/67890_${TEST_RUN_ID}`;

beforeAll(async () => {
  await waitForTestDb();
  // Cria a Fonte (url = SOURCE_ID) e resolve o cache botTenantId interno,
  // necessário para incrementFontePublished casar a linha.
  await syncFontesFromConfig({ groupIds: [SOURCE_ID], newsletterId: null });
});

describe("processOffer → Fonte.totalOffersPublished", () => {
  it("incrementa totalOffersPublished da fonte quando o cupom é publicado", async () => {
    mockPublishCoupon.mockResolvedValue(true);

    // Pré-condição: fonte existe com contador zerado
    const before = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: SOURCE_ID },
    });
    expect(before).not.toBeNull();
    expect(before!.totalOffersPublished).toBe(0);

    const result = await processOffer(
      COUPON_MESSAGE,
      COUPON_URL,
      undefined,
      SOURCE_ID
    );

    // Shape do resultado é são
    expect(result.success).toBe(true);
    expect(result.offer).toBeDefined();

    // O incremento aconteceu para a fonte certa
    const fonte = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: SOURCE_ID },
    });
    expect(fonte!.totalOffersPublished).toBe(1);
  }, 15000);

  it("NÃO incrementa totalOffersPublished quando a publicação falha", async () => {
    mockPublishCoupon.mockResolvedValue(false);

    const result = await processOffer(
      COUPON_MESSAGE_FAIL,
      COUPON_URL_FAIL,
      undefined,
      SOURCE_ID
    );

    // O pipeline ainda conclui com sucesso (salva a oferta), mas sem publicar
    expect(result.success).toBe(true);

    const fonte = await prisma.fonte.findFirst({
      where: { tenantId: TEST_TENANT_ID, url: SOURCE_ID },
    });
    // Mantém o valor anterior (1 do teste anterior) — não incrementou
    expect(fonte!.totalOffersPublished).toBe(1);
  }, 15000);
});