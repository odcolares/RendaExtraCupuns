"use client";

import { BotStatus } from "@/actions/admin";
import { CheckCircle, AlertCircle, XCircle, Loader2, Wifi, WifiOff, Smartphone, MessageSquare, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BotStatusCardProps {
  status: BotStatus;
}

export function BotStatusCard({ status }: BotStatusCardProps) {
  const getStatusBadge = (running: boolean) => (
    <Badge variant={running ? "default" : "secondary"} className="gap-1">
      {running ? (
        <>
          <Loader2 className="size-3 animate-spin" />
          Rodando
        </>
      ) : (
        <>
          <XCircle className="size-3" />
          Parado
        </>
      )}
    </Badge>
  );

  const getConnectionStatus = (ready: boolean, label: string, IconOn: any, IconOff: any) => (
    <div className="flex items-center gap-2 text-sm">
      {ready ? (
        <IconOn className="size-4 text-green-500" />
      ) : (
        <IconOff className="size-4 text-red-500" />
      )}
      <span className={ready ? "text-green-600" : "text-red-600"}>
        {ready ? "Conectado" : "Desconectado"}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <Card className="border-l-2 border-l-brand-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{status.tenantName}</CardTitle>
          {getStatusBadge(status.isRunning)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* WhatsApp */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Smartphone className="size-4" />
            WhatsApp
          </div>
          {getConnectionStatus(status.whatsapp.ready, "WhatsApp", Wifi, WifiOff)}
          {status.whatsapp.qrCodeGenerated && (
            <Badge variant="outline" className="text-xs">
              QR Code gerado — aguardando scan
            </Badge>
          )}
          {status.whatsapp.lastConnected && (
            <p className="text-xs text-muted-foreground">
              Última conexão: {status.whatsapp.lastConnected.toLocaleString("pt-BR")}
            </p>
          )}
        </div>

        {/* Telegram */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessageSquare className="size-4" />
            Telegram
          </div>
          {getConnectionStatus(status.telegram.configured, "Bot configurado", Link, Link)}
          {status.telegram.tested && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
              Testado com sucesso
            </Badge>
          )}
        </div>

        {/* Afiliados */}
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Link className="size-4" />
            Afiliados configurados
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "amazon", label: "Amazon", configured: status.afiliados.amazon },
              { key: "shopee", label: "Shopee", configured: status.afiliados.shopee },
              { key: "mercadolivre", label: "Mercado Livre", configured: status.afiliados.mercadolivre },
              { key: "aliexpress", label: "AliExpress", configured: status.afiliados.aliexpress },
            ].map(({ key, label, configured }) => (
              <Badge
                key={key}
                variant={configured ? "default" : "outline"}
                className="text-xs"
              >
                {label} {configured ? "✓" : "✗"}
              </Badge>
            ))}
          </div>
        </div>

        {/* Fontes */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Fontes WhatsApp</span>
            <Badge variant={status.fontes.active > 0 ? "default" : "secondary"}>
              {status.fontes.active}/{status.fontes.total} ativas
            </Badge>
          </div>
          {status.fontes.lastChecked && (
            <p className="text-xs text-muted-foreground mt-1">
              Última verificação: {status.fontes.lastChecked.toLocaleString("pt-BR")}
            </p>
          )}
        </div>

        {/* Stats 24h */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-brand-primary">{status.stats.offersProcessed24h}</p>
            <p className="text-xs text-muted-foreground">Processadas (24h)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-green-600">{status.stats.offersPublished24h}</p>
            <p className="text-xs text-muted-foreground">Publicadas (24h)</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-red-600">{status.stats.errors24h}</p>
            <p className="text-xs text-muted-foreground">Erros (24h)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}