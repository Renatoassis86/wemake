'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { atualizarContatoEscolaInline } from '@/lib/actions'

interface Props {
  escolaId: string
  telefone: string | null
  email: string | null
  escolaNome?: string
}

function whatsappUrl(telefone: string, nome?: string) {
  const digits = telefone.replace(/\D/g, '')
  const texto = nome ? `Olá! Estou entrando em contato sobre a ${nome}.` : 'Olá!'
  return `https://wa.me/55${digits}?text=${encodeURIComponent(texto)}`
}

function gmailComposeUrl(email: string) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`
}

// Mesmo padrão do FasePopover: gatilho clicável + popover position:fixed
// (a tabela do Funil de Contratação tem overflow-x:auto, que corta qualquer
// popover posicionado relativo a um ancestral dentro dela).
export function ContatoQuickEdit({ escolaId, telefone: telefoneInicial, email: emailInicial, escolaNome }: Props) {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [telefone, setTelefone] = useState(telefoneInicial ?? '')
  const [email, setEmail] = useState(emailInicial ?? '')
  const [pending, startTransition] = useTransition()
  const gatilhoRef = useRef<HTMLDivElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  function abrir() {
    const rect = gatilhoRef.current?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 280)
      const top = Math.min(rect.bottom + 6, window.innerHeight - 200)
      setPos({ top, left })
    }
    setTelefone(telefoneInicial ?? '')
    setEmail(emailInicial ?? '')
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
    startTransition(async () => {
      const res = await atualizarContatoEscolaInline(escolaId, telefone.trim(), email.trim())
      if (res.success) {
        setAberto(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div ref={gatilhoRef} style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
        {telefoneInicial || emailInicial ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              {telefoneInicial && (
                <a href={whatsappUrl(telefoneInicial, escolaNome)} target="_blank" rel="noopener noreferrer"
                  title="Abrir no WhatsApp" style={{ fontSize: '.72rem', color: '#16a34a', whiteSpace: 'nowrap', textDecoration: 'none' }}>
                  {telefoneInicial}
                </a>
              )}
              {emailInicial && (
                <a href={gmailComposeUrl(emailInicial)} target="_blank" rel="noopener noreferrer" title="Escrever e-mail pelo Gmail"
                  style={{ fontSize: '.66rem', color: '#2563eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170, textDecoration: 'none' }}>
                  {emailInicial}
                </a>
              )}
            </div>
            <button onClick={abrir} title="Editar telefone e e-mail" style={{
              flexShrink: 0, width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent',
              color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
            >
              <Pencil size={11} />
            </button>
          </>
        ) : (
          <button onClick={abrir} style={{
            fontSize: '.72rem', color: '#4A7FDB', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            + adicionar
          </button>
        )}
      </div>

      {aberto && pos && (
        <div ref={painelRef} style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 2000,
          width: 260, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(15,23,42,.18)', padding: '1rem',
        }}>
          <div style={{ fontSize: '.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#0f172a', marginBottom: '.75rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
            Contato da Escola
          </div>

          <div style={{ marginBottom: '.6rem' }}>
            <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 700, color: '#64748b', marginBottom: '.25rem' }}>Telefone</label>
            <input
              autoFocus
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              style={{ width: '100%', padding: '.45rem .6rem', fontSize: '.8rem', border: '1.5px solid #e2e8f0', borderRadius: 7, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '.8rem' }}>
            <label style={{ display: 'block', fontSize: '.65rem', fontWeight: 700, color: '#64748b', marginBottom: '.25rem' }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contato@escola.com.br"
              style={{ width: '100%', padding: '.45rem .6rem', fontSize: '.8rem', border: '1.5px solid #e2e8f0', borderRadius: 7, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button onClick={salvar} disabled={pending} style={{
              flex: 1, padding: '.5rem', borderRadius: 8, border: 'none', cursor: pending ? 'wait' : 'pointer',
              background: '#4A7FDB', color: '#fff', fontSize: '.75rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              {pending ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setAberto(false)} style={{
              padding: '.5rem .75rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer',
              fontSize: '.75rem', fontWeight: 600, color: '#64748b', fontFamily: 'var(--font-montserrat,sans-serif)',
            }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
