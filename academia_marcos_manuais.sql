-- Academia We Make · etapas definidas à mão pelo gestor
-- Guarda quais etapas do Painel Mestre o gestor decidiu manualmente. As demais seguem o cálculo automático pelas tarefas.
-- Pode rodar mais de uma vez sem problema.
alter table public.academia_implantacoes
  add column if not exists marcos_manuais jsonb not null default '{}'::jsonb;

-- conferência: deve listar a coluna
select column_name, data_type from information_schema.columns
 where table_name = 'academia_implantacoes' and column_name = 'marcos_manuais';
