'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const STAGES = [
  { id: 'precadastro_recebido',  label: 'Pré-cadastro Recebido',            cor: '#6366f1' },
  { id: 'construcao_proposta',   label: 'Construção de Proposta Financeira', cor: '#f59e0b' },
  { id: 'envio_proposta',        label: 'Envio de Proposta Financeira',      cor: '#0ea5e9' },
  { id: 'devolutiva',            label: 'Recebimento de Devolutiva',         cor: '#8b5cf6' },
  { id: 'encaminhamento_dado',   label: 'Encaminhamento Dado',               cor: '#16a34a' },
]

const CORES_TAG = [
  '#dc2626','#f59e0b','#16a34a','#0ea5e9','#6366f1',
  '#8b5cf6','#db2777','#f97316','#0f172a','#64748b',
]

interface Comentario   { id: string; texto: string; autor_id: string; criado_em: string }
interface Tag          { id: string; label: string; cor: string }
interface Anexo        { name: string; path: string; url: string; criado_em: string; tamanho?: number }
interface Usuario      { id: string; nome_completo: string; role?: string }
interface Card {
  precadastro_id:       string
  lead_id:              string | null
  escola_nome:          string
  cidade?:              string | null
  estado?:              string | null
  pipeline_stage:       string
  pipeline_comentarios: Comentario[]
  pipeline_tags:        Tag[]
  pipeline_responsaveis:string[]
  pipeline_due_date:    string | null
  pipeline_anexos:      Anexo[]
  created_at:           string
}

