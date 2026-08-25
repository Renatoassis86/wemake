-- Proposta com comodato mostra 2 modelos lado a lado (Somente Currículo vs
-- Currículo + Comodato) no mesmo documento. `num_parcelas` ficou dedicado ao
-- parcelamento do comodato (sempre 12x, mensal -- regra de negócio). Falta um
-- campo próprio para o parcelamento do lado "Somente Currículo" dentro dessa
-- mesma proposta (padrão: 5x), que hoje reusa `num_parcelas` incorretamente
-- e mostra 12x nos dois lados.
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS num_parcelas_curriculo INTEGER DEFAULT 5;
