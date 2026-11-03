-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Portal da escola — "adquirido" por item e diário de
-- anotações da jornada de implantação.
--
-- A escola, no próprio portal (/meu-diagnostico/painel), passa a poder:
--  1) marcar cada item da lista de compras como adquirido (checkbox simples,
--     sem exigir reconferência pelo staff — é só o controle da própria escola);
--  2) escrever anotações livres ao longo do tempo (observações sobre os
--     materiais, dúvidas, avisos de atraso etc.) — um diário, não um campo
--     único — pra equipe We Make acompanhar e usar na tomada de decisão.
--
-- COMO APLICAR: depois de academia_diagnostico_portal.sql → Supabase →
-- SQL Editor → colar → Run. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Adquirido: controle da própria escola sobre o que já comprou ───────────
alter table public.academia_diag_compras
  add column if not exists adquirido     boolean not null default false,
  add column if not exists adquirido_em  timestamptz;

-- ── Diário de anotações da escola, por diagnóstico ──────────────────────────
create table if not exists public.academia_diag_anotacoes (
  id             uuid primary key default gen_random_uuid(),
  diagnostico_id uuid not null references public.academia_diagnosticos(id) on delete cascade,
  texto          text not null,
  criado_em      timestamptz not null default now()
);

create index if not exists academia_diag_anotacoes_diagnostico_idx
  on public.academia_diag_anotacoes (diagnostico_id, criado_em desc);

alter table public.academia_diag_anotacoes enable row level security;
