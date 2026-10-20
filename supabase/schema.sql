-- 在 Supabase 的 SQL Editor 貼上執行一次即可

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null,
  title text,
  content text not null,
  status text not null default 'new' check (status in ('new', 'processing', 'done', 'archived')),
  attachments jsonb not null default '[]'::jsonb,
  allow_public boolean not null default false,
  is_public boolean not null default false,
  reply text,
  replied_at timestamptz
);

-- 舊版資料表升級用（新建立的可忽略）
alter table public.letters add column if not exists allow_public boolean not null default false;
alter table public.letters add column if not exists is_public boolean not null default false;
alter table public.letters add column if not exists reply text;
alter table public.letters add column if not exists replied_at timestamptz;

create index if not exists letters_public_idx on public.letters (is_public, created_at desc);

-- 開啟 RLS 且不建立任何 policy：只有伺服器端的 service role key 能存取，前端無法直接讀寫
alter table public.letters enable row level security;

-- 私有的附件儲存空間
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;
