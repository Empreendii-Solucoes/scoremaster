import { NextResponse } from 'next/server';

/**
 * Wrapper padronizado para respostas de erro da API
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrapper padronizado para respostas de sucesso
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Handler seguro que captura exceções automaticamente
 */
export function withErrorHandler(
  handler: (request: Request) => Promise<NextResponse>
) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor.';
      console.error(`[API ERROR] ${request.method} ${request.url}:`, message);
      return apiError('Erro interno do servidor.', 500);
    }
  };
}

/**
 * Remove a senha do objeto User antes de enviar ao cliente
 */
export function sanitizeUser<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _pw, ...safe } = user;
  return safe;
}
