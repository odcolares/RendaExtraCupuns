import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import type { PlanKey } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { plan } = await request.json();

    if (!plan || !PLANS[plan as PlanKey]) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    const planKey = plan as PlanKey;
    const planConfig = PLANS[planKey];

    if (planKey === "free") {
      return NextResponse.json({ url: "/dashboard" });
    }

    if (!planConfig.priceId) {
      return NextResponse.json(
        { error: "Preço não configurado." },
        { status: 500 }
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        plan: planKey,
      },
      success_url: `${request.headers.get("origin")}/dashboard?checkout=success`,
      cancel_url: `${request.headers.get("origin")}/#planos`,
      customer_email: session.user.email ?? undefined,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Erro ao criar sessão de checkout." },
      { status: 500 }
    );
  }
}
