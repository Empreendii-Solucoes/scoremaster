import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Cliente público (anon key) — usado no client-side e como fallback no server.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente com Service Role Key — para operações no server que precisam
 * bypass de Row Level Security (RLS).
 * Cai para anon key se SUPABASE_SERVICE_ROLE_KEY não estiver configurado.
 */
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!serviceRoleKey && typeof window === 'undefined') {
  console.warn(
    '⚠️  SUPABASE_SERVICE_ROLE_KEY não configurada! Usando anon key como fallback.',
    'Se RLS estiver habilitado, queries server-side vão falhar.',
    'Configure em .env.local ou nas env vars do Vercel.'
  );
}

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase; // fallback para anon se não tiver service role key
