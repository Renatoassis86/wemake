import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const CURSOS_FICV = [
  "BACHARELADO EM TEOLOGIA EAD",
  "BACHARELADO EM TEOLOGIA PRES",
  "BACHARELADO EM DIREITO",
  "PÓS-GRADUAÇÃO EM PSICOTEOLOGIA",
  "PÓS-GRADUAÇÃO EM EDUCAÇÃO CRISTÃ CLÁSSICA",
  "PÓS-GRADUAÇÃO EM TEOLOGIA SISTEMÁTICA",
  "PÓS-GRADUAÇÃO EM GESTÃO ESCOLAR",
  "PÓS-GRADUAÇÃO EM TEOLOGIA DO NOVO TESTAMENTO",
  "PÓS-GRADUAÇÃO EM LIDERANÇA CRISTÃ",
  "PÓS-GRADUAÇÃO EM FORMAÇÃO POLÍTICA",
  "PÓS-GRADUAÇÃO EM MISSOLOGIA URBANA",
  "PÓS-GRADUAÇÃO EM PSICOPEDAGOGIA",
  "PÓS-GRADUAÇÃO EM HISTÓRIA DO CRISTIANISMO"
]

export async function GET() {
  // 1. Criar o Workbook
  const wb = XLSX.utils.book_new()

  // Aba 1: Preenchimento
  const aba1Data = [
    ['NOME_ALUNO', 'EMAIL', 'PHONE', 'CPF', 'DATA_NASCIMENTO', 'SEMESTRE', 'CURSO', 'NOTAS_DISCIPLINAS', 'MEDIA_GERAL', 'STATUS', 'CARGA_HORARIA'],
    ['Lucas Gabriel', 'lucas@example.com', '83988887777', '000.000.000-00', '01/01/2000', '2024.1', 'BACHARELADO EM DIREITO', 'Módulo 1: 9.5 | Módulo 2: 8.5', '9.0', 'Aprovado', '360h']
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(aba1Data)
  XLSX.utils.book_append_sheet(wb, ws1, '1. Preenchimento')

  // Aba 2: Cursos Disponíveis (Tabela Auxiliar)
  const aba2Data = [
    ['CURSOS DISPONÍVEIS'],
    ...CURSOS_FICV.map(c => [c])
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(aba2Data)
  XLSX.utils.book_append_sheet(wb, ws2, '2. Catálogo de Cursos')

  // 2. Escrever em Buffer (array)
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // 3. Retornar como Arquivo para Download
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': 'attachment; filename="modelo_importacao_ficv.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
}
