'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile { id: string; nome_completo: string; role?: string }
interface Comentario {
  id: string
  texto: string
  created_at: string
  autor_id: string
  profiles: Profile | null
}
interface Negociacao {
  id: string
  escola_id: string
  titulo: string | null
  stage: string
  valor_estimado: number | null
  probabilidade: number
  previsao_fechamento: string | null
  descricao: string | null
  tags: string[]
  due_date: string | null
  due_alerta_min: number | null
  checklist: any[]
  responsavel_id: string | null
}

const STAGES = [
  { id: 'prospeccao',   label: 'Prospecção',     cor: '#6366f1' },
  { id: 'qualificacao', label: 'Qualificação',   cor: '#8b5cf6' },
  { id: 'apresentacao', label: 'Apresentação',   cor: '#4A7FDB' },
  { id: 'proposta',     label: 'Proposta',       cor: '#f59e0b' },
  { id: 'negociacao',   label: 'Negociação',     cor: '#0ea5e9' },
  { id: 'fechamento',   label: 'Fechamento',     cor: '#16a34a' },
  { id: 'ganho',        label: 'Ganho',          cor: '#16a34a' },
  { id: 'perdido',      label: 'Perdido',        cor: '#dc2626' },
]

const TAG_COLORS = [
  '#dc2626', '#f59e0b', '#16a34a', '#0ea5e9', '#6366f1',
  '#8b5cf6', '#db2777', '#0f172a', '#64748b',
]

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function nameColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length]
}

function dueBadge(dt: string | null): { label: string; bg: string; fg: string } | null {
  if (!dt) return null
  const d = new Date(dt)
  const now = new Date()
  const ms = d.getTime() - now.getTime()
  const dia = 86400000
  if (ms < 0) return { label: 'Vencido', bg: '#fee2e2', fg: '#b91c1c' }
  if (ms < dia) return { label: 'Vence hoje', bg: '#fef3c7', fg: '#b45309' }
  if (ms < 2 * dia) return { label: 'Vence amanhã', bg: '#fef3c7', fg: '#b45309' }
  if (ms < 7 * dia) return { label: 'Esta semana', bg: '#dbeafe', fg: '#1e40af' }
  return null
}

interface Props {
  negociacaoId: string
  onClose: () => void
  onChange?: () => void
}

