'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  INCLUI_CONSUMIVEIS, SCHEMA, STATUS_DIAGNOSTICO, briefingVisivel, qtdAAdquirir, resumoParecer, type Recurso, type Respostas, type StatusDiagnostico,
} from '@/lib/diagnostico'
import type { ArquivoStaff, DiagnosticoLinha } from '@/lib/diagnostico-staff'
import { definirStatus, salvarParecer } from '@/app/(dashboard)/academia/gestao/diagnosticos/actions'
import { NovoPinBtn, RevogarAcessoBtn, linkDaEscola } from './NovoDiagnosticoForm'
import { Aviso, useRun } from './ui'

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '—'

const tamanho = (b: number | null) => (!b ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1).replace('.', ',')} MB`)

export default function AnaliseDiagnostico({ diagnostico, arquivos }: { diagnostico: DiagnosticoLinha; arquivos: ArquivoStaff[] }) {
  const resp = diagnostico.respostas as Respostas
  const [p, setP] = useState<Respostas>(diagnostico.parecer as Respostas)
  const semParecer = SCHEMA.reutilizaveis.some(i => !((diagnostico.parecer as Respostas)[i.key + '.pc'] || p[i.key + '.pc']))

  const [status, setStatus] = useState<StatusDiagnostico>(diagnostico.status)
  const [salvo, setSalvo] = useState<'ok' | 'salvando' | 'erro'>('ok')
  const sujo = useRef<Respostas>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const st = useRun()
  const [linkCopiado, setLinkCopiado] = useState(false)

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

  const resumo = useMemo(() => resumoParecer(p), [p])
  const porEvidencia = (key: string) => arquivos.filter(a => a.evidencia_key === key)
  const mudarStatus = (novo: StatusDiagnostico) => st.run(async () => { const r = await definirStatus(diagnostico.id, novo); if (r.ok) setStatus(novo); return r.ok ? { ok: true as const } : { ok: false as const, erro: r.erro ?? 'Erro' } })

  return (
    <div className="an">
      <header className="an-cab">
        <div>
          <p className="ac-kicker">Diagnóstico do Espaço Maker</p>
          <h2 className="ac-h3" style={{ fontSize: '1.7rem', margin: 0 }}>{diagnostico.escola_nome}</h2>
          {diagnostico.link_token ? (
            <p className="an-link">
              <span>Link da escola</span>
              <code>{linkDaEscola(diagnostico.link_token)}</code>
              <button type="button" className="ac-btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(linkDaEscola(diagnostico.link_token as string)); setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2000) } catch { /* sem permissão */ } }}>{linkCopiado ? 'Copiado' : 'Copiar link'}</button>
            </p>
          ) : null}
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

      <nav className="an-nav" aria-label="Seções">
        <a href="#an-ambiente">Ambiente</a><a href="#an-medidas">Medidas</a><a href="#an-evidencias">Evidências</a>
        <a href="#an-reu">Reutilizáveis</a>{INCLUI_CONSUMIVEIS ? <a href="#an-con">Consumíveis</a> : null}<a href="#an-parecer">Parecer</a><a href="#an-resumo">Resumo</a>
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
                  <ul>{f.map(a => (
                    <li key={a.id}>
                      {a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer">{a.nome}</a> : a.nome}
                      <small>{tamanho(a.tamanho)}</small>
                    </li>
                  ))}</ul>
                ) : <em className="an-vazio">nenhum arquivo enviado</em>}
                {resp[e.key + '.o'] ? <p className="an-det">Observação da escola: {resp[e.key + '.o']}</p> : null}
              </li>
            )
          })}
        </ul>
      </section>

      <Tabela id="an-reu" titulo="4. Recursos reutilizáveis" itens={SCHEMA.reutilizaveis} resp={resp} p={p} set={set} />
      {INCLUI_CONSUMIVEIS ? <Tabela id="an-con" titulo="5. Recursos consumíveis" itens={SCHEMA.consumiveis} resp={resp} p={p} set={set} /> : null}

      {/* ── parecer do ambiente ── */}
      <section id="an-parecer" className="an-sec">
        <h3 className="ac-h3">{INCLUI_CONSUMIVEIS ? 6 : 5}. Parecer técnico do ambiente <small>preenchimento da We Make</small></h3>
        <div className="ac-table-wrap" tabIndex={0} role="region" aria-label="Parecer do ambiente">
          <table className="ac-table">
            <thead><tr><th scope="col">Item avaliado</th><th scope="col">Status</th><th scope="col">Observação / adequação recomendada</th></tr></thead>
            <tbody>
              {SCHEMA.parecerAmbiente.map(i => (
                <tr key={i.key}>
                  <td>{i.item}</td>
                  <td>
                    <select className="ac-cell-in" value={p[i.key + '.s'] ?? ''} onChange={e => set(i.key + '.s', e.target.value)} aria-label={`Status: ${i.item}`}>
                      <option value="">—</option>{SCHEMA.listas.parecer.map(o => <option key={o}>{o}</option>)}
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
      </section>

      <section id="an-resumo" className="an-sec">
        <h3 className="ac-h3">{INCLUI_CONSUMIVEIS ? 7 : 6}. Resumo We Make</h3>
        <dl className="ac-kpis an-kpis">
          <div><dt>Reutilizáveis com aquisição</dt><dd>{resumo.reu.comAquisicao}<small> de {resumo.reu.cadastrados}</small></dd></div>
          {INCLUI_CONSUMIVEIS ? <div><dt>Consumíveis com aquisição</dt><dd>{resumo.con.comAquisicao}<small> de {resumo.con.cadastrados}</small></dd></div> : null}
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
    </div>
  )
}

function Tabela({ id, titulo, itens, resp, p, set }: { id: string; titulo: string; itens: Recurso[]; resp: Respostas; p: Respostas; set: (k: string, v: string) => void }) {
  /** Não aceita mais "aproveitável" do que a escola declarou (se declarou "Não", zero). */
  const limitarAproveitavel = (key: string, valor: string) => {
    const n = Number(valor.replace(',', '.'))
    if (!Number.isFinite(n)) return valor
    const declarado = Number((resp[key + '.q'] ?? '').replace(',', '.'))
    const teto = resp[key + '.p'] === 'Não' ? 0 : resp[key + '.q'] && Number.isFinite(declarado) ? declarado : null
    return teto !== null && n > teto ? String(teto) : valor
  }
  return (
    <section id={id} className="an-sec">
      <h3 className="ac-h3">{titulo} <small>escola informa · We Make analisa</small></h3>
      <div className="ac-table-wrap is-wide" tabIndex={0} role="region" aria-label={titulo}>
        <table className="ac-table an-rec">
          <thead>
            <tr>
              <th scope="col">Item</th><th scope="col">Recomendado</th><th scope="col">Possui?</th><th scope="col">Qtd. existente</th><th scope="col">Marca / modelo / obs.</th>
              <th scope="col">Parecer</th><th scope="col">Qtd. aproveitável</th><th scope="col">Ação</th><th scope="col">Qtd. a adquirir</th><th scope="col">Custo</th>
            </tr>
          </thead>
          <tbody>
            {itens.map(i => {
              const adq = qtdAAdquirir(i, p)
              return (
                <tr key={i.key}>
                  <td><b>{i.item}</b><span className="an-spec">{i.spec}</span></td>
                  <td>{i.qtd.toLocaleString('pt-BR')} {i.qtd > 1 && i.unid && !/s$/i.test(i.unid) ? i.unid + 's' : i.unid}</td>
                  <td>{resp[i.key + '.p'] || <em className="an-vazio">—</em>}</td>
                  <td>{resp[i.key + '.q'] || ''}</td>
                  <td>{resp[i.key + '.m'] || ''}</td>
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
