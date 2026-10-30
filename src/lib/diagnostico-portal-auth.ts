import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

/**
 * Autenticação do Portal da Escola (/meu-diagnostico) — a escola vê a
 * devolutiva já concluída do próprio diagnóstico. Login recorrente (não um
 * link de uso único como o /diagnostico), por isso a sessão dura mais.
 *  - A senha só existe em texto no momento da criação/exibição ao staff; no
 *    banco fica o hash HMAC (coluna portal_senha_hash). A coluna
 *    portal_senha_atual guarda o texto puro só pra reexibição na tela do
 *    staff — mesma lógica do pin_atual em academia_diagnostico_pin_visivel.sql.
 *  - A sessão da escola é um cookie assinado (diagnóstico + validade), httpOnly,
 *    com um prefixo de HMAC próprio, pra nunca ser aceito como sessão do /diagnostico.
 */

export const COOKIE_PORTAL = 'acad_portal'
export const SESSAO_PORTAL_HORAS = 24 * 30

function segredo() {
  const s = process.env.ACADEMIA_PIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('Segredo do portal não configurado.')
  return s
}

const hmac = (dado: string) => createHmac('sha256', segredo()).update(dado).digest('hex')

export function gerarSenhaNumerica() {
  return Array.from({ length: 6 }, () => randomInt(10)).join('')
}

export function normalizarSenha(senha: string) {
  return senha.replace(/\D/g, '')
}

export const hashSenha = (senha: string) => hmac('portal:' + normalizarSenha(senha))

const b64 = (s: string) => Buffer.from(s).toString('base64url')

export function criarSessaoPortal(diagnosticoId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSAO_PORTAL_HORAS * 3600
  const corpo = b64(JSON.stringify({ d: diagnosticoId, exp }))
  return `${corpo}.${hmac('sessao-portal:' + corpo)}`
}

export function lerSessaoPortal(token: string | undefined): string | null {
  if (!token) return null
  const [corpo, assinatura] = token.split('.')
  if (!corpo || !assinatura) return null
  const esperado = hmac('sessao-portal:' + corpo)
  const a = Buffer.from(assinatura)
  const b = Buffer.from(esperado)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const { d, exp } = JSON.parse(Buffer.from(corpo, 'base64url').toString())
    if (typeof d !== 'string' || typeof exp !== 'number' || exp < Date.now() / 1000) return null
    return d
  } catch {
    return null
  }
}
