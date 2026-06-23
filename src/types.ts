/**
 * Tipos compartilhados entre todos os módulos.
 */

export interface OfferData {
  id?: string;
  name: string;
  originalPrice: number | null;
  currentPrice: number | null;
  discount?: number | null;
  platform: string;
  category?: string;
  rating?: number;
  freeShipping?: boolean;
  originalUrl?: string;
  imageUrl?: string;
  description?: string;
  affiliateLink?: string;
  timestamp?: Date;
}

export interface PublishResult {
  success: boolean;
  channelId?: string;
  error?: string;
}
