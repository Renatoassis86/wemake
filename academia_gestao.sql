-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · gestão da implantação
-- Painel Mestre (uma linha por escola), tarefas (workspace) e agenda.
-- Baseado nas planilhas: 8. Painel_Mestre_Implantacao_We_Make_2027.xlsx
--                        3.1 Diagnostico_Espaco_Maker_We_Make_2027.xlsx
--
-- COMO APLICAR: Supabase → SQL Editor → colar este arquivo → Run.
-- É idempotente: pode rodar mais de uma vez.
-- O app grava com o service role (como o restante da plataforma); o RLS abaixo
-- só libera leitura para usuários autenticados.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Painel Mestre: uma linha por escola ─────────────────────────────────────
create table if not exists public.academia_implantacoes (
  id               uuid primary key default gen_random_uuid(),
  escola_id        uuid references public.escolas(id) on delete set null,
  escola_nome      text not null,
  cidade_uf        text,
  responsavel      text,                       -- Responsável We Make
  prioridade       text not null default 'Normal'
                   check (prioridade in ('Normal', 'Alta', 'Crítica')),
  -- status de cada um dos 9 marcos (lista oficial de status do Painel Mestre)
  marcos           jsonb not null default jsonb_build_object(
                     'Handoff', 'Não iniciado',
                     'Diagnóstico', 'Não iniciado',
                     'Arquitetura', 'Não iniciado',
                     'Recursos', 'Não iniciado',
                     'Ativação Comercial', 'Não iniciado',
                     'Pré-Onboarding', 'Não iniciado',
                     'Onboarding', 'Não iniciado',
                     'Go-Live', 'Não iniciado',
                     'Transição para Academia', 'Não iniciado'),
  proxima_acao     text,
  responsavel_acao text,                       -- Responsável pela próxima ação
  prazo            date,
  risco            text not null default 'Baixo'
                   check (risco in ('Baixo', 'Médio', 'Alto', 'Crítico')),
  motivo_bloqueio  text,                       -- obrigatório se risco Alto/Crítico ou etapa Bloqueada
  data_assinatura  date,
  data_onboarding  date,                       -- dia 1 da formação
  data_inicio_aulas date,
  arquivada        boolean not null default false,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists academia_implantacoes_escola_idx on public.academia_implantacoes (escola_id);

-- ── Tarefas (workspace: espaço → pasta → lista → tarefa) ───────────────────
create table if not exists public.academia_tarefas (
  id             uuid primary key default gen_random_uuid(),
  implantacao_id uuid references public.academia_implantacoes(id) on delete cascade,
  lista          text not null,                -- slug da lista (ex.: 'handoff', 'diagnostico')
  marco          smallint,                     -- índice do marco do Painel (0 a 8)
  titulo         text not null,
  descricao      text,
  status         text not null default 'Não iniciado'
                 check (status in ('Não iniciado', 'Em andamento', 'Aguardando escola',
                                   'Aguardando We Make', 'Concluído', 'Bloqueado')),
  prioridade     text not null default 'Normal'
                 check (prioridade in ('Normal', 'Alta', 'Crítica')),
  responsavel    text,
  prazo          date,
  ordem          integer not null default 0,
  concluida_em   timestamptz,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists academia_tarefas_impl_idx   on public.academia_tarefas (implantacao_id);
create index if not exists academia_tarefas_status_idx on public.academia_tarefas (status);
create index if not exists academia_tarefas_prazo_idx  on public.academia_tarefas (prazo);

-- ── Agenda ──────────────────────────────────────────────────────────────────
create table if not exists public.academia_eventos (
  id             uuid primary key default gen_random_uuid(),
  implantacao_id uuid references public.academia_implantacoes(id) on delete set null,
  titulo         text not null,
  tipo           text not null default 'Reunião',
  inicio         timestamptz not null,
  fim            timestamptz,
  local          text,
  responsavel    text,
  notas          text,
  created_by     uuid,
  created_at     timestamptz not null default now()
);

create index if not exists academia_eventos_inicio_idx on public.academia_eventos (inicio);

-- ── updated_at automático ───────────────────────────────────────────────────
create or replace function public.academia_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists academia_implantacoes_touch on public.academia_implantacoes;
create trigger academia_implantacoes_touch before update on public.academia_implantacoes
  for each row execute function public.academia_touch_updated_at();

drop trigger if exists academia_tarefas_touch on public.academia_tarefas;
create trigger academia_tarefas_touch before update on public.academia_tarefas
  for each row execute function public.academia_touch_updated_at();

-- ── RLS: leitura para autenticados; escrita só pelo service role ───────────
alter table public.academia_implantacoes enable row level security;
alter table public.academia_tarefas      enable row level security;
alter table public.academia_eventos      enable row level security;

drop policy if exists academia_implantacoes_select on public.academia_implantacoes;
create policy academia_implantacoes_select on public.academia_implantacoes
  for select to authenticated using (true);

drop policy if exists academia_tarefas_select on public.academia_tarefas;
create policy academia_tarefas_select on public.academia_tarefas
  for select to authenticated using (true);

drop policy if exists academia_eventos_select on public.academia_eventos;
create policy academia_eventos_select on public.academia_eventos
  for select to authenticated using (true);
