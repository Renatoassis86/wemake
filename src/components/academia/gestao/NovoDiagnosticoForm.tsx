'use client'

import { useState } from 'react'
import type { Implantacao } from '@/lib/academia-gestao'
import { criarDiagnostico, regenerarPin } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import { Aviso, useRun } from './ui'

/** Mostra o PIN uma única vez, com o link e uma mensagem pronta para enviar à escola. */
export function PinRevelado({ pin, escola, onFechar }: { pin: string; escola: string; onFechar: () => void }) {
  const [copiado, setCopiado] = useState('')
  const link = typeof window !== 'undefined' ? `${window.location.origin}/diagnostico` : '/diagnostico'
  const mensagem = `Olá! Segue o acesso ao Diagnóstico do Espaço Maker de ${escola}.\n\nEndereço: ${link}\nPIN: ${pin}\n\nO preenchimento é salvo automaticamente e pode ser retomado com o mesmo PIN. Tenha por perto uma trena, o celular para fotos e um vídeo curto da sala.`

  async function copiar(txt: string, quem: string) {
    try { await navigator.clipboard.writeText(txt); setCopiado(quem); setTimeout(() => setCopiado(''), 2000) } catch { /* sem permissão de área de transferência */ }
  }

  return (
    <div className="ac-pinbox" role="status">
      <p className="ac-kicker">PIN de {escola}</p>
      <p className="ac-pin-valor">{pin}</p>
      <p className="ac-hint">Anote ou copie agora. Por segurança, o sistema guarda só uma versão cifrada: depois que você fechar esta tela, o PIN não aparece de novo (é possível gerar um novo).</p>
      <div className="ac-form-a">
        <button type="button" className="ac-btn" onClick={() => copiar(pin, 'pin')}>{copiado === 'pin' ? 'Copiado' : 'Copiar PIN'}</button>
        <button type="button" className="ac-btn" onClick={() => copiar(mensagem, 'msg')}>{copiado === 'msg' ? 'Copiado' : 'Copiar mensagem para a escola'}</button>
        <button type="button" className="ac-btn is-ghost" onClick={onFechar}>Fechar</button>
      </div>
      <pre className="ac-msg">{mensagem}</pre>
    </div>
  )
}

export default function NovoDiagnosticoForm({ implantacoes }: { implantacoes: Implantacao[] }) {
  const [aberto, setAberto] = useState(false)
  const [revelado, setRevelado] = useState<{ pin: string; escola: string } | null>(null)
  const { pending, erro, run } = useRun()
  const [impl, setImpl] = useState('')

  if (revelado) return <PinRevelado {...revelado} onFechar={() => { setRevelado(null); setAberto(false) }} />
  if (!aberto) return <button type="button" className="ac-btn" onClick={() => setAberto(true)}>+ Novo diagnóstico</button>

  return (
    <form
      className="ac-form"
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const escola = impl ? implantacoes.find(i => i.id === impl)?.escola_nome ?? '' : String(fd.get('escola_nome') ?? '')
        run(async () => {
          const r = await criarDiagnostico(fd)
          if (r.ok) { setRevelado({ pin: r.pin, escola }); return { ok: true } }
          return r
        })
      }}
    >
      <h3 className="ac-form-t">Novo diagnóstico do Espaço Maker</h3>
      <div className="ac-form-g">
        <label><span>Escola do Painel Mestre</span>
          <select name="implantacao_id" value={impl} onChange={e => setImpl(e.target.value)}>
            <option value="">— outra escola —</option>
            {implantacoes.map(i => <option key={i.id} value={i.id}>{i.escola_nome}</option>)}
          </select>
        </label>
        {!impl ? <label><span>Nome da escola</span><input name="escola_nome" maxLength={160} required /></label> : null}
      </div>
      <p className="ac-hint">Ao criar, o sistema gera um PIN de 8 caracteres. A escola entra em <b>/diagnostico</b> só com esse PIN.</p>
      <Aviso erro={erro} />
      <div className="ac-form-a">
        <button className="ac-btn" disabled={pending}>{pending ? 'Criando…' : 'Criar e gerar PIN'}</button>
        <button type="button" className="ac-btn is-ghost" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </form>
  )
}

export function NovoPinBtn({ id, escola }: { id: string; escola: string }) {
  const [revelado, setRevelado] = useState<{ pin: string } | null>(null)
  const { pending, erro, run } = useRun()
  if (revelado) return <PinRevelado pin={revelado.pin} escola={escola} onFechar={() => setRevelado(null)} />
  return (
    <>
      <button
        type="button" className="ac-btn-sm" disabled={pending}
        onClick={() => { if (confirm('Gerar um novo PIN? O PIN atual deixa de funcionar.')) run(async () => { const r = await regenerarPin(id); if (r.ok) { setRevelado({ pin: r.pin }); return { ok: true } } return r }) }}
      >
        {pending ? 'Gerando…' : 'Gerar novo PIN'}
      </button>
      <Aviso erro={erro} />
    </>
  )
}
