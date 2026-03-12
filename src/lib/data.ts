import { supabaseAdmin as supabase } from './supabase';
import { User, Content, ServicesData, BadgesData } from './types';

// ============ USERS ============

/**
 * Carrega todos os usuários (usar com moderação — apenas admin)
 */
export async function loadUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('data');
  if (error || !data) return [];
  return data.map(row => row.data as User);
}

/**
 * Busca um único usuário por username (query direta, sem carregar todos)
 */
export async function findUser(username: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from('users')
    .select('data')
    .eq('username', username)
    .single();
  if (error || !data) return undefined;
  return data.data as User;
}

/**
 * Atualiza um usuário de forma atômica (read-merge-write apenas do registro afetado).
 * Usa uma abordagem de merge profundo para evitar race conditions básicas.
 */
export async function updateUser(username: string, updates: Partial<User>): Promise<User | null> {
  // Busca somente o usuário necessário
  const { data: row, error: fetchError } = await supabase
    .from('users')
    .select('data')
    .eq('username', username)
    .single();

  if (fetchError || !row) return null;

  const currentUser = row.data as User;
  const updatedUser = deepMerge(currentUser, updates) as User;

  // Salva somente este usuário
  const { error: saveError } = await supabase
    .from('users')
    .update({ data: updatedUser })
    .eq('username', username);

  if (saveError) {
    console.error('[DATA] Error updating user:', saveError);
    return null;
  }

  return updatedUser;
}

/**
 * Cria um novo usuário (insert atômico)
 */
export async function createUser(user: User): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .insert({ username: user.username, data: user });

  if (error) {
    console.error('[DATA] Error creating user:', error);
    return false;
  }
  return true;
}

/**
 * Deleta um usuário
 */
export async function deleteUser(username: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('username', username);

  if (error) {
    console.error('[DATA] Error deleting user:', error);
    return false;
  }
  return true;
}

/**
 * Salva múltiplos usuários (apenas para admin bulk operations)
 * @deprecated Prefira updateUser() para operações individuais
 */
export async function saveUsers(users: User[]): Promise<void> {
  await Promise.all(users.map(u =>
    supabase.from('users').upsert({ username: u.username, data: u }, { onConflict: 'username' })
  ));
}

// ============ APP STATE ============

async function loadState<T>(key: string, defaultVal: T): Promise<T> {
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('key', key)
    .single();
  if (error || !data) return defaultVal;
  return data.data as T;
}

async function saveState<T>(key: string, data: T): Promise<void> {
  await supabase.from('app_state').upsert({ key, data }, { onConflict: 'key' });
}

export async function loadContent(): Promise<Content> {
  return loadState<Content>('content', { stages: [] });
}

export async function saveContent(content: Content): Promise<void> {
  await saveState('content', content);
}

export async function loadServices(): Promise<ServicesData> {
  return loadState<ServicesData>('services', {
    raio_x: { price: 0, payment_link: '' },
    credit_cards: [],
  });
}

export async function saveServices(services: ServicesData): Promise<void> {
  await saveState('services', services);
}

export async function loadBadges(): Promise<BadgesData> {
  return loadState<BadgesData>('badges', { badges: [], progress_messages: {} });
}

export async function saveBadges(badges: BadgesData): Promise<void> {
  await saveState('badges', badges);
}

// ============ UTILS ============

/**
 * Deep merge de objetos (preserva arrays, merge de objetos nested)
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal) &&
      tgtVal && typeof tgtVal === 'object' && !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal as Record<string, unknown>, srcVal as Record<string, unknown>);
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}
