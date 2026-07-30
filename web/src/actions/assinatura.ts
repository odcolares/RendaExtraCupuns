"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function getSubscriptionAction() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Sem tenant");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      plan: true,
      status: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return tenant;
}

export async function createCheckoutAction(planKey: string) {
  const session = await requireAuth();

  if (planKey === "free") {
    return { url: "/assinatura" };
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/checkout`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planKey }),
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Erro ao criar checkout");

  return { url: data.url };
}

export async function cancelSubscriptionAction() {
  const session = await requireAuth();
  const tenantId = session.user.tenantId;
  if (!tenantId) throw new Error("Sem tenant");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { stripeSubscriptionId: true, plan: true },
  });

  if (!tenant) throw new Error("Tenant não encontrado");

  // Cancel at Stripe if has subscription
  if (tenant.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(tenant.stripeSubscriptionId);
    } catch (err) {
      console.error("Stripe cancel error:", err);
      // Continue anyway — update local status
    }
  }

  // Downgrade to free
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan: "free", status: "active", stripeSubscriptionId: null },
  });

  return { success: true };
}
