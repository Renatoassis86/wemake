'use client'

import { useMemo, useState } from 'react'
import type { ItemCatalogo } from '@/lib/catalogo'
import { arquivarProduto, atualizarProduto, criarProduto, restaurarProduto } from '@/app/(dashboard)/academia/gestao/produtos/actions'
import { Aviso, useRun } from './ui'

const NOME_SECAO: Record<ItemCatalogo['secao'], string> = { reutilizavel: 'Reutilizáveis', consumivel: 'Consumíveis' }
const SEM_CATEGORIA = 'Sem categoria'

const fmtPreco = (v: number | null) => (v == null ? '' : String(v).replace('.', ','))

export default function ProdutosClient({ itensIniciais }: { itensIniciais: ItemCatalogo[] }) {
  const [itens, setItens] = useState<ItemCatalogo[]>(itensIniciais)
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [secaoNova, setSecaoNova] = useState<ItemCatalogo['secao']>('consumivel')
  const [formAberto, setFormAberto] = useState(false)

  const atualizarLocal = (key: string, patch: Partial<ItemCatalogo>) =>
    setItens(prev => prev.map(i => (i.key === key ? { ...i, ...patch } : i)))

  const visiveis = useMemo(() => itens.filter(i => mostrarArquivados || i.ativo), [itens, mostrarArquivados])

  const grupos = useMemo(() => {
    const porSecao = new Map<ItemCatalogo['secao'], Map<string, ItemCatalogo[]>>()
    for (const secao of ['reutilizavel', 'consumivel'] as const) porSecao.set(secao, new Map())
    for (const i of visiveis) {
      const porCategoria = porSecao.get(i.secao)!
      const chave = i.categoria?.trim() || SEM_CATEGORIA
      porCategoria.set(chave, [...(porCategoria.get(chave) ?? []), i])
    }
    return porSecao
  }, [visiveis])

  return (
    <div className="prod">
      <div className="ac-form-a" style={{ marginBottom: '1rem' }}>
        <button type="button" className="ac-btn-sm" onClick={() => setFormAberto(a => !a)}>
          {formAberto ? 'Cancelar' : '+ Novo produto'}
        </button>
        <label className="ac-check-inline">
          <input type="checkbox" checked={mostrarArquivados} onChange={e => setMostrarArquivados(e.target.checked)} />
          {' '}Mostrar arquivados
        </label>
      </div>

      {formAberto ? (
        <NovoProdutoForm
          secao={secaoNova}
          onSecaoChange={setSecaoNova}
          onCriado={item => { setItens(prev => [...prev, item]); setFormAberto(false) }}
        />
      ) : null}

      {(['reutilizavel', 'consumivel'] as const).map(secao => {
        const porCategoria = grupos.get(secao)!
        if (!porCategoria.size) return null
        return (
          <section key={secao} className="an-sec">
            <h3 className="ac-h3">{NOME_SECAO[secao]}</h3>
            {[...porCategoria.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([categoria, linhas]) => (
              <div key={categoria} style={{ marginBottom: '1.6rem' }}>
                <h4 className="ac-minor">{categoria} <small className="ac-hint">{linhas.length} {linhas.length === 1 ? 'item' : 'itens'}</small></h4>
                <div className="prod-lista">
                  {linhas.map(item => (
                    <LinhaProduto key={item.key} item={item} onSalvo={patch => atualizarLocal(item.key, patch)} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )
      })}

      {!visiveis.length ? <p className="ac-vazio">Nenhum produto cadastrado ainda.</p> : null}

      <p className="ac-nota">
        Editar aqui (nome, descrição, categoria, link, preço, quantidade-base) vale pra toda escola — formulário da
        escola, tela de análise e portal da escola refletem assim que a página recarregar. A quantidade existente,
        o parecer e a cotação de compra de cada escola ficam em cada diagnóstico e não mudam por aqui. Arquivar some
        um item das telas novas sem apagar o histórico — nunca apague de verdade um item que alguma escola já usou.
      </p>
    </div>
  )
}

function LinhaProduto({ item, onSalvo }: { item: ItemCatalogo; onSalvo: (patch: Partial<ItemCatalogo>) => void }) {
  const [editando, setEditando] = useState(false)
  const [categoria, setCategoria] = useState(item.categoria ?? '')
  const [titulo, setTitulo] = useState(item.item)
  const [spec, setSpec] = useState(item.spec ?? '')
  const [unid, setUnid] = useState(item.unid ?? '')
  const [ref, setRef] = useState(item.ref ?? '')
  const [qtd, setQtd] = useState(item.qtd != null ? String(item.qtd) : '')
  const [valor, setValor] = useState(fmtPreco(item.valor))
  const salvar = useRun()
  const arquivo = useRun()

  function salvarEdicao() {
    salvar.run(async () => {
      const fd = new FormData()
      fd.set('categoria', categoria); fd.set('titulo', titulo); fd.set('especificacao', spec)
      fd.set('unidade', unid); fd.set('referencia', ref); fd.set('qtd_recomendada', qtd); fd.set('valor_ref', valor)
      const r = await atualizarProduto(item.key, fd)
      if (r.ok) {
        onSalvo({
          categoria: categoria || null, item: titulo, spec: spec || null, unid: unid || null, ref: ref || null,
          qtd: qtd.trim() ? Number(qtd.replace(',', '.')) : null, valor: valor.trim() ? Number(valor.replace(',', '.')) : null,
        })
        setEditando(false)
      }
      return r
    })
  }

  function alternarArquivo() {
    if (item.ativo && !confirm(`Arquivar "${item.item}"? Ele some do formulário da escola e da tela de análise, mas o histórico de respostas já gravadas continua intacto. Dá pra restaurar depois.`)) return
    arquivo.run(async () => {
      const r = item.ativo ? await arquivarProduto(item.key) : await restaurarProduto(item.key)
      if (r.ok) onSalvo({ ativo: !item.ativo })
      return r
    })
  }

  if (!editando) {
    return (
      <article className={`prod-card ${item.ativo ? '' : 'is-arquivado'}`}>
        <div className="prod-card-top">
          <div>
            <code className="prod-chave">{item.key}</code>
            <h5 className="prod-nome">{item.item}{!item.ativo ? <span className="ac-chip" data-s="arquivado" style={{ marginLeft: '.5rem' }}>Arquivado</span> : null}</h5>
          </div>
          <div className="prod-acoes">
            <button type="button" className="ac-btn-sm" onClick={() => setEditando(true)}>Editar</button>
            <button type="button" className="ac-btn-sm is-ghost" disabled={arquivo.pending} onClick={alternarArquivo}>
              {arquivo.pending ? '...' : item.ativo ? 'Arquivar' : 'Restaurar'}
            </button>
          </div>
        </div>
        <p className="prod-desc">{item.spec || <em className="an-vazio">sem descrição</em>}</p>
        <dl className="prod-meta">
          <div><dt>Categoria</dt><dd>{item.categoria || '—'}</dd></div>
          <div><dt>Unidade</dt><dd>{item.unid || '—'}</dd></div>
          <div><dt>Qtd. base</dt><dd>{item.qtd ?? '—'}</dd></div>
          <div><dt>Preço</dt><dd>{item.valor != null ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}</dd></div>
          <div><dt>Link de compra</dt><dd>{item.ref ? <a className="ac-link" href={item.ref} target="_blank" rel="noopener noreferrer">Abrir ↗</a> : '—'}</dd></div>
        </dl>
      </article>
    )
  }

  return (
    <article className="prod-card is-editando">
      <div className="prod-card-top">
        <code className="prod-chave">{item.key}</code>
        <input className="ac-cell-in prod-nome-in" value={titulo} onChange={e => setTitulo(e.target.value)} aria-label="Nome do produto" placeholder="Nome do produto" />
      </div>
      <label className="prod-campo">
        <span>Descrição / especificação</span>
        <textarea className="ac-cell-in" rows={2} value={spec} onChange={e => setSpec(e.target.value)} />
      </label>
      <div className="prod-form-grade">
        <label className="prod-campo"><span>Categoria</span><input className="ac-cell-in" value={categoria} onChange={e => setCategoria(e.target.value)} /></label>
        <label className="prod-campo"><span>Unidade</span><input className="ac-cell-in" value={unid} onChange={e => setUnid(e.target.value)} /></label>
        <label className="prod-campo"><span>Qtd. base</span><input className="ac-cell-in an-num" inputMode="decimal" value={qtd} onChange={e => setQtd(e.target.value.replace(/[^\d.,]/g, ''))} /></label>
        <label className="prod-campo"><span>Preço (R$)</span><input className="ac-cell-in an-num" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value.replace(/[^\d.,]/g, ''))} /></label>
      </div>
      <label className="prod-campo">
        <span>Link de compra</span>
        <input className="ac-cell-in" value={ref} onChange={e => setRef(e.target.value)} placeholder="https://" />
      </label>
      <div className="ac-form-a" style={{ marginTop: '.5rem' }}>
        <button type="button" className="ac-btn-sm" disabled={salvar.pending} onClick={salvarEdicao}>{salvar.pending ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="ac-btn-sm is-ghost" onClick={() => setEditando(false)}>Cancelar</button>
      </div>
      <Aviso erro={salvar.erro} />
    </article>
  )
}

function NovoProdutoForm({
  secao, onSecaoChange, onCriado,
}: { secao: ItemCatalogo['secao']; onSecaoChange: (s: ItemCatalogo['secao']) => void; onCriado: (item: ItemCatalogo) => void }) {
  const run = useRun()

  return (
    <form
      className="ac-pinbox"
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        run.run(async () => {
          const r = await criarProduto(fd)
          if (!r.ok) return r
          const categoria = String(fd.get('categoria') ?? '').trim() || null
          const titulo = String(fd.get('titulo') ?? '').trim()
          const especificacao = String(fd.get('especificacao') ?? '').trim() || null
          const unidade = String(fd.get('unidade') ?? '').trim() || null
          const referencia = String(fd.get('referencia') ?? '').trim() || null
          const qtdStr = String(fd.get('qtd_recomendada') ?? '').trim()
          const valorStr = String(fd.get('valor_ref') ?? '').trim()
          onCriado({
            key: r.key, secao, categoria, item: titulo, spec: especificacao, unid: unidade, ref: referencia,
            qtd: qtdStr ? Number(qtdStr.replace(',', '.')) : null, valor: valorStr ? Number(valorStr.replace(',', '.')) : null,
            ordem: 0, ativo: true,
          })
          ;(e.currentTarget as HTMLFormElement).reset()
          return { ok: true as const }
        })
      }}
    >
      <p className="ac-kicker">Novo produto</p>
      <div className="ac-form-a">
        <select className="ac-cell-in" value={secao} onChange={e => onSecaoChange(e.target.value as ItemCatalogo['secao'])} aria-label="Seção" name="secao">
          <option value="reutilizavel">Reutilizável</option>
          <option value="consumivel">Consumível</option>
        </select>
        <input className="ac-cell-in" name="categoria" placeholder="Categoria (ex.: Eletrônica)" />
        <input className="ac-cell-in" name="titulo" placeholder="Nome do produto" required style={{ minWidth: 220 }} />
      </div>
      <div className="ac-form-a" style={{ marginTop: '.6rem' }}>
        <input className="ac-cell-in" name="especificacao" placeholder="Descrição / especificação" style={{ minWidth: 260 }} />
        <input className="ac-cell-in" name="unidade" placeholder="Unidade (ex.: kit, unidade)" style={{ width: 160 }} />
        <input className="ac-cell-in an-num" name="qtd_recomendada" placeholder="Qtd. base" style={{ width: 90 }} />
        <input className="ac-cell-in an-num" name="valor_ref" placeholder="Preço (R$)" style={{ width: 100 }} />
      </div>
      <div className="ac-form-a" style={{ marginTop: '.6rem' }}>
        <input className="ac-cell-in" name="referencia" placeholder="https://link-de-compra" style={{ minWidth: 300 }} />
        <button type="submit" className="ac-btn-sm" disabled={run.pending}>{run.pending ? 'Criando…' : 'Criar produto'}</button>
      </div>
      <Aviso erro={run.erro} />
    </form>
  )
}
