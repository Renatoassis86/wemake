'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  MESES_LABEL, achatarGrupos, achatarOrcamento, montarOrcamento, recalcularLinha, mesesDecorridos, somarAte,
  type Orcamento, type Grupo, type GrupoBase, type LinhaOrcamento,
} from '@/lib/orcamentos'
import { formatCurrency } from '@/lib/utils'
import OrcamentoGrupoLinhas, { LinhaFolha as OrcamentoGrupoLinhasLinha, contarSubarvore, type ContratoOpcao, type Visao, type ModoPrevisao } from './OrcamentoGrupoLinhas'
import {
  atualizarValorMensal, atualizarExecutadoMensal, atualizarObservacao, vincularContrato, vincularGrupo,
  criarLinhaReceita, criarLinhaDespesa, excluirLinha, criarGrupo, excluirGrupo,
} from '@/app/(dashboard)/financeiro/orcamento/actions'

// Remanejamento foi tirado desta tela: não deve incidir sobre receita por
// escola, e pro lado de despesa precisa operar por dotação (categoria), não
// linha a linha — vai virar uma sessão própria, com o motor desenhado a
// partir do modelo do bi_financeiro (remanejamento entre conta/centro de
// custo, nunca sobre receita). Até lá, `remanejamentos` só é lido (sempre
// vazio pra quem foi criado daqui pra frente) — nada aqui cria um novo. Por
// isso o "Previsto" do Acompanhamento usa a previsão pura (linha.total /
// grupo.previsaoTotal), não a "previsão atualizada" (que embute o conceito
// de remanejamento, hoje sempre zero).

interface HandlersComuns {
  tipo: 'receita' | 'despesa'
  mesesDecorridos: number
  contratosOpcoes?: ContratoOpcao[]
  gruposFlat: ReturnType<typeof achatarGrupos>
  colspanExtras: number
  onValor: (linhaId: string, mesIdx: number, valor: number) => void
  onExecutado: (linhaId: string, mesIdx: number, valor: number) => void
  onObservacao: (linhaId: string, texto: string) => void
  onContrato?: (linhaId: string, contratoId: string) => void
  onGrupo: (linhaId: string, grupoId: string) => void
  onExcluirLinha: (id: string, nome: string) => void
  onExcluirGrupo: (grupo: Grupo) => void
  onAdicionarSubcategoria: (parentId: string) => void
  onAdicionarLinha: (grupoId: string) => void
}

