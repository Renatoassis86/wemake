import { normalizarNomeEscola } from '@/lib/utils'

export interface PibMunicipio {
  cidade: string
  uf: string
  pibPerCapita: number // R$ por habitante/ano
  pctPibEstado: number // participação do PIB do município no PIB total do estado (%)
}

// Base de PIB municipal (IBGE) para as cidades onde temos escolas mapeadas — usada para
// enriquecer o ranking de priorização com renda per capita e peso econômico do município
// dentro do estado. Chave normalizada "cidade|UF" (mesmo algoritmo de normalizarNomeEscola).
const PIB_MUNICIPIOS: Record<string, PibMunicipio> = {
  'ananindeua|PA': { cidade: 'Ananindeua', uf: 'PA', pibPerCapita: 16542.68, pctPibEstado: 3.40 },
  'apiai|SP': { cidade: 'Apiaí', uf: 'SP', pibPerCapita: 37278.88, pctPibEstado: 0.03 },
  'araguari|MG': { cidade: 'Araguari', uf: 'MG', pibPerCapita: 49322.18, pctPibEstado: 0.68 },
  'araraquara|SP': { cidade: 'Araraquara', uf: 'SP', pibPerCapita: 49692.93, pctPibEstado: 0.44 },
  'atibaia|SP': { cidade: 'Atibaia', uf: 'SP', pibPerCapita: 57512.36, pctPibEstado: 0.31 },
  'belem|PA': { cidade: 'Belém', uf: 'PA', pibPerCapita: 22216.33, pctPibEstado: 12.73 },
  'belo horizonte|MG': { cidade: 'Belo Horizonte', uf: 'MG', pibPerCapita: 41818.32, pctPibEstado: 12.34 },
  'blumenau|SC': { cidade: 'Blumenau', uf: 'SC', pibPerCapita: 56155.65, pctPibEstado: 4.80 },
  'bom jesus da lapa|BA': { cidade: 'Bom Jesus da Lapa', uf: 'BA', pibPerCapita: 19356.52, pctPibEstado: 0.39 },
  'brasilia|DF': { cidade: 'Brasília', uf: 'DF', pibPerCapita: 92732.27, pctPibEstado: 100.00 },
  'cajamar|SP': { cidade: 'Cajamar', uf: 'SP', pibPerCapita: 287384.67, pctPibEstado: 0.84 },
  'caldas novas|GO': { cidade: 'Caldas Novas', uf: 'GO', pibPerCapita: 31527.54, pctPibEstado: 1.11 },
  'camacari|BA': { cidade: 'Camaçari', uf: 'BA', pibPerCapita: 109866.84, pctPibEstado: 9.63 },
  'camaragibe|PE': { cidade: 'Camaragibe', uf: 'PE', pibPerCapita: 13940.29, pctPibEstado: 1.01 },
  'campina grande|PB': { cidade: 'Campina Grande', uf: 'PB', pibPerCapita: 25066.11, pctPibEstado: 13.39 },
  'campo grande|MS': { cidade: 'Campo Grande', uf: 'MS', pibPerCapita: 37916.06, pctPibEstado: 24.42 },
  'campos dos goytacazes|RJ': { cidade: 'Campos dos Goytacazes', uf: 'RJ', pibPerCapita: 72243.98, pctPibEstado: 3.92 },
  'canavieiras|BA': { cidade: 'Canavieiras', uf: 'BA', pibPerCapita: 12876.82, pctPibEstado: 0.11 },
  'canoas|RS': { cidade: 'Canoas', uf: 'RS', pibPerCapita: 62892.77, pctPibEstado: 3.78 },
  'caraguatatuba|SP': { cidade: 'Caraguatatuba', uf: 'SP', pibPerCapita: 36201.70, pctPibEstado: 0.17 },
  'caruaru|PE': { cidade: 'Caruaru', uf: 'PE', pibPerCapita: 23456.58, pctPibEstado: 3.92 },
  'castanhal|PA': { cidade: 'Castanhal', uf: 'PA', pibPerCapita: 22897.75, pctPibEstado: 1.79 },
  'coronel vivida|PR': { cidade: 'Coronel Vivida', uf: 'PR', pibPerCapita: 43433.82, pctPibEstado: 0.16 },
  'cuiaba|MT': { cidade: 'Cuiabá', uf: 'MT', pibPerCapita: 47700.88, pctPibEstado: 12.75 },
  'curitiba|PR': { cidade: 'Curitiba', uf: 'PR', pibPerCapita: 49907.02, pctPibEstado: 17.82 },
  'embu das artes|SP': { cidade: 'Embu das Artes', uf: 'SP', pibPerCapita: 51258.86, pctPibEstado: 0.53 },
  'florianopolis|SC': { cidade: 'Florianópolis', uf: 'SC', pibPerCapita: 45602.98, pctPibEstado: 5.50 },
  'fortaleza|CE': { cidade: 'Fortaleza', uf: 'CE', pibPerCapita: 27164.45, pctPibEstado: 37.68 },
  'franca|SP': { cidade: 'Franca', uf: 'SP', pibPerCapita: 31450.10, pctPibEstado: 0.41 },
  'goiania|GO': { cidade: 'Goiânia', uf: 'GO', pibPerCapita: 38483.54, pctPibEstado: 22.20 },
  'guanambi|BA': { cidade: 'Guanambi', uf: 'BA', pibPerCapita: 19386.67, pctPibEstado: 0.47 },
  'guarapuava|PR': { cidade: 'Guarapuava', uf: 'PR', pibPerCapita: 45219.68, pctPibEstado: 1.51 },
  'guarulhos|SP': { cidade: 'Guarulhos', uf: 'SP', pibPerCapita: 55084.22, pctPibEstado: 2.84 },
  'itaborai|RJ': { cidade: 'Itaboraí', uf: 'RJ', pibPerCapita: 23078.43, pctPibEstado: 0.59 },
  'itagiba|BA': { cidade: 'Itagibá', uf: 'BA', pibPerCapita: 76971.85, pctPibEstado: 0.31 },
  'jequie|BA': { cidade: 'Jequié', uf: 'BA', pibPerCapita: 20325.74, pctPibEstado: 0.90 },
  'joao pessoa|PB': { cidade: 'João Pessoa', uf: 'PB', pibPerCapita: 26936.78, pctPibEstado: 28.71 },
  'joinville|SC': { cidade: 'Joinville', uf: 'SC', pibPerCapita: 74531.62, pctPibEstado: 10.52 },
  'juiz de fora|MG': { cidade: 'Juiz de Fora', uf: 'MG', pibPerCapita: 35145.34, pctPibEstado: 2.37 },
  'londrina|PR': { cidade: 'Londrina', uf: 'PR', pibPerCapita: 40636.89, pctPibEstado: 4.29 },
  'macae|RJ': { cidade: 'Macaé', uf: 'RJ', pibPerCapita: 66684.01, pctPibEstado: 1.87 },
  'manaus|AM': { cidade: 'Manaus', uf: 'AM', pibPerCapita: 45782.75, pctPibEstado: 78.52 },
  'mineiros|GO': { cidade: 'Mineiros', uf: 'GO', pibPerCapita: 47334.97, pctPibEstado: 1.22 },
  'mogi guacu|SP': { cidade: 'Mogi Guaçu', uf: 'SP', pibPerCapita: 44538.21, pctPibEstado: 0.25 },
  'natal|RN': { cidade: 'Natal', uf: 'RN', pibPerCapita: 26972.28, pctPibEstado: 30.16 },
  'panambi|RS': { cidade: 'Panambi', uf: 'RS', pibPerCapita: 71052.72, pctPibEstado: 0.54 },
  'parobe|RS': { cidade: 'Parobé', uf: 'RS', pibPerCapita: 23398.44, pctPibEstado: 0.24 },
  'ponta grossa|PR': { cidade: 'Ponta Grossa', uf: 'PR', pibPerCapita: 54316.58, pctPibEstado: 3.54 },
  'porto alegre|RS': { cidade: 'Porto Alegre', uf: 'RS', pibPerCapita: 54647.38, pctPibEstado: 14.03 },
  'praia grande|SP': { cidade: 'Praia Grande', uf: 'SP', pibPerCapita: 25940.64, pctPibEstado: 0.32 },
  'recife|PE': { cidade: 'Recife', uf: 'PE', pibPerCapita: 33094.37, pctPibEstado: 24.89 },
  'ribeirao preto|SP': { cidade: 'Ribeirão Preto', uf: 'SP', pibPerCapita: 55484.91, pctPibEstado: 1.47 },
  'rio de janeiro|RJ': { cidade: 'Rio de Janeiro', uf: 'RJ', pibPerCapita: 53078.23, pctPibEstado: 37.88 },
  'salvador|BA': { cidade: 'Salvador', uf: 'BA', pibPerCapita: 21706.06, pctPibEstado: 17.85 },
  'santa rita do passa quatro|SP': { cidade: 'Santa Rita do Passa Quatro', uf: 'SP', pibPerCapita: 29877.17, pctPibEstado: 0.03 },
  'santana de parnaiba|SP': { cidade: 'Santana de Parnaíba', uf: 'SP', pibPerCapita: 79579.96, pctPibEstado: 0.42 },
  'santo andre|SP': { cidade: 'Santo André', uf: 'SP', pibPerCapita: 45062.56, pctPibEstado: 1.20 },
  'santos|SP': { cidade: 'Santos', uf: 'SP', pibPerCapita: 55508.46, pctPibEstado: 0.89 },
  'sao bernardo do campo|SP': { cidade: 'São Bernardo do Campo', uf: 'SP', pibPerCapita: 68571.36, pctPibEstado: 2.14 },
  'sao jose de mipibu|RN': { cidade: 'São José de Mipibu', uf: 'RN', pibPerCapita: 23357.80, pctPibEstado: 1.30 },
  'sao jose dos campos|SP': { cidade: 'São José dos Campos', uf: 'SP', pibPerCapita: 61315.88, pctPibEstado: 1.66 },
  'sao luis|MA': { cidade: 'São Luís', uf: 'MA', pibPerCapita: 32739.65, pctPibEstado: 29.23 },
  'sao paulo|SP': { cidade: 'São Paulo', uf: 'SP', pibPerCapita: 66872.84, pctPibEstado: 30.48 },
  'taubate|SP': { cidade: 'Taubaté', uf: 'SP', pibPerCapita: 50495.56, pctPibEstado: 0.60 },
  'tomeacu|PA': { cidade: 'Tomé-Açu', uf: 'PA', pibPerCapita: 16107.91, pctPibEstado: 0.40 },
  'tres lagoas|MS': { cidade: 'Três Lagoas', uf: 'MS', pibPerCapita: 104352.29, pctPibEstado: 9.18 },
  'uberlandia|MG': { cidade: 'Uberlândia', uf: 'MG', pibPerCapita: 61038.02, pctPibEstado: 5.03 },
  'valinhos|SP': { cidade: 'Valinhos', uf: 'SP', pibPerCapita: 59842.76, pctPibEstado: 0.29 },
  'vitoria|ES': { cidade: 'Vitória', uf: 'ES', pibPerCapita: 85035.67, pctPibEstado: 16.86 },
}

