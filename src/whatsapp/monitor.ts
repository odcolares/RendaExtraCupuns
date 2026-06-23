/**
 * Monitor de mensagens do WhatsApp — suporta múltiplos grupos + newsletter.
 *
 * startMonitoring(): anexa listener de 'message' no client
 * stopMonitoring(): remove listener
 * processOffer(): função exportada para integração futura
 *
 * O monitor carrega a lista de fontes (grupos + newsletter) do config
 * e filtra mensagens apenas dessas fontes, delegando para processOffer().
 */

import axios from "axios";
import { Message } from "whatsapp-web.js";
import { getClient } from "./client";
import {
  extractLinksFromMessage,
  isValidOfferMessage,
  detectPlatform,
} from "./parser";
import { createModuleLogger } from "../utils";
import { processOffer as pipelineProcessOffer } from "../processor";
import { loadConfig } from "../config";
import type { ProcessResult } from "./types";

const log = createModuleLogger("WhatsAppMonitor");

// Carrega fontes permitidas do config
const config = loadConfig();
const ALLOWED_SOURCES = new Set([
  ...config.whatsapp.groupIds,
  ...(config.whatsapp.newsletterId ? [config.whatsapp.newsletterId] : []),
]);
const SOURCE_NAMES: Record<string, string> = {};

// Mapa de nome amigável para cada fonte
for (const id of config.whatsapp.groupIds) {
  if (id.endsWith("@broadcast")) {
    SOURCE_NAMES[id] = "Kotas #51 (Broadcast)";
  } else {
    SOURCE_NAMES[id] = `Grupo ${id.substring(0, 8)}...`;
  }
}
if (config.whatsapp.newsletterId) {
  SOURCE_NAMES[config.whatsapp.newsletterId] = "Newsletter Ofertas";
}

let isMonitoring = false;

// ==============================================================
// Controle do monitor
// ==============================================================

/**
 * Inicia o monitoramento das fontes configuradas.
 */
export async function startMonitoring(): Promise<void> {
  const client = getClient();

  if (!client) {
    throw new Error("WhatsApp não inicializado. Chame initializeWhatsApp() primeiro.");
  }

  if (isMonitoring) {
    log.warn("Monitor já está ativo");
    return;
  }

  client.on("message", handleMessage);
  isMonitoring = true;

  const fontes = Array.from(ALLOWED_SOURCES).map((id) => SOURCE_NAMES[id] || id);
  log.info("Monitoramento iniciado", { fontes, total: ALLOWED_SOURCES.size });
}

/**
 * Para o monitoramento.
 */
export async function stopMonitoring(): Promise<void> {
  const client = getClient();

  if (client) {
    client.removeListener("message", handleMessage);
  }

  isMonitoring = false;
  log.info("Monitoramento parado");
}

// ==============================================================
// Handler de mensagens
// ==============================================================

async function handleMessage(message: Message): Promise<void> {
  try {
    const sourceId = message.from;

    // ── Filtro 1: Ignorar status/stories ──
    if (sourceId === "status@broadcast") {
      return;
    }

    // ── Filtro 2: Só processar fontes configuradas ──
    if (!ALLOWED_SOURCES.has(sourceId)) {
      return;
    }

    const sourceName = SOURCE_NAMES[sourceId] || sourceId;

    // ── Obter texto completo da mensagem ──
    // Para mensagens de mídia (imagem/vídeo), o caption pode estar em campos diferentes
    let fullText = message.body || "";
    if (!fullText && (message as any).caption) {
      fullText = (message as any).caption;
    }
    // Fallback: tentar raw _data
    if (!fullText) {
      const rawData = (message as any)._data;
      fullText = rawData?.caption || rawData?.body || "";
    }

    // ── Filtro 3: Verificar se é uma mensagem de oferta ──
    if (!fullText || !isValidOfferMessage(fullText)) {
      return;
    }

    log.info("Oferta detectada", {
      fonte: sourceName,
      preview: fullText.substring(0, 80),
    });

    // Extrair links do texto completo
    const links = extractLinksFromMessage(fullText);

    // ── Fallback: se não achou links no body, tentar raw _data ──
    if (links.length === 0) {
      const rawData = (message as any)._data;
      const rawTexts: string[] = [
        rawData?.canonicalUrl,
        rawData?.matchedText,
        rawData?.url,
        rawData?.link,
        rawData?.title,
        rawData?.description,
        typeof rawData?.body === "string" ? rawData.body : "",
      ].filter(Boolean);

      for (const rawText of rawTexts) {
        const rawLinks = extractLinksFromMessage(rawText);
        links.push(...rawLinks);
      }
    }

    if (links.length === 0) {
      // Log detalhado para depuração — mostra o body completo
      const bodyLength = message.body?.length ?? 0;
      const lastPart = bodyLength > 80 ? message.body.substring(bodyLength - 120) : message.body;
      log.warn("Nenhum link de produto encontrado na mensagem", {
        fonte: sourceName,
        tipo: message.type,
        hasMedia: message.hasMedia,
        bodyLength,
        ultimaParte: lastPart,
        bodyCompleto: message.body,
      });
      return;
    }

    // Processar cada link de plataforma suportada
    for (const link of links) {
      let effectiveLink = link;
      let platform = detectPlatform(effectiveLink);

      // ── Se plataforma não reconhecida, tentar resolver URL encurtada ──
      if (!platform) {
        const resolved = await resolveUnknownUrl(effectiveLink);
        if (resolved && resolved !== effectiveLink) {
          effectiveLink = resolved;
          platform = detectPlatform(effectiveLink);
          if (platform) {
            log.info("Link encurtado resolvido para plataforma", {
              original: link.substring(0, 50),
              resolvido: effectiveLink.substring(0, 80),
              platform,
            });
          }
        }
      }

      if (!platform) {
        log.info("Link ignorado (plataforma não suportada)", {
          fonte: sourceName,
          link: link.substring(0, 50),
        });
        continue;
      }

      log.info("Processando link", {
        fonte: sourceName,
        platform,
        link: effectiveLink.substring(0, 50),
      });
      await processOffer(message.body, effectiveLink);
    }
  } catch (error) {
    log.error("Erro ao processar mensagem do WhatsApp", {
      error: (error as Error).message,
      sourceId: message.from,
    });
  }
}

// ==============================================================
// Processador de ofertas (delega para o pipeline real em processor.ts)
// ==============================================================

/**
 * Processa uma oferta: delega para o pipeline completo em processor.ts.
 * O pipeline faz: extração → afiliados → Telegram → Database.
 */
export async function processOffer(
  messageText: string,
  link: string
): Promise<ProcessResult> {
  return pipelineProcessOffer(messageText, link);
}

/**
 * Retorna se o monitor está ativo.
 */
export function isMonitoringActive(): boolean {
  return isMonitoring;
}

/**
 * Tenta resolver URLs encurtadas de domínios desconhecidos
 * seguindo redirects HTTP para encontrar a URL real do produto.
 */
async function resolveUnknownUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      timeout: 10000,
      responseType: "text",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const finalUrl = response.request?.res?.responseUrl
      || response.request?._redirectable?._currentUrl
      || url;

    return finalUrl !== url ? finalUrl : null;
  } catch {
    return null;
  }
}
