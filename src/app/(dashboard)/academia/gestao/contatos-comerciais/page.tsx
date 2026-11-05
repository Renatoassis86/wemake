import { createAdminClient } from '@/lib/supabase/admin'
import { podeVerDiagnosticos } from '@/lib/diagnostico-staff'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Contatos Comerciais · Academia We Make' }

interface Linha {
  lote_id: string
  escola_nome: string
  escola_cidade: string | null
  escola_estado: string | null
  respondente_nome: string
  respondente_cargo: string | null
  pessoa_nome: string
  pessoa_area: string
  pessoa_email: string
  pessoa_telefone: string | null
  created_at: string
}

interface Lote {
  loteId: string
  escolaNome: string
  localidade: string | null
  respondenteNome: string
  respondenteCargo: string | null
  criadoEm: string
  pessoas: { nome: string; area: string; email: string; telefone: string | null }[]
}

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

export default async function ContatosComerciaisPage() {
  if (!(await podeVerDiagnosticos())) {
    return (
      <section className="ac-setup" aria-labelledby="perm-t">
        <h2 id="perm-t">Esta conta não tem acesso a esta tela</h2>
        <p>Entre com outra conta ou fale com a direção da We Make.</p>
      </section>
    )
  }

  const db = createAdminClient()
  const { data } = await db.from('academia_contatos_comerciais').select('*').order('created_at', { ascending: false })
  const linhas = (data ?? []) as Linha[]

  const lotes = new Map<string, Lote>()
  for (const l of linhas) {
    if (!lotes.has(l.lote_id)) {
      lotes.set(l.lote_id, {
        loteId: l.lote_id,
        escolaNome: l.escola_nome,
        localidade: [l.escola_cidade, l.escola_estado].filter(Boolean).join('/') || null,
        respondenteNome: l.respondente_nome,
        respondenteCargo: l.respondente_cargo,
        criadoEm: l.created_at,
        pessoas: [],
      })
    }
    lotes.get(l.lote_id)!.pessoas.push({ nome: l.pessoa_nome, area: l.pessoa_area, email: l.pessoa_email, telefone: l.pessoa_telefone })
  }
  const listaLotes = [...lotes.values()]

  return (
    <>
      <div className="ac-sec-linha">
        <div>
          <h2 className="ac-h3" style={{ margin: 0 }}>Contatos Comerciais</h2>
          <p className="ac-sec-lead" style={{ margin: '.4rem 0 0' }}>
            Pessoas que cada escola autorizou a receber o treinamento de ativação comercial e o manual de marca —
            coletadas em <code>/contatos-comerciais</code>, sem login. {listaLotes.length} envio{listaLotes.length !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {listaLotes.length ? (
        listaLotes.map(lote => (
          <div key={lote.loteId} style={{ marginBottom: '1.5rem' }}>
            <div className="ac-sec-linha" style={{ marginBottom: '.5rem' }}>
              <div>
                <strong>{lote.escolaNome}</strong>
                <div className="ac-sub-dado">
                  {[lote.localidade, `preenchido por ${lote.respondenteNome}${lote.respondenteCargo ? ` (${lote.respondenteCargo})` : ''}`, dataHora(lote.criadoEm)]
                    .filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
            <div className="ac-table-wrap" tabIndex={0} role="region" aria-label={`Contatos de ${lote.escolaNome}`}>
              <table className="ac-table">
                <thead>
                  <tr><th scope="col">Nome</th><th scope="col">Área</th><th scope="col">E-mail</th><th scope="col">Telefone</th></tr>
                </thead>
                <tbody>
                  {lote.pessoas.map((p, i) => (
                    <tr key={i}>
                      <td>{p.nome}</td>
                      <td><span className="ac-chip">{p.area}</span></td>
                      <td>{p.email}</td>
                      <td>{p.telefone ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <p className="ac-vazio">Nenhuma escola enviou contatos ainda. Mande o link de <code>/contatos-comerciais</code> pra escola, ou peça pra ela acessar pelo módulo da Academia.</p>
      )}
    </>
  )
}
