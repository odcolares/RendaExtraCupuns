import {
  buildSourceNames,
  getSourcesFromConfig,
} from "../../src/whatsapp/sources";

describe("WhatsApp Sources", () => {
  describe("getSourcesFromConfig", () => {
    it("retorna uma entrada por fonte com id e nome amigável", () => {
      const sources = getSourcesFromConfig({
        groupIds: [
          "120363407937604970@g.us",
          "1734043269@broadcast",
        ],
        newsletterId: "120363421652731550@newsletter",
      });

      expect(sources).toHaveLength(3);
      expect(sources.map((s) => s.id)).toEqual([
        "120363407937604970@g.us",
        "1734043269@broadcast",
        "120363421652731550@newsletter",
      ]);

      const byId = Object.fromEntries(sources.map((s) => [s.id, s.name]));
      expect(byId["120363407937604970@g.us"]).toBe("Grupo 12036340...");
      expect(byId["1734043269@broadcast"]).toBe("Kotas #51 (Broadcast)");
      expect(byId["120363421652731550@newsletter"]).toBe("Newsletter Ofertas");
    });

    it("retorna array vazio para entrada malformada", () => {
      const sources = getSourcesFromConfig({
        groupIds: [""],
        newsletterId: null,
      });

      expect(sources).toEqual([]);
    });

    it("normaliza ids com espaços e newsletter vazia", () => {
      const sources = getSourcesFromConfig({
        groupIds: ["  120363407937604970@g.us  ", ""],
        newsletterId: "  ",
      });

      expect(sources).toHaveLength(1);
      expect(sources[0]).toEqual({
        id: "120363407937604970@g.us",
        name: "Grupo 12036340...",
      });
    });
  });

  describe("buildSourceNames", () => {
    it("mapeia grupo, broadcast e newsletter para nomes amigáveis", () => {
      const names = buildSourceNames({
        groupIds: ["120363407937604970@g.us", "1734043269@broadcast"],
        newsletterId: "120363421652731550@newsletter",
      });

      expect(names).toEqual({
        "120363407937604970@g.us": "Grupo 12036340...",
        "1734043269@broadcast": "Kotas #51 (Broadcast)",
        "120363421652731550@newsletter": "Newsletter Ofertas",
      });
    });

    it("ignora newsletter nula", () => {
      const names = buildSourceNames({
        groupIds: ["1734043269@broadcast"],
        newsletterId: null,
      });

      expect(names).toEqual({
        "1734043269@broadcast": "Kotas #51 (Broadcast)",
      });
    });
  });
});