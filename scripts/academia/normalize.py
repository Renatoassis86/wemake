import json, os, re, sys, shutil, glob, copy
sys.stdout.reconfigure(encoding='utf-8')
APP = r'C:\repositorio\wemake\projetos_wemake\app_comercial_We Make'
CONTENT = os.path.join(APP, 'src', 'content', 'academia')
RAW = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'raw')
os.makedirs(RAW, exist_ok=True)

def plain(x): return x.replace('**', '').strip()
def fully_bold(x): return x.startswith('**') and x.endswith('**') and x.count('**') == 2
def upper_label(x):
    t = plain(x)
    letters = [c for c in t if c.isalpha()]
    return bool(letters) and all(c.isupper() for c in letters)
def num_split(x):
    m = re.match(r'^(\d+B?(?:\.\d+)*)[\.\)]?\s+(.+)$', x, re.S)
    return (m.group(1), m.group(2).strip()) if m else (None, x)
def is_head(b): return b['t'] in ('h1', 'h2', 'h3', 'title')

def cell_text(c): return ' '.join(plain(b.get('x', '')) for b in c['b'] if 'x' in b)

def table_flags(b, src_kind, kv_first=()):
    rows = b['rows']
    b['hdr'] = False
    if len(rows) < 2: return
    first = rows[0]
    if src_kind == 'pdf':
        b['hdr'] = cell_text(first[0]) not in kv_first
    else:
        cells = [c for c in first if c['b']]
        ok = bool(cells) and all(len(c['b']) >= 1 and all(fully_bold(x['x']) for x in c['b'] if 'x' in x and x['x']) for c in cells)
        b['hdr'] = ok

def prep_tables(blocks, kind, kv_first=()):
    out = []
    for b in blocks:
        if b['t'] == 'table':
            if b.get('kind') != 'resources' and b['rows']:
                table_flags(b, kind, kv_first)
            else:
                b['hdr'] = True
            for r in b['rows']:
                for c in r:
                    c['b'] = [x for x in c['b']]
        out.append(b)
    return out

def sec(x, n=None, k=None):
    d = {'t': 'sec', 'x': plain(x)}
    if n: d['n'] = n
    if k: d['k'] = k
    return d

def field_or_p(b):
    t = b['x']
    m = re.match(r'^\*\*(.+?):?\s*\*\*\s*_{4,}\s*$', t)
    if m: return {'t': 'field', 'x': m.group(1).strip(' :')}
    if re.fullmatch(r'_{4,}', t.strip()): return {'t': 'lines'}
    m = re.match(r'^(\*\*.+?\*\*)\s*_{4,}$', t)
    if m: return {'t': 'field', 'x': plain(m.group(1)).strip(' :')}
    if t.startswith('☐'): return {'t': 'check', 'x': t.lstrip('☐ ').strip()}
    if re.match(r'^[A-Za-zÀ-ú ]+\*\*?:?\*\* ?_{4,}', t): return {'t': 'field', 'x': plain(t.split('_')[0])}
    return b

def generic_pass(blocks, doc):
    """Common cleanups after structural mapping."""
    out = []
    for b in blocks:
        if b['t'] == 'p':
            b = field_or_p(b)
            if b['t'] == 'p':
                x = b['x']
                if x.startswith('“') and x.rstrip().endswith('”'): b['cls'] = 'quote'
        out.append(b)
    # merge consecutive 'lines' and fields in a row stay as is
    return out

