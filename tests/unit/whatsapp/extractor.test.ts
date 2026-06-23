import {
  extractOfferData,
  extractProductName,
  extractOriginalPrice,
  extractCurrentPrice,
  extractDiscount,
  parsePrice,
} from "../../../src/whatsapp/extractor";

describe("WhatsApp Extractor", () => {
  describe("extractOfferData", () => {
    it("extrai dados completos de uma oferta", () => {
      const msg = `🔥 OFERTA EXCLUSIVA
iPhone 14 Pro Max 256GB
De R$ 7.499 por R$ 3.749
50% OFF
https://www.amazon.com.br/dp/B0BJLXMVMV`;

      const result = extractOfferData(
        msg,
        "https://www.amazon.com.br/dp/B0BJLXMVMV"
      );

      // "🔥 OFERTA EXCLUSIVA" é all-caps (promocional) → pula, pega "iPhone 14 Pro Max 256GB"
      expect(result.name).toBe("iPhone 14 Pro Max 256GB");
      expect(result.originalPrice).toBe(7499);
      expect(result.currentPrice).toBe(3749);
      expect(result.discount).toBe(50);
      expect(result.platform).toBe("amazon");
    });
  });

  describe("extractProductName", () => {
    it("extrai a primeira linha significativa", () => {
      const msg = `Smart TV 50 Polegadas
De R$ 3.999 por R$ 2.499
https://www.amazon.com.br/dp/B0TESTE`;

      expect(extractProductName(msg)).toBe("Smart TV 50 Polegadas");
    });

    it("ignora linhas de preço", () => {
      const msg = `R$ 2.499
Produto legal`;

      expect(extractProductName(msg)).toBe("Produto legal");
    });

    it("ignora URLs", () => {
      const msg = `https://amazon.com
Produto`;

      expect(extractProductName(msg)).toBe("Produto");
    });

    it("retorna fallback quando não encontra nome", () => {
      expect(extractProductName("R$ 100\nhttp://url.com")).toBe(
        "Produto sem nome"
      );
    });

    it("pula chamada promocional ALL CAPS (Kotas style)", () => {
      const msg = `A BRABA DOS SANDUÍCHES
🔥Sanduicheira Elétrica Cadence Click 750W 127V
por R$65,91`;

      expect(extractProductName(msg)).toBe(
        "🔥Sanduicheira Elétrica Cadence Click 750W 127V"
      );
    });

    it("pula linha com CxB (Custo x Benefício) — quase all-caps", () => {
      const msg = `HEADSET COM ÓTIMO CxB
🔥Fone de Ouvido Gamer Headset Havit H2015d
por R$97,04`;

      expect(extractProductName(msg)).toBe(
        "🔥Fone de Ouvido Gamer Headset Havit H2015d"
      );
    });

    it("pula aviso de cupom esgotado", () => {
      expect(
        extractProductName("CUPOM VIPANITTA ESGOTADO\nOutra mensagem")
      ).toBe("Outra mensagem");
    });

    it("mantém linha mista (maiúsculas + minúsculas) normal", () => {
      const msg = `Smart TV 50 Polegadas
De R$ 3.999 por R$ 2.499
https://www.amazon.com.br/dp/B0TESTE`;

      expect(extractProductName(msg)).toBe("Smart TV 50 Polegadas");
    });

    it("mantém linha única normal", () => {
      expect(extractProductName("iPhone 14 Pro Max")).toBe(
        "iPhone 14 Pro Max"
      );
    });
  });

  describe("extractOriginalPrice", () => {
    it("extrai preço com 'De R$'", () => {
      expect(extractOriginalPrice("De R$ 7.499")).toBe(7499);
    });

    it("extrai preço com 'antes R$'", () => {
      expect(extractOriginalPrice("antes R$ 1.299,99")).toBe(1299.99);
    });

    it("retorna null quando não encontra", () => {
      expect(extractOriginalPrice("Apenas texto")).toBeNull();
    });
  });

  describe("extractCurrentPrice", () => {
    it("extrai preço com 'por R$'", () => {
      expect(extractCurrentPrice("por R$ 3.749")).toBe(3749);
    });

    it("retorna null quando não encontra", () => {
      expect(extractCurrentPrice("Apenas texto")).toBeNull();
    });
  });

  describe("extractDiscount", () => {
    it("extrai desconto com '% OFF'", () => {
      expect(extractDiscount("50% OFF")).toBe(50);
    });

    it("extrai desconto com '-X%'", () => {
      expect(extractDiscount("-30%")).toBe(30);
    });

    it("extrai desconto com '% de desconto'", () => {
      expect(extractDiscount("25% de desconto")).toBe(25);
    });

    it("retorna null quando não encontra", () => {
      expect(extractDiscount("Apenas texto")).toBeNull();
    });
  });

  describe("parsePrice", () => {
    it("converte formato brasileiro para número", () => {
      expect(parsePrice("1.299,99")).toBe(1299.99);
    });

    it("converte valor sem milhar", () => {
      expect(parsePrice("499,90")).toBe(499.9);
    });

    it("converte valor inteiro", () => {
      expect(parsePrice("1.000")).toBe(1000);
    });
  });
});
