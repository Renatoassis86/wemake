import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import { BUCKET, SCHEMA, briefingVisivel, qtdAAdquirir, resumoParecer, type Recurso, type Respostas } from '@/lib/diagnostico'
import { sairDoPortal, sessaoPortal, type Anotacao } from '../actions'
import FotosEnviadas, { type ArquivoPortal, type GrupoFotos } from './FotosEnviadas'
import AdquiridoCheckbox from './AdquiridoCheckbox'
import DiarioAnotacoes from './DiarioAnotacoes'
import './painel.css'

interface CompraLinha {
  item_key: string
  situacao: string | null
  melhor_loja: string | null
  melhor_link: string | null
  melhor_preco: number | null
  ml_link: string | null
  amazon_link: string | null
  link_original_url: string | null
  adquirido: boolean
}

function melhorLink(c: CompraLinha | undefined) {
  return c?.melhor_link || c?.ml_link || c?.amazon_link || c?.link_original_url || null
}

export default async function PainelPage() {
  const sessao = await sessaoPortal()
  if (!sessao) redirect('/meu-diagnostico')

  if (sessao.status !== 'concluido') {
    return (
      <div className="pt">
        <PtHeader escola={sessao.escola_nome} />
        <main className="pt-main">
          <div className="pt-aguardando">
            <p className="pt-kicker">Diagnóstico do Espaço Maker</p>
            <h1>Seu diagnóstico ainda está em análise</h1>
            <p>A equipe We Make está preparando a devolutiva. Avisamos assim que estiver pronta.</p>
          </div>
        </main>
      </div>
    )
  }

  const { parecer, respostas, num_alunos } = sessao
  const db = createAdminClient()
  const { data: comprasRaw } = await db
    .from('academia_diag_compras')
    .select('item_key, situacao, melhor_loja, melhor_link, melhor_preco, ml_link, amazon_link, link_original_url, adquirido')
    .eq('diagnostico_id', sessao.id)
  const compras = new Map<string, CompraLinha>((comprasRaw ?? []).map(c => [c.item_key, c as CompraLinha]))

  const { data: anotacoesRaw } = await db
    .from('academia_diag_anotacoes')
    .select('id, texto, criado_em')
    .eq('diagnostico_id', sessao.id)
    .order('criado_em', { ascending: false })
  const anotacoes = (anotacoesRaw ?? []) as Anotacao[]

  const { data: arqsRaw } = await db
    .from('academia_diagnostico_arquivos')
    .select('id, evidencia_key, nome, mime, tamanho, path')
    .eq('diagnostico_id', sessao.id)
    .order('created_at')
  const listaArqs = arqsRaw ?? []
  const assinadas = listaArqs.length
    ? await db.storage.from(BUCKET).createSignedUrls(listaArqs.map(a => a.path), 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] }
  const urlPorPath = new Map((assinadas.data ?? []).map(u => [u.path, u.signedUrl]))
  const arquivosPorChave = new Map<string, ArquivoPortal[]>()
  for (const a of listaArqs) {
    const item: ArquivoPortal = { id: a.id, nome: a.nome, mime: a.mime, tamanho: a.tamanho, url: urlPorPath.get(a.path) ?? null }
    arquivosPorChave.set(a.evidencia_key, [...(arquivosPorChave.get(a.evidencia_key) ?? []), item])
  }
  const labelPorChave = new Map<string, string>([
    ...SCHEMA.evidencias.map(e => [e.key, e.nome] as const),
    ...SCHEMA.medidas.map(m => [m.key, `${m.categoria} — ${m.info}`] as const),
  ])
  const gruposFotos: GrupoFotos[] = [...labelPorChave.keys()]
    .filter(chave => arquivosPorChave.has(chave))
    .map(chave => ({ chave, label: labelPorChave.get(chave) ?? chave, arquivos: arquivosPorChave.get(chave) ?? [] }))

  const resumo = resumoParecer(parecer, num_alunos)

  return (
    <div className="pt">
      <PtHeader escola={sessao.escola_nome} />
      <main className="pt-main">
        <p className="pt-kicker">Diagnóstico do Espaço Maker</p>
        <h1 className="pt-h1">{sessao.escola_nome}</h1>

        {parecer['geral.situacao'] ? <p className="pt-situacao">{parecer['geral.situacao']}</p> : null}
        {parecer['geral.obs'] ? <p className="pt-resumo">{parecer['geral.obs']}</p> : null}

        <OQueContaram respostas={respostas} />
        <FotosEnviadas grupos={gruposFotos} />

        <section className="pt-sec">
          <h2>Parecer técnico por dimensão</h2>
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead><tr><th>Dimensão</th><th>Status</th><th>Observação</th></tr></thead>
              <tbody>
                {SCHEMA.parecerAmbiente.map(i => (
                  (parecer[i.key + '.s'] || parecer[i.key + '.o']) ? (
                    <tr key={i.key}>
                      <td>{i.item}</td>
                      <td><span className="pt-status">{parecer[i.key + '.s'] || '—'}</span></td>
                      <td>{parecer[i.key + '.o'] || ''}</td>
                    </tr>
                  ) : null
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pt-sec">
          <h2>Resumo do investimento</h2>
          <dl className="pt-kpis">
            <div><dt>Itens reutilizáveis a comprar</dt><dd>{resumo.reu.comAquisicao}<small> de {resumo.reu.cadastrados}</small></dd></div>
            <div><dt>Itens consumíveis a comprar</dt><dd>{resumo.con.comAquisicao}<small> de {resumo.con.cadastrados}</small></dd></div>
            <div><dt>Custo total estimado</dt><dd className="pt-kpi-m">{formatCurrency(resumo.total)}</dd></div>
          </dl>
          <p className="pt-hint">Valores de referência, pesquisados pela We Make. Confira preço e disponibilidade no link antes de comprar — eles mudam com frequência. Vocês podem comprar itens equivalentes, respeitando a especificação técnica.</p>
        </section>

        <TabelaRecursos titulo="Itens reutilizáveis (permanentes)" itens={SCHEMA.reutilizaveis} parecer={parecer} compras={compras} numAlunos={num_alunos} />
        <TabelaRecursos titulo="Itens consumíveis (compra inicial)" itens={SCHEMA.consumiveis} parecer={parecer} compras={compras} numAlunos={num_alunos} />

        {parecer['geral.arquitetura'] ? (
          <section className="pt-sec">
            <h2>Encaminhamento arquitetônico</h2>
            <p className="pt-resumo">{parecer['geral.arquitetura']}</p>
          </section>
        ) : null}

        <DiarioAnotacoes anotacoes={anotacoes} />

        <footer className="pt-rodape">
          <p>Dúvidas sobre o diagnóstico ou a lista de compras? Fale com a equipe We Make.</p>
          <a href="https://wa.me/5583982301530" target="_blank" rel="noopener noreferrer">WhatsApp da We Make</a>
        </footer>
      </main>
    </div>
  )
}

function PtHeader({ escola }: { escola: string }) {
  return (
    <header className="pt-header">
      <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} style={{ objectFit: 'contain', height: 31, width: 'auto' }} />
      <span className="pt-header-escola">{escola}</span>
      <form action={sairDoPortal}><button type="submit" className="pt-sair">Sair</button></form>
    </header>
  )
}

const GRUPOS_BRIEFING = ['2.2 Climatização', '2.3 Mobiliário']

function OQueContaram({ respostas: resp }: { respostas: Respostas }) {
  const ambiente = SCHEMA.ambiente.filter(q => resp[q.key] || resp[q.key + '.d'])
  const briefing = GRUPOS_BRIEFING.flatMap(g => SCHEMA.briefing.filter(b => b.grupo === g && briefingVisivel(b, resp) && resp[b.key]))
  if (!ambiente.length && !briefing.length) return null
  return (
    <section className="pt-sec">
      <h2>O que vocês nos contaram</h2>
      <dl className="pt-dl">
        {ambiente.map(q => (
          <div key={q.key}>
            <dt>{q.pergunta}</dt>
            <dd>{resp[q.key]}{resp[q.key + '.d'] ? <span className="pt-det"> — {resp[q.key + '.d']}</span> : null}</dd>
          </div>
        ))}
        {briefing.map(b => (
          <div key={b.key}>
            <dt>{b.pergunta}</dt>
            <dd style={{ whiteSpace: 'pre-wrap' }}>{resp[b.key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function TabelaRecursos({ titulo, itens, parecer, compras, numAlunos }: { titulo: string; itens: Recurso[]; parecer: Respostas; compras: Map<string, CompraLinha>; numAlunos: number | null }) {
  const comItem = itens.filter(i => parecer[i.key + '.pc'] || parecer[i.key + '.qa'] !== undefined || compras.has(i.key))
  if (!comItem.length) return null
  return (
    <section className="pt-sec">
      <h2>{titulo}</h2>
      <div className="pt-table-wrap">
        <table className="pt-table pt-table-rec">
          <thead>
            <tr><th>Item</th><th>Qtd. a comprar</th><th>Custo</th><th>Situação</th><th>Onde comprar</th><th>Adquirido</th></tr>
          </thead>
          <tbody>
            {itens.map(i => {
              const adq = qtdAAdquirir(i, parecer, numAlunos)
              const c = compras.get(i.key)
              const link = melhorLink(c)
              return (
                <tr key={i.key}>
                  <td><b>{i.item}</b><span className="pt-spec">{i.spec}</span></td>
                  <td className="pt-num">{adq > 0 ? adq.toLocaleString('pt-BR') : <em className="pt-tem">já tem</em>}</td>
                  <td className="pt-num">{adq > 0 ? formatCurrency(adq * i.valor) : '—'}</td>
                  <td>{c?.situacao || (adq > 0 ? 'Comprar' : 'Pronto para uso')}{c?.melhor_loja ? ` · ${c.melhor_loja}` : ''}</td>
                  <td>
                    {adq > 0 && link ? (
                      <a className="pt-link" href={link} target="_blank" rel="noopener noreferrer nofollow">Abrir ↗</a>
                    ) : adq > 0 ? <em className="pt-tem">link em definição</em> : '—'}
                  </td>
                  <td>{adq > 0 ? <AdquiridoCheckbox itemKey={i.key} inicial={c?.adquirido ?? false} /> : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