# ------------------------------------------------------------------ docx forms / manuals
def conv_docx_simple(raw, doc):
    blocks = raw['blocks']
    out = []
    trio_done = False
    i = 0
    while i < len(blocks):
        b = blocks[i]
        t = b['t']
        if t == 'table' and not trio_done and not any(x['t'] in ('sec', 'sub', 'table') for x in out):
            # info trio at the top: label/value cells
            cells = [c for c in b['rows'][0]] if len(b['rows']) == 1 else None
            if cells and len(cells) >= 3 and all(len(c['b']) >= 1 for c in cells) and all((chr(10) in c['b'][0].get('x', '').strip('*').strip() or len(c['b']) >= 2) for c in cells):
                trio = []
                for c in cells:
                    txt = [plain(x['x']) for x in c['b'] if 'x' in x]
                    if len(txt) == 1:
                        parts = txt[0].split('\n')
                        trio.append({'k': parts[0].strip(), 'v': ' '.join(p.strip() for p in parts[1:]).strip()})
                    else:
                        trio.append({'k': txt[0], 'v': ' '.join(txt[1:])})
                doc['trio'] = trio
                trio_done = True
                i += 1
                continue
        if t == 'title':
            doc['titleText'] = b['x'].replace('\n', ' ')
            i += 1; continue
        if t == 'h1':
            n, x = num_split(b['x']); out.append(sec(x, n)); i += 1; continue
        if t == 'h2':
            n, x = num_split(b['x']); d = {'t': 'sub', 'x': plain(x)}
            if n: d['n'] = n
            out.append(d); i += 1; continue
        if t == 'h3':
            out.append({'t': 'minor', 'x': plain(b['x'])}); i += 1; continue
        if t == 'p' and fully_bold(b['x']) and len(plain(b['x'])) < 70 and not plain(b['x']).endswith('.') and doc.get('boldminor', True):
            out.append({'t': 'minor', 'x': plain(b['x'])}); i += 1; continue
        out.append(b); i += 1
    while out and out[0]['t'] == 'minor' and out[0]['x'] == 'WE MAKE': out.pop(0)
    lead = []
    if out and out[0]['t'] == 'p' and plain(out[0]['x']).startswith('WE MAKE |'): out.pop(0)
    mx = 2 if doc.get('slug') == 'manual-operacional' else 1
    while out and out[0]['t'] == 'p' and len(lead) < mx:
        lead.append(plain(out.pop(0)['x']))
    if lead: doc['lead'] = lead
    return out

# ------------------------------------------------------------------ arquitetura
def conv_arquitetura(raw, doc):
    blocks = [b for b in raw['blocks'] if b['t'] != 'img']
    out = []
    i = 0
    seen_toc = False
    while i < len(blocks):
        b = blocks[i]
        if b['t'] == 'p':
            x = b['x']
            if x.startswith('**ARQUITETURA DE PROCESSOS'): i += 1; continue
            if x == '**Academia We Make**': i += 1; continue
            if x.startswith('**Data:'):
                out.append({'t': 'p', 'x': plain(x), 'cls': 'meta'}); i += 1; continue
            if x == '**Sumário**':
                i += 1
                while i < len(blocks) and blocks[i]['t'] == 'p' and re.match(r'^\*\*\d\d \*\*', blocks[i]['x']): i += 1
                continue
            if re.match(r'^\*\*SEÇÃO \d+\*\*$', x): i += 1; continue
            m = re.match(r'^\*\*(\d\d) (.+)\*\*$', x)
            if m and x.count('**') == 2:
                out.append(sec(m.group(2), m.group(1))); i += 1; continue
            if fully_bold(x) and len(plain(x)) < 95 and not plain(x).endswith('.'):
                out.append({'t': 'minor', 'x': plain(x)}); i += 1; continue
            if not out:
                out.append({'t': 'p', 'x': x, 'cls': 'lead'}); i += 1; continue
        out.append(b); i += 1
    return out

