import { extractProductData } from "../../../src/affiliates/shopee";

describe("Shopee Affiliate", () => {
  describe("extractProductData", () => {
    it("extrai shopId e itemId de URL /product/{shopId}/{itemId}", () => {
      const result = extractProductData(
        "https://shopee.com.br/product/123456/789"
      );
      expect(result).toEqual({ shopId: "123456", itemId: "789" });
    });

    it("extrai de URL com final {shopId}/{itemId}", () => {
      const result = extractProductData("https://shopee.com.br/123456/789");
      expect(result).toEqual({ shopId: "123456", itemId: "789" });
    });

    it("retorna null para URL sem dados de produto", () => {
      expect(extractProductData("https://www.google.com")).toBeNull();
    });
  });
});
