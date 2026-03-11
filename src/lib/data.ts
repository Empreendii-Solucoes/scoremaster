import { supabase } from './supabase';
import { User, Content, ServicesData, BadgesData } from './types';

// USERS
export async function loadUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('data');
  if (error || !data) return [];
  return data.map(row => row.data as User);
}

export async function saveUsers(users: User[]): Promise<void> {
  // Overwriting entire set is expensive, but matches previous sync logic.
  // Ideally, atomic updates are preferred. Since this is an emulation of the old system:
  await Promise.all(users.map(u => 
    supabase.from('users').upsert({ username: u.username, data: u }, { onConflict: 'username' })
  ));
}

export async function findUser(username: string): Promise<User | undefined> {
  const { data, error } = await supabase.from('users').select('data').eq('username', username).single();
  if (error || !data) return undefined;
  return data.data as User;
}

export async function updateUser(username: string, updates: Partial<User>): Promise<User | null> {
  const user = await findUser(username);
  if (!user) return null;
  const updatedUser = { ...user, ...updates };
  await supabase.from('users').upsert({ username, data: updatedUser }, { onConflict: 'username' });
  return updatedUser;
}

// APP STATE
async function loadState<T>(key: string, defaultVal: T): Promise<T> {
  const { data, error } = await supabase.from('app_state').select('data').eq('key', key).single();
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
  return loadState<ServicesData>('services', { raio_x: { price: 0, payment_link: '' }, credit_cards: [] });
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
