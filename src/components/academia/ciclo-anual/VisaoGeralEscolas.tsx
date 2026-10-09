export interface ResumoEscola {
  escolaId: string
  nome: string
  cidadeUf: string
  concluidos: number
  emAndamento: number
  bloqueados: number
  naoIniciados: number
  proximoPrazo: string | null
  atrasado: boolean
  momentoAtual: 'conhecer' | 'explorar' | 'criar'
}

const MOMENTO_LABEL: Record<ResumoEscola['momentoAtual'], string> = { conhecer: 'Conhecer', explorar: 'Explorar', criar: 'Criar' }

function fmtData(iso: string) {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export function VisaoGeralEscolas({ resumo, totalCards }: { resumo: ResumoEscola[]; totalCards: number }) {
  const ordenado = [...resumo].sort((a, b) => {
    if (a.atrasado !== b.atrasado) return a.atrasado ? -1 : 1
    if (a.bloqueados !== b.bloqueados) return b.bloqueados - a.bloqueados
    return a.concluidos - b.concluidos
  })

  if (!ordenado.length) {
    return <p className="ca-vg-vazio">Nenhuma escola ativa cadastrada ainda.</p>
  }

  return (
    <div className="ca-vg">
      <div className="ca-vg-resumo">
        <div><b>{ordenado.length}</b><span>escolas acompanhadas</span></div>
        <div><b>{ordenado.filter(r => r.atrasado).length}</b><span>com prazo atrasado</span></div>
        <div><b>{ordenado.filter(r => r.bloqueados > 0).length}</b><span>com cartão bloqueado</span></div>
        <div><b>{ordenado.filter(r => r.concluidos === totalCards).length}</b><span>com o ciclo completo</span></div>
      </div>

      <div className="ca-vg-table-wrap">
        <table className="ca-vg-table">
          <thead>
            <tr>
              <th scope="col">Escola</th>
              <th scope="col">Momento</th>
              <th scope="col">Progresso</th>
              <th scope="col">Em andamento</th>
              <th scope="col">Bloqueado</th>
              <th scope="col">Próximo prazo</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {ordenado.map(r => {
              const pct = totalCards ? Math.round((r.concluidos / totalCards) * 100) : 0
              return (
                <tr key={r.escolaId} className={r.atrasado ? 'is-atrasado' : undefined}>
                  <td>
                    <div className="ca-vg-escola">{r.nome}</div>
                    {r.cidadeUf ? <div className="ca-vg-cidade">{r.cidadeUf}</div> : null}
                  </td>
                  <td><span className={`ca-vg-momento mm-${r.momentoAtual}`}>{MOMENTO_LABEL[r.momentoAtual]}</span></td>
                  <td>
                    <div className="ca-vg-barra"><i style={{ width: `${pct}%` }} /></div>
                    <span className="ca-vg-pct">{r.concluidos} de {totalCards} concluídos</span>
                  </td>
                  <td className="ca-vg-num">{r.emAndamento || '—'}</td>
                  <td className="ca-vg-num">{r.bloqueados ? <span className="ca-vg-flag">{r.bloqueados}</span> : '—'}</td>
                  <td>
                    {r.proximoPrazo ? (
                      <span className={r.atrasado ? 'ca-vg-prazo is-atrasado' : 'ca-vg-prazo'}>
                        {r.atrasado ? 'Atrasado · ' : ''}{fmtData(r.proximoPrazo)}
                      </span>
                    ) : <span className="ca-vg-prazo-vazio">—</span>}
                  </td>
                  <td><a href={`/academia/ciclo-anual?escola=${r.escolaId}`} className="ca-vg-link">Ver cartões →</a></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
