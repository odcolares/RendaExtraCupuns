"use client";

import { useState } from "react";
import { testTelegramConnectionAction, saveTelegramChannelAction } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface TelegramTestProps {
  tenantId: string;
  onTestSuccess: () => void;
}

export function TelegramTest({ tenantId, onTestSuccess }: TelegramTestProps) {
  const [botToken, setBotToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleTest = async () => {
    if (!botToken || !channelId) {
      toast.error("Preencha Bot Token e Channel ID");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setSaved(false);
    try {
      const result = await testTelegramConnectionAction(tenantId);
      setTestResult(result);
      if (result.success) {
        toast.success("Conexão Telegram testada com sucesso!");

        const saveResult = await saveTelegramChannelAction(tenantId, channelId);
        if (saveResult.success) {
          toast.success("Canal salvo no banco de dados");
          setSaved(true);
        } else {
          toast.error(saveResult.error || "Erro ao salvar canal");
        }

        onTestSuccess();
      } else {
        toast.error(result.error || "Falha no teste");
      }
    } catch {
      toast.error("Erro inesperado");
      setTestResult({ success: false, error: "Erro inesperado" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              Teste de Conexão Telegram
            </CardTitle>
            <CardDescription>
              Configure seu bot e canal, depois teste a conexão
            </CardDescription>
          </div>
          {saved && (
            <Badge variant="default" className="text-xs">
              Canal salvo
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="botToken">Bot Token (@BotFather)</Label>
            <Input
              id="botToken"
              type="password"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              value={botToken}
              onChange={e => setBotToken(e.target.value)}
              disabled={testing}
            />
            <p className="text-xs text-muted-foreground">
              Crie um bot no <a href="https://t.me/BotFather" target="_blank" className="underline">@BotFather</a> e cole o token aqui
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="channelId">Channel ID</Label>
            <Input
              id="channelId"
              placeholder="-1001234567890"
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              disabled={testing}
            />
            <p className="text-xs text-muted-foreground">
              ID do canal/grupo (ex: -1001234567890). Use <code>@RawDataBot</code> para descobrir.
            </p>
          </div>
        </div>

        <Button
          onClick={handleTest}
          disabled={testing || !botToken || !channelId}
          className="w-full gap-2"
        >
          {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Testar Conexão
        </Button>

        {testResult && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {testResult.success ? (
              <CheckCircle className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            <span className="text-sm">
              {testResult.success 
                ? "Conexão OK! Mensagem de teste enviada ao canal." 
                : testResult.error || "Falha na conexão"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}