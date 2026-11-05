import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'We Make — Gestão que responde a Deus'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_URL = 'https://gestao.wemake.tec.br'
// Cores oficiais do kit de marca (identidade_visual_nova.zip), medidas direto
// nos PNGs: preto-petróleo, ciano, marfim. Nada de navy/royal/mint antigos.
const C = { navy: '#002933', royal: '#00ceff', mint: '#00ceff' }

// Satoshi (fonte oficial, auto-hospedada) — OTF porque o Satori só aceita
// opentype/truetype, não woff2.
async function carregarSatoshi() {
  const fontRes = await fetch(`${SITE_URL}/fonts/satoshi/Satoshi-Black.otf`)
  if (!fontRes.ok) return null
  return await fontRes.arrayBuffer()
}

export default async function Image() {
  const fontData = await carregarSatoshi().catch(() => null)

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        backgroundImage: `url(${SITE_URL}/images/hero-login.png)`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        {/* overlay + conteúdo num único elemento que preenche o pai via flex —
            evitar position:absolute pra sobrepor coisas, o Satori lida mal com
            overlays empilhados (testado: texto cortado e sem overlay nenhum). */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          width: '100%', height: '100%', padding: '0 64px',
          backgroundImage: `linear-gradient(100deg, ${C.navy} 0%, rgba(0,41,51,0.93) 46%, rgba(0,41,51,0.35) 82%, rgba(0,41,51,0.12) 100%)`,
        }}>
          <div style={{ display: 'flex', fontFamily: fontData ? 'Satoshi' : undefined, fontWeight: 700, fontSize: 26, color: '#fff', marginBottom: 30 }}>
            we<span style={{ color: C.mint }}>make</span>
          </div>

          <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.mint, marginBottom: 18 }}>
            GESTÃO GERAL · WE MAKE
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', fontFamily: fontData ? 'Satoshi' : undefined, fontWeight: 700,
            fontSize: 46, lineHeight: 1.22, color: '#fff', maxWidth: 840,
          }}>
            <span>Gestão que responde a Deus:&nbsp;</span>
            <span style={{ color: C.royal }}>verdade nos números, bondade com as escolas, beleza no que se entrega.</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: 'Satoshi', data: fontData, weight: 700, style: 'normal' }] : undefined,
    }
  )
}
