"use client";

import { useState } from "react";
import { provisionBotAction, startBotAction, stopBotAction, restartBotAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Pause, RotateCcw, Box, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface BotActionsProps {
  tenantId: string;
  isRunning: boolean;
  onStatusChange: () => void;
}

export function BotActions({ tenantId, isRunning, onStatusChange }: BotActionsProps) {
  const [provisioning, setProvisioning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const handleProvision = async () => {
    setProvisioning(true);
    try {
      const result = await provisionBotAction(tenantId);
      if (result.success) {
        toast.success("Bot provisionado com sucesso!");
        if (result.qrCode) {
          toast.info("QR Code gerado — aguarde o scan no WhatsApp");
        }
        onStatusChange();
      } else {
        toast.error(result.error || "Falha ao provisionar bot");
        if (result.manualSteps?.length) {
          result.manualSteps.forEach(step => toast.info(step));
        }
      }
    } catch (error) {
      toast.error("Erro inesperado ao provisionar");
    } finally {
      setProvisioning(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const result = await startBotAction(tenantId);
      if (result.success) {
        toast.success("Bot iniciado");
        onStatusChange();
      } else {
        toast.error(result.error || "Falha ao iniciar");
      }
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      const result = await stopBotAction(tenantId);
      if (result.success) {
        toast.success("Bot parado");
        onStatusChange();
      } else {
        toast.error(result.error || "Falha ao parar");
      }
    } finally {
      setStopping(false);
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      const result = await restartBotAction(tenantId);
      if (result.success) {
        toast.success("Bot reiniciado");
        onStatusChange();
      } else {
        toast.error(result.error || "Falha ao reiniciar");
      }
    } finally {
      setRestarting(false);
    }
  };

  if (isRunning) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleStop}
          disabled={stopping}
          variant="destructive"
          className="gap-1"
        >
          {stopping ? <Loader2 className="size-3 animate-spin" /> : <Pause className="size-3" />}
          Parar
        </Button>
        <Button
          onClick={handleRestart}
          disabled={restarting}
          variant="outline"
          className="gap-1"
        >
          {restarting ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
          Reiniciar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={handleProvision}
        disabled={provisioning}
        className="gap-1"
      >
        {provisioning ? <Loader2 className="size-3 animate-spin" /> : <Box className="size-3" />}
        Provisionar Bot
      </Button>
      <Button
        onClick={handleStart}
        disabled={starting}
        variant="outline"
        className="gap-1"
      >
        {starting ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
        Iniciar
      </Button>
    </div>
  );
}