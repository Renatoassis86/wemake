'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BUCKET, INCLUI_CONSUMIVEIS, SCHEMA, SEPARADOR_MULTI, andamento, briefingVisivel, valoresMulti, type Briefing, type Recurso, type Respostas, type StatusDiagnostico,
} from '@/lib/diagnostico'
import {
  confirmarUpload, enviarDiagnostico, pedirUpload, removerArquivo, salvarRespostas, type ArquivoPublico,
} from '../actions'

type Salvamento = { estado: 'ok' | 'salvando' | 'erro'; quando?: string; erro?: string }

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', pdf: 'application/pdf',
}

const tamanhoLegivel = (b: number | null) => {
  if (!b) return ''
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`
  return `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

const SECOES_TODAS = [
  { id: 'ambiente', nome: 'O ambiente' },
  { id: 'medidas', nome: 'Medidas e briefing' },
  { id: 'evidencias', nome: 'Fotos, vídeo e planta' },
  { id: 'reutilizaveis', nome: 'Recursos que a escola já tem' },
  { id: 'consumiveis', nome: 'Materiais de consumo' },
  { id: 'enviar', nome: 'Enviar' },
]
const SECOES = SECOES_TODAS.filter(s => INCLUI_CONSUMIVEIS || s.id !== 'consumiveis')

export default function DiagnosticoForm({
  escola, statusInicial, respostasIniciais, arquivosIniciais,
}: { escola: string; statusInicial: StatusDiagnostico; respostasIniciais: Respostas; arquivosIniciais: ArquivoPublico[] }) {
  const [r, setR] = useState<Respostas>(respostasIniciais)
  const [arquivos, setArquivos] = useState<ArquivoPublico[]>(arquivosIniciais)
  const [status, setStatus] = useState<StatusDiagnostico>(statusInicial)
  const [salvo, setSalvo] = useState<Salvamento>({ estado: 'ok' })
  const [ativa, setAtiva] = useState('ambiente')
  const sujo = useRef<Respostas>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const travado = status === 'em_analise' || status === 'concluido'

  /* ── Salvamento automático ─────────────────────────────────────────────── */
  const descarregar = useCallback(async () => {
    const patch = sujo.current
    if (!Object.keys(patch).length) return
    sujo.current = {}
    setSalvo(s => ({ ...s, estado: 'salvando' }))
    const res = await salvarRespostas(patch)
    if (res.ok) {
      setSalvo({ estado: 'ok', quando: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) })
    } else {
      sujo.current = { ...patch, ...sujo.current } // mantém para a próxima tentativa
      setSalvo({ estado: 'erro', erro: res.erro })
      timer.current = setTimeout(descarregar, 6000)
    }
  }, [])

  const set = useCallback((chave: string, valor: string) => {
    setR(a => ({ ...a, [chave]: valor }))
    sujo.current[chave] = valor
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(descarregar, 900)
  }, [descarregar])

  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (Object.keys(sujo.current).length) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [])

  /* ── Seção ativa no menu ───────────────────────────────────────────────── */
  useEffect(() => {
    const els = SECOES.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      es => { const v = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (v) setAtiva(v.target.id) },
      { rootMargin: '-90px 0px -65% 0px' },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const comArquivo = useMemo(() => new Set(arquivos.map(a => a.evidencia_key)), [arquivos])
  const prog = useMemo(() => andamento(r, comArquivo), [r, comArquivo])
  const totalFeito = prog.reduce((s, p) => s + p.feitos, 0)
  const totalGeral = prog.reduce((s, p) => s + p.total, 0)

  /* ── Envio de arquivos ─────────────────────────────────────────────────── */
  const [enviando, setEnviando] = useState<Record<string, number>>({})
  const [erroUpload, setErroUpload] = useState<Record<string, string>>({})

  async function enviarArquivos(evidencia: string, lista: FileList | null) {
    if (!lista?.length || travado) return
    setErroUpload(e => ({ ...e, [evidencia]: '' }))
    const supabase = createClient()
    for (const arq of Array.from(lista)) {
      const ext = arq.name.split('.').pop()?.toLowerCase() ?? ''
      const mime = arq.type || EXT_MIME[ext] || ''
      setEnviando(e => ({ ...e, [evidencia]: (e[evidencia] ?? 0) + 1 }))
      try {
        const pedido = await pedirUpload({ evidencia, mime, tamanho: arq.size })
        if (!pedido.ok) { setErroUpload(e => ({ ...e, [evidencia]: pedido.erro })); continue }
        const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(pedido.path, pedido.token, arq, { contentType: mime })
        if (error) { setErroUpload(e => ({ ...e, [evidencia]: 'O envio falhou. Verifique a conexão e tente de novo.' })); continue }
        const conf = await confirmarUpload({ path: pedido.path, evidencia, nome: arq.name, mime })
        if (!conf.ok) { setErroUpload(e => ({ ...e, [evidencia]: conf.erro })); continue }
        setArquivos(a => [...a, conf.arquivo])
      } catch {
        setErroUpload(e => ({ ...e, [evidencia]: 'O envio falhou. Verifique a conexão e tente de novo.' }))
      } finally {
        setEnviando(e => ({ ...e, [evidencia]: Math.max(0, (e[evidencia] ?? 1) - 1) }))
      }
    }
  }

  async function apagar(id: string) {
    const res = await removerArquivo(id)
    if (res.ok) setArquivos(a => a.filter(x => x.id !== id))
  }

  /* ── Envio final ───────────────────────────────────────────────────────── */
  const [enviandoFinal, setEnviandoFinal] = useState(false)
  const [erroFinal, setErroFinal] = useState('')
  async function enviarFinal() {
    setEnviandoFinal(true); setErroFinal('')
    if (timer.current) clearTimeout(timer.current)
    await descarregar()
    const res = await enviarDiagnostico()
    setEnviandoFinal(false)
    if (res.ok) { setStatus('enviado') } else setErroFinal(res.erro ?? 'Não foi possível enviar.')
  }

  /** Pergunta do briefing (2.2 e 2.3): uma escolha, várias escolhas ou resposta longa. */
  const pergunta = (b: Briefing) => (
    <div key={b.key} className="dg-q">
      <label htmlFor={b.key}>{b.pergunta}</label>
      {b.dica ? <p className="dg-dica dg-dica--campo">{b.dica}</p> : null}
      {b.tipo === 'opcao' ? (
        <div className="dg-opcoes" role="radiogroup" aria-label={b.pergunta}>
          {b.opcoes!.map(o => (
            <label key={o} className={r[b.key] === o ? 'is-on' : undefined}>
              <input type="radio" name={b.key} checked={r[b.key] === o} onChange={() => set(b.key, o)} />{o}
            </label>
          ))}
        </div>
      ) : b.tipo === 'multi' ? (
        <div className="dg-opcoes" role="group" aria-label={b.pergunta}>
          {b.opcoes!.map(o => {
            const atuais = valoresMulti(r[b.key])
            const marcado = atuais.includes(o)
            const exclusiva = o === 'Não possui'
            return (
              <label key={o} className={marcado ? 'is-on' : undefined}>
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => {
                    const base = marcado ? atuais.filter(x => x !== o) : exclusiva ? [o] : [...atuais.filter(x => x !== 'Não possui'), o]
                    set(b.key, base.join(SEPARADOR_MULTI))
                  }}
                />{o}
              </label>
            )
          })}
        </div>
      ) : (
        <textarea id={b.key} rows={4} value={r[b.key] ?? ''} onChange={e => set(b.key, e.target.value)} />
      )}
      {b.anexo ? <div className="dg-anexo-med">{anexos(b.key, false)}</div> : null}
    </div>
  )

  /** Lista de arquivos + botão de anexar, para uma evidência (evi-XX) ou para uma medida (med-XX). */
  const anexos = (key: string, comObs: boolean) => {
    const meus = arquivos.filter(a => a.evidencia_key === key)
    const n = enviando[key] ?? 0
    return (
      <>
        {meus.length ? (
          <ul className="dg-arqs">
            {meus.map(a => (
              <li key={a.id}>
                <span>{a.nome}<small>{tamanhoLegivel(a.tamanho)}</small></span>
                {!travado ? <button type="button" onClick={() => apagar(a.id)} aria-label={`Remover ${a.nome}`}>Remover</button> : null}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="dg-evid-a">
          <label className="dg-botao">
            {n ? `Enviando ${n}…` : meus.length ? 'Enviar mais arquivos' : 'Anexar arquivos'}
            <input
              type="file" multiple hidden disabled={travado || n > 0}
              accept="image/*,video/mp4,video/quicktime,video/webm,application/pdf,.heic,.heif"
              onChange={e => { enviarArquivos(key, e.target.files); e.target.value = '' }}
            />
          </label>
          {comObs ? (
            <input className="dg-obs" aria-label={`Observação: ${key}`} placeholder="Observação (opcional)" value={r[key + '.o'] ?? ''} onChange={e => set(key + '.o', e.target.value)} />
          ) : null}
        </div>
        {erroUpload[key] ? <p role="alert" className="dg-erro">{erroUpload[key]}</p> : null}
      </>
    )
  }

  return (
    <div className="dg-page">
      <nav className="dg-steps" aria-label="Seções do formulário">
        <div className="dg-steps-in">
          <ol>
            {SECOES.map((sec, i) => {
              const pr = prog[i]
              return (
                <li key={sec.id} className={ativa === sec.id ? 'is-on' : undefined}>
                  <a href={`#${sec.id}`}>
                    <span>{sec.nome}</span>
                    {pr ? <small>{pr.feitos}/{pr.total}</small> : null}
                  </a>
                </li>
              )
            })}
          </ol>
          <div className="dg-steps-r">
            <span className="dg-barra" aria-hidden="true"><i style={{ width: `${Math.round((totalFeito / totalGeral) * 100)}%` }} /></span>
            <span className="dg-prog">{totalFeito} de {totalGeral} itens</span>
            <span className="dg-salvo" role="status" aria-live="polite" data-e={salvo.estado}>
              {salvo.estado === 'salvando' ? 'Salvando…' : salvo.estado === 'erro' ? (salvo.erro ?? 'Erro ao salvar. Tentando de novo.') : salvo.quando ? `Salvo às ${salvo.quando}` : 'Salvo automaticamente'}
            </span>
          </div>
        </div>
      </nav>

      <main className="dg-main">
        {status === 'enviado' ? (
          <p className="dg-ok" role="status">
            <b>Diagnóstico enviado com sucesso.</b> Em breve nossa equipe entrará em contato para as próximas etapas. Você ainda pode corrigir ou acrescentar informações até a We Make iniciar a análise.
          </p>
        ) : null}
        {travado ? (
          <p className="dg-ok" role="status"><b>Em análise pela We Make.</b> O formulário está fechado para edição. Se precisar corrigir algo, fale com o seu contato na We Make.</p>
        ) : null}


        <fieldset disabled={travado} className="dg-fs">
          {/* ───────────── 1. Ambiente ───────────── */}
          <section id="ambiente" className="dg-sec">
            <header><span className="ac-num">1</span><div><div className="ac-kicker">Caracterização do ambiente</div><h2>O ambiente</h2></div></header>
            <div className="dg-perguntas">
              {SCHEMA.ambiente.map(q => (
                <div key={q.key} className="dg-q">
                  <label htmlFor={q.key}>{q.pergunta}</label>
                  {q.tipo === 'opcao' ? (
                    <div className="dg-opcoes" role="radiogroup" aria-label={q.pergunta}>
                      {q.opcoes!.map(o => (
                        <label key={o} className={r[q.key] === o ? 'is-on' : undefined}>
                          <input type="radio" name={q.key} checked={r[q.key] === o} onChange={() => set(q.key, o)} />{o}
                        </label>
                      ))}
                    </div>
                  ) : q.tipo === 'numero' ? (
                    <input id={q.key} inputMode="numeric" value={r[q.key] ?? ''} onChange={e => set(q.key, e.target.value.replace(/[^\d]/g, ''))} />
                  ) : (
                    <textarea id={q.key} rows={2} value={r[q.key] ?? ''} onChange={e => set(q.key, e.target.value)} />
                  )}
                  {q.detalhe ? (
                    <input className="dg-detalhe" aria-label={`Detalhes: ${q.pergunta}`} placeholder="Detalhes, se quiser acrescentar" value={r[q.key + '.d'] ?? ''} onChange={e => set(q.key + '.d', e.target.value)} />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {/* ───────────── 2. Checklist de medidas da sala e briefing ───────────── */}
          <section id="medidas" className="dg-sec">
            <header><span className="ac-num">2</span><div><div className="ac-kicker">Medidas, climatização e mobiliário</div><h2>Checklist de medidas da sala e briefing</h2></div></header>

            <h3 className="ac-minor">2.1 Levantamento das medidas do ambiente</h3>
            <p className="dg-dica">
              Com o auxílio de uma trena, faça o levantamento das medidas e dos principais elementos existentes no ambiente.
              Registre essas informações na planta baixa ou no croqui da sala, indicando:
            </p>
            <ul className="dg-lista">
              <li><b>Paredes e dimensões gerais:</b> meça o comprimento de cada parede e a altura do ambiente, do piso ao teto. Caso existam pilares, vigas, rebaixamentos, nichos ou outras interferências estruturais, indique também sua localização e suas dimensões.</li>
              <li><b>Portas:</b> informe a largura e a altura de cada porta, sua posição em relação às paredes mais próximas e o sentido de abertura.</li>
              <li><b>Janelas:</b> informe a largura e a altura de cada janela, sua posição em relação às paredes mais próximas e a altura do piso até a parte inferior da janela (peitoril).</li>
              <li><b>Climatização:</b> informe se o ambiente possui ar-condicionado, climatizador ou ventiladores. Indique no croqui onde cada equipamento está localizado e, sempre que possível, sua altura em relação ao piso.</li>
              <li><b>Tomadas e pontos elétricos:</b> identifique todas as tomadas existentes. Para cada uma, informe sua posição em relação às paredes, a altura do piso até o centro da tomada e, quando houver mais de uma tomada na mesma parede, a distância entre elas. Caso existam tomadas ou pontos elétricos específicos, como 220 V, identifique-os.</li>
              <li><b>Interruptores:</b> identifique a posição de todos os interruptores, indicando sua distância em relação à parede mais próxima e a altura em relação ao piso.</li>
            </ul>
            <aside className="dg-importante">
              <b>Importante</b>
              <p>Não é necessário elaborar uma planta técnica profissional. Caso a escola não possua a planta baixa do ambiente, poderá ser feito um croqui simples à mão, visto de cima, desde que as medidas e a posição dos elementos sejam indicadas com clareza. As informações registradas serão utilizadas pela equipe responsável para compreender as características e limitações do espaço e desenvolver o projeto arquitetônico da Sala Maker com maior precisão.</p>
            </aside>

            {['2.2 Climatização', '2.3 Mobiliário'].map(grupo => (
              <div key={grupo} className="dg-brief">
                <h3 className="ac-minor">{grupo}</h3>
                {SCHEMA.briefing.filter(b => b.grupo === grupo && briefingVisivel(b, r)).map(b => pergunta(b))}
                {grupo === '2.3 Mobiliário' ? (
                  <div className="dg-q">
                    <p className="dg-dica dg-dica--campo">Sempre que possível, envie as dimensões dos móveis, considerando:</p>
                    <ul className="dg-lista">
                      <li>largura;</li>
                      <li>profundidade;</li>
                      <li>altura;</li>
                      <li>quantidade;</li>
                      <li>características relevantes para o projeto.</li>
                    </ul>
                    <p className="dg-dica dg-dica--campo">As informações podem ser descritas no campo acima ou enviadas por links dos modelos/produtos existentes.</p>
                  </div>
                ) : null}
              </div>
            ))}
          </section>

          {/* ───────────── 3. Evidências ───────────── */}
          <section id="evidencias" className="dg-sec">
            <header><span className="ac-num">3</span><div><div className="ac-kicker">Evidências obrigatórias</div><h2>Fotos, vídeo e planta</h2></div></header>
                        {SCHEMA.evidencias.map(ev => {
              const total = arquivos.filter(x => x.evidencia_key === ev.key).length
              return (
                <div key={ev.key} className="dg-evid">
                  <div className="dg-evid-h">
                    <b>{ev.nome}</b>
                    <span className={total ? 'dg-chip is-ok' : 'dg-chip'}>{total ? `${total} ${total === 1 ? 'arquivo' : 'arquivos'}` : 'Falta enviar'}</span>
                  </div>
                  {anexos(ev.key, true)}
                </div>
              )
            })}
          </section>

          {/* ───────────── 4 e 5. Recursos ───────────── */}
          <Recursos id="reutilizaveis" numero={4} titulo="Recursos que a escola já tem" kicker="Recursos reutilizáveis" itens={SCHEMA.reutilizaveis} r={r} set={set}
            dica="Informe só se a escola possui o item, a quantidade e, quando souber, a marca ou o modelo. Você não precisa decidir se serve: a We Make analisa." />
          {INCLUI_CONSUMIVEIS ? <Recursos id="consumiveis" numero={5} titulo="Materiais de consumo" kicker="Recursos consumíveis" itens={SCHEMA.consumiveis} r={r} set={set}
            dica="Informe o que existe hoje em estoque. Os links de compra são só uma referência: itens equivalentes servem, desde que respeitem a especificação." /> : null}
        </fieldset>

        {/* ───────────── Enviar ───────────── */}
        <section id="enviar" className="dg-sec">
          <header><span className="ac-num">{INCLUI_CONSUMIVEIS ? 6 : 5}</span><div><div className="ac-kicker">Último passo</div><h2>Enviar à We Make</h2></div></header>
          <table className="dg-resumo">
            <tbody>
              {prog.map(p => (
                <tr key={p.secao}><th scope="row">{p.secao}</th><td>{p.feitos} de {p.total}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="dg-dica">Pode enviar mesmo que falte algum item: a We Make avisa se precisar de complementos. Depois de enviar, você ainda pode editar até a análise começar.</p>
          {erroFinal ? <p role="alert" className="dg-erro">{erroFinal}</p> : null}
          {status === 'enviado' ? (
            <div className="dg-sucesso" role="status">
              <span aria-hidden="true">✓</span>
              <div>
                <b>Diagnóstico enviado com sucesso.</b>
                <p>Em breve nossa equipe entrará em contato para as próximas etapas.</p>
              </div>
            </div>
          ) : null}
          <button type="button" className="dg-enviar" disabled={travado || enviandoFinal} onClick={enviarFinal}>
            {enviandoFinal ? 'Enviando…' : status === 'enviado' ? 'Enviar de novo com as alterações' : 'Enviar à We Make'}
          </button>
        </section>
      </main>
    </div>
  )
}

/* ───────────────────────────── Lista de recursos ───────────────────────────── */

function Recursos({
  id, numero, titulo, kicker, itens, r, set, dica,
}: { id: string; numero: number; titulo: string; kicker: string; itens: Recurso[]; r: Respostas; set: (k: string, v: string) => void; dica: string }) {
  const [busca, setBusca] = useState('')
  const [soFaltam, setSoFaltam] = useState(false)
  const termo = busca.trim().toLowerCase()
  const visiveis = itens.filter(i =>
    (!termo || `${i.item} ${i.spec} ${i.categoria}`.toLowerCase().includes(termo)) && (!soFaltam || !r[i.key + '.p']),
  )
  return (
    <section id={id} className="dg-sec">
      <header><span className="ac-num">{numero}</span><div><div className="ac-kicker">{kicker}</div><h2>{titulo}</h2></div></header>
      <p className="dg-dica">{dica}</p>
      <div className="dg-filtro">
        <input type="search" aria-label="Buscar item" placeholder="Buscar item…" value={busca} onChange={e => setBusca(e.target.value)} />
        <label className="dg-check"><input type="checkbox" checked={soFaltam} onChange={e => setSoFaltam(e.target.checked)} /><span>Só os que faltam responder</span></label>
        <span className="dg-cont">{visiveis.length} de {itens.length} itens</span>
      </div>
      {visiveis.map((i, k) => {
        const nova = k === 0 || visiveis[k - 1].categoria !== i.categoria
        return (
          <div key={i.key}>
            {nova ? <h3 className="ac-minor">{i.categoria}</h3> : null}
            <div className={`dg-rec${r[i.key + '.p'] ? ' is-feito' : ''}`}>
              <div className="dg-rec-i">
                <b>{i.item}</b>
              </div>
              <div className="dg-rec-c">
                <label><span>A escola possui?</span>
                  <select value={r[i.key + '.p'] ?? ''} onChange={e => set(i.key + '.p', e.target.value)}>
                    <option value="">Selecione…</option>
                    {SCHEMA.listas.possui.map(o => <option key={o}>{o}</option>)}
                  </select>
                </label>
                <label><span>Quantidade existente</span>
                  <input inputMode="decimal" value={r[i.key + '.q'] ?? ''} onChange={e => set(i.key + '.q', e.target.value.replace(/[^\d.,]/g, ''))} />
                </label>
                <label className="dg-rec-m"><span>Marca, modelo ou observação</span>
                  <input value={r[i.key + '.m'] ?? ''} onChange={e => set(i.key + '.m', e.target.value)} />
                </label>
              </div>
            </div>
          </div>
        )
      })}
      {!visiveis.length ? <p className="ac-vazio">Nenhum item com esse filtro.</p> : null}
    </section>
  )
}
