import Link from 'next/link'
import { MARCOS } from '@/lib/academia'
import { carregarGestao } from '@/lib/academia-data'
import { fmtData, marcoAtual, percentual, prazoVencido, resumo, RISCO_AJUDA, STATUS, STATUS_AJUDA } from '@/lib/academia-gestao'
import ImplantacaoGrid from '@/components/academia/gestao/ImplantacaoGrid'
import NovaEscolaForm from '@/components/academia/gestao/NovaEscolaForm'
import SetupNotice from '@/components/academia/gestao/SetupNotice'
import { Chip } from '@/components/academia/gestao/ui'

export const dynamic = 'force-dynamic'

export default async function PainelPage() {
  const d = await carregarGestao({ escolas: true })
  if (d.setup || d.erro) return <SetupNotice erro={d.erro} />

  const ativas = d.implantacoes.filter(i => !i.arquivada)
  const r = resumo(d.implantacoes)
  const pessoas = d.pessoas.map(p => p.nome)

  return (
    <>
      <section aria-label="Indicadores">
        <dl className="ac-kpis">
          <div><dt>Escolas no painel</dt><dd>{r.escolas}</dd></div>
          <div><dt>Go-Live concluído</dt><dd>{r.goLive}</dd></div>
          <div className={r.riscoAlto ? 'is-alerta' : undefined}><dt>Com risco alto ou crítico</dt><dd>{r.riscoAlto}</dd></div>
          <div className={r.vencidos ? 'is-alerta' : undefined}><dt>Prazos vencidos</dt><dd>{r.vencidos}</dd></div>
        </dl>
      </section>

      <div className="ac-cols">
        <section aria-labelledby="etapas-t">
          <h2 id="etapas-t" className="ac-h3">Avanço por etapa</h2>
          <table className="ac-mini">
            <thead><tr><th scope="col">Etapa</th><th scope="col">Concluídas</th><th scope="col">Total</th><th scope="col">% concluído</th></tr></thead>
            <tbody>
              {r.porEtapa.map(e => (
                <tr key={e.nome}>
                  <th scope="row">{e.nome}</th>
                  <td>{e.concluidas}</td>
                  <td>{e.total}</td>
                  <td><span className="ac-bar"><i style={{ width: `${Math.round(e.pct * 100)}%` }} /></span> {Math.round(e.pct * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="risco-t">
          <h2 id="risco-t" className="ac-h3">Risco</h2>
          <table className="ac-mini">
            <thead><tr><th scope="col">Risco</th><th scope="col">Escolas</th><th scope="col">%</th></tr></thead>
            <tbody>
              {r.porRisco.map(x => (
                <tr key={x.risco} title={RISCO_AJUDA[x.risco]}>
                  <th scope="row"><span className="ac-risco-dot" data-r={x.risco} />{x.risco}</th>
                  <td>{x.escolas}</td>
                  <td>{Math.round(x.pct * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <details className="ac-leg">
            <summary>O que significa cada status</summary>
            <ul>
              {STATUS.map(s => <li key={s}><Chip s={s} /> {STATUS_AJUDA[s]}</li>)}
            </ul>
          </details>
        </section>
      </div>

      <section aria-labelledby="atencao-t">
        <h2 id="atencao-t" className="ac-h3">Escolas que exigem atenção</h2>
        {r.atencao.length ? (
          <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Escolas que exigem atenção">
            <table className="ac-table is-wide-t">
              <thead>
                <tr>
                  <th scope="col">Escola</th><th scope="col">Próxima ação</th><th scope="col">Responsável</th><th scope="col">Prazo</th>
                  <th scope="col">Risco</th><th scope="col">%</th><th scope="col">Motivo / bloqueio</th><th scope="col">Status Go-Live</th>
                </tr>
              </thead>
              <tbody>
                {r.atencao.map(i => (
                  <tr key={i.id}>
                    <td>{i.escola_nome}</td>
                    <td>{i.proxima_acao}</td>
                    <td>{i.responsavel_acao}</td>
                    <td className={prazoVencido(i) ? 'is-vencido' : undefined}>{fmtData(i.prazo)}</td>
                    <td><Chip s={i.risco} /></td>
                    <td>{Math.round(percentual(i) * 100)}%</td>
                    <td>{i.motivo_bloqueio}</td>
                    <td><Chip s={i.marcos?.['Go-Live'] ?? 'Não iniciado'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="ac-vazio">Nenhuma escola com risco alto, bloqueio ou prazo vencido.</p>
        )}
        <p className="ac-nota">
          Entra aqui a escola com risco Alto ou Crítico, qualquer etapa Bloqueada ou prazo vencido. Marco atual de cada escola:{' '}
          {ativas.length ? ativas.map(i => `${i.escola_nome} (${marcoAtual(i) ?? 'implantação encerrada'})`).join(' · ') : 'sem escolas ainda'}.
        </p>
      </section>

      <section aria-labelledby="impl-t">
        <div className="ac-sec-linha">
          <h2 id="impl-t" className="ac-h3">Implantação: uma linha por escola</h2>
          <NovaEscolaForm escolas={d.escolas} pessoas={pessoas} />
        </div>
        <ImplantacaoGrid itens={ativas} pessoas={pessoas} />
        <p className="ac-nota">
          Regras do painel: atualize a linha a cada avanço; registre sempre a próxima ação, o responsável e o prazo; use
          “Bloqueado” só quando a escola não puder avançar; risco Alto ou Crítico exige motivo e uma ação concreta. Os
          documentos guardam o detalhe de cada etapa:{' '}
          <Link href="/academia/painel-mestre">leia o guia de uso do Painel Mestre</Link>. Etapas: {MARCOS.join(' → ')}.
        </p>
      </section>
    </>
  )
}
