'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, X } from 'lucide-react'
import { adicionarAlunosHistorico } from '@/lib/actions'
import type { AlunosHistorico } from '@/types/database'

const ORIGEM_LABEL: Record<AlunosHistorico['origem'], string> = {
  cadastro: 'Cadastro inicial',
  proposta: 'Proposta',
  manual: 'Atualização manual',
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Card de "Alunos" da página da escola: mostra o valor atual (linha mais
 * recente do histórico), o valor original do formulário de pré-cadastro
 * (sempre a linha mais antiga, origem 'cadastro'), e permite registrar um
 * novo número sem apagar os anteriores — o número muda durante a
 * negociação, mas a linha do tempo completa fica preservada.
 */
export function AlunosHistoricoCard({
  escolaId,
  historico,
}: {
  escolaId: string
  historico: AlunosHistorico[]
}) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [valor, setValor] = useState('')
  const [observacao, setObservacao] = useState('')
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  // historico já vem ordenado do mais recente pro mais antigo (ver getAlunosHistoricoByEscola)
  const atual = historico[0] ?? null
  const inicial = historico.length ? historico[historico.length - 1] : null
  const houveMudanca = atual && inicial && atual.id !== inicial.id

  function salvar() {
    const n = parseInt(valor, 10)
    if (!Number.isFinite(n) || n < 0) {
      setErro('Digite um número válido')
      return
    }
    setErro(null)
    startTransition(async () => {
      const res = await adicionarAlunosHistorico(escolaId, n, { observacao: observacao || null })
      if (res.success) {
        setValor('')
        setObservacao('')
        setAberto(false)
        setMostrarHistorico(true)
        router.refresh()
      } else {
        setErro(res.error ?? 'Erro ao salvar')
      }
    })
  }

  return (
    <div style={{ background: 'var(--surface, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem .75rem', borderBottom: '1px solid var(--border, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '.07em', fontFamily: 'var(--font-montserrat, sans-serif)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <Users size={14} color="#64748b" /> Alunos
        </span>
        <button
          onClick={() => setAberto(v => !v)}
          title="Registrar novo número de alunos"
          style={{
            display: 'flex', alignItems: 'center', gap: '.25rem', padding: '.3rem .6rem', borderRadius: 7,
            border: '1.5px solid #e2e8f0', background: aberto ? '#f1f5f9' : '#fff', cursor: 'pointer',
            fontSize: '.68rem', fontWeight: 700, color: '#4A7FDB', fontFamily: 'var(--font-montserrat, sans-serif)',
          }}
        >
          {aberto ? <X size={12} /> : <Plus size={12} />}
          {aberto ? 'Fechar' : 'Novo número'}
        </button>
      </div>

      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem', marginBottom: '.35rem' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-montserrat, sans-serif)' }}>
            {atual ? atual.valor.toLocaleString('pt-BR') : '—'}
          </span>
          {atual && (
            <span style={{ fontSize: '.68rem', color: '#94a3b8' }}>
              atualizado em {formatarData(atual.created_at)}
            </span>
          )}
        </div>

        {inicial && (
          <div style={{ fontSize: '.72rem', color: '#64748b', marginBottom: houveMudanca ? '.5rem' : 0 }}>
            Alunos inicial: <strong style={{ color: '#334155' }}>{inicial.valor.toLocaleString('pt-BR')}</strong>
            {' · '}{formatarData(inicial.created_at)}
          </div>
        )}

        {!inicial && !atual && (
          <div style={{ fontSize: '.72rem', color: '#94a3b8' }}>Nenhum número registrado ainda.</div>
        )}

        {houveMudanca && (
          <button
            onClick={() => setMostrarHistorico(v => !v)}
            style={{ fontSize: '.68rem', fontWeight: 700, color: '#4A7FDB', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-montserrat, sans-serif)' }}
          >
            {mostrarHistorico ? 'Ocultar histórico' : `Ver histórico (${historico.length})`}
          </button>
        )}

        {mostrarHistorico && historico.length > 1 && (
          <div style={{ marginTop: '.6rem', display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: 200, overflowY: 'auto', paddingRight: '.2rem' }}>
            {historico.map(h => (
              <div key={h.id} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '.45rem .6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat, sans-serif)' }}>
                    {h.valor.toLocaleString('pt-BR')} alunos
                  </div>
                  <div style={{ fontSize: '.64rem', color: '#94a3b8' }}>{ORIGEM_LABEL[h.origem]} · {formatarData(h.created_at)}</div>
                  {h.observacao && <div style={{ fontSize: '.7rem', color: '#475569', marginTop: '.15rem' }}>{h.observacao}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {aberto && (
          <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px solid #f1f5f9' }}>
            <label style={{ fontSize: '.68rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '.3rem', fontFamily: 'var(--font-montserrat, sans-serif)' }}>
              Novo número de alunos
            </label>
            <input
              type="number"
              min={0}
              autoFocus
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder={atual ? String(atual.valor) : 'Ex.: 350'}
              style={{ width: '100%', padding: '.5rem .6rem', fontSize: '.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, boxSizing: 'border-box', marginBottom: '.5rem', fontFamily: 'var(--font-inter, sans-serif)' }}
            />
            <input
              type="text"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              placeholder="Observação (opcional) — ex.: número revisado na negociação"
              style={{ width: '100%', padding: '.5rem .6rem', fontSize: '.78rem', border: '1.5px solid #e2e8f0', borderRadius: 7, boxSizing: 'border-box', marginBottom: '.5rem', fontFamily: 'var(--font-inter, sans-serif)' }}
            />
            {erro && <div style={{ fontSize: '.7rem', color: '#dc2626', marginBottom: '.5rem' }}>{erro}</div>}
            <button
              onClick={salvar}
              disabled={pending || !valor.trim()}
              style={{
                width: '100%', padding: '.55rem', borderRadius: 8, border: 'none', cursor: pending ? 'wait' : 'pointer',
                background: '#4A7FDB', color: '#fff', fontSize: '.78rem', fontWeight: 700, fontFamily: 'var(--font-montserrat, sans-serif)',
                opacity: !valor.trim() ? .6 : 1,
              }}
            >
              {pending ? 'Salvando...' : 'Registrar número'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
