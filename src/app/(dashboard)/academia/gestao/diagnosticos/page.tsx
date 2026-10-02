import Link from 'next/link'
import { carregarGestao } from '@/lib/academia-data'
import { fmtData } from '@/lib/academia-gestao'
import { STATUS_DIAGNOSTICO, SCHEMA } from '@/lib/diagnostico'
import { listarDiagnosticos, podeVerDiagnosticos } from '@/lib/diagnostico-staff'
import NovoDiagnosticoForm from '@/components/academia/gestao/NovoDiagnosticoForm'
import ExcluirDiagnostico from '@/components/academia/gestao/ExcluirDiagnostico'
import SetupNotice from '@/components/academia/gestao/SetupNotice'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Diagnósticos · Academia We Make' }

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '—'

export default async function DiagnosticosPage() {
  if (!(await podeVerDiagnosticos())) {
    return (
      <section className="ac-setup" aria-labelledby="perm-t">
        <h2 id="perm-t">Esta conta não tem acesso aos diagnósticos</h2>
        <p>Entre com outra conta ou fale com a direção da We Make.</p>
      </section>
    )
  }

  const [d, g] = await Promise.all([listarDiagnosticos(), carregarGestao()])
  if (d.setup) {
    return <SetupNotice erro={undefined} sql="academia_diagnostico.sql" />
  }
  if (d.erro) return <SetupNotice erro={d.erro} />

  const total = SCHEMA.ambiente.length + SCHEMA.medidas.length + SCHEMA.reutilizaveis.length + SCHEMA.consumiveis.length
  const feitos = (r: Record<string, string>) =>
    SCHEMA.ambiente.filter(a => r[a.key]).length +
    SCHEMA.medidas.filter(m => r[m.key]).length +
    [...SCHEMA.reutilizaveis, ...SCHEMA.consumiveis].filter(i => r[i.key + '.p']).length

  return (
    <>
      <div className="ac-sec-linha">
        <div>
          <h2 className="ac-h3" style={{ margin: 0 }}>Diagnóstico do Espaço Maker</h2>
          <p className="ac-sec-lead" style={{ margin: '.4rem 0 0' }}>
            A escola responde numa página externa, protegida por PIN. As respostas, os arquivos e o parecer ficam aqui.
          </p>
        </div>
        <NovoDiagnosticoForm implantacoes={g.implantacoes.filter(i => !i.arquivada)} />
      </div>

      {d.itens.length ? (
        <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Diagnósticos">
          <table className="ac-table">
            <thead>
              <tr><th scope="col">Escola</th><th scope="col">Situação</th><th scope="col">Respondido</th><th scope="col">Enviado em</th><th scope="col">Última atividade</th><th scope="col">PIN vale até</th><th scope="col"><span className="sr-only">Ações</span></th></tr>
            </thead>
            <tbody>
              {d.itens.map(i => (
                <tr key={i.id}>
                  <td>{i.escola_nome}</td>
                  <td><span className="ac-chip" data-s={i.status === 'concluido' ? 'Concluído' : i.status === 'enviado' ? 'Aguardando We Make' : i.status === 'em_analise' ? 'Em andamento' : 'Aguardando escola'}>{STATUS_DIAGNOSTICO[i.status]}</span></td>
                  <td>{feitos(i.respostas)} de {total}</td>
                  <td>{dataHora(i.enviado_em)}</td>
                  <td>{dataHora(i.ultima_atividade)}</td>
                  <td>{fmtData(i.expira_em)}</td>
                  <td><Link href={`/academia/gestao/diagnosticos/${i.id}`} className="ac-btn-sm">Abrir</Link><ExcluirDiagnostico id={i.id} escola={i.escola_nome} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="ac-vazio">Nenhum diagnóstico criado ainda. Crie o primeiro e envie o PIN à escola.</p>}

      <p className="ac-nota">
        “Respondido” conta as perguntas do ambiente, das medidas e dos recursos; as fotos, o vídeo e a planta aparecem na página de cada escola.
        Procedimento completo: <Link href="/academia/procedimento-diagnostico">Procedimento Oficial de Diagnóstico</Link>.
      </p>
    </>
  )
}
