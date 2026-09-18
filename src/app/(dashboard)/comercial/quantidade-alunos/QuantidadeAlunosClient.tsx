'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SERIES_CONTRATO } from '@/lib/contratos'
import { atualizarQtdSerie, atualizarLivroImpresso, adicionarEscolaManual, criarEscolaVeterana, atualizarEstadoEscola, removerEscolaDaLista } from './actions'

export interface EscolaLinha {
  escolaId: string
  nome: string
  cidade: string | null
  uf: string | null
  livroImpresso: boolean
  removivel: boolean
  total: number
  qtds: Record<string, number>
}

interface EscolaDisponivel { id: string; nome: string; uf: string | null }

interface Props {
  linhasIniciais: EscolaLinha[]
  escolasDisponiveis: EscolaDisponivel[]
  livroColunaExiste: boolean
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

export function QuantidadeAlunosClient({ linhasIniciais, escolasDisponiveis, livroColunaExiste }: Props) {
  const router = useRouter()
  const [buscaAdicionar, setBuscaAdicionar] = useState('')
  const [novaEstado, setNovaEstado] = useState('')
  const [adicionando, startAdicionando] = useTransition()
  const [criando, startCriando] = useTransition()
  const [removendo, startRemovendo] = useTransition()
  const [removendoId, setRemovendoId] = useState<string | null>(null)

  const totaisColuna = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const s of SERIES_CONTRATO) acc[s.campo] = linhasIniciais.reduce((soma, l) => soma + (l.qtds[s.campo] || 0), 0)
    return acc
  }, [linhasIniciais])

  const totalGeral = linhasIniciais.reduce((soma, l) => soma + l.total, 0)

  const escolasLivro = linhasIniciais.filter(l => l.livroImpresso)

  const candidatos = buscaAdicionar.trim().length >= 2
    ? escolasDisponiveis.filter(e => e.nome.toLowerCase().includes(buscaAdicionar.trim().toLowerCase())).slice(0, 8)
    : []

  function salvarCampo(escolaId: string, campo: string, valor: number) {
    atualizarQtdSerie(escolaId, campo, valor).then(res => { if (res.success) router.refresh() })
  }

  function toggleLivro(escolaId: string, valorAtual: boolean) {
    atualizarLivroImpresso(escolaId, !valorAtual).then(res => { if (res.success) router.refresh() })
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

      {/* ── Grade principal ──────────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '.5rem' }}>
          <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Alunos por série — {linhasIniciais.length} escola{linhasIniciais.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: '#4A7FDB' }}>
            {totalGeral.toLocaleString('pt-BR')} alunos
          </div>
        </div>

        {!livroColunaExiste && (
          <div style={{ padding: '.6rem 1.25rem', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: '.72rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)' }}>
            A tag "Livro" ainda não está ativa — rode a migração <code>add_livro_impresso.sql</code> no Supabase pra habilitá-la.
          </div>
        )}

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
              {linhasIniciais.map(l => (
                <tr key={l.escolaId}>
                  <td style={{ ...td, textAlign: 'left', fontSize: '.78rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-inter,sans-serif)', position: 'sticky', left: 0, background: '#fff', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Link href={`/comercial/escolas/${l.escolaId}/editar`} style={{ color: '#0f172a', textDecoration: 'none' }} title="Editar dados cadastrais da escola">
                        {l.nome}
                      </Link>
                      <EstadoEditavel escolaId={l.escolaId} uf={l.uf} />
                      <span style={{
                        fontSize: '.6rem', fontWeight: 700, padding: '.08rem .4rem', borderRadius: 5, whiteSpace: 'nowrap',
                        background: l.removivel ? '#f1f5f9' : '#ecfdf5', color: l.removivel ? '#64748b' : '#059669',
                      }}>
                        {l.removivel ? 'Veterana' : 'Nova'}
                      </span>
                    </span>
                  </td>
                  {SERIES_CONTRATO.map(s => (
                    <td key={s.campo} style={tdSerie}>
                      <CelulaEditavel valor={l.qtds[s.campo] || 0} onSalvar={v => salvarCampo(l.escolaId, s.campo, v)} />
                    </td>
                  ))}
                  <td style={{ ...td, fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)', color: '#4A7FDB' }}>{l.total}</td>
                  <td style={td}>
                    <input
                      type="checkbox" checked={l.livroImpresso} disabled={!livroColunaExiste}
                      onChange={() => toggleLivro(l.escolaId, l.livroImpresso)}
                      style={{ width: 16, height: 16, cursor: livroColunaExiste ? 'pointer' : 'not-allowed' }}
                    />
                  </td>
                  <td style={td}>
                    {l.removivel && (
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
              {linhasIniciais.length === 0 && (
                <tr><td colSpan={20} style={{ ...td, padding: '2rem', color: '#94a3b8', fontSize: '.8rem' }}>Nenhuma escola na lista ainda.</td></tr>
              )}
            </tbody>
            {linhasIniciais.length > 0 && (
              <tfoot>
                <tr>
                  <td style={{ ...td, textAlign: 'left', fontWeight: 800, fontSize: '.72rem', color: '#64748b', position: 'sticky', left: 0, background: '#f8fafc' }}>Total por série</td>
                  {SERIES_CONTRATO.map(s => (
                    <td key={s.campo} style={{ ...tdSerie, fontWeight: 800, fontSize: '.78rem', color: '#0f172a', background: '#f8fafc' }}>{totaisColuna[s.campo]}</td>
                  ))}
                  <td style={{ ...td, fontWeight: 800, color: '#4A7FDB', background: '#f8fafc' }}>{totalGeral}</td>
                  <td style={{ ...td, background: '#f8fafc' }} />
                  <td style={{ ...td, background: '#f8fafc' }} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Distribuição pra gráfica (só escolas marcadas com Livro) ───── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Pedido pra gráfica — distribuição de livros por série
          </div>
          <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: '.2rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
            Somente escolas marcadas com a tag "Livro" acima.
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
                    <td key={s.campo} style={{ ...tdSerie, fontSize: '.78rem', color: '#334155' }}>{l.qtds[s.campo] || 0}</td>
                  ))}
                  <td style={{ ...td, fontWeight: 800, color: '#4A7FDB', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{l.total}</td>
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
                      {escolasLivro.reduce((soma, l) => soma + (l.qtds[s.campo] || 0), 0)}
                    </td>
                  ))}
                  <td style={{ ...td, fontWeight: 800, color: '#4A7FDB', background: '#f8fafc' }}>
                    {escolasLivro.reduce((soma, l) => soma + l.total, 0)}
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
