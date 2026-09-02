import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Proposta de Parceria We Make'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_URL = 'https://comercial.wemake.tec.br'
const C = { navy: '#0b1f44', royal: '#4c8ade', royalD: '#2a69ba', mint: '#76f3cd', amber: '#ffcc00' }

interface PropostaCapa {
  escola_nome: string
  escola_logo_url: string | null
  validade: string
}

async function buscarProposta(token: string): Promise<PropostaCapa | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const res = await fetch(
    `${url}/rest/v1/propostas?token=eq.${token}&select=escola_nome,escola_logo_url,validade&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  if (!res.ok) return null
  const rows = await res.json()
  return rows?.[0] ?? null
}

// Carrega só os glifos usados (padrão documentado do next/og para Google Fonts)
async function carregarFraunces(texto: string) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Fraunces:wght@700&text=${encodeURIComponent(texto)}`
  const css = await (await fetch(cssUrl)).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) return null
  const fontRes = await fetch(match[1])
  if (!fontRes.ok) return null
  return await fontRes.arrayBuffer()
}

function fmtData(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const proposta = await buscarProposta(token)

  const escolaNome = proposta?.escola_nome ?? 'Escola Parceira'
  const logoUrl = proposta?.escola_logo_url ?? null
  const validadeTexto = proposta?.validade ? fmtData(proposta.validade) : null

  const fontData = await carregarFraunces(escolaNome + ' PROPOSTA DE PARCERIA We Make').catch(() => null)

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>

        {/* topo: 2 colunas — royal blue + logo da escola */}
        <div style={{ display: 'flex', flex: '0 0 54%', width: '100%' }}>

          <div style={{
            width: '42%', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', padding: '40px 44px',
            backgroundImage: `linear-gradient(160deg, ${C.royal}, ${C.royalD})`,
          }}>
            <div style={{ display: 'flex', fontSize: 15, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', marginBottom: 14 }}>
              PROPOSTA DE PARCERIA
            </div>
            <div style={{
              display: 'flex', fontFamily: fontData ? 'Fraunces' : undefined, fontWeight: 700,
              fontSize: 46, color: '#fff', lineHeight: 1.08, textTransform: 'uppercase', letterSpacing: '-0.01em',
            }}>
              {escolaNome}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
              <div style={{ display: 'flex', width: 32, height: 3, background: C.mint, borderRadius: 2 }} />
              <div style={{ display: 'flex', fontSize: 15, color: C.mint, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>We Make</div>
            </div>
          </div>

          <div style={{ width: '58%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" width={380} height={210} style={{ objectFit: 'contain' }} />
            ) : (
              <div style={{
                display: 'flex', fontFamily: fontData ? 'Fraunces' : undefined, fontWeight: 700,
                fontSize: 160, color: C.navy, opacity: 0.15,
              }}>
                {escolaNome.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* baixo: foto de fundo (mesma da capa real) + overlay navy + wordmark/validade */}
        <div style={{
          display: 'flex', flex: '0 0 46%', width: '100%', position: 'relative',
          backgroundImage: `url(${SITE_URL}/proposta/foto_propostacomercial.png)`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div style={{
            display: 'flex', position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(180deg, rgba(11,31,68,0.55) 0%, rgba(11,31,68,0.15) 35%, rgba(11,31,68,0.15) 65%, rgba(11,31,68,0.8) 100%)',
          }} />
          <div style={{
            display: 'flex', position: 'absolute', left: 44, right: 44, bottom: 32,
            alignItems: 'flex-end', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>we<span style={{ color: C.mint }}>make</span></div>
            {validadeTexto && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                background: 'rgba(255,204,0,0.12)', border: `1px solid rgba(255,204,0,0.4)`,
                borderRadius: 12, padding: '10px 16px',
              }}>
                <div style={{ display: 'flex', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,204,0,0.7)', marginBottom: 4 }}>
                  Proposta válida até
                </div>
                <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: C.amber }}>{validadeTexto}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: 'Fraunces', data: fontData, weight: 700, style: 'normal' }] : undefined,
    }
  )
}
