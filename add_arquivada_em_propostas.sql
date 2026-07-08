-- =============================================================
-- propostas — adiciona arquivamento (soft delete)
-- (null = ativa/visível na listagem; preenchido = arquivada, some
--  da listagem padrão mas continua no banco para histórico/auditoria)
-- =============================================================

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS arquivada_em TIMESTAMPTZ;
