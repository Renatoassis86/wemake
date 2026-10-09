import Image from 'next/image'
import Link from 'next/link'

interface Props {
  crumbs: { label: string; href?: string }[]
  eyebrow: string
  title: string
  deck?: string
  tipo?: string
  facts?: { k: string; v: string }[]
  variant?: 'doc' | 'index' | 'compact'
}

/** Capa de cada página: mesma linguagem das capas dos documentos diagramados. */
export default function DocHero({ crumbs, eyebrow, title, deck, tipo, facts, variant = 'doc' }: Props) {
  return (
    <header className={`ac-hero${variant === 'index' ? ' ac-hero--index' : ''}${variant === 'compact' ? ' ac-hero--compact' : ''}`}>
      <div className="ac-hero-top">
        <Link href="/academia" aria-label="Academia We Make — início">
          <Image
            src="/academia/brand/logo-white.png"
            alt="We Make"
            width={640}
            height={148}
            priority
            className="ac-logo"
            style={{ height: 30, width: 'auto' }}
          />
        </Link>
      </div>

      <nav className="ac-crumbs" aria-label="Você está em">
        {crumbs.map((c, i) => (
          <span key={c.label} style={{ display: 'contents' }}>
            {i > 0 ? <i>/</i> : null}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
          </span>
        ))}
        <span className="ac-pill ac-pill--crumb">Uso interno</span>
      </nav>

      <div className="ac-eyebrow">
        {eyebrow}
        {tipo ? <span className="ac-tipo">{tipo}</span> : null}
      </div>
      <h1>{title}</h1>
      {deck ? <p className="ac-deck">{deck}</p> : null}

      {facts && facts.length ? (
        <dl className="ac-facts">
          {facts.map(f => (
            <div key={f.k}>
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  )
}
