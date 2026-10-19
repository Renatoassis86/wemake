/** Validações dos formulários públicos: dígitos verificadores de CNPJ e CPF e valores em reais. */

const soDigitos = (v: string | null | undefined) => (v ?? '').replace(/\D/g, '')

export function cnpjValido(v: string | null | undefined): boolean {
  const d = soDigitos(v)
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const soma = base.split('').reduce((s, n, i) => s + Number(n) * pesos[i], 0)
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  const d1 = dv(d.slice(0, 12))
  const d2 = dv(d.slice(0, 12) + d1)
  return d1 === Number(d[12]) && d2 === Number(d[13])
}

export function cpfValido(v: string | null | undefined): boolean {
  const d = soDigitos(v)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const dv = (base: string) => {
    const soma = base.split('').reduce((s, n, i) => s + Number(n) * (base.length + 1 - i), 0)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  const d1 = dv(d.slice(0, 9))
  const d2 = dv(d.slice(0, 9) + d1)
  return d1 === Number(d[9]) && d2 === Number(d[10])
}

/** "R$ 1.234,56", "300,00", "300", "R$1700,00 (com material)" → 1234.56, 300, 300, 1700.
 *  Lê só o número no começo do texto (ignora o que vier depois, tipo observações
 *  digitadas junto); devolve null se não achar nada que pareça um valor em reais. */
export function valorEmReais(v: string | null | undefined): number | null {
  const semPrefixo = (v ?? '').replace(/R\$/gi, '').replace(/\s/g, '')
  const m = semPrefixo.match(/^[\d.,]+/)
  if (!m) return null
  let t = m[0]
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  else if (/\.\d{3}(\.|$)/.test(t)) t = t.replace(/\./g, '')
  const n = Number(t)
  return Number.isFinite(n) && n > 0 && n <= 1_000_000 ? Math.round(n * 100) / 100 : null
}

export const formatarReais = (n: number) => n.toFixed(2).replace('.', ',')
