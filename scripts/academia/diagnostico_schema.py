"""
Lê a planilha oficial "3.1 Diagnostico_Espaco_Maker_We_Make_2027.xlsx" (pasta Docs Diagramados) e gera:
  1) src/content/academia/diagnostico-schema.json   → perguntas do formulário externo e do parecer
  2) academia_diagnostico.sql                       → banco relacional completo (tabelas, funções,
                                                      views) com o catálogo de itens já carregado

Rodar de novo sempre que a planilha mudar.
"""
import json
import os
import sys
import warnings

import openpyxl

warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

ROOT = r'C:\repositorio\wemake\projetos_wemake\app_comercial_We Make'
SRC = os.path.join(ROOT, 'Academia_wemake', 'Docs Diagramados', '3.1 Diagnostico_Espaco_Maker_We_Make_2027.xlsx')
OUT_JSON = os.path.join(ROOT, 'src', 'content', 'academia', 'diagnostico-schema.json')
OUT_SQL = os.path.join(ROOT, 'academia_diagnostico.sql')


def s(v):
    if v is None:
        return ''
    if isinstance(v, float) and v == int(v):
        v = int(v)
    return str(v).strip()


wb = openpyxl.load_workbook(SRC)
ws = wb['Sala e Evidências']

OPCOES = {
    'O ambiente será exclusivo para a We Make?': ['Sim', 'Não'],
    'O espaço já possui mobiliário?': ['Sim', 'Não', 'Parcialmente'],
    'O espaço já possui equipamentos tecnológicos/maker?': ['Sim', 'Não', 'Parcialmente'],
}
ambiente = []
for i, r in enumerate(range(5, 10), start=1):
    q = s(ws.cell(r, 1).value)
    item = {'key': f'amb-{i:02d}', 'pergunta': q}
    if q in OPCOES:
        item.update({'tipo': 'opcao', 'opcoes': OPCOES[q], 'detalhe': True})
    elif 'Quantidade' in q:
        item['tipo'] = 'numero'
    else:
        item['tipo'] = 'texto'
    ambiente.append(item)

medidas = [{'key': f'med-{i:02d}', 'categoria': s(ws.cell(r, 1).value), 'info': s(ws.cell(r, 2).value)}
           for i, r in enumerate(range(13, 33), start=1)]
# Evidências obrigatórias: lista atualizada pelo Dênis (outubro/2026), no lugar das 11 da planilha.
EVIDENCIAS_OBRIGATORIAS = [
    'Planta baixa e/ou croqui do ambiente',
    'Fotos gerais da sala',
    'Fotos das Portas e Janelas',
    'Fotos das tomadas e pontos elétricos',
    'Fotos, fichas técnicas ou outros arquivos relacionados ao mobiliário',
    'Vídeo de 1 a 2 minutos percorrendo todo o ambiente',
]
evidencias = [{'key': f'evi-{i:02d}', 'nome': n} for i, n in enumerate(EVIDENCIAS_OBRIGATORIAS, start=1)]
parecer_ambiente = [{'key': f'par-{i:02d}', 'item': s(ws.cell(r, 1).value)} for i, r in enumerate(range(51, 62), start=1)]


def recursos(nome_aba, prefixo):
    w = wb[nome_aba]
    itens, n = [], 0
    for r in range(5, w.max_row + 1):
        if not w.cell(r, 2).value:
            continue
        n += 1
        valor = w.cell(r, 7).value
        itens.append({
            'key': f'{prefixo}-{n:02d}',
            'categoria': s(w.cell(r, 1).value),
            'item': s(w.cell(r, 2).value),
            'spec': s(w.cell(r, 3).value),
            'qtd': float(w.cell(r, 4).value or 0),
            'unid': s(w.cell(r, 5).value),
            'ref': s(w.cell(r, 6).value),
            'valor': float(valor) if isinstance(valor, (int, float)) else 0.0,
        })
    return itens


# Briefing da sala (seção 2 do documento do Dênis): perguntas que não vêm da planilha.
# tipo: opcao (uma escolha) | multi (várias escolhas) | longo (resposta longa)
SIM_NAO_INDEFINIDO = ['Sim', 'Não', 'Ainda não está definido']
BRIEFING = [
    {'key': 'cli-01', 'grupo': '2.2 Climatização', 'tipo': 'multi',
     'pergunta': 'O ambiente possui atualmente algum sistema de climatização?',
     'opcoes': ['Ar-condicionado', 'Ventilador', 'Não possui']},
    {'key': 'cli-02', 'grupo': '2.2 Climatização', 'tipo': 'opcao',
     'pergunta': 'Se o ambiente não possui climatização, a escola pretende instalar algum equipamento?',
     'opcoes': SIM_NAO_INDEFINIDO},
    {'key': 'cli-03', 'grupo': '2.2 Climatização', 'tipo': 'longo',
     'pergunta': 'Se sim, qual equipamento pretende instalar?'},
    {'key': 'cli-04', 'grupo': '2.2 Climatização', 'tipo': 'longo',
     'pergunta': 'Se possível, informe também o modelo, capacidade ou especificações do equipamento que está sendo considerado.'},
    {'key': 'mob-01', 'grupo': '2.3 Mobiliário', 'tipo': 'opcao',
     'pergunta': 'A escola pretende aproveitar algum mobiliário já existente no ambiente?',
     'opcoes': SIM_NAO_INDEFINIDO},
    {'key': 'mob-02', 'grupo': '2.3 Mobiliário', 'tipo': 'longo',
     'pergunta': 'Se sim, quais móveis pretende manter e utilizar na Sala Maker?',
     'dica': 'Exemplos: mesas, cadeiras, bancadas, armários, estantes, gaveteiros, móveis com pia etc.'},
    {'key': 'mob-03', 'grupo': '2.3 Mobiliário', 'tipo': 'longo',
     'pergunta': 'Quais informações sobre esse mobiliário a escola consegue fornecer?'},
]

