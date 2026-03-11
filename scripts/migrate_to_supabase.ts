/**
 * Este script lê os arquivos JSON atuais na pasta local `data/` 
 * e envia (migra) tudo para o banco de dados do Supabase configurado no seu .env.local
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv'; // Load env variables from .env.local

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const DATA_DIR = path.join(process.cwd(), 'data');

async function migrate() {
  console.log('Iniciando migração para o Supabase...');

  // 1. Migrar Usuários
  try {
    const usersRaw = fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf-8');
    const users = JSON.parse(usersRaw);
    console.log(`Migrando ${users.length} usuários...`);
    
    for (const u of users) {
      const { error } = await supabase.from('users').upsert({
        username: u.username,
        data: u
      }, { onConflict: 'username' });
      if (error) console.error(`Erro ao salvar usuário ${u.username}:`, error.message);
    }
    console.log('✅ Usuários migrados com sucesso!');
  } catch (e: any) {
    if (e.code === 'ENOENT') console.log('⚠️ Arquivo users.json não encontrado. Ignorando.');
    else console.error('Erro ao ler users.json:', e);
  }

  // 2. Migrar Estado do App (Content, Services, Badges)
  const appStateFiles = ['content.json', 'services.json', 'badges.json'];

  for (const file of appStateFiles) {
    try {
      const key = file.replace('.json', '');
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
      const data = JSON.parse(raw);
      
      console.log(`Migrando app_state: ${key}...`);
      const { error } = await supabase.from('app_state').upsert({
        key,
        data
      }, { onConflict: 'key' });
      
      if (error) console.error(`Erro ao salvar ${key}:`, error.message);
      else console.log(`✅ ${key} migrado com sucesso!`);
    } catch (e: any) {
      if (e.code === 'ENOENT') console.log(`⚠️ Arquivo ${file} não encontrado. Ignorando.`);
      else console.error(`Erro ao ler ${file}:`, e);
    }
  }

  console.log('🚀 Migração concluída com sucesso!');
}

migrate();
