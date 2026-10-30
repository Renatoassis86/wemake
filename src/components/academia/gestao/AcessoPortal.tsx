'use client'

import { useState } from 'react'
import { corrigirHashPortal, definirEmailPortal, definirSenhaPortal } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import { Aviso, useRun } from './ui'

/**
 * Acesso da escola ao Portal do Diagnóstico (/meu-diagnostico): e-mail +
 * senha numérica de 6 dígitos. Mesma ideia do AcessoAtual (PIN do
 * /diagnostico) — a senha fica visível na tela sem precisar gerar outra.
 */
export default function AcessoPortal({ id, escola, emailAtual, senhaAtual }: { id: string; escola: string; emailAtual?: string | null; senhaAtual?: string | null }) {
  const [email, setEmail] = useState(emailAtual ?? '')
  const [copiado, setCopiado] = useState('')
  const emailRun = useRun()
  const senhaRun = useRun()
  const corrigirRun = useRun()

  async function copiar(txt: string) {
    try { await navigator.clipboard.writeText(txt); setCopiado(txt); setTimeout(() => setCopiado(''), 2000) } catch { /* sem permissão de área de transferência */ }
  }

  return (
    <div className="ac-pinbox" role="status">
      <p className="ac-kicker">Acesso de {escola} ao Portal do Diagnóstico</p>
      <p className="ac-hint" style={{ margin: '0 0 .4rem' }}>E-mail de login (em /meu-diagnostico)</p>
      <div className="ac-form-a" style={{ marginBottom: '.6rem' }}>
        <input
          className="ac-cell-in" style={{ minWidth: 260 }} type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="escola@exemplo.com.br"
        />
        <button
          type="button" className="ac-btn-sm" disabled={emailRun.pending}
          onClick={() => emailRun.run(async () => { const r = await definirEmailPortal(id, email); return r.ok ? { ok: true as const, msg: 'E-mail salvo.' } : { ok: false as const, erro: r.erro ?? 'Erro ao salvar.' } })}
        >
          {emailRun.pending ? 'Salvando…' : 'Salvar e-mail'}
        </button>
      </div>
      <Aviso erro={emailRun.erro} msg={emailRun.msg} />

      <p className="ac-hint" style={{ margin: '.8rem 0 .2rem' }}>Senha (6 números)</p>
      {senhaAtual ? <p className="ac-pin-valor">{senhaAtual}</p> : <p className="ac-hint" style={{ margin: 0 }}>Nenhuma senha gerada ainda.</p>}
      <div className="ac-form-a">
        {senhaAtual ? <button type="button" className="ac-btn" onClick={() => copiar(senhaAtual)}>{copiado === senhaAtual ? 'Copiada' : 'Copiar senha'}</button> : null}
        <button
          type="button" className="ac-btn-sm" disabled={senhaRun.pending}
          onClick={() => {
            if (senhaAtual && !confirm('Gerar uma nova senha? A senha atual deixa de funcionar.')) return
            senhaRun.run(async () => { const r = await definirSenhaPortal(id); return r.ok ? { ok: true as const } : { ok: false as const, erro: r.erro } })
          }}
        >
          {senhaRun.pending ? 'Gerando…' : senhaAtual ? 'Gerar nova senha' : 'Gerar senha'}
        </button>
      </div>
      <Aviso erro={senhaRun.erro} />

      {senhaAtual ? (
        <>
          <button
            type="button" className="ac-btn-sm" disabled={corrigirRun.pending} style={{ marginTop: '.6rem' }}
            onClick={() => corrigirRun.run(async () => {
              const r = await corrigirHashPortal(id)
              return r.ok ? { ok: true as const, msg: 'Login corrigido — a senha continua a mesma.' } : { ok: false as const, erro: r.erro ?? 'Erro ao corrigir.' }
            })}
          >
            {corrigirRun.pending ? 'Corrigindo…' : 'Escola não consegue entrar? Corrigir login'}
          </button>
          <Aviso erro={corrigirRun.erro} msg={corrigirRun.msg} />
        </>
      ) : null}

      <p className="ac-hint" style={{ marginTop: '.6rem' }}>
        A escola entra em <b>/meu-diagnostico</b> com este e-mail e esta senha. Funciona só depois que o diagnóstico está "Concluído".
      </p>
    </div>
  )
}
