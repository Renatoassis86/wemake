-- Adiciona contratos.livro_impresso — tag que identifica se a escola quer o
-- livro impresso (usada na tela "Quantidade de Alunos" pra compor a tabela
-- de pedido pra gráfica, com a distribuição de alunos por série/turma).

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS livro_impresso BOOLEAN NOT NULL DEFAULT false;
