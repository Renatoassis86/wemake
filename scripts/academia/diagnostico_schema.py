"""
Gera src/content/academia/diagnostico-schema.json a partir da planilha oficial
"3.1 Diagnostico_Espaco_Maker_We_Make_2027.xlsx" (pasta Docs Diagramados).

O JSON descreve as perguntas do Diagnóstico do Espaço Maker que a escola responde na
página externa e os campos de parecer que a We Make preenche internamente.
Rodar de novo sempre que a planilha mudar.
"""
import json
import os
import re
import sys
import warnings

import openpyxl

warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

SRC = r'C:\repositorio\wemake\projetos_wemake\app_comercial_We Make\Academia_wemake\Docs Diagramados\3.1 Diagnostico_Espaco_Maker_We_Make_2027.xlsx'
OUT = r'C:\repositorio\wemake\projetos_wemake\app_comercial_We Make\src\content\academia\diagnostico-schema.json'


def s(v):
    if v is None:
        return ''
    if isinstance(v, float) and v == int(v):
        v = int(v)
    return str(v).strip()


wb = openpyxl.load_workbook(SRC)

# ── Caracterização do ambiente ────────────────────────────────────────────────
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
        item['tipo'] = 'opcao'
        item['opcoes'] = OPCOES[q]
        item['detalhe'] = True
    elif 'Quantidade' in q:
        item['tipo'] = 'numero'
    else:
        item['tipo'] = 'texto'
    ambiente.append(item)

# ── Checklist de medidas ──────────────────────────────────────────────────────
medidas = []
for i, r in enumerate(range(13, 33), start=1):
    medidas.append({'key': f'med-{i:02d}', 'categoria': s(ws.cell(r, 1).value), 'info': s(ws.cell(r, 2).value)})

# ── Evidências ────────────────────────────────────────────────────────────────
evidencias = []
for i, r in enumerate(range(36, 47), start=1):
    nome = s(ws.cell(r, 1).value)
    evidencias.append({'key': f'evi-{i:02d}', 'nome': nome})

# ── Parecer do ambiente (We Make) ─────────────────────────────────────────────
parecer_ambiente = []
for i, r in enumerate(range(51, 62), start=1):
    parecer_ambiente.append({'key': f'par-{i:02d}', 'item': s(ws.cell(r, 1).value)})


def recursos(nome_aba, prefixo):
    w = wb[nome_aba]
    itens = []
    n = 0
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


listas = wb['Listas']
possui = [s(listas.cell(r, 1).value) for r in range(2, 8) if listas.cell(r, 1).value]
parecer = [s(listas.cell(r, 2).value) for r in range(2, 8) if listas.cell(r, 2).value]
acao = [s(listas.cell(r, 3).value) for r in range(2, 8) if listas.cell(r, 3).value]

schema = {
    'ambiente': ambiente,
    'medidas': medidas,
    'evidencias': evidencias,
    'reutilizaveis': recursos('Recursos Reutilizáveis', 'reu'),
    'consumiveis': recursos('Recursos Consumíveis', 'con'),
    'parecerAmbiente': parecer_ambiente,
    'listas': {'possui': possui, 'parecer': parecer, 'acao': acao},
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(schema, f, ensure_ascii=False, indent=1)
print({k: (len(v) if isinstance(v, list) else v) for k, v in schema.items()})
