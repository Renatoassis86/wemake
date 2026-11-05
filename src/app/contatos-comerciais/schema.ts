export const AREAS_CONTATO_COMERCIAL = ['Matrículas', 'Comercial', 'Marketing', 'Direção', 'Outro'] as const
export type AreaContatoComercial = (typeof AREAS_CONTATO_COMERCIAL)[number]

export interface PessoaContatoComercial {
  nome: string
  area: AreaContatoComercial | ''
  email: string
  telefone: string
}

export interface EnvioContatosComerciais {
  escolaNome: string
  escolaCidade: string
  escolaEstado: string
  respondenteNome: string
  respondenteCargo: string
  pessoas: PessoaContatoComercial[]
}
