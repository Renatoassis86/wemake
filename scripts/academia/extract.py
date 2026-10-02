import sys, zipfile, re, json, os, shutil, warnings, collections
import xml.etree.ElementTree as ET
warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

SRC = r'C:\repositorio\wemake\projetos_wemake\app_comercial_We Make\Academia_wemake'
APP = r'C:\repositorio\wemake\projetos_wemake\app_comercial_We Make'
OUT = os.path.join(APP, 'src', 'content', 'academia')
IMG = os.path.join(APP, 'public', 'academia')
os.makedirs(OUT, exist_ok=True); os.makedirs(IMG, exist_ok=True)

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
def q(t): return '{%s}%s' % (W, t)

def clean(s):
    s = s.replace('\u00a0', ' ')
    s = re.sub(r'[ \t]+', ' ', s)
    return s.strip()

def run_on(r, tag):
    rpr = r.find(q('rPr'))
    if rpr is None: return False
    e = rpr.find(q(tag))
    if e is None: return False
    return e.get(q('val')) not in ('0', 'false', 'off')

def para_text(p):
    out = []
    def walk(node):
        for ch in node:
            if ch.tag == q('r'):
                txt = ''
                for x in ch:
                    if x.tag == q('t'): txt += x.text or ''
                    elif x.tag == q('tab'): txt += ' '
                    elif x.tag in (q('br'), q('cr')): txt += '\n'
                if txt:
                    out.append(('**' + txt + '**') if run_on(ch, 'b') and txt.strip() else txt)
            elif ch.tag in (q('hyperlink'), q('smartTag'), q('sdt'), q('sdtContent')):
                walk(ch)
    walk(p)
    s = ''.join(out)
    s = s.replace('****', '')
    s = re.sub(r'\*\*(\s+)\*\*', r'\1', s)
    return s

def convert_docx(path, slug):
    z = zipfile.ZipFile(path)
    root = ET.fromstring(z.read('word/document.xml'))
    body = root.find(q('body'))
    rels = {}
    if 'word/_rels/document.xml.rels' in z.namelist():
        rr = ET.fromstring(z.read('word/_rels/document.xml.rels'))
        for rel in rr: rels[rel.get('Id')] = rel.get('Target')
    imgs = []
    def blocks_of(container):
        res = []
        for el in container:
            if el.tag == q('p'):
                ppr = el.find(q('pPr'))
                style = None; numpr = False
                if ppr is not None:
                    ps = ppr.find(q('pStyle'))
                    if ps is not None: style = ps.get(q('val'))
                    numpr = ppr.find(q('numPr')) is not None
                # images
                for bl in el.iter('{%s}blip' % A):
                    rid = bl.get('{%s}embed' % R)
                    tgt = rels.get(rid)
                    if tgt:
                        name = os.path.basename(tgt)
                        dst = f'{slug}-{name}'
                        with open(os.path.join(IMG, dst), 'wb') as f:
                            f.write(z.read('word/' + tgt))
                        res.append({'t': 'img', 'src': f'/academia/{dst}'})
                txt = clean(para_text(el)).strip('\n ')
                if not txt: continue
                if style in ('Title',): t = 'title'
                elif style == 'Heading1': t = 'h1'
                elif style == 'Heading2': t = 'h2'
                elif style == 'Heading3': t = 'h3'
                elif style in ('ListBullet', 'ListParagraph') or numpr: t = 'li'
                else: t = 'p'
                if t in ('title', 'h1', 'h2', 'h3'): txt = txt.replace('**', '')
                res.append({'t': t, 'x': txt})
            elif el.tag == q('tbl'):
                rows = []
                for tr in el.findall(q('tr')):
                    cells = []
                    for tc in tr.findall(q('tc')):
                        tcpr = tc.find(q('tcPr'))
                        span = 1
                        if tcpr is not None:
                            gs = tcpr.find(q('gridSpan'))
                            if gs is not None: span = int(gs.get(q('val')))
                            vm = tcpr.find(q('vMerge'))
                        cb = blocks_of(tc)
                        c = {'b': cb}
                        if span > 1: c['s'] = span
                        cells.append(c)
                    if cells: rows.append(cells)
                if rows: res.append({'t': 'table', 'rows': rows})
        return res
    blocks = blocks_of(body)
    return blocks

