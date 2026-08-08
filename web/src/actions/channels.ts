"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const TELEGRAM_API = "https://api.telegram.org";

export type ChannelPlatformInput = "telegram" | "whatsapp";

export interface ChannelInfo {
  channelId: string;
  label: string | null;
  validatedAt: Date | null;
  platform: ChannelPlatformInput;
}

export interface ConnectChannelResult {
  success: boolean;
  message: string;
  channel?: ChannelInfo;
}

async function requireTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  return session.user.tenantId;
}

/**
 * Normaliza a entrada do usuário para um chat_id aceito pela API do Telegram:
 * - "@handle" → mantém
 * - "t.me/xxx" ou "t.me/s/xxx" → converte para "@xxx"
 * - número (ID do canal) → mantém
 * - "xxx" (sem @) → prefixa com @
 */
function resolveChatIdInput(input: string): string {
  const trimmed = input.trim();
  if (/^@?[A-Za-z0-9_]{4,}$/.test(trimmed)) {
    return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
  }
  const tme = trimmed.match(/t\.me\/(?:s\/)?([A-Za-z0-9_]+)/);
  if (tme) return `@${tme[1]}`;
  return trimmed; // mantém aqui (ex: ID numérico -1001234567890)
}

async function telegramCall(token: string, method: string, params: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return res.json();
}

/**
 * Conecta o canal do telegrama do tenant:
 * 1. Resolve o chat via getChat (valida que o bot enxerga o canal)
 * 2. Envia uma mensagem de teste (valida permissão de postagem)
 * 3. Grava/atualiza TenantChannel (validatedAt preenchido)
 */
export async function connectChannelAction(
  platform: ChannelPlatformInput,
  channelInput: string
): Promise<ConnectChannelResult> {
  const tenantId = await requireTenantId();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return {
      success: false,
      message:
        "TELEGRAM_BOT_TOKEN não configurado no servidor. Avise o administrador.",
    };
  }

  const chatIdParam = resolveChatIdInput(channelInput);
  if (!chatIdParam) {
    return {
      success: false,
      message: "Cole o @ do canal, um link t.me ou o ID do canal.",
    };
  }

  // 1. Validar/resolver o canal
  const chat = await telegramCall(token, "getChat", { chat_id: chatIdParam });
  if (!chat.ok) {
    const reason = chat.description || "canal não encontrado";
    return {
      success: false,
      message: `Não foi possível acessar o canal (${reason}). Verifique o @ digitado e adicione @RendaExtraCuponsBot como administrador do canal.`,
    };
  }

  const resolvedChatId = String(chat.result.id);
  const title =
    chat.result.title || (chat.result.username ? `@${chat.result.username}` : chatIdParam);

  // 2. Mensagem de teste (prova de postagem)
  const test = await telegramCall(token, "sendMessage", {
    chat_id: resolvedChatId,
    text: "✅ Canal conectado com sucesso! As ofertas serão publicadas aqui automaticamente.",
  });
  if (!test.ok) {
    return {
      success: false,
      message:
        "Consegui encontrar o canal, mas não consegui postar a mensagem de teste. Confirme que @RendaExtraCuponsBot é administrador do canal (com permissão de postar).",
    };
  }

  // 3. Persistir (upsert 1 canal por plataforma)
  const channel = await prisma.tenantChannel.upsert({
    where: {
      tenantId_platform: { tenantId, platform },
    },
    create: {
      tenantId,
      platform,
      channelId: resolvedChatId,
      label: title,
      isActive: true,
      validatedAt: new Date(),
    },
    update: {
      channelId: resolvedChatId,
      label: title,
      isActive: true,
      validatedAt: new Date(),
    },
  });

  revalidatePath("/conta");
  revalidatePath("/onboarding");

  return {
    success: true,
    message: `Canal "${title}" conectado com sucesso!`,
    channel: {
      channelId: channel.channelId,
      label: channel.label,
      validatedAt: channel.validatedAt,
      platform,
    },
  };
}

/**
 * Desconecta o canal de uma plataforma do tenant.
 * Inativa em vez de deletar, preservando o histórico/auditoria.
 */
export async function disconnectChannelAction(
  platform: ChannelPlatformInput
): Promise<ConnectChannelResult> {
  const tenantId = await requireTenantId();

  await prisma.tenantChannel.updateMany({
    where: { tenantId, platform },
    data: { isActive: false, validatedAt: null },
  });

  revalidatePath("/conta");
  revalidatePath("/onboarding");

  return { success: true, message: "Canal desconectado." };
}

/**
 * Lista os canais configurados do tenant atual.
 */
export async function getChannelsAction(): Promise<ChannelInfo[]> {
  const tenantId = await requireTenantId();

  const channels = await prisma.tenantChannel.findMany({
    where: { tenantId, isActive: true },
    orderBy: { platform: "asc" },
  });

  return channels.map((c) => ({
    channelId: c.channelId,
    label: c.label,
    validatedAt: c.validatedAt,
    platform: c.platform as ChannelPlatformInput,
  }));
}