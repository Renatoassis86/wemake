import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase/server'
import { DocumentoGenerator } from '@/application/use-cases/DocumentoGenerator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id
  const format = request.nextUrl.searchParams.get('format') || 'pdf' // pdf | docx

  const supabase = await createClient()

  // 1. Buscar Contrato/Documento e Preenchimento
  const { data: contrato } = await supabase
    .from('contratos')
    .select('*, templates_contrato(*)')
    .eq('id', id)
    .single()

  if (!contrato) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })

  // 2. Preencher Placeholders no corpo_html
  let corpoHtml = contrato.templates_contrato?.corpo_html || ''
  const dados = contrato.dados_preenchimento || {}

  Object.entries(dados).forEach(([key, value]) => {
    corpoHtml = corpoHtml.replaceAll(`{{${key}}}`, value as string)
  })

  const generator = new DocumentoGenerator()
  let buffer: Buffer;

  // Se for Certificado Oficial, tentar buscar histórico para unificar
  if (contrato.templates_contrato?.titulo?.includes('Certificado') && format === 'pdf') {
    const { data: historico } = await supabase
      .from('contratos')
      .select('*, templates_contrato(*)')
      .eq('dados_preenchimento->>NOME_ALUNO', contrato.dados_preenchimento?.NOME_ALUNO)
      .ilike('templates_contrato.titulo', '%Histórico%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (historico) {
      let historicoHtml = historico.templates_contrato?.corpo_html || ''
      Object.entries(historico.dados_preenchimento || {}).forEach(([k, v]) => {
        historicoHtml = historicoHtml.replaceAll(`{{${k}}}`, v as string)
      })
      buffer = await generator.gerarCertificadoComHistorico(contrato.titulo, corpoHtml, historicoHtml)
    } else {
      buffer = await generator.gerarPDF(contrato.titulo, corpoHtml) // Sem histórico fallback
    }
  } else if (format === 'docx') {
    buffer = await generator.gerarDocx(contrato.titulo, corpoHtml)
  } else {
    buffer = await generator.gerarPDF(contrato.titulo, corpoHtml)
  }


  // 3. Salvar no Supabase Storage
  const filePath = `${contrato.empresa_id}/${contrato.id}/emitido_${Date.now()}.${format}`
  
  const { error: uploadError } = await supabase.storage
    .from('contratos_arquivos')
    .upload(filePath, buffer, {
      contentType: format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
      upsert: true
    })

  if (uploadError) return NextResponse.json({ error: 'Erro de upload no Storage.', details: uploadError.message }, { status: 500 })

  // 4. Inserir na tabela arquivos_contrato para rastreabilidade
  await supabase.from('arquivos_contrato').insert({
    contrato_id: contrato.id,
    caminho_arquivo: filePath,
    tipo_arquivo: format,
    versao: 1
  })

  // 5. Redirecionar com URL assinada para download instantâneo
  const { data: signed } = await supabase.storage
    .from('contratos_arquivos')
    .createSignedUrl(filePath, 60)

  if (signed?.signedUrl) {
    return NextResponse.redirect(signed.signedUrl);
  }


  return NextResponse.json({ success: true, filePath })
}
  
