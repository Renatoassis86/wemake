'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SERIES_CONTRATO } from '@/lib/contratos'
import {
  atualizarQtdSerie, atualizarLivroImpresso, adicionarEscolaManual, criarEscolaVeterana,
  atualizarEstadoEscola, removerEscolaDaLista, atualizarMarcadoVeterana, atualizarQtdLivroSerie, atualizarNomeEscola,
} from './actions'

export interface EscolaLinha {
  escolaId: string
  nome: string
  cidade: string | null
  uf: string | null
  livroImpresso: boolean
  veterana: boolean
  total: number
  qtds: Record<string, number>
  livroQtds: Record<string, number>
}

interface EscolaDisponivel { id: string; nome: string; uf: string | null }

interface Props {
  linhasIniciais: EscolaLinha[]
  escolasDisponiveis: EscolaDisponivel[]
  livroColunaExiste: boolean
  veteranaColunaExiste: boolean
  livroQtdsColunaExiste: boolean
}

const th: React.CSSProperties = {
  padding: '.55rem .5rem', fontSize: '.66rem', fontWeight: 800, textTransform: 'uppercase',
  letterSpacing: '.04em', color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)',
  textAlign: 'center', whiteSpace: 'nowrap', borderBottom: '2px solid #e2e8f0', background: '#f8fafc',
}
const td: React.CSSProperties = {
  padding: '.35rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center', verticalAlign: 'middle',
}
const tdSerie: React.CSSProperties = { ...td, minWidth: 60 }
const thSerie: React.CSSProperties = { ...th, minWidth: 60 }

