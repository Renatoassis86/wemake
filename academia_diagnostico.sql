-- ════════════════════════════════════════════════════════════════════════════
-- Academia We Make · Diagnóstico do Espaço Maker — banco relacional
-- GERADO por scripts/academia/diagnostico_schema.py a partir da planilha oficial
-- (3.1 Diagnostico_Espaco_Maker_We_Make_2027.xlsx). Não edite o catálogo à mão.
--
-- A escola responde numa página pública protegida por PIN (/diagnostico); cada resposta é
-- gravada na hora (salvamento automático). Respostas, anexos e parecer só são lidos por quem
-- faz login e está autorizado.
--
-- Modelo:
--   academia_diagnosticos          1 linha por escola/diagnóstico (PIN só como hash)
--   academia_diag_itens            CATÁLOGO: perguntas, medidas, evidências e recursos da planilha
--   academia_diag_respostas        o que a ESCOLA respondeu: 1 linha por diagnóstico × item
--   academia_diag_pareceres        o que a WE MAKE avaliou: 1 linha por diagnóstico × item
--   academia_diagnostico_arquivos  anexos (fotos, vídeo, planta) de evidências e de medidas
--   academia_diag_consolidado      VIEW: recursos × respostas × parecer, com qtd e custo a adquirir
--   academia_diag_resumo           VIEW: totais por diagnóstico (itens e custo estimado)
--
-- Segurança: RLS ligado e sem policies (só o servidor da plataforma lê e grava); views com
-- security_invoker e sem permissão para anon/authenticated; bucket privado.
--
-- COMO APLICAR: depois de academia_gestao.sql → Supabase → SQL Editor → colar → Run. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Diagnóstico de cada escola ──────────────────────────────────────────────
create table if not exists public.academia_diagnosticos (
  id               uuid primary key default gen_random_uuid(),
  implantacao_id   uuid references public.academia_implantacoes(id) on delete set null,
  escola_nome      text not null,
  pin_hash         text not null unique,
  link_token       text not null unique default encode(gen_random_bytes(18), 'hex'),  -- link enviado à escola
  status           text not null default 'aberto'
                   check (status in ('aberto', 'enviado', 'em_analise', 'concluido')),
  ultima_atividade timestamptz,
  enviado_em       timestamptz,
  expira_em        timestamptz not null default (now() + interval '120 days'),
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists academia_diagnosticos_impl_idx on public.academia_diagnosticos (implantacao_id);

-- Quem já tinha a tabela da versão anterior: acrescenta o token do link (as linhas existentes ganham um).
alter table public.academia_diagnosticos
  add column if not exists link_token text not null default encode(gen_random_bytes(18), 'hex');
create unique index if not exists academia_diagnosticos_link_idx on public.academia_diagnosticos (link_token);

-- Versão anterior guardava as respostas em JSON dentro desta tabela: migra e remove.
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'academia_diagnosticos' and column_name = 'respostas') then
    alter table public.academia_diagnosticos drop column respostas;
  end if;
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'academia_diagnosticos' and column_name = 'parecer') then
    alter table public.academia_diagnosticos drop column parecer;
  end if;
end $$;

-- ── Catálogo de itens (vem da planilha) ─────────────────────────────────────
create table if not exists public.academia_diag_itens (
  item_key        text primary key,
  secao           text not null check (secao in ('ambiente', 'medida', 'evidencia', 'parecer_ambiente', 'reutilizavel', 'consumivel', 'geral')),
  categoria       text,
  titulo          text not null,
  especificacao   text,
  qtd_recomendada numeric,
  unidade         text,
  referencia      text,
  valor_ref       numeric,
  ordem           integer not null
);
create index if not exists academia_diag_itens_secao_idx on public.academia_diag_itens (secao, ordem);

-- ── Respostas da escola: 1 linha por diagnóstico × item ─────────────────────
create table if not exists public.academia_diag_respostas (
  diagnostico_id  uuid not null references public.academia_diagnosticos(id) on delete cascade,
  item_key        text not null references public.academia_diag_itens(item_key),
  resposta        text,       -- ambiente (resposta) e medida (resposta / medida)
  detalhe         text,       -- ambiente: detalhes das perguntas de sim/não
  anexo_link      text,       -- medida: link ou nome do arquivo
  observacao      text,       -- evidência: observação
  possui          text,       -- recursos: Sim / Não / Parcialmente / Não sei informar / Não se aplica
  qtd_existente   numeric,    -- recursos: quantidade existente
  marca_obs       text,       -- recursos: marca / modelo / observação
  atualizado_em   timestamptz not null default now(),
  primary key (diagnostico_id, item_key)
);

-- ── Parecer da We Make: 1 linha por diagnóstico × item ──────────────────────
create table if not exists public.academia_diag_pareceres (
  diagnostico_id   uuid not null references public.academia_diagnosticos(id) on delete cascade,
  item_key         text not null references public.academia_diag_itens(item_key),
  status_parecer   text,      -- Compatível, Inadequado, Pendente…
  observacao       text,
  qtd_aproveitavel numeric,
  acao             text,      -- Reutilizar, Complementar, Substituir, Adquirir…
  texto            text,      -- parecer geral (textos longos)
  atualizado_em    timestamptz not null default now(),
  primary key (diagnostico_id, item_key)
);

-- ── Anexos: fotos, vídeo e planta (evidências) e arquivos das medidas ───────
create table if not exists public.academia_diagnostico_arquivos (
  id              uuid primary key default gen_random_uuid(),
  diagnostico_id  uuid not null references public.academia_diagnosticos(id) on delete cascade,
  evidencia_key   text not null,   -- item do catálogo ao qual o anexo pertence (evi-XX ou med-XX)
  path            text not null unique,
  nome            text not null,
  mime            text,
  tamanho         bigint,
  created_at      timestamptz not null default now()
);
create index if not exists academia_diag_arq_idx on public.academia_diagnostico_arquivos (diagnostico_id);

-- ── Tentativas de PIN (limita tentativas repetidas) ─────────────────────────
create table if not exists public.academia_pin_tentativas (
  id         bigserial primary key,
  ip_hash    text not null,
  sucesso    boolean not null default false,
  criado_em  timestamptz not null default now()
);
create index if not exists academia_pin_tent_idx on public.academia_pin_tentativas (ip_hash, criado_em desc);

-- ── RLS ligado, sem policies: só o service role acessa ──────────────────────
alter table public.academia_diagnosticos          enable row level security;
alter table public.academia_diag_itens            enable row level security;
alter table public.academia_diag_respostas        enable row level security;
alter table public.academia_diag_pareceres        enable row level security;
alter table public.academia_diagnostico_arquivos  enable row level security;
alter table public.academia_pin_tentativas        enable row level security;

-- ── updated_at automático ───────────────────────────────────────────────────
create or replace function public.academia_touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists academia_diagnosticos_touch on public.academia_diagnosticos;
create trigger academia_diagnosticos_touch before update on public.academia_diagnosticos
  for each row execute function public.academia_touch_updated_at();

