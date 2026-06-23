/**
 * Tipos para o sistema de cupons.
 *
 * Cupons são detectados em mensagens que contêm padrões como
 * "CUPOM", "% OFF", código promocional, e link para página social.
 */

export interface CouponData {
  /** Código promocional (ex: FUTNAVEIA) */
  code: string;
  /** Descrição do desconto (ex: "10% OFF") */
  discount: string;
  /** Valor numérico do desconto (ex: 10) */
  discountValue: number;
  /** Tipo do desconto */
  discountType: "percent" | "fixed";
  /** Limite máximo do desconto em reais, se houver (ex: 40) */
  limit: number | null;
  /** Moeda do limite (ex: "R$") */
  limitCurrency: string;
  /** Nome da plataforma para exibição (ex: "Mercado Livre") */
  platform: string;
  /** Chave interna da plataforma (ex: "mercadolivre") */
  platformKey: string;
  /** URL original onde o cupom pode ser ativado */
  sourceUrl: string;
  /** Mensagem original completa */
  rawMessage: string;
}
