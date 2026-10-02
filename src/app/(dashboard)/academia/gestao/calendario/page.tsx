import Link from 'next/link'
import { carregarGestao } from '@/lib/academia-data'
import { fmtHora, hojeISO } from '@/lib/academia-gestao'
import { getLista } from '@/lib/academia-workspace'
import SetupNotice from '@/components/academia/gestao/SetupNotice'

export const dynamic = 'force-dynamic'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const pad = (n: number) => String(n).padStart(2, '0')

type Item = { k: 'tarefa' | 'evento'; titulo: string; sub: string; status?: string; hora?: string }

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams
  const d = await carregarGestao()
  if (d.setup || d.erro) return <SetupNotice erro={d.erro} />

  const hoje = hojeISO()
  const [ano, mes] = (m && /^\d{4}-\d{2}$/.test(m) ? m : hoje.slice(0, 7)).split('-').map(Number)
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1))
  const dias = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  const offset = primeiro.getUTCDay()
  const ant = new Date(Date.UTC(ano, mes - 2, 1))
  const prox = new Date(Date.UTC(ano, mes, 1))
  const chave = (dt: Date) => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}`
  const prefixo = `${ano}-${pad(mes)}`

  const nomes = new Map(d.implantacoes.map(i => [i.id, i.escola_nome]))
  const porDia = new Map<string, Item[]>()
  const push = (dia: string, it: Item) => porDia.set(dia, [...(porDia.get(dia) ?? []), it])

  d.tarefas.forEach(t => {
    if (t.prazo?.startsWith(prefixo)) {
      push(t.prazo, { k: 'tarefa', titulo: t.titulo, sub: `${nomes.get(t.implantacao_id ?? '') ?? ''} · ${getLista(t.lista)?.nome ?? ''}`, status: t.status })
    }
  })
  d.eventos.forEach(e => {
    // dia no horário de Brasília (UTC-3)
    const dia = new Date(new Date(e.inicio).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10)
    if (dia.startsWith(prefixo)) {
      push(dia, { k: 'evento', titulo: e.titulo, sub: `${e.tipo}${e.implantacao_id ? ' · ' + (nomes.get(e.implantacao_id) ?? '') : ''}`, hora: fmtHora(e.inicio) })
    }
  })

  const celulas: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: dias }, (_, i) => i + 1)]
  while (celulas.length % 7) celulas.push(null)

  return (
    <>
      <div className="ac-cal-h">
        <h2 className="ac-h3" style={{ margin: 0, textTransform: 'capitalize' }}>{MESES[mes - 1]} de {ano}</h2>
        <div className="ac-cal-nav">
          <Link href={`/academia/gestao/calendario?m=${chave(ant)}`} aria-label="Mês anterior">←</Link>
          <Link href="/academia/gestao/calendario">Hoje</Link>
          <Link href={`/academia/gestao/calendario?m=${chave(prox)}`} aria-label="Próximo mês">→</Link>
        </div>
      </div>
      <p className="ac-sec-lead">Prazos das tarefas e compromissos da agenda no mesmo calendário.</p>

      <div className="ac-cal" role="grid" aria-label={`Calendário de ${MESES[mes - 1]} de ${ano}`}>
        {DIAS.map(x => <div key={x} className="ac-cal-w" role="columnheader">{x}</div>)}
        {celulas.map((n, i) => {
          if (!n) return <div key={i} className="ac-cal-d is-vazio" role="gridcell" />
          const iso = `${prefixo}-${pad(n)}`
          const itens = porDia.get(iso) ?? []
          return (
            <div key={i} className={`ac-cal-d${iso === hoje ? ' is-hoje' : ''}`} role="gridcell">
              <span className="ac-cal-n">{n}</span>
              <ul>
                {itens.slice(0, 4).map((it, k) => (
                  <li key={k} className={it.k === 'evento' ? 'is-evento' : undefined} data-s={it.status} title={`${it.titulo} · ${it.sub}`}>
                    {it.hora ? <b>{it.hora}</b> : null} {it.titulo}
                  </li>
                ))}
                {itens.length > 4 ? <li className="is-mais">+{itens.length - 4} mais</li> : null}
              </ul>
            </div>
          )
        })}
      </div>
    </>
  )
}
