import { QUADRANTE_LABELS, type Quadrante } from '@/lib/funil-contratacao'

/**
 * MatrizFitEngajamento — matriz 2x2 real do modelo Fit × Engajamento que já
 * existe em funil-contratacao.ts (quadrante) mas nunca foi desenhado como
 * matriz em nenhuma tela do app (hoje só aparece como badge/tooltip). Modelo
 * padrão de qualificação de conta em CRM B2B (MQL/SQL: HubSpot/Salesforce).
 */

const QUADRANTE_COR: Record<Quadrante, { bg: string; border: string; text: string }> = {
  prioritario:      { bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c' },
  cultivar:         { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
  oportunista:      { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
  baixa_prioridade: { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
}

const QUADRANTE_DESC: Record<Quadrante, string> = {
  prioritario:      'Bom encaixe de perfil e engajadas agora — foco imediato',
  cultivar:         'Bom encaixe, mas frias no momento — nutrir até reengajar',
  oportunista:      'Engajadas agora, mas fora do perfil ideal — avaliar caso a caso',
  baixa_prioridade: 'Baixo encaixe e baixo engajamento — não priorizar',
}

// Ordem de desenho: prioritário (alto/alto) no topo direito, cultivar no topo
// esquerdo, oportunista embaixo direito, baixa_prioridade embaixo esquerdo —
// mesmos eixos de derivarQuadrante() em funil-contratacao.ts.
const ORDEM: Quadrante[] = ['cultivar', 'prioritario', 'baixa_prioridade', 'oportunista']

export function MatrizFitEngajamento({
  linhas,
}: {
  linhas: { escola_nome: string; quadrante: Quadrante }[]
}) {
  const porQuadrante = new Map<Quadrante, string[]>()
  for (const l of linhas) {
    const arr = porQuadrante.get(l.quadrante) ?? []
    arr.push(l.escola_nome)
    porQuadrante.set(l.quadrante, arr)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
        {ORDEM.map(q => {
          const cor = QUADRANTE_COR[q]
          const escolas = porQuadrante.get(q) ?? []
          return (
            <div key={q} style={{
              background: cor.bg, border: `1.5px solid ${cor.border}`, borderRadius: 12,
              padding: '.9rem 1rem', minHeight: 128,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                <span style={{ fontSize: '.72rem', fontWeight: 800, color: cor.text, fontFamily: 'var(--font-montserrat,sans-serif)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {QUADRANTE_LABELS[q]}
                </span>
                <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '1.3rem', fontWeight: 800, color: cor.text }}>{escolas.length}</span>
              </div>
              <div style={{ fontSize: '.66rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)', marginBottom: '.5rem', lineHeight: 1.4 }}>
                {QUADRANTE_DESC[q]}
              </div>
              <div style={{ fontSize: '.68rem', color: '#334155', fontFamily: 'var(--font-inter,sans-serif)', lineHeight: 1.6 }}>
                {escolas.slice(0, 4).join(' · ')}
                {escolas.length > 4 && <span style={{ color: '#94a3b8' }}> · +{escolas.length - 4}</span>}
                {escolas.length === 0 && <span style={{ color: '#cbd5e1' }}>Nenhuma escola</span>}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem', fontSize: '.62rem', color: '#94a3b8', fontFamily: 'var(--font-inter,sans-serif)' }}>
        <span>← Menos engajadas agora</span>
        <span>Mais engajadas agora →</span>
      </div>
    </div>
  )
}
