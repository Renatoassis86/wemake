import { Source_Serif_4 } from 'next/font/google'
import Link from 'next/link'
import DocHero from '@/components/academia/DocHero'
import { getModulo, type ModuloSlug } from '@/lib/modulos'
import ModuloNav from './ModuloNav'
import '@/app/(dashboard)/academia/academia.css'
import '@/app/(dashboard)/academia/gestao.css'

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
  style: ['normal', 'italic'],
})

/** Moldura comum das páginas internas de um módulo: capa, abas e a descrição do módulo. */
export default function ModuloShell({ slug, children }: { slug: ModuloSlug; children: React.ReactNode }) {
  const m = getModulo(slug)!
  // abas = páginas do módulo que ficam dentro do prefixo dele
  const abas = m.paginas
    .filter(p => p.href && m.prefixos.some(pre => p.href === pre || p.href!.startsWith(pre + '/')))
    .map(p => ({ href: p.href as string, label: p.nome }))

  return (
    <div className={`ac ${serif.variable}`}>
      <DocHero
        variant="compact"
        crumbs={[{ label: 'Plataforma We Make', href: '/' }, { label: m.nome }]}
        eyebrow={m.eyebrow}
        title={m.nome}
        deck={m.deck}
      />
      {abas.length > 1 ? <ModuloNav abas={abas} moduloHome={m.home} /> : null}
      <div className="ac-wrap ac-wrap--gestao">
        <p className="ac-sobre"><b>Sobre esta área.</b> {m.descricao} <Link href={`/modulos/${m.slug}`}>Ver a apresentação do módulo</Link></p>
        {children}
      </div>
    </div>
  )
}

/** Lista de páginas do módulo (as que ainda não existem aparecem como “em estruturação”). */
export function PaginasDoModulo({ slug }: { slug: ModuloSlug }) {
  const m = getModulo(slug)!
  const itens = m.paginas.filter(p => p.href !== m.home)
  return (
    <section aria-labelledby="pags-t">
      <h2 id="pags-t" className="ac-h3">As páginas deste módulo</h2>
      <p className="ac-sec-lead">
        {itens.filter(p => p.status === 'disponível').length} de {itens.length} já têm página. As demais estão definidas e serão construídas na ordem que a equipe priorizar.
      </p>
      <ul className="ac-rows">
        {itens.map(p => {
          const conteudo = (
            <>
              <span className="r-n" aria-hidden="true">{p.status === 'disponível' ? '●' : '○'}</span>
              <span className="r-h">{p.nome}</span>
              <span className="r-d">{p.descricao}</span>
              <span className={`r-t${p.status === 'disponível' ? ' is-on' : ''}`}>{p.status === 'disponível' ? 'Disponível' : 'Em estruturação'}</span>
            </>
          )
          return (
            <li key={p.nome} className={`ac-row${p.status === 'disponível' ? '' : ' is-off'}`}>
              {p.status === 'disponível' && p.href ? <Link href={p.href}>{conteudo}</Link> : <div className="ac-row-box">{conteudo}</div>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
