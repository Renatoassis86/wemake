import { createClient } from '@/infrastructure/supabase/server'
import styles from '../dashboard.module.css'
import { getValidatedCompanyId } from '@/application/services/TenantService'

export default async function TiposContratoPage() {
  const supabase = await createClient()

  // 1. Obter Empresa Ativa Validada
  const activeCompanyId = await getValidatedCompanyId()

  let tipos: any[] = []

  if (activeCompanyId) {
    const { data } = await supabase
      .from('tipos_contrato')
      .select('*')
      .eq('empresa_id', activeCompanyId)
    tipos = data || []
  }

  return (
    <div>
      <h1 className={styles.title}>Tipos de Contratos</h1>
      <p className={styles.subtitle}>Gestão de classificações e categorias contratuais.</p>

      {!activeCompanyId && (
        <p style={{ color: 'var(--danger)', fontStyle: 'italic' }}>
          ⚠️ Selecione ou Cadastre uma empresa para listar os tipos de contratos.
        </p>
      )}

      {activeCompanyId && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <button className={styles.companySwitcher} style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
              + Cadastrar Tipo
            </button>
          </div>

          <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
            {tipos.length === 0 ? (
              <p style={{ color: 'var(--secondary)', textAlign: 'center' }}>Nenhum tipo de contrato cadastrado para esta empresa.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Título</th>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Código</th>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Categoria</th>
                    <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((t: any) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>{t.titulo}</td>
                      <td style={{ padding: '0.75rem 0' }}>{t.codigo || '-'}</td>
                      <td style={{ padding: '0.75rem 0' }}>{t.categoria || '-'}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '5px' }}>
                          {t.status || 'ativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
  
