import { Fragment, type ReactNode } from 'react'
import { buildOutline, type Block, type Cell } from '@/lib/academia'

/* ─────────────────────────────── Inline ─────────────────────────────────── */

const TOKEN = /(☐[^☐\n]*|https?:\/\/[^\s)]+|\n)/g

function rich(s: string, keyBase: string): ReactNode[] {
  return s.split(TOKEN).map((part, i) => {
    const key = `${keyBase}-${i}`
    if (part.startsWith('☐')) {
      return (
        <span key={key} className="ac-opt">
          <i className="ac-box" aria-hidden="true" />
          {part.slice(1).trim()}
        </span>
      )
    }
    if (part === '\n') return <br key={key} />
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={key} href={part} target="_blank" rel="noopener noreferrer" className="ac-link">
          abrir referência
        </a>
      )
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

export function Inline({ x }: { x: string }) {
  const parts = x.split('**')
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <strong key={i}>{rich(p, `b${i}`)}</strong> : <Fragment key={i}>{rich(p, `t${i}`)}</Fragment>))}
    </>
  )
}

const plain = (x: string) => x.replace(/\*\*/g, '').trim()
const isFullyBold = (x: string) => x.startsWith('**') && x.endsWith('**') && x.split('**').length === 3

function cellText(c: Cell): string {
  return c.b.map(b => ('x' in b ? plain(b.x) : '')).join(' ').trim()
}

/** Separa o "rótulo" (primeiro trecho em negrito) do restante do conteúdo de uma célula. */
function splitLabel(blocks: Block[]): { label: string | null; rest: Block[] } {
  if (!blocks.length) return { label: null, rest: [] }
  const first = blocks[0]
  if (first.t !== 'p') return { label: null, rest: blocks }
  const m = first.x.match(/^\*\*([\s\S]{1,90}?)\*\*([\s\S]*)$/)
  if (m && m[1].trim()) {
    const rest = m[2].trim()
    const label = m[1].trim()
    return {
      label,
      rest: rest ? [{ t: 'p', x: rest } as Block, ...blocks.slice(1)] : blocks.slice(1),
    }
  }
  return { label: null, rest: blocks }
}

type Tone = 'gate' | 'warn' | 'ink' | 'note'
function toneOf(text: string): Tone {
  const t = text.toUpperCase()
  if (/^GATE|GATE DE CONCLUS/.test(t)) return 'gate'
  if (/REGRA DE OURO|IMPORTANTE|NOTA OPERACIONAL|MAIOR LACUNA|ATEN[ÇC][ÃA]O/.test(t)) return 'warn'
  if (/PRINC[ÍI]PIO|A ESCOLA INFORMA/.test(t)) return 'ink'
  return 'note'
}

/* ───────────────────────────── Blocos de célula ─────────────────────────── */

function CellBlocks({ blocks }: { blocks: Block[] }) {
  const out: ReactNode[] = []
  let items: string[] = []
  const flush = (k: string) => {
    if (items.length) {
      out.push(
        <ul key={k} className="ac-ul">
          {items.map((x, i) => (
            <li key={i}><Inline x={x} /></li>
          ))}
        </ul>,
      )
      items = []
    }
  }
  blocks.forEach((b, i) => {
    if (b.t === 'li') { items.push(b.x); return }
    flush(`ul${i}`)
    if (b.t === 'p') {
      out.push(<p key={i} className={isFullyBold(b.x) ? 'ac-cell-strong' : undefined}><Inline x={b.x} /></p>)
    } else if (b.t === 'table') {
      out.push(<TableBlock key={i} b={b} />)
    } else if ('x' in b) {
      out.push(<p key={i}><Inline x={b.x} /></p>)
    }
  })
  flush('ul-end')
  return <>{out}</>
}

/* ─────────────────────────────── Tabelas ────────────────────────────────── */

function Callout({ label, body, tone }: { label?: string | null; body: Block[]; tone?: Tone }) {
  const t = tone ?? toneOf((label ?? '') + ' ' + (body[0] && 'x' in body[0] ? body[0].x : ''))
  return (
    <aside className={`ac-callout ac-callout--${t}`}>
      {label ? <div className="ac-callout-k">{plain(label)}</div> : null}
      <div className="ac-callout-b"><CellBlocks blocks={body} /></div>
    </aside>
  )
}

function Strip({ cells }: { cells: Cell[] }) {
  return (
    <div className="ac-strip" style={{ ['--cols' as string]: cells.length }}>
      {cells.map((cell, i) => {
        const { label, rest } = splitLabel(cell.b)
        return (
          <div key={i} className="ac-strip-i">
            {label ? <div className="ac-strip-k">{plain(label)}</div> : null}
            <div className="ac-strip-b"><CellBlocks blocks={rest} /></div>
          </div>
        )
      })}
    </div>
  )
}

