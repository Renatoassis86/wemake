import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

// Para campos timestamptz (created_at, visualizado_em, updated_at) — já vêm
// com hora embutida, então não leva o 'T00:00:00' que formatDate() usa para
// datas puras (validade). Usar formatDate() aqui produz "Invalid Date".
export function formatDateTime(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// Valores dos kits CVE Education (atualizados)
// Infantil: R$ 1.046,26 | Fundamental: R$ 1.302,15
export const KIT_INFANTIL  = 1046.26
export const KIT_FUND1     = 1302.15
export const KIT_FUND2     = 1302.15
export const KIT_MEDIO     = 1302.15

export function calcularPotencial(infantil: number, fund1: number, fund2: number, medio: number) {
  return Math.round(
    infantil * KIT_INFANTIL +
    fund1    * KIT_FUND1    +
    fund2    * KIT_FUND2    +
    medio    * KIT_MEDIO
  )
}

const MAPA_ACENTOS: Record<string, string> = {
  'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c', 'ñ': 'n',
}

// Normaliza nomes de escola para cruzar cadastros sem vínculo de ID entre si
// (ex.: leads_universal.escola_nome, propostas.escola_nome — texto livre).
export function normalizarNomeEscola(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .split('')
    .map(ch => MAPA_ACENTOS[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function diasDesdeData(date: string | null | undefined) {
  if (!date) return null
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / 86400000)
}
