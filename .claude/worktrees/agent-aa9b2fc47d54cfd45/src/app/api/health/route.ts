import { NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
    APP_URL: !!process.env.NEXT_PUBLIC_APP_URL
  };

  const isReady = Object.values(envStatus).every(v => v === true);

  return NextResponse.json({
    status: isReady ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    version: '1.0.0-pilot',
    dependencies: envStatus
  })
}
  
