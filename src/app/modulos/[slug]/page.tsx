import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MODULOS, getModulo, moduloPermitido } from '@/lib/modulos'
import LoginModulo from './LoginModulo'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return MODULOS.map(m => ({ slug: m.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = getModulo((await params).slug)
  return { title: m ? `${m.nome} · We Make` : 'Módulos · We Make' }
}

export default async function ModuloPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ acesso?: string }> }) {
  const { slug } = await params
  const { acesso } = await searchParams
  const m = getModulo(slug)
  if (!m) notFound()

  const cab = await headers()
  const host = cab.get('x-forwarded-host') ?? cab.get('host') ?? ''
  const origem = host ? `${cab.get('x-forwarded-proto') ?? 'https'}://${host}` : ''
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const logado = !!user
  const permitido = logado && moduloPermitido(m.slug, user?.email)

  return (
    <>
      <header className="md-hero">
        <div className="md-hero-in">
          <div className="md-topo">
            <Link href="/" aria-label="We Make — página inicial">
              <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} priority style={{ height: 30, width: 'auto' }} />
            </Link>
            <nav className="md-outros" aria-label="Outros módulos">
              {MODULOS.map(o => (
                <Link key={o.slug} href={`/modulos/${o.slug}`} className={o.slug === m.slug ? 'is-on' : undefined} aria-current={o.slug === m.slug ? 'page' : undefined}>
                  {o.curto}
                </Link>
              ))}
            </nav>
          </div>
          <p className="ac-eyebrow">{m.eyebrow}</p>
          <h1>{m.nome}</h1>
          <p className="ac-deck">{m.deck}</p>
        </div>
      </header>

      <div className="md-wrap">
        <main className="md-main">
          <h2 className="ac-minor" style={{ marginTop: 0 }}>O que esta área representa</h2>
          <p className="md-desc">{m.descricao}</p>

          <h2 className="ac-minor">As páginas deste módulo</h2>
          <ul className="md-paginas">
            {m.paginas.map(p => (
              <li key={p.nome}>
                <div>
                  <b>{p.nome}</b>
                  <span>{p.descricao}</span>
                </div>
                <em className={p.status === 'disponível' ? 'is-on' : undefined}>{p.status === 'disponível' ? 'Disponível' : 'Em estruturação'}</em>
              </li>
            ))}
          </ul>
        </main>

        <aside className="md-login" aria-labelledby="login-t">
          {!logado ? (
            <>
              <h2 id="login-t">Entrar em {m.nome}</h2>
              <p>Use o seu usuário da plataforma We Make.</p>
              {acesso === 'negado' ? <p role="alert" className="md-erro">Entre com uma conta que tenha acesso a este módulo.</p> : null}
              <LoginModulo destino={m.home} />
            </>
          ) : permitido ? (
            <>
              <h2 id="login-t">Você já está logado</h2>
              <p>{user?.email}</p>
              <Link href={m.home} className="md-botao">Abrir {m.nome}</Link>
            </>
          ) : (
            <>
              <h2 id="login-t">Sem acesso a este módulo</h2>
              <p role="alert">A conta {user?.email} não tem acesso a {m.nome}. Entre com outra conta ou fale com a direção da We Make.</p>
              <Link href="/comercial" className="md-botao md-botao--clara">Ir para a Gestão Comercial</Link>
            </>
          )}
          {m.slug === 'comercial' ? (
            <div className="md-escola">
              <h2>Formulário de cadastro da escola</h2>
              <p>Envie este link à escola. Ela informa os dados cadastrais e os alunos por série, e a escola entra no Funil de Contratação para montarmos a proposta.</p>
              <Link href="/formulario" className="md-botao md-botao--clara">Abrir o formulário da escola</Link>
              <p className="md-link-copia">{origem}/formulario</p>
            </div>
          ) : null}
          {m.slug === 'academia' ? (
            <div className="md-escola">
              <h2>Diagnóstico do Espaço Maker</h2>
              <p>Para as escolas parceiras. Informe o PIN que a We Make enviou: o formulário da sua escola abre em seguida.</p>
              <Link href="/diagnostico" className="md-botao md-botao--clara">Preencher o diagnóstico da escola</Link>
            </div>
          ) : null}
        </aside>
      </div>

      <footer className="md-rodape">
        <Link href="/">← Todos os módulos</Link>
        <span>© {new Date().getFullYear()} We Make Educação Tecnológica</span>
      </footer>
    </>
  )
}
