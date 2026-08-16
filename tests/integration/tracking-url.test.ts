/**
 * Teste de integração — link de rastreio /r/<id> nas publicações.
 *
 * Prova que processOffer insere a oferta no banco ANTES de publicar e
 * passa buildTrackingUrl(dbId) (→ <web>/r/<id>) como link para
 * publishOffer/publishCoupon — o link publicado aponta para o tracker.
 *
 * O Telegram é mockado (jest.mock de src/telegram/publisher) — nenhuma
 * chamada real de rede. O banco é o SQLite LOCAL de teste (tests/setup.ts).
 */

import { processOffer } from "../../src/processor";
import { buildTrackingUrl } from "../../src/telegram/tracking";
import { publishOffer, publishCoupon } from "../../src/telegram/publisher";
import { waitForTestDb } from "../helpers/local-db";

jest.mock("../../src/telegram/publisher", () => ({
  publishOffer: jest.fn(),
  publishFlashSale: jest.fn(),
  publishCoupon: jest.fn(),
}));

const mockPublishOffer = jest.mocked(publishOffer);
const mockPublishCoupon = jest.mocked(publishCoupon);

const TEST_RUN_ID = Date.now().toString(36);

beforeAll(async () => {
  await waitForTestDb();
});

describe("Link de rastreio /r/<id> nas publicações", () => {
  it("publica oferta de produto com link de rastreio /r/<id>", async () => {
    mockPublishOffer.mockResolvedValue(true);

    const url = `https://shopee.com.br/product/111/222?t=${TEST_RUN_ID}`;
    const msg = `Fone Track ${TEST_RUN_ID}
De R$ 199 por R$ 89
${url}`;

    const result = await processOffer(msg, url);

    expect(result.success).toBe(true);
    expect(result.dbId).toBeDefined();
    expect(mockPublishOffer).toHaveBeenCalledTimes(1);

    const [, link] = mockPublishOffer.mock.calls[0];
    expect(link).toMatch(/\/r\/.+/);
    expect(link).toBe(buildTrackingUrl(result.dbId!));
    expect(link).not.toBe(url);
  }, 15000);

  it("publica cupom com link de rastreio /r/<id>", async () => {
    mockPublishCoupon.mockResolvedValue(true);

    const url = `https://shopee.com.br/m/cupom-de-desconto/999_${TEST_RUN_ID}`;
    const msg = `🎟️ CUPOM 10% OFF, Limite R$ 40: TRACK10
${url}`;

    const result = await processOffer(msg, url);

    expect(result.success).toBe(true);
    expect(result.dbId).toBeDefined();
    expect(mockPublishCoupon).toHaveBeenCalledTimes(1);

    const [, , trackingUrl] = mockPublishCoupon.mock.calls[0];
    expect(trackingUrl).toMatch(/\/r\/.+/);
    expect(trackingUrl).toBe(buildTrackingUrl(result.dbId!));
  }, 15000);
});