import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'We Make — Gestão que responde a Deus'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SITE_URL = 'https://gestao.wemake.tec.br'
const C = { navy: '#0b1f44', royal: '#4c8ade', mint: '#76f3cd' }

// Carrega só os glifos usados (mesmo padrão de proposta/[token]/opengraph-image.tsx)
async function carregarFraunces(texto: string) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&text=${encodeURIComponent(texto)}`
  const css = await (await fetch(cssUrl)).text()
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) return null
  const fontRes = await fetch(match[1])
  if (!fontRes.ok) return null
  return await fontRes.arrayBuffer()
}

export default async function Image() {
  const texto = 'we make Gestão que responde a Deus verdade nos números bondade com as escolas beleza no que se entrega'
  const fontData = await carregarFraunces(texto).catch(() => null)

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
          backgroundImage: `linear-gradient(100deg, ${C.navy} 0%, rgba(11,31,68,0.93) 46%, rgba(11,31,68,0.35) 82%, rgba(11,31,68,0.12) 100%)`,
        }}>
          <div style={{ display: 'flex', fontFamily: fontData ? 'Fraunces' : undefined, fontWeight: 700, fontSize: 26, color: '#fff', marginBottom: 30 }}>
            we<span style={{ color: C.mint }}>make</span>
          </div>

          <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: C.mint, marginBottom: 18 }}>
            GESTÃO GERAL · WE MAKE
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', fontFamily: fontData ? 'Fraunces' : undefined, fontWeight: 700,
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
      fonts: fontData ? [{ name: 'Fraunces', data: fontData, weight: 700, style: 'normal' }] : undefined,
    }
  )
}
