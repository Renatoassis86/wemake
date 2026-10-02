import Image from 'next/image'
import { redirect } from 'next/navigation'
import { sessaoDiagnostico } from './actions'
import PinForm from './PinForm'

export const dynamic = 'force-dynamic'

export default async function DiagnosticoEntrada() {
  if (await sessaoDiagnostico()) redirect('/diagnostico/preencher')

  return (
    <main className="dg-entrada">
      <header className="dg-topo">
        <Image src="/academia/brand/logo-white.png" alt="We Make" width={640} height={148} priority style={{ height: 32, width: 'auto' }} />
      </header>

      <div className="dg-entrada-grid">
        <section className="dg-intro">
          <p className="ac-eyebrow">Escola parceira · Implantação 2027</p>
          <h1>Diagnóstico do Espaço Maker</h1>
          <p className="dg-lede">
            Para planejar o espaço onde as aulas vão acontecer, a We Make precisa conhecer a sala e o que a escola já tem. Você informa os dados e
            envia as imagens; a We Make analisa e devolve o parecer.
          </p>

          <ol className="dg-passos">
            <li><b>A escola informa</b><span>Medidas, quantidades e modelos, sem precisar avaliar nada tecnicamente.</span></li>
            <li><b>A We Make diagnostica</b><span>Analisamos o ambiente e os recursos com base no que você enviar.</span></li>
            <li><b>A We Make devolve</b><span>Parecer do ambiente, o que pode ser reaproveitado e a lista do que ainda falta adquirir.</span></li>
          </ol>

          <h2 className="ac-minor">Tenha por perto</h2>
          <ul className="ac-list">
            <li>Trena ou fita métrica, para medir paredes, portas e janelas.</li>
            <li>Celular para fotos da sala, das portas, das janelas, das tomadas, dos equipamentos e dos móveis.</li>
            <li>Um vídeo curto, de 1 a 2 minutos, percorrendo toda a sala.</li>
            <li>A planta baixa do ambiente, se existir; se não, um croqui simples visto de cima, com as principais medidas.</li>
          </ul>
        </section>

        <section className="dg-pin" aria-labelledby="pin-t">
          <h2 id="pin-t">Entrar com o PIN</h2>
          <p>O PIN foi enviado pela We Make para a pessoa responsável na escola. Ele tem 8 caracteres, no formato XXXX-XXXX.</p>
          <PinForm />
          <p className="dg-nota">
            Seu preenchimento é salvo automaticamente. Você pode parar e voltar depois com o mesmo PIN.
          </p>
        </section>
      </div>
    </main>
  )
}
