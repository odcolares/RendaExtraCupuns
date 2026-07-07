import Stripe from "stripe";

function createStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Return a dummy client that throws when used — allows build to proceed
    return undefined as unknown as Stripe;
  }
  return new Stripe(key, { typescript: true });
}

export const stripe = createStripe();

export const PLANS = {
  free: {
    name: "Free",
    priceId: undefined,
    price: 0,
    description: "Para testar o produto",
    features: ["Até 10 ofertas/dia", "1 canal Telegram", "Suporte básico"],
  },
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    price: 29,
    description: "Para quem está começando",
    features: [
      "Até 50 ofertas/dia",
      "3 canais Telegram",
      "Suporte prioritário",
      "Todas as plataformas",
    ],
  },
  professional: {
    name: "Professional",
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID ?? "",
    price: 79,
    description: "Para crescimento máximo",
    features: [
      "Ofertas ilimitadas",
      "Canais ilimitados",
      "Suporte 24/7",
      "White-label",
      "Múltiplos usuários",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
