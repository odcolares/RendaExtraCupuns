import { createModuleLogger } from "../../../src/utils/logger";

describe("Logger", () => {
  describe("createModuleLogger", () => {
    it("cria um logger com funções para todos os níveis", () => {
      const log = createModuleLogger("TestModule");
      expect(log).toHaveProperty("error");
      expect(log).toHaveProperty("warn");
      expect(log).toHaveProperty("info");
      expect(log).toHaveProperty("debug");
    });

    it("cria logger com o nome do módulo", () => {
      const log = createModuleLogger("WhatsApp");
      expect(typeof log.info).toBe("function");
    });

    it("error, warn, info, debug são funções", () => {
      const log = createModuleLogger("Test");
      expect(typeof log.error).toBe("function");
      expect(typeof log.warn).toBe("function");
      expect(typeof log.info).toBe("function");
      expect(typeof log.debug).toBe("function");
    });

    it("não lança erro ao logar mensagem", () => {
      const log = createModuleLogger("Test");
      expect(() => {
        log.info("Mensagem de teste");
        log.warn("Aviso de teste");
        log.error("Erro de teste");
        log.debug("Debug de teste");
      }).not.toThrow();
    });

    it("aceita metadados opcionais", () => {
      const log = createModuleLogger("Test");
      expect(() => {
        log.info("Com meta", { produto: "iPhone", preco: 3749 });
      }).not.toThrow();
    });
  });
});
