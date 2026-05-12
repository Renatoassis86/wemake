import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const wb = XLSX.utils.book_new()

  // Aba 1: Preenchimento
  const aba1Data = [
    ['NOME_RAZAO_SOCIAL', 'DOCUMENTO_CPF_CNPJ', 'EMAIL', 'TIPO_PESSOA'],
    ['Fornecedor Teste Ltda', '00.000.000/0001-00', 'financeiro@teste.com', 'Fornecedor']
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(aba1Data)
  XLSX.utils.book_append_sheet(wb, ws1, '1. Preenchimento')

  // Aba 2: Variáveis de Tipo
  const aba2Data = [
    ['TIPOS PERMITIDOS'],
    ['Fornecedor'],
    ['Colaborador'],
    ['Cliente'],
    ['Testemunha']
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(aba2Data)
  XLSX.utils.book_append_sheet(wb, ws2, '2. Tipos de Pessoa')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Disposition': 'attachment; filename="modelo_importacao_pessoas.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  })
}
