/**
 * Acesso restrito por e-mail: quando o e-mail logado está aqui, ele só pode abrir os
 * caminhos listados — qualquer outra rota redireciona pra `home`. É uma camada extra,
 * além da permissão por módulo (src/lib/modulos.ts): restringe por página, não só por
 * módulo inteiro. Usado pelo middleware (roda no Edge — por isso este arquivo não
 * importa nada do Node) e pela Sidebar, pra não mostrar links que o usuário não abre.
 */

export interface AcessoRestrito {
  nome: string
  home: string
  caminhos: string[]
}

export const ACESSO_RESTRITO: Record<string, AcessoRestrito> = {
  'kaicrannys@gmail.com': {
    nome: 'Kaic',
    home: '/comercial',
    caminhos: [
      '/comercial',
      '/comercial/escolas',
      '/comercial/registros',
      '/comercial/pipeline',
      '/comercial/propostas',
      '/comercial/jornada-visual',
      '/comercial/jornada',
      '/comercial/contratos',
      '/calculadora',
      '/agenda',
      '/transcricoes',
    ],
  },
}

export function acessoRestritoDoUsuario(email: string | null | undefined): AcessoRestrito | null {
  if (!email) return null
  return ACESSO_RESTRITO[email.toLowerCase()] ?? null
}

export function caminhoPermitido(restricao: AcessoRestrito, pathname: string): boolean {
  return restricao.caminhos.some(c => pathname === c || pathname.startsWith(c + '/'))
}
