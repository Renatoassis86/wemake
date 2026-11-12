'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCorners, useDroppable,
  type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Quadro, Tarefa } from '@/lib/projetos'
import { PRIORIDADE_COR, PRIORIDADE_LABEL } from '@/lib/projetos'
import { criarTarefa, reordenarColunas, criarColuna, renomearColuna, excluirColuna } from './actions'
import { TarefaModal } from './TarefaModal'

type Mapa = Record<string, Tarefa[]>

function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

export function QuadroKanban({ quadroInicial }: { quadroInicial: Quadro }) {
  const router = useRouter()
  const [colunasMeta, setColunasMeta] = useState(quadroInicial.colunas.map(c => ({ id: c.id, nome: c.nome, cor: c.cor })))
  const [mapa, setMapa] = useState<Mapa>(() => Object.fromEntries(quadroInicial.colunas.map(c => [c.id, c.tarefas])))
  const [tagsDoQuadro, setTagsDoQuadro] = useState(quadroInicial.tags)
  const [tarefaAbertaId, setTarefaAbertaId] = useState<string | null>(null)
  const [novaColunaAberta, setNovaColunaAberta] = useState(false)
  const [, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  // `quadroInicial` só muda de referência quando o server component busca dados novos
  // (depois de um `router.refresh()`): sem isto, edições feitas dentro do TarefaModal
  // (tags, subtarefas, campos) salvam no banco mas o quadro continua mostrando os dados
  // antigos, porque o useState acima só lê o prop na primeira montagem.
  useEffect(() => {
    setColunasMeta(quadroInicial.colunas.map(c => ({ id: c.id, nome: c.nome, cor: c.cor })))
    setMapa(Object.fromEntries(quadroInicial.colunas.map(c => [c.id, c.tarefas])))
    setTagsDoQuadro(quadroInicial.tags)
  }, [quadroInicial])

  function colunaDoId(id: string): string | null {
    if (mapa[id] !== undefined) return id
    for (const [colId, tarefas] of Object.entries(mapa)) if (tarefas.some(t => t.id === id)) return colId
    return null
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const colunaAtiva = colunaDoId(String(active.id))
    const colunaSobre = colunaDoId(String(over.id))
    if (!colunaAtiva || !colunaSobre || colunaAtiva === colunaSobre) return

    setMapa(prev => {
      const origem = [...prev[colunaAtiva]]
      const destino = [...prev[colunaSobre]]
      const idx = origem.findIndex(t => t.id === active.id)
      if (idx === -1) return prev
      const [item] = origem.splice(idx, 1)
      const overIdx = destino.findIndex(t => t.id === over.id)
      destino.splice(overIdx >= 0 ? overIdx : destino.length, 0, item)
      return { ...prev, [colunaAtiva]: origem, [colunaSobre]: destino }
    })
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over) return
    const colunaAtiva = colunaDoId(String(active.id))
    const colunaSobre = colunaDoId(String(over.id))
    if (!colunaAtiva || !colunaSobre) return

    if (colunaAtiva === colunaSobre) {
      const lista = [...mapa[colunaAtiva]]
      const oldIdx = lista.findIndex(t => t.id === active.id)
      const newIdx = lista.findIndex(t => t.id === over.id)
      if (oldIdx === -1) return
      const reordenada = arrayMove(lista, oldIdx, newIdx === -1 ? lista.length - 1 : newIdx)
      setMapa(prev => ({ ...prev, [colunaAtiva]: reordenada }))
      startTransition(async () => {
        await reordenarColunas([{ colunaId: colunaAtiva, tarefaIds: reordenada.map(t => t.id) }])
        router.refresh()
      })
    } else {
      const afetadas = [
        { colunaId: colunaAtiva, tarefaIds: mapa[colunaAtiva].map(t => t.id) },
        { colunaId: colunaSobre, tarefaIds: mapa[colunaSobre].map(t => t.id) },
      ]
      startTransition(async () => {
        await reordenarColunas(afetadas)
        router.refresh()
      })
    }
  }

  function adicionarColuna(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('quadro_id', quadroInicial.id)
    startTransition(async () => {
      const res = await criarColuna(fd)
      if (res.success && res.id) {
        setColunasMeta(prev => [...prev, { id: res.id!, nome: String(fd.get('nome')), cor: '#64748b' }])
        setMapa(prev => ({ ...prev, [res.id!]: [] }))
      }
      setNovaColunaAberta(false)
      router.refresh()
    })
  }

  function excluirColunaLocal(id: string, nome: string) {
    if (!confirm(`Excluir a coluna "${nome}" e todas as tarefas dentro dela? Não pode ser desfeito.`)) return
    setColunasMeta(prev => prev.filter(c => c.id !== id))
    setMapa(prev => { const n = { ...prev }; delete n[id]; return n })
    startTransition(async () => { await excluirColuna(id); router.refresh() })
  }

  const tarefaAberta = tarefaAbertaId
    ? Object.values(mapa).flat().find(t => t.id === tarefaAbertaId) ?? null
    : null

  return (
    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {colunasMeta.map(c => (
          <ColunaKanban
            key={c.id}
            coluna={c}
            tarefas={mapa[c.id] ?? []}
            onAbrirTarefa={setTarefaAbertaId}
            onExcluirColuna={() => excluirColunaLocal(c.id, c.nome)}
            onRenomear={nome => {
              setColunasMeta(prev => prev.map(x => x.id === c.id ? { ...x, nome } : x))
              startTransition(async () => { await renomearColuna(c.id, nome); router.refresh() })
            }}
            onTarefaCriada={(tarefa) => setMapa(prev => ({ ...prev, [c.id]: [...(prev[c.id] ?? []), tarefa] }))}
          />
        ))}
      </DndContext>

      <div style={{ flexShrink: 0, width: 260 }}>
        {novaColunaAberta ? (
          <form onSubmit={adicionarColuna} style={{
            background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: '.75rem',
          }}>
            <input name="nome" autoFocus placeholder="Nome da coluna" required style={{
              width: '100%', boxSizing: 'border-box', padding: '.5rem .65rem', borderRadius: 8,
              border: '1.5px solid #e2e8f0', fontSize: '.84rem', marginBottom: '.5rem',
            }} />
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button type="submit" style={{
                padding: '.45rem .9rem', borderRadius: 8, border: 'none', background: '#00889e', color: '#fff',
                fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
              }}>Adicionar</button>
              <button type="button" onClick={() => setNovaColunaAberta(false)} style={{
                padding: '.45rem .9rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff',
                fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', color: '#64748b',
              }}>Cancelar</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setNovaColunaAberta(true)} style={{
            all: 'unset', cursor: 'pointer', width: '100%', boxSizing: 'border-box', textAlign: 'center',
            padding: '.75rem', borderRadius: 12, border: '1.5px dashed #cbd5e1', color: '#64748b',
            fontSize: '.82rem', fontWeight: 600, fontFamily: 'var(--font-montserrat,sans-serif)',
          }}>
            + Nova coluna
          </button>
        )}
      </div>

      {tarefaAberta && (
        <TarefaModal
          tarefa={tarefaAberta}
          todasTags={tagsDoQuadro}
          quadroId={quadroInicial.id}
          onClose={() => setTarefaAbertaId(null)}
        />
      )}
    </div>
  )
}

