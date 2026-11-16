-- Módulo de Orçamento e Planejamento Financeiro (Gestão Financeira → "Orçamento e
-- planejamento financeiro"): receitas e despesas projetadas mês a mês, por ano.
--
-- Receita: uma linha por escola, ligada ao contrato real quando existir (contrato_id),
-- pra dar rastreabilidade — mas os valores mensais são os do orçamento (a projeção/
-- premissa), não recalculados ao vivo do contrato. "grupo_id" fica nulo pra receita:
-- a lista é plana, sem categoria.
--
-- Despesa: cada linha pertence a um grupo (categoria, ex.: "PESSOAL", "TECNOLOGIA"),
-- sem contrato_id.

create table if not exists public.orcamentos_grupos (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  nome text not null,
  ordem double precision not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists orcamentos_grupos_ano_tipo_idx on public.orcamentos_grupos(ano, tipo);

create table if not exists public.orcamentos_linhas (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  grupo_id uuid references public.orcamentos_grupos(id) on delete cascade,
  contrato_id uuid references public.contratos(id) on delete set null,
  nome text not null,
  observacao text,
  ordem double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orcamentos_linhas_ano_tipo_idx on public.orcamentos_linhas(ano, tipo);
create index if not exists orcamentos_linhas_grupo_id_idx on public.orcamentos_linhas(grupo_id);

create table if not exists public.orcamentos_valores (
  linha_id uuid not null references public.orcamentos_linhas(id) on delete cascade,
  mes smallint not null check (mes between 1 and 12),
  valor numeric not null default 0,
  primary key (linha_id, mes)
);

-- Mesmo padrão de acesso do resto da plataforma: só o service_role (admin client
-- no servidor) lê/escreve; nenhuma policy de RLS pra anon/authenticated.
alter table public.orcamentos_grupos enable row level security;
alter table public.orcamentos_linhas enable row level security;
alter table public.orcamentos_valores enable row level security;

revoke all on public.orcamentos_grupos from anon, authenticated;
revoke all on public.orcamentos_linhas from anon, authenticated;
revoke all on public.orcamentos_valores from anon, authenticated;

grant all on public.orcamentos_grupos to service_role;
grant all on public.orcamentos_linhas to service_role;
grant all on public.orcamentos_valores to service_role;
