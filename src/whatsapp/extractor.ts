/**
 * Extrator de dados de oferta a partir de mensagens do WhatsApp.
 *
 * Extrai: nome do produto, preços (original/atual), desconto, plataforma.
 * Converte formato brasileiro (R$ 1.299,99) para número (1299.99).
 */

import { detectPlatform } from "./parser";
import type { WhatsAppOfferData } from "./types";

// ==============================================================
// Função principal
// ==============================================================

/**
 * Extrai todos os dados de oferta de uma mensagem + URL.
 */
export function extractOfferData(
  messageText: string,
  url: string
): WhatsAppOfferData {
  return {
    name: extractProductName(messageText),
    originalPrice: extractOriginalPrice(messageText),
    currentPrice: extractCurrentPrice(messageText),
    discount: extractDiscount(messageText),
    platform: detectPlatform(url) || "desconhecida",
    originalUrl: url,
    rawMessage: messageText,
  };
}

// ==============================================================
// Extração individual
// ==============================================================

/**
 * Extrai o nome do produto da mensagem.
 *
 * Melhorias:
 * - Pula chamadas promocionais em CAIXA ALTA (grupo Kotas)
 *   Ex: "A BRABA DOS SANDUÍCHES" → pula, usa "Sanduicheira Elétrica Cadence..."
 * - Detecta linhas "quase all-caps" como "HEADSET COM ÓTIMO CxB" (94% uppercase)
 * - Pula avisos de cupom esgotado / convite
 */
export function extractProductName(text: string): string {
  const lines = text.split("\n");
  const candidates: string[] = [];

  for (const line of lines) {
    const cleanLine = line.trim();

    // Pular linhas muito curtas ou URLs
    if (cleanLine.length < 5 || cleanLine.startsWith("http")) {
      continue;
    }

    // Pular linhas que são apenas preços (R$ X, R$X, apenas números)
    if (/^R?\$?\s*\d/.test(cleanLine)) {
      continue;
    }

    // Pular avisos de cupom esgotado / convite
    if (/cupom.*(esgotado|encerrado)|convide.*amigo|correria/i.test(cleanLine)) {
      continue;
    }

    candidates.push(cleanLine);
  }

  // Selecionar a melhor linha entre as candidatas
  return pickProductLine(candidates).substring(0, 100);
}

/**
 * Seleciona a linha mais provável de conter o nome real do produto.
 * Pula chamadas promocionais em CAIXA ALTA (típicas do grupo Kotas).
 */
function pickProductLine(lines: string[]): string {
  if (lines.length === 0) return "Produto sem nome";
  if (lines.length === 1) return lines[0];

  // Se a primeira linha for predominantemente maiúscula (>90%),
  // é provavelmente chamada promocional → usar a segunda linha
  const first = lines[0];
  const firstClean = first.replace(/[🔥⚡💥🎯⭐✅❌⚠️]/g, "").trim();

  if (isMostlyUppercase(firstClean)) {
    return lines[1];
  }

  return lines[0];
}

/**
 * Retorna true se a maioria esmagadora (>90%) das letras é maiúscula.
 *
 * Ex: "HEADSET COM ÓTIMO CxB" → true  (94% uppercase, só 'x' é lowercase)
 * Ex: "A BRABA DOS SANDUÍCHES" → true  (100% uppercase)
 * Ex: "Fone de Ouvido Gamer Headset Havit H2015d" → false
 */
function isMostlyUppercase(text: string): boolean {
  const letters = text.match(/[a-zA-ZÀ-ÿ]/g);
  if (!letters || letters.length < 4) return false;

  const upperCount = (text.match(/[A-ZÀ-Ú]/g) || []).length;
  return upperCount / letters.length > 0.9;
}

/**
 * Extrai o preço original (De R$ X.XXX).
 */
export function extractOriginalPrice(text: string): number | null {
  const patterns = [
    /(?:de|antes|was)[:\s]*R\$\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)\s*(?:->|→|por|for)/i,
    /~~R\$\s*([\d.,]+)~~/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parsePrice(match[1]);
    }
  }

  return null;
}

/**
 * Extrai o preço atual (por R$ X.XXX).
 */
export function extractCurrentPrice(text: string): number | null {
  const patterns = [
    /(?:por|now|actual)[:\s]*R\$\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)\s*(?:\(|$)/i,
    /por\s*R\$\s*([\d.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parsePrice(match[1]);
    }
  }

  return null;
}

/**
 * Extrai o percentual de desconto (% OFF, -X%).
 */
export function extractDiscount(text: string): number | null {
  const patterns = [
    /(\d+)%\s*(?:off|desconto)/i,
    /-(\d+)%/i,
    /(\d+)%\s*de\s*desconto/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

// ==============================================================
// Utilitários de parsing
// ==============================================================

/**
 * Converte preço no formato brasileiro "1.299,99" para número 1299.99.
 */
export function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/\./g, "").replace(",", "."));
}
