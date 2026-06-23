import { detectPlatform } from "../../../src/affiliates";

describe("Affiliates detectPlatform", () => {
  it("detecta Amazon", () => {
    expect(
      detectPlatform("https://www.amazon.com.br/dp/B0BJLXMVMV")
    ).toBe("amazon");
  });

  it("detecta AliExpress", () => {
    expect(
      detectPlatform("https://www.aliexpress.com/item/100500.html")
    ).toBe("aliexpress");
  });

  it("detecta Shopee", () => {
    expect(
      detectPlatform("https://shopee.com.br/product/123/456")
    ).toBe("shopee");
  });

  it("detecta Mercado Livre", () => {
    expect(
      detectPlatform("https://www.mercadolivre.com.br/produto/123")
    ).toBe("mercadolivre");
  });

  it("detecta Mercado Livre via ml.uv", () => {
    expect(detectPlatform("https://meu.ml.uv/produto/123")).toBe(
      "mercadolivre"
    );
  });

  it("detecta Mercado Livre via meli.la", () => {
    expect(detectPlatform("https://meli.la/2bbrBW1")).toBe("mercadolivre");
  });

  it("detecta Magazine Luiza", () => {
    expect(detectPlatform("https://www.magalu.com.br/produto/123")).toBe(
      "magalu"
    );
  });

  it("retorna null para URL não reconhecida", () => {
    expect(detectPlatform("https://www.google.com")).toBeNull();
  });
});
