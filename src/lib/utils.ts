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

export function diasDesdeData(date: string | null | undefined) {
  if (!date) return null
  const diff = Date.now() - new Date(date).getTime()
  return Math.floor(diff / 86400000)
}
