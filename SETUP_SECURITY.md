# 🔒 Configuração de Segurança — ScoreMaster

## Ações necessárias no Supabase e Vercel

### 1. Criar bucket de Storage no Supabase

No painel do Supabase → **Storage** → **New Bucket**:
- Nome: `uploads`
- Public: **NÃO** (privado)
- Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`
- Max file size: `20MB`

Depois crie uma **Policy** no bucket:
```sql
-- Permitir upload via service_role (a API do Next.js usa a anon key, mas o storage pode exigir)
-- Se usar anon key, configure policies adequadas:
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated reads" ON storage.objects  
  FOR SELECT USING (bucket_id = 'uploads');
```

### 2. Definir JWT_SECRET no Vercel

No painel Vercel → **Settings** → **Environment Variables**:
- Key: `JWT_SECRET`
- Value: uma string aleatória de 64+ caracteres
- Exemplo: `openssl rand -hex 32` gera uma boa chave

⚠️ **IMPORTANTE**: Após definir, o Vercel fará redeploy automático.

### 3. Migração de senhas

As senhas dos clientes existentes serão migradas automaticamente para bcrypt hash no **primeiro login** de cada usuário. Nenhuma ação manual é necessária.

**O que acontece:**
1. Usuário faz login com senha em texto puro
2. Sistema verifica, autentica, e substitui a senha por hash bcrypt
3. Próximos logins usam bcrypt diretamente

### 4. Migração de arquivos existentes (se houver)

Se havia arquivos no filesystem da Vercel antiga, eles foram perdidos (filesystem efêmero). Os novos uploads agora vão para Supabase Storage e são persistentes.

Se você tiver backups dos arquivos, pode fazer upload manual via Supabase Dashboard → Storage → bucket `uploads`.
