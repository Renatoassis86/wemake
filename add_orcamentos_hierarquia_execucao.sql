-- Extensão do módulo de Orçamento (depois de add_orcamentos_modulo.sql):
-- 1) hierarquia de categorias em orcamentos_grupos (até 6 níveis, receita E despesa);
-- 2) execução mensal (valor realizado, lançado à mão) em orcamentos_valores;
-- 3) log de remanejamentos entre linhas (sem workflow de aprovação).

alter table public.orcamentos_grupos
  add column if not exists parent_id uuid references public.orcamentos_grupos(id) on delete cascade,
  add column if not exists nivel smallint not null default 1 check (nivel between 1 and 6);

create index if not exists orcamentos_grupos_parent_id_idx on public.orcamentos_grupos(parent_id);

-- "valor" (já existente) é a previsão/premissa do mês. "executado" é o realizado,
-- lançado manualmente mês a mês (não há integração automática com contas a
-- pagar/receber nem conciliação bancária ainda).
alter table public.orcamentos_valores
  add column if not exists executado numeric not null default 0;

-- Log de remanejamento: registra um corte e/ou injeção de valor entre linhas.
-- origem/destino nulos representam injeção pura (verba nova) ou corte puro
-- (verba retirada do orçamento), em vez de uma troca entre duas linhas.
-- Sem status/aprovação: o valor conta pra "previsão atualizada" assim que
-- gravado. on delete set null preserva o log mesmo se a linha for apagada depois.
create table if not exists public.orcamentos_remanejamentos (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  origem_linha_id uuid references public.orcamentos_linhas(id) on delete set null,
  destino_linha_id uuid references public.orcamentos_linhas(id) on delete set null,
  valor numeric not null check (valor > 0),
  justificativa text not null check (char_length(trim(justificativa)) > 0),
  criado_por text,
  created_at timestamptz not null default now(),
  constraint orcamentos_remanejamentos_tem_lado check (origem_linha_id is not null or destino_linha_id is not null)
);
create index if not exists orcamentos_remanejamentos_ano_tipo_idx on public.orcamentos_remanejamentos(ano, tipo);
create index if not exists orcamentos_remanejamentos_origem_idx on public.orcamentos_remanejamentos(origem_linha_id);
create index if not exists orcamentos_remanejamentos_destino_idx on public.orcamentos_remanejamentos(destino_linha_id);

alter table public.orcamentos_remanejamentos enable row level security;
revoke all on public.orcamentos_remanejamentos from anon, authenticated;
grant all on public.orcamentos_remanejamentos to service_role;
