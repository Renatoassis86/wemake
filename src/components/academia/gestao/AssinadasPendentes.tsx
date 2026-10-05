'use client'

import { trazerAssinadas } from '@/app/(dashboard)/academia/gestao/actions'
import { Aviso, useRun } from './ui'

export interface PendenteAssinada { id: string; nome: string; cidade_uf: string }

/** Escolas com contrato assinado no Comercial que ainda não têm linha no Painel Mestre. */
export default function AssinadasPendentes({ escolas }: { escolas: PendenteAssinada[] }) {
  const { pending, erro, msg, run } = useRun()
  if (!escolas.length) return null
  return (
    <section aria-labelledby="pend-t" className="ac-pend">
      <div className="ac-sec-linha">
        <div>
          <h3 id="pend-t" className="ac-minor" style={{ margin: 0 }}>Contrato assinado, fora do Painel</h3>
          <p className="ac-sec-lead" style={{ margin: '.3rem 0 0' }}>
            {escolas.length === 1 ? '1 escola marcada' : `${escolas.length} escolas marcadas`} como assinada no Comercial. Cidade, UF e responsável vêm do cadastro comercial.
          </p>
        </div>
        <button type="button" className="ac-btn" disabled={pending} onClick={() => run(() => trazerAssinadas())}>
          {pending ? 'Trazendo…' : 'Trazer todas para o Painel'}
        </button>
      </div>
      <ul className="ac-pend-lista">
        {escolas.map(e => (
          <li key={e.id}>
            <span>{e.nome}{e.cidade_uf ? <small> · {e.cidade_uf}</small> : null}</span>
            <button type="button" className="ac-btn-sm" disabled={pending} onClick={() => run(() => trazerAssinadas([e.id]))}>Trazer</button>
          </li>
        ))}
      </ul>
      <Aviso erro={erro} msg={msg} />
    </section>
  )
}