interface Props { cards: Card[] }

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function dueBadge(dt: string | null): { label: string; bg: string; fg: string } | null {
  if (!dt) return null
  const ms = new Date(dt).setHours(23,59,59,999) - Date.now()
  const dia = 86400000
  if (ms < 0)          return { label: 'Vencido',    bg: '#fee2e2', fg: '#b91c1c' }
  if (ms < dia)        return { label: 'Hoje',       bg: '#fef3c7', fg: '#b45309' }
  if (ms < 2 * dia)    return { label: 'Amanhã',     bg: '#fef3c7', fg: '#b45309' }
  if (ms < 7 * dia)    return { label: 'Esta semana',bg: '#dbeafe', fg: '#1e40af' }
  return null
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(0)} KB`
  return `${(bytes/(1024*1024)).toFixed(1)} MB`
}

export function PipelinePropostaBoard({ cards: cardsIniciais }: Props) {
  const [cards, setCards]   = useState<Card[]>(cardsIniciais)
  const [modal, setModal]   = useState<Card | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  // Modal state
  const [usuarios, setUsuarios]       = useState<Usuario[]>([])
  const [novoComent, setNovoComent]   = useState('')
  const [enviandoC, setEnviandoC]     = useState(false)
  const [novaTagLabel, setNovaTagLabel] = useState('')
  const [novaTagCor, setNovaTagCor]   = useState(CORES_TAG[0])
  const [showTagForm, setShowTagForm] = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [uploadErr, setUploadErr]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Carrega usuários ao abrir modal
  useEffect(() => {
    if (!modal) return
    fetch('/api/usuarios').then(r => r.json()).then(data => setUsuarios(Array.isArray(data) ? data : []))
  }, [modal?.precadastro_id])

  // ── Helpers ────────────────────────────────────────────────────────

  function cardsDoStage(stageId: string) {
    return cards.filter(c => c.pipeline_stage === stageId)
  }

  const patchCard = useCallback(async (card: Card, updates: Record<string, any>) => {
    const res = await fetch(`/api/pipeline-proposta/${card.lead_id ?? 'new'}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precadastro_id: card.precadastro_id, escola_nome: card.escola_nome, ...updates }),
    })
    if (!res.ok) return null
    return await res.json()
  }, [])

  function syncCard(pid: string, extras: Partial<Card>, leadId?: string) {
    setCards(prev => prev.map(c =>
      c.precadastro_id === pid
        ? { ...c, ...extras, ...(leadId ? { lead_id: leadId } : {}) }
        : c
    ))
    setModal(prev => prev?.precadastro_id === pid
      ? { ...prev, ...extras, ...(leadId ? { lead_id: leadId } : {}) }
      : prev
    )
  }

  // ── Stage ──────────────────────────────────────────────────────────

  async function moverCard(pid: string, novoStage: string) {
    const card = cards.find(c => c.precadastro_id === pid)
    if (!card) return
    syncCard(pid, { pipeline_stage: novoStage })
    const json = await patchCard(card, { stage: novoStage })
    if (json?.lead_id) syncCard(pid, {}, json.lead_id)
  }

  // ── Tags ───────────────────────────────────────────────────────────

  async function adicionarTag() {
    if (!modal || !novaTagLabel.trim()) return
    const novaTag: Tag = { id: crypto.randomUUID(), label: novaTagLabel.trim(), cor: novaTagCor }
    const novasTags = [...modal.pipeline_tags, novaTag]
    syncCard(modal.precadastro_id, { pipeline_tags: novasTags })
    setNovaTagLabel(''); setShowTagForm(false)
    await patchCard({ ...modal, lead_id: cards.find(c=>c.precadastro_id===modal.precadastro_id)?.lead_id ?? null }, { tags: novasTags })
  }

  async function removerTag(tagId: string) {
    if (!modal) return
    const novasTags = modal.pipeline_tags.filter(t => t.id !== tagId)
    syncCard(modal.precadastro_id, { pipeline_tags: novasTags })
    await patchCard(modal, { tags: novasTags })
  }

  // ── Responsáveis ───────────────────────────────────────────────────

  async function toggleResponsavel(userId: string) {
    if (!modal) return
    const atual = modal.pipeline_responsaveis
    const novos = atual.includes(userId) ? atual.filter(id => id !== userId) : [...atual, userId]
    syncCard(modal.precadastro_id, { pipeline_responsaveis: novos })
    await patchCard(modal, { responsaveis: novos })
  }

  // ── Due date ───────────────────────────────────────────────────────

  async function salvarDueDate(value: string) {
    if (!modal) return
    const dt = value || null
    syncCard(modal.precadastro_id, { pipeline_due_date: dt })
    await patchCard(modal, { due_date: dt })
  }

  // ── Comentários ────────────────────────────────────────────────────

  async function adicionarComentario() {
    if (!modal || !novoComent.trim()) return
    setEnviandoC(true)
    const json = await patchCard(modal, { comentario: novoComent })
    if (json) {
      const comentarios = json.dados_extras?.pipeline_comentarios ?? []
      syncCard(modal.precadastro_id, { pipeline_comentarios: comentarios }, json.lead_id)
      setNovoComent('')
    }
    setEnviandoC(false)
  }

  async function removerComentario(comentId: string) {
    if (!modal) return
    const json = await patchCard(modal, { remover_comentario: comentId })
    if (json) syncCard(modal.precadastro_id, { pipeline_comentarios: json.dados_extras?.pipeline_comentarios ?? [] })
  }

  // ── Anexos ─────────────────────────────────────────────────────────

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !modal) return
    if (file.size > 20*1024*1024) { setUploadErr('Arquivo muito grande. Máximo 20 MB.'); return }
    setUploading(true); setUploadErr('')
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const slug = `pipeline-proposta/${modal.precadastro_id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`
    const { error: upErr } = await supabase.storage.from('documentos-oficiais').upload(slug, file, { upsert: false, contentType: file.type })
    if (upErr) { setUploadErr(upErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('documentos-oficiais').getPublicUrl(slug)
    const anexo: Anexo = { name: file.name, path: slug, url: urlData.publicUrl, criado_em: new Date().toISOString(), tamanho: file.size }
    const json = await patchCard(modal, { add_anexo: anexo })
    if (json) syncCard(modal.precadastro_id, { pipeline_anexos: json.dados_extras?.pipeline_anexos ?? [] }, json.lead_id)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removerAnexo(path: string) {
    if (!modal || !confirm('Excluir este arquivo?')) return
    const supabase = createClient()
    await supabase.storage.from('documentos-oficiais').remove([path])
    const json = await patchCard(modal, { remover_anexo: path })
    if (json) syncCard(modal.precadastro_id, { pipeline_anexos: json.dados_extras?.pipeline_anexos ?? [] })
  }

  // ── Drag & drop ────────────────────────────────────────────────────

  function onDragStart(pid: string) { setDragId(pid) }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  function onDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault()
    if (dragId) moverCard(dragId, stageId)
    setDragId(null)
  }

  // ── Render ─────────────────────────────────────────────────────────

  const stageModal = modal ? (STAGES.find(s => s.id === modal.pipeline_stage) ?? STAGES[0]) : null

  const lbl: React.CSSProperties = {
    fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '.08em', color: '#94a3b8',
    fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.55rem',
    display: 'block',
  }

  return (
    <>
      {/* ═══ BOARD ═══════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STAGES.length}, minmax(220px, 1fr))`,
        gap: '1rem', alignItems: 'start', overflowX: 'auto', paddingBottom: '1rem',
      }}>
        {STAGES.map(stage => {
          const colCards = cardsDoStage(stage.id)
          return (
            <div key={stage.id}
              onDragOver={onDragOver} onDrop={e => onDrop(e, stage.id)}
              style={{ background: '#f8fafc', border: `1.5px solid ${stage.cor}25`, borderRadius: 14, minHeight: 220 }}>
              {/* Header coluna */}
              <div style={{ padding: '.7rem .9rem', borderBottom: `2.5px solid ${stage.cor}`, borderRadius: '14px 14px 0 0', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.4rem' }}>
                  <span style={{ fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: stage.cor, fontFamily: 'var(--font-montserrat,sans-serif)', lineHeight: 1.3 }}>{stage.label}</span>
                  <span style={{ width: 21, height: 21, borderRadius: '50%', flexShrink: 0, background: stage.cor, color: '#fff', fontSize: '.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{colCards.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div style={{ padding: '.55rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {colCards.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.25rem .5rem', color: '#cbd5e1', fontSize: '.68rem', fontStyle: 'italic', fontFamily: 'var(--font-inter,sans-serif)' }}>Vazio</div>
                )}
                {colCards.map(card => {
                  const badge = dueBadge(card.pipeline_due_date)
                  return (
                    <div key={card.precadastro_id}
                      draggable onDragStart={() => onDragStart(card.precadastro_id)}
                      onClick={() => { setModal(card); setNovoComent(''); setShowTagForm(false); setUploadErr('') }}
                      style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '.65rem .8rem', cursor: 'grab', boxShadow: '0 1px 4px rgba(15,23,42,.06)', transition: 'box-shadow .15s', borderLeft: `3px solid ${stage.cor}` }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,.12)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,.06)' }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '.78rem', color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.escola_nome}</div>
                      {(card.cidade || card.estado) && (
                        <div style={{ fontSize: '.63rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.3rem' }}>
                          {[card.cidade, card.estado].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {/* Tags */}
                      {card.pipeline_tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.2rem', marginBottom: '.3rem' }}>
                          {card.pipeline_tags.map(t => (
                            <span key={t.id} style={{ background: t.cor+'22', color: t.cor, border: `1px solid ${t.cor}55`, padding: '.1rem .4rem', borderRadius: 99, fontSize: '.58rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{t.label}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.2rem' }}>
                        <div style={{ display: 'flex', gap: '.2rem', alignItems: 'center' }}>
                          {badge && <span style={{ background: badge.bg, color: badge.fg, padding: '.1rem .4rem', borderRadius: 99, fontSize: '.58rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{badge.label}</span>}
                          {card.pipeline_comentarios.length > 0 && <span style={{ fontSize: '.6rem', color: '#4A7FDB', fontWeight: 700 }}>💬{card.pipeline_comentarios.length}</span>}
                          {card.pipeline_anexos.length > 0 && <span style={{ fontSize: '.6rem', color: '#64748b' }}>📎{card.pipeline_anexos.length}</span>}
                        </div>
                        {/* Avatares responsáveis */}
                        {card.pipeline_responsaveis.length > 0 && (
                          <div style={{ display: 'flex' }}>
                            {card.pipeline_responsaveis.slice(0,3).map((uid,i) => (
                              <div key={uid} style={{ width: 18, height: 18, borderRadius: '50%', background: '#4A7FDB', border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.5rem', fontWeight: 800, color: '#fff', marginLeft: i === 0 ? 0 : -4 }}>
                                {uid.slice(0,1).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══ MODAL ═══════════════════════════════════════════════════ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.28)', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: `3px solid ${stageModal?.cor ?? '#4A7FDB'}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem' }}>{modal.escola_nome}</div>
                <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {(modal.cidade || modal.estado) && <span style={{ fontSize: '.7rem', color: '#64748b' }}>{[modal.cidade, modal.estado].filter(Boolean).join(' · ')}</span>}
                  <span style={{ background: `${stageModal?.cor}20`, color: stageModal?.cor, border: `1px solid ${stageModal?.cor}50`, padding: '.12rem .5rem', borderRadius: 99, fontSize: '.6rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{stageModal?.label}</span>
                </div>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.25rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>

              {/* ── Fase ───────────────────────────────────────────── */}
              <div>
                <span style={lbl}>Mover para fase</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                  {STAGES.map(s => {
                    const atual = modal.pipeline_stage === s.id
                    return (
                      <button key={s.id} type="button" onClick={() => moverCard(modal.precadastro_id, s.id)}
                        style={{ padding: '.28rem .7rem', borderRadius: 99, border: `1.5px solid ${atual ? s.cor : '#e2e8f0'}`, background: atual ? s.cor : '#f8fafc', color: atual ? '#fff' : '#475569', fontSize: '.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', transition: 'all .12s' }}>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Tags ───────────────────────────────────────────── */}
              <div>
                <span style={lbl}>Etiquetas</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', alignItems: 'center' }}>
                  {modal.pipeline_tags.map(t => (
                    <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', background: t.cor+'22', color: t.cor, border: `1.5px solid ${t.cor}55`, padding: '.2rem .6rem', borderRadius: 99, fontSize: '.7rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                      {t.label}
                      <button type="button" onClick={() => removerTag(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: '.65rem', lineHeight: 1 }}>✕</button>
                    </span>
                  ))}
                  {!showTagForm ? (
                    <button type="button" onClick={() => setShowTagForm(true)}
                      style={{ padding: '.2rem .65rem', borderRadius: 99, border: '1.5px dashed #e2e8f0', background: 'transparent', color: '#94a3b8', fontSize: '.68rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                      + Nova tag
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                      <input
                        autoFocus value={novaTagLabel} onChange={e => setNovaTagLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') adicionarTag(); if (e.key === 'Escape') { setShowTagForm(false); setNovaTagLabel('') } }}
                        placeholder="Nome da tag"
                        style={{ padding: '.3rem .65rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.75rem', width: 130, fontFamily: 'var(--font-inter,sans-serif)', outline: 'none' }}
                      />
                      {/* Paleta de cores */}
                      <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap' }}>
                        {CORES_TAG.map(c => (
                          <button key={c} type="button" onClick={() => setNovaTagCor(c)}
                            title={c}
                            style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: novaTagCor === c ? '3px solid #0f172a' : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'border .1s' }} />
                        ))}
                      </div>
                      <button type="button" onClick={adicionarTag}
                        disabled={!novaTagLabel.trim()}
                        style={{ padding: '.3rem .75rem', borderRadius: 8, border: 'none', background: novaTagLabel.trim() ? novaTagCor : '#e2e8f0', color: novaTagLabel.trim() ? '#fff' : '#94a3b8', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                        Adicionar
                      </button>
                      <button type="button" onClick={() => { setShowTagForm(false); setNovaTagLabel('') }}
                        style={{ padding: '.3rem .55rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#94a3b8', fontSize: '.7rem', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Responsáveis ───────────────────────────────────── */}
              <div>
                <span style={lbl}>Responsáveis / Participantes</span>
                {usuarios.length === 0 ? (
                  <div style={{ fontSize: '.72rem', color: '#94a3b8', fontStyle: 'italic' }}>Carregando usuários…</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                    {usuarios.map(u => {
                      const marcado = modal.pipeline_responsaveis.includes(u.id)
                      return (
                        <button key={u.id} type="button" onClick={() => toggleResponsavel(u.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.35rem .75rem .35rem .45rem', borderRadius: 99, border: `1.5px solid ${marcado ? '#4A7FDB' : '#e2e8f0'}`, background: marcado ? '#eff6ff' : '#f8fafc', cursor: 'pointer', transition: 'all .12s' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: marcado ? '#4A7FDB' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.62rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)', flexShrink: 0 }}>
                            {getInitials(u.nome_completo)}
                          </div>
                          <span style={{ fontSize: '.72rem', fontWeight: marcado ? 700 : 500, color: marcado ? '#2563eb' : '#475569', fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                            {u.nome_completo.split(' ')[0]}
                          </span>
                          {marcado && <span style={{ fontSize: '.6rem', color: '#4A7FDB' }}>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Data de entrega ─────────────────────────────────── */}
              <div>
                <span style={lbl}>Data de entrega / prazo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flexWrap: 'wrap' }}>
                  <input type="date"
                    value={modal.pipeline_due_date ?? ''}
                    onChange={e => { syncCard(modal.precadastro_id, { pipeline_due_date: e.target.value || null }); salvarDueDate(e.target.value) }}
                    style={{ padding: '.5rem .85rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', outline: 'none', background: '#f8fafc', color: '#0f172a' }}
                  />
                  {modal.pipeline_due_date && (() => { const b = dueBadge(modal.pipeline_due_date); return b ? <span style={{ background: b.bg, color: b.fg, padding: '.2rem .65rem', borderRadius: 99, fontSize: '.68rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)' }}>{b.label}</span> : null })()}
                  {modal.pipeline_due_date && (
                    <button type="button" onClick={() => salvarDueDate('')}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '.72rem', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* ── Anexos ──────────────────────────────────────────── */}
              <div>
                <span style={lbl}>Proposta e Anexos</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                  {/* Botão upload */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                    <button type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.45rem 1rem', borderRadius: 8, border: '1.5px solid #4A7FDB', background: uploading ? '#f8fafc' : '#eff6ff', color: '#2563eb', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '.75rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                      {uploading ? 'Enviando…' : 'Anexar arquivo'}
                    </button>
                    <span style={{ fontSize: '.7rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>PDF, DOC, DOCX, PNG, JPG — máx 20 MB</span>
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />

                  {uploadErr && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '.5rem .8rem', fontSize: '.75rem', color: '#dc2626' }}>{uploadErr}</div>}

                  {modal.pipeline_anexos.length === 0 ? (
                    <div style={{ fontSize: '.72rem', color: '#94a3b8', fontStyle: 'italic', padding: '.5rem 0' }}>Nenhum arquivo anexado ainda.</div>
                  ) : (
                    modal.pipeline_anexos.map(arq => (
                      <div key={arq.path} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.6rem .85rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9 }}>
                        <span style={{ fontSize: '1.1rem' }}>📄</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '.78rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{arq.name}</div>
                          <div style={{ fontSize: '.62rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>{fmtData(arq.criado_em)}{arq.tamanho ? ` · ${fmtSize(arq.tamanho)}` : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '.3rem', flexShrink: 0 }}>
                          <a href={arq.url} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '.3rem .65rem', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', textDecoration: 'none', fontSize: '.68rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                            Baixar
                          </a>
                          <button type="button" onClick={() => removerAnexo(arq.path)}
                            style={{ width: 27, height: 27, borderRadius: 7, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── Comentários ─────────────────────────────────────── */}
              <div>
                <span style={lbl}>Histórico de Negociação</span>
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.85rem' }}>
                  <textarea
                    value={novoComent} onChange={e => setNovoComent(e.target.value)}
                    placeholder="Adicionar nota ou comentário sobre esta escola…"
                    rows={2}
                    style={{ flex: 1, padding: '.6rem .85rem', fontSize: '.82rem', fontFamily: 'var(--font-inter,sans-serif)', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#0f172a', outline: 'none', resize: 'vertical', minHeight: 60 }}
                  />
                  <button onClick={adicionarComentario} disabled={enviandoC || !novoComent.trim()} type="button"
                    style={{ padding: '.6rem 1rem', borderRadius: 8, border: 'none', background: enviandoC || !novoComent.trim() ? '#e2e8f0' : '#4A7FDB', color: enviandoC || !novoComent.trim() ? '#94a3b8' : '#fff', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'var(--font-montserrat,sans-serif)', alignSelf: 'flex-start', transition: 'all .12s' }}>
                    {enviandoC ? '…' : 'Salvar'}
                  </button>
                </div>

                {modal.pipeline_comentarios.length === 0 ? (
                  <div style={{ fontSize: '.72rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>Nenhum comentário ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                    {modal.pipeline_comentarios.map(c => (
                      <div key={c.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '.7rem .9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                          <span style={{ fontSize: '.62rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {new Date(c.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button type="button" onClick={() => removerComentario(c.id)}
                            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '.62rem', padding: 0 }} title="Remover">✕</button>
                        </div>
                        <div style={{ fontSize: '.82rem', color: '#0f172a', lineHeight: 1.5, fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'pre-wrap' }}>{c.texto}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
