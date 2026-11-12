'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  SCHEMA, STATUS_DIAGNOSTICO, briefingVisivel, qtdAAdquirir, qtdSugerida, resumoParecer, type Recurso, type Respostas, type StatusDiagnostico,
} from '@/lib/diagnostico'
import type { AnotacaoStaff, ArquivoEquipeStaff, ArquivoStaff, DiagnosticoLinha } from '@/lib/diagnostico-staff'
import { definirNumAlunos, definirStatus, salvarParecer } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import { AcessoAtual, NovoPinBtn, RevogarAcessoBtn } from './NovoDiagnosticoForm'
import AcessoPortal from './AcessoPortal'
import TabelaCompras from './TabelaCompras'
import DiarioEquipe from './DiarioEquipe'
import ArquivosEquipe from './ArquivosEquipe'
import { Aviso, useRun } from './ui'

/** Vocabulário do status por dimensão do ambiente — diferente do parecer por item
 *  (SCHEMA.listas.parecer é "Compatível/Inadequado…", para reu-XX/con-XX). Esse é o
 *  que a legenda da tabela "Parecer técnico por dimensão" já usa nos relatórios. */
const STATUS_DIMENSAO = ['Adequado', 'Adequar', 'Requer intervenção', 'Verificar']

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '—'

const tamanho = (b: number | null) => (!b ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`)

const ehImagem = (mime: string | null) => !!mime && mime.startsWith('image/')

export default function AnaliseDiagnostico({ diagnostico, arquivos, anotacoes, arquivosEquipe, arquivosMaker }: { diagnostico: DiagnosticoLinha; arquivos: ArquivoStaff[]; anotacoes: AnotacaoStaff[]; arquivosEquipe: ArquivoEquipeStaff[]; arquivosMaker: ArquivoEquipeStaff[] }) {
  const resp = diagnostico.respostas as Respostas
  const [p, setP] = useState<Respostas>(diagnostico.parecer as Respostas)
  const [foto, setFoto] = useState<ArquivoStaff | null>(null)
  const semParecer = SCHEMA.reutilizaveis.some(i => !((diagnostico.parecer as Respostas)[i.key + '.pc'] || p[i.key + '.pc']))

  const [status, setStatus] = useState<StatusDiagnostico>(diagnostico.status)
  const [salvo, setSalvo] = useState<'ok' | 'salvando' | 'erro'>('ok')
  const sujo = useRef<Respostas>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const st = useRun()

  const descarregar = useCallback(async () => {
    const patch = sujo.current
    if (!Object.keys(patch).length) return
    sujo.current = {}
    setSalvo('salvando')
    const r = await salvarParecer(diagnostico.id, patch)
    if (r.ok) setSalvo('ok')
    else { sujo.current = { ...patch, ...sujo.current }; setSalvo('erro'); timer.current = setTimeout(descarregar, 6000) }
  }, [diagnostico.id])

  const set = (k: string, v: string) => {
    setP(a => ({ ...a, [k]: v }))
    sujo.current[k] = v
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(descarregar, 900)
  }

  const [numAlunos, setNumAlunos] = useState<string>(diagnostico.num_alunos != null ? String(diagnostico.num_alunos) : '')
  const alunosRun = useRun()
  const numAlunosNum = numAlunos.trim() ? Number(numAlunos) : null

  const resumo = useMemo(() => resumoParecer(p, numAlunosNum), [p, numAlunosNum])
  const porEvidencia = (key: string) => arquivos.filter(a => a.evidencia_key === key)
  const mudarStatus = (novo: StatusDiagnostico) => st.run(async () => { const r = await definirStatus(diagnostico.id, novo); if (r.ok) setStatus(novo); return r.ok ? { ok: true as const } : { ok: false as const, erro: r.erro ?? 'Erro' } })
  const salvarNumAlunos = () => alunosRun.run(async () => {
    const n = numAlunos.trim() ? Number(numAlunos) : null
    if (n !== null && (!Number.isFinite(n) || n < 0)) return { ok: false as const, erro: 'Número de alunos inválido.' }
    const r = await definirNumAlunos(diagnostico.id, n)
    return r.ok ? { ok: true as const } : { ok: false as const, erro: r.erro ?? 'Erro ao salvar.' }
  })

  return (
    <div className="an">
      <header className="an-cab">
        <div>
          <p className="ac-kicker">Diagnóstico do Espaço Maker</p>
          <h2 className="ac-h3" style={{ fontSize: '1.7rem', margin: 0 }}>{diagnostico.escola_nome}</h2>
          <p className="ac-hint" style={{ marginTop: '.5rem' }}>
            Criado em {dataHora(diagnostico.created_at)} · Enviado em {dataHora(diagnostico.enviado_em)} · Última atividade da escola {dataHora(diagnostico.ultima_atividade)} · PIN válido até {dataHora(diagnostico.expira_em)}
          </p>
        </div>
        <div className="an-acoes">
          <span className="ac-chip" data-s={status === 'concluido' ? 'Concluído' : status === 'enviado' ? 'Aguardando We Make' : status === 'em_analise' ? 'Em andamento' : 'Aguardando escola'}>{STATUS_DIAGNOSTICO[status]}</span>
          <div>
            {status !== 'em_analise' ? <button type="button" className="ac-btn-sm" onClick={() => mudarStatus('em_analise')}>Iniciar análise</button> : null}
            {status !== 'concluido' ? <button type="button" className="ac-btn-sm" onClick={() => mudarStatus('concluido')}>Concluir devolutiva</button> : null}
            {status !== 'aberto' ? <button type="button" className="ac-btn-sm is-ghost" onClick={() => { if (confirm('Reabrir para a escola editar?')) mudarStatus('aberto') }}>Reabrir para a escola</button> : null}
            <NovoPinBtn id={diagnostico.id} escola={diagnostico.escola_nome} />
            <RevogarAcessoBtn id={diagnostico.id} escola={diagnostico.escola_nome} />
          </div>
          <Aviso erro={st.erro} />
        </div>
      </header>

      <DiarioEquipe id={diagnostico.id} anotacoes={anotacoes} />

      <AcessoAtual id={diagnostico.id} escola={diagnostico.escola_nome} token={diagnostico.link_token} pin={diagnostico.pin_atual} />
      <AcessoPortal id={diagnostico.id} escola={diagnostico.escola_nome} emailAtual={diagnostico.portal_email} senhaAtual={diagnostico.portal_senha_atual} />

      <div className="ac-pinbox" role="status">
        <p className="ac-kicker">Nº de alunos da escola</p>
        <p className="ac-hint" style={{ margin: '0 0 .5rem' }}>
          Vem do cadastro comercial (matrícula total, não só quem usa a sala). Usado só pra sugerir a
          quantidade recomendada de cada item reutilizável/consumível — sempre ajustável item a item ali embaixo.
        </p>
        <div className="ac-form-a">
          <input
            className="ac-cell-in an-num" style={{ width: 100 }} inputMode="numeric" value={numAlunos}
            onChange={e => setNumAlunos(e.target.value.replace(/[^\d]/g, ''))} onBlur={salvarNumAlunos}
            placeholder="ex.: 180" aria-label="Número de alunos da escola"
          />
          <button type="button" className="ac-btn-sm" disabled={alunosRun.pending} onClick={salvarNumAlunos}>
            {alunosRun.pending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
        <Aviso erro={alunosRun.erro} msg={alunosRun.msg} />
      </div>

      <nav className="an-nav" aria-label="Seções">
        <a href="#an-diario">Diário</a>
        <a href="#an-ambiente">Ambiente</a><a href="#an-medidas">Medidas</a><a href="#an-evidencias">Evidências</a>
        <a href="#an-reu">Reutilizáveis</a><a href="#an-con">Consumíveis</a><a href="#an-compras">Compras</a><a href="#an-parecer">Parecer</a><a href="#an-resumo">Resumo</a>
        <span className="an-salvo" data-e={salvo}>{salvo === 'salvando' ? 'Salvando parecer…' : salvo === 'erro' ? 'Erro ao salvar. Tentando de novo.' : 'Parecer salvo'}</span>
      </nav>

      {/* ── respostas da escola ── */}
      <section id="an-ambiente" className="an-sec">
        <h3 className="ac-h3">1. O ambiente <small>respostas da escola</small></h3>
        <dl className="an-dl">
          {SCHEMA.ambiente.map(q => (
            <div key={q.key}>
              <dt>{q.pergunta}</dt>
              <dd>{resp[q.key] || <em>sem resposta</em>}{resp[q.key + '.d'] ? <span className="an-det"> · {resp[q.key + '.d']}</span> : null}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="an-medidas" className="an-sec">
        <h3 className="ac-h3">2. Medidas e briefing <small>respostas da escola</small></h3>
        {SCHEMA.medidas.some(m => resp[m.key] || resp[m.key + '.l']) ? (
        <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Medidas">
          <table className="ac-table">
            <thead><tr><th scope="col">Categoria</th><th scope="col">Informação</th><th scope="col">Resposta / medida</th><th scope="col">Anexo ou link</th><th scope="col">Arquivos enviados</th></tr></thead>
            <tbody>
              {SCHEMA.medidas.map(m => (
                <tr key={m.key}><td>{m.categoria}</td><td>{m.info}</td><td>{resp[m.key] || <em className="an-vazio">—</em>}</td><td>{resp[m.key + '.l'] || ''}</td>
                  <td>{porEvidencia(m.key).map(a => <div key={a.id}>{a.url ? <a className="ac-link" href={a.url} target="_blank" rel="noopener noreferrer">{a.nome}</a> : a.nome}</div>)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : null}
      
        {['2.2 Climatização', '2.3 Mobiliário'].map(grupo => (
          <div key={grupo}>
            <h4 className="ac-minor">{grupo}</h4>
            <dl className="an-dl">
              {SCHEMA.briefing.filter(b => b.grupo === grupo && briefingVisivel(b, resp)).map(b => (
                <div key={b.key}>
                  <dt>{b.pergunta}</dt>
                  <dd>
                    {resp[b.key] ? <span style={{ whiteSpace: 'pre-wrap' }}>{resp[b.key]}</span> : <em>sem resposta</em>}
                    {b.anexo ? porEvidencia(b.key).map(a => <div key={a.id}>{a.url ? <a className="ac-link" href={a.url} target="_blank" rel="noopener noreferrer">{a.nome}</a> : a.nome}</div>) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      <section id="an-evidencias" className="an-sec">
        <h3 className="ac-h3">3. Evidências <small>enviadas pela escola · links válidos por 1 hora</small></h3>
        <ul className="an-evid">
          {SCHEMA.evidencias.map(e => {
            const f = porEvidencia(e.key)
            return (
              <li key={e.key}>
                <b>{e.nome}</b>
                {f.length ? (
                  <div className="an-fotos">
                    {f.map(a => ehImagem(a.mime) && a.url ? (
                      <button key={a.id} type="button" className="an-foto-min" onClick={() => setFoto(a)} title={a.nome}>
                        <img src={a.url} alt={a.nome} loading="lazy" />
                      </button>
                    ) : (
                      <a key={a.id} className="an-arq-outro" href={a.url ?? undefined} target="_blank" rel="noopener noreferrer">
                        {a.nome}<small>{tamanho(a.tamanho)}</small>
                      </a>
                    ))}
                  </div>
                ) : <em className="an-vazio">nenhum arquivo enviado</em>}
                {resp[e.key + '.o'] ? <p className="an-det">Observação da escola: {resp[e.key + '.o']}</p> : null}
              </li>
            )
          })}
        </ul>
      </section>

      <Tabela id="an-reu" titulo="4. Recursos reutilizáveis" itens={SCHEMA.reutilizaveis} resp={resp} p={p} set={set} numAlunos={numAlunosNum} />
      <Tabela id="an-con" titulo="5. Recursos consumíveis" itens={SCHEMA.consumiveis} resp={resp} p={p} set={set} numAlunos={numAlunosNum} />

      {/* Onde comprar cada item — aparece na devolutiva que a escola vê em /meu-diagnostico. */}
      <TabelaCompras id={diagnostico.id} anchorId="an-compras" titulo="Onde comprar — reutilizáveis" itens={SCHEMA.reutilizaveis} inicial={diagnostico.compras} />
      <TabelaCompras id={diagnostico.id} anchorId="an-compras-con" titulo="Onde comprar — consumíveis" itens={SCHEMA.consumiveis} inicial={diagnostico.compras} />

      {/* ── parecer do ambiente ── */}
      <section id="an-parecer" className="an-sec">
        <h3 className="ac-h3">6. Parecer técnico do ambiente <small>preenchimento da We Make</small></h3>
        <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Parecer do ambiente">
          <table className="ac-table">
            <thead><tr><th scope="col">Item avaliado</th><th scope="col">Status</th><th scope="col">Observação / adequação recomendada</th></tr></thead>
            <tbody>
              {SCHEMA.parecerAmbiente.map(i => (
                <tr key={i.key}>
                  <td>{i.item}</td>
                  <td>
                    <select className="ac-cell-in" value={p[i.key + '.s'] ?? ''} onChange={e => set(i.key + '.s', e.target.value)} aria-label={`Status: ${i.item}`}>
                      <option value="">—</option>{STATUS_DIMENSAO.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                  <td><input className="ac-cell-in" value={p[i.key + '.o'] ?? ''} onChange={e => set(i.key + '.o', e.target.value)} aria-label={`Observação: ${i.item}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <label className="an-geral"><span>Encaminhamento ao estúdio de arquitetura</span>
          <textarea rows={2} value={p['geral.arquitetura'] ?? ''} onChange={e => set('geral.arquitetura', e.target.value)} />
        </label>
        <div className="an-geral" style={{ marginTop: '1rem' }}>
          <span>Arquivos da arquitetura <small>plantas, memoriais e pareceres da Gabi e de outros</small></span>
          <ArquivosEquipe id={diagnostico.id} inicial={arquivosEquipe} categoria="arquitetura" />
        </div>
        <div className="an-geral" style={{ marginTop: '1rem' }}>
          <span>Espaço Maker (Arquitetura) <small>projeto final da Gabi, por escola</small></span>
          <ArquivosEquipe id={diagnostico.id} inicial={arquivosMaker} categoria="espaco_maker" />
        </div>
      </section>

      <section id="an-resumo" className="an-sec">
        <h3 className="ac-h3">7. Resumo We Make</h3>
        <dl className="ac-kpis an-kpis">
          <div><dt>Reutilizáveis com aquisição</dt><dd>{resumo.reu.comAquisicao}<small> de {resumo.reu.cadastrados}</small></dd></div>
          <div><dt>Consumíveis com aquisição</dt><dd>{resumo.con.comAquisicao}<small> de {resumo.con.cadastrados}</small></dd></div>
          <div><dt>Custo estimado, reutilizáveis</dt><dd className="ac-kpi-m">{formatCurrency(resumo.reu.custo)}</dd></div>
          <div><dt>Custo total estimado{semParecer ? ' (preliminar: há itens sem parecer)' : ''}</dt><dd className="ac-kpi-m">{formatCurrency(resumo.total)}</dd></div>
        </dl>
        <p className="ac-hint">Quantidade a adquirir = quantidade recomendada − quantidade aproveitável. Os valores de referência são orientativos; a escola pode comprar itens equivalentes.</p>
        <div className="an-geral-g">
          {([['geral.situacao', 'Situação geral do ambiente'], ['geral.reutilizaveis', 'Recursos reutilizáveis'], ['geral.consumiveis', 'Recursos consumíveis'], ['geral.memorial', 'Memorial arquitetônico'], ['geral.obs', 'Recomendações e observações finais da We Make']] as const).map(([k, rot]) => (
            <label key={k} className="an-geral"><span>{rot}</span><textarea rows={2} value={p[k] ?? ''} onChange={e => set(k, e.target.value)} /></label>
          ))}
        </div>
      </section>

      {foto ? (
        <div className="an-lightbox" role="dialog" aria-modal="true" aria-label={foto.nome} onClick={() => setFoto(null)}>
          <button type="button" className="an-lightbox-x" onClick={() => setFoto(null)} aria-label="Fechar">✕</button>
          <img src={foto.url ?? undefined} alt={foto.nome} onClick={e => e.stopPropagation()} />
          <p className="an-lightbox-legenda" onClick={e => e.stopPropagation()}>{foto.nome}</p>
        </div>
      ) : null}
    </div>
  )
}

