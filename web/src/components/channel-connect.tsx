"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, MessageCircle, Send, Unplug, XCircle, HelpCircle } from "lucide-react";

import {
  connectChannelAction,
  disconnectChannelAction,
  getChannelsAction,
  type ChannelPlatformInput,
} from "@/actions/channels";

interface ChannelConnectProps {
  platform?: ChannelPlatformInput;
  title?: string;
  description?: string;
}

interface Feedback {
  type: "success" | "error";
  message: string;
}

/**
 * Conecta o canal de publicação do tenant (Telegram hoje).
 * Reutilizado no onboarding e na página /conta.
 */
export function ChannelConnect({
  platform = "telegram",
  title = "Canal do Telegram",
  description = "Conecte o canal onde suas ofertas serão publicadas automaticamente",
}: ChannelConnectProps) {
  const [connected, setConnected] = useState<string | null>(null);
  const [validatedAt, setValidatedAt] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estado inicial: canal já configurado?
  useEffect(() => {
    let mounted = true;
    getChannelsAction()
      .then((channels) => {
        if (!mounted) return;
        const ch = channels.find((c) => c.platform === platform);
        if (ch) {
          setConnected(ch.label || ch.channelId);
          setValidatedAt(ch.validatedAt ? new Date(ch.validatedAt).toLocaleDateString("pt-BR") : null);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setFeedback({ type: "error", message: "Não foi possível carregar o estado do canal." });
      });
    return () => {
      mounted = false;
    };
  }, [platform]);

  const platformLabel = platform === "telegram" ? "Telegram" : "WhatsApp";

  function handleConnect() {
    if (!input.trim()) {
      setFeedback({ type: "error", message: "Cole o @ do canal, um link t.me ou o ID do canal." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await connectChannelAction(platform, input);
      if (result.success && result.channel) {
        setConnected(result.channel.label || result.channel.channelId);
        setValidatedAt(
          result.channel.validatedAt
            ? new Date(result.channel.validatedAt).toLocaleDateString("pt-BR")
            : null
        );
        setInput("");
        setFeedback({ type: "success", message: result.message });
      } else {
        setFeedback({ type: "error", message: result.message });
      }
    });
  }

  function handleDisconnect() {
    setFeedback(null);
    startTransition(async () => {
      const result = await disconnectChannelAction(platform);
      if (result.success) {
        setConnected(null);
        setValidatedAt(null);
        setFeedback({ type: "success", message: result.message });
      } else {
        setFeedback({ type: "error", message: result.message });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={connected ? "default" : "secondary"} className="gap-1">
          {connected ? (
            <CheckCircle2 className="size-3" />
          ) : (
            <XCircle className="size-3" />
          )}
          {connected ? `${platformLabel} conectado` : `${platformLabel} não conectado`}
        </Badge>
        {connected && validatedAt && (
          <span className="text-xs text-muted-foreground">
            Validado em {validatedAt}
          </span>
        )}
      </div>

      {connected ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
          <div className="flex min-w-0 items-center gap-2">
            <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">{connected}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Unplug className="size-4" />}
            Desconectar
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor={`channel-${platform}`}>@ do canal ou link t.me</Label>
            <div className="flex gap-2">
              <Input
                id={`channel-${platform}`}
                placeholder="@seucanal ou https://t.me/seucanal"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isPending}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleConnect}
                disabled={isPending}
                className="gap-2"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Testar conexão
              </Button>
            </div>
          </div>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <HelpCircle className="mt-0.5 size-3 shrink-0" />
            Adicione @RendaExtraCuponsBot como administrador do canal antes de testar. A
            publicação de ofertas acontece automaticamente após a conexão.
          </p>
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}