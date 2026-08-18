-- =============================================================
-- Funil de Contratação — fase de implantação
-- Inicia quando o contrato é arquivado (contrato_arquivado = true).
-- A regra de auto-início fica em código (upsertContrato, src/lib/actions.ts):
-- ao arquivar o contrato, implantacao_status vira 'em_andamento'
-- automaticamente, salvo quando o formulário já envia um status explícito.
-- =============================================================

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS implantacao_status TEXT
    CHECK (implantacao_status IN ('nao_iniciada','em_andamento','concluida'))
    DEFAULT 'nao_iniciada',
  ADD COLUMN IF NOT EXISTS implantacao_iniciada_em  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS implantacao_concluida_em TIMESTAMPTZ;

-- Garante o default explícito em linhas já existentes (colunas adicionadas
-- depois do INSERT original ficam NULL, não no valor DEFAULT).
UPDATE contratos SET implantacao_status = 'nao_iniciada' WHERE implantacao_status IS NULL;
