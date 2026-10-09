'use client'

import { Component, useEffect, type ReactNode } from 'react'

function reportar(payload: Record<string, unknown>) {
  try {
    fetch('/api/academia/log-erro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, href: window.location.href, ua: navigator.userAgent, hora: new Date().toISOString() }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // nunca deixa o relatório de erro causar outro erro
  }
}

/** Captura erros que acontecem fora do ciclo de render do React (ex.: dentro
 * de um setTimeout, de um listener de evento nativo) — um Error Boundary
 * sozinho não pega esses. */
export function CapturadorDeErros() {
  useEffect(() => {
    function aoErro(e: ErrorEvent) {
      reportar({ tipo: 'window.onerror', mensagem: e.message, arquivo: e.filename, linha: e.lineno, coluna: e.colno, stack: e.error?.stack })
    }
    function aoRejeitar(e: PromiseRejectionEvent) {
      const r = e.reason
      reportar({ tipo: 'unhandledrejection', mensagem: r?.message ?? String(r), stack: r?.stack })
    }
    window.addEventListener('error', aoErro)
    window.addEventListener('unhandledrejection', aoRejeitar)
    return () => {
      window.removeEventListener('error', aoErro)
      window.removeEventListener('unhandledrejection', aoRejeitar)
    }
  }, [])
  return null
}

interface Props { children: ReactNode }
interface State { erro: Error | null }

/** Erro de render do React (ex.: algo quebrado dentro do verso do cartão) cai
 * aqui — reporta e mostra uma tela amigável em vez de deixar a página em
 * branco ou travada. */
export class ErroBoundaryCicloAnual extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: { componentStack?: string | null }) {
    reportar({ tipo: 'react-error-boundary', mensagem: erro.message, stack: erro.stack, componentStack: info.componentStack })
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="ca-erro-boundary">
          <h2>Algo quebrou ao abrir este cartão</h2>
          <p>O erro já foi registrado. Tenta recarregar a página — se continuar acontecendo, me avisa.</p>
          <button type="button" className="ca-btn primario" onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      )
    }
    return this.props.children
  }
}
