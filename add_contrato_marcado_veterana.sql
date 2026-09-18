-- Marca explicitamente quando uma escola foi adicionada à tela "Quantidade
-- de Alunos" como veterana (planilha do Dênis / adição manual), em vez de
-- inferir isso de contrato_assinado — que também é usado por escolas novas
-- que fecharam contrato de verdade pelo funil 2027.
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS marcado_veterana BOOLEAN NOT NULL DEFAULT false;
