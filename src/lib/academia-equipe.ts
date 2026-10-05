/**
 * Equipe interna que cuida dos processos da Academia. É a lista que aparece nos campos
 * "Responsável" (Painel, tarefas, agenda). O nome vem do cadastro de usuários quando o e-mail existe
 * lá; caso contrário vale o nome abaixo.
 */
export const EQUIPE: { nome: string; email: string }[] = [
  { nome: 'Renato Assis', email: 'renato086@gmail.com' },
  { nome: 'Chris', email: 'chris@wemake.tec.br' },
  { nome: 'Emanuel Peixoto', email: 'epcri1966@gmail.com' },
  { nome: 'Manu', email: 'manu@wemake.tec.br' },
  { nome: 'Suzana', email: 'suzana@wemake.tec.br' },
  { nome: 'Dênis Júlio', email: 'contato@wemake.tec.br' },
]

export function equipeComNomes(usuarios: { email: string | null; nome_completo: string | null }[]) {
  const porEmail = new Map(usuarios.filter(u => u.email && u.nome_completo).map(u => [u.email!.toLowerCase(), u.nome_completo!]))
  return EQUIPE.map(m => ({ email: m.email, nome: porEmail.get(m.email.toLowerCase()) ?? m.nome }))
}