def count_text(blocks):
    n = 0
    for b in blocks:
        if b['t'] == 'table':
            for r in b['rows']:
                for c in r: n += count_text(c['b'])
        else: n += len(b.get('x', ''))
    return n

# ---------------- PDF ----------------
import pymupdf
def convert_pdf(path, th=None):
    d = pymupdf.open(path)
    # collect repeated header/footer lines
    linecount = collections.Counter()
    pagelines = []
    for pi, page in enumerate(d):
        ph = page.rect.height
        lines = []
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                text = ''.join(s['text'] for s in l['spans']).strip()
                if not text: continue
                size = max(s['size'] for s in l['spans'])
                bold = all('Bold' in s['font'] or 'bold' in s['font'] for s in l['spans'] if s['text'].strip())
                ital = all('Italic' in s['font'] for s in l['spans'] if s['text'].strip())
                y0, y1 = l['bbox'][1], l['bbox'][3]; x0 = l['bbox'][0]
                lines.append({'text': text, 'size': size, 'bold': bold, 'it': ital, 'y0': y0, 'y1': y1, 'x0': x0, 'x1': l['bbox'][2]})
        BUL = set('●•▪◦')
        keep = []
        for b in lines:
            if b['text'] in BUL:
                for l2 in lines:
                    if l2 is not b and l2['x0'] > b['x0'] and abs(l2['y0'] - b['y0']) < 6 and l2['text'] not in BUL:
                        l2['bul'] = True; break
                continue
            keep.append(b)
        lines = keep
        pagelines.append(lines)
        for l in lines:
            if l['y0'] < 60 or l['y1'] > ph - 60:
                linecount[re.sub(r'\d+', '#', l['text'])] += 1
    n = len(d)
    repeated = {k for k, v in linecount.items() if v >= max(3, n * 0.5)}
    # body size = most common size by chars
    sc = collections.Counter()
    for lines in pagelines:
        for l in lines: sc[round(l['size'])] += len(l['text'])
    body = sc.most_common(1)[0][0]
    blocks = []
    for pi, page in enumerate(d):
        ph = page.rect.height
        items = []  # (y, kind, payload)
        # tables
        tabs = []
        try:
            tabs = page.find_tables().tables
        except Exception:
            tabs = []
        tbboxes = []
        for tb in tabs:
            rows = []
            for tr in tb.rows:
                cells = []
                for bb in tr.cells:
                    if bb is None:
                        cells.append({'b': []}); continue
                    txt = clean(page.get_text('text', clip=pymupdf.Rect(bb)).replace(chr(10), ' '))
                    cells.append({'b': [{'t': 'p', 'x': txt}] if txt else []})
                if any(c['b'] for c in cells): rows.append(cells)
            if not rows: continue
            flat = ' '.join(c['b'][0]['x'] for r in rows for c in r if c['b'])
            if re.search(r'Formação inicial de escolas parceiras', flat) and len(flat) < 120: 
                tbboxes.append(tb.bbox); continue
            tbboxes.append(tb.bbox)
            items.append((tb.bbox[1], 'table', {'t': 'table', 'rows': rows}))
        def in_tb(l):
            for bb in tbboxes:
                if l['x0'] >= bb[0] - 2 and l['x1'] <= bb[2] + 2 and l['y0'] >= bb[1] - 2 and l['y1'] <= bb[3] + 2: return True
            return False
        for l in pagelines[pi]:
            key = re.sub(r'\d+', '#', l['text'])
            if (l['y0'] < 60 or l['y1'] > ph - 60) and key in repeated: continue
            if re.fullmatch(r'\d{1,3}', l['text']) and (l['y0'] < 50 or l['y1'] > ph - 50): continue
            if in_tb(l): continue
            items.append((l['y0'], 'line', l))
        items.sort(key=lambda x: x[0])
        for y, kind, pl in items:
            if kind == 'table': blocks.append(pl); continue
            blocks.append({'_line': pl})
    # merge lines -> blocks
    out = []
    buf = None
    def flush():
        nonlocal buf
        if buf:
            out.append(buf); buf = None
    prev = None
    for b in blocks:
        if 't' in b:
            flush(); out.append(b); prev = None; continue
        l = b['_line']
        sz = l['size']; txt = l['text']
        T = th or (body + 9, body + 4, body + 2)
        if sz >= T[0]: kind = 'title'
        elif sz >= T[1]: kind = 'h1'
        elif sz >= T[2]: kind = 'h2'
        elif l['bold'] and len(txt) < 90 and not txt.endswith(('.', ',', ';')): kind = 'h3'
        elif l.get('bul') or re.match(r'^[•●▪◦\-–]\s+', txt): kind = 'li'
        elif re.match(r'^(\d+[\.\)]|[a-z]\))\s+\S', txt) and len(txt) < 140 and sz <= body + 1 and False: kind = 'li'
        else: kind = 'p'
        if kind in ('title', 'h1', 'h2', 'h3'):
            if buf and buf['t'] == kind and abs(buf.get('_y1', 0) - l['y0']) < sz * 1.6 and kind != 'h3':
                buf['x'] += ' ' + txt; buf['_y1'] = l['y1']
            else:
                flush(); buf = {'t': kind, 'x': txt, '_y1': l['y1']}
            prev = l; continue
        if kind == 'li':
            flush(); buf = {'t': 'li', 'x': re.sub(r'^[•●▪◦\-–]\s+', '', txt), '_y1': l['y1']}; prev = l; continue
        # paragraph continuation
        if buf and buf['t'] in ('p', 'li') and prev is not None and (l['y0'] - prev['y1']) < sz * 0.9 and abs(l['x0'] - prev['x0']) < 40 + (30 if buf['t']=='li' else 0):
            if buf['x'].endswith('-') and txt[:1].islower(): buf['x'] = buf['x'][:-1] + txt
            else: buf['x'] += ' ' + txt
            buf['_y1'] = l['y1']
        else:
            flush(); buf = {'t': 'p', 'x': txt, '_y1': l['y1']}
        prev = l
    flush()
    for o in out: o.pop('_y1', None)
    res = []
    for o in out:
        if o['t'] == 'p' and '●' in o['x']:
            parts = [x.replace(chr(0x200b),'').strip() for x in o['x'].split('●')]
            if parts[0]: res.append({'t': 'p', 'x': parts[0]})
            for x in parts[1:]:
                if x: res.append({'t': 'li', 'x': x})
        else:
            o['x'] = o.get('x','').replace(chr(0x200b),'') if 'x' in o else None
            if o['x'] is None: o.pop('x')
            res.append(o)
    return res