listas = wb['Listas']
schema = {
    'briefing': BRIEFING,
    'ambiente': ambiente,
    'medidas': medidas,
    'evidencias': evidencias,
    'reutilizaveis': recursos('Recursos Reutilizáveis', 'reu'),
    'consumiveis': recursos('Recursos Consumíveis', 'con'),
    'parecerAmbiente': parecer_ambiente,
    'listas': {
        'possui': [s(listas.cell(r, 1).value) for r in range(2, 8) if listas.cell(r, 1).value],
        'parecer': [s(listas.cell(r, 2).value) for r in range(2, 8) if listas.cell(r, 2).value],
        'acao': [s(listas.cell(r, 3).value) for r in range(2, 8) if listas.cell(r, 3).value],
    },
}
# Nomes ajustados pela We Make (outubro/2026)
RENOMEAR = {'reu-39': 'TV ou projetor', 'reu-37': 'Notebooks ou desktops'}
# Itens que saíram do diagnóstico (a chave não é reaproveitada)
EXCLUIR = {'reu-30'}  # Montagem LED + Resistor Pré-cablado
for _r in schema['reutilizaveis']:
    if _r['key'] in RENOMEAR:
        _r['item'] = RENOMEAR[_r['key']]
schema['reutilizaveis'] = [_r for _r in schema['reutilizaveis'] if _r['key'] not in EXCLUIR]

os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
with open(OUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(schema, f, ensure_ascii=False, indent=1)


# ───────────────────────────── catálogo → INSERTs ─────────────────────────────
def q(v):
    return "'" + str(v).replace("'", "''") + "'"


linhas = []
ordem = 0


def add(key, secao, categoria, titulo, spec='', qtd=None, unid='', ref='', valor=None):
    global ordem
    ordem += 1
    linhas.append('(' + ', '.join([
        q(key), q(secao), q(categoria) if categoria else 'null', q(titulo),
        q(spec) if spec else 'null',
        'null' if qtd is None else repr(qtd),
        q(unid) if unid else 'null',
        q(ref) if ref else 'null',
        'null' if valor is None else repr(valor),
        str(ordem),
    ]) + ')')


for a in ambiente:
    add(a['key'], 'ambiente', 'Caracterização do ambiente', a['pergunta'])
for b in BRIEFING:
    add(b['key'], 'ambiente', b['grupo'], b['pergunta'])
for m in medidas:
    add(m['key'], 'medida', m['categoria'], m['info'])
for e in evidencias:
    add(e['key'], 'evidencia', 'Evidências obrigatórias', e['nome'])
for p in parecer_ambiente:
    add(p['key'], 'parecer_ambiente', 'Parecer técnico do ambiente', p['item'])
for r in schema['reutilizaveis']:
    add(r['key'], 'reutilizavel', r['categoria'], r['item'], r['spec'], r['qtd'], r['unid'], r['ref'], r['valor'])
for r in schema['consumiveis']:
    add(r['key'], 'consumivel', r['categoria'], r['item'], r['spec'], r['qtd'], r['unid'], r['ref'], r['valor'])
for k, t in [('geral.situacao', 'Situação geral do ambiente'), ('geral.reutilizaveis', 'Recursos reutilizáveis'),
             ('geral.consumiveis', 'Recursos consumíveis'), ('geral.memorial', 'Memorial arquitetônico'),
             ('geral.obs', 'Recomendações e observações finais da We Make'),
             ('geral.arquitetura', 'Encaminhamento ao estúdio de arquitetura')]:
    add(k, 'geral', 'Parecer geral', t)

CATALOGO = (
    'insert into public.academia_diag_itens\n'
    '  (item_key, secao, categoria, titulo, especificacao, qtd_recomendada, unidade, referencia, valor_ref, ordem)\nvalues\n  '
    + ',\n  '.join(linhas)
    + '\non conflict (item_key) do update set\n'
    '  secao = excluded.secao, categoria = excluded.categoria, titulo = excluded.titulo,\n'
    '  especificacao = excluded.especificacao, qtd_recomendada = excluded.qtd_recomendada,\n'
    '  unidade = excluded.unidade, referencia = excluded.referencia, valor_ref = excluded.valor_ref, ordem = excluded.ordem;\n'
)

SQL = r'''-- ════════════════════════════════════════════════════════════════════════════
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
@@CATALOGO@@'''

with open(OUT_SQL, 'w', encoding='utf-8') as f:
    f.write(SQL.replace('@@CATALOGO@@', CATALOGO))

print({k: (len(v) if isinstance(v, list) else v) for k, v in schema.items()}, 'itens no catálogo:', len(linhas))