# ------------------------------------------------------------------ pdf docs
def conv_pdf(raw, doc, slug):
    blocks = raw['blocks']
    out = []
    i = 0
    n_blocks = len(blocks)
    pending_part = None
    pending_after = []
    pending_kicker = None
    def next_nonli(j): return blocks[j] if j < n_blocks else None
    while i < n_blocks:
        b = blocks[i]; t = b['t']
        x = b.get('x', '')
        if slug in ('manual-do-formador', 'material-do-multiplicador'):
            if t == 'h3' and x.startswith('ACADEMIA WE MAKE'):
                doc['kicker'] = x; i += 1; continue
            if t == 'title' and i < 4 and x in ('Manual do Formador', 'Material do Multiplicador'):
                i += 1; continue
            if t == 'h1' and x == 'Sumário':
                i += 1
                if i < n_blocks and blocks[i]['t'] == 'p': i += 1
                continue
            m = re.match(r'^PARTE\s+(\S+)$', x) if t == 'h3' else None
            if m:
                pending_part = 'Parte ' + m.group(1)
                i += 1
                if i < n_blocks and blocks[i]['t'] == 'title':
                    pending_part += ' · ' + blocks[i]['x']; i += 1
                while i < n_blocks and blocks[i]['t'] == 'p':
                    pending_after.append(blocks[i]); i += 1
                continue
            if t == 'h1':
                n, title = num_split(x)
                out.append(sec(title, n, pending_part)); pending_part = None
                out.extend(pending_after); pending_after = []
                i += 1; continue
            if t == 'h2':
                n, title = num_split(x)
                d = {'t': 'sub', 'x': plain(title)}
                if n: d['n'] = n
                out.append(d); i += 1; continue
            if t == 'h3':
                if x.startswith('—'):
                    # attribution for previous quote
                    if out and out[-1]['t'] == 'p' and out[-1].get('cls') == 'quote': out[-1]['cite'] = x.lstrip('— ').strip()
                    else: out.append({'t': 'p', 'x': x, 'cls': 'cite'})
                    i += 1; continue
                if re.match(r'^\d+(\.\d+)+\s', x):
                    n, title = num_split(x); out.append({'t': 'sub', 'x': title, 'n': n}); i += 1; continue
                nxt = next_nonli(i + 1)
                if nxt and nxt['t'] == 'p' and (upper_label(x) or slug == 'material-do-multiplicador' and x.isupper()):
                    body = [nxt]; i += 2
                    while i < n_blocks and blocks[i]['t'] == 'p' and (x.startswith('ESPAÇO') is False) and False: pass
                    out.append({'t': 'callout', 'label': x, 'body': body}); continue
                out.append({'t': 'minor', 'x': x}); i += 1; continue
            if t == 'title':
                out.append({'t': 'minor', 'x': x}); i += 1; continue
        elif slug == 'documento-normativo':
            if t == 'h3' and x == 'DOCUMENTO NORMATIVO': i += 1; continue
            if t == 'title': i += 1; continue
            if t == 'h1' and x == 'Sumário':
                i += 1
                if i < n_blocks and blocks[i]['t'] == 'p': i += 1
                continue
            if t == 'h3' and re.fullmatch(r'\d+', x) and i + 1 < n_blocks and blocks[i + 1]['t'] == 'h1':
                out.append(sec(blocks[i + 1]['x'], x)); i += 2; continue
            if t == 'h2':
                n, title = num_split(x); d = {'t': 'sub', 'x': plain(title)}
                if n: d['n'] = n
                out.append(d); i += 1; continue
            if t == 'h3':
                out.append({'t': 'minor', 'x': x}); i += 1; continue
            if t == 'p' and not out:
                out.append({'t': 'p', 'x': x, 'cls': 'lead'}); i += 1; continue
        elif slug == 'processo-de-onboarding-2026':
            if t in ('title',) or (t == 'h2' and x == 'WE MAKE'): i += 1; continue
            if t == 'h2' and x.startswith('Diretrizes,'):
                doc['subtitle'] = x; i += 1; continue
            if t == 'h3' and upper_label(x) and i + 1 < n_blocks and blocks[i + 1]['t'] in ('h1', 'h2'):
                pending_kicker = x; i += 1; continue
            if t in ('h1', 'h2'):
                n, title = num_split(x)
                is_sub = n and ('.' in n)
                if t == 'h1' and not is_sub:
                    out.append(sec(title, n, pending_kicker)); pending_kicker = None
                elif is_sub:
                    d = {'t': 'sub', 'x': plain(title), 'n': n}
                    if pending_kicker: d['k'] = pending_kicker; pending_kicker = None
                    out.append(d)
                elif t == 'h2' and re.match(r'^Bloco ', title):
                    out.append({'t': 'minor', 'x': title})
                else:
                    out.append({'t': 'sub', 'x': plain(title)})
                i += 1; continue
            if t == 'h3':
                nxt = next_nonli(i + 1)
                if nxt and nxt['t'] == 'p':
                    out.append({'t': 'callout', 'label': x, 'body': [nxt]}); i += 2; continue
                out.append({'t': 'minor', 'x': x}); i += 1; continue
            if t == 'p' and not out and 'subtitle' in doc: pass
        out.append(b); i += 1
    return out

KV_FIRST = {'Amostra', 'Multiplicador', 'Nível 1 — Informado'}