/** A tabela de Previsão (com o alternador mensal/anual embutido) ou a de Acompanhamento (só leitura). */
function SecaoOrcamento({ titulo, subtitulo, visao, modoPrevisao, orcamento, todasLinhas, ...h }: HandlersComuns & {
  titulo: string
  subtitulo?: string
  visao: Visao
  modoPrevisao: ModoPrevisao
  orcamento: Orcamento
  todasLinhas: LinhaOrcamento[]
}) {
  const colSpanSemCategoria = visao === 'acompanhamento' ? 5
    : modoPrevisao === 'mensal' ? (15 + h.colspanExtras)
    : (2 + h.colspanExtras)
  const totalExecutadoAteAgora = somarAte(orcamento.executadoTotalPorMes, h.mesesDecorridos)
  const pctTotalAteAgora = orcamento.totalAnual > 0 ? (totalExecutadoAteAgora / orcamento.totalAnual) * 100 : null

  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set())
  const onToggleGrupo = (grupoId: string) => setGruposFechados(prev => {
    const next = new Set(prev)
    next.has(grupoId) ? next.delete(grupoId) : next.add(grupoId)
    return next
  })

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <h3 className="ac-h4" style={{ margin: '0 0 .25rem' }}>{titulo}</h3>
        {h.gruposFlat.length ? (
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <button type="button" className="ac-btn-sm is-ghost" onClick={() => setGruposFechados(new Set(h.gruposFlat.map(g => g.id)))}>Recolher tudo</button>
            <button type="button" className="ac-btn-sm is-ghost" onClick={() => setGruposFechados(new Set())}>Expandir tudo</button>
          </div>
        ) : null}
      </div>
      {subtitulo ? <p className="ac-nota" style={{ marginTop: 0, marginBottom: '.75rem' }}>{subtitulo}</p> : null}
      <div className="ac-table-wrap" tabIndex={0} role="region" aria-label={titulo}>
        <table className="ac-table is-num">
          <thead>
            <tr>
              <th scope="col" colSpan={visao === 'previsao' && modoPrevisao === 'mensal' ? 2 : 1}>{h.tipo === 'receita' ? 'Escola / categoria' : 'Despesa / categoria'}</th>
              {visao === 'previsao' && modoPrevisao === 'mensal' ? MESES_LABEL.map(m => <th key={m} scope="col">{m}</th>) : null}
              {visao === 'previsao' ? <th scope="col">{modoPrevisao === 'mensal' ? 'Total' : 'Previsão'}</th> : null}
              {visao === 'acompanhamento' ? (
                <>
                  <th scope="col">Previsto</th>
                  <th scope="col">Executado (até agora)</th>
                  <th scope="col">% do previsto</th>
                  <th scope="col">Participação</th>
                </>
              ) : null}
              {visao === 'previsao' ? (
                <>
                  <th scope="col">Categoria</th>
                  {h.tipo === 'receita' ? <th scope="col">Contrato</th> : null}
                  <th scope="col">Observação</th>
                  <th scope="col" aria-label="Remover" />
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {orcamento.arvore.map(g => (
              <OrcamentoGrupoLinhas key={g.id} grupo={g} visao={visao} modoPrevisao={modoPrevisao} totalBase={orcamento.totalAnual}
                gruposFechados={gruposFechados} onToggleGrupo={onToggleGrupo} {...h} />
            ))}
            {orcamento.semCategoria.length ? (
              <>
                {orcamento.arvore.length ? <tr className="ac-table-sem-categoria"><td colSpan={colSpanSemCategoria}>Sem categoria</td></tr> : null}
                {todasLinhas.filter(l => !l.grupoId).map(l => (
                  <OrcamentoGrupoLinhasLinha key={l.id} linha={l} visao={visao} modoPrevisao={modoPrevisao} nivelIndentacao={0}
                    tipo={h.tipo} mesesDecorridos={h.mesesDecorridos} totalBase={orcamento.totalAnual} contratosOpcoes={h.contratosOpcoes} gruposFlat={h.gruposFlat}
                    onValor={h.onValor} onExecutado={h.onExecutado} onObservacao={h.onObservacao} onContrato={h.onContrato}
                    onGrupo={h.onGrupo} onExcluir={h.onExcluirLinha} />
                ))}
              </>
            ) : null}
            {visao === 'previsao' && modoPrevisao === 'mensal' ? (
              <>
                <tr className="ac-total">
                  <td colSpan={2}>Total — previsão</td>
                  {orcamento.totalPorMes.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                  <td>{formatCurrency(orcamento.totalAnual)}</td>
                  <td colSpan={h.colspanExtras} />
                </tr>
                <tr className="ac-total">
                  <td colSpan={2}>Total — execução</td>
                  {orcamento.executadoTotalPorMes.map((v, i) => <td key={i}>{formatCurrency(v)}</td>)}
                  <td>{formatCurrency(orcamento.executadoTotalAnual)}</td>
                  <td colSpan={h.colspanExtras} />
                </tr>
              </>
            ) : null}
            {visao === 'previsao' && modoPrevisao === 'anual' ? (
              <tr className="ac-total">
                <td>Total</td>
                <td>{formatCurrency(orcamento.totalAnual)}</td>
                <td colSpan={h.colspanExtras} />
              </tr>
            ) : null}
            {visao === 'acompanhamento' ? (
              <tr className="ac-total">
                <td>Total</td>
                <td>{formatCurrency(orcamento.totalAnual)}</td>
                <td>{formatCurrency(totalExecutadoAteAgora)}</td>
                <td>{pctTotalAteAgora === null ? '—' : `${pctTotalAteAgora.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</td>
                <td>{orcamento.totalAnual > 0 ? '100%' : '—'}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function OrcamentoGrid({ ano, tipo, orcamentoInicial, contratosOpcoes, mostrarPrevisao = true, mostrarAcompanhamento = true, mostrarControles = true, mostrarKpis = true }: {
  ano: number
  tipo: 'receita' | 'despesa'
  orcamentoInicial: Orcamento
  contratosOpcoes?: ContratoOpcao[]
  /** oculta a tabela de Previsão — usado na Gestão Orçamentária, que só acompanha (a edição mora nas páginas de Receitas/Despesas) */
  mostrarPrevisao?: boolean
  /** oculta a tabela de Acompanhamento — usado quando ela mora só na página de Gestão Orçamentária */
  mostrarAcompanhamento?: boolean
  /** "+ Adicionar categoria"/"+ Adicionar linha" — oculto na Gestão Orçamentária, que só acompanha, não cria linha */
  mostrarControles?: boolean
  mostrarKpis?: boolean
}) {
  const inicial = useMemo(() => achatarOrcamento(orcamentoInicial), [orcamentoInicial])
  const [linhas, setLinhas] = useState<LinhaOrcamento[]>(inicial.linhas)
  const [gruposBase, setGruposBase] = useState<GrupoBase[]>(inicial.gruposBase)
  const remanejamentos = orcamentoInicial.remanejamentos
  const [erro, setErro] = useState<string | null>(null)
  const [modoPrevisao, setModoPrevisao] = useState<ModoPrevisao>('mensal')
  const [, startTransition] = useTransition()
  const decorridos = useMemo(() => mesesDecorridos(ano), [ano])

  const orcamento = useMemo(() => montarOrcamento(ano, tipo, gruposBase, linhas, remanejamentos), [ano, tipo, gruposBase, linhas, remanejamentos])
  const gruposFlat = useMemo(() => achatarGrupos(orcamento.arvore), [orcamento])

  const [formCategoriaAberto, setFormCategoriaAberto] = useState(false)
  const [categoriaParentId, setCategoriaParentId] = useState('')
  const [formLinhaAberto, setFormLinhaAberto] = useState(false)
  const [linhaGrupoId, setLinhaGrupoId] = useState('')

  function onValor(linhaId: string, mesIdx: number, valor: number) {
    setLinhas(prev => prev.map(l => l.id === linhaId ? recalcularLinha({ ...l, meses: l.meses.map((v, i) => i === mesIdx ? valor : v) }) : l))
    startTransition(async () => { await atualizarValorMensal(linhaId, mesIdx + 1, valor) })
  }

  function onExecutado(linhaId: string, mesIdx: number, valor: number) {
    setLinhas(prev => prev.map(l => l.id === linhaId ? recalcularLinha({ ...l, executadoMeses: l.executadoMeses.map((v, i) => i === mesIdx ? valor : v) }) : l))
    startTransition(async () => { await atualizarExecutadoMensal(linhaId, mesIdx + 1, valor) })
  }

  function onObservacao(linhaId: string, texto: string) {
    setLinhas(prev => prev.map(l => l.id === linhaId ? { ...l, observacao: texto.trim() || null } : l))
    startTransition(async () => { await atualizarObservacao(linhaId, texto) })
  }

  function onContrato(linhaId: string, contratoId: string) {
    setLinhas(prev => prev.map(l => l.id === linhaId ? { ...l, contratoId: contratoId || null } : l))
    startTransition(async () => { await vincularContrato(linhaId, contratoId || null) })
  }

  function onGrupo(linhaId: string, grupoId: string) {
    setLinhas(prev => prev.map(l => l.id === linhaId ? { ...l, grupoId: grupoId || null } : l))
    startTransition(async () => { await vincularGrupo(linhaId, grupoId || null) })
  }

  function onExcluirLinha(id: string, nome: string) {
    if (!confirm(`Remover "${nome}" do orçamento de ${ano}? Não pode ser desfeito.`)) return
    setLinhas(prev => prev.filter(l => l.id !== id))
    startTransition(async () => { await excluirLinha(id) })
  }

  function onExcluirGrupo(grupo: Grupo) {
    const { grupos, linhas: nLinhas } = contarSubarvore(grupo)
    const aviso = `Apagar "${grupo.nome}" vai apagar ${grupos} subcategoria(s) e ${nLinhas} linha(s) de orçamento dentro dela, incluindo os valores lançados. Não pode ser desfeito.`
    if (!confirm(aviso)) return

    const idsGrupos = new Set<string>([grupo.id])
    ;(function coletar(g: Grupo) { for (const f of g.filhos) { idsGrupos.add(f.id); coletar(f) } })(grupo)

    setGruposBase(prev => prev.filter(g => !idsGrupos.has(g.id)))
    setLinhas(prev => prev.filter(l => !l.grupoId || !idsGrupos.has(l.grupoId)))
    startTransition(async () => { await excluirGrupo(grupo.id) })
  }

  function adicionarCategoria(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData(e.currentTarget)
    fd.set('ano', String(ano))
    fd.set('tipo', tipo)
    const nome = String(fd.get('nome') ?? '').trim()
    if (!nome) { setErro('Informe o nome da categoria.'); return }
    const parentId = categoriaParentId || null
    const pai = parentId ? gruposFlat.find(g => g.id === parentId) : null
    const nivel = pai ? pai.nivel + 1 : 1
    if (nivel > 6) { setErro('Limite de 6 níveis de categoria atingido.'); return }
    fd.set('parent_id', parentId ?? '')

    startTransition(async () => {
      const res = await criarGrupo(fd)
      if (!res.success || !res.id) { setErro(res.error ?? 'Não foi possível criar a categoria.'); return }
      setGruposBase(prev => [...prev, {
        id: res.id!, parentId, nivel, nome, ordem: prev.length + 1,
      }])
      setFormCategoriaAberto(false)
      setCategoriaParentId('')
    })
  }

  function adicionarLinha(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)
    const fd = new FormData(e.currentTarget)
    fd.set('ano', String(ano))
    const nome = String(fd.get('nome') ?? '').trim()
    if (!nome) { setErro(tipo === 'receita' ? 'Informe o nome da escola.' : 'Informe o nome da despesa.'); return }
    const grupoId = linhaGrupoId || null
    if (grupoId) fd.set('grupo_id', grupoId)
    const contratoId = tipo === 'receita' ? (fd.get('contrato_id') as string) || null : null

    startTransition(async () => {
      const res = tipo === 'receita' ? await criarLinhaReceita(fd) : await criarLinhaDespesa(fd)
      if (!res.success || !res.id) { setErro(res.error ?? 'Não foi possível adicionar.'); return }
      setLinhas(prev => [...prev, {
        id: res.id!, grupoId, nome, observacao: null, contratoId,
        meses: Array(12).fill(0), executadoMeses: Array(12).fill(0), total: 0, executadoTotal: 0,
        remanejamentoLiquido: 0, previsaoAtualizada: 0, percentualExecucao: null, ordem: prev.length + 1,
      }])
      setFormLinhaAberto(false)
      setLinhaGrupoId('')
    })
  }

  const todasLinhas = [...linhas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const colspanExtras = 1 /* categoria */ + (tipo === 'receita' ? 1 : 0) /* contrato */ + 1 /* observação */ + 1 /* excluir */

  const handlers: HandlersComuns = {
    tipo, mesesDecorridos: decorridos, contratosOpcoes, gruposFlat, colspanExtras,
    onValor, onExecutado, onObservacao, onContrato: tipo === 'receita' ? onContrato : undefined, onGrupo,
    onExcluirLinha, onExcluirGrupo,
    onAdicionarSubcategoria: id => { setCategoriaParentId(id); setFormCategoriaAberto(true) },
    onAdicionarLinha: id => { setLinhaGrupoId(id); setFormLinhaAberto(true) },
  }

  return (
    <>
      {mostrarKpis ? (
        <dl className="ac-kpis" style={{ marginBottom: '1.25rem' }}>
          <div><dt>Previsão (ano)</dt><dd className="ac-kpi-m">{formatCurrency(orcamento.totalAnual)}</dd></div>
          <div><dt>Executado até agora</dt><dd className="ac-kpi-m">{formatCurrency(somarAte(orcamento.executadoTotalPorMes, decorridos))}</dd></div>
          <div><dt>% do previsto</dt><dd className="ac-kpi-m">
            {(() => {
              const ex = somarAte(orcamento.executadoTotalPorMes, decorridos)
              const p = orcamento.totalAnual > 0 ? (ex / orcamento.totalAnual) * 100 : null
              return p === null ? '—' : `${p.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
            })()}
          </dd></div>
        </dl>
      ) : null}

      {mostrarPrevisao ? (
        <>
          <div role="group" aria-label="Visualização" style={{ marginBottom: '.75rem', display: 'flex', gap: '.4rem' }}>
            <button type="button" className={`ac-btn-sm${modoPrevisao === 'mensal' ? '' : ' is-ghost'}`} onClick={() => setModoPrevisao('mensal')}>Mensal</button>
            <button type="button" className={`ac-btn-sm${modoPrevisao === 'anual' ? '' : ' is-ghost'}`} onClick={() => setModoPrevisao('anual')}>Anual</button>
          </div>

          <SecaoOrcamento titulo="Previsão" subtitulo="Previsão (editável) e execução real, mês a mês. Clique em Mensal/Anual acima pra alternar."
            visao="previsao" modoPrevisao={modoPrevisao} orcamento={orcamento} todasLinhas={todasLinhas} {...handlers} />
        </>
      ) : null}

      {mostrarAcompanhamento ? (
        <SecaoOrcamento titulo="Acompanhamento — previsto x executado"
          subtitulo={`Soma o executado só até o mês em andamento (${decorridos === 0 ? 'o ano ainda não começou' : MESES_LABEL[decorridos - 1]}).`}
          visao="acompanhamento" modoPrevisao={modoPrevisao} orcamento={orcamento} todasLinhas={todasLinhas} {...handlers} />
      ) : null}

      {mostrarControles ? (
      <div style={{ marginTop: '.9rem', display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
        {formCategoriaAberto ? (
          <form onSubmit={adicionarCategoria} style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', alignItems: 'flex-start' }}>
            <input name="nome" placeholder="Nome da categoria" required style={{ padding: '.55rem .7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.85rem', minWidth: '14rem' }} />
            <select value={categoriaParentId} onChange={e => setCategoriaParentId(e.target.value)} style={{ padding: '.55rem .7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.85rem' }}>
              <option value="">— nenhum (nível 1) —</option>
              {gruposFlat.map(g => <option key={g.id} value={g.id}>{'—'.repeat(g.nivel - 1)} {g.nome}</option>)}
            </select>
            <button type="submit" className="ac-btn-sm">Criar categoria</button>
            <button type="button" className="ac-btn-sm is-ghost" onClick={() => { setFormCategoriaAberto(false); setCategoriaParentId('') }}>Cancelar</button>
          </form>
        ) : (
          <button type="button" className="ac-btn-sm" onClick={() => setFormCategoriaAberto(true)}>+ Adicionar categoria</button>
        )}

        {formLinhaAberto ? (
          <form onSubmit={adicionarLinha} style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', alignItems: 'flex-start' }}>
            <input name="nome" placeholder={tipo === 'receita' ? 'Nome da escola' : 'Nome da despesa'} required style={{ padding: '.55rem .7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.85rem', minWidth: '14rem' }} />
            <select value={linhaGrupoId} onChange={e => setLinhaGrupoId(e.target.value)} style={{ padding: '.55rem .7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.85rem' }}>
              <option value="">— sem categoria —</option>
              {gruposFlat.map(g => <option key={g.id} value={g.id}>{'—'.repeat(g.nivel - 1)} {g.nome}</option>)}
            </select>
            {tipo === 'receita' ? (
              <select name="contrato_id" defaultValue="" style={{ padding: '.55rem .7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.85rem' }}>
                <option value="">— sem contrato —</option>
                {contratosOpcoes?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            ) : null}
            <button type="submit" className="ac-btn-sm">Adicionar</button>
            <button type="button" className="ac-btn-sm is-ghost" onClick={() => { setFormLinhaAberto(false); setLinhaGrupoId('') }}>Cancelar</button>
          </form>
        ) : (
          <button type="button" className="ac-btn-sm" onClick={() => setFormLinhaAberto(true)}>+ Adicionar {tipo === 'receita' ? 'escola' : 'despesa'}</button>
        )}
      </div>
      ) : null}
      {erro ? <p className="ac-nota" style={{ color: '#b3261e' }}>{erro}</p> : null}
    </>
  )
}
