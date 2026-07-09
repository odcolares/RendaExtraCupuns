"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getAffiliateConfig, updateAffiliateConfig } from "@/lib/dashboard";

interface AffiliateFormData {
  amazonTag: string;
  shopeeId: string;
  mlId: string;
  aliexpressId: string;
}

export default function AffiliatesPage() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<AffiliateFormData>({
    amazonTag: "",
    shopeeId: "",
    mlId: "",
    aliexpressId: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    setTenantId(session?.user?.tenantId || null);
  }, [session?.user?.tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadAffiliateConfig();
    }
  }, [tenantId]);

  const loadAffiliateConfig = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    try {
      const config = await getAffiliateConfig(tenantId);
      setFormData({
        amazonTag: config?.amazonTag || "",
        shopeeId: config?.shopeeId || "",
        mlId: config?.mlId || "",
        aliexpressId: config?.aliexpressId || "",
      });
    } catch (error) {
      console.error("Failed to load affiliate config:", error);
      toast.error("Failed to load affiliate configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenantId) {
      toast.error("Tenant not found");
      return;
    }

    setSaving(true);
    try {
      await updateAffiliateConfig(tenantId, {
        amazonTag: formData.amazonTag || null,
        shopeeId: formData.shopeeId || null,
        mlId: formData.mlId || null,
        aliexpressId: formData.aliexpressId || null,
      });
      
      toast.success("Affiliate configuration saved successfully!");
    } catch (error) {
      console.error("Failed to save affiliate config:", error);
      toast.error("Failed to save affiliate configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AffiliateFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Afiliados</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seus IDs de afiliado para cada plataforma de vendas
        </p>
      </div>

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
                value={formData.amazonTag}
                onChange={(e) => handleInputChange("amazonTag", e.target.value)}
                placeholder="ex: odcolares2026-20"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Seu ID de afiliado da Amazon (affiliate ID)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopee-id">Shopee Affiliate ID</Label>
              <Input
                id="shopee-id"
                value={formData.shopeeId}
                onChange={(e) => handleInputChange("shopeeId", e.target.value)}
                placeholder="ex: 18387911117"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Seu ID de afiliado da Shopee (ShopID)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ml-id">Mercado Livre ID</Label>
              <Input
                id="ml-id"
                value={formData.mlId}
                onChange={(e) => handleInputChange("mlId", e.target.value)}
                placeholder="ex: 88981950"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Seu ID de afiliado do Mercado Livre
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aliexpress-id">AliExpress ID</Label>
              <Input
                id="aliexpress-id"
                value={formData.aliexpressId}
                onChange={(e) => handleInputChange("aliexpressId", e.target.value)}
                placeholder="ex: RendaExtraCupuns"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Seu ID de afiliado do AliExpress (configurado em portals.aliexpress.com)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={loadAffiliateConfig}
              disabled={loading || saving}
            >
              Recarregar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar Configuração"}
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
              { label: "Amazon", value: formData.amazonTag, configured: !!formData.amazonTag },
              { label: "Shopee", value: formData.shopeeId, configured: !!formData.shopeeId },
              { label: "Mercado Livre", value: formData.mlId, configured: !!formData.mlId },
              { label: "AliExpress", value: formData.aliexpressId, configured: !!formData.aliexpressId },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.configured ? "bg-green-100" : "bg-gray-100"}`}>                    {item.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.value || "Não configurado"}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${item.configured ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`>
                  {item.configured ? "Configurado" : "Pendente"}
                </div>
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
    </div>
  );
}