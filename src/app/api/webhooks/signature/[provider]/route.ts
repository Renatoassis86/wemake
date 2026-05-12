import { NextRequest, NextResponse } from 'next/server'
import { AssinaturaWorkflow } from '@/application/use-cases/AssinaturaWorkflow'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const provider = (await params).provider
  const body = await request.json()

  // Simulating: { "external_id": "sig_xxx", "event_type": "signed" }
  const externalId = body.external_id
  const eventType = body.event_type // 'signed', 'viewed', 'rejected'

  if (!externalId) return NextResponse.json({ error: 'external_id é requerido' }, { status: 400 })

  const workflow = new AssinaturaWorkflow()
  
  let novoStatus = 'enviado'
  if (eventType === 'signed') novoStatus = 'assinado'
  if (eventType === 'viewed') novoStatus = 'visualizado'
  if (eventType === 'rejected') novoStatus = 'recusado'

  await workflow.atualizarStatusSignatario(externalId, novoStatus)

  return NextResponse.json({ success: true, provider, novoStatus })
}
  
