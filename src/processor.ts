/**
 * Processador de ofertas — pipeline de integração.
 *
 * Orquestra o fluxo completo:
 *   Mensagem WhatsApp → Extrair dados → Detectar plataforma
 *   → Gerar link de afiliado → Publicar no Telegram → Salvar no DB
 *
 * Cada etapa tem tratamento de erro individual — se uma falha,
 * as etapas seguintes ainda são executadas quando possível.
 */

import { extractOfferData } from "./whatsapp/extractor";
import { detectPlatform } from "./affiliates";
import { generateAffiliateLink } from "./affiliates";
import { searchMercadoLivreProduct } from "./affiliates/mercadolivre-search";
import { publishOffer, publishFlashSale, publishCoupon } from "./telegram/publisher";
import { extractCouponData } from "./coupons/detector";
import type { CouponData } from "./coupons/types";
import {
  insertOffer,
  isDuplicate,
  markAsPublished,
  updateAffiliateLink,
} from "./database/offers";
import { createModuleLogger } from "./utils";
import type { OfferData } from "./types";
import type { WhatsAppOfferData, ProcessResult } from "./whatsapp/types";
import type { Platform } from "./affiliates/types";

const log = createModuleLogger("Processor");

// ==============================================================
// Pipeline principal
// ==============================================================

/**
 * Processa uma oferta do início ao fim.
 *
 * Pipeline:
 *   1. Verifica duplicata (URL já processada?)
 *   2. Extrai dados da oferta da mensagem
 *   3. Detecta a plataforma (Amazon, AliExpress, etc.)
 *   4. Gera link de afiliado
 *   5. Publica no canal do Telegram
 *   6. Salva no banco SQLite
 *
 * @param messageText - Texto original da mensagem do WhatsApp
 * @param url - URL do produto extraída
 * @param imageUrl - URL da imagem do produto (opcional, para envio no Telegram)
 * @returns ProcessResult com status e dados
 */
