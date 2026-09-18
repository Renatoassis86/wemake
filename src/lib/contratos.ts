// Todos os 16 segmentos precificáveis do contrato (Infantil, Fund I, Fund II, Médio).
// O valor/qtd total é somado aqui em vez de ler `valor_total_calculado` do banco,
// porque essa coluna foi definida antes da existência dos segmentos Fund II/Médio
// e sua fórmula original não está disponível para ser estendida com segurança.
export const SEGMENTOS_CONTRATO: Array<[string, string]> = [
  ['infantil2_qtd', 'infantil2_valor'],
  ['infantil3_qtd', 'infantil3_valor'],
  ['infantil4_qtd', 'infantil4_valor'],
  ['infantil5_qtd', 'infantil5_valor'],
  ['fund1_ano1_qtd', 'fund1_ano1_valor'],
  ['fund1_ano2_qtd', 'fund1_ano2_valor'],
  ['fund1_ano3_qtd', 'fund1_ano3_valor'],
  ['fund1_ano4_qtd', 'fund1_ano4_valor'],
  ['fund1_ano5_qtd', 'fund1_ano5_valor'],
  ['fund2_ano6_qtd', 'fund2_ano6_valor'],
  ['fund2_ano7_qtd', 'fund2_ano7_valor'],
  ['fund2_ano8_qtd', 'fund2_ano8_valor'],
  ['fund2_ano9_qtd', 'fund2_ano9_valor'],
  ['medio_1s_qtd', 'medio_1s_valor'],
  ['medio_2s_qtd', 'medio_2s_valor'],
  ['medio_3s_qtd', 'medio_3s_valor'],
]

export function calcValorTotalContrato(row: any): number {
  return SEGMENTOS_CONTRATO.reduce((acc, [qtdKey, valKey]) => acc + ((row?.[qtdKey] ?? 0) * (row?.[valKey] ?? 0)), 0)
}

export function calcTotalAlunosContrato(row: any): number {
  return SEGMENTOS_CONTRATO.reduce((acc, [qtdKey]) => acc + (row?.[qtdKey] ?? 0), 0)
}

// Rótulo curto de cada série + o segmento a que pertence — usado nas colunas
// da tela "Quantidade de Alunos" (grade editável por escola × série).
export const SERIES_CONTRATO: Array<{ campo: string; label: string; segmento: string }> = [
  { campo: 'infantil2_qtd',  label: 'Inf. II',  segmento: 'Infantil' },
  { campo: 'infantil3_qtd',  label: 'Inf. III', segmento: 'Infantil' },
  { campo: 'infantil4_qtd',  label: 'Inf. IV',  segmento: 'Infantil' },
  { campo: 'infantil5_qtd',  label: 'Inf. V',   segmento: 'Infantil' },
  { campo: 'fund1_ano1_qtd', label: '1º Ano',   segmento: 'Fund. I' },
  { campo: 'fund1_ano2_qtd', label: '2º Ano',   segmento: 'Fund. I' },
  { campo: 'fund1_ano3_qtd', label: '3º Ano',   segmento: 'Fund. I' },
  { campo: 'fund1_ano4_qtd', label: '4º Ano',   segmento: 'Fund. I' },
  { campo: 'fund1_ano5_qtd', label: '5º Ano',   segmento: 'Fund. I' },
  { campo: 'fund2_ano6_qtd', label: '6º Ano',   segmento: 'Fund. II' },
  { campo: 'fund2_ano7_qtd', label: '7º Ano',   segmento: 'Fund. II' },
  { campo: 'fund2_ano8_qtd', label: '8º Ano',   segmento: 'Fund. II' },
  { campo: 'fund2_ano9_qtd', label: '9º Ano',   segmento: 'Fund. II' },
  { campo: 'medio_1s_qtd',   label: '1ª Série', segmento: 'Médio' },
  { campo: 'medio_2s_qtd',   label: '2ª Série', segmento: 'Médio' },
  { campo: 'medio_3s_qtd',   label: '3ª Série', segmento: 'Médio' },
]
