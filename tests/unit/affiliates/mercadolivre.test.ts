import { extractProductId } from "../../../src/affiliates/mercadolivre";

describe("Mercado Livre Affiliate", () => {
  describe("extractProductId", () => {
    it("extrai ID de URL /produto/{id}", () => {
      expect(
        extractProductId("https://www.mercadolivre.com.br/produto/123456")
      ).toBe("123456");
    });

    it("extrai ID de URL MLB-{id}", () => {
      expect(
        extractProductId("https://www.mercadolivre.com.br/MLB-123456")
      ).toBe("123456");
    });

    it("extrai ID de URL MLB{id}", () => {
      expect(
        extractProductId("https://www.mercadolivre.com.br/MLB123456")
      ).toBe("123456");
    });

    it("retorna null para URL sem produto", () => {
      expect(extractProductId("https://www.google.com")).toBeNull();
    });
  });
});
