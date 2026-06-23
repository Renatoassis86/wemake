import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Proposta We Make',
  description: 'Sua proposta de parceria exclusiva We Make',
}

export default function PropostaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400;1,9..144,600&family=Geist:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Geist', sans-serif; background: #0b1f44; overflow: hidden; }

        /* ── We Make design tokens ─────────────────────────────────── */
        :root {
          --color-navy:      11  31  68;
          --color-royal:     76  138 222;
          --color-royal-d:   42  105 186;
          --color-mint:      118 243 205;
          --color-mint-d:    39  168 132;
          --color-amber:     255 204 0;
          --color-ivory:     255 255 255;

          --ease-cinematic:  cubic-bezier(0.16, 1, 0.3, 1);
          --ease-editorial:  cubic-bezier(0.6, 0.05, 0.01, 0.9);
          --dur-fast:        240ms;
          --dur-base:        420ms;
          --dur-slow:        720ms;

          --radius-card:     18px;
          --radius-pill:     999px;

          --shadow-md:       0 8px 24px -8px rgba(2,6,23,0.55);
          --shadow-lg:       0 24px 64px -24px rgba(2,6,23,0.70);
          --shadow-inset:    inset 0 1px 0 rgba(255,255,255,0.06);
          --shadow-royal:    0 12px 40px -8px rgba(76,138,222,0.45);
          --shadow-mint:     0 8px 32px -8px rgba(118,243,205,0.35);
          --shadow-btn:      0 8px 32px -8px rgba(96,165,250,0.55), inset 0 1px 0 rgba(255,255,255,0.6);
          --shadow-btn-h:    0 16px 48px -12px rgba(96,165,250,0.70), inset 0 1px 0 rgba(255,255,255,0.7);

          --gutter:          clamp(1rem, 0.75rem + 1.5vw, 2rem);
          --section-py:      clamp(28px, 4vh, 56px);

          --text-sm:         clamp(0.8125rem, 0.78rem + 0.18vw, 0.875rem);
          --text-base:       clamp(0.9375rem, 0.9rem + 0.2vw, 1rem);
          --text-lg:         clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
          --text-xl:         clamp(1.1875rem, 1.1rem + 0.35vw, 1.4375rem);
          --text-2xl:        clamp(1.375rem, 1.25rem + 0.5vw, 1.75rem);
          --text-3xl:        clamp(1.625rem, 1.45rem + 0.9vw, 2.25rem);
          --text-4xl:        clamp(1.875rem, 1.6rem + 1.25vw, 2.75rem);
          --text-5xl:        clamp(2.125rem, 1.75rem + 2vw, 3.5rem);
          --text-6xl:        clamp(2.5rem, 2rem + 2.5vw, 4.5rem);
          --text-display:    clamp(3rem, 2.2rem + 4vw, 6rem);
        }

        /* ── Notebook / laptop viewport (height ≤ 780px) ──────────── */
        @media (max-height: 780px) {
          :root {
            --section-py:    clamp(20px, 3vh, 36px);
            --text-4xl:      clamp(1.5rem, 1.35rem + 0.75vw, 2rem);
            --text-5xl:      clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem);
            --text-6xl:      clamp(2rem, 1.65rem + 1.75vw, 3rem);
          }
        }

        /* ── Typography helpers ────────────────────────────────────── */
        .font-display { font-family: 'Fraunces', serif; }
        .font-sans    { font-family: 'Geist', sans-serif; }
        .text-balance { text-wrap: balance; }

        .text-gradient-cinematic {
          background: linear-gradient(
            180deg,
            rgb(248 250 252) 0%,
            rgb(248 250 252 / 0.92) 38%,
            rgb(148 175 232 / 0.62) 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .text-gradient-mint {
          background: linear-gradient(135deg, rgb(var(--color-mint)) 0%, rgb(var(--color-royal)) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* ── Surface styles ────────────────────────────────────────── */
        .surface-glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: var(--shadow-md), var(--shadow-inset);
        }
        .surface-glass-ivory {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid rgba(11,31,68,0.08);
          box-shadow: 0 8px 24px -8px rgba(11,31,68,0.1), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        .surface-card-royal {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: var(--shadow-md), var(--shadow-inset);
        }

        /* ── Card hover ────────────────────────────────────────────── */
        .card-lift {
          transition: transform var(--dur-fast) var(--ease-cinematic),
                      box-shadow var(--dur-fast) var(--ease-cinematic),
                      border-color var(--dur-fast) var(--ease-cinematic);
          will-change: transform;
        }
        .card-lift:hover { transform: translateY(-2px); }

        /* ── Button primary (exact site style) ─────────────────────── */
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Geist', sans-serif; font-weight: 600; font-size: 0.9375rem;
          color: #0b1f44; text-decoration: none; white-space: nowrap;
          border: none; border-radius: var(--radius-pill); cursor: pointer;
          padding: 14px 32px;
          background: radial-gradient(120% 140% at 50% -20%, #fff 0%, #cfe2ff 45%, #9fc1f5 100%);
          box-shadow: var(--shadow-btn);
          transition: transform var(--dur-fast) var(--ease-cinematic),
                      box-shadow var(--dur-fast) var(--ease-cinematic);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-btn-h);
        }
        .btn-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font-family: 'Geist', sans-serif; font-weight: 600; font-size: 0.9375rem;
          color: #ffffff; text-decoration: none; white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.12); border-radius: var(--radius-pill); cursor: pointer;
          padding: 14px 32px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
          transition: all var(--dur-fast) var(--ease-cinematic);
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.24); }

        /* ── Keyframes ─────────────────────────────────────────────── */
        @keyframes bob       { 0%,100%{transform:translateY(0)}   50%{transform:translateY(6px)} }
        @keyframes glow-pulse{ 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.85;transform:scale(1.05)} }
        @keyframes aurora    { 0%,100%{transform:rotate(0deg) translate(0,0)} 50%{transform:rotate(15deg) translate(40px,20px)} }
        @keyframes fade-up   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      `}</style>
      {children}
    </>
  )
}
