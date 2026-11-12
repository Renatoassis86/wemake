-- Dados que o módulo "Dados dos Contratos" precisa mostrar no cartão de cada
-- escola e que não cabiam no modelo existente (preço por aluno por série,
-- pensado pra um jeito de precificar que esses contratos reais não usam —
-- eles têm uma mensalidade única pra escola toda, com desconto progressivo).
alter table public.contratos
  add column if not exists valor_mensal_inicial numeric,
  add column if not exists clausulas_especiais text;

comment on column public.contratos.valor_total is 'Valor total real do contrato (extraído do documento assinado), usado no lugar do cálculo por segmento quando preenchido.';
comment on column public.contratos.valor_mensal_inicial is 'Mensalidade do primeiro ano de vigência, conforme o contrato assinado.';
comment on column public.contratos.clausulas_especiais is 'Cláusulas ou condições comerciais que diferem do modelo padrão de contrato (ex.: desconto escalonado, comodato de equipamento, prazo de vigência diferente, margem de flutuação de alunos).';
