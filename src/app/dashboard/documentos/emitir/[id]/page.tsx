import { createClient } from '@/infrastructure/supabase/server'
import styles from '../../../dashboard.module.css'
import EmissaoForm from './EmissaoForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmitirDocumentoPage({ params }: PageProps) {
  const id = (await params).id
  const supabase = await createClient()

  // 1. Buscar Template e Campos
  const { data: template } = await supabase
    .from('templates_contrato')
    .select('*, tipos_contrato(titulo)')
    .eq('id', id)
    .single()

  const { data: campos } = await supabase
    .from('campos_template')
    .select('*')
    .eq('template_id', id)
    
  if (!template) return <p>Template não encontrado.</p>

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className={styles.title}>Emitir Documento</h1>
      <p className={styles.subtitle}>Selecione o método e preencha para o template <strong>{template.titulo}</strong>.</p>

      <div style={{ marginTop: '1.5rem' }}>
        <EmissaoForm template={template} campos={campos || []} />
      </div>
    </div>
  )
}

