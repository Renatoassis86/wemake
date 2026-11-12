import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CadastrarContratoForm, type DadosIniciais } from '@/components/contratos/CadastrarContratoForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Editar contrato · We Make' }

export default async function EditarContratoPage({ params }: { params: Promise<{ escolaId: string }> }) {
  const { escolaId } = await params
  const admin = createAdminClient()

  const [{ data: escola }, { data: contrato }, { data: aditivosRaw }] = await Promise.all([
    admin.from('escolas').select('id, nome, cnpj').eq('id', escolaId).maybeSingle(),
    admin.from('contratos').select('*').eq('escola_id', escolaId).maybeSingle(),
    admin.from('contratos_aditivos').select('*').eq('escola_id', escolaId).order('data_assinatura', { ascending: false }),
  ])

  if (!escola) notFound()

  const c = contrato ?? ({} as Record<string, any>)
  const inicial: DadosIniciais = {
    escolaId: escola.id,
    escolaNome: escola.nome,
    escolaCnpj: escola.cnpj,
    legalNome: c.legal_nome ?? null, legalCpf: c.legal_cpf ?? null, legalEmail: c.legal_email ?? null, legalWhatsapp: c.legal_whatsapp ?? null,
    legalRua: c.legal_rua ?? null, legalNumero: c.legal_numero ?? null, legalComplemento: c.legal_complemento ?? null,
    legalBairro: c.legal_bairro ?? null, legalCidade: c.legal_cidade ?? null, legalEstado: c.legal_estado ?? null, legalCep: c.legal_cep ?? null,
    vigenciaInicio: c.vigencia_inicio ?? null, vigenciaFim: c.vigencia_fim ?? null,
    driveContratoUrl: c.drive_contrato_url ?? null,
    valorMensalInicial: c.valor_mensal_inicial ?? null, valorAnual: c.valor_anual ?? null, valorTotal: c.valor_total ?? null,
    modeloComercial: c.modelo_comercial ?? null, clausulasEspeciais: c.clausulas_especiais ?? null,
    contratoAssinado: !!c.contrato_assinado, contratoEnviado: !!c.contrato_enviado, marcadoVeterana: !!c.marcado_veterana,
    series: c,
    aditivos: (aditivosRaw ?? []).map(a => ({
      id: a.id, titulo: a.titulo, resumo: a.resumo, dataAssinatura: a.data_assinatura, assinado: a.assinado, driveUrl: a.drive_url,
    })),
  }

  return (
    <section aria-label="Editar contrato">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/contratos/dados" style={{ fontSize: '.8rem', color: '#00889e', fontWeight: 600 }}>← Voltar pros dados dos contratos</Link>
      </div>
      <p className="ac-sec-lead">Editando o contrato de <strong>{escola.nome}</strong>.</p>
      <CadastrarContratoForm mode="editar" inicial={inicial} />
    </section>
  )
}
