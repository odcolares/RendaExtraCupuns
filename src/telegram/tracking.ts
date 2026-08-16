import { getWebUrl } from "../config";

export function buildTrackingUrl(offerId: string): string {
  return `${getWebUrl()}/r/${offerId}`;
}