export function NegociacaoCardModal({ negociacaoId, onClose, onChange }: Props) {
  const [loading, setLoading]         = useState(true)
  const [erro, setErro]               = useState('')
  const [neg, setNeg]                 = useState<Negociacao | null>(null)
  const [escolaNome, setEscolaNome]   = useState('')
  const [membros, setMembros]         = useState<Profile[]>([])
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [todosProfiles, setTodosProfiles] = useState<Profile[]>([])
  const [myId, setMyId]               = useState<string>('')

  // Estados controlados
  const [editTitulo, setEditTitulo]   = useState(false)
  const [tituloLocal, setTituloLocal] = useState('')
  const [descLocal, setDescLocal]     = useState('')
  const [editDesc, setEditDesc]       = useState(false)
  const [novoComent, setNovoComent]   = useState('')
  const [novaTag, setNovaTag]         = useState('')
  const [showMembros, setShowMembros] = useState(false)
  const [salvandoComent, setSalvandoComent] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true); setErro('')
    const res = await fetch(`/api/negociacoes/${negociacaoId}`, { cache: 'no-store' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setErro(d.error ?? `HTTP ${res.status}`)
      setLoading(false)
      return
    }
    const data = await res.json()
    setNeg(data.negociacao)
    setMembros(data.membros ?? [])
    setComentarios(data.comentarios ?? [])
    setTituloLocal(data.negociacao?.titulo ?? '')
    setDescLocal(data.negociacao?.descricao ?? '')

    // Buscar escola e profiles em paralelo via client (para popover de membros)
    const supabase = createClient()
    const [escRes, profsRes, userRes] = await Promise.all([
      data.negociacao?.escola_id
        ? supabase.from('escolas').select('nome').eq('id', data.negociacao.escola_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('usuarios').select('id, nome_completo, role').eq('ativo', true).order('nome_completo'),
      supabase.auth.getUser(),
    ])
    setEscolaNome((escRes as any).data?.nome ?? '')
    setTodosProfiles((profsRes.data ?? []) as Profile[])
    setMyId(userRes.data.user?.id ?? '')
    setLoading(false)
  }, [negociacaoId])

  useEffect(() => { carregar() }, [carregar])

  // Fechar com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function patch(patch: Record<string, any>) {
    if (!neg) return
    // Optimistic update
    const before = neg
    setNeg({ ...neg, ...patch })
    const res = await fetch(`/api/negociacoes/${negociacaoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) {
      setNeg(before)
      const d = await res.json().catch(() => ({}))
      setErro(d.error ?? `Erro ao salvar`)
      return false
    }
    setErro('')
    onChange?.()
    return true
  }

  async function addTag() {
    if (!neg || !novaTag.trim()) return
    const v = novaTag.trim()
    if (neg.tags.includes(v)) { setNovaTag(''); return }
    await patch({ tags: [...neg.tags, v] })
    setNovaTag('')
  }

  async function removeTag(t: string) {
    if (!neg) return
    await patch({ tags: neg.tags.filter(x => x !== t) })
  }

  async function addMembro(profile_id: string) {
    if (membros.some(m => m.id === profile_id)) return
    const prof = todosProfiles.find(p => p.id === profile_id)
    if (!prof) return
    setMembros([...membros, prof])
    const res = await fetch(`/api/negociacoes/${negociacaoId}/membros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id }),
    })
    if (!res.ok) {
      setMembros(membros)
      setErro('Não foi possível adicionar membro')
    }
  }

  async function removeMembro(profile_id: string) {
    const before = membros
    setMembros(membros.filter(m => m.id !== profile_id))
    const res = await fetch(`/api/negociacoes/${negociacaoId}/membros?profile_id=${profile_id}`, {
      method: 'DELETE',
    })
    if (!res.ok) setMembros(before)
  }

  async function addComentario() {
    if (!novoComent.trim()) return
    setSalvandoComent(true)
    const res = await fetch(`/api/negociacoes/${negociacaoId}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: novoComent }),
    })
    if (res.ok) {
      const c = await res.json()
      setComentarios([c, ...comentarios])
      setNovoComent('')
    } else {
      const d = await res.json().catch(() => ({}))
      setErro(d.error ?? 'Erro ao comentar')
    }
    setSalvandoComent(false)
  }

  async function removeComentario(comentarioId: string) {
    if (!confirm('Excluir este comentário?')) return
    const before = comentarios
    setComentarios(comentarios.filter(c => c.id !== comentarioId))
    const res = await fetch(`/api/negociacoes/${negociacaoId}/comentarios/${comentarioId}`, { method: 'DELETE' })
    if (!res.ok) setComentarios(before)
  }

  const stageMeta = STAGES.find(s => s.id === neg?.stage) ?? STAGES[0]
  const badge = dueBadge(neg?.due_date ?? null)

  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '.06em', color: '#94a3b8', marginBottom: '.4rem',
    fontFamily: 'var(--font-montserrat,sans-serif)',
  }
  const inp: React.CSSProperties = {
    width: '100%', padding: '.5rem .7rem', border: '1.5px solid #e2e8f0',
    borderRadius: 7, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)',
    outline: 'none', background: '#fff', color: '#0f172a', boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.55)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820,
        boxShadow: '0 24px 64px rgba(0,0,0,.25)', overflow: 'hidden',
      }}>
        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: '1rem',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '.58rem', fontWeight: 800, letterSpacing: '.1em',
              textTransform: 'uppercase', color: stageMeta.cor,
              fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem',
            }}>
              {escolaNome || 'Negociação'} · {stageMeta.label}
            </div>
            {editTitulo ? (
              <input
                value={tituloLocal}
                autoFocus
                onChange={e => setTituloLocal(e.target.value)}
                onBlur={async () => {
                  if (tituloLocal.trim() !== (neg?.titulo ?? '')) {
                    await patch({ titulo: tituloLocal.trim() || null })
                  }
                  setEditTitulo(false)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  if (e.key === 'Escape') { setTituloLocal(neg?.titulo ?? ''); setEditTitulo(false) }
                }}
                style={{
                  ...inp, fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem',
                  fontWeight: 700, background: 'rgba(255,255,255,.1)', color: '#fff',
                  border: '1.5px solid rgba(255,255,255,.3)',
                }}
              />
            ) : (
              <div
                onClick={() => setEditTitulo(true)}
                style={{
                  fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.4rem',
                  fontWeight: 700, color: '#fff', cursor: 'pointer', lineHeight: 1.2,
                }}
                title="Clique para editar"
              >
                {neg?.titulo || escolaNome || '—'}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)',
            color: '#fff', cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Carregando…</div>
        ) : !neg ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>{erro || 'Negociação não encontrada'}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 0 }}>
            {/* COLUNA PRINCIPAL */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {erro && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.55rem .85rem', fontSize: '.75rem', color: '#dc2626' }}>{erro}</div>
              )}

              {/* MEMBROS + DUE DATE inline */}
              <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                <div>
                  <label style={lbl}>Membros</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    {membros.map(m => (
                      <div key={m.id} title={m.nome_completo}
                        style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: nameColor(m.nome_completo),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '.68rem', fontWeight: 800,
                          fontFamily: 'var(--font-montserrat,sans-serif)',
                          cursor: 'pointer', border: '2px solid #fff',
                          boxShadow: '0 0 0 1px #e2e8f0',
                        }}
                        onClick={() => removeMembro(m.id)}
                      >
                        {getInitials(m.nome_completo)}
                      </div>
                    ))}
                    <button onClick={() => setShowMembros(true)}
                      style={{
                        width: 30, height: 30, borderRadius: '50%',
                        border: '1.5px dashed #cbd5e1', background: '#f8fafc',
                        color: '#64748b', cursor: 'pointer', fontSize: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Data / Alerta</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <input type="datetime-local"
                      value={neg.due_date ? new Date(neg.due_date).toISOString().slice(0, 16) : ''}
                      onChange={async e => {
                        const v = e.target.value
                        await patch({ due_date: v ? new Date(v).toISOString() : null })
                      }}
                      style={{ ...inp, width: 200 }} />
                    {badge && (
                      <span style={{
                        background: badge.bg, color: badge.fg, fontSize: '.65rem',
                        fontWeight: 800, padding: '.2rem .55rem', borderRadius: 99,
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                      }}>{badge.label}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Estágio</label>
                  <select value={neg.stage} onChange={e => patch({ stage: e.target.value })}
                    style={{ ...inp, width: 170 }}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Valor (R$)</label>
                  <input type="number" value={neg.valor_estimado ?? ''}
                    onChange={e => setNeg({ ...neg, valor_estimado: e.target.value ? parseFloat(e.target.value) : null })}
                    onBlur={() => patch({ valor_estimado: neg.valor_estimado })}
                    style={{ ...inp, width: 130 }} />
                </div>
              </div>

              {/* TAGS */}
              <div>
                <label style={lbl}>Etiquetas</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', alignItems: 'center' }}>
                  {neg.tags.map(t => (
                    <span key={t}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                        background: nameColor(t) + '20', color: nameColor(t),
                        border: `1px solid ${nameColor(t)}55`,
                        padding: '.2rem .55rem', borderRadius: 99,
                        fontSize: '.7rem', fontWeight: 700,
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                      }}>
                      {t}
                      <button onClick={() => removeTag(t)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: '.7rem' }}>✕</button>
                    </span>
                  ))}
                  <input value={novaTag} onChange={e => setNovaTag(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTag() }}
                    placeholder="+ etiqueta"
                    style={{ ...inp, width: 130, padding: '.3rem .55rem', fontSize: '.72rem' }} />
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label style={lbl}>📝 Descrição</label>
                {editDesc ? (
                  <>
                    <textarea value={descLocal} onChange={e => setDescLocal(e.target.value)}
                      autoFocus rows={5}
                      style={{ ...inp, resize: 'vertical', minHeight: 100, fontFamily: 'var(--font-inter,sans-serif)' }} />
                    <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem' }}>
                      <button onClick={async () => {
                        await patch({ descricao: descLocal || null })
                        setEditDesc(false)
                      }}
                        style={{
                          padding: '.4rem .9rem', borderRadius: 7, border: 'none',
                          background: '#4A7FDB', color: '#fff', fontWeight: 700,
                          fontSize: '.75rem', cursor: 'pointer',
                          fontFamily: 'var(--font-montserrat,sans-serif)',
                        }}>Salvar</button>
                      <button onClick={() => { setDescLocal(neg.descricao ?? ''); setEditDesc(false) }}
                        style={{
                          padding: '.4rem .9rem', borderRadius: 7, border: '1px solid #e2e8f0',
                          background: '#fff', color: '#64748b', fontSize: '.75rem', cursor: 'pointer',
                        }}>Cancelar</button>
                    </div>
                  </>
                ) : (
                  <div onClick={() => setEditDesc(true)}
                    style={{
                      minHeight: 60, background: '#f8fafc', padding: '.65rem .8rem',
                      borderRadius: 8, fontSize: '.82rem', color: neg.descricao ? '#0f172a' : '#94a3b8',
                      fontFamily: 'var(--font-inter,sans-serif)', cursor: 'pointer',
                      whiteSpace: 'pre-wrap', lineHeight: 1.5,
                    }}>
                    {neg.descricao || 'Adicionar uma descrição mais detalhada…'}
                  </div>
                )}
              </div>

              {/* COMENTÁRIOS */}
              <div>
                <label style={lbl}>💬 Atividade</label>
                <div style={{ display: 'flex', gap: '.55rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#4A7FDB', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '.7rem', fontWeight: 800,
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>
                    {getInitials(todosProfiles.find(p => p.id === myId)?.nome_completo ?? 'EU')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea value={novoComent} onChange={e => setNovoComent(e.target.value)}
                      placeholder="Escrever um comentário…"
                      rows={2}
                      style={{ ...inp, resize: 'vertical', minHeight: 56 }} />
                    {novoComent.trim() && (
                      <button onClick={addComentario} disabled={salvandoComent}
                        style={{
                          marginTop: '.4rem',
                          padding: '.4rem 1rem', borderRadius: 7, border: 'none',
                          background: salvandoComent ? '#94a3b8' : '#4A7FDB',
                          color: '#fff', fontWeight: 700, fontSize: '.75rem',
                          cursor: salvandoComent ? 'not-allowed' : 'pointer',
                          fontFamily: 'var(--font-montserrat,sans-serif)',
                        }}>
                        {salvandoComent ? 'Enviando…' : 'Comentar'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  {comentarios.length === 0 && (
                    <div style={{ fontSize: '.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum comentário ainda.</div>
                  )}
                  {comentarios.map(c => {
                    const nome = c.profiles?.nome_completo ?? '—'
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: '.55rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: nameColor(nome), flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '.7rem', fontWeight: 800,
                          fontFamily: 'var(--font-montserrat,sans-serif)',
                        }}>{getInitials(nome)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '.78rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{nome}</span>
                            <span style={{ fontSize: '.65rem', color: '#94a3b8' }}>
                              {new Date(c.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {c.autor_id === myId && (
                              <button onClick={() => removeComentario(c.id)}
                                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '.65rem', padding: 0 }}
                                title="Excluir">✕</button>
                            )}
                          </div>
                          <div style={{
                            background: '#f8fafc', padding: '.5rem .75rem', borderRadius: 8,
                            marginTop: '.25rem', fontSize: '.8rem', color: '#0f172a',
                            fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.45,
                            whiteSpace: 'pre-wrap',
                          }}>{c.texto}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* SIDEBAR */}
            <div style={{
              background: '#f8fafc', borderLeft: '1px solid #e2e8f0',
              padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '.5rem',
            }}>
              <div style={{ fontSize: '.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', marginBottom: '.25rem' }}>Ações</div>
              <SideAct icon="👥" label="Membros"   onClick={() => setShowMembros(true)} />
              <SideAct icon="🏷️"  label="Etiquetas" onClick={() => { const el = document.querySelector('input[placeholder="+ etiqueta"]') as HTMLInputElement; el?.focus() }} />
              <SideAct icon="📅" label="Data"      onClick={() => { const el = document.querySelector('input[type="datetime-local"]') as HTMLInputElement; el?.focus(); el?.showPicker?.() }} />
              <SideAct icon="📝" label="Descrição" onClick={() => setEditDesc(true)} />
              <a href={`/comercial/escolas/${neg.escola_id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.45rem',
                  padding: '.45rem .65rem', borderRadius: 7, background: '#0f172a',
                  color: '#fff', textDecoration: 'none', fontSize: '.72rem', fontWeight: 700,
                  fontFamily: 'var(--font-montserrat,sans-serif)', marginTop: '.5rem',
                }}>
                🏫 Abrir escola
              </a>
            </div>
          </div>
        )}

        {/* POPOVER MEMBROS */}
        {showMembros && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={e => { if (e.target === e.currentTarget) setShowMembros(false) }}>
            <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 360, maxHeight: '70vh', overflow: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,.25)' }}>
              <div style={{ padding: '.85rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '.85rem', fontFamily: 'var(--font-montserrat,sans-serif)' }}>Marcar usuários no card</div>
              <div style={{ padding: '.5rem' }}>
                {todosProfiles.map(p => {
                  const ja = membros.some(m => m.id === p.id)
                  return (
                    <button key={p.id}
                      onClick={() => { if (ja) removeMembro(p.id); else addMembro(p.id); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem',
                        padding: '.5rem .7rem', borderRadius: 7,
                        border: 'none', background: ja ? '#eff6ff' : 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: nameColor(p.nome_completo),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '.6rem', fontWeight: 800,
                        fontFamily: 'var(--font-montserrat,sans-serif)',
                      }}>{getInitials(p.nome_completo)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.78rem', fontWeight: 600, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{p.nome_completo}</div>
                        {p.role && <div style={{ fontSize: '.6rem', color: '#94a3b8' }}>{p.role}</div>}
                      </div>
                      {ja && <span style={{ fontSize: '.65rem', fontWeight: 700, color: '#4A7FDB' }}>✓ marcado</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SideAct({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '.45rem',
        padding: '.45rem .65rem', borderRadius: 7,
        border: '1px solid #e2e8f0', background: '#fff',
        color: '#475569', cursor: 'pointer', fontSize: '.72rem', fontWeight: 600,
        fontFamily: 'var(--font-montserrat,sans-serif)', textAlign: 'left',
      }}>
      <span>{icon}</span>{label}
    </button>
  )
}