function TableBlock({ b }: { b: Extract<Block, { t: 'table' }> }) {
  const rows = b.rows
  if (!rows.length) return null
  if (rows.length === 1 && rows[0].length === 1) {
    const { label, rest } = splitLabel(rows[0][0].b)
    return <Callout label={label} body={rest} />
  }
  if (rows.length === 1) return <Strip cells={rows[0]} />

  const hdr = b.hdr !== false && !!b.hdr
  const head = hdr ? rows[0] : null
  const bodyRows = hdr ? rows.slice(1) : rows
  const cols = Math.max(...rows.map(r => r.reduce((a, c) => a + (c.s ?? 1), 0)))
  const wide = cols >= 5 || b.kind === 'resources'
  const kv = !hdr
  return (
    <div className={`ac-table-wrap${wide ? ' is-wide' : ''}`} tabIndex={0} role="region" aria-label="Tabela">
      <table className={`ac-table${kv ? ' is-kv' : ''}${b.kind ? ' is-' + b.kind : ''}`}>
        {head ? (
          <thead>
            <tr>
              {head.map((c, i) => (
                <th key={i} colSpan={c.s} scope="col">
                  {c.b.map((x, k) => ('x' in x ? <Fragment key={k}>{k ? ' ' : ''}<Inline x={plain(x.x)} /></Fragment> : null))}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {bodyRows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => {
                const Tag = kv && ci === 0 ? 'th' : 'td'
                const empty = c.b.length === 0
                return (
                  <Tag key={ci} colSpan={c.s} scope={Tag === 'th' ? 'row' : undefined} className={empty ? 'is-blank' : undefined}>
                    {empty ? <span className="ac-blank" aria-hidden="true" /> : <CellBlocks blocks={c.b} />}
                  </Tag>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─────────────────────────────── Documento ──────────────────────────────── */

const pad = (n: string) => (/^\d+$/.test(n) ? n.padStart(2, '0') : n)

export default function DocBody({ blocks }: { blocks: Block[] }) {
  const ids = buildOutline(blocks).map(o => o.id)
  let idIdx = 0
  const out: ReactNode[] = []
  let i = 0
  while (i < blocks.length) {
    const b = blocks[i]
    switch (b.t) {
      case 'sec': {
        const id = ids[idIdx++]
        const kicker = b.k ?? (b.n && /^\d+$/.test(b.n) ? `Seção ${pad(b.n)}` : undefined)
        out.push(
          <header key={i} id={id} className="ac-sec">
            {b.n ? <span className="ac-num" aria-hidden="true">{b.n.length <= 3 ? b.n : ''}</span> : null}
            <div>
              {kicker ? <div className="ac-kicker">{kicker}</div> : null}
              <h2>{b.x}</h2>
            </div>
          </header>,
        )
        i++; break
      }
      case 'sub': {
        const id = ids[idIdx++]
        out.push(
          <h3 key={i} id={id} className="ac-sub">
            {b.k ? <span className="ac-kicker ac-kicker--sub">{b.k}</span> : null}
            {b.n ? <span className={`ac-sub-n${/^\d+$/.test(b.n) ? ' is-int' : ''}`}>{b.n}</span> : null}
            {b.x}
          </h3>,
        )
        i++; break
      }
      case 'minor':
        out.push(<h4 key={i} className="ac-minor">{b.x}</h4>)
        i++; break
      case 'p': {
        if (b.cls === 'quote') {
          out.push(
            <figure key={i} className="ac-quote">
              <blockquote><Inline x={b.x} /></blockquote>
              {b.cite ? <figcaption>{b.cite}</figcaption> : null}
            </figure>,
          )
        } else if (/^\*\*GATE:/i.test(b.x) && isFullyBold(b.x)) {
          out.push(
            <aside key={i} className="ac-gate-banner">
              <span className="ac-gate-banner-k">Gate</span>
              <span>{plain(b.x).replace(/^GATE:\s*/i, '')}</span>
            </aside>,
          )
        } else {
          out.push(
            <p key={i} className={b.cls ? `ac-p ac-p--${b.cls}` : 'ac-p'}><Inline x={b.x} /></p>,
          )
        }
        i++; break
      }
      case 'li': {
        const items: string[] = []
        while (i < blocks.length && blocks[i].t === 'li') { items.push((blocks[i] as { x: string }).x); i++ }
        out.push(
          <ul key={`ul${i}`} className="ac-list">
            {items.map((x, k) => <li key={k}><Inline x={x} /></li>)}
          </ul>,
        )
        break
      }
      case 'check': {
        const items: string[] = []
        while (i < blocks.length && blocks[i].t === 'check') { items.push((blocks[i] as { x: string }).x); i++ }
        out.push(
          <ul key={`ck${i}`} className="ac-checks">
            {items.map((x, k) => <li key={k}><i className="ac-box" /><span><Inline x={x} /></span></li>)}
          </ul>,
        )
        break
      }
      case 'field': {
        const items: string[] = []
        while (i < blocks.length && blocks[i].t === 'field') { items.push((blocks[i] as { x: string }).x); i++ }
        out.push(
          <div key={`fd${i}`} className="ac-fields">
            {items.map((x, k) => (
              <div key={k} className="ac-field">
                <span className="ac-field-k">{x}</span>
                <span className="ac-field-v" aria-hidden="true" />
              </div>
            ))}
          </div>,
        )
        break
      }
      case 'lines': {
        let n = 0
        while (i < blocks.length && blocks[i].t === 'lines') { n++; i++ }
        out.push(
          <div key={`ln${i}`} className="ac-writing" aria-hidden="true">
            {Array.from({ length: n }).map((_, k) => <span key={k} />)}
          </div>,
        )
        break
      }
      case 'callout':
        out.push(<Callout key={i} label={b.label} body={b.body} />)
        i++; break
      case 'table':
        out.push(<TableBlock key={i} b={b} />)
        i++; break
      case 'img':
        i++; break
      default:
        i++
    }
  }
  return <div className="ac-body">{out}</div>
}
