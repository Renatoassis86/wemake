import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { carregarGestao } from '@/lib/academia-data'
import { carregarFichaComercial } from '@/lib/academia-comercial'
import { fmtData, marcoAtual, percentual } from '@/lib/academia-gestao'
import { STATUS_DIAGNOSTICO } from '@/lib/diagnostico'
import SetupNotice from '@/components/academia/gestao/SetupNotice'
import { Chip } from '@/components/academia/gestao/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ficha da escola · Academia We Make' }

const STATUS_COMERCIAL = { nao_iniciada: 'Não iniciada', em_andamento: 'Em andamento', concluida: 'Concluída' } as const

function Item({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return <div><dt>{rotulo}</dt><dd>{children || '—'}</dd></div>
}

export default async function FichaEscolaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await carregarGestao()
  if (d.setup || d.erro) return <SetupNotice erro={d.erro} />
  const impl = d.implantacoes.find(i => i.id === id)
  if (!impl) notFound()

  const db = createAdminClient()
  // escola do Comercial: pelo vínculo; sem vínculo, pelo nome
  let escolaId = impl.escola_id
  if (!escolaId) {
    const { data } = await db.from('escolas').select('id').ilike('nome', impl.escola_nome).limit(1).maybeSingle()
    escolaId = data?.id ?? null
  }
  const ficha = escolaId ? await carregarFichaComercial(escolaId) : null
  let { data: diag } = await db.from('academia_diagnosticos').select('id, status').eq('implantacao_id', impl.id).limit(1).maybeSingle()
  if (!diag) {
    ;({ data: diag } = await db.from('academia_diagnosticos').select('id, status').ilike('escola_nome', impl.escola_nome.replace(/[%_]/g, ' ')).limit(1).maybeSingle())
  }

  const tarefas = d.tarefas.filter(t => t.implantacao_id === impl.id)
  const abertas = tarefas.filter(t => t.status !== 'Concluído').length
  const pct = Math.round(percentual(impl) * 100)
  const c = ficha?.contrato

  return (
    <>
      <p className="ac-nota" style={{ marginTop: 0 }}><Link href="/academia/gestao">← Painel</Link></p>
      <h2 className="ac-h3" style={{ marginBottom: '.2rem' }}>{impl.escola_nome}</h2>
      <p className="ac-sec-lead" style={{ marginTop: 0 }}>
        {impl.cidade_uf || ficha?.escola.cidade_uf || 'Cidade não informada'}
        {escolaId ? <> · <Link href={`/comercial/escolas/${escolaId}`}>Abrir no Comercial</Link></> : null}
      </p>

      <div className="ac-ficha">
        <section aria-labelledby="f-acad">
          <h3 id="f-acad" className="ac-minor">Na Academia</h3>
          <dl className="ac-ficha-dl">
            <Item rotulo="Responsável We Make">{impl.responsavel}</Item>
            <Item rotulo="Etapa atual">{marcoAtual(impl) ?? 'Implantação encerrada'} ({pct}% concluído)</Item>
            <Item rotulo="Próxima ação">{impl.proxima_acao}</Item>
            <Item rotulo="Responsável pela ação">{impl.responsavel_acao}</Item>
            <Item rotulo="Prazo">{fmtData(impl.prazo)}</Item>
            <Item rotulo="Risco"><Chip s={impl.risco} /></Item>
            <Item rotulo="Tarefas abertas">{abertas} de {tarefas.length}</Item>
            <Item rotulo="Diagnóstico do Espaço Maker">
              {diag ? <Link href={`/academia/gestao/diagnosticos/${diag.id}`}>{STATUS_DIAGNOSTICO[diag.status as keyof typeof STATUS_DIAGNOSTICO] ?? diag.status}</Link> : <Link href="/academia/gestao/diagnosticos">Ainda não criado</Link>}
            </Item>
          </dl>
        </section>

        <section aria-labelledby="f-com">
          <h3 id="f-com" className="ac-minor">No Comercial</h3>
          {ficha ? (
            <dl className="ac-ficha-dl">
              <Item rotulo="Contato">{[ficha.escola.contato_nome, ficha.escola.contato_cargo].filter(Boolean).join(' · ')}</Item>
              <Item rotulo="Direção">{ficha.escola.diretor_nome}</Item>
              <Item rotulo="E-mail">{ficha.escola.email ? <a href={`mailto:${ficha.escola.email}`}>{ficha.escola.email}</a> : null}</Item>
              <Item rotulo="Telefone">{ficha.escola.telefone}</Item>
              <Item rotulo="Fechado por">{ficha.responsavel_comercial}</Item>
              <Item rotulo="Contrato">{c ? (c.declinou ? 'Declinado' : c.assinado ? 'Assinado' : 'Em negociação') : 'Sem contrato'}</Item>
              <Item rotulo="Alunos no contrato">{c?.alunos ? c.alunos.toLocaleString('pt-BR') : ficha.escola.total_alunos ? `${ficha.escola.total_alunos.toLocaleString('pt-BR')} (cadastro)` : null}</Item>
              <Item rotulo="Duração">{c?.anos ? `${c.anos} ${c.anos === 1 ? 'ano' : 'anos'}` : null}</Item>
              <Item rotulo="Livro impresso">{c ? (c.livro_impresso ? 'Sim' : 'Não') : null}</Item>
              <Item rotulo="Implantação (Comercial)">
                {c?.implantacao_status ? `${STATUS_COMERCIAL[c.implantacao_status]}${c.implantacao_iniciada_em ? ` · início ${fmtData(c.implantacao_iniciada_em)}` : ''}${c.implantacao_concluida_em ? ` · fim ${fmtData(c.implantacao_concluida_em)}` : ''}` : null}
              </Item>
            </dl>
          ) : <p className="ac-vazio">Esta escola ainda não está ligada ao cadastro comercial. Cadastre ou ligue pelo nome no Painel.</p>}
          {c?.implantacao_status === 'concluida' && pct < 100 ? (
            <p className="ac-aviso is-erro" role="status">O Comercial marca a implantação como concluída, mas a Academia mostra {pct}%. Confira qual dos dois está certo.</p>
          ) : null}
        </section>
      </div>
    </>
  )
}
