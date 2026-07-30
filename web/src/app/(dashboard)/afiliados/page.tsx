import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  Globe,
  Store,
  Tag,
} from "lucide-react";
import { getAffiliateConfigAction } from "@/actions/affiliates";

const PLATFORMS = [
  {
    key: "amazonTag",
    label: "Amazon",
    icon: ShoppingCart,
    placeholder: "ex: odcolares2026-20",
    hint: "Affiliate Tag da Amazon Associates",
  },
  {
    key: "shopeeId",
    label: "Shopee",
    icon: Store,
    placeholder: "ex: 18387911117",
    hint: "ID de afiliado da Shopee (ShopID)",
  },
  {
    key: "mlId",
    label: "Mercado Livre",
    icon: Globe,
    placeholder: "ex: 88981950",
    hint: "ID de afiliado do Mercado Livre",
  },
  {
    key: "aliexpressId",
    label: "AliExpress",
    icon: Tag,
    placeholder: "ex: RendaExtraCupuns",
    hint: "ID de afiliado do AliExpress",
  },
] as const;

export default async function AffiliatesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  const config = await getAffiliateConfigAction(tenantId || "");

  const hasAnyConfig = config && Object.values(config).some(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Configurações de Afiliados
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seus IDs de afiliado para cada plataforma
        </p>
      </div>

      {/* Current Config Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle
              className={`size-5 ${hasAnyConfig ? "text-emerald-600" : "text-muted-foreground"}`}
            />
            Status das Configurações
          </CardTitle>
          <CardDescription>
            {hasAnyConfig
              ? "Plataformas com IDs de afiliado configurados"
              : "Nenhum ID configurado ainda. Adicione seus IDs abaixo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {PLATFORMS.map(({ key, label, icon: Icon }) => {
              const value = config?.[key as keyof typeof config] as string | null | undefined;
              const isConfigured = Boolean(value);
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isConfigured
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                      : "border-muted bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        isConfigured
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {isConfigured ? value : "Não configurado"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isConfigured ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isConfigured ? "OK" : "Pendente"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <form
        action={async (formData: FormData) => {
          "use server";
          const s = await auth();
          const tid = s?.user?.tenantId;
          if (!tid) return;
          const { updateAffiliateConfigAction } = await import(
            "@/actions/affiliates"
          );
          await updateAffiliateConfigAction(tid, {
            amazonTag: (formData.get("amazonTag") as string) || null,
            shopeeId: (formData.get("shopeeId") as string) || null,
            mlId: (formData.get("mlId") as string) || null,
            aliexpressId: (formData.get("aliexpressId") as string) || null,
          });
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Editar IDs</CardTitle>
            <CardDescription>
              Preencha apenas as plataformas que você utiliza
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              {PLATFORMS.map(({ key, label, placeholder, hint }) => {
                const value =
                  config?.[key as keyof typeof config] as string | null | undefined;
                return (
                  <div key={key} className="flex flex-col gap-2">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      name={key}
                      placeholder={placeholder}
                      defaultValue={value || ""}
                    />
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t">
              <Button type="submit">Salvar Configuração</Button>
              {hasAnyConfig && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="size-3 text-emerald-600" />
                  IDs salvos automaticamente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="size-4 text-muted-foreground" />
            Informações
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground flex flex-col gap-2">
          <p>
            • IDs configurados são usados automaticamente na geração de links de
            afiliado.
          </p>
          <p>
            • Sem ID configurado para uma plataforma → link direto é usado, o
            pipeline não trava.
          </p>
          <p>
            • Certifique-se de que os IDs estejam ativos nos programas de
            afiliados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
