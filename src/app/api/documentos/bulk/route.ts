import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Coletar body [{ Aluno: "...", CPF: "...", Curso: "...", Disciplina: "...", Nota: 9.3 }]
  const rows = await request.json() as Record<string, any>[]
  if (!Array.isArray(rows)) return NextResponse.json({ error: 'Payload deve ser um array.' }, { status: 400 })

  // 2. Agrupar por CPF (Chave única)
  const alunosMap: Record<string, { nome: string, cpf: string, curso: string, notas: Record<string, any>, notasArray: number[] }> = {}

  rows.forEach(r => {
    const nome = r['Aluno'] || r['NOME_ALUNO']
    const cpf = r['CPF']
    const curso = r['Curso'] || r['CURSO']
    const disciplina = r['Disciplina'] || r['DISCIPLINA']
    const nota = r['Nota'] || r['NOTA'] || r['Média Geral']

    if (!cpf || !nome) return;

    if (!alunosMap[cpf]) {
      alunosMap[cpf] = { nome, cpf, curso, notas: {}, notasArray: [] }
    }

    if (disciplina) {
      // Salva nota de disciplina pelo nome para match de placeholder no HTML posterior
      alunosMap[cpf].notas[disciplina.trim().toUpperCase()] = nota
      const notaNum = parseFloat(nota as string)
      if (!isNaN(notaNum)) alunosMap[cpf].notasArray.push(notaNum)
    }
  })

  // 3. Processar cada Aluno
  const insertedCount = []

  for (const cpf in alunosMap) {
    const dadosAluno = alunosMap[cpf]

    // 3A. Encontrar Template pelo nome do curso
    const { data: template } = await supabase
      .from('templates_contrato')
      .select('*, campos_template(*)')
      .ilike('titulo', `%${dadosAluno.curso}%`)
      .limit(1)
      .single()

    if (!template) continue; // Pula se curso não cadastrado

    // 3B. Mapear Notas para as chaves NOTA_1, NOTA_2 dos placeholders do template
    const dadosPreenchimento: Record<string, any> = {
      NOME_ALUNO: dadosAluno.nome,
      CPF: dadosAluno.cpf,
    }

    // Match das notas pelo Label ou Nome da disciplina cadastrada no banco
    template.campos_template?.forEach((c: any) => {
      const labelLimpo = (c.label || '').replace('Nota:', '').trim().toUpperCase()
      if (dadosAluno.notas[labelLimpo]) {
        dadosPreenchimento[c.nome_campo] = dadosAluno.notas[labelLimpo]
      }
    })

    // Calcular CRA
    if (dadosAluno.notasArray.length > 0) {
      const soma = dadosAluno.notasArray.reduce((v, t) => v + t, 0)
      dadosPreenchimento['CRA'] = (soma / dadosAluno.notasArray.length).toFixed(1)
    }

    // 3C. Inserir Contrato/Documento
    await supabase.from('contratos').insert({
      titulo: `${template.titulo} - ${dadosAluno.nome}`,
      template_id: template.id,
      tipo_id: template.tipo_id,
      empresa_id: template.empresa_id,
      status: 'gerado',
      dados_preenchimento: dadosPreenchimento
    })

    insertedCount.push(dadosAluno.nome)
  }

  return NextResponse.json({ success: true, count: insertedCount.length, alunos: insertedCount })
}
  