function ColunaKanban({ coluna, tarefas, onAbrirTarefa, onExcluirColuna, onRenomear, onTarefaCriada }: {
  coluna: { id: string; nome: string; cor: string }
  tarefas: Tarefa[]
  onAbrirTarefa: (id: string) => void
  onExcluirColuna: () => void
  onRenomear: (nome: string) => void
  onTarefaCriada: (t: Tarefa) => void
}) {
  const router = useRouter()
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id })
  const [editandoNome, setEditandoNome] = useState(false)
  const [novaTarefaAberta, setNovaTarefaAberta] = useState(false)
  const [tituloNovaTarefa, setTituloNovaTarefa] = useState('')
  const [, startTransition] = useTransition()

  function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!tituloNovaTarefa.trim()) return
    const fd = new FormData()
    fd.set('coluna_id', coluna.id)
    fd.set('titulo', tituloNovaTarefa.trim())
    startTransition(async () => {
      const res = await criarTarefa(fd)
      if (res.success && res.id) {
        onTarefaCriada({
          id: res.id, colunaId: coluna.id, titulo: tituloNovaTarefa.trim(), descricao: null,
          responsavel: null, prioridade: null, dataVencimento: null, ordem: tarefas.length, concluida: false,
          tags: [], subtarefas: [],
        })
      }
      setTituloNovaTarefa('')
      setNovaTarefaAberta(false)
      router.refresh()
    })
  }

  return (
    <div style={{ flexShrink: 0, width: 280, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.3rem .3rem .6rem' }}>
        {editandoNome ? (
          <input
            defaultValue={coluna.nome} autoFocus
            onBlur={e => { onRenomear(e.target.value || coluna.nome); setEditandoNome(false) }}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            style={{ fontSize: '.85rem', fontWeight: 700, border: '1px solid #e2e8f0', borderRadius: 6, padding: '.2rem .4rem', width: '70%' }}
          />
        ) : (
          <span onClick={() => setEditandoNome(true)} style={{
            fontSize: '.85rem', fontWeight: 700, color: '#002933', cursor: 'text',
            fontFamily: 'var(--font-montserrat,sans-serif)', display: 'flex', alignItems: 'center', gap: '.4rem',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: coluna.cor, flexShrink: 0 }} />
            {coluna.nome}
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>{tarefas.length}</span>
          </span>
        )}
        <button onClick={onExcluirColuna} title="Excluir coluna" style={{
          all: 'unset', cursor: 'pointer', color: '#94a3b8', fontSize: '.7rem',
        }}>✕</button>
      </div>

      <div
        ref={setNodeRef}
        style={{
          background: isOver ? '#f0fdfa' : '#f8fafc', borderRadius: 12, padding: '.5rem', minHeight: 60,
          border: isOver ? '1.5px dashed #00889e' : '1.5px solid transparent',
          display: 'flex', flexDirection: 'column', gap: '.5rem',
        }}
      >
        <SortableContext items={tarefas.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tarefas.map(t => <CartaoTarefa key={t.id} tarefa={t} onAbrir={() => onAbrirTarefa(t.id)} />)}
        </SortableContext>

        {novaTarefaAberta ? (
          <form onSubmit={adicionar}>
            <textarea
              autoFocus value={tituloNovaTarefa} onChange={e => setTituloNovaTarefa(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); adicionar(e as any) } }}
              placeholder="Título da tarefa" rows={2}
              style={{ width: '100%', boxSizing: 'border-box', padding: '.5rem .6rem', borderRadius: 8, border: '1.5px solid #00889e', fontSize: '.82rem', resize: 'none', marginBottom: '.4rem' }}
            />
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <button type="submit" style={{ padding: '.35rem .75rem', borderRadius: 7, border: 'none', background: '#00889e', color: '#fff', fontSize: '.74rem', fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
              <button type="button" onClick={() => setNovaTarefaAberta(false)} style={{ padding: '.35rem .75rem', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', fontSize: '.74rem', color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setNovaTarefaAberta(true)} style={{
            all: 'unset', cursor: 'pointer', padding: '.4rem .5rem', borderRadius: 8, color: '#64748b',
            fontSize: '.78rem', fontWeight: 600,
          }}>
            + Adicionar tarefa
          </button>
        )}
      </div>
    </div>
  )
}

function CartaoTarefa({ tarefa, onAbrir }: { tarefa: Tarefa; onAbrir: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tarefa.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform), transition,
    opacity: isDragging ? 0.4 : 1,
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '.65rem .75rem',
    cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,41,51,.05)',
  }
  const atrasada = tarefa.dataVencimento && !tarefa.concluida && tarefa.dataVencimento < hojeISO()

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onAbrir}>
      {tarefa.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.4rem' }}>
          {tarefa.tags.map(t => (
            <span key={t.id} style={{ fontSize: '.62rem', fontWeight: 700, color: '#fff', background: t.cor, borderRadius: 999, padding: '.1rem .5rem' }}>
              {t.nome}
            </span>
          ))}
        </div>
      )}
      <div style={{ fontSize: '.82rem', color: '#002933', lineHeight: 1.4, fontWeight: 500 }}>{tarefa.titulo}</div>
      {(tarefa.responsavel || tarefa.dataVencimento || tarefa.prioridade || tarefa.subtarefas.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
          {tarefa.prioridade && (
            <span style={{ fontSize: '.64rem', fontWeight: 700, color: PRIORIDADE_COR[tarefa.prioridade] }}>
              {PRIORIDADE_LABEL[tarefa.prioridade]}
            </span>
          )}
          {tarefa.dataVencimento && (
            <span style={{ fontSize: '.64rem', fontWeight: 600, color: atrasada ? '#dc2626' : '#64748b' }}>
              {new Date(tarefa.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
          {tarefa.subtarefas.length > 0 && (
            <span style={{ fontSize: '.64rem', fontWeight: 600, color: '#64748b' }}>
              {tarefa.subtarefas.filter(s => s.concluida).length}/{tarefa.subtarefas.length}
            </span>
          )}
          {tarefa.responsavel && (
            <span style={{ fontSize: '.64rem', fontWeight: 600, color: '#64748b', marginLeft: 'auto' }}>
              {tarefa.responsavel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
