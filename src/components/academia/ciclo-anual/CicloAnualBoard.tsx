'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  criarCartao, atualizarCartao, excluirCartao, salvarStatusCartao,
  STATUS_TAGS, STATUS_EXECUCAO, type Momento, type StatusTag, type StatusExecucao,
} from '@/app/(dashboard)/academia/ciclo-anual/actions'

export interface CronogramaCard {
  id: string
  momento: Momento
  ordem: number
  titulo: string
  data_label: string
  status_tag: StatusTag
  descricao: string
  fonte: string | null
  marco: string | null
  /** status de execução que vale pra toda escola sem exceção própria registrada */
  status_padrao: StatusExecucao
}

/** escola_nome[] agrupado por status, por marco — ex.: kanbanData['Handoff']['Concluído'] = ['Colégio X', ...] */
export type KanbanData = Record<string, Record<string, string[]>>

/** status de execução da escola selecionada, por cartão */
export type StatusPorCard = Record<string, { status: string; prazo_data: string | null; anotacoes: string }>

const MOMENTOS: { slug: Momento; nome: string }[] = [
  { slug: 'conhecer', nome: 'Conhecer — Implantação' },
  { slug: 'explorar', nome: 'Explorar — Formação ao longo do ano' },
  { slug: 'criar', nome: 'Criar — Diagnóstico e fechamento de ciclo' },
]

const STATUS_ORDEM = ['Não iniciado', 'Em andamento', 'Aguardando escola', 'Aguardando We Make', 'Bloqueado', 'Concluído']
const TAG_LABEL: Record<StatusTag, string> = { dado: 'Dado', sugerido: 'Sugerido', decidido: 'Decidido' }
const EXEC_CURTO: Record<StatusExecucao, string> = {
  'Não iniciado': 'Não iniciado', 'Em andamento': 'Em andamento', 'Aguardando escola': 'Aguard. escola',
  'Aguardando We Make': 'Aguard. We Make', 'Concluído': 'Concluído', 'Bloqueado': 'Bloqueado',
}

