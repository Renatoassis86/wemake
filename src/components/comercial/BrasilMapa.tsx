import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * BrasilMapa.tsx — coroplético SVG do Brasil por UF, sem lib de mapa (mesma
 * filosofia SSR-safe do resto do app). A malha (IBGE, nível UF) é estática em
 * public/data/brasil-uf.geojson — lida uma vez no servidor, nunca via rede em
 * runtime. Projeção equirretangular simples com correção de latitude, adequada
 * para um mapa estático de país de porte médio como o Brasil.
 */

type Geometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }

interface GeoFeature {
  type: 'Feature'
  properties: { codarea: string }
  geometry: Geometry
}

const CODAREA_UF: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
}

function walkCoords(geometry: Geometry, fn: (pt: number[]) => void) {
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) for (const pt of ring) fn(pt)
  } else {
    for (const poly of geometry.coordinates) for (const ring of poly) for (const pt of ring) fn(pt)
  }
}

function ringToPath(ring: number[][], project: (pt: number[]) => [number, number]) {
  return ring.map((pt, i) => {
    const [x, y] = project(pt)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ') + 'Z'
}

function geometryToPath(geometry: Geometry, project: (pt: number[]) => [number, number]) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => ringToPath(ring, project)).join(' ')
  }
  return geometry.coordinates.map(poly => poly.map(ring => ringToPath(ring, project)).join(' ')).join(' ')
}

function centroid(geometry: Geometry, project: (pt: number[]) => [number, number]): [number, number] | null {
  let maiorAnel: [number, number][] | null = null
  let maiorArea = -1
  const rings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map(p => p[0])
  for (const ring of rings) {
    const pts = ring.map(project)
    let area = 0
    for (let i = 0; i < pts.length - 1; i++) area += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]
    area = Math.abs(area / 2)
    if (area > maiorArea) { maiorArea = area; maiorAnel = pts }
  }
  if (!maiorAnel) return null
  let cx = 0, cy = 0
  for (const [x, y] of maiorAnel) { cx += x; cy += y }
  return [cx / maiorAnel.length, cy / maiorAnel.length]
}

let geoCache: { type: 'FeatureCollection'; features: GeoFeature[] } | null = null
function carregarGeo() {
  if (!geoCache) {
    const raw = readFileSync(join(process.cwd(), 'public/data/brasil-uf.geojson'), 'utf8')
    geoCache = JSON.parse(raw)
  }
  return geoCache!
}

export function BrasilMapa({
  porEstado, width = 380, height = 380,
}: {
  porEstado: Record<string, number>
  width?: number
  height?: number
}) {
  const geo = carregarGeo()

  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const f of geo.features) {
    walkCoords(f.geometry, ([lon, lat]) => {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    })
  }
  const latRef = (minLat + maxLat) / 2
  const cosRef = Math.cos(latRef * Math.PI / 180)
  const lonSpan = (maxLon - minLon) * cosRef
  const latSpan = maxLat - minLat
  const pad = 14
  const scale = Math.min((width - pad * 2) / lonSpan, (height - pad * 2) / latSpan)
  const offX = pad + (width - pad * 2 - lonSpan * scale) / 2
  const offY = pad + (height - pad * 2 - latSpan * scale) / 2

  const project = ([lon, lat]: number[]): [number, number] => [
    (lon - minLon) * cosRef * scale + offX,
    (maxLat - lat) * scale + offY,
  ]

  const max = Math.max(1, ...Object.values(porEstado))
  const corPara = (qtd: number) => {
    if (!qtd) return '#eef2f7'
    const t = qtd / max
    const r = Math.round(210 - t * 138)
    const g = Math.round(224 - t * 96)
    const b = Math.round(245 - t * 25)
    return `rgb(${r},${g},${b})`
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxWidth: width, display: 'block', margin: '0 auto' }} xmlns="http://www.w3.org/2000/svg">
      {geo.features.map(f => {
        const uf = CODAREA_UF[f.properties.codarea]
        const qtd = porEstado[uf] || 0
        const d = geometryToPath(f.geometry, project)
        return <path key={f.properties.codarea} d={d} fill={corPara(qtd)} stroke="#fff" strokeWidth={1} fillRule="evenodd" />
      })}
      {geo.features.map(f => {
        const uf = CODAREA_UF[f.properties.codarea]
        const qtd = porEstado[uf] || 0
        const c = centroid(f.geometry, project)
        if (!c) return null
        return (
          <g key={`label-${f.properties.codarea}`}>
            <text x={c[0]} y={c[1] - 3} textAnchor="middle" fontFamily="var(--font-montserrat, sans-serif)" fontSize={8.5} fontWeight={700} fill="#0b1f44">{uf}</text>
            {qtd > 0 && <text x={c[0]} y={c[1] + 7} textAnchor="middle" fontFamily="var(--font-inter, sans-serif)" fontSize={8} fontWeight={700} fill="#4A7FDB">{qtd}</text>}
          </g>
        )
      })}
    </svg>
  )
}
