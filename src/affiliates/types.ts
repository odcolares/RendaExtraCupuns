/**
 * Tipos e interfaces do módulo de Afiliados.
 *
 * Define a estrutura de dados para links de afiliado,
 * configurações por plataforma e tipos compartilhados.
 */

// ==============================================================
// Tipos de plataforma
// ==============================================================

export type Platform =
  | "amazon"
  | "aliexpress"
  | "shopee"
  | "mercadolivre"
  | "magalu";

// ==============================================================
// Interfaces
// ==============================================================

/**
 * Resultado da geração de um link de afiliado.
 */
export interface AffiliateLink {
  original: string;
  affiliate: string;
  platform: Platform;
  [key: string]: unknown;
}

/**
 * Configuração por plataforma de afiliado.
 */
export interface AffiliateConfig {
  amazon: {
    enabled: boolean;
    tag: string;
    marketplace: string;
  };
  aliexpress: {
    enabled: boolean;
    affiliateId: string;
  };
  shopee: {
    enabled: boolean;
    affiliateId: string;
  };
  mercadolivre: {
    enabled: boolean;
    affiliateId: string;
  };
}

// ==============================================================
// Barrel
// ==============================================================

export default AffiliateLink;
