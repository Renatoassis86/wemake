import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

/**
 * Autenticação do formulário externo do Diagnóstico.
 *  - O PIN só existe em texto no momento da criação; no banco fica o hash HMAC.
 *  - A sessão da escola é um cookie assinado (diagnóstico + validade), httpOnly.
 */

export const COOKIE_DIAGNOSTICO = 'acad_diag'
export const SESSAO_HORAS = 12

/** Sem 0/O, 1/I/L: o PIN é digitado à mão a partir de um e-mail ou mensagem. */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function segredo() {
  const s = process.env.ACADEMIA_PIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('Segredo do diagnóstico não configurado.')
  return s
}

const hmac = (dado: string) => createHmac('sha256', segredo()).update(dado).digest('hex')

export function gerarPin() {
  const c = () => ALFABETO[randomInt(ALFABETO.length)]
  const bloco = () => Array.from({ length: 4 }, c).join('')
  return `${bloco()}-${bloco()}`
}

export function normalizarPin(pin: string) {
  return pin.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export const hashPin = (pin: string) => hmac('pin:' + normalizarPin(pin))
export const hashIp = (ip: string) => hmac('ip:' + ip)

const b64 = (s: string) => Buffer.from(s).toString('base64url')

export function criarSessao(diagnosticoId: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSAO_HORAS * 3600
  const corpo = b64(JSON.stringify({ d: diagnosticoId, exp }))
  return `${corpo}.${hmac('sessao:' + corpo)}`
}

export function lerSessao(token: string | undefined): string | null {
  if (!token) return null
  const [corpo, assinatura] = token.split('.')
  if (!corpo || !assinatura) return null
  const esperado = hmac('sessao:' + corpo)
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

/** Quem pode ver respostas, arquivos e parecer dos diagnósticos. Configurável por ACADEMIA_DIAGNOSTICO_EMAILS. */
export function emailsAutorizados(): string[] {
  const env = process.env.ACADEMIA_DIAGNOSTICO_EMAILS
  const lista = env ? env.split(',') : ['contato@wemake.tec.br', 'renato086@gmail.com']
  return lista.map(e => e.trim().toLowerCase()).filter(Boolean)
}
