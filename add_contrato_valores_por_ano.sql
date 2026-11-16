-- Valor de cada ano do contrato, quando o documento declara um escalonamento
-- real (ex.: Aprender e Viver: 2.737,50/mês em 2027, 3.112,50 em 2028...).
-- Array de números, um por ano de vigência, a partir do 1º ano com cobrança
-- (ano "zero" gratuito não entra no array). Null = sem escalonamento
-- conhecido — a Receita Contratada então repete o valor_anual pros outros anos.
alter table public.contratos add column if not exists valores_por_ano jsonb;
