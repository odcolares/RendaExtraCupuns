/**
 * CRUD de ofertas no banco SQLite.
 *
 * Operações síncronas sobre a tabela 'offers'.
 */

import { getDb, saveToDisk } from "./index";
import { createModuleLogger } from "../utils";
import type { OfferData } from "../types";

const log = createModuleLogger("DatabaseOffers");

// ==============================================================
// Types
// ==============================================================

export interface OfferRow {
  id: number;
  name: string;
  original_price: number | null;
  current_price: number | null;
  discount: number | null;
  platform: string;
  original_url: string;
  affiliate_link: string | null;
  offer_data: string | null;
  detected_at: string;
  published: boolean;
  published_at: string | null;
}

// ==============================================================
// Insert
// ==============================================================

/**
 * Insere uma nova oferta no banco.
 * Retorna o ID gerado, ou null se já existir (url duplicada).
 */
export function insertOffer(
  offer: OfferData,
  affiliateLink?: string
): number | null {
  const db = getDb();

  // Verificar duplicata primeiro
  if (isDuplicate(offer.originalUrl || "")) {
    log.debug("Oferta duplicada ignorada", { url: offer.originalUrl });
    return null;
  }

  const stmt = db.prepare(`
    INSERT INTO offers (name, original_price, current_price, discount, platform,
                        original_url, affiliate_link, offer_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    offer.name,
    offer.originalPrice ?? null,
    offer.currentPrice ?? null,
    offer.discount ?? null,
    offer.platform,
    offer.originalUrl || "",
    affiliateLink || null,
    JSON.stringify(offer),
  ]);
  stmt.free();

  const result = db.exec("SELECT last_insert_rowid() as id");
  const id: number = result[0].values[0][0] as number;

  saveToDisk();
  log.info("Oferta inserida", { id, produto: offer.name });
  return id;
}

// ==============================================================
// Select
// ==============================================================

/**
 * Busca uma oferta pelo ID.
 */
export function getOfferById(id: number): OfferRow | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM offers WHERE id = ?");
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as OfferRow;
    stmt.free();
    return row;
  }

  stmt.free();
  return null;
}

/**
 * Retorna as N ofertas mais recentes.
 */
export function getRecentOffers(limit: number = 10): OfferRow[] {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT * FROM offers ORDER BY detected_at DESC LIMIT ?"
  );
  stmt.bind([limit]);

  const rows: OfferRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as OfferRow);
  }
  stmt.free();

  return rows;
}

/**
 * Busca ofertas por plataforma.
 */
export function getOffersByPlatform(
  platform: string,
  limit: number = 20
): OfferRow[] {
  const db = getDb();
  const stmt = db.prepare(
    "SELECT * FROM offers WHERE platform = ? ORDER BY detected_at DESC LIMIT ?"
  );
  stmt.bind([platform, limit]);

  const rows: OfferRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as OfferRow);
  }
  stmt.free();

  return rows;
}

// ==============================================================
// Update
// ==============================================================

/**
 * Marca uma oferta como publicada no Telegram.
 */
export function markAsPublished(offerId: number): void {
  const db = getDb();
  db.run(
    "UPDATE offers SET published = 1, published_at = datetime('now') WHERE id = ?",
    [offerId]
  );
  saveToDisk();
  log.info("Oferta marcada como publicada", { id: offerId });
}

/**
 * Atualiza o link de afiliado de uma oferta.
 */
export function updateAffiliateLink(offerId: number, link: string): void {
  const db = getDb();
  db.run("UPDATE offers SET affiliate_link = ? WHERE id = ?", [link, offerId]);
  saveToDisk();
  log.debug("Link de afiliado atualizado", { id: offerId });
}

// ==============================================================
// Duplicate detection
// ==============================================================

/**
 * Verifica se uma URL já foi processada HOJE (dedup diário).
 *
 * Após a virada do dia (00:00), a mesma URL pode ser processada
 * novamente — útil para ofertas e cupons que reaparecem no dia
 * seguinte com o mesmo link.
 *
 * @param url - URL do produto ou cupom
 * @returns true se a URL já foi registrada no dia corrente
 */
export function isDuplicate(url: string): boolean {
  if (!url) return false;

  const db = getDb();
  const stmt = db.prepare(
    "SELECT COUNT(*) as count FROM offers WHERE original_url = ? AND date(detected_at) = date('now')"
  );
  stmt.bind([url]);

  if (stmt.step()) {
    const row = stmt.getAsObject() as { count: number };
    stmt.free();
    return row.count > 0;
  }

  stmt.free();
  return false;
}

// ==============================================================
// Stats
// ==============================================================

/**
 * Retorna estatísticas básicas do banco.
 */
export function getStats(): {
  total: number;
  published: number;
  pending: number;
  byPlatform: Record<string, number>;
} {
  const db = getDb();

  const totalResult = db.exec("SELECT COUNT(*) as c FROM offers");
  const total = (totalResult[0]?.values[0][0] as number) || 0;

  const publishedResult = db.exec(
    "SELECT COUNT(*) as c FROM offers WHERE published = 1"
  );
  const published = (publishedResult[0]?.values[0][0] as number) || 0;

  const platformResult = db.exec(
    "SELECT platform, COUNT(*) as c FROM offers GROUP BY platform ORDER BY c DESC"
  );
  const byPlatform: Record<string, number> = {};
  for (const row of platformResult[0]?.values || []) {
    byPlatform[row[0] as string] = row[1] as number;
  }

  return {
    total,
    published,
    pending: total - published,
    byPlatform,
  };
}

// ==============================================================
// Barrel (re-exporta funções de index.ts)
// ==============================================================

export { initDatabase, getDb, closeDatabase, saveToDisk } from "./index";
