'use client'

import Link from 'next/link'
import { NAV_DOCS, NAV_GESTAO } from '@/lib/academia-nav'
import { getModulo, type ModuloSlug } from '@/lib/modulos'

/**
 * Menus laterais por módulo, na identidade nova (azul-petróleo, ciano e Inter).
 * Dentro de um módulo, a lateral mostra só o que pertence a ele.
 */

function Rotulo({ children }: { children: React.ReactNode }) {
  return <div className="sbc-rotulo">{children}</div>
}

function Item({ href, ativo, num, children }: { href: string; ativo: boolean; num?: number; children: React.ReactNode }) {
  return (
    <Link href={href} className={`sbc-item${ativo ? ' is-on' : ''}`} aria-current={ativo ? 'page' : undefined}>
      {num !== undefined ? <span className="sbc-n">{String(num).padStart(2, '0')}</span> : null}
      <span className="sbc-t">{children}</span>
    </Link>
  )
}

export function AcademiaNav({ pathname, diagnosticos }: { pathname: string; diagnosticos: boolean }) {
  const emGestao = pathname.startsWith('/academia/gestao')
  return (
    <>
      <Link href="/" className="sbc-voltar">← Todos os módulos</Link>

      <Item href="/academia" ativo={pathname === '/academia'}>Visão geral</Item>

      {NAV_DOCS.map(g => (
        <section key={g.grupo}>
          <Rotulo>{g.grupo}</Rotulo>
          {g.itens.map(d => (
            <Item key={d.slug} href={`/academia/${d.slug}`} num={d.n} ativo={pathname === `/academia/${d.slug}`}>{d.nome}</Item>
          ))}
        </section>
      ))}

      <Rotulo>Gestão da implantação</Rotulo>
      {NAV_GESTAO.filter(i => !i.soDiagnosticos || diagnosticos).map(i => (
        <Item
          key={i.href}
          href={i.href}
          ativo={i.href === '/academia/gestao' ? pathname === i.href : emGestao && pathname.startsWith(i.href)}
        >
          {i.nome}
        </Item>
      ))}
    </>
  )
}

export function ModuloLateral({ slug, pathname }: { slug: ModuloSlug; pathname: string }) {
  const m = getModulo(slug)
  if (!m) return null
  const itens = m.paginas.filter(p => p.href)
  return (
    <>
      <Link href="/" className="sbc-voltar">← Todos os módulos</Link>
      <Rotulo>{m.nome}</Rotulo>
      {m.paginas.map(p =>
        p.href && p.status === 'disponível' ? (
          <Item key={p.nome} href={p.href} ativo={p.href === m.home ? pathname === p.href : pathname.startsWith(p.href)}>{p.nome}</Item>
        ) : (
          <div key={p.nome} className="sbc-item is-off" aria-disabled="true">
            <span className="sbc-t">{p.nome}</span>
            <span className="sbc-breve">em breve</span>
          </div>
        ),
      )}
      {itens.length === 0 ? null : null}
    </>
  )
}

export const SIDEBAR_CSS = `
  .sbc-voltar { display:block; margin:.35rem 1rem .9rem; font:500 .74rem/1 var(--font-inter, sans-serif); color:rgba(255,255,255,.55); text-decoration:none; }
  .sbc-voltar:hover { color:#00c8ff; }
  .sbc-rotulo { font:700 .6rem/1.2 var(--font-inter, sans-serif); letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.38); padding:1.15rem 1.25rem .45rem; }
  .sbc-item { display:flex; align-items:center; gap:.7rem; margin:1px 8px; padding:.5rem .8rem .5rem .75rem; border-radius:8px; text-decoration:none;
    font:500 .83rem/1.3 var(--font-inter, sans-serif); color:rgba(255,255,255,.68); transition:background .15s, color .15s; position:relative; }
  .sbc-item:hover { background:rgba(255,255,255,.06); color:#fff; }
  .sbc-item.is-on { background:rgba(0,200,255,.13); color:#fff; font-weight:600; box-shadow:inset 3px 0 0 #00c8ff; }
  .sbc-item.is-off { color:rgba(255,255,255,.35); cursor:default; justify-content:space-between; }
  .sbc-item.is-off:hover { background:none; color:rgba(255,255,255,.35); }
  .sbc-n { flex:0 0 auto; width:1.5rem; font:700 .66rem/1 var(--font-inter, sans-serif); font-variant-numeric:tabular-nums; color:rgba(0,200,255,.75); }
  .sbc-item.is-on .sbc-n { color:#00c8ff; }
  .sbc-t { flex:1; min-width:0; }
  .sbc-breve { font:600 .54rem/1 var(--font-inter, sans-serif); letter-spacing:.1em; text-transform:uppercase; border:1px solid rgba(255,255,255,.2); border-radius:99px; padding:.25rem .45rem; color:rgba(255,255,255,.4); }
`
