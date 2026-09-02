-- Adiciona:
-- 1) contratos.declinou — a escola recusou a proposta (checklist do Funil de Contratação)
-- 2) escolas.prioridade_manual — ordem de priorização definida manualmente pelo time comercial
--    (menor número = maior prioridade; NULL = sem prioridade definida, fica por último)

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS declinou BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proposta_enviada BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE escolas
  ADD COLUMN IF NOT EXISTS prioridade_manual INTEGER NULL;
