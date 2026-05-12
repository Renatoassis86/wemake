import { createClient } from '@/infrastructure/supabase/server'
import styles from '../dashboard.module.css'
import { getValidatedCompanyId } from '@/application/services/TenantService'
import Link from 'next/link'
import { AlertCircle, Calendar, FileCheck, Clock } from 'lucide-react'

export default async function CLMDashboardPage() {
  const supabase = await createClient()
  const activeCompanyId = await getValidatedCompanyId()

  let stats = { em_assinatura: 0, vigentes: 0, vencendo: 0, obrigacoes_atrasadas: 0 }
  let contratosRecentes: any[] = []
  let obrigacoesPendentes: any[] = []
  let alertas: any[] = []

  if (activeCompanyId) {
    // 1. Contagens de Status
    const { data: cStatus } = await supabase
      .from('contratos')
      .select('status')
      .eq('empresa_id', activeCompanyId)

    if (cStatus) {
      stats.em_assinatura = cStatus.filter(c => c.status === 'em_assinatura').length
      stats.vigentes = cStatus.filter(c => c.status === 'vigente').length
    }

    // 1.1 Contagens de Alertas
    const { data: cAlertas } = await supabase
      .from('alertas_contrato')
      .select('*')
      .eq('empresa_id', activeCompanyId)
      .eq('status_alerta', 'pendente')

    if (cAlertas) {
      alertas = cAlertas;
      stats.vencendo = cAlertas.filter(a => a.tipo_alerta === 'proximo_vencimento').length
      stats.obrigacoes_atrasadas = cAlertas.filter(a => a.tipo_alerta === 'obrigacao_atrasada').length
    }

    // 2. Buscar Contratos Recentes
    const { data: rec } = await supabase
      .from('contratos')
      .select('id, titulo, status, created_at, tipos_contrato(titulo)')
      .eq('empresa_id', activeCompanyId)
      .order('created_at', { ascending: false })
      .limit(5)
    contratosRecentes = rec || []

    // 3. Buscar Obrigações Pendentes
    const { data: obr } = await supabase
      .from('obrigacoes_contrato')
      .select('*, contratos(titulo)')
      .eq('status', 'pendente')
      .order('data_consolidado', { ascending: true })
      .limit(5)
    obrigacoesPendentes = obr || []
  }


  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F4F2ED', letterSpacing: '-0.025em' }}>Painel CLM Ópera</h1>
        <p style={{ color: '#C8F542', fontSize: '0.75rem', fontWeight: 800, marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 Objetivo do Módulo</p>
        <p style={{ color: '#8A8F99', fontSize: '0.875rem', marginTop: '0.2rem', maxWidth: '650px', lineHeight: '1.4' }}>
          Gerenciar o Ciclo de Vida do Contrato (CLM - Contract Lifecycle Management) pós-assinatura. Monitore prazos, acompanhe o cumprimento de obrigações contratuais, audite vigências e evite riscos jurídicos e financeiros.
        </p>
      </div>

      {!activeCompanyId && (
        <p style={{ color: 'var(--danger)', fontStyle: 'italic' }}>
          ⚠️ Selecione ou Cadastre uma empresa para visualizar o painel.
        </p>
      )}

      {activeCompanyId && (
        <>
          {/* Grid de Métricas Rápidas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', marginBottom: '2rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '0.8rem', borderRadius: '12px' }}><Clock size={24} /></div>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.em_assinatura}</div><div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Em Assinatura</div></div>
            </div>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.8rem', borderRadius: '12px' }}><FileCheck size={24} /></div>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.vigentes}</div><div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Vigentes</div></div>
            </div>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', padding: '0.8rem', borderRadius: '12px' }}><Calendar size={24} /></div>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.vencendo}</div><div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Vencendo (30 dias)</div></div>
            </div>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(220,38,38,0.1)', color: 'var(--danger)', padding: '0.8rem', borderRadius: '12px' }}><AlertCircle size={24} /></div>
              <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.obrigacoes_atrasadas}</div><div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Obrigações Atrasadas</div></div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Esquerda: Obrigações Ativas */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={18} /> Próximas Obrigações / Pagamentos</h3>
              {obrigacoesPendentes.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', textAlign: 'center' }}>Nenhuma obrigação pendente.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {obrigacoesPendentes.map((f: any) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)', paddingBottom: '0.6rem' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{f.titulo}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>Contrato: {f.contratos?.titulo}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#d97706' }}>{f.data_consolidado ? new Date(f.data_consolidado).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direita: Contratos Pós-assinatura Recentes */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} /> Atividade Recente</h3>
              {contratosRecentes.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', textAlign: 'center' }}>Nenhuma alteração recente.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {contratosRecentes.map((c: any) => (
                    <Link href={`/dashboard/contratos/${c.id}`} key={c.id} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.03)', paddingBottom: '0.6rem' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{c.titulo}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{c.tipos_contrato?.titulo || 'Geral'}</div>
                      </div>
                      <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: '5px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)' }}>{c.status.toUpperCase()}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
  
