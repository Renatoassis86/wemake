-- Adiciona uma categoria aos arquivos da equipe em academia_diag_arquivos_equipe,
-- pra separar os arquivos de arquitetura (plantas, memoriais, pareceres) dos
-- arquivos do projeto do Espaço Maker (Gabi), que agora tem uma seção própria
-- na página Arquitetura e na análise completa de cada diagnóstico.
-- Linhas existentes continuam classificadas como 'arquitetura' (comportamento
-- inalterado); só os uploads novos da seção Espaço Maker usam categoria
-- 'espaco_maker'.

alter table public.academia_diag_arquivos_equipe
  add column if not exists categoria text not null default 'arquitetura';

create index if not exists academia_diag_arquivos_equipe_categoria_idx
  on public.academia_diag_arquivos_equipe (diagnostico_id, categoria, criado_em desc);
