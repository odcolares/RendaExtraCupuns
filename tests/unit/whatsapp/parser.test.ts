import {
  extractLinksFromMessage,
  isValidOfferMessage,
  detectPlatform,
  isProductLink,
  cleanUrl,
} from "../../../src/whatsapp/parser";

describe("WhatsApp Parser", () => {
  describe("extractLinksFromMessage", () => {
    it("extrai links de produto de uma mensagem", () => {
      const msg = "Oferta! https://www.amazon.com.br/dp/B0BJLXMVMV";
      const links = extractLinksFromMessage(msg);
      expect(links).toHaveLength(1);
      expect(links[0]).toBe("https://www.amazon.com.br/dp/B0BJLXMVMV");
    });

    it("extrai link Amazon com slug de produto antes do /dp/", () => {
      const msg = "Mouse Gamer Logitech por R$199! https://www.amazon.com.br/Logitech-G403-Lightspeed-Sem-Fio/dp/B07YCZ72QJ";
      const links = extractLinksFromMessage(msg);
      expect(links).toHaveLength(1);
      expect(links[0]).toBe("https://www.amazon.com.br/Logitech-G403-Lightspeed-Sem-Fio/dp/B07YCZ72QJ");
    });

    it("retorna array vazio para mensagem sem links", () => {
      const links = extractLinksFromMessage("Apenas texto");
      expect(links).toHaveLength(0);
    });

    it("extrai múltiplos links", () => {
      const msg =
        "Link1: https://www.amazon.com.br/dp/B0TESTE1234 Link2: https://www.amazon.com.br/dp/B0TESTE5678";
      const links = extractLinksFromMessage(msg);
      expect(links).toHaveLength(2);
    });

    it("extrai link do AliExpress", () => {
      const msg = "https://www.aliexpress.com/item/100500384912345.html";
      const links = extractLinksFromMessage(msg);
      expect(links).toHaveLength(1);
    });

    it("extrai link da Shopee", () => {
      const msg = "https://shopee.com.br/product/123456/789";
      const links = extractLinksFromMessage(msg);
      expect(links).toHaveLength(1);
    });
  });

  describe("isValidOfferMessage", () => {
    it("detecta oferta por palavra-chave", () => {
      expect(isValidOfferMessage("Promoção de iPhone")).toBe(true);
      expect(isValidOfferMessage("Desconto imperdível")).toBe(true);
    });

    it("detecta oferta por link de produto", () => {
      expect(
        isValidOfferMessage("Veja: https://www.amazon.com.br/dp/B0BJLXMVMV")
      ).toBe(true);
    });

    it("detecta oferta por preço", () => {
      expect(isValidOfferMessage("R$ 1.299,99")).toBe(true);
    });

    it("rejeita mensagem sem indicação de oferta", () => {
      expect(isValidOfferMessage("Bom dia pessoal")).toBe(false);
    });
  });

  describe("detectPlatform", () => {
    it("detecta Amazon (URL curta)", () => {
      expect(
        detectPlatform("https://www.amazon.com.br/dp/B0BJLXMVMV")
      ).toBe("amazon");
    });

    it("detecta Amazon (URL com slug)", () => {
      expect(
        detectPlatform("https://www.amazon.com.br/Logitech-G403-Lightspeed-Sem-Fio/dp/B07YCZ72QJ")
      ).toBe("amazon");
    });

    it("detecta Amazon (.com com slug)", () => {
      expect(
        detectPlatform("https://www.amazon.com/Logitech-G403-Lightspeed/dp/B07YCZ72QJ")
      ).toBe("amazon");
    });

    it("detecta AliExpress", () => {
      expect(
        detectPlatform("https://www.aliexpress.com/item/123.html")
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

    it("retorna null para URL não reconhecida", () => {
      expect(detectPlatform("https://exemplo.com.br/produto")).toBeNull();
    });
  });

  describe("isProductLink", () => {
    it("reconhece link de produto Amazon", () => {
      expect(
        isProductLink("https://www.amazon.com.br/dp/B0BJLXMVMV")
      ).toBe(true);
    });

    it("rejeita link genérico", () => {
      expect(isProductLink("https://google.com")).toBe(false);
    });
  });

  describe("cleanUrl", () => {
    it("remove parâmetros de tracking", () => {
      expect(cleanUrl("https://amazon.com/dp/B0TESTE?tag=xyz&ref=abc")).toBe(
        "https://amazon.com/dp/B0TESTE"
      );
    });
  });
});
