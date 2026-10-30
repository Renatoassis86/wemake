-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Portal da escola — login (e-mail + senha numérica) e
-- comparação de compras (loja, preço e link de cada item, por escola).
--
-- A escola loga em /meu-diagnostico com e-mail + senha numérica de 6 dígitos
-- (gerada pela We Make, mesma lógica do PIN do /diagnostico — inclusive
-- guardada também em texto puro, pelo mesmo motivo do pin_atual: já vai em
-- texto puro pra escola por WhatsApp/e-mail, então reaparecer na tela do
-- staff sem precisar gerar outra não abre brecha nova) e vê a devolutiva
-- do próprio diagnóstico, já concluído pela We Make, com as tabelas de
-- recursos e o link de compra de cada item.
--
-- academia_diag_compras é a camada por escola que faltava: o catálogo
-- (academia_diag_itens) tem um link de referência só, igual pra todo mundo;
-- aqui entra a cotação específica de cada escola (melhor loja, Mercado
-- Livre, Amazon, link original) — editável pelo staff na tela de análise.
--
-- COMO APLICAR: depois de academia_diagnostico.sql e
-- academia_diagnostico_pin_visivel.sql → Supabase → SQL Editor → colar → Run.
-- Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Login do portal: colunas novas em academia_diagnosticos ────────────────
alter table public.academia_diagnosticos
  add column if not exists portal_email            text,
  add column if not exists portal_senha_hash        text,
  add column if not exists portal_senha_atual       text,
  add column if not exists portal_senha_definida_em timestamptz;

create unique index if not exists academia_diagnosticos_portal_email_idx
  on public.academia_diagnosticos (lower(portal_email))
  where portal_email is not null;

-- ── Comparação de compras por item (loja, preço, link), por escola ─────────
create table if not exists public.academia_diag_compras (
  diagnostico_id          uuid not null references public.academia_diagnosticos(id) on delete cascade,
  item_key                text not null references public.academia_diag_itens(item_key),
  situacao                text,       -- "Comprar", "Aguardar We Make" etc.
  melhor_loja             text,       -- Melhor opção (loja)
  melhor_produto          text,       -- Produto / observação
  melhor_item_exato       text,       -- "Exato" / "Aproximado"
  melhor_preco            numeric,    -- Preço unitário na melhor opção
  melhor_link             text,       -- Link (comprar) — mostrado em destaque à escola
  ml_preco                numeric,    -- Mercado Livre: preço unitário
  ml_link                 text,       -- Mercado Livre: link
  amazon_preco            numeric,    -- Amazon: preço unitário
  amazon_link             text,       -- Amazon: link
  link_original_loja      text,       -- Link original: loja
  link_original_situacao  text,       -- Link original: situação (ativo, quebrado, pausado...)
  link_original_preco     numeric,    -- Link original: preço hoje
  link_original_url       text,       -- Link original (o da planilha-mestre / catálogo)
  atualizado_em           timestamptz not null default now(),
  primary key (diagnostico_id, item_key)
);

alter table public.academia_diag_compras enable row level security;

-- ── Salvar comparação de compras (mesmo molde de academia_salvar_pareceres) ─
create or replace function public.academia_salvar_compras(p_id uuid, p_rows jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r      jsonb;
  v_key  text;
  v_cmp  text;
  v_val  text;
  v_num  numeric;
begin
  if not exists (select 1 from public.academia_diagnosticos where id = p_id) then
    return false;
  end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    v_key := r->>'item_key';
    v_cmp := r->>'campo';
    v_val := nullif(r->>'valor', '');
    if v_cmp not in (
      'situacao', 'melhor_loja', 'melhor_produto', 'melhor_item_exato', 'melhor_preco', 'melhor_link',
      'ml_preco', 'ml_link', 'amazon_preco', 'amazon_link',
      'link_original_loja', 'link_original_situacao', 'link_original_preco', 'link_original_url'
    ) then
      continue;
    end if;
    if not exists (select 1 from public.academia_diag_itens
                    where item_key = v_key and secao in ('reutilizavel', 'consumivel')) then
      continue;
    end if;

    if v_cmp in ('melhor_preco', 'ml_preco', 'amazon_preco', 'link_original_preco') then
      v_num := case when v_val ~ '^\d+([.,]\d+)?$' then replace(v_val, ',', '.')::numeric else null end;
      execute format(
        'insert into public.academia_diag_compras (diagnostico_id, item_key, %1$I) values ($1, $2, $3) '
        'on conflict (diagnostico_id, item_key) do update set %1$I = excluded.%1$I, atualizado_em = now()', v_cmp)
      using p_id, v_key, v_num;
    else
      execute format(
        'insert into public.academia_diag_compras (diagnostico_id, item_key, %1$I) values ($1, $2, $3) '
        'on conflict (diagnostico_id, item_key) do update set %1$I = excluded.%1$I, atualizado_em = now()', v_cmp)
      using p_id, v_key, v_val;
    end if;
  end loop;
  return true;
end $$;

revoke all on function public.academia_salvar_compras(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.academia_salvar_compras(uuid, jsonb) to service_role;
