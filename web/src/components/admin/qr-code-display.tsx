"use client";

import { useEffect, useState } from "react";
import { getBotQrCodeAction } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, RefreshCw, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QrCodeDisplayProps {
  tenantId: string;
  whatsappReady: boolean;
  pollingInterval?: number; // default 5000ms
}

export function QrCodeDisplay({ tenantId, whatsappReady, pollingInterval = 5000 }: QrCodeDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchQrCode = async () => {
    if (whatsappReady) return; // Para de buscar se já conectado
    
    setLoading(true);
    setError(null);
    try {
      const result = await getBotQrCodeAction(tenantId);
      if (result.qrCode) {
        setQrCode(result.qrCode);
        setLastUpdated(new Date());
      } else if (!whatsappReady) {
        setError("QR Code não disponível — bot pode não estar provisionado");
      }
    } catch {
      setError("Erro ao buscar QR Code");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrCode();
    
    if (!whatsappReady) {
      const interval = setInterval(fetchQrCode, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [tenantId, whatsappReady, pollingInterval]);

  if (whatsappReady) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="size-4" />
            WhatsApp Conectado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="default" className="text-green-700 bg-green-100 border-green-200">
            ✓ Pronto para monitorar
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="size-4" />
            QR Code WhatsApp
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQrCode}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className="size-3" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="size-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {qrCode && (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="max-w-[280px] rounded-lg border"
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Escaneie com o WhatsApp do número que monitorará os grupos</p>
              <p className="text-xs">Atualizado: {lastUpdated?.toLocaleTimeString("pt-BR")}</p>
            </div>
          </div>
        )}

        {!qrCode && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="size-8 animate-spin mx-auto mb-2" />
            <p>Aguardando QR Code...</p>
            <p className="text-xs">O bot gera novo QR a cada ~30s</p>
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
          <p className="font-medium">Instruções:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Abra o WhatsApp no celular</li>
            <li>Vá em Configurações → Aparelhos conectados</li>
            <li>Toque em "Conectar aparelho"</li>
            <li>Escaneie o QR Code acima</li>
            <li>Aguarde aparecer "Conectado" abaixo</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}