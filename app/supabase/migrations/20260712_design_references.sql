-- 参考サイト（デザイン参考事例）テーブル
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行する

create table if not exists public.design_references (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text not null,
  industry text not null,
  style_tags text[] not null default '{}',
  summary text not null default '',
  analysis jsonb not null default '{}'::jsonb,
  status text not null default 'published'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 検索用インデックス（業界での絞り込み・タグ検索）
create index if not exists design_references_industry_idx
  on public.design_references (industry);
create index if not exists design_references_style_tags_idx
  on public.design_references using gin (style_tags);

alter table public.design_references enable row level security;

-- 公開ステータスの行だけ誰でも読める。
-- 書き込みポリシーは作らない = publishable key からの書き込みは全て拒否され、
-- サーバー側の secret key（RLSをバイパス）経由のみ書き込める。
drop policy if exists "public_read_published" on public.design_references;
create policy "public_read_published"
  on public.design_references
  for select
  to anon, authenticated
  using (status = 'published');
