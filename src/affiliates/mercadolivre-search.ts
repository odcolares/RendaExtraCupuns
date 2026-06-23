/**
 * mercadolivre-search.ts — Busca de produtos na API do Mercado Livre.
 *
 * FLUXO ATUAL (jun/2026):
 * A API pública /sites/MLB/search foi bloqueada e exige escopos que
 * um app não-certificado não possui. Por isso o fluxo foi adaptado:
 *
 * 1. GET /products/search?status=active&site_id=MLB&q={query}
 *    → Busca produto no catálogo de produtos, retorna catalog_product_id
 * 2. GET /products/{catalog_product_id}/items
 *    → Retorna listings de sellers ativos com preço e item_id
 * 3. Constrói link: https://www.mercadolivre.com.br/MLB-{item_id}
 *
 * NOTA: Desde abril/2025, a API exige autenticação OAuth.
 * Execute `node scripts/setup-ml-oauth.js` para configurar.
 *
 * Uso:
 *   const result = await searchMercadoLivreProduct("Jaqueta Puffer");
 *   if (result) {
 *     const link = await generateMercadoLivreLink(result.permalink);
 *   }
 */

import axios from "axios";
import { createModuleLogger } from "../utils";
import { getValidToken, isConfigured } from "./mercadolivre-auth";

const log = createModuleLogger("MercadoLivreSearch");

// ==============================================================
// Interfaces
// ==============================================================

export interface MercadoLivreProduct {
  /** ID do produto no ML (ex: MLB3857291047) */
  id: string;
  /** Título do produto */
  title: string;
  /** Preço atual */
  price: number;
  /** URL da miniatura (imagem pequena) */
  thumbnail: string;
  /** URL da imagem em tamanho grande */
  imageUrl: string;
  /** URL completa do produto no Mercado Livre */
  permalink: string;
  /** Plataforma (sempre "mercadolivre") */
  platform: "mercadolivre";
}

/** Resposta da API /products/search (catálogo de produtos) */
interface CatalogSearchResult {
  id: string; // catalog_product_id (ex: MLB39445401)
  name: string;
  domain_id: string;
  pictures?: Array<{ url: string }>;
}

interface CatalogSearchResponse {
  results: CatalogSearchResult[];
  paging: { total: number; offset: number; limit: number };
}

/** Resposta da API /products/{id}/items (listings de sellers) */
interface ProductListing {
  item_id: string; // MLBXXXXXXXX
  price: number;
  currency_id: string;
  seller_id: number;
}

interface ProductListingsResponse {
  results: ProductListing[];
  paging: { total: number; offset: number; limit: number };
}

// ==============================================================
// Busca principal
// ==============================================================

/**
 * Busca um produto no Mercado Livre pelo nome.
 *
 * FLUXO:
 * 1. Busca no catálogo de produtos: /products/search
 * 2. Obtém listings ativos do produto: /products/{id}/items
 * 3. Constrói link de afiliado com o melhor resultado
 *
 * @param query - Nome do produto para buscar
 * @returns MercadoLivreProduct ou null
 */
