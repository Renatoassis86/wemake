import Link from 'next/link'
import { MARCOS } from '@/lib/academia'
import { carregarGestao } from '@/lib/academia-data'
import { PASTAS, RITOS, WORKSPACE_NOME } from '@/lib/academia-workspace'
import SetupNotice from '@/components/academia/gestao/SetupNotice'
import { GerarTarefasPanel, NovoEventoForm } from '@/components/academia/gestao/AgendaForms'

export const dynamic = 'force-dynamic'

export default async function WorkspacePage() {
  const d = await carregarGestao()
  const ativas = d.implantacoes.filter(i => !i.arquivada)
  const total = (slug: string) => d.tarefas.filter(t => t.lista === slug).length
  const feitas = (slug: string) => d.tarefas.filter(t => t.lista === slug && t.status === 'Concluído').length
  const pronto = !d.setup && !d.erro

  return (
    <>
      <h2 className="ac-h3">Workspace</h2>
      <p className="ac-sec-lead">
        A estrutura segue o que o Manual Operacional define: cada <strong>pasta</strong> é uma macroetapa, cada <strong>lista</strong> é um
        marco do Painel Mestre e cada <strong>tarefa</strong> sai do “como executar” e dos formulários oficiais. Os prazos relativos usam
        só as regras dos documentos (por exemplo, Handoff em até 2 dias úteis após a assinatura).
      </p>

      <div className="ac-tree" aria-label="Estrutura do workspace">
        <p className="ac-tree-space"><span>Espaço</span>{WORKSPACE_NOME}</p>
        {PASTAS.map(p => (
          <section key={p.slug} className="ac-tree-folder">
            <h3><span>Pasta {p.etapa}</span>{p.nome}</h3>
            <p className="ac-tree-gate"><b>Gate:</b> {p.gate}</p>
            <ul>
              {p.listas.map(l => (
                <li key={l.slug}>
                  <div>
                    <b>{l.nome}</b>
                    <small>Marco {l.marco + 1} de 9 · {MARCOS[l.marco]} · <Link href={`/academia/${l.doc}`}>documento de referência</Link></small>
                  </div>
                  <ol>
                    {l.tarefas.map(t => (
                      <li key={t.titulo}>
                        {t.titulo}
                        {t.quando?.nota ? <em> — {t.quando.nota}</em> : null}
                      </li>
                    ))}
                  </ol>
                  {pronto ? <span className="ac-tree-n">{feitas(l.slug)}/{total(l.slug)} tarefas concluídas</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {pronto ? (
        <section className="ac-gerar-s" aria-labelledby="gerar-t">
          <h3 id="gerar-t" className="ac-h3">Gerar as tarefas de uma escola</h3>
          <p className="ac-sec-lead">
            Cria, na escola escolhida, todas as tarefas acima que ainda não existem. Os prazos são calculados pelas datas de assinatura,
            onboarding e início das aulas, que ficam no cadastro da escola.
          </p>
          <GerarTarefasPanel implantacoes={ativas} />
        </section>
      ) : <SetupNotice erro={d.erro} />}

      <section aria-labelledby="ritos-t">
        <h3 id="ritos-t" className="ac-h3">Ritos de governança</h3>
        <p className="ac-sec-lead">Da Arquitetura de Processos, seção 13. Cada rito pode virar um compromisso na agenda.</p>
        <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Ritos de governança">
          <table className="ac-table">
            <thead>
              <tr><th scope="col">Frequência</th><th scope="col">Rito</th><th scope="col">Foco</th><th scope="col">Participantes</th><th scope="col">Duração</th></tr>
            </thead>
            <tbody>
              {RITOS.map(r => (
                <tr key={r.nome}><td>{r.frequencia}</td><td>{r.nome}</td><td>{r.foco}</td><td>{r.quem}</td><td>{r.duracao}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {pronto ? (
          <div style={{ marginTop: '1rem' }}>
            <NovoEventoForm implantacoes={ativas} pessoas={d.pessoas.map(p => p.nome)} inicial={{ titulo: RITOS[0].nome, tipo: 'Rito de governança' }} />
          </div>
        ) : null}
      </section>
    </>
  )
}
