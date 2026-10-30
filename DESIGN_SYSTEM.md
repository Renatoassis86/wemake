# Design System — We Make

Documenta a identidade visual realmente em uso no código (não um plano — o
que já está implementado). Substitui a versão anterior deste arquivo e o
antigo `TYPOGRAPHY_GUIDE.md` (removido), que descreviam uma paleta
(`#5FE3D0`/`#4A7FDB`, fonte Inter) já abandonada e sem nenhuma correspondência
no código atual.

## Paleta

```
Navy (fundo escuro, texto sobre claro):  #0b1f44
Royal (acento primário):                 #4c8ade
Royal escuro (hover):                    #2a69ba
Mint (acento secundário, eyebrow/links):  #76f3cd
Amber (reservado, pouco usado hoje):      #ffcc00
```

- Em `src/app/globals.css` (`:root`, "Design System v3"), os nomes oficiais
  são `--brand-blue` (royal), `--brand-blue-m` (royal escuro), `--brand-cyan`
  (mint) e `--slate-900` (navy). As variáveis `--amber`/`--amber-light`/
  `--amber-dark` continuam existindo só como apelidos legados desses mesmos
  valores (não são amarelo, apesar do nome) — prefira os nomes `--brand-*`
  em código novo.
- Em `src/components/brand/BrandLoginStyles.tsx`, os mesmos tons aparecem
  como `--color-navy`/`--color-royal`/`--color-royal-d`/`--color-mint`/
  `--color-amber`, em RGB (pra uso com `rgb(var(--x) / alpha)`).
- A família Academia (`src/app/(dashboard)/academia/academia.css`) usa um
  sub-tema deliberadamente diferente — ivory/papel, pra leitura de relatório
  longo (`--ac-ink` = mesmo navy, `--ac-cyan: #2a69ba`, `--ac-paper`/
  `--ac-ivory` em tons quentes). Não é "errado", é outro contexto de leitura.

## Tipografia

- **Fraunces** (serif/display) — títulos e destaques. Itálico, peso 300,
  pros heróis de login/acesso (`/proposta/acesso`, `/meu-diagnostico`,
  `/meu-diagnostico/bem-vindo`). Peso 600/700 não-itálico em títulos de
  relatório/documento.
- **Geist** (sans) — UI e corpo de texto.
- Carregamento: a maior parte do app usa `next/font/google` a partir de
  `src/app/layout.tsx` (nomes de variável legados `--font-inter`/
  `--font-cormorant`/`--font-montserrat`, mantidos de propósito pra não
  precisar editar cada arquivo). As telas de acesso/login (proposta,
  diagnóstico, acesso-escola) carregam via `<link>` do Google Fonts, pelo
  componente `BrandLoginStyles` (ou `PropostaEstilos`, equivalente mas com
  mais CSS específico da proposta comercial).

## Logo

Fonte única: `/public/proposta/logo-white.png` (fundo escuro) e
`/public/proposta/logo-color.png` (fundo claro). É a logo usada em todo o
shell interno (sidebar, topbar, menu mobile), telas de login e na família
Academia. Não usar `/images/we-make-1.png` nem `/academia/brand/logo-*.png`
em código novo — são versões antigas mantidas no disco só por precaução
(podem ter outro consumidor fora do código, como e-mail/PDF), mas sem
nenhuma referência ativa em `src/`.

## Padrões visuais do "hero" de acesso

Usados em `/proposta/acesso`, `/meu-diagnostico/*` e `/acesso-escola`:

- **Card de vidro**: `background: rgba(255,255,255,.04); backdrop-filter:
  blur(24px); border: 1px solid rgba(255,255,255,.1); border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0,0,0,.5)` — classe `.surface-glass`.
- **Botão primário**: pill (`border-radius: 999px`), gradiente radial
  branco→azul claro, texto navy — classe `.btn-primary`.
- **Glow orbs**: blobs com `radial-gradient(circle, rgba(...) 0%, transparent
  70%)`, posicionados `absolute` fora da tela, como fundo decorativo.
- **Eyebrow**: texto uppercase, mint, `letter-spacing: .2em`, `font-weight:
  700`, tamanho ~0.6-0.7rem.

Essas classes vivem em `src/components/brand/BrandLoginStyles.tsx` (versão
enxuta, sem efeitos colaterais de layout) e em
`src/components/comercial/PropostaEstilos.tsx` (versão mais completa, usada
só dentro de `/proposta` e `/propostas-pdf`, que também define
`body { overflow: hidden }` — não importar fora dessas rotas).

## Onde cada módulo busca seus estilos

| Área | Fonte de estilo |
|---|---|
| Comercial, Financeiro\*, Contratos\*, Administrativo\*, Pedidos\*, Adminpanel, Agenda, Calculadora | `src/app/globals.css` (tokens) + Tailwind + estilo inline por página |
| Academia, e os módulos marcados com \* acima (via `ModuloShell`) | `academia.css` + `gestao.css` (tema ivory/papel) |
| `/proposta`, `/propostas-pdf` | `PropostaEstilos.tsx` |
| `/meu-diagnostico`, `/acesso-escola` | `BrandLoginStyles.tsx` |
| `/diagnostico`, `/modulos` | `diagnostico.css`/`modulos.css`, logo nova, mesma paleta |

Não existe redesenho do conteúdo interno (tabelas, cards de KPI, formulários)
de Comercial/Financeiro/Contratos/Adminpanel planejado neste documento — eles
já leem as cores certas de `globals.css`; é um projeto de design à parte, se
algum dia for necessário.
