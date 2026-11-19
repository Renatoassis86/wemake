-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Lista de produtos — catálogo editável do Diagnóstico
--
-- academia_diag_itens já existe e já é a fonte de verdade que as RPCs de
-- gravação (academia_salvar_respostas/pareceres/compras) validam. Só falta
-- uma coluna pra "arquivar" um item sem apagá-lo (apagar quebraria a FK de
-- anos de respostas/pareceres/compras de escolas já diagnosticadas).
--
-- COMO APLICAR: Supabase → SQL Editor → colar → Run. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.academia_diag_itens
  add column if not exists ativo boolean not null default true;
