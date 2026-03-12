/**
 * Rate limiter simples em memória (funciona no Edge/Node).
 * Em produção com múltiplas instâncias, usar Redis/Upstash.
 * Para Vercel serverless, cada cold start reseta o mapa — 
 * mas ainda protege contra bursts dentro da mesma instância.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

/**
 * Verifica se um IP/chave excedeu o limite.
 * @param key - Identificador (geralmente IP)
 * @param limit - Máximo de requests
 * @param windowMs - Janela de tempo em ms (padrão: 60s)
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

/**
 * Extrai IP do request para usar como chave de rate limit
 */
export function getClientIp(request: Request): string {
  const forwarded = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const real = request.headers.get('x-real-ip') || '';
  return forwarded || real || 'unknown';
}
