import {
  formatBRL,
  formatDateBR,
  formatDateTimeBR,
  truncateText,
  sanitizeText,
  slugify,
  delay,
  deepMerge,
} from "../../../src/utils/helpers";

describe("Helpers", () => {
  describe("formatBRL", () => {
    it("formata número como moeda BRL", () => {
      expect(formatBRL(1234.56)).toBe("R$ 1.234,56");
    });

    it("formata zero", () => {
      expect(formatBRL(0)).toBe("R$ 0,00");
    });

    it("formata valor inteiro", () => {
      expect(formatBRL(1000)).toBe("R$ 1.000,00");
    });
  });

  describe("formatDateBR", () => {
    it("formata data no padrão brasileiro", () => {
      const date = new Date(2026, 5, 15); // 15/06/2026
      expect(formatDateBR(date)).toBe("15/06/2026");
    });
  });

  describe("formatDateTimeBR", () => {
    it("formata data e hora no padrão brasileiro", () => {
      const date = new Date(2026, 5, 15, 14, 30);
      const result = formatDateTimeBR(date);
      expect(result).toContain("15/06/2026");
      expect(result).toContain("14:30");
    });
  });

  describe("truncateText", () => {
    it("trunca texto longo com ...", () => {
      expect(truncateText("Texto muito longo aqui", 10)).toBe("Texto m...");
    });

    it("não trunca texto curto", () => {
      expect(truncateText("Curto", 10)).toBe("Curto");
    });
  });

  describe("sanitizeText", () => {
    it("remove caracteres especiais", () => {
      expect(sanitizeText('<b>Olá</b> & "Mundo"')).toBe("bOlá/b Mundo");
    });

    it("normaliza espaços em branco", () => {
      expect(sanitizeText("  Olá   Mundo  ")).toBe("Olá Mundo");
    });
  });

  describe("slugify", () => {
    it("converte texto para slug", () => {
      expect(slugify("iPhone 14 Pro Max")).toBe("iphone-14-pro-max");
    });

    it("remove acentos", () => {
      expect(slugify("João Souza à venda")).toBe("joao-souza-a-venda");
    });
  });

  describe("delay", () => {
    it("aguarda o tempo especificado", async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe("deepMerge", () => {
    it("faz merge profundo de objetos", () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 } as Record<string, unknown>;
      const result = deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    it("não modifica o objeto original", () => {
      const target = { a: 1 };
      const source = { a: 2 };
      deepMerge(target, source);
      expect(target.a).toBe(1);
    });
  });
});