DOCS = [
 # slug, file, kind
 ('documento-normativo', 'We_Make_Academia_Documento_Normativo.pdf', 'pdf'),
 ('arquitetura-de-processos', 'We_Make_Academia_Arquitetura_de_Processos_2027.docx', 'docx'),
 ('manual-operacional', 'Manual_Operacional_Implantacao_We_Make_2027_v2.docx', 'docx'),
 ('processo-de-onboarding-2026', 'Processo_de_Onboarding_We_Make_2026.pdf', 'pdf'),
 ('checklist-pre-onboarding', 'Checklist_Pre_Onboarding_We_Make_2027.docx', 'docx'),
 ('ficha-go-live', 'Ficha_Go_Live_We_Make_2027.docx', 'docx'),
 ('handoff', 'Handoff_We_Make_2027.docx', 'docx'),
 ('relatorio-onboarding', 'Relatorio_Onboarding_Escola_Parceira_We_Make_2027.docx', 'docx'),
 ('registro-ativacao-comercial', 'Registro_Ativacao_Comercial_We_Make_2027.docx', 'docx'),
 ('procedimento-diagnostico', 'Procedimento_Oficial_Diagnostico_Espaco_Maker_We_Make_2027.docx', 'docx'),
 ('manual-do-formador', 'WeMake_Manual_do_Formador.pdf', 'pdf'),
 ('material-do-multiplicador', 'WeMake_Material_do_Multiplicador.pdf', 'pdf'),
]
TH = {'processo-de-onboarding-2026': (30, 18, 13), 'documento-normativo': (19, 15, 12.9)}
if __name__ == '__main__':
    only = sys.argv[1:]
    for slug, f, kind in DOCS:
        if only and slug not in only: continue
        p = os.path.join(SRC, f)
        blocks = convert_docx(p, slug) if kind == 'docx' else convert_pdf(p, TH.get(slug))
        with open(os.path.join(OUT, slug + '.json'), 'w', encoding='utf-8') as fh:
            json.dump({'slug': slug, 'source': f, 'blocks': blocks}, fh, ensure_ascii=False, indent=0)
        kinds = collections.Counter(b['t'] for b in blocks)
        print(slug, count_text(blocks), dict(kinds))
