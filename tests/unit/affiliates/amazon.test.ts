import { extractASIN } from "../../../src/affiliates/amazon";

describe("Amazon Affiliate", () => {
  describe("extractASIN", () => {
    it("extrai ASIN de URL /dp/{ASIN}", () => {
      expect(extractASIN("https://www.amazon.com.br/dp/B0BJLXMVMV")).toBe(
        "B0BJLXMVMV"
      );
    });

    it("extrai ASIN de URL /product/{ASIN}", () => {
      expect(
        extractASIN("https://www.amazon.com.br/product/B0BJLXMVMV")
      ).toBe("B0BJLXMVMV");
    });

    it("extrai ASIN de URL /gp/product/{ASIN}", () => {
      expect(
        extractASIN("https://www.amazon.com/gp/product/B0BJLXMVMV")
      ).toBe("B0BJLXMVMV");
    });

    it("extrai ASIN com lowercase e retorna uppercase", () => {
      expect(
        extractASIN("https://www.amazon.com.br/dp/b0bjlxmvmv")
      ).toBe("B0BJLXMVMV");
    });

    it("retorna null para URL sem ASIN", () => {
      expect(extractASIN("https://www.google.com")).toBeNull();
    });

    it("retorna null para URL Amazon sem produto", () => {
      expect(extractASIN("https://www.amazon.com.br")).toBeNull();
    });
  });
});
