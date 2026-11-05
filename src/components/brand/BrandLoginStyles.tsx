// Fonte + tokens + componentes do "hero" de login/acesso da identidade nova
// (petróleo/ciano/marfim, Satoshi, card de vidro, botão pill) — extraído de
// PropostaEstilos.tsx pra evitar reescrever os mesmos valores à mão em cada
// página (proposta/acesso, meu-diagnostico, acesso-escola, contatos-comerciais).
//
// Satoshi (não é Google Fonts — vem auto-hospedada de public/fonts/satoshi/,
// arquivos extraídos de identidade_visual_nova.zip) é a fonte oficial da marca.
// As cores batem com o pacote oficial, medidas pixel a pixel nos PNGs do kit:
// preto-petróleo #002933, ciano #00ceff, marfim #f4f3ee. Os nomes das
// variáveis CSS (--color-navy, --color-royal) ficam os mesmos de propósito —
// várias páginas já leem esses nomes, só o VALOR mudou pro oficial.
//
// Diferente de PropostaEstilos.tsx, este arquivo NÃO define `body { overflow:
// hidden }` nem nenhuma regra específica do viewer de proposta de tela única
// — pode ser importado com segurança em páginas que rolam normalmente, como
// o painel do diagnóstico.
export function BrandLoginStyles() {
  return (
    <style>{`
      @font-face {
        font-family: 'Satoshi';
        src: url('/fonts/satoshi/Satoshi-Regular.woff2') format('woff2');
        font-weight: 400; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'Satoshi';
        src: url('/fonts/satoshi/Satoshi-Italic.woff2') format('woff2');
        font-weight: 400; font-style: italic; font-display: swap;
      }
      @font-face {
        font-family: 'Satoshi';
        src: url('/fonts/satoshi/Satoshi-Medium.woff2') format('woff2');
        font-weight: 500; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'Satoshi';
        src: url('/fonts/satoshi/Satoshi-Bold.woff2') format('woff2');
        font-weight: 700; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'Satoshi';
        src: url('/fonts/satoshi/Satoshi-Black.woff2') format('woff2');
        font-weight: 900; font-style: normal; font-display: swap;
      }

      :root {
        --color-navy:    0   41  51;
        --color-royal:   0   206 255;
        --color-royal-d: 0   165 204;
        --color-mint:    0   206 255;
        --color-amber:   244 243 238;
      }

      .surface-glass {
        background: rgba(255,255,255,0.04);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 24px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.5);
      }

      .btn-primary {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; padding: 15px; border: none; border-radius: 999px; cursor: pointer;
        font-family: 'Satoshi', sans-serif; font-weight: 700; font-size: 0.9rem;
        color: rgb(var(--color-navy));
        background: radial-gradient(120% 140% at 50% -20%, #fff 0%, #d6f5ff 45%, #7fe6ff 100%);
        box-shadow: 0 8px 32px rgba(0,206,255,0.35);
        transition: transform .15s, box-shadow .15s;
      }
      .btn-primary:hover { transform: translateY(-1px); }
      .btn-primary:disabled {
        cursor: not-allowed; box-shadow: none; color: rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.08);
      }
    `}</style>
  )
}