export async function searchMercadoLivreProduct(
  query: string
): Promise<MercadoLivreProduct | null> {
  try {
    // Verifica se OAuth está configurado
    if (!isConfigured()) {
      log.warn(
        "OAuth do ML não configurado. Execute: node scripts/setup-ml-oauth.js"
      );
      return null;
    }

    // Obtém token de acesso (faz refresh automático se expirado)
    const token = await getValidToken();
    if (!token) {
      log.warn("Token de acesso ML não disponível");
      return null;
    }

    // Limpa a query: remove emojis, caracteres especiais excessivos
    const cleanQuery = cleanSearchQuery(query);

    if (!cleanQuery || cleanQuery.length < 3) {
      log.warn("Query muito curta para buscar", { query, cleanQuery });
      return null;
    }

    log.info("Buscando produto no ML", { query: cleanQuery });

    // ── Passo 1: Busca no catálogo de produtos ──────────────────
    const catalogResponse = await axios.get<CatalogSearchResponse>(
      "https://api.mercadolibre.com/products/search",
      {
        params: {
          status: "active",
          site_id: "MLB",
          q: cleanQuery,
          limit: 3,
        },
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "RendaExtraCupuns/1.0 (bot de ofertas)",
          Accept: "application/json",
        },
      }
    );

    const catalogResults = catalogResponse.data.results;

    if (!catalogResults || catalogResults.length === 0) {
      log.warn("Nenhum produto encontrado no catálogo ML", {
        query: cleanQuery,
      });
      return null;
    }

    const bestCatalog = pickBestCatalogResult(catalogResults, cleanQuery);
    if (!bestCatalog) {
      log.warn("Nenhum produto relevante no catálogo", { query: cleanQuery });
      return null;
    }

    const catalogProductId = bestCatalog.id;
    const productName = bestCatalog.name;

    log.info("Produto encontrado no catálogo", {
      catalogProductId,
      name: productName.substring(0, 60),
    });

    // ── Passo 2: Obtém listings ativos de sellers ──────────────
    let itemId: string | null = null;
    let price: number = 0;
    let thumbnail: string = "";

    try {
      const listingsResponse = await axios.get<ProductListingsResponse>(
        `https://api.mercadolibre.com/products/${catalogProductId}/items`,
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": "RendaExtraCupuns/1.0 (bot de ofertas)",
            Accept: "application/json",
          },
        }
      );

      const listings = listingsResponse.data.results;

      if (listings && listings.length > 0) {
        // Pega o primeiro listing com menor preço
        const bestListing = listings.reduce((best, current) =>
          current.price < best.price ? current : best
        );

        itemId = bestListing.item_id;
        price = bestListing.price;

        log.info("Listing encontrado", {
          itemId,
          price,
          totalSellers: listings.length,
        });
      } else {
        log.warn("Nenhum listing ativo para o produto", { catalogProductId });
        return null;
      }
    } catch (listingsErr) {
      if (axios.isAxiosError(listingsErr) && listingsErr.response?.status === 404) {
        log.warn("Produto sem sellers ativos (No winners found)", {
          catalogProductId,
        });
        return null;
      }
      throw listingsErr; // repassa outros erros
    }

    // ── Passo 3: Constrói resultado ────────────────────────────
    // Aqui temos DOIS tipos de ID do ML:
    //   catalogProductId = "MLB39445401" → ID do catálogo (agrega sellers)
    //   itemId           = "MLB4629491153" → ID do anúncio individual
    //
    // A URL /p/MLB{id} é formato de CATÁLOGO — usa catalogProductId.
    // A URL /MLB-{id} é redirect antigo para ITEM — perde matt_tool no 302.
    // Usamos /p/{catalogProductId} porque é direta (sem redirect) e o
    // parâmetro matt_tool= é preservado para tracking de afiliado.
    const permalink = `https://www.mercadolivre.com.br/p/${catalogProductId}`;

    // Pega primeira imagem do catálogo, se disponível
    if (bestCatalog.pictures && bestCatalog.pictures.length > 0) {
      thumbnail = bestCatalog.pictures[0].url;
    }

    const product: MercadoLivreProduct = {
      id: itemId!,
      title: productName,
      price,
      thumbnail,
      imageUrl: thumbnail,
      permalink,
      platform: "mercadolivre",
    };

    log.info("Produto resolvido com sucesso", {
      id: product.id,
      title: product.title.substring(0, 60),
      price: product.price,
    });

    return product;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401) {
        log.error("Token ML expirado e renovação falhou", {
          hint: "Execute 'node scripts/setup-ml-oauth.js' para re-autorizar",
        });
      } else if (status === 403) {
        log.error("Acesso negado pela API do ML (token sem permissão)", {
          hint: "Verifique se o app tem as permissões corretas no developers.mercadolibre.com.br",
        });
      } else {
        log.error("Erro na API do Mercado Livre", {
          status,
          message: error.message,
        });
      }
    } else {
      log.error("Erro ao buscar no Mercado Livre", {
        error: (error as Error).message,
      });
    }
    return null;
  }
}

// ==============================================================
// Utilitários
// ==============================================================

/**
 * Limpa a query de busca: remove emojis, excesso de espaços,
 * caracteres especiais, deixa apenas o essencial para buscar.
 */
export function cleanSearchQuery(query: string): string {
  return (
    query
      // Remove emojis e símbolos especiais
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE00}-\u{FEFF}\u{200D}]/gu,
        ""
      )
      // Remove linhas de preço, "De R$", "Por R$", "em 3x", etc
      .replace(
        /(?:de\s*R\$\s*[\d.,]+|por\s*R\$\s*[\d.,]+|em\s*\d+x\s*|R\$\s*[\d.,]+|\d+x\s*de\s*R\$\s*[\d.,]+|no\s*pix|à\s*vista)/gi,
        ""
      )
      // Remove palavras comuns de oferta no início
      .replace(
        /^(🔥|⚡|💥|🎯|🚀|❗|⚠️|✅|⭐|🎟|🔗|🛒|💨|👆|👇|👈|👉)\s*/g,
        ""
      )
      // Remove palavras de ação/cupom
      .replace(
        /(?:use\s+o\s+cupom|cupom|código|code|link|anúncio|anuncio|convide\s+um\s+amigo)/gi,
        ""
      )
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, "")
      // Remove linhas que começam com ⭐
      .replace(/⭐️[^\n]*/g, "")
      // Remove caracteres especiais e normaliza espaços
      .replace(/[^\w\sÀ-ÿ-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Escolhe o melhor resultado do catálogo.
 * Prefere produtos com maior correspondência de palavras-chave no nome.
 */
function pickBestCatalogResult(
  results: CatalogSearchResult[],
  query: string
): CatalogSearchResult | null {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];

  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (keywords.length === 0) return results[0];

  const scored = results.map((r) => {
    const name = r.name.toLowerCase();
    const score = keywords.filter((k) => name.includes(k)).length;
    return { result: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (scored[0].score > 0) return scored[0].result;
  return results[0];
}