function reduzMovimento() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function CicloAnualBoard({ cards, kanbanData, marcos, escolaId, escolaNome, statusPorCard, proximoVencerId }: {
  cards: CronogramaCard[]; kanbanData: KanbanData; marcos: string[]
  escolaId: string; escolaNome: string; statusPorCard: StatusPorCard; proximoVencerId: string | null
}) {
  const porMomento = useMemo(() => {
    const m: Record<Momento, CronogramaCard[]> = { conhecer: [], explorar: [], criar: [] }
    for (const c of cards) m[c.momento].push(c)
    return m
  }, [cards])

  const [formAberto, setFormAberto] = useState<{ momento: Momento; cartao?: CronogramaCard } | null>(null)
  const [cartaoAberto, setCartaoAberto] = useState<CronogramaCard | null>(null)
  const origensRef = useRef(new Map<string, HTMLButtonElement>())

  return (
    <>
      <div className="ca-escola-head">
        <h2>{escolaNome}</h2>
        <p>Clique num cartão para registrar o status, o prazo e anotações desta escola.</p>
      </div>

      {MOMENTOS.map(m => (
        <section className="ca-momento" data-m={m.slug} key={m.slug}>
          <div className="ca-momento-head">
            <span className="ca-dot" aria-hidden="true" />
            <h2>{m.nome}</h2>
            <span className="ca-count">{porMomento[m.slug].length} cartão{porMomento[m.slug].length === 1 ? '' : 'ões'}</span>
          </div>

          <div className="ca-grid">
            {porMomento[m.slug].map(c => {
              const exec = statusPorCard[c.id]?.status || 'Não iniciado'
              const ehProximo = c.id === proximoVencerId
              return (
                <button
                  key={c.id}
                  ref={el => { if (el) origensRef.current.set(c.id, el); else origensRef.current.delete(c.id) }}
                  type="button"
                  data-exec={exec}
                  className={`ca-card${cartaoAberto?.id === c.id ? ' ca-ghost' : ''}${ehProximo ? ' ca-proximo' : ''}`}
                  onClick={() => setCartaoAberto(c)}
                >
                  {ehProximo ? <span className="ca-proximo-flag">Próximo prazo</span> : null}
                  <div className="ca-card-top">
                    <span className="ca-date">{c.data_label || '—'}</span>
                    <span className="ca-card-actions">
                      <span
                        role="button" tabIndex={0} className="ca-icon-btn" title="Editar o cartão"
                        onClick={e => { e.stopPropagation(); setFormAberto({ momento: m.slug, cartao: c }) }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setFormAberto({ momento: m.slug, cartao: c }) } }}
                      >✎</span>
                      <span
                        role="button" tabIndex={0} className="ca-icon-btn" title="Excluir o cartão"
                        onClick={e => { e.stopPropagation(); if (confirm(`Excluir o cartão "${c.titulo}"?`)) excluirCartao(c.id) }}
                        onKeyDown={e => { if (e.key === 'Enter') e.stopPropagation() }}
                      >🗑</span>
                    </span>
                  </div>
                  <h3>{c.titulo}</h3>
                  <div className="ca-card-foot">
                    <span className="ca-tag-exec">{EXEC_CURTO[exec as StatusExecucao] ?? exec}</span>
                    {c.marco ? <span className="ca-tag marco">{c.marco}</span> : null}
                  </div>
                </button>
              )
            })}

            {formAberto?.momento === m.slug && !formAberto.cartao ? (
              <CartaoForm momento={m.slug} marcos={marcos} onFechar={() => setFormAberto(null)} />
            ) : (
              <button type="button" className="ca-novo" onClick={() => setFormAberto({ momento: m.slug })}>+ Novo cartão</button>
            )}
          </div>
        </section>
      ))}

      {formAberto?.cartao ? (
        <EditarOverlay cartao={formAberto.cartao} marcos={marcos} onFechar={() => setFormAberto(null)} />
      ) : null}

      {cartaoAberto ? (
        <FlipOverlay
          cartao={cartaoAberto}
          origem={origensRef.current.get(cartaoAberto.id) ?? null}
          kanban={cartaoAberto.marco ? kanbanData[cartaoAberto.marco] : null}
          escolaId={escolaId}
          statusAtual={statusPorCard[cartaoAberto.id] ?? null}
          ehProximo={cartaoAberto.id === proximoVencerId}
          onFechar={() => setCartaoAberto(null)}
        />
      ) : null}
    </>
  )
}

/* ─────────────────────────── Formulário de novo cartão ─────────────────────────── */