def fix_formador_tables(blocks):
    # merge split table "Trilha | 1ª série | 2ª e 3ª séries" and move FRASE-CHAVE callout out
    idx = [i for i, b in enumerate(blocks) if b['t'] == 'table']
    res = []
    skip = set()
    for pos, i in enumerate(idx):
        b = blocks[i]
        if b.get('t') != 'table' or not b.get('rows'): continue
        first = cell_text(b['rows'][0][0])
        if first == 'Trilha' and pos + 1 < len(idx):
            b2 = blocks[idx[pos + 1]]
            if b2.get('rows') and cell_text(b2['rows'][0][0]) == 'Trilha':
                last = b['rows'][-1]
                cont = b2['rows'][1]
                for k in range(len(last)):
                    a = cell_text(last[k]); c = cell_text(cont[k]) if k < len(cont) else ''
                    last[k] = {'b': [{'t': 'p', 'x': (a + ' ' + c).strip()}]}
                skip.add(idx[pos + 1])
                # FRASE-CHAVE row
                for r in b2['rows'][2:]:
                    txt = cell_text(r[0])
                    if txt.startswith('FRASE-CHAVE'):
                        body = txt.replace('FRASE-CHAVE PARA O MULTIPLICADOR', '').strip()
                        blocks[idx[pos + 1]] = {'t': 'callout', 'label': 'FRASE-CHAVE PARA O MULTIPLICADOR', 'body': [{'t': 'p', 'x': body, 'cls': 'quote'}]}
                        skip.discard(idx[pos + 1])
    return blocks, skip

def finalize(slug, kind, kv=()):
    raw = json.load(open(os.path.join(RAW, slug + '.json'), encoding='utf-8'))
    doc = {'slug': slug, 'source': raw['source']}
    if kind == 'docx_simple':
        blocks = conv_docx_simple(raw, doc)
    elif kind == 'arq':
        blocks = conv_arquitetura(raw, doc)
    elif kind == 'xlsx':
        blocks = []
        for b in raw['blocks']:
            t = b['t']
            if t == 'title': doc['titleText'] = b['x']; continue
            if t == 'h1': blocks.append(sec(b['x'])); continue
            if t == 'h2': blocks.append({'t': 'sub', 'x': b['x']}); continue
            if t == 'h3': blocks.append({'t': 'minor', 'x': b['x']}); continue
            blocks.append(b)
    else:
        blocks = conv_pdf(raw, doc, slug)
    skip = set()
    if slug == 'manual-do-formador':
        blocks, skip = fix_formador_tables(blocks)
        blocks = [b for i, b in enumerate(blocks) if i not in skip]
    pk = 'pdf' if kind == 'pdf' else 'docx'
    if kind == 'xlsx': pk = 'xlsx'
    for b in blocks:
        if b['t'] == 'table':
            if pk == 'xlsx': b['hdr'] = True
            else: table_flags(b, pk, kv)
            if b.get('kind') == 'resources': b['hdr'] = True
    blocks = generic_pass(blocks, doc)
    # a bullet-less p directly before li in multiplicador/formador is a list item
    if slug in ('manual-do-formador', 'material-do-multiplicador'):
        for k in range(len(blocks) - 1):
            if blocks[k]['t'] == 'p' and blocks[k + 1]['t'] == 'li' and len(blocks[k]['x']) < 95 and not blocks[k]['x'].rstrip().endswith(('.', ':', '?', '!')):
                blocks[k]['t'] = 'li'
    doc['blocks'] = blocks
    json.dump(doc, open(os.path.join(CONTENT, slug + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    return doc

PLAN = {
    'documento-normativo': ('pdf', ()),
    'arquitetura-de-processos': ('arq', ()),
    'manual-operacional': ('docx_simple', ()),
    'handoff': ('docx_simple', ()),
    'procedimento-diagnostico': ('docx_simple', ()),
    'planilha-diagnostico': ('xlsx', ()),
    'registro-ativacao-comercial': ('docx_simple', ()),
    'manual-do-formador': ('pdf', tuple(KV_FIRST)),
    'material-do-multiplicador': ('pdf', tuple(KV_FIRST)),
    'checklist-pre-onboarding': ('docx_simple', ()),
    'processo-de-onboarding-2026': ('pdf', ()),
    'relatorio-onboarding': ('docx_simple', ()),
    'ficha-go-live': ('docx_simple', ()),
    'painel-mestre': ('xlsx', ()),
}

if __name__ == '__main__':
    only = sys.argv[1:]
    # snapshot raw
    for f in glob.glob(os.path.join(CONTENT, '*.json')):
        d = json.load(open(f, encoding='utf-8'))
        rawp = os.path.join(RAW, os.path.basename(f))
        if not os.path.exists(rawp) or d.get('blocks') and not any(b['t'] in ('sec', 'sub', 'minor', 'callout', 'field', 'check') for b in d['blocks']):
            shutil.copy(f, rawp)
    for slug, (kind, kv) in PLAN.items():
        if only and slug not in only: continue
        d = finalize(slug, kind, kv)
        from collections import Counter
        print(slug, dict(Counter(b['t'] for b in d['blocks'])), 'trio' in d)
