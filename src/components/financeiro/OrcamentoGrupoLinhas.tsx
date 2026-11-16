'use client'

import { MESES_LABEL, somarAte, type Grupo, type LinhaOrcamento, type GrupoFlat } from '@/lib/orcamentos'
import { formatCurrency } from '@/lib/utils'
import CelulaMoney from './CelulaMoney'

export interface ContratoOpcao { id: string; nome: string }

/** "previsao" tem o alternador mensal/anual embutido; "acompanhamento" é só leitura (previsto x executado até agora) */
export type Visao = 'previsao' | 'acompanhamento'
export type ModoPrevisao = 'mensal' | 'anual'

function classePct(valor: number) {
  return valor > 90 ? 'is-alto' : valor >= 40 ? 'is-medio' : 'is-baixo'
}

/** mesmos limiares e emoji do bi_financeiro: >90% risco de estourar, 40–90% acompanhar de perto, <40% tranquilo */
function emojiPct(valor: number) {
  return valor > 90 ? '🔴' : valor >= 40 ? '🟡' : '🟢'
}

function Percentual({ valor, comEmoji }: { valor: number | null; comEmoji?: boolean }) {
  if (valor === null) return <span className="ac-nota" style={{ margin: 0 }}>—</span>
  return (
    <span className={`ac-pct ${classePct(valor)}`}>
      {comEmoji ? `${emojiPct(valor)} ` : null}{valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
    </span>
  )
}

const rotuloLinha: React.CSSProperties = { fontSize: '.64rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em', whiteSpace: 'nowrap' }

export function LinhaFolha({
  linha, tipo, visao, modoPrevisao, mesesDecorridos, totalBase, contratosOpcoes, gruposFlat, nivelIndentacao,
  onValor, onExecutado, onObservacao, onContrato, onGrupo, onExcluir,
}: {
  linha: LinhaOrcamento
  tipo: 'receita' | 'despesa'
  visao: Visao
  modoPrevisao: ModoPrevisao
  mesesDecorridos: number
  /** total anual do tipo inteiro — base da coluna Participação */
  totalBase: number
  contratosOpcoes?: ContratoOpcao[]
  gruposFlat: GrupoFlat[]
  nivelIndentacao: number
  onValor: (linhaId: string, mesIdx: number, valor: number) => void
  onExecutado: (linhaId: string, mesIdx: number, valor: number) => void
  onObservacao: (linhaId: string, texto: string) => void
  onContrato?: (linhaId: string, contratoId: string) => void
  onGrupo: (linhaId: string, grupoId: string) => void
  onExcluir: (id: string, nome: string) => void
}) {
  const nomeTd = (rowSpan?: number) => (
    <td rowSpan={rowSpan} style={{ paddingLeft: `${0.9 + nivelIndentacao * 1.1}rem` }}>{linha.nome}</td>
  )
  const extras = (rowSpan?: number) => (
    <>
      <td rowSpan={rowSpan}>
        <select defaultValue={linha.grupoId ?? ''} onChange={e => onGrupo(linha.id, e.target.value)}
          style={{ font: 'inherit', fontSize: '.78rem', border: '1px solid transparent', background: 'transparent', color: 'inherit', maxWidth: '10rem' }}>
          <option value="">— sem categoria —</option>
          {gruposFlat.map(g => <option key={g.id} value={g.id}>{'—'.repeat(g.nivel - 1)} {g.nome}</option>)}
        </select>
      </td>
      {tipo === 'receita' ? (
        <td rowSpan={rowSpan}>
          <select defaultValue={linha.contratoId ?? ''} onChange={e => onContrato?.(linha.id, e.target.value)}
            style={{ font: 'inherit', fontSize: '.78rem', border: '1px solid transparent', background: 'transparent', color: 'inherit', maxWidth: '10rem' }}>
            <option value="">— sem contrato —</option>
            {contratosOpcoes?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </td>
      ) : null}
      <td rowSpan={rowSpan} style={{ minWidth: '12rem' }}>
        <input type="text" defaultValue={linha.observacao ?? ''} placeholder="—" onBlur={e => onObservacao(linha.id, e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid transparent', borderRadius: 6, padding: '.3rem .35rem', font: 'inherit', fontSize: '.8rem', background: 'transparent', color: 'inherit' }} />
      </td>
      <td rowSpan={rowSpan}>
        <button type="button" className="ac-btn-excluir" onClick={() => onExcluir(linha.id, linha.nome)} aria-label={`Remover ${linha.nome}`}>✕</button>
      </td>
    </>
  )

  if (visao === 'acompanhamento') {
    const executadoAteAgora = somarAte(linha.executadoMeses, mesesDecorridos)
    const pctAteAgora = linha.total > 0 ? (executadoAteAgora / linha.total) * 100 : null
    const participacao = totalBase > 0 ? (linha.total / totalBase) * 100 : null
    return (
      <tr>
        {nomeTd()}
        <td style={{ fontWeight: 700 }}>{formatCurrency(linha.total)}</td>
        <td style={{ fontWeight: 700 }}>{formatCurrency(executadoAteAgora)}</td>
        <td><Percentual valor={pctAteAgora} comEmoji /></td>
        <td>{participacao === null ? '—' : `${participacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</td>
      </tr>
    )
  }

  if (modoPrevisao === 'anual') {
    return (
      <tr>
        {nomeTd()}
        <td style={{ fontWeight: 700 }}>{formatCurrency(linha.total)}</td>
        {extras()}
      </tr>
    )
  }

  return (
    <>
      <tr>
        {nomeTd(2)}
        <td style={rotuloLinha}>Previsão</td>
        {linha.meses.map((v, i) => (
          <td key={`p${i}`}>
            <CelulaMoney valor={v} aria={`${linha.nome} — previsão ${MESES_LABEL[i]}`} onSalvar={n => onValor(linha.id, i, n)} />
          </td>
        ))}
        <td rowSpan={2} style={{ fontWeight: 700 }}>{formatCurrency(linha.total)}</td>
        {extras(2)}
      </tr>
      <tr className="ac-table-linha-execucao">
        <td style={rotuloLinha}>Execução</td>
        {linha.executadoMeses.map((v, i) => (
          <td key={`e${i}`}>
            <CelulaMoney valor={v} aria={`${linha.nome} — execução ${MESES_LABEL[i]}`} onSalvar={n => onExecutado(linha.id, i, n)} />
          </td>
        ))}
      </tr>
    </>
  )
}

function contarSubarvore(g: Grupo): { grupos: number; linhas: number } {
  let grupos = 0, linhas = g.linhas.length
  for (const f of g.filhos) {
    grupos += 1
    const sub = contarSubarvore(f)
    grupos += sub.grupos
    linhas += sub.linhas
  }
  return { grupos, linhas }
}

export default function OrcamentoGrupoLinhas(props: {
  grupo: Grupo
  tipo: 'receita' | 'despesa'
  visao: Visao
  modoPrevisao: ModoPrevisao
  mesesDecorridos: number
  totalBase: number
  contratosOpcoes?: ContratoOpcao[]
  gruposFlat: GrupoFlat[]
  colspanExtras: number
  gruposFechados: Set<string>
  onToggleGrupo: (grupoId: string) => void
  onValor: (linhaId: string, mesIdx: number, valor: number) => void
  onExecutado: (linhaId: string, mesIdx: number, valor: number) => void
  onObservacao: (linhaId: string, texto: string) => void
  onContrato?: (linhaId: string, contratoId: string) => void
  onGrupo: (linhaId: string, grupoId: string) => void
  onExcluirLinha: (id: string, nome: string) => void
  onExcluirGrupo: (grupo: Grupo) => void
  onAdicionarSubcategoria: (parentId: string) => void
  onAdicionarLinha: (grupoId: string) => void
}) {
  const { grupo, visao, modoPrevisao } = props
  const aberto = !props.gruposFechados.has(grupo.id)

  const nomeCel = (rowSpan?: number) => (
    <td rowSpan={rowSpan} style={{ paddingLeft: `${(grupo.nivel - 1) * 1.1}rem` }}>
      <button type="button" onClick={() => props.onToggleGrupo(grupo.id)} style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', padding: 0, marginRight: '.4rem' }} aria-label={aberto ? 'Recolher' : 'Expandir'}>
        {aberto ? '▾' : '▸'}
      </button>
      {grupo.nome}
    </td>
  )
  const acoesCel = (rowSpan?: number) => (
    <td rowSpan={rowSpan} colSpan={props.colspanExtras}>
      <button type="button" className="ac-btn-sm is-ghost" onClick={() => props.onAdicionarLinha(grupo.id)}>+ linha</button>
      {grupo.nivel < 6 ? <button type="button" className="ac-btn-sm is-ghost" onClick={() => props.onAdicionarSubcategoria(grupo.id)}>+ subcategoria</button> : null}
      <button type="button" className="ac-btn-excluir" onClick={() => props.onExcluirGrupo(grupo)} aria-label={`Apagar categoria ${grupo.nome}`}>✕</button>
    </td>
  )

  let linhaGrupo: React.ReactNode
  if (visao === 'acompanhamento') {
    const executadoAteAgora = somarAte(grupo.executadoPorMes, props.mesesDecorridos)
    const pctAteAgora = grupo.previsaoTotal > 0 ? (executadoAteAgora / grupo.previsaoTotal) * 100 : null
    const participacao = props.totalBase > 0 ? (grupo.previsaoTotal / props.totalBase) * 100 : null
    linhaGrupo = (
      <tr className="ac-table-grupo" data-nivel={grupo.nivel} style={{ ['--ac-grupo-cor' as any]: `var(--ac-cat-${grupo.nivel})` }}>
        {nomeCel()}
        <td>{formatCurrency(grupo.previsaoTotal)}</td>
        <td>{formatCurrency(executadoAteAgora)}</td>
        <td><Percentual valor={pctAteAgora} comEmoji /></td>
        <td>{participacao === null ? '—' : `${participacao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</td>
      </tr>
    )
  } else if (modoPrevisao === 'anual') {
    linhaGrupo = (
      <tr className="ac-table-grupo" data-nivel={grupo.nivel} style={{ ['--ac-grupo-cor' as any]: `var(--ac-cat-${grupo.nivel})` }}>
        {nomeCel()}
        <td>{formatCurrency(grupo.previsaoTotal)}</td>
        {acoesCel()}
      </tr>
    )
  } else {
    linhaGrupo = (
      <>
        <tr className="ac-table-grupo" data-nivel={grupo.nivel} style={{ ['--ac-grupo-cor' as any]: `var(--ac-cat-${grupo.nivel})` }}>
          {nomeCel(2)}
          <td style={rotuloLinha}>Previsão</td>
          {grupo.previsaoPorMes.map((v, i) => <td key={`p${i}`}>{formatCurrency(v)}</td>)}
          <td rowSpan={2}>{formatCurrency(grupo.previsaoTotal)}</td>
          {acoesCel(2)}
        </tr>
        <tr className="ac-table-grupo ac-table-linha-execucao" data-nivel={grupo.nivel} style={{ ['--ac-grupo-cor' as any]: `var(--ac-cat-${grupo.nivel})` }}>
          <td style={rotuloLinha}>Execução</td>
          {grupo.executadoPorMes.map((v, i) => <td key={`e${i}`}>{formatCurrency(v)}</td>)}
        </tr>
      </>
    )
  }

  return (
    <>
      {linhaGrupo}
      {aberto ? (
        <>
          {grupo.linhas.map(l => (
            <LinhaFolha key={l.id} linha={l} tipo={props.tipo} visao={visao} modoPrevisao={modoPrevisao} mesesDecorridos={props.mesesDecorridos} totalBase={props.totalBase} contratosOpcoes={props.contratosOpcoes}
              gruposFlat={props.gruposFlat} nivelIndentacao={grupo.nivel}
              onValor={props.onValor} onExecutado={props.onExecutado} onObservacao={props.onObservacao}
              onContrato={props.onContrato} onGrupo={props.onGrupo} onExcluir={props.onExcluirLinha} />
          ))}
          {grupo.filhos.map(f => (
            <OrcamentoGrupoLinhas key={f.id} {...props} grupo={f} />
          ))}
        </>
      ) : null}
    </>
  )
}

export { contarSubarvore }
