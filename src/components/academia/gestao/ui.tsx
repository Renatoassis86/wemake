'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { STATUS, type Status } from '@/lib/academia-gestao'
import type { Resultado } from '@/app/(dashboard)/academia/gestao/actions'

/** Executa uma server action e mostra o erro (se houver) sem recarregar a página. */
export function useRun() {
  const [pending, start] = useTransition()
  const [erro, setErro] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  function run(fn: () => Promise<Resultado>, onOk?: () => void) {
    setErro(null)
    setMsg(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) setErro(r.erro)
      else {
        if (r.msg) setMsg(r.msg)
        onOk?.()
      }
    })
  }
  return { pending, erro, msg, run, limpar: () => { setErro(null); setMsg(null) } }
}

export function Aviso({ erro, msg }: { erro?: string | null; msg?: string | null }) {
  if (!erro && !msg) return null
  return (
    <p role={erro ? 'alert' : 'status'} className={`ac-aviso ${erro ? 'is-erro' : 'is-ok'}`}>
      {erro ?? msg}
    </p>
  )
}

/** Seletor de status com a cor do próprio status. */
export function StatusSelect({
  value, onChange, disabled, label = 'Status',
}: { value: Status; onChange: (s: Status) => void; disabled?: boolean; label?: string }) {
  return (
    <select
      className="ac-st"
      data-s={value}
      value={value}
      disabled={disabled}
      aria-label={label}
      onChange={e => onChange(e.target.value as Status)}
    >
      {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

export function Chip({ s, children }: { s: string; children?: ReactNode }) {
  return <span className="ac-chip" data-s={s}>{children ?? s}</span>
}

/** Escolha do responsável entre a equipe interna. Mantém um nome antigo (fora da equipe) visível até ser trocado. */
export function SelectPessoa({
  pessoas, value, onChange, name, label = 'Responsável', vazio = 'Sem responsável', defaultValue, className = 'ac-cell-in',
}: {
  pessoas: string[]; value?: string | null; onChange?: (v: string) => void; name?: string; label?: string
  vazio?: string; defaultValue?: string; className?: string
}) {
  const atual = value ?? defaultValue ?? ''
  const lista = atual && !pessoas.includes(atual) ? [atual, ...pessoas] : pessoas
  const props = value !== undefined ? { value: atual } : { defaultValue: atual }
  return (
    <select className={className} name={name} aria-label={label} {...props} onChange={onChange ? e => onChange(e.target.value) : undefined}>
      <option value="">{vazio}</option>
      {lista.map(p => <option key={p} value={p}>{p}</option>)}
    </select>
  )
}
