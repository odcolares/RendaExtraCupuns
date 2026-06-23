import { extractProductId } from "../../../src/affiliates/aliexpress";

describe("AliExpress Affiliate", () => {
  describe("extractProductId", () => {
    it("extrai ID de URL /item/{id}.html", () => {
      expect(
        extractProductId("https://www.aliexpress.com/item/100500384912345.html")
      ).toBe("100500384912345");
    });

    it("extrai ID de URL /product/{id}", () => {
      expect(
        extractProductId("https://www.aliexpress.com/product/123456")
      ).toBe("123456");
    });

    it("extrai ID de parâmetro productId=", () => {
      expect(
        extractProductId(
          "https://s.click.aliexpress.com/e/_ABC?productId=99999"
        )
      ).toBe("99999");
    });

    it("retorna null para URL sem produto", () => {
      expect(extractProductId("https://www.google.com")).toBeNull();
    });
  });
});
