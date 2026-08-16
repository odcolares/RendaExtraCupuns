import { buildTrackingUrl } from "../../../src/telegram/tracking";

describe("Telegram buildTrackingUrl", () => {
  const originalWebUrl = process.env.WEB_URL;

  afterEach(() => {
    if (originalWebUrl === undefined) {
      delete process.env.WEB_URL;
    } else {
      process.env.WEB_URL = originalWebUrl;
    }
  });

  it("usa origin default quando WEB_URL não definida", () => {
    delete process.env.WEB_URL;
    expect(buildTrackingUrl("abc123")).toBe(
      "https://web-gamma-hazel-30.vercel.app/r/abc123"
    );
  });

  it("usa origin customizada quando WEB_URL definida", () => {
    process.env.WEB_URL = "https://custom.example.com";
    expect(buildTrackingUrl("abc123")).toBe(
      "https://custom.example.com/r/abc123"
    );
  });

  it("formata o path corretamente para vários formatos de offerId", () => {
    delete process.env.WEB_URL;
    expect(buildTrackingUrl("abc123")).toBe(
      "https://web-gamma-hazel-30.vercel.app/r/abc123"
    );
    expect(buildTrackingUrl("offer-42")).toBe(
      "https://web-gamma-hazel-30.vercel.app/r/offer-42"
    );
    expect(buildTrackingUrl("ABC_123")).toBe(
      "https://web-gamma-hazel-30.vercel.app/r/ABC_123"
    );
  });
});