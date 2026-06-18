'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { moverNegociacao, removerDoQuadro } from './pipeline-actions'
import { NegociacaoCardModal } from './NegociacaoCardModal'

const STAGE_COLORS: Record<string, string> = {
  prospeccao:   '#6366f1',
  qualificacao: '#8b5cf6',
  apresentacao: '#4A7FDB',
  proposta:     '#f59e0b',
  negociacao:   '#0ea5e9',
  fechamento:   '#16a34a',
}

const STAGE_LABELS: Record<string, string> = {
  prospeccao:   'Prospecção',
  qualificacao: 'Qualificação',
  apresentacao: 'Apresentação',
  proposta:     'Proposta',
  negociacao:   'Negociação',
  fechamento:   'Fechamento',
}

interface Neg {
  id: string
  stage: string
  escola_id: string
  titulo: string | null
  valor_estimado: number | null
  probabilidade: number
  responsavel_id: string | null
  tags?: string[] | null
  due_date?: string | null
  descricao?: string | null
  escola: { id: string; nome: string; cidade?: string | null; estado: string | null } | null
  responsavel: { id: string; full_name: string } | null
}

function dueBadgeMini(dt?: string | null): { label: string; bg: string; fg: string } | null {
  if (!dt) return null
  const ms = new Date(dt).getTime() - Date.now()
  const dia = 86400000
  if (ms < 0)         return { label: 'Vencido',       bg: '#fee2e2', fg: '#b91c1c' }
  if (ms < dia)       return { label: 'Hoje',          bg: '#fef3c7', fg: '#b45309' }
  if (ms < 2 * dia)   return { label: 'Amanhã',        bg: '#fef3c7', fg: '#b45309' }
  if (ms < 7 * dia)   return { label: 'Esta semana',   bg: '#dbeafe', fg: '#1e40af' }
  return null
}

