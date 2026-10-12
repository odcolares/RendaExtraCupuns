/**
 * Tipos específicos do módulo WhatsApp.
 */

import type { OfferData } from "../types";

/** Oferta extraída de uma mensagem do WhatsApp */
export interface WhatsAppOfferData extends OfferData {
  rawMessage: string;
}

/** Resultado do processamento de uma oferta */
export interface ProcessResult {
  success: boolean;
  offer?: OfferData;
  /** ID da oferta no banco (usado para montar o link de rastreio /r/<id>) */
  dbId?: string;
  error?: string;
}

/** Mensagem do WhatsApp (simplificada — apenas campos usados pelo pipeline) */
export interface WhatsAppMessage {
  body: string;
  from: string;
}
