-- =============================================================
-- propostas — adiciona valor por aluno/ano do cenário Currículo + Comodato
-- (antes esse número era só derivado da parcela do comodato ÷ alunos;
--  agora é um valor editável na calculadora, para que "Somente Currículo"
--  e "Currículo + Comodato" apareçam lado a lado na proposta)
-- =============================================================

ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS valor_aluno_ano_comodato NUMERIC(10,2);