function fmtDateBR(dt: string) {
  const d = new Date(dt)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface Props {
  negociacoes: Neg[]
  stages: string[]
  userId: string
  onUpdate?: () => void
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function nameColor(name: string) {
  const colors = ['#6366f1','#8b5cf6','#4A7FDB','#0ea5e9','#16a34a','#dc2626','#7c3aed','#db2777']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return colors[Math.abs(h) % colors.length]
}

export function PipelineKanban({ negociacoes, stages, userId, onUpdate }: Props) {
  // Overrides locais: id → stage definido pelo usuário ainda não confirmado pelo banco.
  // Mantemos até a prop chegar com o mesmo stage, aí limpamos a entrada.
  const [stageOverrides, setStageOverrides] = useState<Record<string, string>>({})
  // Ids removidos otimisticamente — escondemos até a prop refletir.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  // Quando a prop muda, descarta overrides que já foram confirmados pelo servidor.
  useEffect(() => {
    setStageOverrides(prev => {
      const next: Record<string, string> = {}
      for (const [id, st] of Object.entries(prev)) {
        const fromProp = negociacoes.find(n => n.id === id)
        // Se a prop já reflete o stage do override, ele cumpriu seu papel → descarta.
        // Se a prop ainda mostra stage antigo, mantemos o override para evitar flicker.
        if (fromProp && fromProp.stage !== st) next[id] = st
      }
      return next
    })
    setRemovedIds(prev => {
      const next = new Set<string>()
      const propIds = new Set(negociacoes.map(n => n.id))
      for (const id of prev) if (propIds.has(id)) next.add(id)
      return next
    })
  }, [negociacoes])

  // Lista efetiva = prop + overrides aplicados − removidos
  const negs: Neg[] = negociacoes
    .filter(n => !removedIds.has(n.id))
    .map(n => stageOverrides[n.id] ? { ...n, stage: stageOverrides[n.id] } : n)

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStage, setOverStage]   = useState<string | null>(null)
  const [moving, setMoving]         = useState<string | null>(null)
  const [removing, setRemoving]     = useState<string | null>(null)
  const [cardAberto, setCardAberto] = useState<string | null>(null)
  const dragStageRef = useRef<string | null>(null)

  async function handleRemover(negId: string) {
    const neg = negs.find(n => n.id === negId)
    const nome = neg?.escola?.nome ?? 'esta negociação'
    if (!confirm(`Excluir definitivamente a negociação de "${nome}"? Esta ação não pode ser desfeita.`)) return

    setRemoving(negId)
    // Optimistic update: esconde imediatamente
    setRemovedIds(prev => { const next = new Set(prev); next.add(negId); return next })

    const r = await removerDoQuadro(negId)
    setRemoving(null)

    if (!r.success) {
      // Rollback se falhar
      setRemovedIds(prev => { const next = new Set(prev); next.delete(negId); return next })
      alert(`Não foi possível excluir: ${r.error ?? 'erro desconhecido'}`)
      return
    }
    onUpdate?.()
  }

  const byStage = (stage: string) => negs.filter(n => n.stage === stage)

  function handleDragStart(e: React.DragEvent, negId: string, fromStage: string) {
    setDraggingId(negId)
    dragStageRef.current = fromStage
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', negId)
    setTimeout(() => {
      const el = document.getElementById(`neg-${negId}`)
      if (el) el.style.opacity = '0.35'
    }, 0)
  }

  function handleDragEnd(e: React.DragEvent, negId: string) {
    setDraggingId(null)
    setOverStage(null)
    dragStageRef.current = null
    const el = document.getElementById(`neg-${negId}`)
    if (el) el.style.opacity = '1'
  }

  function handleDragOver(e: React.DragEvent, toStage: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverStage(toStage)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null)
  }

  async function handleDrop(e: React.DragEvent, toStage: string) {
    e.preventDefault()
    setOverStage(null)
    const negId     = e.dataTransfer.getData('text/plain')
    const fromStage = dragStageRef.current
    if (!negId || !fromStage || fromStage === toStage) return

    setMoving(negId)
    // Optimistic update: aplica override imediatamente, sobrevive ao refetch da prop
    setStageOverrides(prev => ({ ...prev, [negId]: toStage }))

    try {
      const result = await moverNegociacao(negId, toStage)
      if (!result.success) {
        // Rollback do override
        setStageOverrides(prev => {
          const next = { ...prev }
          delete next[negId]
          return next
        })
      } else {
        // Mantém o override até a prop refletir o novo stage (useEffect limpa)
        onUpdate?.()
      }
    } catch {
      setStageOverrides(prev => {
        const next = { ...prev }
        delete next[negId]
        return next
      })
    }
    setMoving(null)
    setDraggingId(null)
  }

  return (
    <>
    <div className="mp-kanban-hint" style={{
      display: 'none', alignItems: 'center', gap: '.4rem',
      marginBottom: '.5rem', fontSize: '.7rem', color: '#64748b',
      fontFamily: 'var(--font-montserrat,sans-serif)',
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      Arraste para o lado para ver mais colunas
    </div>
    <div className="pipeline-board mp-kanban-scroll" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`,
      gap: '.75rem',
      alignItems: 'flex-start',
    }}>
      {stages.map(stage => {
        const cards  = byStage(stage)
        const cor    = STAGE_COLORS[stage] ?? '#64748b'
        const isOver = overStage === stage
        const label  = STAGE_LABELS[stage] ?? stage
        const stageValue = cards.reduce((acc, n) => acc + (n.valor_estimado ?? 0), 0)

        return (
          <div key={stage}
            style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}
            onDragOver={e => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, stage)}
          >
            {/* Header da coluna */}
            <div style={{
              padding: '.6rem .9rem',
              borderRadius: '10px 10px 0 0',
              background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: `3px solid ${cor}`,
              gap: '.5rem',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', fontFamily: 'var(--font-montserrat,sans-serif)', color: cor, lineHeight: 1 }}>
                  {label}
                </div>
                {stageValue > 0 && (
                  <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.4)', fontFamily: 'var(--font-inter,sans-serif)', marginTop: '.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fmtCurrency(stageValue)}
                  </div>
                )}
              </div>
              <span style={{ background: cor, color: '#fff', fontSize: '.6rem', fontWeight: 800, padding: '.15rem .45rem', borderRadius: 99, flexShrink: 0, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                {cards.length}
              </span>
            </div>

            {/* Área de drop */}
            <div style={{
              background: isOver ? `${cor}10` : '#f8fafc',
              border: `1.5px solid ${isOver ? cor : '#e2e8f0'}`,
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              padding: '.6rem',
              minHeight: 120,
              display: 'flex',
              flexDirection: 'column',
              gap: '.5rem',
              transition: 'all .15s',
              boxShadow: isOver ? `inset 0 0 0 2px ${cor}30` : 'none',
            }}>
              {isOver && draggingId && (
                <div style={{ border: `2px dashed ${cor}`, borderRadius: 8, padding: '.6rem', textAlign: 'center', fontSize: '.68rem', color: cor, fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', background: `${cor}08` }}>
                  Soltar aqui
                </div>
              )}

              {cards.length === 0 && !isOver && (
                <div style={{ textAlign: 'center', padding: '1.25rem .5rem', fontSize: '.7rem', color: '#cbd5e1', fontFamily: 'var(--font-inter,sans-serif)' }}>
                  Vazio
                </div>
              )}

              {cards.map(n => {
                const respNome  = n.responsavel?.full_name ?? ''
                const respColor = respNome ? nameColor(respNome) : '#94a3b8'
                const isMoving  = moving === n.id
                const dueBdg    = dueBadgeMini(n.due_date)
                const tags      = n.tags ?? []

                return (
                  <div
                    key={n.id}
                    id={`neg-${n.id}`}
                    draggable
                    onClick={e => {
                      // Não abre durante drag ou ao clicar em botões/links internos
                      const target = e.target as HTMLElement
                      if (target.closest('button, a')) return
                      if (draggingId) return
                      setCardAberto(n.id)
                    }}
                    onDragStart={e => handleDragStart(e, n.id, stage)}
                    onDragEnd={e => handleDragEnd(e, n.id)}
                    className="kanban-card"
                    style={{
                      background: isMoving ? '#f8fafc' : '#fff',
                      border: `1px solid ${isMoving ? cor : '#e8edf3'}`,
                      borderLeft: `3px solid ${cor}`,
                      borderRadius: 9,
                      padding: '.65rem .75rem',
                      boxShadow: '0 1px 4px rgba(15,23,42,.07)',
                      cursor: draggingId ? 'grabbing' : 'pointer',
                      userSelect: 'none',
                      transition: 'box-shadow .15s, transform .1s',
                      opacity: isMoving ? 0.55 : 1,
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!draggingId) {
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,23,42,.13)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }
                      const btn = e.currentTarget.querySelector('.card-remove-btn') as HTMLElement
                      if (btn) btn.style.opacity = '1'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,.07)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      const btn = e.currentTarget.querySelector('.card-remove-btn') as HTMLElement
                      if (btn) btn.style.opacity = '0'
                    }}
                  >
                    {/* Botão remover — aparece no hover */}
                    <button
                      className="card-remove-btn"
                      onClick={e => { e.stopPropagation(); handleRemover(n.id) }}
                      title="Remover do quadro"
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 20, height: 20, borderRadius: 5,
                        border: '1px solid #fca5a5', background: '#fef2f2',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity .15s',
                        padding: 0, lineHeight: 1,
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>

                    {/* Nome da escola */}
                    <div style={{ fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 800, fontSize: '.8rem', color: '#0f172a', lineHeight: 1.3, marginBottom: '.35rem', wordBreak: 'break-word', paddingRight: '1.2rem' }}>
                      {n.escola?.nome ?? n.titulo ?? '—'}
                    </div>

                    {/* Cidade/Estado */}
                    {n.escola?.estado && (
                      <div style={{ fontSize: '.6rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.3rem' }}>
                        {n.escola.cidade ? `${n.escola.cidade} / ` : ''}{n.escola.estado}
                      </div>
                    )}

                    {/* Valor estimado */}
                    {n.valor_estimado != null && n.valor_estimado > 0 && (
                      <div style={{ fontFamily: 'var(--font-cormorant,serif)', fontWeight: 800, color: '#16a34a', fontSize: '.95rem', letterSpacing: '.01em', lineHeight: 1, marginBottom: '.35rem' }}>
                        {fmtCurrency(n.valor_estimado)}
                      </div>
                    )}

                    {/* Tags + due date */}
                    {(tags.length > 0 || dueBdg) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.25rem', marginBottom: '.35rem' }}>
                        {dueBdg && (
                          <span title={n.due_date ? new Date(n.due_date).toLocaleString('pt-BR') : ''}
                            style={{
                              background: dueBdg.bg, color: dueBdg.fg,
                              fontSize: '.58rem', fontWeight: 800,
                              padding: '.12rem .4rem', borderRadius: 4,
                              fontFamily: 'var(--font-montserrat,sans-serif)',
                              display: 'inline-flex', alignItems: 'center', gap: '.2rem',
                            }}>
                            🕒 {n.due_date ? fmtDateBR(n.due_date) : dueBdg.label}
                          </span>
                        )}
                        {tags.slice(0, 3).map(t => (
                          <span key={t} style={{
                            background: nameColor(t) + '22', color: nameColor(t),
                            fontSize: '.58rem', fontWeight: 700,
                            padding: '.12rem .4rem', borderRadius: 4,
                            fontFamily: 'var(--font-montserrat,sans-serif)',
                          }}>{t}</span>
                        ))}
                        {tags.length > 3 && (
                          <span style={{ fontSize: '.58rem', color: '#94a3b8', fontWeight: 700 }}>+{tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Tag do responsável */}
                    {respNome && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.28rem', background: `${respColor}15`, border: `1px solid ${respColor}35`, borderRadius: 99, padding: '.18rem .5rem .18rem .22rem', marginBottom: '.3rem' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, background: respColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.45rem', fontWeight: 800, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                          {getInitials(respNome)}
                        </div>
                        <span style={{ fontSize: '.6rem', fontWeight: 700, color: respColor, fontFamily: 'var(--font-montserrat,sans-serif)' }}>
                          {respNome.split(' ')[0]}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '.3rem', borderTop: '1px solid #f1f5f9', gap: '.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <div style={{ width: 32, height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: cor, width: `${n.probabilidade}%`, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: '.58rem', fontWeight: 700, color: '#94a3b8', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{n.probabilidade}%</span>
                      </div>
                      <Link href={`/comercial/escolas/${n.escola_id}`} onClick={e => e.stopPropagation()}
                        style={{ fontSize: '.6rem', color: cor, textDecoration: 'none', fontFamily: 'var(--font-montserrat,sans-serif)', fontWeight: 700, flexShrink: 0 }}>
                        Ver →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <style>{`
        [draggable] { -webkit-user-drag: element; }
        [draggable]:active { cursor: grabbing !important; }
      `}</style>
    </div>

    {cardAberto && (
      <NegociacaoCardModal
        negociacaoId={cardAberto}
        onClose={() => setCardAberto(null)}
        onChange={onUpdate}
      />
    )}
    </>
  )
}
