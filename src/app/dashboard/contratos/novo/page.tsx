import { createClient } from '@/infrastructure/supabase/server'
import styles from '../../dashboard.module.css'
import { getValidatedCompanyId } from '@/application/services/TenantService'
import { TemplateSelector } from '@/components/forms/TemplateSelector'
import { salvarContrato } from '@/app/actions'

export default async function NovoContratoFormPage({
  searchParams,
}: {
  searchParams: Promise<{ template_id?: string }>
}) {
  const supabase = await createClient()
  const activeCompanyId = await getValidatedCompanyId()

  const { data: templates } = await supabase
    .from('templates_contrato')
    .select('id, titulo, versao')
    .eq('empresa_id', activeCompanyId)

  const selectedTemplateId = (await searchParams).template_id;

  let campos: any[] = []
  let templateSelecionado: any = null

  if (selectedTemplateId) {
    const { data } = await supabase
      .from('templates_contrato')
      .select('*, campos_template(*)')
      .eq('id', selectedTemplateId)
      .single()
    
    templateSelecionado = data
    campos = data?.campos_template || []
    campos.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
  }

  return (
    <div>
      <h1 className={styles.title}>Gerar Novo Contrato</h1>
      <p className={styles.subtitle}>Crie uma instância contratual a partir de um modelo pré-aprovado.</p>

      {!activeCompanyId && (
        <p style={{ color: 'var(--danger)', fontStyle: 'italic' }}>
          ⚠️ Selecione ou Cadastre uma empresa para prosseguir.
        </p>
      )}

      {activeCompanyId && (
        <div style={{ display: 'grid', gridTemplateColumns: templateSelecionado ? '1fr 1fr' : '1fr', gap: '2rem' }}>
          <form 
            action={salvarContrato} 
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
          >
            {/* Input Hidden para passar o templateId real pro Action */}
            <input type="hidden" name="template_id" value={selectedTemplateId || ''} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontWeight: '600', fontSize: '0.875rem' }}>Escolha o Template</label>
              <TemplateSelector templates={templates || []} selectedId={selectedTemplateId} />
            </div>



            {templateSelecionado && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontWeight: '600', fontSize: '0.875rem' }}>Título do Contrato</label>
                  <input type="text" name="titulo_contrato" required style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }} placeholder="Ex: Contrato de Prestação de Serviços - Cliente X" />
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--sidebar)' }}>
                  <h4 style={{ marginBottom: '0.8rem', fontSize: '0.9rem' }}>📝 Campos do Template</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {campos.map((c: any) => (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                          {c.rotulo} {c.obrigatorio && <span style={{ color: 'var(--danger)' }}>*</span>}
                        </label>
                        <input 
                          type={c.tipo_dado === 'data' ? 'date' : c.tipo_dado === 'numero' ? 'number' : 'text'} 
                          name={`tag_${c.chave_tag}`} 
                          required={c.obrigatorio}
                          defaultValue={c.valor_padrao || ''}
                          style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent' }} 
                        />
                        {c.descricao && <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{c.descricao}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" style={{ padding: '0.8rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                  Gerar Contrato
                </button>
              </>
            )}
          </form>

          {/* Preview Panel */}
          {templateSelecionado && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', background: 'rgba(0,0,0,0.01)', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Visualização Prévia (Template)</h3>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', color: 'var(--secondary)', lineHeight: '1.6' }}>
                {templateSelecionado.corpo_template}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
  
