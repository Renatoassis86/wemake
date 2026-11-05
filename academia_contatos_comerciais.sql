-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Contatos autorizados a receber material comercial.
--
-- A escola preenche, sem login, em /contatos-comerciais, apontando quem
-- (nome + área + e-mail) deve receber o material de ativação comercial
-- (treinamento + manual de marca). Motivo: os e-mails vindos de propostas
-- antigas estavam desatualizados (ex.: Lighthouse, ACR) — agora a própria
-- escola aponta a pessoa certa, com liberação explícita.
--
-- Áreas seguem exatamente o checklist do Registro de Ativação Comercial
-- (src/content/academia/registro-ativacao-comercial.json): Matrículas,
-- Comercial, Marketing, Direção, Outro.
--
-- Uma linha por pessoa; `lote_id` agrupa as pessoas enviadas no mesmo
-- envio do formulário (uma escola pode reenviar depois, somando lotes).
--
-- COMO APLICAR: Supabase → SQL Editor → colar → Run. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.academia_contatos_comerciais (
  id                uuid primary key default gen_random_uuid(),
  lote_id           uuid not null,
  escola_nome       text not null,
  escola_cidade     text,
  escola_estado     text,
  respondente_nome  text not null,
  respondente_cargo text,
  pessoa_nome       text not null,
  pessoa_area       text not null check (pessoa_area in ('Matrículas', 'Comercial', 'Marketing', 'Direção', 'Outro')),
  pessoa_email      text not null,
  pessoa_telefone   text,
  created_at        timestamptz not null default now()
);

create index if not exists academia_contatos_comerciais_lote_idx on public.academia_contatos_comerciais (lote_id);
create index if not exists academia_contatos_comerciais_escola_idx on public.academia_contatos_comerciais (lower(escola_nome));

alter table public.academia_contatos_comerciais enable row level security;
-- Sem policy: só o service role (usado pela action pública e pela tela de gestão) acessa.
