'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Tarefa, Tag } from '@/lib/projetos'
import { PRIORIDADES, PRIORIDADE_LABEL } from '@/lib/projetos'
import {
  atualizarTarefa, excluirTarefa, definirTagsDaTarefa, criarTag,
  criarSubtarefa, alternarSubtarefa, excluirSubtarefa,
} from './actions'

const PALETA_TAG = ['#00889e', '#7c3aed', '#dc2626', '#d97706', '#16a34a', '#2563eb', '#be185d']

const rotulo: React.CSSProperties = {
  display: 'block', fontSize: '.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
  color: '#94a3b8', marginBottom: '.3rem', fontFamily: 'var(--font-montserrat,sans-serif)',
}
const campo: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '.5rem .65rem', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: '.84rem', fontFamily: 'var(--font-inter,sans-serif)', color: '#002933',
}

export function TarefaModal({ tarefa, todasTags, quadroId, onClose }: {
  tarefa: Tarefa; todasTags: Tag[]; quadroId: string; onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [titulo, setTitulo] = useState(tarefa.titulo)
  const [novaSubtarefa, setNovaSubtarefa] = useState('')
  const [novaTagNome, setNovaTagNome] = useState('')
  const [novaTagCor, setNovaTagCor] = useState(PALETA_TAG[0])
  const [mostrarNovaTag, setMostrarNovaTag] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function salvarCampos() {
    if (!formRef.current) return
    const fd = new FormData(formRef.current)
    fd.set('id', tarefa.id)
    fd.set('titulo', titulo)
    startTransition(async () => {
      await atualizarTarefa(fd)
      router.refresh()
    })
  }

  function excluir() {
    if (!confirm(`Excluir a tarefa "${tarefa.titulo}"? Não pode ser desfeito.`)) return
    startTransition(async () => {
      await excluirTarefa(tarefa.id)
      router.refresh()
      onClose()
    })
  }

  function alternarTag(tagId: string) {
    const atuais = tarefa.tags.map(t => t.id)
    const novas = atuais.includes(tagId) ? atuais.filter(id => id !== tagId) : [...atuais, tagId]
    startTransition(async () => {
      await definirTagsDaTarefa(tarefa.id, novas)
      router.refresh()
    })
  }

  function adicionarTag() {
    if (!novaTagNome.trim()) return
    const fd = new FormData()
    fd.set('quadro_id', quadroId)
    fd.set('nome', novaTagNome.trim())
    fd.set('cor', novaTagCor)
    startTransition(async () => {
      const res = await criarTag(fd)
      if (res.success && res.id) await definirTagsDaTarefa(tarefa.id, [...tarefa.tags.map(t => t.id), res.id])
      setNovaTagNome(''); setMostrarNovaTag(false)
      router.refresh()
    })
  }

  function adicionarSubtarefa() {
    if (!novaSubtarefa.trim()) return
    const fd = new FormData()
    fd.set('tarefa_id', tarefa.id)
    fd.set('titulo', novaSubtarefa.trim())
    startTransition(async () => {
      await criarSubtarefa(fd)
      setNovaSubtarefa('')
      router.refresh()
    })
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,41,51,.45)', zIndex: 3000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 1rem', overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
        boxShadow: '0 20px 60px rgba(0,41,51,.25)', padding: '1.5rem',
      }}>
        <form ref={formRef} onSubmit={e => e.preventDefault()}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', marginBottom: '1.1rem' }}>
            <input
              value={titulo} onChange={e => setTitulo(e.target.value)} onBlur={salvarCampos}
              style={{ ...campo, fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-cormorant,serif)', border: 'none', padding: '.1rem 0' }}
            />
            <button type="button" onClick={onClose} style={{
              all: 'unset', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', color: '#64748b',
            }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.75rem', marginBottom: '1.1rem' }}>
            <div>
              <label style={rotulo}>Responsável</label>
              <input name="responsavel" defaultValue={tarefa.responsavel ?? ''} onBlur={salvarCampos} style={campo} />
            </div>
            <div>
              <label style={rotulo}>Prioridade</label>
              <select name="prioridade" defaultValue={tarefa.prioridade ?? ''} onChange={salvarCampos} style={campo}>
                <option value="">Sem prioridade</option>
                {PRIORIDADES.map(p => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label style={rotulo}>Vencimento</label>
              <input name="data_vencimento" type="date" defaultValue={tarefa.dataVencimento ?? ''} onChange={salvarCampos} style={campo} />
            </div>
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={rotulo}>Descrição</label>
            <textarea name="descricao" defaultValue={tarefa.descricao ?? ''} onBlur={salvarCampos} rows={3}
              style={{ ...campo, resize: 'vertical' as const }} />
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={rotulo}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', alignItems: 'center' }}>
              {todasTags.map(t => {
                const ativa = tarefa.tags.some(x => x.id === t.id)
                return (
                  <button key={t.id} type="button" onClick={() => alternarTag(t.id)} style={{
                    all: 'unset', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, padding: '.25rem .6rem', borderRadius: 999,
                    color: ativa ? '#fff' : t.cor, background: ativa ? t.cor : '#fff', border: `1.5px solid ${t.cor}`,
                  }}>
                    {t.nome}
                  </button>
                )
              })}
              <button type="button" onClick={() => setMostrarNovaTag(v => !v)} style={{
                all: 'unset', cursor: 'pointer', fontSize: '.72rem', fontWeight: 700, color: '#00889e',
              }}>
                + nova tag
              </button>
            </div>
            {mostrarNovaTag && (
              <div onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarTag() } }}
                style={{ display: 'flex', gap: '.4rem', marginTop: '.5rem', alignItems: 'center' }}>
                <input value={novaTagNome} onChange={e => setNovaTagNome(e.target.value)} placeholder="Nome da tag"
                  style={{ ...campo, flex: 1 }} />
                {PALETA_TAG.map(c => (
                  <button key={c} type="button" onClick={() => setNovaTagCor(c)} style={{
                    all: 'unset', cursor: 'pointer', width: 18, height: 18, borderRadius: 99, background: c,
                    border: novaTagCor === c ? '2px solid #002933' : '2px solid transparent',
                  }} />
                ))}
                <button type="button" onClick={adicionarTag} style={{
                  padding: '.4rem .7rem', borderRadius: 7, border: 'none', background: '#00889e', color: '#fff',
                  fontSize: '.72rem', fontWeight: 700, cursor: 'pointer',
                }}>Criar</button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={rotulo}>Subtarefas</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', marginBottom: '.5rem' }}>
              {tarefa.subtarefas.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <input type="checkbox" checked={s.concluida} onChange={e => startTransition(async () => { await alternarSubtarefa(s.id, e.target.checked); router.refresh() })} />
                  <span style={{ flex: 1, fontSize: '.82rem', color: s.concluida ? '#94a3b8' : '#334155', textDecoration: s.concluida ? 'line-through' : 'none' }}>{s.titulo}</span>
                  <button type="button" onClick={() => startTransition(async () => { await excluirSubtarefa(s.id); router.refresh() })} style={{
                    all: 'unset', cursor: 'pointer', fontSize: '.68rem', color: '#dc2626',
                  }}>remover</button>
                </div>
              ))}
            </div>
            <div onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarSubtarefa() } }}
              style={{ display: 'flex', gap: '.4rem' }}>
              <input value={novaSubtarefa} onChange={e => setNovaSubtarefa(e.target.value)} placeholder="Adicionar subtarefa"
                style={{ ...campo, flex: 1 }} />
              <button type="button" onClick={adicionarSubtarefa} style={{
                padding: '.5rem .8rem', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc',
                fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', color: '#334155',
              }}>+ Adicionar</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '.75rem', borderTop: '1px solid #f1f5f9' }}>
            <button type="button" onClick={excluir} disabled={pending} style={{
              all: 'unset', cursor: pending ? 'wait' : 'pointer', fontSize: '.78rem', fontWeight: 700, color: '#dc2626',
            }}>Excluir tarefa</button>
            <span style={{ fontSize: '.7rem', color: '#94a3b8' }}>{pending ? 'Salvando...' : 'Salvo automaticamente'}</span>
          </div>
        </form>
      </div>
    </div>
  )
}
