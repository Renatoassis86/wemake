import type { FaseFunil, LeadTemperatura } from '@/lib/funil-contratacao'

export interface FunilVisualEstagio {
  fase: FaseFunil
  label: string
  total: number       // cumulativo: nesta etapa ou em qualquer etapa mais avançada
  quente: number
  morno: number
  frio: number
}

const TEMP_COR: Record<LeadTemperatura, string> = {
  quente: '#dc2626',
  morno:  '#f59e0b',
  frio:   '#60a5fa',
}

/**
 * Funil de vendas clássico (largura proporcional ao volume cumulativo em cada
 * etapa) com a composição de temperatura de lead (quente/morno/frio) desenhada
 * dentro de cada segmento — modelo de lead scoring documentado em
 * src/lib/funil-contratacao.ts (calcularLeadScore).
 */
export function FunilVisual({ estagios }: { estagios: FunilVisualEstagio[] }) {
  const maxTotal = Math.max(1, ...estagios.map(e => e.total))
  const larguraMin = 18 // % — nunca deixa a base ficar invisível quando total > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', alignItems: 'center', padding: '.5rem 0' }}>
      {estagios.map((e, idx) => {
        const larguraPct = e.total > 0 ? Math.max(larguraMin, (e.total / maxTotal) * 100) : larguraMin * 0.6
        const somaTemp = e.quente + e.morno + e.frio
        return (
          <div key={e.fase} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: `${larguraPct}%`, minWidth: 160, maxWidth: '100%',
              borderRadius: idx === estagios.length - 1 ? 8 : 6,
              overflow: 'hidden', display: 'flex', height: 46,
              boxShadow: '0 1px 4px rgba(15,23,42,.08)', border: '1px solid rgba(15,23,42,.06)',
            }}>
              {somaTemp > 0 ? (
                (['quente', 'morno', 'frio'] as LeadTemperatura[]).map(t => {
                  const qtd = e[t]
                  if (qtd === 0) return null
                  return (
                    <div key={t} title={`${qtd} ${t}`} style={{
                      flex: qtd, background: TEMP_COR[t],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} />
                  )
                })
              ) : (
                <div style={{ flex: 1, background: '#e2e8f0' }} />
              )}
            </div>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: '.4rem', marginTop: '.3rem', marginBottom: idx < estagios.length - 1 ? '.15rem' : 0,
            }}>
              <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-montserrat,sans-serif)' }}>{e.label}</span>
              <span style={{ fontSize: '.72rem', fontWeight: 800, color: '#4A7FDB', fontFamily: 'var(--font-cormorant,serif)' }}>{e.total}</span>
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '.75rem', fontSize: '.68rem', color: '#64748b', fontFamily: 'var(--font-inter,sans-serif)' }}>
        {(['quente', 'morno', 'frio'] as LeadTemperatura[]).map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: TEMP_COR[t], display: 'inline-block' }} />
            {t === 'quente' ? 'Quente' : t === 'morno' ? 'Morno' : 'Frio'}
          </div>
        ))}
      </div>
    </div>
  )
}