export async function processOffer(
  messageText: string,
  url: string,
  imageUrl?: string
): Promise<ProcessResult> {
  log.info("Iniciando pipeline", { url: url.substring(0, 60) });

  // ── 1. Verificar duplicata ──
  if (isDuplicate(url)) {
    log.warn("Oferta duplicada ignorada", { url: url.substring(0, 60) });
    return { success: false, error: "duplicate" };
  }

  // ── 2. Extrair dados da oferta ──
  const offerData: WhatsAppOfferData = extractOfferData(messageText, url);
  // Se uma URL de imagem foi fornecida (ex: do ProductFetcher), anexa aos dados
  if (imageUrl) {
    offerData.imageUrl = imageUrl;
  }
  log.info("Dados extraídos", {
    produto: offerData.name,
    plataforma: offerData.platform,
    preco: offerData.currentPrice,
    temImagem: !!offerData.imageUrl,
  });

  // ── 3. Detectar plataforma ──
  const platform = detectPlatform(url);
  if (!platform) {
    log.warn("Plataforma não reconhecida, salvando mesmo assim", { url });
  }
  log.info("Plataforma detectada", { platform: platform || offerData.platform });

  // ── 4. Gerar link de afiliado ──
  let affiliateLink: string | null = null;
  const effectivePlatform = (platform || offerData.platform) as Platform | null;

  if (effectivePlatform) {
    try {
      const linkResult = await generateAffiliateLink(url, effectivePlatform);
      if (linkResult) {
        affiliateLink = linkResult.affiliate;
        log.info("Link de afiliado gerado", { link: affiliateLink });
      } else {
        log.warn("Falha ao gerar link de afiliado via URL direta", {
          platform: effectivePlatform,
        });
      }
    } catch (err) {
      log.error("Erro na geração de link de afiliado", {
        error: (err as Error).message,
      });
    }
  }

  // ── 4b. Fallback: buscar no ML pelo nome do produto ──
  if (!affiliateLink && effectivePlatform === "mercadolivre" && offerData.name) {
    log.info("Tentando buscar produto no ML pelo nome", {
      produto: offerData.name.substring(0, 60),
    });

    try {
      const searchResult = await searchMercadoLivreProduct(offerData.name);

      if (searchResult) {
        log.info("Produto encontrado no ML via busca", {
          id: searchResult.id,
          title: searchResult.title.substring(0, 60),
          mlPrice: searchResult.price,
        });

        // ── Validação de consistência ────────────────────────────
        // Se o preço do ML for muito diferente do preço extraído da
        // mensagem, provavelmente é OUTRO produto — não publicar.
        const shouldSkip = isMismatchedProduct(
          offerData.currentPrice,
          searchResult.price,
          offerData.name,
          searchResult.title
        );

        if (shouldSkip) {
          log.warn("Produto do ML não corresponde à oferta — ignorando", {
            originalProduct: offerData.name.substring(0, 40),
            mlProduct: searchResult.title.substring(0, 40),
            originalPrice: offerData.currentPrice,
            mlPrice: searchResult.price,
          });
        } else {
          // Atualiza dados com info do produto REAL do ML
          // para garantir consistência: título ↔ imagem ↔ link
          offerData.name = searchResult.title;
          if (searchResult.price) {
            offerData.currentPrice = searchResult.price;
          }
          if (!offerData.imageUrl && searchResult.imageUrl) {
            offerData.imageUrl = searchResult.imageUrl;
          }

          // Usa o permalink direto da busca + parâmetro de afiliado
          // em vez de extrair/reconstruir o ID (que poderia corromper o formato)
          const mlAffiliateId = process.env.MERCADOLIVRE_AFFILIATE_ID;
          if (mlAffiliateId && searchResult.permalink) {
            const separator = searchResult.permalink.includes("?") ? "&" : "?";
            affiliateLink = `${searchResult.permalink}${separator}matt_tool=${mlAffiliateId}`;
            log.info("Link de afiliado gerado via busca no ML", {
              link: affiliateLink,
            });
          }
        }
      } else {
        log.warn("Nenhum produto encontrado no ML para a oferta");
      }
    } catch (err) {
      log.error("Erro na busca de produto no ML", {
        error: (err as Error).message,
      });
    }
  }

  // ── 4c. Fallback: verificar se é cupom ──
  // Se nenhum link de afiliado foi gerado, pode ser uma mensagem
  // de cupom promocional (ex: "🎟️10% OFF, Limite R$40: FUTNAVEIA")
  // Processa e publica como cupom em vez de produto.
  let couponData: CouponData | null = null;
  if (!affiliateLink) {
    try {
      couponData = extractCouponData(messageText, url);
      if (couponData) {
        log.info("Cupom detectado na mensagem", {
          code: couponData.code,
          discount: couponData.discount,
          platform: couponData.platform,
        });
      }
    } catch (err) {
      log.error("Erro ao detectar cupom", {
        error: (err as Error).message,
      });
    }
  }

  // ── 5. Publicar no Telegram ──
  let published = false;
  if (affiliateLink) {
    try {
      published = await publishOffer(offerData, affiliateLink);
      if (published) {
        log.info("Oferta publicada no Telegram");
      } else {
        log.warn("Falha ao publicar no Telegram (bot pode não estar configurado)");
      }
    } catch (err) {
      log.error("Erro ao publicar no Telegram", {
        error: (err as Error).message,
      });
    }
  } else if (couponData) {
    // Tentar publicar como cupom
    try {
      published = await publishCoupon(couponData);
      if (published) {
        log.info("Cupom publicado no Telegram", {
          code: couponData.code,
          discount: couponData.discount,
        });
      } else {
        log.warn("Falha ao publicar cupom no Telegram");
      }
    } catch (err) {
      log.error("Erro ao publicar cupom", {
        error: (err as Error).message,
      });
    }
  } else {
    log.warn("Pular publicação: sem link de afiliado nem cupom detectado");
  }

  // ── 6. Salvar no banco ──
  if (couponData) {
    // Salvar cupom no banco com dados específicos
    const couponOffer: OfferData = {
      name: `CUPOM ${couponData.discount} — ${couponData.code}`,
      originalPrice: null,
      currentPrice: null,
      discount: couponData.discountValue,
      platform: `cupom:${couponData.platformKey}`,
      originalUrl: couponData.sourceUrl,
      description: `Cupom ${couponData.discount} | Código: ${couponData.code}${
        couponData.limit !== null ? ` | Limite: R$ ${couponData.limit}` : ""
      }`,
    };

    const dbId = insertOffer(couponOffer, undefined);
    if (dbId && published) {
      markAsPublished(dbId);
    }

    log.info("Pipeline de cupom concluído", {
      code: couponData.code,
      publicado: published,
      dbId,
    });

    return {
      success: true,
      offer: { ...couponOffer, rawMessage: messageText },
    };
  }

  // Oferta normal (produto)
  const offerForDb: OfferData = {
    name: offerData.name,
    originalPrice: offerData.originalPrice,
    currentPrice: offerData.currentPrice,
    discount: offerData.discount,
    platform: offerData.platform,
    originalUrl: url,
    imageUrl: offerData.imageUrl,
  };

  const dbId = insertOffer(offerForDb, affiliateLink || undefined);

  if (dbId && published) {
    markAsPublished(dbId);
  }

  if (dbId && affiliateLink) {
    updateAffiliateLink(dbId, affiliateLink);
  }

  log.info("Pipeline concluído", {
    produto: offerData.name,
    publicado: published,
    dbId,
  });

  return {
    success: true,
    offer: offerData,
  };
}

/**
 * Processa uma oferta relâmpago (com tempo limite).
 */
export async function processFlashSale(
  messageText: string,
  url: string,
  endTime: Date
): Promise<ProcessResult> {
  const result = await processOffer(messageText, url);

  if (result.success && result.offer) {
    const platform = detectPlatform(url);
    if (platform) {
      const linkResult = await generateAffiliateLink(url, platform);
      if (linkResult) {
        await publishFlashSale(result.offer, linkResult.affiliate, endTime);
      }
    }
  }

  return result;
}

// ==============================================================
// Utilitários de validação
// ==============================================================

/**
 * Verifica se o produto encontrado no ML corresponde à oferta original.
 *
 * Critérios:
 * 1. Preço: se a diferença for >5x, provavelmente é outro produto
 *    Ex: oferta R$47 → ML encontrou R$649 (13x) → mismatch
 * 2. (Futuro) Matching de palavras-chave pode ser adicionado aqui
 *
 * @param originalPrice - Preço extraído da mensagem WhatsApp
 * @param mlPrice - Preço do produto encontrado no ML
 * @param originalName - Nome extraído da mensagem WhatsApp
 * @param mlName - Título do produto no ML
 * @returns true se os produtos não parecem corresponder
 */
function isMismatchedProduct(
  originalPrice: number | null,
  mlPrice: number | null,
  originalName: string,
  mlName: string
): boolean {
  // Se ambos têm preço, verifica a proporção
  if (originalPrice && mlPrice && originalPrice > 0 && mlPrice > 0) {
    const ratio = Math.max(originalPrice, mlPrice) / Math.min(originalPrice, mlPrice);
    // Diferença > 5x → produto provavelmente diferente
    if (ratio > 5) {
      return true;
    }
  }

  return false;
}
