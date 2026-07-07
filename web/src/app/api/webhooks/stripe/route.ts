import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object;
        const userId = checkoutSession.metadata?.userId;
        const plan = checkoutSession.metadata?.plan;

        if (userId && plan) {
          const subscriptionId =
            typeof checkoutSession.subscription === "string"
              ? checkoutSession.subscription
              : undefined;

          await prisma.user.update({
            where: { id: userId },
            data: {
              tenant: {
                update: {
                  plan: plan as "starter" | "professional",
                  status: "active",
                  stripeCustomerId: checkoutSession.customer as string,
                  stripeSubscriptionId: subscriptionId,
                },
              },
            },
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (tenant) {
          const status =
            subscription.status === "active" ? "active"
            : subscription.status === "past_due" ? "active"
            : subscription.status === "canceled" ? "cancelled"
            : subscription.status === "unpaid" ? "suspended"
            : "suspended";

          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              status,
              plan:
                subscription.items?.data?.[0]?.price?.metadata?.plan ===
                  "professional"
                  ? "professional"
                  : "starter",
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
