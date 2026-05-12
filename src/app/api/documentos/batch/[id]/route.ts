import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id // template_id
  const supabase = await createClient()

  // 1. Coletar body [{ NOME_ALUNO: "...", CPF: "...", ... }]
  const rows = await request.json() as Record<string, any>[]
  if (!Array.isArray(rows)) return NextResponse.json({ error: 'Payload deve ser um array de registros.' }, { status: 400 })

  // 2. Buscar Template
  const { data: template } = await supabase
    .from('templates_contrato')
    .select('*')
    .eq('id', id)
    .single()

  if (!template) return NextResponse.json({ error: 'Template não encontrado.' }, { status: 404 })

  const insertedIds: string[] = []

  for (const row of rows) {
    const dadosPreenchimento: Record<string, any> = { ...row }
    const notas: number[] = []

    // Calcular CRA se houver notas na planilha
    Object.entries(row).forEach(([k, v]) => {
      if (k.startsWith('NOTA_')) {
        const notaNum = parseFloat(v as string)
        if (!isNaN(notaNum)) notas.push(notaNum)
      }
    })

    if (notas.length > 0) {
      const soma = notas.reduce((a, b) => a + b, 0)
      dadosPreenchimento['CRA'] = (soma / notas.length).toFixed(1)
    }

    const tituloDoc = `${template.titulo} - ${row['NOME DO ALUNO'] || row['NOME_ALUNO'] || row['NOME DO ALUNO'] || 'Emitido'}`

    const { data: contrato } = await supabase
      .from('contratos')
      .insert({
        titulo: tituloDoc,
        template_id: template.id,
        tipo_id: template.tipo_id,
        empresa_id: template.empresa_id,
        status: 'gerado',
        dados_preenchimento: dadosPreenchimento
      })
      .select('id')
      .single()

    if (contrato) insertedIds.push(contrato.id)
  }

  return NextResponse.json({ success: true, count: insertedIds.length, ids: insertedIds })
}
  
