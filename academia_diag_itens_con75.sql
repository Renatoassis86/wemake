-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Corrige item ausente em academia_diag_itens.
--
-- "Montagem LED + Resistor Pré-cablado" (con-75) existe no catálogo
-- (src/content/academia/diagnostico-schema.json) desde que o item foi
-- cadastrado, mas nunca foi inserido na tabela academia_diag_itens — a
-- tabela de referência que academia_diag_compras.item_key exige via FK.
-- Resultado: qualquer tentativa de salvar "onde comprar" para esse item,
-- em QUALQUER escola, falhava silenciosamente (o upsert de academia_diag_compras
-- derrubava a linha inteira por violar a constraint), e o item aparecia pra
-- escola sem link mesmo quando precisava ser comprado.
--
-- COMO APLICAR: Supabase → SQL Editor → colar → Run. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

insert into public.academia_diag_itens (item_key, secao, categoria, titulo, especificacao, qtd_recomendada, unidade, referencia, valor_ref, ordem)
select
  'con-75', 'consumivel', 'Eletrônica', 'Montagem LED + Resistor Pré-cablado',
  'Kit 50 peças de LED + Resistor com suporte', 1, 'kit',
  'https://pt.aliexpress.com/item/1005008510660133.html?spm=a2g0o.order_list.order_list_main.5.42f3caa49hCHGc&gatewayAdapt=glo2bra',
  45.2, (select coalesce(max(ordem), 0) + 1 from public.academia_diag_itens)
where not exists (select 1 from public.academia_diag_itens where item_key = 'con-75');
