/**
 * Rate limit por janela deslizante, 100% em memória (sem dependência externa).
 *
 * LIMITAÇÃO (multi-instância): na Vercel serverless cada instância tem seu
 * próprio Map — o limite é por-instância, aceitável para o beta. Upgrade para
 * Upstash/Redis fica como TODO futuro (fora do escopo).
 */

interface WindowEntry {
  count: number;
  windowStart: number;
}

const windows = new Map<string, WindowEntry>();

const MAX_ENTRIES = 10_000;

function sweepExpired(now: number): void {
  for (const [key, entry] of windows) {
    if (now - entry.windowStart >= MAX_WINDOW_MS) {
      windows.delete(key);
    }
  }
}

const MAX_WINDOW_MS = 60_000;

/**
 * @param key     identificador do cliente (ex: IP)
 * @param limit   máximo de chamadas permitidas por janela
 * @param windowMs tamanho da janela em ms
 * @returns { allowed, retryAfterSeconds } — retryAfterSeconds > 0 quando bloqueado
 */
export function slidingWindowRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (windows.size > MAX_ENTRIES) {
    sweepExpired(now);
  }

  const entry = windows.get(key);

  // Sem entrada ou janela expirada → reinicia a janela (expiração lazy)
  if (!entry || now - entry.windowStart >= windowMs) {
    windows.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.windowStart + windowMs - now) / 1000)
    );
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Limpa todas as janelas (usado em testes e em reconfiguração). */
export function clearRateLimitWindows(): void {
  windows.clear();
}