function Tabela({ id, titulo, itens, resp, p, set, numAlunos }: { id: string; titulo: string; itens: Recurso[]; resp: Respostas; p: Respostas; set: (k: string, v: string) => void; numAlunos: number | null }) {
  /** Não aceita mais "aproveitável" do que a escola declarou (se declarou "Não", ou
   * nem respondeu, zero — sem isso um item sem resposta nenhuma aceitava qualquer
   * quantidade digitada aqui). */
  const limitarAproveitavel = (key: string, valor: string) => {
    const n = Number(valor.replace(',', '.'))
    if (!Number.isFinite(n)) return valor
    const declarado = Number((resp[key + '.q'] ?? '').replace(',', '.'))
    const teto = !resp[key + '.p'] || resp[key + '.p'] === 'Não' ? 0 : resp[key + '.q'] && Number.isFinite(declarado) ? declarado : null
    return teto !== null && n > teto ? String(teto) : valor
  }
  return (
    <section id={id} className="an-sec">
      <h3 className="ac-h3">{titulo} <small>escola informa · We Make analisa</small></h3>
      <div className="ac-table-wrap is-wide" tabIndex={0} role="region" aria-label={titulo}>
        <table className="ac-table an-rec an-rec-itens">
          <thead>
            <tr>
              <th scope="col">Item</th><th scope="col">Recomendado</th><th scope="col">Possui?</th><th scope="col">Qtd. existente</th><th scope="col">Marca / modelo / obs.</th>
              <th scope="col">Parecer</th><th scope="col">Qtd. aproveitável</th><th scope="col">Ação</th><th scope="col">Qtd. a adquirir</th><th scope="col">Custo</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(i => {
              const adq = qtdAAdquirir(i, p, numAlunos)
              const sugerido = qtdSugerida(i, numAlunos)
              return (
                <tr key={i.key}>
                  <td><b>{i.item}</b><span className="an-spec">{i.spec}</span></td>
                  <td>
                    <input
                      className="ac-cell-in an-num" style={{ width: 64 }} inputMode="decimal"
                      value={p[i.key + '.qr'] ?? ''} placeholder={sugerido.toLocaleString('pt-BR')}
                      onChange={e => set(i.key + '.qr', e.target.value.replace(/[^\d.,]/g, ''))}
                      aria-label={`Quantidade recomendada: ${i.item}`}
                      title={p[i.key + '.qr'] ? 'Ajustado manualmente' : numAlunos ? 'Sugestão do modelo (por nº de alunos)' : 'Padrão do catálogo — informe o nº de alunos acima pra sugestão por tamanho de escola'}
                    />{' '}{i.unid}
                  </td>
                  <td>{resp[i.key + '.p'] || <em className="an-vazio">—</em>}</td>
                  <td>{resp[i.key + '.q'] || <em className="an-vazio">—</em>}</td>
                  <td>{resp[i.key + '.m'] || <em className="an-vazio">—</em>}</td>
                  <td>
                    <select className="ac-cell-in" value={p[i.key + '.pc'] ?? ''} onChange={e => set(i.key + '.pc', e.target.value)} aria-label={`Parecer: ${i.item}`}>
                      <option value="">—</option>{SCHEMA.listas.parecer.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                  <td><input className="ac-cell-in an-num" inputMode="decimal" value={p[i.key + '.qa'] ?? ''} onChange={e => set(i.key + '.qa', limitarAproveitavel(i.key, e.target.value.replace(/[^\d.,]/g, '')))} aria-label={`Quantidade aproveitável: ${i.item}`} /></td>
                  <td>
                    <select className="ac-cell-in" value={p[i.key + '.ac'] ?? ''} onChange={e => set(i.key + '.ac', e.target.value)} aria-label={`Ação: ${i.item}`}>
                      <option value="">—</option>{SCHEMA.listas.acao.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                  <td className="an-calc">{adq.toLocaleString('pt-BR')}</td>
                  <td className="an-calc">{adq ? formatCurrency(adq * i.valor) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
