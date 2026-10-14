'use client'

import { useState } from 'react'
import type { Implantacao } from '@/lib/academia-gestao'
import { criarDiagnostico, regenerarPin, revogarAcesso } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import { Aviso, useRun } from './ui'

/** Link de acesso da escola (/diagnostico/e/<token>) montado com o endereço atual do site. */
export const linkDaEscola = (token: string) =>
  `${typeof window !== 'undefined' ? window.location.origin : ''}/diagnostico/e/${token}`

/** Mesmo texto em todo lugar que manda a mensagem pronta pra escola. */
export const mensagemParaEscola = (escola: string, link: string, pin: string) =>
  `Olá! Segue o acesso ao Diagnóstico do Espaço Maker de ${escola}.\n\nLink: ${link}\n\nAo abrir, digite o PIN: ${pin}\n\nSe o link não abrir, entre em ${link.split('/diagnostico/')[0]}/diagnostico e digite o mesmo PIN.\n\nO preenchimento é salvo automaticamente e pode ser retomado depois com o mesmo PIN. Tenha por perto uma trena, o celular para fotos e um vídeo curto da sala.`

/** Mostra o link e o PIN, com a mensagem pronta para enviar à escola. */
export function PinRevelado({ pin, token, escola, onFechar }: { pin: string; token: string; escola: string; onFechar: () => void }) {
  const [copiado, setCopiado] = useState('')
  const link = linkDaEscola(token)
  const mensagem = mensagemParaEscola(escola, link, pin)

  async function copiar(txt: string, quem: string) {
    try { await navigator.clipboard.writeText(txt); setCopiado(quem); setTimeout(() => setCopiado(''), 2000) } catch { /* sem permissão de área de transferência */ }
  }

  return (
    <div className="ac-pinbox" role="status">
      <p className="ac-kicker">Acesso de {escola}</p>
      <p className="ac-hint" style={{ margin: '0 0 .3rem' }}>Link para enviar à escola</p>
      <p className="ac-link-valor">{link}</p>
      <p className="ac-hint" style={{ margin: '.8rem 0 .2rem' }}>PIN (sempre exigido, mesmo com o link)</p>
      <p className="ac-pin-valor">{pin}</p>
      <p className="ac-hint">Link e PIN continuam visíveis na página do diagnóstico depois de fechar esta janela — não é preciso gerar um PIN novo só pra reenviar.</p>
      <div className="ac-form-a">
        <button type="button" className="ac-btn" onClick={() => copiar(link, 'link')}>{copiado === 'link' ? 'Copiado' : 'Copiar link'}</button>
        <button type="button" className="ac-btn" onClick={() => copiar(mensagem, 'msg')}>{copiado === 'msg' ? 'Copiado' : 'Copiar mensagem para a escola'}</button>
        <button type="button" className="ac-btn is-ghost" onClick={onFechar}>Fechar</button>
      </div>
      <pre className="ac-msg">{mensagem}</pre>
    </div>
  )
}

export interface EscolaAssinada { id: string; nome: string }

/** Botão de uma linha da lista — avisa o pai (que não some da tela) quando o PIN sai. */
function BotaoGerar({ escola, onRevelado }: { escola: EscolaAssinada; onRevelado: (r: { pin: string; token: string; escola: string }) => void }) {
  const { pending, erro, run } = useRun()
  return (
    <>
      <button
        type="button"
        className="ac-btn-sm"
        disabled={pending}
        onClick={() => run(async () => {
          const fd = new FormData()
          fd.set('escola_id', escola.id)
          const r = await criarDiagnostico(fd)
          if (r.ok) { onRevelado({ pin: r.pin, token: r.token, escola: escola.nome }); return { ok: true } }
          return r
        })}
      >
        {pending ? 'Gerando…' : 'Gerar PIN e link'}
      </button>
      <Aviso erro={erro} />
    </>
  )
}

