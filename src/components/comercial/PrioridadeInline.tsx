'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarPrioridadeEscola } from '@/lib/actions'

interface Props {
  escolaId: string
  prioridade: number | null
}

// Mesmo padrão de popover do FasePopover/ContatoQuickEdit: gatilho clicável +
// painel position:fixed (a tabela tem overflow-x:auto). Prioridade é um
// número livre definido manualmente pelo time comercial — menor número =
// mais prioritário; a ordenação da tabela já reflete isso (ver
// funil-contratacao.ts, sort por prioridade_manual antes da fase).
export function PrioridadeInline({ escolaId, prioridade: prioridadeInicial }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [valor, setValor] = useState(prioridadeInicial != null ? String(prioridadeInicial) : '')
  const [pending, startTransition] = useTransition()
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  function abrir() {
    const rect = gatilhoRef.current?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 220)
      const top = Math.min(rect.bottom + 6, window.innerHeight - 160)
      setPos({ top, left })
    }
    setValor(prioridadeInicial != null ? String(prioridadeInicial) : '')
    setAberto(true)
  }

  useEffect(() => {
    if (!aberto) return
    function handleClick(e: MouseEvent) {
      if (
        painelRef.current && !painelRef.current.contains(e.target as Node) &&
        gatilhoRef.current && !gatilhoRef.current.contains(e.target as Node)
      ) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [aberto])

  function salvar(novoValor: string | null) {
    const num = novoValor != null && novoValor !== '' ? parseInt(novoValor, 10) : null
    startTransition(async () => {
      const res = await atualizarPrioridadeEscola(escolaId, num)
      if (res.success) {
        setAberto(false)
        router.refresh()
      }
    })
  }

  const temPrioridade = prioridadeInicial != null

  return (
    <>
      <button
        ref={gatilhoRef}
        onClick={abrir}
        title="Clique para definir a ordem de prioridade"
        style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0, cursor: 'pointer',
          border: temPrioridade ? '1.5px solid #fcd34d' : '1.5px dashed #cbd5e1',
          background: temPrioridade ? '#fffbeb' : 'transparent',
          color: temPrioridade ? '#b45309' : '#cbd5e1',
          fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.72rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {temPrioridade ? prioridadeInicial : '—'}
      </button>

      {aberto && pos && (
        <div ref={painelRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 2000,
          width: 200, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(15,23,42,.18)', padding: '1rem',
        }}>
          <div style={{ fontSize: '.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0f172a', marginBottom: '.6rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Ordem de Prioridade
          </div>
          <input
            autoFocus
            type="number"
            min={1}
            value={valor}
            onChange={e => setValor(e.target.value)}
            placeholder="Ex: 1"
            style={{ width: '100%', padding: '.45rem .6rem', fontSize: '.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, boxSizing: 'border-box', marginBottom: '.6rem' }}
          />
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <button onClick={() => salvar(valor)} disabled={pending} style={{
              flex: 1, padding: '.45rem', borderRadius: 8, border: 'none', cursor: pending ? 'wait' : 'pointer',
              background: '#4A7FDB', color: '#fff', fontSize: '.72rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              {pending ? '...' : 'Salvar'}
            </button>
            {temPrioridade && (
              <button onClick={() => salvar(null)} disabled={pending} title="Remover prioridade" style={{
                padding: '.45rem .6rem', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fff', cursor: 'pointer',
                fontSize: '.72rem', fontWeight: 600, color: '#dc2626', fontFamily: 'var(--font-montserrat,sans-serif)',
              }}>
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
