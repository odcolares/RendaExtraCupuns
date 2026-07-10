import {
  insertOffer,
  getOfferById,
  getRecentOffers,
  getOffersByPlatform,
  markAsPublished,
  isDuplicate,
  getStats,
} from "../../../src/database/offers";
import type { OfferData } from "../../../src/types";

// Unique suffix for each test run to avoid duplicates in shared Turso DB
const TEST_RUN_ID = Date.now().toString(36);
let testCounter = 0;

function uniqueUrl(base: string): string {
  testCounter++;
  return `${base}_${TEST_RUN_ID}_${testCounter}`;
}

const mockOffer: OfferData = {
  name: "iPhone 14 Pro",
  originalPrice: 7499,
  currentPrice: 3749,
  discount: 50,
  platform: "Amazon",
  originalUrl: uniqueUrl("https://amazon.com.br/dp/B0TESTE_UNIT_1"),
};

const mockOffer2: OfferData = {
  name: "Samsung S23",
  originalPrice: 5999,
  currentPrice: 2999,
  discount: 50,
  platform: "Shopee",
  originalUrl: uniqueUrl("https://shopee.com.br/product/123/456_UNIT_2"),
};

describe("Database Offers (Prisma/Turso)", () => {
  it("insertOffer insere e retorna ID", async () => {
    const id = await insertOffer(mockOffer, "https://amz.com/?tag=teste");
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });

  it("insertOffer insere segunda oferta", async () => {
    const id = await insertOffer(mockOffer2, "https://shopee.com/?af_id=teste");
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });

  it("isDuplicate detecta URL duplicada", async () => {
    expect(await isDuplicate(mockOffer.originalUrl!)).toBe(true);
  });

  it("isDuplicate retorna false para URL nova", async () => {
    expect(await isDuplicate("https://amazon.com.br/dp/B0NOVO")).toBe(false);
  });

  it("getOfferById retorna oferta correta", async () => {
    const id = await insertOffer(
      { ...mockOffer, originalUrl: uniqueUrl("https://amazon.com.br/dp/B0TESTE_UNIT_GET") },
      "https://amz.com/?tag=teste2"
    );
    expect(id).not.toBeNull();
    if (!id) return;
    const offer = await getOfferById(id);
    expect(offer).not.toBeNull();
    expect(offer!.title).toBe("iPhone 14 Pro");
    expect(offer!.originalPrice).toBe(7499);
    expect(offer!.price).toBe(3749);
    expect(offer!.platform).toBe("amazon");
  });

  it("getOfferById retorna null para ID inexistente", async () => {
    expect(await getOfferById("999")).toBeNull();
  });

  it("getRecentOffers retorna ofertas ordenadas", async () => {
    const offers = await getRecentOffers(5);
    expect(offers.length).toBeGreaterThanOrEqual(2);
  });

  it("getOffersByPlatform filtra por plataforma", async () => {
    const amazon = await getOffersByPlatform("Amazon");
    expect(amazon.length).toBeGreaterThanOrEqual(1);
    expect(amazon[0].platform).toBe("amazon");

    const shopee = await getOffersByPlatform("Shopee");
    expect(shopee.length).toBeGreaterThanOrEqual(1);
    expect(shopee[0].platform).toBe("shopee");
  });

  it("markAsPublished atualiza flags", async () => {
    const id = await insertOffer(
      { ...mockOffer, originalUrl: uniqueUrl("https://amazon.com.br/dp/B0TESTE_UNIT_MARK") },
      "https://amz.com/?tag=teste3"
    );
    expect(id).not.toBeNull();
    if (!id) return;
    await markAsPublished(id);
    const offer = await getOfferById(id);
    expect(offer!.status).toBe("published");
    expect(offer!.publishedAt).not.toBeNull();
  });

  it("getStats retorna estatísticas corretas", async () => {
    const stats = await getStats();
    expect(stats.total).toBeGreaterThanOrEqual(2);
    expect(stats.published).toBeGreaterThanOrEqual(0);
    expect(stats.pending).toBeGreaterThanOrEqual(0);
    expect(stats.byPlatform["amazon"]).toBeGreaterThanOrEqual(1);
    expect(stats.byPlatform["shopee"]).toBeGreaterThanOrEqual(1);
  });
});