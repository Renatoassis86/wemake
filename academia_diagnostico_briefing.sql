-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Diagnóstico do Espaço Maker — atualização de outubro/2026
--   1) novas perguntas do briefing: 2.2 Climatização e 2.3 Mobiliário
--   2) evidências obrigatórias: de 11 para 6 itens
-- Pode rodar mais de uma vez sem problema.
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Briefing (entram no catálogo como itens de "ambiente")
insert into public.academia_diag_itens (item_key, secao, categoria, titulo, ordem) values
  ('cli-01', 'ambiente', '2.2 Climatização', 'O ambiente possui atualmente algum sistema de climatização?', 301),
  ('cli-02', 'ambiente', '2.2 Climatização', 'Se o ambiente não possui climatização, a escola pretende instalar algum equipamento?', 302),
  ('cli-03', 'ambiente', '2.2 Climatização', 'Se sim, qual equipamento pretende instalar?', 303),
  ('cli-04', 'ambiente', '2.2 Climatização', 'Se possível, informe também o modelo, capacidade ou especificações do equipamento que está sendo considerado.', 304),
  ('mob-01', 'ambiente', '2.3 Mobiliário', 'A escola pretende aproveitar algum mobiliário já existente no ambiente?', 311),
  ('mob-02', 'ambiente', '2.3 Mobiliário', 'Se sim, quais móveis pretende manter e utilizar na Sala Maker?', 312),
  ('mob-03', 'ambiente', '2.3 Mobiliário', 'Quais informações sobre esse mobiliário a escola consegue fornecer?', 313),
  ('mob-04', 'ambiente', '2.3 Mobiliário', 'Informações, medidas ou links do mobiliário', 314)
on conflict (item_key) do update set
  secao = excluded.secao, categoria = excluded.categoria, titulo = excluded.titulo, ordem = excluded.ordem;

-- 2) Evidências obrigatórias: novos nomes para os itens 1 a 6 …
update public.academia_diag_itens set titulo = v.titulo
from (values
  ('evi-01', 'Planta baixa e/ou croqui do ambiente'),
  ('evi-02', 'Fotos gerais da sala'),
  ('evi-03', 'Fotos das Portas e Janelas'),
  ('evi-04', 'Fotos das tomadas e pontos elétricos'),
  ('evi-05', 'Fotos, fichas técnicas ou outros arquivos relacionados ao mobiliário'),
  ('evi-06', 'Vídeo de 1 a 2 minutos percorrendo todo o ambiente')
) as v(item_key, titulo)
where academia_diag_itens.item_key = v.item_key;

-- … e saem os itens 7 a 11 (apaga também o que tenha sido respondido neles)
delete from public.academia_diag_respostas where item_key in ('evi-07', 'evi-08', 'evi-09', 'evi-10', 'evi-11');
delete from public.academia_diag_itens     where item_key in ('evi-07', 'evi-08', 'evi-09', 'evi-10', 'evi-11');

-- conferência: deve listar 8 itens de briefing e 6 evidências
select item_key, secao, categoria, titulo from public.academia_diag_itens
 where item_key like 'cli-%' or item_key like 'mob-%' or item_key like 'evi-%' order by secao, item_key;