function CelulaEditavel({ valor, onSalvar }: { valor: number; onSalvar: (novo: number) => void }) {
  const [texto, setTexto] = useState(String(valor || ''))
  const [pending, startTransition] = useTransition()

  function commit() {
    const num = parseInt(texto, 10)
    const final = Number.isFinite(num) && num >= 0 ? num : 0
    setTexto(final ? String(final) : '')
    if (final !== valor) startTransition(() => onSalvar(final))
  }

  return (
    <input
      type="number" min={0} value={texto}
      onChange={e => setTexto(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      className="qa-input-no-spinner"
      style={{
        width: '100%', minWidth: 40, maxWidth: 56, boxSizing: 'border-box', padding: '.3rem .15rem', textAlign: 'center', borderRadius: 6,
        border: '1.5px solid #e2e8f0', fontSize: '.78rem', fontFamily: 'var(--font-inter,sans-serif)',
        background: pending ? '#fef9c3' : '#fff', opacity: pending ? .7 : 1,
      }}
    />
  )
}

function NomeEditavel({ escolaId, nome }: { escolaId: string; nome: string }) {
  const router = useRouter()
  const [texto, setTexto] = useState(nome)
  const [pending, startTransition] = useTransition()

  function commit() {
    const final = texto.trim()
    if (final.length < 2 || final === nome) { setTexto(nome); return }
    startTransition(() => {
      atualizarNomeEscola(escolaId, final).then(res => {
        if (res.success) router.refresh()
        else { alert(res.error); setTexto(nome) }
      })
    })
  }

  return (
    <input
      value={texto}
      onChange={e => setTexto(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      title="Corrigir nome da escola"
      style={{
        minWidth: 140, width: `${Math.max(texto.length, 10)}ch`, padding: '.15rem .3rem', borderRadius: 5,
        border: '1.5px solid transparent', fontSize: '.78rem', fontWeight: 700, color: '#0f172a',
        fontFamily: 'var(--font-inter,sans-serif)', background: pending ? '#fef9c3' : 'transparent',
      }}
      onFocus={e => { e.currentTarget.style.border = '1.5px solid #e2e8f0'; e.currentTarget.style.background = '#fff' }}
      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.border = '1.5px solid transparent'; e.currentTarget.style.background = pending ? '#fef9c3' : 'transparent' } }}
    />
  )
}

function CheckboxLivro({ escolaId, checked, disabled }: { escolaId: string; checked: boolean; disabled: boolean }) {
  const router = useRouter()
  // Estado local otimista — o clique precisa responder na hora, sem esperar
  // o round-trip do servidor. Some mismatches com a prop `checked` (vinda de
  // outro refresh em andamento) são resolvidos assim que o refresh chega.
  const [local, setLocal] = useState(checked)
  const [pending, startTransition] = useTransition()

  useEffect(() => { if (!pending) setLocal(checked) }, [checked, pending])

  function onChange() {
    if (disabled || pending) return
    const novoValor = !local
    setLocal(novoValor)
    startTransition(() => {
      atualizarLivroImpresso(escolaId, novoValor).then(res => {
        if (res.success) router.refresh()
        else { setLocal(!novoValor); alert(res.error) }
      })
    })
  }

  return (
    <input
      type="checkbox" checked={local} disabled={disabled}
      onChange={onChange}
      style={{ width: 16, height: 16, cursor: disabled ? 'not-allowed' : 'pointer', opacity: pending ? .6 : 1 }}
    />
  )
}

function EstadoEditavel({ escolaId, uf }: { escolaId: string; uf: string | null }) {
  const router = useRouter()
  const [texto, setTexto] = useState(uf ?? '')
  const [pending, startTransition] = useTransition()

  function commit() {
    const final = texto.trim().toUpperCase().slice(0, 2)
    setTexto(final)
    if (final !== (uf ?? '')) {
      startTransition(() => {
        atualizarEstadoEscola(escolaId, final || null).then(res => { if (res.success) router.refresh() })
      })
    }
  }

  return (
    <input
      value={texto}
      onChange={e => setTexto(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      placeholder="UF"
      maxLength={2}
      style={{
        width: 34, marginLeft: 6, padding: '.1rem .2rem', textAlign: 'center', textTransform: 'uppercase',
        borderRadius: 5, border: '1.5px solid #e2e8f0', fontSize: '.68rem', fontWeight: 600,
        color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)',
        background: pending ? '#fef9c3' : 'transparent',
      }}
    />
  )
}

function TagVeterana({ escolaId, veterana, editavel }: { escolaId: string; veterana: boolean; editavel: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function toggle() {
    if (!editavel || pending) return
    startTransition(() => {
      atualizarMarcadoVeterana(escolaId, !veterana).then(res => {
        if (res.success) router.refresh()
        else alert(res.error)
      })
    })
  }

  return (
    <button
      onClick={toggle} disabled={!editavel || pending}
      title={editavel ? 'Clique pra trocar entre Veterana e Nova' : 'Rode a migração add_contrato_marcado_veterana.sql pra poder editar'}
      style={{
        fontSize: '.6rem', fontWeight: 700, padding: '.08rem .4rem', borderRadius: 5, whiteSpace: 'nowrap',
        border: 'none', cursor: editavel ? 'pointer' : 'not-allowed', opacity: pending ? .6 : 1,
        background: veterana ? '#f1f5f9' : '#ecfdf5', color: veterana ? '#64748b' : '#059669',
      }}
    >
      {veterana ? 'Veterana' : 'Nova'}
    </button>
  )
}

function TabelaAlunos({ titulo, subtitulo, corAccent, linhas, livroColunaExiste, veteranaColunaExiste, salvarCampo, remover, removendo, removendoId }: {
  titulo: string; subtitulo: string; corAccent: string; linhas: EscolaLinha[]
  livroColunaExiste: boolean; veteranaColunaExiste: boolean
  salvarCampo: (escolaId: string, campo: string, valor: number) => void
  remover: (escolaId: string, nome: string) => void
  removendo: boolean; removendoId: string | null
}) {
  const totaisColuna = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const s of SERIES_CONTRATO) acc[s.campo] = linhas.reduce((soma, l) => soma + (l.qtds[s.campo] || 0), 0)
    return acc
  }, [linhas])
  const totalGeral = linhas.reduce((soma, l) => soma + l.total, 0)

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', borderTop: `4px solid ${corAccent}` }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '.5rem' }}>
        <div>
          <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            {titulo} — {linhas.length} escola{linhas.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: '.15rem', fontFamily: 'var(--font-inter,sans-serif)' }}>{subtitulo}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: corAccent }}>
          {totalGeral.toLocaleString('pt-BR')} alunos
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1 }}>Escola</th>
              {SERIES_CONTRATO.map(s => <th key={s.campo} style={thSerie} title={s.segmento}>{s.label}</th>)}
              <th style={th}>Total</th>
              <th style={th}>Livro</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr key={l.escolaId}>
                <td style={{ ...td, textAlign: 'left', fontSize: '.78rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', position: 'sticky', left: 0, background: '#fff', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <NomeEditavel escolaId={l.escolaId} nome={l.nome} />
                    <Link href={`/comercial/escolas/${l.escolaId}/editar`} title="Abrir cadastro completo da escola" style={{ color: '#94a3b8', display: 'inline-flex', flexShrink: 0 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </Link>
                    <EstadoEditavel escolaId={l.escolaId} uf={l.uf} />
                    <TagVeterana escolaId={l.escolaId} veterana={l.veterana} editavel={veteranaColunaExiste} />
                  </span>
                </td>
                {SERIES_CONTRATO.map(s => (
                  <td key={s.campo} style={tdSerie}>
                    <CelulaEditavel valor={l.qtds[s.campo] || 0} onSalvar={v => salvarCampo(l.escolaId, s.campo, v)} />
                  </td>
                ))}
                <td style={{ ...td, fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)', color: corAccent }}>{l.total}</td>
                <td style={td}>
                  <CheckboxLivro escolaId={l.escolaId} checked={l.livroImpresso} disabled={!livroColunaExiste} />
                </td>
                <td style={td}>
                  {l.veterana && (
                    <button
                      onClick={() => remover(l.escolaId, l.nome)}
                      disabled={removendo && removendoId === l.escolaId}
                      title="Remover escola da lista"
                      style={{
                        width: 22, height: 22, borderRadius: 6, border: '1.5px solid #fca5a5', background: '#fff',
                        color: '#dc2626', cursor: 'pointer', fontSize: '.7rem', fontWeight: 800, lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr><td colSpan={20} style={{ ...td, padding: '2rem', color: '#94a3b8', fontSize: '.8rem' }}>Nenhuma escola aqui ainda.</td></tr>
            )}
          </tbody>
          {linhas.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ ...td, textAlign: 'left', fontWeight: 800, fontSize: '.72rem', color: '#64748b', position: 'sticky', left: 0, background: '#f8fafc' }}>Total por série</td>
                {SERIES_CONTRATO.map(s => (
                  <td key={s.campo} style={{ ...tdSerie, fontWeight: 800, fontSize: '.78rem', color: '#0f172a', background: '#f8fafc' }}>{totaisColuna[s.campo]}</td>
                ))}
                <td style={{ ...td, fontWeight: 800, color: corAccent, background: '#f8fafc' }}>{totalGeral}</td>
                <td style={{ ...td, background: '#f8fafc' }} />
                <td style={{ ...td, background: '#f8fafc' }} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

export function QuantidadeAlunosClient({ linhasIniciais, escolasDisponiveis, livroColunaExiste, veteranaColunaExiste, livroQtdsColunaExiste }: Props) {
  const router = useRouter()
  const [buscaAdicionar, setBuscaAdicionar] = useState('')
  const [novaEstado, setNovaEstado] = useState('')
  const [adicionando, startAdicionando] = useTransition()
  const [criando, startCriando] = useTransition()
  const [removendo, startRemovendo] = useTransition()
  const [removendoId, setRemovendoId] = useState<string | null>(null)

  // Dois quadros visíveis: parcerias já fechadas (veteranas) e negociação em
  // andamento pro ano que vem (chegaram pela minuta) — antes era uma tabela
  // só com uma tag no meio, o que misturava visualmente as duas situações.
  const linhasFechadas = linhasIniciais.filter(l => l.veterana)
  const linhasNegociacao = linhasIniciais.filter(l => !l.veterana)

  const totalGeral = linhasIniciais.reduce((soma, l) => soma + l.total, 0)

  const escolasLivro = linhasIniciais.filter(l => l.livroImpresso)

  const candidatos = buscaAdicionar.trim().length >= 2
    ? escolasDisponiveis.filter(e => e.nome.toLowerCase().includes(buscaAdicionar.trim().toLowerCase())).slice(0, 8)
    : []

  function salvarCampo(escolaId: string, campo: string, valor: number) {
    atualizarQtdSerie(escolaId, campo, valor).then(res => { if (res.success) router.refresh() })
  }

  function salvarCampoLivro(escolaId: string, campo: string, valor: number) {
    atualizarQtdLivroSerie(escolaId, campo, valor).then(res => { if (res.success) router.refresh() })
  }

  function adicionar(escolaId: string) {
    startAdicionando(async () => {
      const res = await adicionarEscolaManual(escolaId)
      if (res.success) { setBuscaAdicionar(''); router.refresh() }
    })
  }

  function criarNova() {
    const nome = buscaAdicionar.trim()
    if (nome.length < 2) return
    startCriando(async () => {
      const res = await criarEscolaVeterana(nome, novaEstado || null)
      if (res.success) { setBuscaAdicionar(''); setNovaEstado(''); router.refresh() }
    })
  }

  function remover(escolaId: string, nome: string) {
    if (!window.confirm(`Remover "${nome}" da lista de Quantidade de Alunos? O cadastro da escola não é apagado — só sai dessa lista.`)) return
    setRemovendoId(escolaId)
    startRemovendo(async () => {
      const res = await removerEscolaDaLista(escolaId)
      setRemovendoId(null)
      if (res.success) router.refresh()
      else alert(res.error)
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        .qa-input-no-spinner::-webkit-outer-spin-button,
        .qa-input-no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .qa-input-no-spinner { -moz-appearance: textfield; }
      `}</style>

      {/* ── Adicionar escola veterana manualmente ─────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem 1.25rem', position: 'relative' }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, color: '#0f172a', marginBottom: '.4rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
          + Adicionar escola parceira à lista
        </div>
        <div style={{ fontSize: '.68rem', color: '#94a3b8', marginBottom: '.5rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
          Escolas que chegam à fase de minuta entram aqui automaticamente. Para escolas veteranas que já são parceiras fora do funil, busque e adicione — se não existir ainda no cadastro, cadastre uma nova direto por aqui.
        </div>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          <input
            value={buscaAdicionar}
            onChange={e => setBuscaAdicionar(e.target.value)}
            placeholder="Buscar escola pelo nome..."
            style={{ flex: '1 1 260px', maxWidth: 360, padding: '.5rem .7rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.8rem', boxSizing: 'border-box' }}
          />
          {buscaAdicionar.trim().length >= 2 && candidatos.length === 0 && (
            <>
              <input
                value={novaEstado}
                onChange={e => setNovaEstado(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="UF"
                maxLength={2}
                style={{ width: 56, padding: '.5rem .4rem', textAlign: 'center', textTransform: 'uppercase', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '.8rem', boxSizing: 'border-box' }}
              />
              <button
                onClick={criarNova} disabled={criando}
                style={{
                  padding: '.5rem .9rem', borderRadius: 8, border: 'none', cursor: criando ? 'wait' : 'pointer',
                  background: '#4A7FDB', color: '#fff', fontSize: '.76rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', whiteSpace: 'nowrap',
                }}
              >
                {criando ? 'Cadastrando...' : `+ Cadastrar "${buscaAdicionar.trim()}"`}
              </button>
            </>
          )}
        </div>
        {candidatos.length > 0 && (
          <div style={{
            position: 'absolute', zIndex: 10, marginTop: '.3rem', width: '100%', maxWidth: 360,
            background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 12px 28px rgba(15,23,42,.14)', overflow: 'hidden',
          }}>
            {candidatos.map(c => (
              <button
                key={c.id} disabled={adicionando} onClick={() => adicionar(c.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '.55rem .8rem',
                  border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', cursor: adicionando ? 'wait' : 'pointer',
                  fontSize: '.78rem', fontFamily: 'var(--font-inter,sans-serif)', color: '#0f172a',
                }}
              >
                {c.nome} {c.uf ? <span style={{ color: '#94a3b8' }}>· {c.uf}</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {(!livroColunaExiste || !veteranaColunaExiste || !livroQtdsColunaExiste) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {!livroColunaExiste && (
            <div style={{ padding: '.6rem 1.25rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '.72rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)' }}>
              A tag "Livro" ainda não está ativa — rode a migração <code>add_livro_impresso.sql</code> no Supabase pra habilitá-la.
            </div>
          )}
          {!veteranaColunaExiste && (
            <div style={{ padding: '.6rem 1.25rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '.72rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)' }}>
              A tag Veterana/Nova ainda não é editável — rode a migração <code>add_contrato_marcado_veterana.sql</code> no Supabase pra habilitá-la.
            </div>
          )}
          {!livroQtdsColunaExiste && (
            <div style={{ padding: '.6rem 1.25rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: '.72rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)' }}>
              A tabela da gráfica ainda não é editável de forma independente — rode a migração <code>add_contrato_livro_qtds.sql</code> no Supabase pra habilitá-la.
            </div>
          )}
        </div>
      )}

      <TabelaAlunos
        titulo="Parcerias Fechadas — Ano Corrente"
        subtitulo="Escolas veteranas — parceria já efetivada, sem negócio novo em andamento pro ano que vem"
        corAccent="#0f766e"
        linhas={linhasFechadas}
        livroColunaExiste={livroColunaExiste}
        veteranaColunaExiste={veteranaColunaExiste}
        salvarCampo={salvarCampo}
        remover={remover}
        removendo={removendo}
        removendoId={removendoId}
      />

      <TabelaAlunos
        titulo="Em Negociação — Ano 2027"
        subtitulo="Escolas com minuta enviada — venda pro ano que vem em andamento"
        corAccent="#4A7FDB"
        linhas={linhasNegociacao}
        livroColunaExiste={livroColunaExiste}
        veteranaColunaExiste={veteranaColunaExiste}
        salvarCampo={salvarCampo}
        remover={remover}
        removendo={removendo}
        removendoId={removendoId}
      />

      {/* ── Distribuição pra gráfica (só escolas marcadas com Livro) ───── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Pedido pra gráfica — distribuição de livros por série
          </div>
          <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
            Somente escolas marcadas com a tag "Livro" acima. Ajustes aqui são independentes do contrato — editar a tabela de cima sempre atualiza esses números, mas editar aqui não mexe no contrato.
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1 }}>Escola</th>
                {SERIES_CONTRATO.map(s => <th key={s.campo} style={thSerie}>{s.label}</th>)}
                <th style={th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {escolasLivro.map(l => (
                <tr key={l.escolaId}>
                  <td style={{ ...td, textAlign: 'left', fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--font-inter,sans-serif)', position: 'sticky', left: 0, background: '#fff', whiteSpace: 'nowrap' }}>
                    <Link href={`/comercial/escolas/${l.escolaId}/editar`} style={{ color: '#0f172a', textDecoration: 'none' }} title="Editar dados cadastrais da escola">
                      {l.nome}
                    </Link>
                  </td>
                  {SERIES_CONTRATO.map(s => (
                    <td key={s.campo} style={tdSerie}>
                      {livroQtdsColunaExiste
                        ? <CelulaEditavel valor={l.livroQtds[s.campo] || 0} onSalvar={v => salvarCampoLivro(l.escolaId, s.campo, v)} />
                        : (l.livroQtds[s.campo] || 0)}
                    </td>
                  ))}
                  <td style={{ ...td, fontWeight: 800, color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                    {SERIES_CONTRATO.reduce((soma, s) => soma + (l.livroQtds[s.campo] || 0), 0)}
                  </td>
                </tr>
              ))}
              {escolasLivro.length === 0 && (
                <tr><td colSpan={18} style={{ ...td, padding: '2rem', color: '#94a3b8', fontSize: '.8rem' }}>Nenhuma escola marcada com a tag "Livro" ainda.</td></tr>
              )}
            </tbody>
            {escolasLivro.length > 0 && (
              <tfoot>
                <tr>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 800, fontSize: '.72rem', color: '#64748b', position: 'sticky', left: 0, background: '#f8fafc' }}>Total por série</td>
                  {SERIES_CONTRATO.map(s => (
                    <td key={s.campo} style={{ ...tdSerie, fontWeight: 800, fontSize: '.78rem', color: '#0f172a', background: '#f8fafc' }}>
                      {escolasLivro.reduce((soma, l) => soma + (l.livroQtds[s.campo] || 0), 0)}
                    </td>
                  ))}
                  <td style={{ ...td, fontWeight: 800, color: '#4A7FDB', background: '#f8fafc' }}>
                    {escolasLivro.reduce((soma, l) => soma + SERIES_CONTRATO.reduce((s2, s) => s2 + (l.livroQtds[s.campo] || 0), 0), 0)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
