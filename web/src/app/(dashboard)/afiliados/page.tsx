import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getAffiliateConfigAction, updateAffiliateConfigAction } from "@/actions/affiliates";

interface AffiliateFormData {
  amazonTag: string;
  shopeeId: string;
  mlId: string;
  aliexpressId: string;
}

export default async function AffiliatesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  const tenantId = session.user.tenantId;

  const config = await getAffiliateConfigAction(tenantId || "");
  
  const formData = {
    amazonTag: config?.amazonTag || "",
    shopeeId: config?.shopeeId || "",
    mlId: config?.mlId || "",
    aliexpressId: config?.aliexpressId || "",
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Afiliados</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seus IDs de afiliado para cada plataforma de vendas
        </p>
      </div>

      <form action={async (formData: FormData) => {
        "use server";
        const tenantId = (await auth())?.user?.tenantId;
        if (!tenantId) return;
        
        const data = {
          amazonTag: formData.get("amazonTag") as string || null,
          shopeeId: formData.get("shopeeId") as string || null,
          mlId: formData.get("mlId") as string || null,
          aliexpressId: formData.get("aliexpressId") as string || null,
        };
        await updateAffiliateConfigAction(tenantId, data);
      }}>
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Plataformas</CardTitle>
            <CardDescription>
              Preencha os IDs de rastreamento para cada programa de afiliados.
              Os campos não preenchidos serão ignorados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amazon-tag">Amazon Affiliate Tag</Label>
                <Input
                  id="amazon-tag"
                  name="amazonTag"
                  placeholder="ex: odcolares2026-20"
                />
                <p className="text-xs text-muted-foreground">
                  Seu ID de afiliado da Amazon (affiliate ID)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopee-id">Shopee Affiliate ID</Label>
                <Input
                  id="shopee-id"
                  name="shopeeId"
                  placeholder="ex: 18387911117"
                />
                <p className="text-xs text-muted-foreground">
                  Seu ID de afiliado da Shopee (ShopID)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ml-id">Mercado Livre ID</Label>
                <Input
                  id="ml-id"
                  name="mlId"
                  placeholder="ex: 88981950"
                />
                <p className="text-xs text-muted-foreground">
                  Seu ID de afiliado do Mercado Livre
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aliexpress-id">AliExpress ID</Label>
                <Input
                  id="aliexpress-id"
                  name="aliexpressId"
                  placeholder="ex: RendaExtraCupuns"
                />
                <p className="text-xs text-muted-foreground">
                  Seu ID de afiliado do AliExpress (configurado em portals.aliexpress.com)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="submit">
                Salvar Configuração
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Configurações Atuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: "Amazon", value: "amazonTag" },
                { label: "Shopee", value: "shopeeId" },
                { label: "Mercado Livre", value: "mlId" },
                { label: "AliExpress", value: "aliexpressId" },
              ].map((item) => (
                <div
                  key={item.value}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-5 w-5 ${"text-green-600"}`} />
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Configurado
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Configurado
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NOTAS</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • IDs de afiliados configurados aqui são usados ​​automaticamente na geração de links no painel principal.
            </p>
            <p>
              • Sem ID configurado para um provedor → link direto usado, pipeline não trava.
            </p>
            <p>
              • Todos os IDs de afiliados devem estar ativos — caso contrário, links direcionarão para página genérica.
            </p>
            <p>
              • Configurações são salvas em tempo real; não é necessário recarregar o navegador.
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}