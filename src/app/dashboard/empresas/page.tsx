import { createClient } from '@/infrastructure/supabase/server'
import styles from '../dashboard.module.css'
import { Building2 } from 'lucide-react'
import { AddCompanyModal } from './AddCompanyModal'
import { createCompany } from '@/app/actions'

export default async function EmpresasPage() {
  const supabase = await createClient()

  // 1. Obter todas as empresas vinculadas ao usuário
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === 'renato@arkosintelligence.com'
  let empresas: any[] = []

  if (isAdmin) {
    const { data: todasEmpresas } = await supabase
      .from('empresas')
      .select('*')
    empresas = todasEmpresas || []
  } else {
    const { data: uv } = await supabase
      .from('usuarios_empresas')
      .select('empresa_id, empresas(*)')
      .eq('perfil_id', user?.id)
    
    empresas = uv?.map((u: any) => u.empresas) || []
  }

  return (
    <div>
      <h1 className={styles.title}>Sistemas / Unidades / Setores</h1>
      <p className={styles.subtitle}>Gestão de Tenants, Empresas e Unidades Organizacionais.</p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <AddCompanyModal createAction={createCompany} />
      </div>


      <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
        {empresas.length === 0 ? (
          <p style={{ color: 'var(--secondary)', textAlign: 'center' }}>Nenhuma empresa vinculada encontrada.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Razão Social</th>
                <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>CNPJ</th>
                <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e: any) => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>{e.razao_social}</td>
                  <td style={{ padding: '0.75rem 0' }}>{e.cnpj || '-'}</td>
                  <td style={{ padding: '0.75rem 0' }}>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.2rem 0.5rem', borderRadius: '5px' }}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
