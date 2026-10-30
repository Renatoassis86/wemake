// Fonte + tokens + componentes do "hero" de login/acesso da identidade nova
// (navy/royal/mint, Fraunces itálico + Geist, card de vidro, botão pill) —
// extraído de PropostaEstilos.tsx pra evitar reescrever os mesmos valores à
// mão em cada página (proposta/acesso, meu-diagnostico, acesso-escola).
//
// Diferente de PropostaEstilos.tsx, este arquivo NÃO define `body { overflow:
// hidden }` nem nenhuma regra específica do viewer de proposta de tela única
// — pode ser importado com segurança em páginas que rolam normalmente, como
// o painel do diagnóstico.
export function BrandLoginStyles() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,600&family=Geist:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        :root {
          --color-navy:    11  31  68;
          --color-royal:   76  138 222;
          --color-royal-d: 42  105 186;
          --color-mint:    118 243 205;
          --color-amber:   255 204 0;
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
          font-family: 'Geist', sans-serif; font-weight: 700; font-size: 0.9rem;
          color: rgb(var(--color-navy));
          background: radial-gradient(120% 140% at 50% -20%, #fff 0%, #cfe2ff 45%, #9fc1f5 100%);
          box-shadow: 0 8px 32px rgba(96,165,250,0.4);
          transition: transform .15s, box-shadow .15s;
        }
        .btn-primary:hover { transform: translateY(-1px); }
        .btn-primary:disabled {
          cursor: not-allowed; box-shadow: none; color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.08);
        }
      `}</style>
    </>
  )
}
