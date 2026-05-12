import { createClient } from '@/infrastructure/supabase/server'
import styles from '../dashboard.module.css'
import { getValidatedCompanyId } from '@/application/services/TenantService'
import Link from 'next/link'

export default async function AssinaturasPage() {
  const supabase = await createClient()
  const activeCompanyId = await getValidatedCompanyId()

  let contratos: any[] = []

  if (activeCompanyId) {
    // Buscar contratos que estão em andamento ou prontos para assinatura
    const { data } = await supabase
      .from('contratos')
      .select('*, contrato_signatarios(id, status_assinatura)')
      .eq('empresa_id', activeCompanyId)
      .in('status', ['pronto_para_assinatura', 'em_assinatura', 'assinado_parcialmente'])
      .order('updated_at', { ascending: false })

    contratos = data || []
  }

  return (
    <div>
      <h1 className={styles.title}>Fila de Assinaturas</h1>
      <p className={styles.subtitle}>Gerencie e acompanhe o status das coletas de assinaturas em tempo real.</p>

      {!activeCompanyId && (
        <p style={{ color: 'var(--danger)', fontStyle: 'italic' }}>
          ⚠️ Selecione ou Cadastre uma empresa para listar as assinaturas.
        </p>
      )}

      {activeCompanyId && (
        <div style={{ background: 'var(--sidebar)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', marginTop: '1.5rem' }}>
          {contratos.length === 0 ? (
            <p style={{ color: 'var(--secondary)', textAlign: 'center' }}>Nenhum contrato em fluxo de assinatura no momento.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Contrato</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Status Geral</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Progresso</th>
                  <th style={{ padding: '0.75rem 0', color: 'var(--secondary)' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c: any) => {
                  const total = c.contrato_signatarios?.length || 0;
                  const assinados = c.contrato_signatarios?.filter((s: any) => s.status_assinatura === 'assinado').length || 0;

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <td style={{ padding: '0.75rem 0', fontWeight: 'bold' }}>{c.titulo}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '0.2rem 0.4rem', borderRadius: '6px' }}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '100px', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${total ? (assinados/total)*100 : 0}%`, height: '100%', background: 'var(--success)' }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{assinados}/{total}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <Link href={`/dashboard/contratos/${c.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Acompanhar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
  
