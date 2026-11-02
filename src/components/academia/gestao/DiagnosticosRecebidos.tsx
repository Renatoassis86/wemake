import Link from 'next/link'
import AcessoPortalLinha from './AcessoPortalLinha'

export interface DiagnosticoRecebido {
  id: string
  escola_nome: string
  enviado_em: string | null
  portal_email?: string | null
  portal_senha_atual?: string | null
}

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '—'

/**
 * Escolas que enviaram o diagnóstico e ainda não têm devolutiva — fica no topo do
 * Painel (não só na aba Diagnósticos) porque é o próximo passo urgente: abrir a
 * análise e, se ainda não existe, gerar o login do portal da escola.
 */
export default function DiagnosticosRecebidos({ itens }: { itens: DiagnosticoRecebido[] }) {
  if (!itens.length) return null
  return (
    <section aria-labelledby="receb-t" className="ac-pend is-urgente">
      <h2 id="receb-t" className="ac-h3" style={{ margin: 0 }}>Diagnóstico recebido, aguardando análise</h2>
      <p className="ac-sec-lead" style={{ margin: '.3rem 0 .9rem' }}>
        {itens.length === 1 ? '1 escola enviou' : `${itens.length} escolas enviaram`} o diagnóstico do Espaço Maker.
        Abra a análise e gere o login do portal pra cada uma.
      </p>
      <ul className="ac-receb-lista">
        {itens.map(i => (
          <li key={i.id}>
            <div className="ac-receb-cab">
              <span className="ac-receb-nome">{i.escola_nome}</span>
              <span className="ac-receb-data">Enviado em {dataHora(i.enviado_em)}</span>
            </div>
            <div className="ac-receb-acoes">
              <Link href={`/academia/gestao/diagnosticos/${i.id}`} className="ac-btn">Abrir análise</Link>
              <AcessoPortalLinha id={i.id} emailAtual={i.portal_email ?? null} senhaAtual={i.portal_senha_atual ?? null} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
