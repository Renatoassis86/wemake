import { listarParaArquitetura, podeVerDiagnosticos } from '@/lib/diagnostico-staff'
import { STATUS_DIAGNOSTICO } from '@/lib/diagnostico'
import SetupNotice from '@/components/academia/gestao/SetupNotice'
import EncaminhamentoArquitetura from '@/components/academia/gestao/EncaminhamentoArquitetura'
import DiarioEquipe from '@/components/academia/gestao/DiarioEquipe'
import ArquivosEquipe from '@/components/academia/gestao/ArquivosEquipe'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Arquitetura · Academia We Make' }

export default async function ArquiteturaPage() {
  if (!(await podeVerDiagnosticos())) {
    return (
      <section className="ac-setup" aria-labelledby="perm-t">
        <h2 id="perm-t">Esta conta não tem acesso aos diagnósticos</h2>
        <p>Entre com outra conta ou fale com a direção da We Make.</p>
      </section>
    )
  }

  const d = await listarParaArquitetura()
  if (d.setup) return <SetupNotice erro={undefined} sql="academia_diagnostico.sql" />
  if (d.erro) return <SetupNotice erro={d.erro} />

  return (
    <>
      <div className="ac-sec-linha">
        <div>
          <h2 className="ac-h3" style={{ margin: 0 }}>Arquitetura</h2>
          <p className="ac-sec-lead" style={{ margin: '.4rem 0 0' }}>
            Um lugar só para o projeto arquitetônico de cada escola: encaminhamento, diário de anotações e arquivos
            (plantas, memoriais, pareceres). Tudo aqui já aparece na análise completa de cada diagnóstico também.
          </p>
        </div>
      </div>

      {d.itens.length ? (
        <ul className="an-arq-lista-escolas">
          {d.itens.map(i => (
            <li key={i.id}>
              <details className="an-arq-card">
                <summary>
                  <span className="an-arq-card-nome">{i.escola_nome}</span>
                  {i.cidade_uf ? <span className="an-arq-card-cidade">{i.cidade_uf}</span> : null}
                  <span className="ac-chip" data-s={i.status === 'concluido' ? 'Concluído' : i.status === 'enviado' ? 'Aguardando We Make' : i.status === 'em_analise' ? 'Em andamento' : 'Aguardando escola'}>
                    {STATUS_DIAGNOSTICO[i.status]}
                  </span>
                </summary>
                <div className="an-arq-card-corpo">
                  <EncaminhamentoArquitetura id={i.id} inicial={i.encaminhamento} />

                  <h4 className="an-arq-sub">Diário de anotações <small>escola e equipe We Make</small></h4>
                  <DiarioEquipe id={i.id} anotacoes={i.anotacoes} semSecao />

                  <h4 className="an-arq-sub">Arquivos <small>plantas, memoriais e pareceres</small></h4>
                  <ArquivosEquipe id={i.id} inicial={i.arquivosEquipe} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : <p className="ac-vazio">Nenhum diagnóstico criado ainda.</p>}
    </>
  )
}
