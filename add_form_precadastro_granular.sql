-- =============================================================
-- form_precadastro_wemake — séries granulares + site/telefone +
-- endereço de entrega do material didático
--
-- Substitui a lógica de "quantidade agregada por segmento" (4
-- números) por uma grade granular por série (14 séries: Infantil
-- 4-5, Fund I 1º-5º, Fund II 6º-9º, Médio 1ª-3ª). As colunas
-- agregadas (alunos_infantil, alunos_fundamental_1/2,
-- alunos_ensino_medio) continuam existindo — passam a ser
-- preenchidas automaticamente como soma das séries (ver
-- enviarFormularioPublico em src/lib/actions.ts), para não quebrar
-- o espelhamento em leads_universal que já depende delas.
-- =============================================================

ALTER TABLE form_precadastro_wemake
  ADD COLUMN IF NOT EXISTS site TEXT,
  ADD COLUMN IF NOT EXISTS telefone_institucional TEXT,

  -- Endereço de entrega do material didático (Anexo III do contrato)
  ADD COLUMN IF NOT EXISTS entrega_mesmo_endereco BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS entrega_rua TEXT,
  ADD COLUMN IF NOT EXISTS entrega_numero TEXT,
  ADD COLUMN IF NOT EXISTS entrega_complemento TEXT,
  ADD COLUMN IF NOT EXISTS entrega_bairro TEXT,
  ADD COLUMN IF NOT EXISTS entrega_cep TEXT,
  ADD COLUMN IF NOT EXISTS entrega_cidade TEXT,
  ADD COLUMN IF NOT EXISTS entrega_estado TEXT,

  -- Séries granulares (Anexo II — quantidade mínima de alunos por série)
  ADD COLUMN IF NOT EXISTS infantil4_qtd  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS infantil5_qtd  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund1_ano1_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund1_ano2_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund1_ano3_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund1_ano4_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund1_ano5_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano6_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano7_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano8_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano9_qtd INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_1s_qtd   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_2s_qtd   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_3s_qtd   INTEGER DEFAULT 0;
