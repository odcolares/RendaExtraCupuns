"use client";

import { useState } from "react";
import { syncTenantFontesAction, createFonteAction, deleteFonteAction } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Database, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Fonte {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  lastChecked: Date;
  totalOffersFound: number;
  totalOffersPublished: number;
}

interface FontesSyncProps {
  tenantId: string;
  fontes: Fonte[];
  onSyncComplete: () => void;
}

export function FontesSync({ tenantId, fontes, onSyncComplete }: FontesSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newFonteName, setNewFonteName] = useState("");
  const [newFonteUrl, setNewFonteUrl] = useState("");
  const [localFontes, setLocalFontes] = useState<Fonte[]>(fontes);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncTenantFontesAction(tenantId);
      if (result.synced > 0) {
        toast.success(`${result.synced} fonte(s) sincronizada(s)`);
      } else {
        toast.info("Nenhuma nova fonte para sincronizar");
      }
      onSyncComplete();
    } catch {
      toast.error("Erro ao sincronizar fontes");
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = async () => {
    if (!newFonteName.trim() || !newFonteUrl.trim()) {
      toast.error("Preencha nome e URL");
      return;
    }

    setAdding(true);
    try {
      const result = await createFonteAction(tenantId, newFonteName, newFonteUrl);
      if (result.success) {
        toast.success("Fonte adicionada");
        setNewFonteName("");
        setNewFonteUrl("");
        onSyncComplete();
      } else {
        toast.error(result.error || "Erro ao adicionar fonte");
      }
    } catch {
      toast.error("Erro ao adicionar fonte");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (fonteId: string) => {
    if (!confirm("Remover esta fonte?")) return;

    try {
      const result = await deleteFonteAction(fonteId);
      if (result.success) {
        toast.success("Fonte removida");
        setLocalFontes(prev => prev.filter(f => f.id !== fonteId));
        onSyncComplete();
      } else {
        toast.error(result.error || "Erro ao remover fonte");
      }
    } catch {
      toast.error("Erro ao remover fonte");
    }
  };

  const getSourceType = (url: string) => {
    if (url.endsWith("@g.us")) return { label: "Grupo", icon: "👥" };
    if (url.endsWith("@broadcast")) return { label: "Broadcast", icon: "📢" };
    if (url.endsWith("@newsletter")) return { label: "Newsletter", icon: "📰" };
    return { label: "Outro", icon: "❓" };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-4" />
              Fontes WhatsApp
            </CardTitle>
            <CardDescription>
              Gerencie os grupos/broadcasts/newsletters monitorados
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar nova fonte */}
        <div className="flex gap-2 p-4 rounded-lg bg-muted/30">
          <Input
            placeholder="Nome da fonte (ex: Grupo Ofertas Premium)"
            value={newFonteName}
            onChange={e => setNewFonteName(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="ID da fonte (ex: 120363027456789123@g.us)"
            value={newFonteUrl}
            onChange={e => setNewFonteUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={adding}>
            <Plus className="size-3" />
            Adicionar
          </Button>
        </div>

        {/* Botão sincronizar */}
        <Button
          onClick={handleSync}
          disabled={syncing}
          className="w-full gap-2"
          variant="outline"
        >
          {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Sincronizar com Bot
        </Button>

        {/* Lista de fontes */}
        {localFontes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="size-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma fonte configurada</p>
            <p className="text-xs">Adicione grupos/broadcasts acima ou sincronize com o bot</p>
          </div>
        ) : (
          <div className="space-y-2">
            {localFontes.map(fonte => {
              const type = getSourceType(fonte.url);
              return (
                <div key={fonte.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <p className="font-medium">{fonte.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{fonte.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={fonte.isActive ? "default" : "secondary"}>
                      {fonte.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {fonte.totalOffersFound} encontradas · {fonte.totalOffersPublished} publicadas
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fonte.lastChecked.toLocaleDateString("pt-BR")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(fonte.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p><strong>Legenda:</strong> 👥 Grupo · 📢 Broadcast · 📰 Newsletter</p>
          <p>Sincronizar atualiza a lista baseado no que o bot está monitorando no WhatsApp.</p>
        </div>
      </CardContent>
    </Card>
  );
}