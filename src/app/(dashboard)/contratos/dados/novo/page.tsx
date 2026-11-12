import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { CadastrarContratoForm } from '@/components/contratos/CadastrarContratoForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cadastrar contrato · We Make' }

export default async function NovoContratoPage() {
  const admin = createAdminClient()
  const { data: escolas } = await admin.from('escolas').select('id, nome, estado').order('nome')

  return (
    <section aria-label="Cadastrar contrato">
      <div style={{ marginBottom: '1.25rem' }}>
        <Link href="/contratos/dados" style={{ fontSize: '.8rem', color: '#00889e', fontWeight: 600 }}>← Voltar pros dados dos contratos</Link>
      </div>
      <p className="ac-sec-lead">
        Cadastre o contrato a partir do documento assinado (ou da minuta). Escolha uma escola já cadastrada ou crie uma nova — a plataforma
        verifica o CNPJ antes de criar, pra não duplicar escola.
      </p>
      <CadastrarContratoForm mode="novo" escolas={escolas ?? []} />
    </section>
  )
}
