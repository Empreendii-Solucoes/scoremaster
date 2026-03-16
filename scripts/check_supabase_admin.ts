
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdmin() {
  console.log('Checking Supabase for admin user...');
  const { data, error } = await supabase
    .from('users')
    .select('username, data')
    .eq('username', 'admin')
    .single();

  if (error) {
    console.error('Error fetching admin user:', error.message);
    if (error.code === 'PGRST116') {
      console.log('User "admin" not found in database.');
    } else if (error.message.includes('permission denied') || error.code === '42501') {
      console.log('Permission denied. RLS might be active and blocking the "anon" key.');
    }
  } else {
    console.log('Admin user found:', JSON.stringify(data, null, 2));
  }
}

checkAdmin();
