import { NextResponse } from 'next/server'

/**
 * Recebe erros capturados no navegador (window.onerror, unhandledrejection,
 * ou um Error Boundary) e escreve no log do servidor — visível em `vercel
 * logs` sem precisar que ninguém abra o DevTools. Usado para depurar o
 * travamento do Ciclo Anual sem depender de print de console.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.error('[erro-cliente]', JSON.stringify(body).slice(0, 4000))
  } catch {
    console.error('[erro-cliente] payload inválido')
  }
  return NextResponse.json({ ok: true })
}
