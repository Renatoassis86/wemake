'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StickyNote } from 'lucide-react'
import { adicionarNotaContatoFunil } from '@/lib/actions'

interface Nota {
  texto: string
  autor: string
  criadoEm: string
}

function tempoRelativo(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  return `há ${dias} dias`
}

// Mesmo padrão de popover do FasePopover/ContatoQuickEdit/PrioridadeInline —
// anotação rápida de quem fez o contato comercial, sempre atribuída
// automaticamente a quem estiver logado ao adicionar (notas_escola.created_by).
export function AnotacaoContatoInline({ escolaId, notas: notasIniciais }: { escolaId: string; notas: Nota[] }) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [texto, setTexto] = useState('')
  const [pending, startTransition] = useTransition()
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  function abrir() {
    const rect = gatilhoRef.current?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 300)
      const top = Math.min(rect.bottom + 6, window.innerHeight - 340)
      setPos({ top, left })
    }
    setTexto('')
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

  function salvar() {
    if (!texto.trim()) return
    startTransition(async () => {
      const res = await adicionarNotaContatoFunil(escolaId, texto)
      if (res.success) {
        setTexto('')
        router.refresh()
      }
    })
  }

  const temNotas = notasIniciais.length > 0

  return (
    <>
      <button
        ref={gatilhoRef}
        onClick={abrir}
        title="Anotações de contato comercial"
        style={{
          position: 'relative', flexShrink: 0, width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
          border: `1.5px solid ${temNotas ? '#fde68a' : '#e2e8f0'}`, background: temNotas ? '#fffbeb' : '#f8fafc',
          color: temNotas ? '#b45309' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <StickyNote size={13} />
        {temNotas && (
          <span style={{
            position: 'absolute', top: -5, right: -5, minWidth: 15, height: 15, borderRadius: 99,
            background: '#b45309', color: '#fff', fontSize: '.55rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            fontFamily: 'var(--font-montserrat,sans-serif)',
          }}>
            {notasIniciais.length}
          </span>
        )}
      </button>

      {aberto && pos && (
        <div ref={painelRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 2000,
          width: 300, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(15,23,42,.18)', padding: '1rem',
        }}>
          <div style={{ fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0f172a', marginBottom: '.6rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Anotações de Contato
          </div>

          {temNotas ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', maxHeight: 160, overflowY: 'auto', marginBottom: '.75rem', paddingRight: '.2rem' }}>
              {notasIniciais.map((n, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, padding: '.5rem .6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.15rem' }}>
                    <span style={{ fontSize: '.66rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{n.autor}</span>
                    <span style={{ fontSize: '.6rem', color: '#94a3b8' }}>{tempoRelativo(n.criadoEm)}</span>
                  </div>
                  <div style={{ fontSize: '.74rem', color: '#334155', lineHeight: 1.4 }}>{n.texto}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '.72rem', color: '#94a3b8', marginBottom: '.75rem' }}>Nenhuma anotação ainda.</div>
          )}

          <textarea
            autoFocus
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Como foi o contato? Registre uma anotação rápida..."
            rows={3}
            style={{ width: '100%', padding: '.5rem .6rem', fontSize: '.78rem', border: '1.5px solid #e2e8f0', borderRadius: 7, boxSizing: 'border-box', resize: 'vertical', marginBottom: '.6rem', fontFamily: 'var(--font-inter,sans-serif)' }}
          />
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button onClick={salvar} disabled={pending || !texto.trim()} style={{
              flex: 1, padding: '.5rem', borderRadius: 8, border: 'none', cursor: pending ? 'wait' : 'pointer',
              background: '#4A7FDB', color: '#fff', fontSize: '.75rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
              opacity: !texto.trim() ? .6 : 1,
            }}>
              {pending ? 'Salvando...' : 'Adicionar'}
            </button>
            <button onClick={() => setAberto(false)} style={{
              padding: '.5rem .75rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer',
              fontSize: '.75rem', fontWeight: 600, color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
