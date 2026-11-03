-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Diário de anotações compartilhado (escola + equipe) e
-- arquivos de arquitetura enviados pela equipe We Make (Gabi e outros),
-- por diagnóstico — plantas, memoriais, pareceres técnicos etc.
--
-- COMO APLICAR: depois de academia_diagnostico_jornada.sql → Supabase →
-- SQL Editor → colar → Run. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Diário de anotações: quem escreveu (a escola já escrevia; agora a equipe também) ─
alter table public.academia_diag_anotacoes
  add column if not exists autor text not null default 'escola';

-- ── Arquivos enviados pela equipe We Make (ex.: plantas e memoriais da Gabi) ────────
create table if not exists public.academia_diag_arquivos_equipe (
  id             uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references public.academia_diagnosticos(id) on delete cascade,
  nome           text not null,
  mime           text,
  tamanho        integer,
  path           text not null,
  enviado_por    text,
  criado_em      timestamptz not null default now()
);

create index if not exists academia_diag_arquivos_equipe_diagnostico_idx
  on public.academia_diag_arquivos_equipe (diagnostico_id, criado_em desc);

alter table public.academia_diag_arquivos_equipe enable row level security;
