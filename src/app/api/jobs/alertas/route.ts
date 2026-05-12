import { NextRequest, NextResponse } from 'next/server'
import { JobAlertas } from '@/application/use-cases/JobAlertas'

export async function GET(request: NextRequest) {
  try {
    // 1. Simular uma Chave de Autenticação para evitar abuso de Job
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })
    }

    const job = new JobAlertas()
    const { gerados } = await job.executarVarredura()

    return NextResponse.json({ 
      success: true, 
      message: `Varredura de Alertas Executada. ${gerados} novos alertas gerados.` 
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
  