// Ranking pré-calculado de cada município dentro do seu estado pela renda per capita
// (PIB per capita, do maior para o menor) — não pelo peso total do município na
// economia do estado, que é uma métrica diferente (% do PIB do estado).
const POSICAO_NO_ESTADO: Record<string, number> = (() => {
  const porEstado = new Map<string, PibMunicipio[]>()
  for (const m of Object.values(PIB_MUNICIPIOS)) {
    const lista = porEstado.get(m.uf) ?? []
    lista.push(m)
    porEstado.set(m.uf, lista)
  }
  const posicoes: Record<string, number> = {}
  for (const [uf, lista] of porEstado) {
    const ordenada = [...lista].sort((a, b) => b.pibPerCapita - a.pibPerCapita)
    ordenada.forEach((m, i) => {
      posicoes[`${normalizarNomeEscola(m.cidade)}|${uf}`] = i + 1
    })
  }
  return posicoes
})()

export interface PibInfo extends PibMunicipio {
  posicaoNoEstado: number
  totalCidadesNoEstado: number
}

const TOTAL_CIDADES_POR_ESTADO: Record<string, number> = (() => {
  const contagem: Record<string, number> = {}
  for (const m of Object.values(PIB_MUNICIPIOS)) {
    contagem[m.uf] = (contagem[m.uf] ?? 0) + 1
  }
  return contagem
})()

export function buscarPibMunicipio(cidade: string | null | undefined, uf: string | null | undefined): PibInfo | null {
  if (!cidade || !uf) return null
  const key = `${normalizarNomeEscola(cidade)}|${uf.trim().toUpperCase()}`
  const base = PIB_MUNICIPIOS[key]
  if (!base) return null
  return {
    ...base,
    posicaoNoEstado: POSICAO_NO_ESTADO[key],
    totalCidadesNoEstado: TOTAL_CIDADES_POR_ESTADO[base.uf],
  }
}
