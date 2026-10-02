-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Diagnóstico do Espaço Maker (formulário externo com PIN)
--
-- A escola responde numa página pública protegida por PIN (/diagnostico).
-- As respostas, os arquivos e o parecer da We Make só são lidos por quem faz
-- login na plataforma (Renato e Dênis, a princípio).
--
-- Segurança:
--   • O PIN nunca é gravado: só um hash HMAC. O PIN em texto aparece uma vez, na criação.
--   • RLS ligado e SEM policy nas tabelas: o acesso anônimo é bloqueado; só o servidor
--     da plataforma (service role) lê e grava.
--   • Bucket de arquivos privado, com limite de tamanho e tipos permitidos.
--
-- COMO APLICAR: Supabase → SQL Editor → colar este arquivo → Run. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Diagnóstico de cada escola ──────────────────────────────────────────────
create table if not exists public.academia_diagnosticos (
  id               uuid primary key default gen_random_uuid(),
  implantacao_id   uuid references public.academia_implantacoes(id) on delete set null,
  escola_nome      text not null,
  pin_hash         text not null unique,
  status           text not null default 'aberto'
                   check (status in ('aberto', 'enviado', 'em_analise', 'concluido')),
  respostas        jsonb not null default '{}'::jsonb,   -- campos "preenchimento da escola"
  parecer          jsonb not null default '{}'::jsonb,   -- campos "parecer We Make"
  ultima_atividade timestamptz,
  enviado_em       timestamptz,
  expira_em        timestamptz not null default (now() + interval '120 days'),
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists academia_diagnosticos_impl_idx on public.academia_diagnosticos (implantacao_id);

-- ── Arquivos de evidência (fotos, vídeo, planta/croqui) ─────────────────────
create table if not exists public.academia_diagnostico_arquivos (
  id              uuid primary key default gen_random_uuid(),
  diagnostico_id  uuid not null references public.academia_diagnosticos(id) on delete cascade,
  evidencia_key   text not null,
  path            text not null unique,
  nome            text not null,
  mime            text,
  tamanho         bigint,
  created_at      timestamptz not null default now()
);

create index if not exists academia_diag_arq_idx on public.academia_diagnostico_arquivos (diagnostico_id);

-- ── Tentativas de PIN (limita tentativas repetidas) ─────────────────────────
create table if not exists public.academia_pin_tentativas (
  id         bigserial primary key,
  ip_hash    text not null,
  sucesso    boolean not null default false,
  criado_em  timestamptz not null default now()
);

create index if not exists academia_pin_tent_idx on public.academia_pin_tentativas (ip_hash, criado_em desc);

-- ── RLS ligado, sem policies: só o service role acessa ──────────────────────
alter table public.academia_diagnosticos          enable row level security;
alter table public.academia_diagnostico_arquivos  enable row level security;
alter table public.academia_pin_tentativas        enable row level security;

-- ── updated_at automático ───────────────────────────────────────────────────
create or replace function public.academia_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists academia_diagnosticos_touch on public.academia_diagnosticos;
create trigger academia_diagnosticos_touch before update on public.academia_diagnosticos
  for each row execute function public.academia_touch_updated_at();

-- ── Mescla atômica das respostas (autosave da escola) ───────────────────────
-- Só aceita enquanto o diagnóstico estiver aberto ou enviado e dentro da validade.
create or replace function public.academia_merge_respostas(p_id uuid, p_patch jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.academia_diagnosticos
     set respostas = respostas || p_patch,
         ultima_atividade = now()
   where id = p_id
     and status in ('aberto', 'enviado')
     and expira_em > now();
  get diagnostics n = row_count;
  return n > 0;
end $$;

revoke all on function public.academia_merge_respostas(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.academia_merge_respostas(uuid, jsonb) to service_role;

-- ── Bucket privado dos arquivos ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'academia-diagnosticos', 'academia-diagnosticos', false, 209715200,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
