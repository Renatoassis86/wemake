'use client'

import { useState } from 'react'

const STAGES = [
  { id: 'precadastro_recebido',  label: 'Pré-cadastro Recebido',            cor: '#6366f1' },
  { id: 'construcao_proposta',   label: 'Construção de Proposta Financeira', cor: '#f59e0b' },
  { id: 'envio_proposta',        label: 'Envio de Proposta Financeira',      cor: '#0ea5e9' },
  { id: 'devolutiva',            label: 'Recebimento de Devolutiva',         cor: '#8b5cf6' },
  { id: 'encaminhamento_dado',   label: 'Encaminhamento Dado',               cor: '#16a34a' },
]

interface Comentario {
  id: string
  texto: string
  autor_id: string
  criado_em: string
}

interface Card {
  precadastro_id: string
  lead_id: string | null
  escola_nome: string
  cidade?: string | null
  estado?: string | null
  pipeline_stage: string
  pipeline_comentarios: Comentario[]
  created_at: string
}

interface Props { cards: Card[] }

export function PipelinePropostaBoard({ cards: cardsIniciais }: Props) {
  const [cards, setCards] = useState<Card[]>(cardsIniciais)
  const [modal, setModal]         = useState<Card | null>(null)
  const [novoComent, setNovoComent] = useState('')
  const [enviando, setEnviando]   = useState(false)
  const [dragId, setDragId]       = useState<string | null>(null)

  function cardsDoStage(stageId: string) {
    return cards.filter(c => c.pipeline_stage === stageId)
  }

  async function patchCard(card: Card, updates: Record<string, any>) {
    const res = await fetch(`/api/pipeline-proposta/${card.lead_id ?? 'new'}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precadastro_id: card.precadastro_id, escola_nome: card.escola_nome, ...updates }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json
  }

  async function moverCard(precadastro_id: string, novoStage: string) {
    const card = cards.find(c => c.precadastro_id === precadastro_id)
    if (!card) return

    // Optimistic update
    setCards(prev => prev.map(c =>
      c.precadastro_id === precadastro_id ? { ...c, pipeline_stage: novoStage } : c
    ))
    setModal(prev => prev?.precadastro_id === precadastro_id
      ? { ...prev, pipeline_stage: novoStage } : prev
    )

    const json = await patchCard(card, { stage: novoStage })
    if (json?.lead_id) {
      setCards(prev => prev.map(c =>
        c.precadastro_id === precadastro_id ? { ...c, lead_id: json.lead_id } : c
      ))
    }
  }

  async function adicionarComentario() {
    if (!modal || !novoComent.trim()) return
    setEnviando(true)
    const json = await patchCard(modal, { comentario: novoComent })
    if (json) {
      const comentarios = json.dados_extras?.pipeline_comentarios ?? []
      setCards(prev => prev.map(c =>
        c.precadastro_id === modal.precadastro_id
          ? { ...c, lead_id: json.lead_id ?? c.lead_id, pipeline_comentarios: comentarios }
          : c
      ))
      setModal(prev => prev ? {
        ...prev,
        lead_id: json.lead_id ?? prev.lead_id,
        pipeline_comentarios: comentarios,
      } : prev)
      setNovoComent('')
    }
    setEnviando(false)
  }

  async function removerComentario(comentId: string) {
    if (!modal) return
    const json = await patchCard(modal, { remover_comentario: comentId })
    if (json) {
      const comentarios = json.dados_extras?.pipeline_comentarios ?? []
      setCards(prev => prev.map(c =>
        c.precadastro_id === modal.precadastro_id ? { ...c, pipeline_comentarios: comentarios } : c
      ))
      setModal(prev => prev ? { ...prev, pipeline_comentarios: comentarios } : prev)
    }
  }

  // Drag & drop
  function onDragStart(pid: string) { setDragId(pid) }
  function onDragOver(e: React.DragEvent) { e.preventDefault() }
  function onDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault()
    if (dragId) moverCard(dragId, stageId)
    setDragId(null)
  }

  function fmtData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
  }

  const stageAtualModal = modal ? (STAGES.find(s => s.id === modal.pipeline_stage) ?? STAGES[0]) : null
  const comentariosModal = modal?.pipeline_comentarios ?? []

  return (
    <>
      {/* Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${STAGES.length}, minmax(230px, 1fr))`,
        gap: '1rem',
        alignItems: 'start',
        overflowX: 'auto',
        paddingBottom: '1rem',
      }}>
        {STAGES.map(stage => {
          const colCards = cardsDoStage(stage.id)
          return (
            <div key={stage.id}
              onDragOver={onDragOver}
              onDrop={e => onDrop(e, stage.id)}
              style={{
                background: '#f8fafc',
                border: `1.5px solid ${stage.cor}25`,
                borderRadius: 14,
                minHeight: 220,
              }}>
              {/* Header */}
              <div style={{
                padding: '.75rem 1rem',
                borderBottom: `2.5px solid ${stage.cor}`,
                borderRadius: '14px 14px 0 0',
                background: '#fff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem' }}>
                  <span style={{
                    fontSize: '.68rem', fontWeight: 800, textTransform: 'uppercase',
                    letterSpacing: '.06em', color: stage.cor,
                    fontFamily: 'var(--font-montserrat,sans-serif)', lineHeight: 1.3,
                  }}>{stage.label}</span>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: stage.cor, color: '#fff',
                    fontSize: '.68rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>{colCards.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div style={{ padding: '.6rem', display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {colCards.length === 0 && (
                  <div style={{
                    textAlign: 'center', padding: '1.5rem .5rem',
                    color: '#cbd5e1', fontSize: '.7rem', fontStyle: 'italic',
                    fontFamily: 'var(--font-inter,sans-serif)',
                  }}>Vazio</div>
                )}
                {colCards.map(card => (
                  <div key={card.precadastro_id}
                    draggable
                    onDragStart={() => onDragStart(card.precadastro_id)}
                    onClick={() => { setModal(card); setNovoComent('') }}
                    style={{
                      background: '#fff', border: '1.5px solid #e2e8f0',
                      borderRadius: 10, padding: '.7rem .85rem',
                      cursor: 'grab', boxShadow: '0 1px 4px rgba(15,23,42,.06)',
                      transition: 'box-shadow .15s',
                      borderLeft: `3px solid ${stage.cor}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,.06)' }}
                  >
                    <div style={{
                      fontWeight: 700, fontSize: '.8rem', color: '#0f172a',
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                      marginBottom: '.2rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{card.escola_nome}</div>
                    {(card.cidade || card.estado) && (
                      <div style={{ fontSize: '.65rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.3rem' }}>
                        {[card.cidade, card.estado].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.6rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                        {fmtData(card.created_at)}
                      </span>
                      {card.pipeline_comentarios.length > 0 && (
                        <span style={{ fontSize: '.62rem', color: '#4A7FDB', fontWeight: 700 }}>
                          💬 {card.pipeline_comentarios.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600,
            maxHeight: '88vh', overflow: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,.28)',
          }}>
            {/* Header modal */}
            <div style={{
              padding: '1.1rem 1.5rem',
              borderBottom: `3px solid ${stageAtualModal?.cor ?? '#4A7FDB'}`,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
            }}>
              <div>
                <div style={{
                  fontSize: '1rem', fontWeight: 800, color: '#0f172a',
                  fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.25rem',
                }}>{modal.escola_nome}</div>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {(modal.cidade || modal.estado) && (
                    <span style={{ fontSize: '.72rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
                      {[modal.cidade, modal.estado].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  <span style={{
                    background: `${stageAtualModal?.cor}20`, color: stageAtualModal?.cor,
                    border: `1px solid ${stageAtualModal?.cor}50`,
                    padding: '.15rem .55rem', borderRadius: 99,
                    fontSize: '.62rem', fontWeight: 800,
                    fontFamily: 'var(--font-montserrat,sans-serif)',
                  }}>{stageAtualModal?.label}</span>
                </div>
              </div>
              <button onClick={() => setModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.2rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Mover de fase */}
              <div>
                <div style={{
                  fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '.07em', color: '#94a3b8',
                  fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.65rem',
                }}>Mover para fase</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                  {STAGES.map(s => {
                    const atual = modal.pipeline_stage === s.id
                    return (
                      <button key={s.id} type="button"
                        onClick={() => moverCard(modal.precadastro_id, s.id)}
                        style={{
                          padding: '.3rem .75rem', borderRadius: 99,
                          border: `1.5px solid ${atual ? s.cor : '#e2e8f0'}`,
                          background: atual ? s.cor : '#f8fafc',
                          color: atual ? '#fff' : '#475569',
                          fontSize: '.7rem', fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'var(--font-montserrat,sans-serif)',
                          transition: 'all .12s',
                        }}>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Comentários */}
              <div>
                <div style={{
                  fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '.07em', color: '#94a3b8',
                  fontFamily: 'var(--font-montserrat,sans-serif)', marginBottom: '.75rem',
                }}>Histórico de Negociação</div>

                {/* Input novo comentário */}
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
                  <textarea
                    value={novoComent}
                    onChange={e => setNovoComent(e.target.value)}
                    placeholder="Adicionar nota ou comentário sobre esta escola…"
                    rows={2}
                    style={{
                      flex: 1, padding: '.65rem .9rem', fontSize: '.82rem',
                      fontFamily: 'var(--font-inter,sans-serif)',
                      border: '1.5px solid #e2e8f0', borderRadius: 8,
                      background: '#f8fafc', color: '#0f172a', outline: 'none',
                      resize: 'vertical', minHeight: 60,
                    }}
                  />
                  <button
                    onClick={adicionarComentario}
                    disabled={enviando || !novoComent.trim()}
                    type="button"
                    style={{
                      padding: '.65rem 1rem', borderRadius: 8, border: 'none',
                      background: enviando || !novoComent.trim() ? '#e2e8f0' : '#4A7FDB',
                      color: enviando || !novoComent.trim() ? '#94a3b8' : '#fff',
                      fontWeight: 700, fontSize: '.78rem', cursor: 'pointer',
                      fontFamily: 'var(--font-montserrat,sans-serif)',
                      alignSelf: 'flex-start',
                      transition: 'all .12s',
                    }}>
                    {enviando ? '...' : 'Salvar'}
                  </button>
                </div>

                {comentariosModal.length === 0 ? (
                  <div style={{ fontSize: '.75rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                    Nenhum comentário ainda. Adicione notas sobre essa negociação.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {comentariosModal.map(c => (
                      <div key={c.id} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 10, padding: '.75rem 1rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                          <span style={{ fontSize: '.65rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
                            {new Date(c.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button type="button"
                            onClick={() => removerComentario(c.id)}
                            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '.65rem', padding: 0 }}
                            title="Remover">✕</button>
                        </div>
                        <div style={{
                          fontSize: '.82rem', color: '#0f172a', lineHeight: 1.5,
                          fontFamily: 'var(--font-inter,sans-serif)', whiteSpace: 'pre-wrap',
                        }}>{c.texto}</div>
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
