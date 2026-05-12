import { NextRequest, NextResponse } from 'next/server'
import { AssinaturaWorkflow } from '@/application/use-cases/AssinaturaWorkflow'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const provider = (await params).provider
    const body = await request.json()

    // SIMULAÇÃO DO PAYLOAD DE WEBHOOK:
    // { "external_id": "sig_xxx", "event_type": "signed" }
    
    const externalId = body.external_id
    const eventType = body.event_type // 'signed', 'viewed', 'rejected'

    if (!externalId || !eventType) {
      return NextResponse.json({ error: 'Payload incompleto.' }, { status: 400 })
    }

    const workflow = new AssinaturaWorkflow()
    
    let novoStatus = 'enviado'
    if (eventType === 'signed') novoStatus = 'assinado'
    if (eventType === 'viewed') novoStatus = 'visualizado'
    if (eventType === 'rejected') novoStatus = 'recusado'

    await workflow.atualizarStatusSignatario(externalId, novoStatus)

    return NextResponse.json({ 
      success: true, 
      message: `Webhook ${provider} processado. Status atualizado para ${novoStatus}` 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
  
