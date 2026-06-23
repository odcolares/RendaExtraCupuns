import fs from "fs";
import { initDatabase, closeDatabase } from "../../../src/database/index";
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

const TEST_DB = "./data/test-offers.db";

const mockOffer: OfferData = {
  name: "iPhone 14 Pro",
  originalPrice: 7499,
  currentPrice: 3749,
  discount: 50,
  platform: "Amazon",
  originalUrl: "https://amazon.com.br/dp/B0TESTE",
};

const mockOffer2: OfferData = {
  name: "Samsung S23",
  originalPrice: 5999,
  currentPrice: 2999,
  discount: 50,
  platform: "Shopee",
  originalUrl: "https://shopee.com.br/product/123/456",
};

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

describe("Database Offers", () => {
  it("insertOffer insere e retorna ID", () => {
    const id = insertOffer(mockOffer, "https://amz.com/?tag=teste");
    expect(id).toBeGreaterThan(0);
  });

  it("insertOffer insere segunda oferta", () => {
    const id = insertOffer(mockOffer2, "https://shopee.com/?af_id=teste");
    expect(id).toBeGreaterThan(1);
  });

  it("isDuplicate detecta URL duplicada", () => {
    expect(isDuplicate("https://amazon.com.br/dp/B0TESTE")).toBe(true);
  });

  it("isDuplicate retorna false para URL nova", () => {
    expect(isDuplicate("https://amazon.com.br/dp/B0NOVO")).toBe(false);
  });

  it("getOfferById retorna oferta correta", () => {
    const offer = getOfferById(1);
    expect(offer).not.toBeNull();
    expect(offer!.name).toBe("iPhone 14 Pro");
    expect(offer!.original_price).toBe(7499);
    expect(offer!.current_price).toBe(3749);
    expect(offer!.platform).toBe("Amazon");
  });

  it("getOfferById retorna null para ID inexistente", () => {
    expect(getOfferById(999)).toBeNull();
  });

  it("getRecentOffers retorna ofertas ordenadas", () => {
    const offers = getRecentOffers(5);
    expect(offers.length).toBe(2);
  });

  it("getOffersByPlatform filtra por plataforma", () => {
    const amazon = getOffersByPlatform("Amazon");
    expect(amazon.length).toBe(1);
    expect(amazon[0].platform).toBe("Amazon");

    const shopee = getOffersByPlatform("Shopee");
    expect(shopee.length).toBe(1);
    expect(shopee[0].platform).toBe("Shopee");
  });

  it("markAsPublished atualiza flags", () => {
    markAsPublished(1);
    const offer = getOfferById(1);
    expect(offer!.published).toBeTruthy();
    expect(offer!.published_at).not.toBeNull();
  });

  it("getStats retorna estatísticas corretas", () => {
    const stats = getStats();
    expect(stats.total).toBe(2);
    expect(stats.published).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.byPlatform["Amazon"]).toBe(1);
    expect(stats.byPlatform["Shopee"]).toBe(1);
  });
});