/**
 * Lista de escolas com contrato assinado e sem diagnóstico. O PIN revelado fica
 * no estado DESTE componente, não do botão da linha — assim que o diagnóstico é
 * criado, a escola sai da lista (revalidação do servidor) e aquela linha some,
 * mas a caixa com o link/PIN continua na tela porque não depende mais dela.
 * Some como modal fixo: evita o salto de layout que antes empurrava a caixa
 * para baixo da tabela, de onde ninguém conseguia copiar a tempo.
 */
export function DiagnosticosPendentes({ escolas }: { escolas: EscolaAssinada[] }) {
  const [revelado, setRevelado] = useState<{ pin: string; token: string; escola: string } | null>(null)
  if (!escolas.length) return null
  return (
    <section aria-labelledby="pend-t" className="ac-pend">
      <h3 id="pend-t" className="ac-minor">Contrato assinado, sem diagnóstico</h3>
      <p className="ac-sec-lead" style={{ margin: '0 0 .8rem' }}>Escolas marcadas como contrato assinado no Comercial. Gere o PIN e o link para cada uma.</p>
      <ul className="ac-pend-lista">
        {escolas.map(a => (
          <li key={a.id}><span>{a.nome}</span><BotaoGerar escola={a} onRevelado={setRevelado} /></li>
        ))}
      </ul>
      {revelado && (
        <div className="ac-modal-fundo" role="presentation" onClick={() => setRevelado(null)}>
          <div className="ac-modal-caixa" onClick={e => e.stopPropagation()}>
            <PinRevelado {...revelado} onFechar={() => setRevelado(null)} />
          </div>
        </div>
      )}
    </section>
  )
}

export default function NovoDiagnosticoForm({ implantacoes, assinadas = [] }: { implantacoes: Implantacao[]; assinadas?: EscolaAssinada[] }) {
  const [aberto, setAberto] = useState(false)
  const [revelado, setRevelado] = useState<{ pin: string; token: string; escola: string } | null>(null)
  const { pending, erro, run } = useRun()
  const [impl, setImpl] = useState('')

  if (revelado) {
    return (
      <div className="ac-modal-fundo" role="presentation" onClick={() => { setRevelado(null); setAberto(false) }}>
        <div className="ac-modal-caixa" onClick={e => e.stopPropagation()}>
          <PinRevelado {...revelado} onFechar={() => { setRevelado(null); setAberto(false) }} />
        </div>
      </div>
    )
  }
  if (!aberto) return <button type="button" className="ac-btn" onClick={() => setAberto(true)}>+ Novo diagnóstico</button>

  return (
    <form
      className="ac-form"
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        if (impl.startsWith('escola:')) { fd.set('escola_id', impl.slice(7)); fd.set('implantacao_id', '') }
        const escola = impl.startsWith('escola:') ? assinadas.find(a => a.id === impl.slice(7))?.nome ?? '' : impl ? implantacoes.find(i => i.id === impl)?.escola_nome ?? '' : String(fd.get('escola_nome') ?? '')
        run(async () => {
          const r = await criarDiagnostico(fd)
          if (r.ok) { setRevelado({ pin: r.pin, token: r.token, escola }); return { ok: true } }
          return r
        })
      }}
    >
      <h3 className="ac-form-t">Novo diagnóstico do Espaço Maker</h3>
      <div className="ac-form-g">
        <label><span>Escola</span>
          <select name="implantacao_id" value={impl} onChange={e => setImpl(e.target.value)}>
            <option value="">— outra escola —</option>
            {assinadas.length ? (
              <optgroup label="Contrato assinado (Comercial)">
                {assinadas.map(a => <option key={a.id} value={`escola:${a.id}`}>{a.nome}</option>)}
              </optgroup>
            ) : null}
            {implantacoes.length ? (
              <optgroup label="Painel Mestre">
                {implantacoes.map(i => <option key={i.id} value={i.id}>{i.escola_nome}</option>)}
              </optgroup>
            ) : null}
          </select>
        </label>
        {!impl ? <label><span>Nome da escola</span><input name="escola_nome" maxLength={160} required /></label> : null}
      </div>
      <p className="ac-hint">Ao criar, o sistema gera um PIN de 8 caracteres e um link. O link leva à tela de entrada; a escola sempre precisa digitar o PIN em <b>/diagnostico</b> para acessar.</p>
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
  if (revelado) {
    return (
      <div className="ac-modal-fundo" role="presentation" onClick={() => setRevelado(null)}>
        <div className="ac-modal-caixa" onClick={e => e.stopPropagation()}>
          <PinRevelado pin={revelado.pin} token={revelado.token} escola={escola} onFechar={() => setRevelado(null)} />
        </div>
      </div>
    )
  }
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

