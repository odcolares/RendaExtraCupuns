import { extractCouponData } from "../../../src/coupons/detector";

const SHOPEE_COUPON_URL =
  "https://shopee.com.br/m/cupom-de-desconto/12345";

describe("Coupon Detector — extractCouponData", () => {
  it("reconhece cupom com a palavra 'CUPOM' (singular)", () => {
    const msg = `🎟️ CUPOM 10% OFF, Limite R$ 40: FUTNAVEIA
${SHOPEE_COUPON_URL}`;
    const coupon = extractCouponData(msg, SHOPEE_COUPON_URL);
    expect(coupon).not.toBeNull();
    expect(coupon!.code).toBe("FUTNAVEIA");
    expect(coupon!.discount).toBe("10% OFF");
  });

  it("reconhece cupom com a palavra 'CUPONS' (plural)", () => {
    const msg = `🎟️ CUPONS 10% OFF, Limite R$ 40: FUTNAVEIA
${SHOPEE_COUPON_URL}`;
    const coupon = extractCouponData(msg, SHOPEE_COUPON_URL);
    expect(coupon).not.toBeNull();
    expect(coupon!.code).toBe("FUTNAVEIA");
  });

  it("reconhece cupom com a palavra 'cupon' (legado, sem M)", () => {
    const msg = `🎟️ cupon 10% OFF, Limite R$ 40: FUTNAVEIA
${SHOPEE_COUPON_URL}`;
    const coupon = extractCouponData(msg, SHOPEE_COUPON_URL);
    expect(coupon).not.toBeNull();
    expect(coupon!.code).toBe("FUTNAVEIA");
  });

  it("retorna null para mensagem sem palavra de cupom", () => {
    const msg = `Promoção 10% OFF
${SHOPEE_COUPON_URL}`;
    const coupon = extractCouponData(msg, SHOPEE_COUPON_URL);
    expect(coupon).toBeNull();
  });
});