function CartaoForm({ momento, marcos, onFechar }: { momento: Momento; marcos: string[]; onFechar: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function salvar(fd: FormData) {
    fd.set('momento', momento)
    startTransition(async () => {
      const res = await criarCartao(fd)
      if (res.ok) { router.refresh(); onFechar() } else { alert(res.erro) }
    })
  }

  return (
    <form className="ca-form" action={salvar}>
      <div><label htmlFor="novo-titulo">Título</label><input id="novo-titulo" name="titulo" required maxLength={200} /></div>
      <div className="ca-form-row">
        <div><label htmlFor="novo-data">Data / janela</label><input id="novo-data" name="data_label" placeholder="ex.: 13–16 out" /></div>
        <div><label htmlFor="novo-tag">Status</label>
          <select id="novo-tag" name="status_tag" defaultValue="sugerido">
            {STATUS_TAGS.map(s => <option key={s} value={s}>{TAG_LABEL[s]}</option>)}
          </select>
        </div>
      </div>
      <div><label htmlFor="novo-desc">Descrição</label><textarea id="novo-desc" name="descricao" maxLength={2000} /></div>
      <div><label htmlFor="novo-fonte">Fonte (opcional)</label><input id="novo-fonte" name="fonte" maxLength={300} /></div>
      <div><label htmlFor="novo-marco">Marco do Painel Mestre (opcional — liga o kanban)</label>
        <select id="novo-marco" name="marco" defaultValue="">
          <option value="">— nenhum —</option>
          {marcos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="ca-form-actions">
        <button type="submit" className="ca-btn primario" disabled={pending}>{pending ? 'Salvando…' : 'Adicionar cartão'}</button>
        <button type="button" className="ca-btn secundario" onClick={onFechar}>Cancelar</button>
      </div>
    </form>
  )
}

function EditarOverlay({ cartao, marcos, onFechar }: { cartao: CronogramaCard; marcos: string[]; onFechar: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function salvar(fd: FormData) {
    const patch = {
      titulo: fd.get('titulo'), data_label: fd.get('data_label'), status_tag: fd.get('status_tag'),
      descricao: fd.get('descricao'), fonte: fd.get('fonte'), marco: fd.get('marco'), status_padrao: fd.get('status_padrao'),
    }
    startTransition(async () => {
      const res = await atualizarCartao(cartao.id, patch)
      if (res.ok) { router.refresh(); onFechar() } else { alert(res.erro) }
    })
  }

  return createPortal(
    <div className="ca-flip-fundo" onClick={onFechar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(480px, 92vw)' }}>
        <form className="ca-form" action={salvar} style={{ boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}>
          <div><label htmlFor="ed-titulo">Título</label><input id="ed-titulo" name="titulo" required maxLength={200} defaultValue={cartao.titulo} /></div>
          <div className="ca-form-row">
            <div><label htmlFor="ed-data">Data / janela</label><input id="ed-data" name="data_label" defaultValue={cartao.data_label} /></div>
            <div><label htmlFor="ed-tag">Status do dado</label>
              <select id="ed-tag" name="status_tag" defaultValue={cartao.status_tag}>
                {STATUS_TAGS.map(s => <option key={s} value={s}>{TAG_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
          <div><label htmlFor="ed-desc">Descrição</label><textarea id="ed-desc" name="descricao" maxLength={2000} defaultValue={cartao.descricao} /></div>
          <div><label htmlFor="ed-fonte">Fonte</label><input id="ed-fonte" name="fonte" maxLength={300} defaultValue={cartao.fonte ?? ''} /></div>
          <div><label htmlFor="ed-marco">Marco do Painel Mestre</label>
            <select id="ed-marco" name="marco" defaultValue={cartao.marco ?? ''}>
              <option value="">— nenhum —</option>
              {marcos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="ca-form-divisor">
            <label htmlFor="ed-padrao">Status padrão — vale pra <b>todas as escolas</b></label>
            <select id="ed-padrao" name="status_padrao" defaultValue={cartao.status_padrao}>
              {STATUS_EXECUCAO.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="ca-form-ajuda">Muda o status de quem ainda não tem exceção própria registrada — inclusive escolas que você ainda vai cadastrar. Use para marcar algo feito de uma vez para todo mundo, como "contratos enviados". Para ajustar só uma escola, abra o cartão por ela e mude o status no verso.</p>
          </div>
          <div className="ca-form-actions">
            <button type="submit" className="ca-btn primario" disabled={pending}>{pending ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" className="ca-btn secundario" onClick={onFechar}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

/* ─────────────────────── Overlay: cartão voa e gira ─────────────────────── */

function alvoCentral() {
  const vw = window.innerWidth, vh = window.innerHeight
  const w = Math.min(680, vw - 24), h = Math.min(Math.round(vh * 0.85), 760)
  return { left: Math.round((vw - w) / 2), top: Math.round((vh - h) / 2), width: w, height: h }
}

function FlipOverlay({ cartao, origem, kanban, escolaId, statusAtual, ehProximo, onFechar }: {
  cartao: CronogramaCard; origem: HTMLElement | null; kanban: Record<string, string[]> | null
  escolaId: string; statusAtual: { status: string; prazo_data: string | null; anotacoes: string } | null
  ehProximo: boolean; onFechar: () => void
}) {
  const cenaRef = useRef<HTMLDivElement>(null)
  const cartaoRef = useRef<HTMLDivElement>(null)
  const [revelado, setRevelado] = useState(false)
  const [fechando, setFechando] = useState(false)
  const origemRectRef = useRef(origem?.getBoundingClientRect() ?? null)
  const router = useRouter()

  const [status, setStatus] = useState(statusAtual?.status || 'Não iniciado')
  const [prazo, setPrazo] = useState(statusAtual?.prazo_data ?? '')
  const [anotacoes, setAnotacoes] = useState(statusAtual?.anotacoes ?? '')
  const [salvandoStatus, startStatusTransition] = useTransition()
  const [salvandoNotas, startNotasTransition] = useTransition()

  function salvarStatus(novoStatus: string, novoPrazo: string) {
    startStatusTransition(async () => {
      const res = await salvarStatusCartao(cartao.id, escolaId, { status: novoStatus, prazo_data: novoPrazo || null })
      if (res.ok) router.refresh()
      else alert(res.erro)
    })
  }

  function salvarNotas() {
    startNotasTransition(async () => {
      const res = await salvarStatusCartao(cartao.id, escolaId, { anotacoes })
      if (!res.ok) alert(res.erro)
    })
  }

  // Técnica FLIP: o "cena" já nasce no tamanho e posição finais (um único
  // layout, sem custo); só a transform anima — translate+scale compositados
  // pela GPU, sem recalcular left/top/width/height a cada frame. Animar
  // left/top/width/height direto (como a v1 fazia) força layout síncrono em
  // todo frame e, combinado com a rotação 3D ao mesmo tempo, podia travar a
  // aba em máquinas mais fracas.
  function abrir(cena: HTMLDivElement, cartaoEl: HTMLDivElement) {
    const r = origemRectRef.current
    const reduz = reduzMovimento()
    const alvo = alvoCentral()
    Object.assign(cena.style, { left: alvo.left + 'px', top: alvo.top + 'px', width: alvo.width + 'px', height: alvo.height + 'px' })

    if (!r || reduz || !cena.animate) {
      cartaoEl.style.transform = 'rotateY(180deg)'
      setRevelado(true)
      return
    }
    const dur = 850
    const dx = (r.left + r.width / 2) - (alvo.left + alvo.width / 2)
    const dy = (r.top + r.height / 2) - (alvo.top + alvo.height / 2)
    const sx = r.width / alvo.width, sy = r.height / alvo.height
    cena.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      { transform: 'translate(0, 0) scale(1, 1)' },
    ], { duration: dur, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
    const giro = cartaoEl.animate([
      { transform: 'rotateY(0deg) scale(1)' },
      { transform: 'rotateY(-12deg) scale(1.08)', offset: .25 },
      { transform: 'rotateY(130deg) scale(1.06)', offset: .65 },
      { transform: 'rotateY(180deg) scale(1)' },
    ], { duration: dur, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' })
    giro.onfinish = () => setRevelado(true)
  }

  function fechar() {
    if (fechando) return
    setFechando(true)
    const cena = cenaRef.current, cartaoEl = cartaoRef.current
    const reduz = reduzMovimento()
    if (!cena || !cartaoEl || reduz || !cena.animate) { onFechar(); return }
    const alvoVolta = origem?.getBoundingClientRect() ?? origemRectRef.current ?? alvoCentral()
    const atual = cena.getBoundingClientRect()
    const dur = 560
    const dx = (alvoVolta.left + alvoVolta.width / 2) - (atual.left + atual.width / 2)
    const dy = (alvoVolta.top + alvoVolta.height / 2) - (atual.top + atual.height / 2)
    const sx = atual.width ? alvoVolta.width / atual.width : 1, sy = atual.height ? alvoVolta.height / atual.height : 1
    cena.animate([
      { transform: 'translate(0, 0) scale(1, 1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: .4 },
    ], { duration: dur, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' })
    const giro = cartaoEl.animate([
      { transform: 'rotateY(180deg) scale(1)' },
      { transform: 'rotateY(60deg) scale(1.05)', offset: .55 },
      { transform: 'rotateY(0deg) scale(1)' },
    ], { duration: dur, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' })
    giro.onfinish = onFechar
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); fechar() }
  }

  const statusComEscolas = kanban ? STATUS_ORDEM.filter(s => kanban[s]?.length) : []
  const outrosStatus = kanban ? Object.keys(kanban).filter(s => !STATUS_ORDEM.includes(s) && kanban[s]?.length) : []
  const colunas = [...statusComEscolas, ...outrosStatus]

  return createPortal(
    <div onKeyDown={teclas}>
      <div className="ca-flip-fundo" onClick={fechar} />
      <div
        className="ca-flip-cena"
        ref={el => {
          if (el && !cenaRef.current) { cenaRef.current = el; requestAnimationFrame(() => { if (cartaoRef.current) abrir(el, cartaoRef.current) }) }
        }}
        role="dialog" aria-modal="true" aria-label={cartao.titulo}
      >
        <div className="ca-flip-cartao" ref={cartaoRef}>
          <div className="ca-flip-face ca-flip-frente" aria-hidden="true">
            <div className="ca-card-top"><span className="ca-date">{cartao.data_label || '—'}</span></div>
            <h3 style={{ font: '700 .95rem/1.4 var(--ac-sans)', color: 'var(--ac-ink)' }}>{cartao.titulo}</h3>
          </div>
          <div className="ca-flip-face ca-flip-verso">
            <div className="ca-flip-topo">
              <div><h2>{cartao.titulo}</h2><span className="ca-date">{cartao.data_label || '—'}</span></div>
              <button type="button" className="ca-flip-x" onClick={fechar} aria-label="Fechar">&times;</button>
            </div>
            <div className="ca-flip-corpo">
              {revelado ? (
                <>
                  {ehProximo ? <div className="ca-verso-alerta">⏰ Esta é a próxima etapa com prazo a vencer para esta escola.</div> : null}

                  <section className="ca-verso-bloco">
                    <h4>Sobre esta etapa</h4>
                    <p className="ca-desc">{cartao.descricao || 'Sem descrição ainda — clique em editar no cartão para completar.'}</p>
                    {cartao.fonte ? <p className="ca-fonte">{cartao.fonte}</p> : null}
                  </section>

                  <section className="ca-verso-bloco ca-verso-status">
                    <h4>Status para esta escola</h4>
                    <div className="ca-status-row">
                      <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); salvarStatus(e.target.value, prazo) }}
                        disabled={salvandoStatus}
                        aria-label="Status de execução"
                      >
                        {STATUS_EXECUCAO.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <label className="ca-prazo-label">
                        Prazo
                        <input
                          type="date"
                          value={prazo}
                          onChange={e => { setPrazo(e.target.value); salvarStatus(status, e.target.value) }}
                          disabled={salvandoStatus}
                        />
                      </label>
                      {salvandoStatus ? <span className="ca-salvando">Salvando…</span> : null}
                    </div>
                  </section>

                  <section className="ca-verso-bloco">
                    <h4>Anotações</h4>
                    <textarea
                      className="ca-notas"
                      value={anotacoes}
                      onChange={e => setAnotacoes(e.target.value)}
                      onBlur={salvarNotas}
                      placeholder="Como está o andamento, pendências, combinados com a escola…"
                      rows={4}
                    />
                    {salvandoNotas ? <span className="ca-salvando">Salvando…</span> : null}
                  </section>

                  {cartao.marco ? (
                    <section className="ca-verso-bloco">
                      <p className="ca-kanban-title">Escolas no marco "{cartao.marco}" · Painel Mestre</p>
                      {colunas.length ? (
                        <div className="ca-kanban">
                          {colunas.map(s => (
                            <div className="ca-kanban-col" key={s}>
                              <h4><span>{s}</span><span>{kanban?.[s]?.length ?? 0}</span></h4>
                              <ul>{kanban?.[s]?.map(nome => <li key={nome}>{nome}</li>)}</ul>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="ca-kanban-vazio">Nenhuma escola neste marco ainda.</p>
                      )}
                    </section>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