/**
 * Caixa fixa no topo da página do diagnóstico com o link, o PIN e a mensagem
 * pronta pra copiar — sempre visível, sem precisar gerar um PIN novo só pra
 * reenviar o acesso à escola. Quando não há PIN salvo ainda (diagnóstico
 * criado antes dessa mudança, ou acesso encerrado), mostra o aviso com o
 * atalho pra gerar um.
 */
export function AcessoAtual({ id, escola, token, pin }: { id: string; escola: string; token?: string; pin?: string | null }) {
  const [copiado, setCopiado] = useState('')
  async function copiar(txt: string, quem: string) {
    try { await navigator.clipboard.writeText(txt); setCopiado(quem); setTimeout(() => setCopiado(''), 2000) } catch { /* sem permissão de área de transferência */ }
  }

  if (!token || !pin) {
    return (
      <div className="ac-pinbox is-aviso" role="status">
        <p className="ac-kicker">Acesso de {escola}</p>
        <p className="ac-hint" style={{ margin: 0 }}>
          {token ? 'O acesso desta escola foi encerrado.' : 'Este diagnóstico ainda não tem PIN salvo em texto.'} Gere um PIN novo para ter o link e a mensagem prontos aqui.
        </p>
        <div className="ac-form-a" style={{ marginTop: '.6rem' }}>
          <NovoPinBtn id={id} escola={escola} />
        </div>
      </div>
    )
  }

  const link = linkDaEscola(token)
  const mensagem = mensagemParaEscola(escola, link, pin)
  return (
    <div className="ac-pinbox" role="status">
      <p className="ac-kicker">Acesso de {escola}</p>
      <p className="ac-hint" style={{ margin: '0 0 .3rem' }}>Link para enviar à escola</p>
      <p className="ac-link-valor">{link}</p>
      <p className="ac-hint" style={{ margin: '.8rem 0 .2rem' }}>PIN (sempre exigido, mesmo com o link)</p>
      <p className="ac-pin-valor">{pin}</p>
      <div className="ac-form-a">
        <button type="button" className="ac-btn" onClick={() => copiar(link, 'link')}>{copiado === 'link' ? 'Copiado' : 'Copiar link'}</button>
        <button type="button" className="ac-btn" onClick={() => copiar(mensagem, 'msg')}>{copiado === 'msg' ? 'Copiado' : 'Copiar mensagem para a escola'}</button>
      </div>
      <pre className="ac-msg">{mensagem}</pre>
    </div>
  )
}

export function RevogarAcessoBtn({ id, escola }: { id: string; escola: string }) {
  const { pending, erro, msg, run } = useRun()
  return (
    <>
      <button
        type="button" className="ac-btn-sm is-ghost" disabled={pending}
        title="O link e o PIN atuais deixam de abrir. Para reabrir, gere um novo PIN."
        onClick={() => { if (confirm(`Encerrar o acesso de ${escola}? O link e o PIN atuais deixam de funcionar.`)) run(async () => { const r = await revogarAcesso(id); return r.ok ? { ok: true as const, msg: 'Acesso encerrado.' } : { ok: false as const, erro: r.erro ?? 'Não foi possível encerrar.' } }) }}
      >
        {pending ? 'Encerrando…' : 'Encerrar acesso da escola'}
      </button>
      <Aviso erro={erro} msg={msg} />
    </>
  )
}
