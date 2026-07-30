import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanKey } from "@/lib/stripe";
import {
  getSubscriptionAction,
  createCheckoutAction,
  cancelSubscriptionAction,
} from "@/actions/assinatura";
import {
  CreditCard,
  Check,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Crown,
} from "lucide-react";

const planOrder: PlanKey[] = ["free", "starter", "professional"];

const statusLabels: Record<string, string> = {
  active: "Ativo",
  suspended: "Suspenso",
  cancelled: "Cancelado",
};

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  suspended: "destructive",
  cancelled: "secondary",
};

export default async function AssinaturaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tenant = await getSubscriptionAction();
  if (!tenant) throw new Error("Tenant não encontrado");

  const currentPlan = tenant.plan as PlanKey;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assinatura</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu plano e pagamentos
        </p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-5 text-primary" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">
                {PLANS[currentPlan].name}
              </h3>
              <p className="text-muted-foreground">
                {PLANS[currentPlan].price === 0
                  ? "Grátis"
                  : `R$ ${PLANS[currentPlan].price}/mês`}
              </p>
            </div>
            <Badge
              variant={statusVariants[tenant.status] || "outline"}
              className="text-sm"
            >
              {statusLabels[tenant.status] || tenant.status}
            </Badge>
          </div>
          <ul className="space-y-2">
            {PLANS[currentPlan].features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-emerald-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Mudar de Plano Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            Mudar de Plano
          </CardTitle>
          <CardDescription>
            Escolha o plano ideal para seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {planOrder.map((key) => {
              const plan = PLANS[key];
              const isCurrent = key === currentPlan;
              const isUpgrade =
                !isCurrent && plan.price > PLANS[currentPlan].price;
              const isDowngrade =
                !isCurrent && plan.price < PLANS[currentPlan].price;
              const isPopular = key === "starter";

              return (
                <div
                  key={key}
                  className={`relative rounded-lg border p-6 ${
                    isCurrent
                      ? "border-primary/50 bg-primary/5"
                      : isPopular
                        ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                        : "border-border"
                  }`}
                >
                  {isPopular && !isCurrent && (
                    <Badge className="absolute -top-2.5 left-4 bg-amber-500 hover:bg-amber-600 text-white">
                      Mais popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-2.5 left-4" variant="default">
                      Plano atual
                    </Badge>
                  )}

                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-2xl font-bold mt-2">
                    {plan.price === 0
                      ? "Grátis"
                      : `R$ ${plan.price}`}
                    {plan.price > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /mês
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.description}
                  </p>

                  <ul className="space-y-2 mt-4 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs">
                        <Check className="size-3.5 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && (
                    <>
                      {isUpgrade && (
                        <form
                          action={async () => {
                            "use server";
                            const { url } = await createCheckoutAction(key);
                            if (url) redirect(url);
                          }}
                        >
                          <Button type="submit" className="w-full">
                            <ArrowUp className="size-4 mr-1" />
                            Fazer Upgrade
                          </Button>
                        </form>
                      )}
                      {isDowngrade && key === "free" && (
                        <form
                          action={async () => {
                            "use server";
                            await cancelSubscriptionAction();
                            revalidatePath("/assinatura");
                          }}
                        >
                          <Button type="submit" variant="outline" className="w-full">
                            <ArrowDown className="size-4 mr-1" />
                            Cancelar assinatura
                          </Button>
                        </form>
                      )}
                      {isDowngrade && key !== "free" && (
                        <form
                          action={async () => {
                            "use server";
                            const { url } = await createCheckoutAction(key);
                            if (url) redirect(url);
                          }}
                        >
                          <Button type="submit" variant="outline" className="w-full">
                            <ArrowDown className="size-4 mr-1" />
                            Fazer Downgrade
                          </Button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Card — only for paying users */}
      {currentPlan !== "free" && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Cancelar Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ao cancelar, seu plano será rebaixado para Free. Seus dados
              continuarão disponíveis.
            </p>
            <form
              action={async () => {
                "use server";
                await cancelSubscriptionAction();
                revalidatePath("/assinatura");
              }}
            >
              <Button type="submit" variant="destructive">
                Cancelar Assinatura
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
