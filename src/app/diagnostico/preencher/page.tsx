import Image from 'next/image'
import { redirect } from 'next/navigation'
import { listarArquivosDaSessao, sair, sessaoDiagnostico } from '../actions'
import DiagnosticoForm from './DiagnosticoForm'

export const dynamic = 'force-dynamic'

export default async function PreencherPage() {
  const s = await sessaoDiagnostico()
  if (!s) redirect('/diagnostico')
  const arquivos = await listarArquivosDaSessao(s.id)

  return (
    <>
      <header className="dg-hero">
        <div className="dg-hero-in">
          <div className="dg-topo">
            <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} priority style={{ height: 30, width: 'auto' }} />
            <form action={sair}><button type="submit" className="dg-sair">Sair</button></form>
          </div>
          <p className="ac-eyebrow">Diagnóstico do Espaço Maker</p>
          <h1>{s.escola_nome}</h1>
          <p className="ac-deck">Preencha o que souber agora. Tudo é salvo automaticamente e você pode voltar com o mesmo PIN.</p>
        </div>
      </header>

      <DiagnosticoForm
        escola={s.escola_nome}
        statusInicial={s.status}
        respostasIniciais={s.respostas ?? {}}
        arquivosIniciais={arquivos}
      />
    </>
  )
}
