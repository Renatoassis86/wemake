-- =============================================================
-- contratos — adiciona segmentos Fundamental II e Ensino Médio
-- (hoje só existem Infantil 2-5 e Fund I 1º-5º ano; escolas com
--  Fund II/Médio não tinham como ter esses segmentos precificados
--  no contrato, embora já sejam capturados no cadastro da escola)
-- =============================================================

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS fund2_ano6_qtd    INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano6_valor  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano7_qtd    INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano7_valor  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano8_qtd    INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano8_valor  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano9_qtd    INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fund2_ano9_valor  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_1s_qtd      INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_1s_valor    NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_2s_qtd      INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_2s_valor    NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_3s_qtd      INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_3s_valor    NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Nota: o valor total do contrato passa a ser calculado no código da
-- aplicação (src/app/(dashboard)/comercial/contratos/page.tsx), somando
-- qtd*valor de todos os 16 segmentos — não depende de `valor_total` /
-- `valor_total_calculado`, cuja definição original não está disponível
-- neste repositório para ser estendida com segurança.
