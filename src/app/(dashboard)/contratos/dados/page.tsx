import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ContratosDadosClient, type EscolaContrato } from '@/components/contratos/ContratosDadosClient'
import { calcTotalAlunosContrato, calcValorTotalContrato } from '@/lib/contratos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dados dos Contratos · We Make' }

export default async function ContratosDadosPage() {
  const admin = createAdminClient()

  // Duas consultas separadas + join em memória, em vez de um embed
  // `contratos(*, escolas(...))` — o embed depende do cache de relações do
  // PostgREST, que fica desatualizado toda vez que uma migração mexe nas
  // tabelas (aconteceu ao criar `contratos_aditivos`) até alguém rodar
  // `NOTIFY pgrst, 'reload schema'`. Assim a página não fica refém disso.
  // Inclui também minutas enviadas mas ainda não assinadas (ex.: Sagrados
  // Corações) — aparecem com uma etiqueta "Aguardando assinatura" em vez de
  // ficarem invisíveis, já que são referência comercial real (valor e
  // vigência propostos), só que ainda não fechada.
  const [{ data: contratosRaw }, { data: aditivosRaw }] = await Promise.all([
    admin.from('contratos').select('*').or('contrato_assinado.eq.true,contrato_enviado.eq.true').eq('declinou', false),
    admin.from('contratos_aditivos').select('*').order('data_assinatura', { ascending: false }),
  ])

  const escolaIds = (contratosRaw ?? []).map(c => c.escola_id)
  const { data: escolasRaw } = escolaIds.length
    ? await admin.from('escolas').select('id, nome, cnpj, rua, numero, bairro, cidade, estado, cep').in('id', escolaIds)
    : { data: [] as any[] }
  const escolasPorId = new Map((escolasRaw ?? []).map(e => [e.id, e]))

  const aditivosPorEscola = new Map<string, typeof aditivosRaw>()
  for (const a of aditivosRaw ?? []) {
    const lista = aditivosPorEscola.get(a.escola_id) ?? []
    lista.push(a)
    aditivosPorEscola.set(a.escola_id, lista)
  }

  type ContratoRow = NonNullable<typeof contratosRaw>[number]
  type EscolaRow = NonNullable<typeof escolasRaw>[number]

  const escolas: EscolaContrato[] = (contratosRaw ?? [])
    .map(c => ({ c, escola: escolasPorId.get(c.escola_id) }))
    .filter((x): x is { c: ContratoRow; escola: EscolaRow } => !!x.escola)
    .map(({ c, escola }) => ({
      escolaId: c.escola_id,
      nome: escola.nome,
      cnpj: escola.cnpj,
      endereco: {
        rua: escola.rua, numero: escola.numero, bairro: escola.bairro,
        cidade: escola.cidade, estado: escola.estado, cep: escola.cep,
      },
      assinado: c.contrato_assinado,
      totalAlunos: calcTotalAlunosContrato(c),
      // Preço real do contrato (extraído do documento assinado) quando
      // cadastrado — o cálculo por segmento (calcValorTotalContrato) só serve
      // de fallback pros contratos antigos que usam preço por série, modelo
      // que os contratos reais auditados não seguem (eles têm mensalidade
      // única pra escola toda, com desconto progressivo por ano).
      valorTotal: c.valor_total ?? calcValorTotalContrato(c),
      valorMensalInicial: c.valor_mensal_inicial ?? null,
      clausulasEspeciais: c.clausulas_especiais ?? null,
      vigenciaInicio: c.vigencia_inicio,
      vigenciaFim: c.vigencia_fim,
      driveContratoUrl: c.drive_contrato_url,
      legal: {
        nome: c.legal_nome, cpf: c.legal_cpf, email: c.legal_email, whatsapp: c.legal_whatsapp,
        rua: c.legal_rua, numero: c.legal_numero, complemento: c.legal_complemento,
        bairro: c.legal_bairro, cidade: c.legal_cidade, estado: c.legal_estado, cep: c.legal_cep,
      },
      series: c,
      aditivos: (aditivosPorEscola.get(c.escola_id) ?? []).map(a => ({
        id: a.id, titulo: a.titulo, resumo: a.resumo, dataAssinatura: a.data_assinatura,
        assinado: a.assinado, driveUrl: a.drive_url,
      })),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const assinadas = escolas.filter(e => e.assinado).length
  const pendentes = escolas.length - assinadas

  return (
    <section aria-label="Dados dos contratos">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '.25rem' }}>
        <p className="ac-sec-lead" style={{ margin: 0 }}>
          {assinadas} escola{assinadas !== 1 ? 's' : ''} com contrato assinado
          {pendentes > 0 ? ` e ${pendentes} minuta${pendentes !== 1 ? 's' : ''} aguardando assinatura` : ''}.
          Clique num card para ver os dados completos e o documento original.
        </p>
        <div style={{ display: 'flex', gap: '.6rem', flexShrink: 0 }}>
          <Link href="/contratos/dados/repositorio" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            padding: '.55rem 1rem', borderRadius: 10, border: '1.5px solid #00889e', color: '#00889e',
            fontSize: '.8rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', textDecoration: 'none',
          }}>
            Repositório de documentos
          </Link>
          <Link href="/contratos/dados/novo" style={{
            display: 'inline-flex', alignItems: 'center', gap: '.4rem',
            padding: '.55rem 1rem', borderRadius: 10, background: '#00889e', color: '#fff',
            fontSize: '.8rem', fontWeight: 700, fontFamily: 'var(--font-montserrat,sans-serif)', textDecoration: 'none',
          }}>
            + Cadastrar contrato
          </Link>
        </div>
      </div>
      <ContratosDadosClient escolas={escolas} />
    </section>
  )
}
