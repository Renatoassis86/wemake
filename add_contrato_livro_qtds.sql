-- Quantidade de livros por série é independente da quantidade de alunos do
-- contrato: ao marcar a tag "Livro" a escola entra na tabela da gráfica com
-- uma cópia dos números do contrato, mas dali em diante pode ser ajustada
-- separadamente sem alterar o contrato (que continua empurrando mudanças
-- pra cá sempre que editado, a menos que a gráfica seja ajustada por conta).
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS livro_qtds JSONB NOT NULL DEFAULT '{}'::jsonb;
