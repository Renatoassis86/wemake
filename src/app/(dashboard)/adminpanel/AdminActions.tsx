'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarUsuario, upsertProfile } from '@/lib/actions'

interface Profile {
  id: string; email: string; full_name: string
  role: string; is_active: boolean; phone: string | null
}

interface Props {
  roleOptions: { value: string; label: string }[]
  profiles: Profile[]
}

const inp: React.CSSProperties = {
  width: '100%', padding: '.7rem .9rem', fontSize: '.875rem',
  fontFamily: 'var(--font-inter,sans-serif)',
  border: '1.5px solid #e2e8f0', borderRadius: 8,
  background: '#f8fafc', color: '#0f172a', outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-montserrat,sans-serif)',
  fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '.06em', color: '#64748b', marginBottom: '.4rem',
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  gerente:    { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  supervisor: { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  consultor:  { bg: '#dbeafe', text: '#1e3a8a', border: '#93c5fd' },
  assistente: { bg: '#dcfce7', text: '#14532d', border: '#86efac' },
  readonly:   { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function AdminActions({ roleOptions, profiles }: Props) {
  const router  = useRouter()

  // Estado do formulário de CRIAÇÃO
  const [criando,   setCriando]   = useState(false)
  const [criarMsg,  setCriarMsg]  = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  // Estado do modal de EDIÇÃO
  const [editando,  setEditando]  = useState<Profile | null>(null)
  const [editando2, setEditando2] = useState(false)  // loading do submit de edição
  const [editMsg,   setEditMsg]   = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  /* ── Criar usuário ──────────────────────────────────────────── */
  const handleCriar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCriando(true)
    setCriarMsg(null)
    const fd = new FormData(e.currentTarget)
    const result = await criarUsuario(fd)
    setCriando(false)
    if (result.success) {
      setCriarMsg({ tipo: 'ok', texto: `✓ Usuário cadastrado com sucesso! Senha temporária: Senha@2026` })
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    } else {
      setCriarMsg({ tipo: 'erro', texto: result.error ?? 'Erro ao criar usuário' })
    }
  }

  /* ── Editar usuário ─────────────────────────────────────────── */
  const handleEditar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditando2(true)
    setEditMsg(null)
    const fd = new FormData(e.currentTarget)
    const result = await upsertProfile(fd)
    setEditando2(false)
    if (result.success) {
      setEditMsg({ tipo: 'ok', texto: '✓ Perfil atualizado com sucesso!' })
      router.refresh()
      // Fechar modal após 1.5s
      setTimeout(() => { setEditando(null); setEditMsg(null) }, 1500)
    } else {
      setEditMsg({ tipo: 'erro', texto: result.error ?? 'Erro ao atualizar' })
    }
  }

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          PAINEL ESQUERDO — Criar novo usuário
          ════════════════════════════════════════════════════════ */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.06)' }}>
        {/* Header */}
        <div style={{ background: '#0f172a', padding: '1.1rem 1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.25rem' }}>
            ✦ Novo Membro
          </div>
          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            Cadastrar usuário na equipe
          </div>
        </div>

        <form onSubmit={handleCriar} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            <div>
              <label style={lbl}>Nome Completo *</label>
              <input name="full_name" style={inp} required placeholder="Ex: Emmanuel Pires" />
            </div>

            <div>
              <label style={lbl}>E-mail *</label>
              <input name="email" type="email" style={inp} required placeholder="email@wemake.tec.br" />
            </div>

            {/* Senha temporária info */}
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '.75rem 1rem' }}>
              <div style={{ fontSize: '.72rem', color: '#92400e', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700 }}>Senha temporária:</span>{' '}
                <code style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Senha@2026</code>
                <br />
                O usuário deverá alterar a senha no primeiro acesso.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={lbl}>Cargo / Perfil</label>
                <select name="role" style={inp} defaultValue="consultor">
                  {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select name="is_active" style={inp} defaultValue="true">
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>Telefone</label>
              <input name="phone" placeholder="(00) 00000-0000" style={inp} />
            </div>

            {/* Mensagem de feedback */}
            {criarMsg && (
              <div style={{
                padding: '.85rem 1rem', borderRadius: 10,
                background: criarMsg.tipo === 'ok' ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${criarMsg.tipo === 'ok' ? '#86efac' : '#fca5a5'}`,
                color: criarMsg.tipo === 'ok' ? '#15803d' : '#dc2626',
                fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)',
                lineHeight: 1.55, fontWeight: criarMsg.tipo === 'ok' ? 600 : 400,
              }}>
                {criarMsg.texto}
              </div>
            )}

            <button type="submit" disabled={criando} style={{
              width: '100%', padding: '.8rem',
              background: criando ? '#94a3b8' : 'linear-gradient(135deg, #4A7FDB, #2563b8)',
              color: '#fff', fontWeight: 700, fontSize: '.875rem',
              border: 'none', borderRadius: 9999, cursor: criando ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-montserrat,sans-serif)',
              boxShadow: criando ? 'none' : '0 4px 14px rgba(74,127,219,.3)',
              transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
            }}>
              {criando ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
                  Cadastrando...
                </>
              ) : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </div>

      {/* ════════════════════════════════════════════════════════
          LISTA DE USUÁRIOS com botões editar inline
          ════════════════════════════════════════════════════════ */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.05)' }}>
        <div style={{ background: '#0f172a', padding: '1rem 1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.2rem' }}>
            Equipe Comercial
          </div>
          <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            {profiles.length} usuários cadastrados
          </div>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
          {profiles.map(p => {
            const roleStyle = ROLE_COLORS[p.role] ?? ROLE_COLORS.readonly
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.1rem',
                background: p.is_active ? '#fff' : '#fafafa',
                border: `1px solid ${p.is_active ? '#e2e8f0' : '#f1f5f9'}`,
                borderLeft: `4px solid ${p.is_active ? (ROLE_COLORS[p.role]?.border ?? '#e2e8f0') : '#f1f5f9'}`,
                borderRadius: 12, opacity: p.is_active ? 1 : .65,
                boxShadow: '0 1px 3px rgba(15,23,42,.04)',
                transition: 'box-shadow .15s',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #4A7FDB, #2563b8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '.82rem', fontWeight: 800,
                  fontFamily: 'var(--font-montserrat,sans-serif)', opacity: p.is_active ? 1 : .5,
                }}>
                  {getInitials(p.full_name || p.email)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.875rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.full_name || '(sem nome)'}
                  </div>
                  <div style={{ fontSize: '.7rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.email}{p.phone ? ` · ${p.phone}` : ''}
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{
                    background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}`,
                    padding: '.2rem .6rem', borderRadius: 9999,
                    fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em',
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>{p.role}</span>
                  <span style={{
                    background: p.is_active ? '#f0fdf4' : '#fef2f2',
                    color: p.is_active ? '#16a34a' : '#dc2626',
                    border: `1px solid ${p.is_active ? '#86efac' : '#fca5a5'}`,
                    padding: '.2rem .55rem', borderRadius: 9999,
                    fontSize: '.6rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>
                    {p.is_active ? '● Ativo' : '○ Inativo'}
                  </span>

                  {/* Botão editar */}
                  <button
                    onClick={() => { setEditando(p); setEditMsg(null) }}
                    title="Editar usuário"
                    style={{
                      width: 30, height: 30, borderRadius: 7, border: '1.5px solid #e2e8f0',
                      background: '#fff', cursor: 'pointer', color: '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .15s', flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#0f172a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          MODAL DE EDIÇÃO
          ════════════════════════════════════════════════════════ */}
      {editando && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={e => { if (e.target === e.currentTarget) setEditando(null) }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480,
            boxShadow: '0 24px 64px rgba(0,0,0,.4)',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{ background: '#0f172a', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#4A7FDB', marginBottom: '.2rem' }}>
                  Editando usuário
                </div>
                <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  {editando.full_name}
                </div>
              </div>
              <button onClick={() => setEditando(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleEditar} style={{ padding: '1.5rem' }}>
              {/* email oculto — identifica o usuário */}
              <input type="hidden" name="email" value={editando.email} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Info: e-mail não editável */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '.65rem 1rem', fontSize: '.75rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  <strong style={{ color: '#0f172a' }}>E-mail:</strong> {editando.email}
                  <span style={{ marginLeft: '.5rem', fontSize: '.65rem', color: '#94a3b8' }}>(não editável)</span>
                </div>

                <div>
                  <label style={lbl}>Nome Completo</label>
                  <input name="full_name" style={inp} required defaultValue={editando.full_name} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={lbl}>Cargo / Perfil</label>
                    <select name="role" style={inp} defaultValue={editando.role}>
                      {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <select name="is_active" style={inp} defaultValue={editando.is_active ? 'true' : 'false'}>
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Telefone</label>
                  <input name="phone" style={inp} defaultValue={editando.phone ?? ''} placeholder="(00) 00000-0000" />
                </div>

                {/* Feedback edição */}
                {editMsg && (
                  <div style={{
                    padding: '.85rem 1rem', borderRadius: 10,
                    background: editMsg.tipo === 'ok' ? '#f0fdf4' : '#fef2f2',
                    border: `1.5px solid ${editMsg.tipo === 'ok' ? '#86efac' : '#fca5a5'}`,
                    color: editMsg.tipo === 'ok' ? '#15803d' : '#dc2626',
                    fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)',
                    fontWeight: editMsg.tipo === 'ok' ? 600 : 400,
                  }}>
                    {editMsg.texto}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '.75rem' }}>
                  <button type="submit" disabled={editando2} style={{
                    flex: 1, padding: '.8rem',
                    background: editando2 ? '#94a3b8' : 'linear-gradient(135deg, #4A7FDB, #2563b8)',
                    color: '#fff', fontWeight: 700, fontSize: '.875rem',
                    border: 'none', borderRadius: 9999, cursor: editando2 ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                    boxShadow: editando2 ? 'none' : '0 4px 14px rgba(74,127,219,.3)',
                  }}>
                    {editando2 ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button type="button" onClick={() => setEditando(null)} style={{
                    padding: '.8rem 1.25rem', borderRadius: 9999,
                    border: '1.5px solid #e2e8f0', background: '#fff',
                    color: '#64748b', fontWeight: 600, fontSize: '.875rem',
                    cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
