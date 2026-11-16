'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Wallet, Inbox, ArrowUpFromLine, Activity, Receipt,
  TrendingUp, TrendingDown, FileBarChart, SlidersHorizontal, Users, Building2,
  Circle, ChevronDown,
} from 'lucide-react'
import { NAV_DOCS, NAV_GESTAO } from '@/lib/academia-nav'
import { getModulo, type ModuloSlug, type PaginaModulo } from '@/lib/modulos'

/**
 * Menus laterais por módulo, na identidade nova (azul-petróleo, ciano e Inter).
 * Dentro de um módulo, a lateral mostra só o que pertence a ele.
 */

/** Chave string (em modulos.ts, que roda no Edge) → componente de ícone (só no client). */
const ICONES_PAGINA: Record<string, React.ComponentType<{ size?: number }>> = {
  'dashboard': LayoutDashboard,
  'receita': Wallet,
  'a-receber': Inbox,
  'a-pagar': ArrowUpFromLine,
  'fluxo-caixa': Activity,
  'notas-fiscais': Receipt,
  'orcamento-receita': TrendingUp,
  'orcamento-despesa': TrendingDown,
  'proposta': FileBarChart,
  'gestao-orcamentaria': SlidersHorizontal,
  'alunos': Users,
  'centros-custo': Building2,
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return <div className="sbc-rotulo">{children}</div>
}

function Item({ href, ativo, num, icone, collapsed, indent, children }: {
  href: string; ativo: boolean; num?: number; icone?: string; collapsed?: boolean; indent?: boolean; children: React.ReactNode
}) {
  const Icon = (icone && ICONES_PAGINA[icone]) || Circle
  return (
    <Link href={href} className={`sbc-item${ativo ? ' is-on' : ''}${indent ? ' is-indent' : ''}`} aria-current={ativo ? 'page' : undefined} title={collapsed ? String(children) : undefined}>
      <span className="sbc-ic"><Icon size={14} /></span>
      {num !== undefined && !collapsed ? <span className="sbc-n">{String(num).padStart(2, '0')}</span> : null}
      {!collapsed ? <span className="sbc-t">{children}</span> : null}
    </Link>
  )
}

export function AcademiaNav({ pathname, diagnosticos, collapsed }: { pathname: string; diagnosticos: boolean; collapsed?: boolean }) {
  const emGestao = pathname.startsWith('/academia/gestao')
  return (
    <>
      <Link href="/" className="sbc-voltar">{collapsed ? '←' : '← Todos os módulos'}</Link>

      <Item href="/academia" ativo={pathname === '/academia'} collapsed={collapsed}>Visão geral</Item>
      <Item href="/academia/ciclo-anual" ativo={pathname === '/academia/ciclo-anual'} collapsed={collapsed}>Ciclo Anual</Item>

      {!collapsed ? <Rotulo>Gestão da implantação</Rotulo> : null}
      {NAV_GESTAO.filter(i => !i.soDiagnosticos || diagnosticos).map(i => (
        <Item
          key={i.href}
          href={i.href}
          ativo={i.href === '/academia/gestao' ? pathname === i.href : emGestao && pathname.startsWith(i.href)}
          collapsed={collapsed}
        >
          {i.nome}
        </Item>
      ))}

      {!collapsed ? NAV_DOCS.map(g => (
        <section key={g.grupo}>
          <Rotulo>{g.grupo}</Rotulo>
          {g.itens.map(d => (
            <Item key={d.slug} href={`/academia/${d.slug}`} num={d.n} ativo={pathname === `/academia/${d.slug}`}>{d.nome}</Item>
          ))}
        </section>
      )) : null}
    </>
  )
}

