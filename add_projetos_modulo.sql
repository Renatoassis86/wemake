-- Módulo de Gestão de Projetos: quadro kanban estilo Trello.
-- v1 = um quadro único (schema já aberto para múltiplos quadros/projetos mais pra frente).

create table if not exists public.quadros (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.colunas (
  id uuid primary key default gen_random_uuid(),
  quadro_id uuid not null references public.quadros(id) on delete cascade,
  nome text not null,
  cor text not null default '#64748b',
  ordem double precision not null default 0,
  fecha_tarefa boolean not null default false, -- marca a tarefa como concluída ao cair aqui
  created_at timestamptz not null default now()
);
create index if not exists colunas_quadro_id_idx on public.colunas(quadro_id);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  quadro_id uuid not null references public.quadros(id) on delete cascade,
  nome text not null,
  cor text not null default '#00889e',
  created_at timestamptz not null default now()
);
create index if not exists tags_quadro_id_idx on public.tags(quadro_id);

-- Chamada "projetos_tarefas" (não "tarefas"): já existe uma tabela "tarefas" no CRM
-- (follow-up de escolas, colunas diferentes). Nome igual faria o "if not exists" abaixo
-- não criar nada e o módulo ia escrever sem querer na tabela errada.
create table if not exists public.projetos_tarefas (
  id uuid primary key default gen_random_uuid(),
  coluna_id uuid not null references public.colunas(id) on delete cascade,
  titulo text not null,
  descricao text,
  responsavel text,
  prioridade text check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  data_vencimento date,
  ordem double precision not null default 0,
  concluida boolean not null default false,
  arquivada boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projetos_tarefas_coluna_id_idx on public.projetos_tarefas(coluna_id);

create table if not exists public.subtarefas (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.projetos_tarefas(id) on delete cascade,
  titulo text not null,
  concluida boolean not null default false,
  ordem double precision not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists subtarefas_tarefa_id_idx on public.subtarefas(tarefa_id);

create table if not exists public.tarefas_tags (
  tarefa_id uuid not null references public.projetos_tarefas(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (tarefa_id, tag_id)
);

-- Mesmo padrão de acesso do resto da plataforma: só o service_role (admin client
-- no servidor) lê/escreve; nenhuma policy de RLS pra anon/authenticated.
alter table public.quadros enable row level security;
alter table public.colunas enable row level security;
alter table public.tags enable row level security;
alter table public.projetos_tarefas enable row level security;
alter table public.subtarefas enable row level security;
alter table public.tarefas_tags enable row level security;

revoke all on public.quadros from anon, authenticated;
revoke all on public.colunas from anon, authenticated;
revoke all on public.tags from anon, authenticated;
revoke all on public.projetos_tarefas from anon, authenticated;
revoke all on public.subtarefas from anon, authenticated;
revoke all on public.tarefas_tags from anon, authenticated;

grant all on public.quadros to service_role;
grant all on public.colunas to service_role;
grant all on public.tags to service_role;
grant all on public.projetos_tarefas to service_role;
grant all on public.subtarefas to service_role;
grant all on public.tarefas_tags to service_role;
