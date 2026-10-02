'use client'

import { useState } from 'react'
import type { Implantacao } from '@/lib/academia-gestao'
import { criarDiagnostico, regenerarPin } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import { Aviso, useRun } from './ui'

/** Link de acesso da escola (/diagnostico/e/<token>) montado com o endereço atual do site. */
export const linkDaEscola = (token: string) =>
  `${typeof window !== 'undefined' ? window.location.origin : ''}/diagnostico/e/${token}`

/** Mostra o link e o PIN, com a mensagem pronta para enviar à escola. O PIN só aparece aqui. */
export function PinRevelado({ pin, token, escola, onFechar }: { pin: string; token: string; escola: string; onFechar: () => void }) {
  const [copiado, setCopiado] = useState('')
  const link = linkDaEscola(token)
  const mensagem = `Olá! Segue o acesso ao Diagnóstico do Espaço Maker de ${escola}.\n\nLink: ${link}\n\nSe o link não abrir, entre em ${link.split('/diagnostico/')[0]}/diagnostico e digite o PIN: ${pin}\n\nO preenchimento é salvo automaticamente e pode ser retomado depois pelo mesmo link. Tenha por perto uma trena, o celular para fotos e um vídeo curto da sala.`

  async function copiar(txt: string, quem: string) {
    try { await navigator.clipboard.writeText(txt); setCopiado(quem); setTimeout(() => setCopiado(''), 2000) } catch { /* sem permissão de área de transferência */ }
  }

  return (
    <div className="ac-pinbox" role="status">
      <p className="ac-kicker">Acesso de {escola}</p>
      <p className="ac-hint" style={{ margin: '0 0 .3rem' }}>Link para enviar à escola</p>
      <p className="ac-link-valor">{link}</p>
      <p className="ac-hint" style={{ margin: '.8rem 0 .2rem' }}>PIN (alternativa ao link)</p>
      <p className="ac-pin-valor">{pin}</p>
      <p className="ac-hint">O link pode ser copiado de novo a qualquer momento na página do diagnóstico. O PIN, por segurança, só aparece agora: depois é possível gerar um novo.</p>
      <div className="ac-form-a">
        <button type="button" className="ac-btn" onClick={() => copiar(link, 'link')}>{copiado === 'link' ? 'Copiado' : 'Copiar link'}</button>
        <button type="button" className="ac-btn" onClick={() => copiar(mensagem, 'msg')}>{copiado === 'msg' ? 'Copiado' : 'Copiar mensagem para a escola'}</button>
        <button type="button" className="ac-btn is-ghost" onClick={onFechar}>Fechar</button>
      </div>
      <pre className="ac-msg">{mensagem}</pre>
    </div>
  )
}

export default function NovoDiagnosticoForm({ implantacoes }: { implantacoes: Implantacao[] }) {
  const [aberto, setAberto] = useState(false)
  const [revelado, setRevelado] = useState<{ pin: string; token: string; escola: string } | null>(null)
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
          if (r.ok) { setRevelado({ pin: r.pin, token: r.token, escola }); return { ok: true } }
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
      <p className="ac-hint">Ao criar, o sistema gera um PIN de 8 caracteres e um link. A escola entra pelo link, sem digitar nada, ou pelo PIN em <b>/diagnostico</b>.</p>
      <Aviso erro={erro} />
      <div className="ac-form-a">
        <button className="ac-btn" disabled={pending}>{pending ? 'Criando…' : 'Criar e gerar PIN'}</button>
        <button type="button" className="ac-btn is-ghost" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
    </form>
  )
}

export function NovoPinBtn({ id, escola }: { id: string; escola: string }) {
  const [revelado, setRevelado] = useState<{ pin: string; token: string } | null>(null)
  const { pending, erro, run } = useRun()
  if (revelado) return <PinRevelado pin={revelado.pin} token={revelado.token} escola={escola} onFechar={() => setRevelado(null)} />
  return (
    <>
      <button
        type="button" className="ac-btn-sm" disabled={pending}
        onClick={() => { if (confirm('Gerar um novo PIN? O PIN atual deixa de funcionar.')) run(async () => { const r = await regenerarPin(id); if (r.ok) { setRevelado({ pin: r.pin, token: r.token }); return { ok: true } } return r }) }}
      >
        {pending ? 'Gerando…' : 'Gerar novo PIN'}
      </button>
      <Aviso erro={erro} />
    </>
  )
}
