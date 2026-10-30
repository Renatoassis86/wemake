'use client'

import { useState } from 'react'
import { definirEmailPortal, definirSenhaPortal } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import { Aviso, useRun } from './ui'

/**
 * Versão compacta de AcessoPortal pra linha da lista de diagnósticos —
 * cria/edita o acesso da escola ao Portal do Diagnóstico sem precisar abrir
 * a análise completa. Serve tanto pras 5 escolas já importadas quanto pra
 * qualquer diagnóstico preenchido manualmente pela equipe.
 */
export default function AcessoPortalLinha({ id, emailAtual, senhaAtual }: { id: string; emailAtual: string | null; senhaAtual: string | null }) {
  const [editando, setEditando] = useState(false)
  const [email, setEmail] = useState(emailAtual ?? '')
  const [copiado, setCopiado] = useState(false)
  const emailRun = useRun()
  const senhaRun = useRun()

  async function copiar() {
    if (!emailAtual || !senhaAtual) return
    try {
      await navigator.clipboard.writeText(`E-mail: ${emailAtual}\nSenha: ${senhaAtual}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* sem permissão de área de transferência */ }
  }

  if (!emailAtual || editando) {
    return (
      <div className="ac-portal-linha">
        <input
          className="ac-cell-in" style={{ minWidth: 190 }} type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="escola@exemplo.com.br" aria-label="E-mail de acesso ao portal"
        />
        <button
          type="button" className="ac-btn-sm" disabled={emailRun.pending || !email}
          onClick={() => emailRun.run(async () => {
            const r = await definirEmailPortal(id, email)
            if (!r.ok) return { ok: false as const, erro: r.erro ?? 'Erro ao salvar.' }
            return { ok: true as const }
          }, () => setEditando(false))}
        >
          {emailRun.pending ? 'Salvando…' : emailAtual ? 'Salvar' : 'Criar acesso'}
        </button>
        {editando ? (
          <button type="button" className="ac-btn-sm" onClick={() => { setEditando(false); setEmail(emailAtual ?? ''); emailRun.limpar() }}>
            Cancelar
          </button>
        ) : null}
        <Aviso erro={emailRun.erro} />
      </div>
    )
  }

  return (
    <div className="ac-portal-linha">
      <span className="ac-portal-email">{emailAtual}</span>
      {senhaAtual ? (
        <>
          <span className="ac-portal-senha">{senhaAtual}</span>
          <button type="button" className="ac-btn-sm" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
        </>
      ) : (
        <button
          type="button" className="ac-btn-sm" disabled={senhaRun.pending}
          onClick={() => senhaRun.run(async () => {
            const r = await definirSenhaPortal(id)
            return r.ok ? { ok: true as const } : { ok: false as const, erro: r.erro }
          })}
        >
          {senhaRun.pending ? 'Gerando…' : 'Gerar senha'}
        </button>
      )}
      <button type="button" className="ac-btn-sm" onClick={() => setEditando(true)}>Editar</button>
      <Aviso erro={senhaRun.erro} />
    </div>
  )
}
