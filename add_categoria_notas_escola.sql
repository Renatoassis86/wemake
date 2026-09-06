-- Separa as anotações rápidas de contato comercial (já existentes, feitas
-- pelo popover no Funil de Contratação) dos novos comentários sobre o
-- processo de negociação do contrato (novo painel de Minuta/Contrato) —
-- sem isso os dois tipos apareceriam misturados na mesma lista em ambos os
-- lugares. Notas já existentes continuam classificadas como 'contato'
-- (comportamento inalterado).
ALTER TABLE notas_escola
  ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'contato';
