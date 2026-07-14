-- ウィザードの進捗セッション（端末をまたいだ「続きから再開」用）
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行する

create table if not exists public.wizard_sessions (
  id uuid primary key default gen_random_uuid(),
  state jsonb not null default '{}'::jsonb,
  chat jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.wizard_sessions enable row level security;

-- ポリシーは作らない = publishable key（クライアント）からは読み書きとも全て拒否。
-- アクセスはサーバーの secret key（RLSをバイパス）経由のみで、
-- 推測不可能な uuid を知っていることが本人確認の代わりになる（MVPの割り切り。
-- 一般ユーザー認証を導入したら user_id 列とポリシーに移行する）