-- ── Salvamento automático da escola ─────────────────────────────────────────
-- p_rows = [{"item_key":"med-03","campo":"resposta","valor":"4,20 m"}, ...]
-- Só grava enquanto o diagnóstico estiver aberto ou enviado e dentro da validade, e só em
-- itens que existem no catálogo.
create or replace function public.academia_salvar_respostas(p_id uuid, p_rows jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r      jsonb;
  v_ok   boolean;
  v_key  text;
  v_cmp  text;
  v_val  text;
  v_num  numeric;
begin
  select true into v_ok from public.academia_diagnosticos
   where id = p_id and status in ('aberto', 'enviado') and expira_em > now();
  if not coalesce(v_ok, false) then
    return false;
  end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    v_key := r->>'item_key';
    v_cmp := r->>'campo';
    v_val := nullif(r->>'valor', '');
    if v_cmp not in ('resposta', 'detalhe', 'anexo_link', 'observacao', 'possui', 'qtd_existente', 'marca_obs') then
      continue;
    end if;
    if not exists (select 1 from public.academia_diag_itens
                    where item_key = v_key and secao in ('ambiente', 'medida', 'evidencia', 'reutilizavel', 'consumivel')) then
      continue;
    end if;

    if v_cmp = 'qtd_existente' then
      v_num := case when v_val ~ '^\d+([.,]\d+)?$' then replace(v_val, ',', '.')::numeric else null end;
      insert into public.academia_diag_respostas (diagnostico_id, item_key, qtd_existente)
      values (p_id, v_key, v_num)
      on conflict (diagnostico_id, item_key) do update set qtd_existente = excluded.qtd_existente, atualizado_em = now();
    else
      execute format(
        'insert into public.academia_diag_respostas (diagnostico_id, item_key, %1$I) values ($1, $2, $3) '
        'on conflict (diagnostico_id, item_key) do update set %1$I = excluded.%1$I, atualizado_em = now()', v_cmp)
      using p_id, v_key, v_val;
    end if;
  end loop;

  update public.academia_diagnosticos set ultima_atividade = now() where id = p_id;
  return true;
end $$;

-- ── Parecer da We Make ──────────────────────────────────────────────────────
create or replace function public.academia_salvar_pareceres(p_id uuid, p_rows jsonb)
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
    if v_cmp not in ('status_parecer', 'observacao', 'qtd_aproveitavel', 'acao', 'texto') then
      continue;
    end if;
    if not exists (select 1 from public.academia_diag_itens
                    where item_key = v_key and secao in ('parecer_ambiente', 'reutilizavel', 'consumivel', 'geral')) then
      continue;
    end if;

    if v_cmp = 'qtd_aproveitavel' then
      v_num := case when v_val ~ '^\d+([.,]\d+)?$' then replace(v_val, ',', '.')::numeric else null end;
      insert into public.academia_diag_pareceres (diagnostico_id, item_key, qtd_aproveitavel)
      values (p_id, v_key, v_num)
      on conflict (diagnostico_id, item_key) do update set qtd_aproveitavel = excluded.qtd_aproveitavel, atualizado_em = now();
    else
      execute format(
        'insert into public.academia_diag_pareceres (diagnostico_id, item_key, %1$I) values ($1, $2, $3) '
        'on conflict (diagnostico_id, item_key) do update set %1$I = excluded.%1$I, atualizado_em = now()', v_cmp)
      using p_id, v_key, v_val;
    end if;
  end loop;
  return true;
end $$;

revoke all on function public.academia_salvar_respostas(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.academia_salvar_pareceres(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.academia_salvar_respostas(uuid, jsonb) to service_role;
grant execute on function public.academia_salvar_pareceres(uuid, jsonb) to service_role;

-- ── Views de consulta (mesmas contas da planilha) ───────────────────────────
-- qtd a adquirir = máx(0, quantidade recomendada − quantidade aproveitável)
-- custo estimado = qtd a adquirir × valor de referência
create or replace view public.academia_diag_consolidado with (security_invoker = true) as
select
  d.id                                   as diagnostico_id,
  d.escola_nome,
  d.status                               as status_diagnostico,
  i.secao,
  i.item_key,
  i.categoria,
  i.titulo                               as item,
  i.especificacao,
  i.qtd_recomendada,
  i.unidade,
  i.valor_ref,
  r.possui,
  r.qtd_existente,
  r.marca_obs,
  p.status_parecer,
  p.qtd_aproveitavel,
  p.acao,
  greatest(0, coalesce(i.qtd_recomendada, 0) - coalesce(p.qtd_aproveitavel, 0))                         as qtd_a_adquirir,
  greatest(0, coalesce(i.qtd_recomendada, 0) - coalesce(p.qtd_aproveitavel, 0)) * coalesce(i.valor_ref, 0) as custo_estimado
from public.academia_diagnosticos d
cross join public.academia_diag_itens i
left join public.academia_diag_respostas r on r.diagnostico_id = d.id and r.item_key = i.item_key
left join public.academia_diag_pareceres p on p.diagnostico_id = d.id and p.item_key = i.item_key
where i.secao in ('reutilizavel', 'consumivel');

create or replace view public.academia_diag_resumo with (security_invoker = true) as
select
  diagnostico_id,
  escola_nome,
  status_diagnostico,
  count(*) filter (where secao = 'reutilizavel')                                  as reutilizaveis_cadastrados,
  count(*) filter (where secao = 'reutilizavel' and qtd_a_adquirir > 0)           as reutilizaveis_com_aquisicao,
  coalesce(sum(custo_estimado) filter (where secao = 'reutilizavel'), 0)          as custo_reutilizaveis,
  count(*) filter (where secao = 'consumivel')                                    as consumiveis_cadastrados,
  count(*) filter (where secao = 'consumivel' and qtd_a_adquirir > 0)             as consumiveis_com_aquisicao,
  coalesce(sum(custo_estimado) filter (where secao = 'consumivel'), 0)            as custo_consumiveis,
  coalesce(sum(custo_estimado), 0)                                                as custo_total_estimado
from public.academia_diag_consolidado
group by diagnostico_id, escola_nome, status_diagnostico;

revoke all on public.academia_diag_consolidado from anon, authenticated;
revoke all on public.academia_diag_resumo from anon, authenticated;

-- ── Bucket privado dos anexos ───────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'academia-diagnosticos', 'academia-diagnosticos', false, 209715200,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime', 'video/webm', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── Catálogo de itens (gerado da planilha) ──────────────────────────────────
insert into public.academia_diag_itens
  (item_key, secao, categoria, titulo, especificacao, qtd_recomendada, unidade, referencia, valor_ref, ordem)
values
  ('amb-01', 'ambiente', 'Caracterização do ambiente', 'Uso atual do ambiente', null, null, null, null, null, 1),
  ('amb-02', 'ambiente', 'Caracterização do ambiente', 'O ambiente será exclusivo para a We Make?', null, null, null, null, null, 2),
  ('amb-03', 'ambiente', 'Caracterização do ambiente', 'Quantidade aproximada de alunos simultaneamente', null, null, null, null, null, 3),
  ('amb-04', 'ambiente', 'Caracterização do ambiente', 'O espaço já possui mobiliário?', null, null, null, null, null, 4),
  ('amb-05', 'ambiente', 'Caracterização do ambiente', 'O espaço já possui equipamentos tecnológicos/maker?', null, null, null, null, null, 5),
  ('cli-01', 'ambiente', '2.2 Climatização', 'O ambiente possui atualmente algum sistema de climatização?', null, null, null, null, null, 6),
  ('cli-02', 'ambiente', '2.2 Climatização', 'Se o ambiente não possui climatização, a escola pretende instalar algum equipamento?', null, null, null, null, null, 7),
  ('cli-03', 'ambiente', '2.2 Climatização', 'Se sim, qual equipamento pretende instalar?', null, null, null, null, null, 8),
  ('cli-04', 'ambiente', '2.2 Climatização', 'Se possível, informe também o modelo, capacidade ou especificações do equipamento que está sendo considerado.', null, null, null, null, null, 9),
  ('mob-01', 'ambiente', '2.3 Mobiliário', 'A escola pretende aproveitar algum mobiliário já existente no ambiente?', null, null, null, null, null, 10),
  ('mob-02', 'ambiente', '2.3 Mobiliário', 'Se sim, quais móveis pretende manter e utilizar na Sala Maker?', null, null, null, null, null, 11),
  ('mob-03', 'ambiente', '2.3 Mobiliário', 'Quais informações sobre esse mobiliário a escola consegue fornecer?', null, null, null, null, null, 12),
  ('med-01', 'medida', 'Estrutura geral', 'Comprimento de cada parede (identifique Parede 1, 2, 3...)', null, null, null, null, null, 13),
  ('med-02', 'medida', 'Estrutura geral', 'Altura do pé-direito (piso ao teto)', null, null, null, null, null, 14),
  ('med-03', 'medida', 'Estrutura geral', 'Paredes ou trechos irregulares / desníveis', null, null, null, null, null, 15),
  ('med-04', 'medida', 'Aberturas', 'Portas: largura, altura, distância até paredes laterais e sentido de abertura', null, null, null, null, null, 16),
  ('med-05', 'medida', 'Aberturas', 'Janelas: largura, altura, distância do piso e das paredes laterais', null, null, null, null, null, 17),
  ('med-06', 'medida', 'Instalações elétricas', 'Localização de todas as tomadas', null, null, null, null, null, 18),
  ('med-07', 'medida', 'Instalações elétricas', 'Altura das tomadas e quantidade por ponto', null, null, null, null, null, 19),
  ('med-08', 'medida', 'Instalações elétricas', 'Tensão identificada (127V/220V), quando conhecida', null, null, null, null, null, 20),
  ('med-09', 'medida', 'Instalações elétricas', 'Posição dos interruptores', null, null, null, null, null, 21),
  ('med-10', 'medida', 'Instalações elétricas', 'Quadro elétrico no ambiente ou próximo', null, null, null, null, null, 22),
  ('med-11', 'medida', 'Climatização', 'Ponto e/ou equipamento de ar-condicionado', null, null, null, null, null, 23),
  ('med-12', 'medida', 'Climatização', 'Ventiladores existentes', null, null, null, null, null, 24),
  ('med-13', 'medida', 'Iluminação', 'Pontos de iluminação no teto', null, null, null, null, null, 25),
  ('med-14', 'medida', 'Conectividade', 'Pontos de rede / internet', null, null, null, null, null, 26),
  ('med-15', 'medida', 'Conectividade', 'Qualidade aproximada do Wi-Fi no ambiente', null, null, null, null, null, 27),
  ('med-16', 'medida', 'Mídia', 'TV/projetor e pontos correspondentes', null, null, null, null, null, 28),
  ('med-17', 'medida', 'Estrutura', 'Pilares, vigas aparentes ou elementos estruturais', null, null, null, null, null, 29),
  ('med-18', 'medida', 'Estrutura', 'Bancadas, pias, armários ou mobiliário fixo', null, null, null, null, null, 30),
  ('med-19', 'medida', 'Mobiliário', 'Mesas, cadeiras, estantes, armários ou bancadas existentes — informar medidas aproximadas', null, null, null, null, null, 31),
  ('med-20', 'medida', 'Planta/Croqui', 'Planta baixa do ambiente, se houver; caso contrário, croqui simples visto de cima', null, null, null, null, null, 32),
  ('evi-01', 'evidencia', 'Evidências obrigatórias', 'Planta baixa e/ou croqui do ambiente', null, null, null, null, null, 33),
  ('evi-02', 'evidencia', 'Evidências obrigatórias', 'Fotos gerais da sala', null, null, null, null, null, 34),
  ('evi-03', 'evidencia', 'Evidências obrigatórias', 'Fotos das Portas e Janelas', null, null, null, null, null, 35),
  ('evi-04', 'evidencia', 'Evidências obrigatórias', 'Fotos das tomadas e pontos elétricos', null, null, null, null, null, 36),
  ('evi-05', 'evidencia', 'Evidências obrigatórias', 'Fotos, fichas técnicas ou outros arquivos relacionados ao mobiliário', null, null, null, null, null, 37),
  ('evi-06', 'evidencia', 'Evidências obrigatórias', 'Vídeo de 1 a 2 minutos percorrendo todo o ambiente', null, null, null, null, null, 38),
  ('par-01', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Dimensões do ambiente', null, null, null, null, null, 39),
  ('par-02', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Circulação', null, null, null, null, null, 40),
  ('par-03', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Iluminação', null, null, null, null, null, 41),
  ('par-04', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Ventilação / climatização', null, null, null, null, null, 42),
  ('par-05', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Instalações elétricas', null, null, null, null, null, 43),
  ('par-06', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Internet / conectividade', null, null, null, null, null, 44),
  ('par-07', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Mobiliário', null, null, null, null, null, 45),
  ('par-08', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Armazenamento', null, null, null, null, null, 46),
  ('par-09', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Área para máquinas', null, null, null, null, null, 47),
  ('par-10', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Organização para trabalho em grupos', null, null, null, null, null, 48),
  ('par-11', 'parecer_ambiente', 'Parecer técnico do ambiente', 'Adequações gerais recomendadas', null, null, null, null, null, 49),
  ('reu-01', 'reutilizavel', 'Máquina digital', 'Impressora 3D', 'Impressora 3D Bambu Lab A1 Combo', 1.0, 'unidade', 'https://www.3dcuritiba.com.br/impressora3dbambulaba1combo', 5299.0, 50),
  ('reu-02', 'reutilizavel', 'Máquina digital', 'Balança digital eletrônica', 'Caga máxima 50kg, precisão 1g [compra internacional - Mercado Livre]', 1.0, 'unidade', 'https://meli.la/1f9RNEJ', 160.0, 51),
  ('reu-03', 'reutilizavel', 'Máquina manual', 'Furadeira/Parafusadeira', 'Furadeira e Parafusadeira à Bateria 12V BIVOLT PFV 012 com Kit de Brocas e Bits VONDER', 1.0, 'unidade', 'https://meli.la/28yE4gB', 216.31, 52),
  ('reu-04', 'reutilizavel', 'Ferramenta', 'Alicate universal', 'Alicate universal de aço 8 pol.', 1.0, 'unidade', 'https://meli.la/2xSQcVP', 41.44, 53),
  ('reu-05', 'reutilizavel', 'Ferramenta', 'Alicate de bico meia cano reto', 'Alicate Bico Meia Cana Reto com Cabo Isolado 6 Pol.', 1.0, 'unidade', 'https://meli.la/26mYKqu', 36.0, 54),
  ('reu-06', 'reutilizavel', 'Ferramenta', 'Alicate de corte diagonal', 'Alicate de corte diagonal 6 pol.', 1.0, 'unidade', 'https://meli.la/2AS556U', 38.61, 55),
  ('reu-07', 'reutilizavel', 'Ferramenta', 'Alicate furador', 'Alicate furador 9 pol. com 6 posições', 2.0, 'unidade', 'https://meli.la/2r8PNcd', 27.89, 56),
  ('reu-08', 'reutilizavel', 'Ferramenta', 'Alicate de corte rente', 'Alicate Corte Diagonal rente 5"', 1.0, 'unidade', 'https://meli.la/2q8wWhB', 20.97, 57),
  ('reu-09', 'reutilizavel', 'Ferramenta', 'Kit de Broca para Furar e Parafusar, Maleta com 50 Peças', 'Jogo de brocas / bits para furar e parafusar com 50 peças - Black & Decker', 1.0, 'kit', 'https://meli.la/2z7CUTV', 284.9, 58),
  ('reu-10', 'reutilizavel', 'Ferramenta', 'Chave de fenda e philips', 'Jogo de chave de fenda / phillips com 10 peças', 1.0, 'kit', 'https://meli.la/1NUx22T', 67.26, 59),
  ('reu-11', 'reutilizavel', 'Ferramenta', 'Martelo de borracha', 'Martelo de borracha 55mm modelo americano', 1.0, 'unidade', 'https://meli.la/1dkyqTY', 35.0, 60),
  ('reu-12', 'reutilizavel', 'Ferramenta', 'Paquímetro', 'Paquímetro Digital 150mm 6 Pol. em Fibra de Carbono', 3.0, 'unidade', 'https://meli.la/19pzQRm', 27.15, 61),
  ('reu-13', 'reutilizavel', 'Ferramenta', 'Trena', 'Trena de 5m x 19mm com Trava', 6.0, 'unidade', 'https://meli.la/2kn7CvX', 19.0, 62),
  ('reu-14', 'reutilizavel', 'Ferramenta', 'Escala métrica de aço INOX', 'Escala Métrica de Aço Inox Graduada 300mm', 6.0, 'unidade', 'https://meli.la/2V65B5F', 16.37, 63),
  ('reu-15', 'reutilizavel', 'Ferramenta', 'Pistola de cola quente', 'Pistola Para Cola Quente Make 10W Pequena Bivolt', 12.0, 'unidade', 'https://meli.la/1iPwe4f', 28.95, 64),
  ('reu-16', 'reutilizavel', 'Ferramenta', 'Bússola', 'Bússola de orientação', 6.0, 'unidade', 'https://www.amazon.com.br/orienta%C3%A7%C3%A3o-caminhadas-acampamento-mochil%C3%A3o-sobreviv%C3%AAncia/dp/B0FKBV773K?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=125M4XAFW0TD6&dib=eyJ2IjoiMSJ9.ciVKHnNiUK5lvDdqlSzydp-tnTb4YIss7WvhuY2lY_bAIehz7i8N9zfsTZwGvcLbQRy37WJdjNe2buysDMeAkT8YuvoejiBZMzufWdbbVAhl1ufgD8Qs9z5F7wQ3Boq4hDJrfZHOrYCki49I5VYKgdgO6xzTl6VEZ2S4q9XFJ0zdg_rRUnlqC6j0tr6u5LFFJfLOr4-CaqmOH2H7jSy1YnT52F0mvSUYTU-Kaqo_0SEDGbTlHA2GJppWWukdY7uBrZQrtaLHRyINMra9nqOQSqU0kbaKWcgdpEXGCtgdTMI.Re5jFsuYfCkAnRWo-SJ_Puj8W4cD41FlcEvYnELUwR0&dib_tag=se&keywords=B%C3%BAssola&qid=1763489296&sprefix=b%C3%BAssola%2Caps%2C262&sr=8-16&th=1&linkCode=ll2&tag=wemake02-20&linkId=dbeecfc0c5045b9d421457dbeb50f2de&ref_=as_li_ss_tl', 17.19, 65),
  ('reu-17', 'reutilizavel', 'Ferramenta', 'Lanterna', 'Lanterna Tática Militar X900 Recarregável Police Com Zoom', 1.0, 'unidade', 'https://meli.la/1KS7rbb', 37.66, 66),
  ('reu-18', 'reutilizavel', 'Papelaria', 'Estilete de precisão', 'Estilete de precisão (kit 16 peças)', 1.0, 'kit', 'https://www.amazon.com.br/Estilete-Magn%C3%A9tico-Artesanato-Modelismo-Aeromodelismo/dp/B09D5MV56F?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=M9BPDMW8L4RS&keywords=Estilete+Tipo+Bisturi&qid=1675786857&sprefix=estilete+tipo+bisturi+%2Caps%2C170&sr=8-4&linkCode=ll2&tag=wemake02-20&linkId=ea9a2f066d7fe9498a018473b285bb3f&ref_=as_li_ss_tl', 17.0, 67),
  ('reu-19', 'reutilizavel', 'Papelaria', 'Base de corte', 'Base de corte multiuso a3', 6.0, 'unidade', 'https://meli.la/2j7pWkp', 49.89, 68),
  ('reu-20', 'reutilizavel', 'Papelaria', 'Grampeador', 'Grampeador de mesa até 20 folhas', 1.0, 'unidade', 'https://meli.la/2zpQp5x', 26.0, 69),
  ('reu-21', 'reutilizavel', 'Papelaria', 'Estilete 18mm', 'Estilete largo 18mm', 1.0, 'unidade', 'https://meli.la/32KbR53', 19.0, 70),
  ('reu-22', 'reutilizavel', 'Papelaria', 'Tesoura', 'Tesoura profissional 21cm', 4.0, 'kit', 'https://meli.la/1MbGDMm', 28.13, 71),
  ('reu-23', 'reutilizavel', 'Organização', 'Bandeja organizadora', 'Bandeja Plástica Retangular Bioprátika 3 L (kit 5 unid)', 2.0, 'kit', 'https://meli.la/31GBbgn', 78.99, 72),
  ('reu-24', 'reutilizavel', 'Eletrônica', 'Ferro de solda', 'Ferro De Solda 40w 220v com suporte', 6.0, 'unidade', 'https://meli.la/1uPT573', 28.13, 73),
  ('reu-25', 'reutilizavel', 'Eletrônica', 'Multimetro digital', 'Multímetro Digital Dt-830 - Brasfort', 1.0, 'unidade', 'https://meli.la/2JohQEf', 30.88, 74),
  ('reu-26', 'reutilizavel', 'Eletrônica', 'Kit de robótica educacional Arduino', 'Microcontrolador Nano, servomotores, sensores, atuadores, protoboard, shields e fonte de energia', 10.0, 'kit', null, 500.0, 75),
  ('reu-27', 'reutilizavel', 'Eletrônica', 'Terceira mão de solda', 'Suporte Terceira Mão com Lupa e Garras Jacaré', 1.0, 'unidade', 'https://meli.la/2V3p8TJ', 46.0, 76),
  ('reu-28', 'reutilizavel', 'Eletrônica', 'Alicate decapador', 'Alicate cortador e desencapador de cabos', 1.0, 'unidade', 'https://meli.la/1WJg5uU', 24.0, 77),
  ('reu-29', 'reutilizavel', 'Eletrônica', 'Fios garra de jacaré', 'Fios garra de jacaré 50cm (kit 10 unid.)', 5.0, 'pacote', 'https://www.eletrogate.com/cabo-garra-jacare-x10-unidades?utm_source=Site&utm_medium=GoogleMerchant&utm_campaign=GoogleMerchant&gclid=CjwKCAiA55mPBhBOEiwANmzoQlo1Cxz3vN5T3ATXBT3s3Lhkczb7xnByWQJwoaptQ3geTT0lD6WQ0hoC5PkQAvD_BwE', 12.5, 78),
  ('reu-30', 'reutilizavel', 'Eletrônica', 'Montagem LED + Resistor Pré-cablado', 'Kit 50 peças de LED + Resistor com suporte', 1.0, 'kit', 'https://pt.aliexpress.com/item/1005008510660133.html?spm=a2g0o.order_list.order_list_main.5.42f3caa49hCHGc&gatewayAdapt=glo2bra', 52.0, 79),
  ('reu-31', 'reutilizavel', 'Eletrônica', 'Suporte para bateria 9V', 'Suporte para Bateria 9V com Tampa + Botão ON/OFF', 8.0, 'unidade', 'https://www.filipeflop.com/produto/suporte-para-bateria-9v-com-chave-liga-desliga/', 10.9, 80),
  ('reu-32', 'reutilizavel', 'Eletrônica', 'Suporte para pilha AA', 'Suporte Box 2 Pilhas Aa Tampa E Chave Liga/desliga', 8.0, 'unidade', 'https://meli.la/2zFXPHy', 13.8, 81),
  ('reu-33', 'reutilizavel', 'Eletrônica', 'Motor DC', 'Motor DC 3-6V', 20.0, 'unidade', 'https://www.eletrogate.com/mini-motor-dc', 2.9, 82),
  ('reu-34', 'reutilizavel', 'Eletrônica', 'Carregador de pilhas e bateria', 'Carregador De Pilha Aa Aaa Bateria 9v Recarregável Bivolt', 2.0, 'unidade', 'https://meli.la/2DUYcNf', 49.99, 83),
  ('reu-35', 'reutilizavel', 'Eletrônica', 'Pilhas recarregáveis', 'Kit 4 Pilhas AA 4700mah Recarregaveis', 1.0, 'kit', 'https://meli.la/252P8Vv', 71.56, 84),
  ('reu-36', 'reutilizavel', 'Eletrônica', 'Bateria 9v recarregável', 'Caixa C/10 Baterias Recarregável 9v Knup 9v 450mah', 1.0, 'kit', 'https://meli.la/1oXqY91', 242.12, 85),
  ('reu-37', 'reutilizavel', 'Informática', 'Notebooks i3 SSD 256gb', 'Notebook Intel Core i3 8GB 256GB SSD - 15,6” Full HD Windows 11', 10.0, 'unidade', 'https://meli.la/17xx922', 3849.9, 86),
  ('reu-38', 'reutilizavel', 'Informática', 'Mouse', 'Mouse com fio', 20.0, 'unidade', 'https://meli.la/1EXywVC', 32.25, 87),
  ('reu-39', 'reutilizavel', 'Mídias', 'TV ou projetor', 'Smart TV 65" Samsung 4K UHD Crystal UHD', 1.0, 'unidade', 'https://meli.la/2q5Sgi4', 3800.0, 88),
  ('reu-40', 'reutilizavel', 'Segurança', 'Luva de segurança', 'Kit 12 Pares Luva Tricotada Pigmentada Algodão Malha Epi Ca', 3.0, 'kit', 'https://meli.la/2qmyrPu', 62.9, 89),
  ('con-01', 'consumivel', 'Fixador', 'Abraçadeira de nylon 10cm', 'Abraçadeira de nylon 25cm com 100 peças', 1.0, 'pacote', 'https://meli.la/13FpSYH', 31.49, 90),
  ('con-02', 'consumivel', 'Fixador', 'Clips galvanizados', 'Clips de papel galvanizado n2/0 500g', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/clips-nr-2-0-galvanizado-lata-c-500g-spiral-pt-1-un/195426', 19.9, 91),
  ('con-03', 'consumivel', 'Fixador', 'Clips aglutinantes', 'Prendedor de papel 32mm com 12 unidades', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/prendedor-de-papel-32mm-300132-easy-office-pt-12-un/374764', 15.9, 92),
  ('con-04', 'consumivel', 'Fixador', 'Grampos', 'Grampo p/grampeador 26/6 galvanizado com 5000 unidades', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/grampo-p-grampeador-26-6-galvanizado-easy-office-cx-5000-un/377075', 8.9, 93),
  ('con-05', 'consumivel', 'Fixador', 'Kit parafusos, arruelas e porcas', 'Kit Parafuso Phillips Porca Arruela 1/8 5/32 3/16 1/4 600pçs', 1.0, 'pacote', 'https://meli.la/1zpereg', 58.1, 94),
  ('con-06', 'consumivel', 'Fixador', 'Colchetes latonados', 'Colchete Latonado, Bacchi, Nº 4, 2.2 cm, Caixa com 144 Unidades', 2.0, 'pacote', 'https://meli.la/1CJtEKZ', 22.9, 95),
  ('con-07', 'consumivel', 'Adesivos', 'Fita adesiva dupla face de papel', 'Fita Dupla Face de Papel, 12mmx30m, Adelbras com 6 unidades', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/fita-adesiva-dupla-face-pp-12mm-x-30m-transparente-nao-tecido-tectape-eb-6-un/305203', 37.5, 96),
  ('con-08', 'consumivel', 'Adesivos', 'Fita Adesiva Reforçada 25m', 'Vonder, Fita Adesiva Reforçada, 50 Mm X 25 M Prata.', 1.0, 'unidade', 'https://meli.la/1eQrZN6', 29.9, 97),
  ('con-09', 'consumivel', 'Adesivos', 'Fita adesiva transparente grossa', 'Kit 4 Fitas Adesivas  Empacotamento 45mm x 45m Transparente', 1.0, 'kit', 'https://meli.la/2JJ7wcR', 30.0, 98),
  ('con-10', 'consumivel', 'Adesivos', 'Fita adesiva transparente fina', 'Fita Adesiva Transparente para Empacotamento leve 12mmx30m, com 10 unidades', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/fita-adesiva-pp-transparente-super-clear-12mm-x-30m-stick-tape-pt-10-un/305563', 17.9, 99),
  ('con-11', 'consumivel', 'Adesivos', 'Fita crepe fina', 'Fita Crepe imobiliária/uso geral, 18mmx50m com 6 unidades', 8.0, 'pacote', 'https://meli.la/1wE47CE', 39.9, 100),
  ('con-12', 'consumivel', 'Adesivos', 'Fita crepe larga', 'Fita Crepe 3M 101LA - 48 mm x 50 m com 2 unidades', 3.0, 'pacote', 'https://meli.la/2wrpYDU', 35.0, 101),
  ('con-13', 'consumivel', 'Adesivos', 'Cola branca lavável', 'Cola branca 110g lavável', 1.0, 'unidade', 'https://www.kalunga.com.br/prod/cola-branca-110g-lavavel-tenaz-henkel-un-1-un/214599', 10.2, 102),
  ('con-14', 'consumivel', 'Adesivos', 'Cola bastão', 'Cola em bastão 21g com 12 unidades', 1.0, 'pacote', 'https://meli.la/1G46ZRC', 22.0, 103),
  ('con-15', 'consumivel', 'Adesivos', 'Refil de cola quente fina', 'Refil de cola quente fina 1kg super transparente', 5.0, 'pacote', 'https://meli.la/1BNLYPw', 38.5, 104),
  ('con-16', 'consumivel', 'Adesivos', 'Fita isolante', 'Kit 10 unidades de Fita Isolante - 18 mm x 10 m', 1.0, 'kit', 'https://meli.la/25QdNBn', 65.0, 105),
  ('con-17', 'consumivel', 'Adesivos', 'Fita condutiva', 'Fita de Cobre Adesiva 6mm x 5m', 10.0, 'unidade', 'https://www.usinainfo.com.br/fita-de-cobre/fita-de-cobre-adesiva-para-blindagem-e-protecao-6mm-x-5m-8026.html', 19.85, 106),
  ('con-18', 'consumivel', 'Madeira', 'Palitos de picolé', 'Palitos de picolé Artesanato Ponta Redonda 11,5cm com 3000 unidades', 1.0, 'pacote', 'https://meli.la/1eUEaYg', 140.7, 107),
  ('con-19', 'consumivel', 'Madeira', 'Palito abaixador de língua', 'Palito Artesanato Abaixador De Língua Madeira 500 Unidades', 1.0, 'pacote', 'https://meli.la/2W9Pvsv', 45.5, 108),
  ('con-20', 'consumivel', 'Madeira', 'Palito de churrasco', 'Espetos De Bambu Para Churrasco 25 Cm 4 Mm - 2000 Unidades', 1.0, 'pacote', 'https://meli.la/1UuGcLd', 76.82, 109),
  ('con-21', 'consumivel', 'Madeira', 'Palito de dente', 'Palito De Dente Caixinha Com 100 Unidades', 1.0, 'pacote', 'https://mercado.carrefour.com.br/palito-de-dente-theoto-100-unidades-5221285/p', 1.09, 110),
  ('con-22', 'consumivel', 'Fluido', 'Seringa descartável 20ml', 'Seringa Descartável Luer Lock 20ml com 50un. Descarpack', 4.0, 'pacote', 'https://meli.la/1Ws16rp', 53.83, 111),
  ('con-23', 'consumivel', 'Fluido', 'Tubo transparente', 'Mangueira / Tubo PU 6 mm x 1,00 Em Poliuretano Transparente', 40.0, 'metros', 'https://www.conexopecas.com.br/produtos/ver/888/mangueira-tubo-pu-6-mm-x-100-em-poliuretano-transparente-preco-por-metro#.YuWw5HbMKUl', 1.96, 112),
  ('con-24', 'consumivel', 'Fluido', 'Mangueira de silicone', 'Mangueira De Silicone Para Aquários 10 Metros', 3.0, 'unidade', 'https://produto.mercadolivre.com.br/MLB-1518343089-mangueira-de-silicone-para-aquarios-10-metros-compressores-_JM#position=3&search_layout=grid&type=item&tracking_id=9b0f80f1-3d6b-4241-8f2a-3f2454298982', 27.31, 113),
  ('con-25', 'consumivel', 'Fluido', 'Canudos plásticos 5mm', 'Canudos Plásticos para Refrigerante (fino) com 100 unid', 10.0, 'pacote', 'https://meli.la/1WtLr21', 13.78, 114),
  ('con-26', 'consumivel', 'Fluido', 'Canudos plásticos 10mm', 'Canudos Plásticos para shake (grosso) com 100 unid', 6.0, 'pacote', 'https://meli.la/2HaFp8N', 25.0, 115),
  ('con-27', 'consumivel', 'Diverso', 'Limpador de tubo', 'Limpador De tubo / Cachimbo Colorido 10 Cores 30cm X 6mm 100 Unid', 2.0, 'pacote', 'https://meli.la/1PyhkXf', 32.0, 116),
  ('con-28', 'consumivel', 'Diverso', 'Bolas de gude', 'Pacote 200 unid de bolas de gude de vidro', 1.0, 'pacote', 'https://meli.la/1ko7FjJ', 31.54, 117),
  ('con-29', 'consumivel', 'Diverso', 'Copo de papel', 'Copo de papel descartável 210ml com 50 unidades', 10.0, 'pacote', 'https://www.kalunga.com.br/prod/copo-de-papel-descartavel-210ml-azevedo-pt-50-un/235026', 24.4, 118),
  ('con-30', 'consumivel', 'Diverso', 'Copo americano', 'Copos americanos vermelho de maior resistencia 400ml com 100 unid.', 2.0, 'pacote', 'https://meli.la/1AFjHnF', 70.99, 119),
  ('con-31', 'consumivel', 'Diverso', 'Copo descartável', 'Copo Descartável branco 200ml com 100und', 2.0, 'pacote', 'https://www.mercadolivre.com.br/copo-200ml-descartavel-transparente---100-unidades/up/MLBU1746577431#polycard_client=search-nordic&search_layout=grid&position=11&type=product&tracking_id=9e56db50-ad0f-46c9-bef0-23d238287671&wid=MLB4495357506&sid=search', 9.2, 120),
  ('con-32', 'consumivel', 'Diverso', 'Saco Zip lock', 'Saco Ziplock N7 14x20cm com 100 unidades', 1.0, 'pacote', 'https://meli.la/25872VZ', 29.99, 121),
  ('con-33', 'consumivel', 'Diverso', 'Filtro de café', 'Filtro De Papel De Café Melitta Original 102 30 Unidades', 2.0, 'pacote', 'https://mercado.carrefour.com.br/filtro-descartavel-de-cafe-102-melitta-com-30-unidades-8353867/p', 4.99, 122),
  ('con-34', 'consumivel', 'Diverso', 'Prendedor de roupa', 'Prendedor Pregador De Roupa Madeira Bambu Cor Bamboo 20 unidades', 6.0, 'kit', 'https://meli.la/11mKtot', 18.46, 123),
  ('con-35', 'consumivel', 'Diverso', 'Algodão em disco', 'Algodao Disco 35G 60Unid.', 2.0, 'pacote', 'https://amzn.to/46BA4AO', 9.9, 124),
  ('con-36', 'consumivel', 'Diverso', 'Colher descartável', 'Colher descartável reforçada 100 unid', 1.0, 'pacote', 'https://meli.la/18oHMVh', 29.9, 125),
  ('con-37', 'consumivel', 'Diverso', 'Sacolas de lixo', 'Sacolas de lixo preto 15 litros com 100unid', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/saco-para-lixo-15lt-preto-basico-dover-rl-100-un/668232?cq_src=google_ads&cq_cmp=17963792319&cq_con=&cq_term=&cq_med=pla&cq_plac=&cq_net=x&cq_pos=&cq_plt=gp&pcID=3921&gad_source=1&gclid=Cj0KCQjw7Py4BhCbARIsAMMx-_LNX2-Ab5SjziOEttJpayRginJc79QyeBGoOsbKSUbO3fd_KhZJRj4aAt1FEALw_wcB', 10.0, 126),
  ('con-38', 'consumivel', 'Diverso', 'Rolo de Papel alumínio', 'Rolo De Papel Alumínio Cozinha 30 Cm X 4 M 25 unidades', 1.0, 'kit', 'https://meli.la/1jrLrQh', 98.39, 127),
  ('con-39', 'consumivel', 'Diverso', 'Bolas de algodão', 'Pacote de bolas de algodão - 50g com 3 unidades', 2.0, 'kit', 'https://www.mercadolivre.com.br/kit-3-algodao-bolas-bebe-sem-perfume-limpeza-macio-apolo/up/MLBU3040679497#polycard_client=search-nordic&search_layout=stack&position=9&type=product&tracking_id=bbc81d62-8703-4434-a59d-5772f042dd66&wid=MLB3989936093&sid=search', 33.95, 128),
  ('con-40', 'consumivel', 'Diverso', 'Barbante', 'Barbante 8 fios 80% algodão c/305 mts', 1.0, 'unidade', 'https://www.kalunga.com.br/prod/barbante-8-fios-80%20-algodao-c-305-mts-euroroma-pt-1-un/014781', 14.4, 129),
  ('con-41', 'consumivel', 'Diverso', 'Linha de pesca trançada', 'Linha De Multifilamento Dalima 030mm 22kg 100mt 8 Fio Pe', 1.0, 'unidade', 'https://meli.la/1Zk6Zx3', 29.99, 130),
  ('con-42', 'consumivel', 'Diverso', 'Linha de costura', 'Linha preta de costura (1300m)', 1.0, 'unidade', 'https://www.bazarhorizonte.com.br/linha-para-costura-reta-120-triche---1300-metros-039491/p', 4.49, 131),
  ('con-43', 'consumivel', '3D', 'Filamento 3D - Azul', 'Filamento 3D PLA 1kg - Azul', 1.0, 'unidade', 'https://www.3dcuritiba.com.br/filamento-pla-azul-175mm-3n3', 105.44, 132),
  ('con-44', 'consumivel', '3D', 'Filamento 3D - Branco', 'Filamento 3D PLA 1kg - Branco', 1.0, 'unidade', 'https://www.3dcuritiba.com.br/filamento-pla-175mm-3n3', 105.44, 133),
  ('con-45', 'consumivel', '3D', 'Filamento 3D - Preto', 'Filamento 3D PLA 1kg - Preto', 1.0, 'unidade', 'https://www.3dcuritiba.com.br/filamento-pla-preto-175mm-3n3', 105.44, 134),
  ('con-46', 'consumivel', '3D', 'Filamento 3D - Amarelo', 'Filamento 3D PLA 1kg - Amarelo', 1.0, 'unidade', 'https://www.3dcuritiba.com.br/filamento-pla-amarelo-175mm-3n3', 105.44, 135),
  ('con-47', 'consumivel', '3D', 'Filamento 3D - Vermelho', 'Filamento 3D PLA 1kg - Vermelho', 1.0, 'unidade', 'https://www.3dcuritiba.com.br/filamento-pla-vermelho-175mm-3n3', 105.44, 136),
  ('con-48', 'consumivel', '3D', 'Filamento 3D - Verde', 'Filamento 3D PLA 1kg - Verde', 1.0, 'unidade', 'https://www.3dcuritiba.com.br/filamento-pla-verde-fluo-175mm-3n3', 105.44, 137),
  ('con-49', 'consumivel', '3D', 'Filamento 3D - Laranja', 'Filamento 3D PLA 1kg - Laranja', 1.0, 'unidade', 'https://www.3dcuritiba.com.br/filamento-pla-3nmax-175mm-1kg-laranja', 116.55, 138),
  ('con-50', 'consumivel', 'Ímã', 'Ímãs de Neodímio', 'Kit 50 unid Ímã de neodímio 10x4mm - N42', 3.0, 'pacote', 'https://meli.la/1rMMdYa', 99.9, 139),
  ('con-51', 'consumivel', 'Ímã', 'Ímã anel', 'Anel de Ferrite Ø55 x Ø24 x 10 mm', 20.0, 'unidade', 'https://www.casadoima.com.br/produto/ima-ferrite-anel-55x24x10-mm-137', 3.7, 140),
  ('con-52', 'consumivel', 'Ímã', 'Ímã bloco', 'Bloco de Ferrite 6,5 x 8 x 20 mm', 20.0, 'unidade', 'https://www.casadoima.com.br/bloco-de-ferrite-6-5-x-8-x-20-mm', 2.1, 141),
  ('con-53', 'consumivel', 'Papelaria', 'Resma de papel A4', 'Papel Sulfite Oficio A4 Resma Com 500 Folhas Allmax Multiuso', 3.0, 'pacote', 'https://meli.la/2gpJ9EU', 34.99, 142),
  ('con-54', 'consumivel', 'Papelaria', 'Elástico látex n. 18', 'Elástico látex especial amarelo n.18 c/ 1200 unidades', 1.0, 'pacote', 'https://meli.la/13QsPCo', 33.21, 143),
  ('con-55', 'consumivel', 'Papelaria', 'Chapa de papelão branca', '25 Chapas De Papelão Face Branco 87cm X 43cm Espessura 3mm', 1.0, 'pacote', 'https://meli.la/29uJpkf', 75.99, 144),
  ('con-56', 'consumivel', 'Papelaria', 'Placa de isopor', 'Placas de EPS (ísopor®) 1000 x 500 x 20mm', 1.0, 'unidade', 'https://www.kalunga.com.br/prod/placas-de-eps-isopor%C2%AE-20mm-isorecort-pt-1-un/441315', 19.0, 145),
  ('con-57', 'consumivel', 'Papelaria', 'Cartolina', 'Cartolina 150g 50x66 cores mistas com 10 unidades', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/cartolina-150g-50x66-cores-mistas-card-set-spiral-pt-10-un/501606', 13.2, 146),
  ('con-58', 'consumivel', 'Papelaria', 'Lápis grafite 8B', 'Lápis Grafite EcoLápis Castell 9000 8B Sextavado com 12 unidades', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/lapis-grafite-ecolapis-castell-9000-8b-sextavado-faber-castell-cx-12-un/413080', 39.2, 147),
  ('con-59', 'consumivel', 'Papelaria', 'Caneta hidrográfica', 'Caneta hidrográfica com 12 cores', 1.0, 'pacote', 'https://www.amazon.com.br/Canetinha-Estojo-Faber-Castell-15-0112CZF-Multicor/dp/B077J2FKQN?__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=23S0LD8Q09API&keywords=caneta%2Bhidrogr%C3%A1fica&qid=1697564756&sprefix=caneta%2Bhidrogr%C3%A1fica%2Bfaber%2Bcastell%2Caps%2C174&sr=8-5&th=&linkCode=ll2&tag=wemake02-20&linkId=2876dae40f0afb697df71db8e6c280f4&ref_=as_li_ss_tl', 13.99, 148),
  ('con-60', 'consumivel', 'Papelaria', 'Post-it', 'Bloco autoadesivo 76x76mm amarelo com 400 folhas 4 unid', 1.0, 'pacote', 'https://www.kalunga.com.br/prod/bloco-autoadesivo-76x76-amarelo-c-100fls-stick-note-pt-4-un/041582', 23.7, 149),
  ('con-61', 'consumivel', 'Eletrônico', 'LED azul', 'LED azul 5mm', 250.0, 'unidade', 'https://www.eletrogate.com/led-difuso-5mm-azul', 0.24, 150),
  ('con-62', 'consumivel', 'Eletrônico', 'LED amarelo', 'LED amarelo difuso 5mm', 250.0, 'unidade', 'https://www.eletrogate.com/led-difuso-5mm-amarelo', 0.15, 151),
  ('con-63', 'consumivel', 'Eletrônico', 'LED verde', 'LED verde 5mm', 250.0, 'unidade', 'https://www.eletrogate.com/led-difuso-5mm-verde', 0.2, 152),
  ('con-64', 'consumivel', 'Eletrônico', 'LED vermelho', 'LED vermelho 5mm', 250.0, 'unidade', 'https://www.eletrogate.com/led-difuso-5mm-vermelho', 0.19, 153),
  ('con-65', 'consumivel', 'Eletrônico', 'LED branco', 'LED branco 5mm', 250.0, 'unidade', 'https://www.eletrogate.com/led-difuso-5mm-branco', 0.24, 154),
  ('con-66', 'consumivel', 'Eletrônico', 'Bateria de 3V (moeda)', 'CR2032, Bateria de Litio 3V, pacote com 50 unidades', 10.0, 'pacote', 'https://meli.la/16WTcLv', 69.0, 155),
  ('con-67', 'consumivel', 'Eletrônico', 'Resistor 1kΩ', 'Resistor 1KΩ 1/4W com 10 Unidades', 10.0, 'pacote', 'https://www.eletrogate.com/resistor-1k-1-4w-10-unidades', 0.9, 156),
  ('con-68', 'consumivel', 'Eletrônico', 'Resistor 300Ω', 'Resistor 330Ω 1/4W com 10 Unidades', 10.0, 'pacote', 'https://www.eletrogate.com/resistor-330r-1-4w-10-unidades', 0.62, 157),
  ('con-69', 'consumivel', 'Eletrônico', 'Rolo de solda', 'Estanho em Fio, 1 mm, 40 x 60, com 250 G', 1.0, 'unidade', 'https://meli.la/1Cwpc3f', 100.0, 158),
  ('con-70', 'consumivel', 'Eletrônico', 'Buzzer 5V', 'Buzzer Ativo 5v', 20.0, 'unidade', 'https://www.eletrogate.com/buzzer-ativo-5v', 2.3, 159),
  ('con-71', 'consumivel', 'Eletrônico', 'Jumper macho/macho', 'Jumpers - Macho/Macho - 40 Unidades de 20cm', 8.0, 'pacote', 'https://www.eletrogate.com/jumpers-macho-macho-40-unidades-de-20-cm', 9.9, 160),
  ('con-72', 'consumivel', 'Eletrônico', 'Jumper macho/fêmea', 'Jumpers - Macho/Femea - 40 Unidades de 20cm', 4.0, 'pacote', 'https://www.eletrogate.com/jumpers-macho-femea-40-unidades-de-20-cm', 9.9, 161),
  ('con-73', 'consumivel', 'Eletrônico', 'Jumper fêmea/fêmea', 'Jumpers - Femea/Femea - 40 Unidades de 20cm', 4.0, 'pacote', 'https://www.eletrogate.com/jumpers-femea-femea-40-unidades-de-20-cm', 8.9, 162),
  ('con-74', 'consumivel', 'Segurança', 'Óculos EPI', 'Óculos De Proteção Segurança Epi Incolor Transparente 10 unid', 3.0, 'kit', 'https://produto.mercadolivre.com.br/MLB-2692355754-kit-10-oculos-de-proteco-rj-imperial-seguranca-epi-obra-_JM#position%3D53%26search_layout%3Dgrid%26type%3Ditem%26tracking_id%3D9c8f37ac-476d-4d79-9d98-c45543365f9f', 37.43, 163),
  ('geral.situacao', 'geral', 'Parecer geral', 'Situação geral do ambiente', null, null, null, null, null, 164),
  ('geral.reutilizaveis', 'geral', 'Parecer geral', 'Recursos reutilizáveis', null, null, null, null, null, 165),
  ('geral.consumiveis', 'geral', 'Parecer geral', 'Recursos consumíveis', null, null, null, null, null, 166),
  ('geral.memorial', 'geral', 'Parecer geral', 'Memorial arquitetônico', null, null, null, null, null, 167),
  ('geral.obs', 'geral', 'Parecer geral', 'Recomendações e observações finais da We Make', null, null, null, null, null, 168),
  ('geral.arquitetura', 'geral', 'Parecer geral', 'Encaminhamento ao estúdio de arquitetura', null, null, null, null, null, 169)
on conflict (item_key) do update set
  secao = excluded.secao, categoria = excluded.categoria, titulo = excluded.titulo,
  especificacao = excluded.especificacao, qtd_recomendada = excluded.qtd_recomendada,
  unidade = excluded.unidade, referencia = excluded.referencia, valor_ref = excluded.valor_ref, ordem = excluded.ordem;
