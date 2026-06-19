'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, X, Save, AlertTriangle } from 'lucide-react'
import { excluirPreCadastro, atualizarPreCadastro, type PreCadastroEditPayload } from './actions'

interface Props {
  registro: PreCadastroEditPayload & { id: string }
}

const STATUS_OPTIONS = [
  { value: 'pendente',   label: 'Pendente' },
  { value: 'contatado',  label: 'Em contato' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'descartado', label: 'Descartado' },
]

const btnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '.35rem',
  padding: '.4rem .8rem', borderRadius: 8,
  fontSize: '.75rem', fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font-montserrat,sans-serif)',
  border: '1px solid transparent', transition: 'all .15s',
}

export default function PreCadastroActions({ registro }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [form, setForm] = useState<PreCadastroEditPayload>(registro)

  function handleDelete() {
    setErro(null)
    startTransition(async () => {
      const r = await excluirPreCadastro(registro.id)
      if (!r.success) {
        setErro(r.error ?? 'Erro ao excluir')
        return
      }
      setConfirmDelete(false)
      router.refresh()
    })
  }

  function handleSave() {
    setErro(null)
    startTransition(async () => {
      const r = await atualizarPreCadastro(form)
      if (!r.success) {
        setErro(r.error ?? 'Erro ao salvar')
        return
      }
      setEditOpen(false)
      router.refresh()
    })
  }

  function field<K extends keyof PreCadastroEditPayload>(key: K, value: PreCadastroEditPayload[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <div style={{ display: 'inline-flex', gap: '.4rem' }}>
        <button
          type="button"
          onClick={() => { setForm(registro); setErro(null); setEditOpen(true) }}
          style={{
            ...btnBase,
            background: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff' }}
        >
          <Pencil size={12} /> Editar
        </button>
        <button
          type="button"
          onClick={() => { setErro(null); setConfirmDelete(true) }}
          style={{
            ...btnBase,
            background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
        >
          <Trash2 size={12} /> Excluir
        </button>
      </div>

      {/* MODAL DE EXCLUSÃO */}
      {confirmDelete && (
        <Modal onClose={() => !pending && setConfirmDelete(false)}>
          <div style={{ padding: '1.5rem', maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#b91c1c" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Excluir pré-cadastro?
              </h3>
            </div>
            <p style={{ fontSize: '.88rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Você está prestes a excluir permanentemente o pré-cadastro de{' '}
              <strong style={{ color: '#0f172a' }}>{registro.nome_fantasia || registro.razao_social || 'escola sem nome'}</strong>.
              {' '}Esta ação não pode ser desfeita.
            </p>
            {erro && <ErrorBox msg={erro} />}
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <button type="button" disabled={pending} onClick={() => setConfirmDelete(false)} style={{ ...btnBase, background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
                Cancelar
              </button>
              <button type="button" disabled={pending} onClick={handleDelete} style={{ ...btnBase, background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}>
                {pending ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editOpen && (
        <Modal onClose={() => !pending && setEditOpen(false)}>
          <div style={{ padding: '1.5rem', width: 'min(720px, 92vw)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Editar pré-cadastro
              </h3>
              <button type="button" onClick={() => !pending && setEditOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <Section title="Escola">
              <Row>
                <Input label="Nome fantasia" value={form.nome_fantasia ?? ''} onChange={v => field('nome_fantasia', v)} />
                <Input label="Razão social" value={form.razao_social ?? ''} onChange={v => field('razao_social', v)} />
              </Row>
              <Row>
                <Input label="CNPJ" value={form.cnpj ?? ''} onChange={v => field('cnpj', v)} />
                <Input label="E-mail institucional" type="email" value={form.email_institucional ?? ''} onChange={v => field('email_institucional', v)} />
              </Row>
              <Row>
                <Input label="Cidade" value={form.cidade ?? ''} onChange={v => field('cidade', v)} />
                <Input label="Estado (UF)" value={form.estado ?? ''} onChange={v => field('estado', (v ?? '').toUpperCase().slice(0, 2))} />
              </Row>
            </Section>

            <Section title="Representante legal">
              <Row>
                <Input label="Nome" value={form.legal_nome ?? ''} onChange={v => field('legal_nome', v)} />
                <Input label="E-mail" type="email" value={form.legal_email ?? ''} onChange={v => field('legal_email', v)} />
              </Row>
              <Row>
                <Input label="WhatsApp" value={form.legal_whatsapp ?? ''} onChange={v => field('legal_whatsapp', v)} />
              </Row>
            </Section>

            <Section title="Financeiro">
              <Row>
                <Input label="E-mail (cobrança e NF)" type="email" value={form.fin_email_cobranca ?? ''} onChange={v => field('fin_email_cobranca', v)} />
                <Input label="Ticket médio" value={form.ticket_medio ?? ''} onChange={v => field('ticket_medio', v)} />
              </Row>
            </Section>

            <Section title="Atendimento">
              <Row>
                <Select
                  label="Status"
                  value={form.status ?? 'pendente'}
                  onChange={v => field('status', v)}
                  options={STATUS_OPTIONS}
                />
              </Row>
              <label style={lbl}>Observações</label>
              <textarea
                value={form.observacoes ?? ''}
                onChange={e => field('observacoes', e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '.55rem .75rem', borderRadius: 8,
                  border: '1px solid #cbd5e1', fontSize: '.85rem',
                  fontFamily: 'var(--font-inter,sans-serif)', resize: 'vertical',
                }}
              />
            </Section>

            {erro && <ErrorBox msg={erro} />}

            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" disabled={pending} onClick={() => setEditOpen(false)} style={{ ...btnBase, background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>
                Cancelar
              </button>
              <button type="button" disabled={pending} onClick={handleSave} style={{ ...btnBase, background: '#4A7FDB', color: '#fff', borderColor: '#4A7FDB' }}>
                <Save size={13} />
                {pending ? 'Salvando…' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(15,23,42,.35)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        fontSize: '.65rem', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '.1em', color: '#4A7FDB', marginBottom: '.5rem',
        fontFamily: 'var(--font-montserrat,sans-serif)',
        paddingBottom: '.3rem', borderBottom: '1px solid rgba(74,143,231,.2)',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.6rem', marginBottom: '.6rem' }}>
      {children}
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '.7rem', fontWeight: 700, color: '#475569',
  marginBottom: '.25rem', textTransform: 'uppercase', letterSpacing: '.05em',
  fontFamily: 'var(--font-montserrat,sans-serif)',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '.5rem .75rem', borderRadius: 8,
  border: '1px solid #cbd5e1', fontSize: '.85rem', color: '#0f172a',
  fontFamily: 'var(--font-inter,sans-serif)',
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inp} />
    </div>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={inp}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
      padding: '.6rem .8rem', borderRadius: 8, fontSize: '.8rem', marginTop: '.75rem',
    }}>
      {msg}
    </div>
  )
}
