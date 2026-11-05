'use server'

import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { AREAS_CONTATO_COMERCIAL, type EnvioContatosComerciais } from './schema'

// Um arquivo 'use server' só pode exportar funções async — AREAS_CONTATO_COMERCIAL
// e os tipos moraram em ./schema por isso (exportar a constante daqui quebrava o
// build: "h.map is not a function" no prerender, porque o Next troca exports que
// não são função por uma referência de server action).

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/** Valida no servidor (nunca confia só na validação do navegador, já que o
 *  formulário é público e sem login). Devolve a lista de problemas pra
 *  página mostrar de uma vez, igual ao padrão do /formulario. */
function validar(input: EnvioContatosComerciais): string[] {
  const erros: string[] = []
  if (!input.escolaNome.trim()) erros.push('Informe o nome da escola.')
  if (!input.respondenteNome.trim()) erros.push('Informe seu nome (quem está preenchendo).')
  if (!input.pessoas.length) erros.push('Adicione ao menos uma pessoa.')
  input.pessoas.forEach((p, i) => {
    const n = i + 1
    if (!p.nome.trim()) erros.push(`Pessoa ${n}: informe o nome.`)
    if (!p.area) erros.push(`Pessoa ${n}: selecione a área.`)
    else if (!AREAS_CONTATO_COMERCIAL.includes(p.area)) erros.push(`Pessoa ${n}: área inválida.`)
    if (!p.email.trim()) erros.push(`Pessoa ${n}: informe o e-mail.`)
    else if (!emailValido(p.email)) erros.push(`Pessoa ${n}: e-mail inválido.`)
  })
  return erros
}

export async function enviarContatosComerciais(input: EnvioContatosComerciais): Promise<{ ok: true } | { ok: false; erros: string[] }> {
  const erros = validar(input)
  if (erros.length) return { ok: false, erros }

  const db = createAdminClient()
  const loteId = randomUUID()
  const linhas = input.pessoas.map(p => ({
    lote_id: loteId,
    escola_nome: input.escolaNome.trim().slice(0, 160),
    escola_cidade: input.escolaCidade.trim().slice(0, 100) || null,
    escola_estado: input.escolaEstado.trim().slice(0, 2) || null,
    respondente_nome: input.respondenteNome.trim().slice(0, 160),
    respondente_cargo: input.respondenteCargo.trim().slice(0, 160) || null,
    pessoa_nome: p.nome.trim().slice(0, 160),
    pessoa_area: p.area,
    pessoa_email: p.email.trim().toLowerCase().slice(0, 200),
    pessoa_telefone: p.telefone.trim().slice(0, 40) || null,
  }))

  const { error } = await db.from('academia_contatos_comerciais').insert(linhas)
  if (error) return { ok: false, erros: [error.message] }
  return { ok: true }
}
