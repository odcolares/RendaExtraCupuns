/**
 * Fontes do WhatsApp: nomes amigáveis e lista de fontes a partir do config.
 *
 * Módulo puro — não lê env nem carrega config; recebe o objeto de config
 * como parâmetro. Sem efeitos colaterais no import.
 *
 * - buildSourceNames(): mapa id → nome amigável
 * - getSourcesFromConfig(): lista { id, name } normalizada
 */

// ==============================================================
// Tipos
// ==============================================================

export interface WhatsAppSourcesConfig {
  groupIds: string[];
  newsletterId: string | null;
}

export interface SourceEntry {
  id: string;
  name: string;
}

// ==============================================================
// Nomes amigáveis
// ==============================================================

/**
 * Constrói o mapa id → nome amigável para cada fonte configurada.
 * Regras idênticas ao monitor.ts: broadcast vira "Kotas #51 (Broadcast)",
 * grupos viram "Grupo <8 primeiros chars>...", newsletter vira
 * "Newsletter Ofertas".
 */
export function buildSourceNames(
  whatsapp: WhatsAppSourcesConfig
): Record<string, string> {
  const names: Record<string, string> = {};

  for (const id of whatsapp.groupIds) {
    names[id] = id.endsWith("@broadcast")
      ? "Kotas #51 (Broadcast)"
      : `Grupo ${id.substring(0, 8)}...`;
  }

  if (whatsapp.newsletterId) {
    names[whatsapp.newsletterId] = "Newsletter Ofertas";
  }

  return names;
}

// ==============================================================
// Fontes a partir do config
// ==============================================================

/**
 * Retorna uma entrada { id, name } por fonte configurada, normalizando
 * a entrada: ids com espaços são trimados e vazios descartados; newsletter
 * vazia vira null (corrige a falta de trim do config/index.ts).
 */
export function getSourcesFromConfig(
  whatsapp: WhatsAppSourcesConfig
): SourceEntry[] {
  const groupIds = (whatsapp.groupIds ?? [])
    .map((id) => id.trim())
    .filter(Boolean);
  const newsletterId = whatsapp.newsletterId
    ? whatsapp.newsletterId.trim()
    : null;

  const names = buildSourceNames({ groupIds, newsletterId });

  return Object.keys(names).map((id) => ({ id, name: names[id] }));
}