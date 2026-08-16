export function getOrCreateSessionKey(cookieValue?: string): string {
  return cookieValue || crypto.randomUUID();
}