/** Uma subseção (ex.: "Orçamento") que agrupa várias páginas — recolhe/expande clicando no cabeçalho. */
function Subsecao({ nome, paginas, pathname, collapsed }: { nome: string; paginas: PaginaModulo[]; pathname: string; collapsed?: boolean }) {
  const temAtiva = paginas.some(p => p.href && pathname.startsWith(p.href))
  const [aberto, setAberto] = useState(true)

  if (collapsed) {
    // recolhido: sem cabeçalho de grupo, só os ícones de cada página em sequência
    return (
      <>
        {paginas.map(p => p.href && p.status === 'disponível' ? (
          <Item key={p.nome} href={p.href} icone={p.icone} ativo={pathname === p.href} collapsed>{p.nome}</Item>
        ) : (
          <div key={p.nome} className="sbc-item is-off" aria-disabled="true" title={p.nome}>
            <span className="sbc-ic"><Circle size={14} /></span>
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="sbc-grupo">
      <button type="button" className="sbc-grupo-cab" onClick={() => setAberto(a => !a)} aria-expanded={aberto}>
        <span>{nome}</span>
        <ChevronDown size={13} style={{ transform: aberto ? undefined : 'rotate(-90deg)', transition: 'transform .15s' }} />
      </button>
      {aberto || temAtiva ? paginas.map(p =>
        p.href && p.status === 'disponível' ? (
          <Item key={p.nome} href={p.href} icone={p.icone} ativo={pathname === p.href} indent>{p.nome}</Item>
        ) : (
          <div key={p.nome} className="sbc-item is-off is-indent" aria-disabled="true">
            <span className="sbc-ic"><Circle size={14} /></span>
            <span className="sbc-t">{p.nome}</span>
            <span className="sbc-breve">em breve</span>
          </div>
        ),
      ) : null}
    </div>
  )
}

export function ModuloLateral({ slug, pathname, collapsed }: { slug: ModuloSlug; pathname: string; collapsed?: boolean }) {
  const m = getModulo(slug)
  if (!m) return null

  // páginas soltas (sem grupo) na ordem original, com as agrupadas substituídas por um único marcador por grupo
  const gruposVistos = new Set<string>()
  const itens: Array<{ tipo: 'pagina'; pagina: PaginaModulo } | { tipo: 'grupo'; nome: string; paginas: PaginaModulo[] }> = []
  for (const p of m.paginas) {
    if (!p.grupo) { itens.push({ tipo: 'pagina', pagina: p }); continue }
    if (gruposVistos.has(p.grupo)) continue
    gruposVistos.add(p.grupo)
    itens.push({ tipo: 'grupo', nome: p.grupo, paginas: m.paginas.filter(x => x.grupo === p.grupo) })
  }

  return (
    <>
      <Link href="/" className="sbc-voltar">{collapsed ? '←' : '← Todos os módulos'}</Link>
      {!collapsed ? <Rotulo>{m.nome}</Rotulo> : null}
      {itens.map(it => it.tipo === 'grupo' ? (
        <Subsecao key={it.nome} nome={it.nome} paginas={it.paginas} pathname={pathname} collapsed={collapsed} />
      ) : (
        it.pagina.href && it.pagina.status === 'disponível' ? (
          <Item key={it.pagina.nome} href={it.pagina.href} icone={it.pagina.icone} collapsed={collapsed}
            ativo={it.pagina.href === m.home ? pathname === it.pagina.href : pathname.startsWith(it.pagina.href)}>
            {it.pagina.nome}
          </Item>
        ) : (
          <div key={it.pagina.nome} className="sbc-item is-off" aria-disabled="true" title={collapsed ? it.pagina.nome : undefined}>
            <span className="sbc-ic"><Circle size={14} /></span>
            {!collapsed ? <span className="sbc-t">{it.pagina.nome}</span> : null}
            {!collapsed ? <span className="sbc-breve">em breve</span> : null}
          </div>
        )
      ))}
    </>
  )
}

export const SIDEBAR_CSS = `
  .sbc-voltar { display:block; margin:.35rem 1rem .9rem; font:500 .74rem/1 var(--font-inter, sans-serif); color:rgba(255,255,255,.55); text-decoration:none; }
  .sbc-voltar:hover { color:#00677d; }
  .sbc-rotulo { font:700 .6rem/1.2 var(--font-inter, sans-serif); letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.38); padding:1.15rem 1.25rem .45rem; }
  .sbc-item { display:flex; align-items:center; gap:.6rem; margin:1px 8px; padding:.5rem .8rem .5rem .75rem; border-radius:8px; text-decoration:none;
    font:500 .83rem/1.3 var(--font-inter, sans-serif); color:rgba(255,255,255,.68); transition:background .15s, color .15s; position:relative; }
  .sbc-item:hover { background:rgba(255,255,255,.06); color:#fff; }
  .sbc-item.is-on { background:rgba(42,105,186,.13); color:#fff; font-weight:600; box-shadow:inset 3px 0 0 #00677d; }
  .sbc-item.is-off { color:rgba(255,255,255,.35); cursor:default; justify-content:space-between; }
  .sbc-item.is-off:hover { background:none; color:rgba(255,255,255,.35); }
  .sbc-item.is-indent { margin-left: 18px; }
  .sbc-ic { flex:0 0 auto; width:22px; height:22px; display:flex; align-items:center; justify-content:center; border-radius:6px; background:rgba(255,255,255,.04); opacity:.85; }
  .sbc-item.is-on .sbc-ic { background:rgba(255,255,255,.15); opacity:1; }
  .sbc-n { flex:0 0 auto; width:1.5rem; font:700 .66rem/1 var(--font-inter, sans-serif); font-variant-numeric:tabular-nums; color:rgba(42,105,186,.75); }
  .sbc-item.is-on .sbc-n { color:#00677d; }
  .sbc-t { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .sbc-breve { font:600 .54rem/1 var(--font-inter, sans-serif); letter-spacing:.1em; text-transform:uppercase; border:1px solid rgba(255,255,255,.2); border-radius:99px; padding:.25rem .45rem; color:rgba(255,255,255,.4); flex-shrink:0; }
  .sbc-grupo-cab { display:flex; align-items:center; justify-content:space-between; gap:.5rem; width:calc(100% - 16px); margin:1px 8px; padding:.5rem .8rem .5rem .75rem;
    background:none; border:none; cursor:pointer; font:700 .68rem/1.2 var(--font-inter, sans-serif); letter-spacing:.06em; text-transform:uppercase; color:rgba(255,255,255,.45); }
  .sbc-grupo-cab:hover { color:rgba(255,255,255,.75); }
  @media (max-width: 640px) {
    .sbc-voltar { display:flex; align-items:center; min-height:44px; margin-bottom:.4rem; font-size:.85rem; }
    .sbc-item { min-height:44px; font-size:.9rem; }
    .sbc-rotulo { padding-top:.9rem; }
  }
  @media (orientation: landscape) and (max-height: 500px) {
    .sbc-voltar { display:flex; align-items:center; min-height:44px; margin-bottom:.2rem; }
    .sbc-item { min-height:44px; }
    .sbc-rotulo { padding-top:.7rem; padding-bottom:.3rem; }
  }
`
