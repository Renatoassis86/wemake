# Mobile Premium Visual Guide - We Make Platform

## 🎨 Transformação Visual

### Login Page (src/app/(auth)/login/page.tsx)

#### Desktop (> 768px)
```
┌─────────────────────────────────────────────────┐
│  Logo    [Formulário da Escola]                 │  ← Header Fixed
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │                  │  │   FORM LOGIN         │ │
│  │  Hero Text       │  │  ✓ Responsive Grid  │ │
│  │  (Hidden mobile) │  │  ✓ Bem proporcionado│ │
│  │                  │  └──────────────────────┘ │
│  └──────────────────┘                           │
│                                                 │
├─────────────────────────────────────────────────┤
│ Contatos | Módulos | Links                      │  ← Footer 3 cols
└─────────────────────────────────────────────────┘
```

#### Mobile (≤ 768px)
```
┌────────────────────┐
│Logo        ☰       │  ← MobileNav Fixed (60px)
├────────────────────┤
│ ☰ Início           │
│   Sobre We Make    │  ← Menu expansível
│   Contato          │
│   [Formulário da..] │  ← CTA destacado
├────────────────────┤
│                    │
│  FORM LOGIN        │  ← Ocupa 100% width
│  ✓ Cards simples   │
│  ✓ Melhor legível  │
│                    │
├────────────────────┤
│ [Logo]             │
│ Contatos  ▼        │  ← Footer em accordion
│ Módulos   ▼        │
│ Links     ▼        │
│                    │
│ © 2026 We Make     │
└────────────────────┘
```

---

### Hub Landing (src/components/hub/HubLanding.tsx)

#### Desktop
```
┌────────────────────────────────────────────┐
│  Logo    Gestão Comercial  Contratos  ...  │  ← Topbar
├────────────────────────────────────────────┤
│                                            │
│  H1 "Gestão comercial inteligente..."      │
│  [Conhecer módulos] [Entrar na plataforma] │
│                                            │
├────────────────────────────────────────────┤
│  MÓDULOS DA PLATAFORMA (3 colunas)         │
│  ┌──────┐  ┌──────┐  ┌──────┐             │
│  │Card 1│  │Card 2│  │Card 3│             │
│  └──────┘  └──────┘  └──────┘             │
│                                            │
├────────────────────────────────────────────┤
│ Contatos | Módulos | Links                 │  ← Footer 3 cols
└────────────────────────────────────────────┘
```

#### Mobile
```
┌─────────────────┐
│Logo       ☰     │  ← MobileNav Fixed
├─────────────────┤
│ ☰ Gestão Com..  │
│   Contratos     │  ← Menu dinâmico
│   Censo Escolar │
│   [Entrar]      │
├─────────────────┤
│                 │
│  H1 "Gestão..." │
│  Padding fluid  │
│  [Conhecer ▼]   │
│                 │
├─────────────────┤
│ MÓDULOS (1 col) │
│ ┌─────────────┐ │
│ │ Card 1      │ │
│ │ (280px min) │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Card 2      │ │
│ └─────────────┘ │
│                 │
├─────────────────┤
│ Logo            │
│ Contatos   ▼    │  ← Footer accordion
│ Módulos    ▼    │
│ Links      ▼    │
│                 │
│ © 2026 We Make  │
└─────────────────┘
```

---

### Formulário (src/app/formulario/page.tsx)

#### Desktop
```
┌─────────────────────────────────────────┐
│  [Logo]              [← Voltar]          │
├─────────────────────────────────────────┤
│              PARCERIA EDUCACIONAL        │  ← Header centered
│              We Make                     │
│  "Preencha o formulário..."             │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │ 1. RESPONSÁVEL                      │ │  ← Sections
│  │ [E-mail: ________________]           │ │     visíveis
│  │                                     │ │
│  │ 2. DADOS DA ESCOLA                  │ │
│  │ [CNPJ: ___] [Razão: ___]           │ │
│  │ ...                                 │ │
│  │                                     │ │
│  │ 3. ACADÊMICAS / 4. LEGAL / 5. FIN  │ │
│  │                                     │ │
│  │ [💾 Salvar] [Enviar Formulário]     │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Mobile
```
┌──────────────────┐
│ Logo   [← Volt] │
├──────────────────┤
│ PARCERIA         │
│ We Make          │
│ Preencha...      │
│                  │
├──────────────────┤
│                  │
│ 1. RESPONSÁVEL ▼ │  ← Accordion
│ [E-mail: __] ✓   │  (expandido)
│                  │
│ 2. DADOS ▼       │  ← Accordion
│ (colapsado)      │  (chevron animado)
│                  │
│ 3. ACADÊMICAS ▼  │
│ (colapsado)      │
│                  │
│ 4. LEGAL ▼       │
│ (colapsado)      │
│                  │
│ 5. FINANCEIRO ▼  │
│ (colapsado)      │
│                  │
│ [💾 Salvar]      │  ← Touch target
│ [Enviar ✓]       │  44px min-height
└──────────────────┘
```

---

## 📊 Componentes Novos

### MobileNav Component
```tsx
<MobileNav
  mobileMenuOpen={mobileMenuOpen}
  setMobileMenuOpen={setMobileMenuOpen}
  menuItems={[
    { label: 'Início', href: '/' },
    { label: 'Sobre', href: '/' },
    { label: 'Contato', href: '/' },
  ]}
  cta={{ label: 'Formulário', href: '/formulario' }}
/>
```

**Features:**
- ☰ Menu hamburger (Menu/X icon)
- Overlay com blur backdrop
- Menu list scrollable
- CTA button destacado em cyan (#5FE3D0)
- Auto-close ao clicar item
- Sem hover em touch devices

---

### MobileFooter Component
```tsx
<MobileFooter sections={[
  {
    title: 'Módulos',
    items: [
      { label: 'Gestão Comercial' },
      { label: 'Gestão de Contratos' },
      // ...
    ]
  },
  {
    title: 'Links',
    items: [
      { label: 'We Make', href: 'https://...' },
      // ...
    ]
  }
]} />
```

**Features:**
- Logo + descrição
- Seção de contatos com ícones
- Accordion com ChevronDown animado
- Primeira seção aberta por default
- Links com hover color
- Copyright footer

---

## 🎯 Design System Mobile

### Tipografia Responsiva

```css
/* H1 - Hero titles */
h1 { font-size: clamp(1.5rem, 5vw, 2.5rem); }

/* H2 - Section titles */
h2 { font-size: clamp(1.25rem, 4vw, 2rem); }

/* H3 - Card titles */
h3 { font-size: clamp(1rem, 3vw, 1.5rem); }

/* Body text */
p { font-size: clamp(0.85rem, 2vw, 1rem); }
```

**Resultado:**
- Mobile: 14-16px (legível, sem zoom)
- Tablet: 15-17px (proporcional)
- Desktop: 16-20px (espaçoso)

---

### Espaçamento Fluido

```css
/* Padding container */
padding: clamp(1rem, 4vw, 2rem);
/* = 16px (mobile) → 32px (desktop) */

/* Gaps entre items */
gap: clamp(0.75rem, 2vw, 1.5rem);
/* = 12px (mobile) → 24px (desktop) */

/* Margin bottom */
margin-bottom: clamp(1rem, 3vw, 2rem);
/* = 16px (mobile) → 32px (desktop) */
```

---

### Touch Targets

```css
/* Minimum 44px (WCAG AA) */
button, a, input, select, textarea {
  min-height: 44px;
  min-width: 44px;
}

/* Touch devices: 48px */
@supports (hover: none) and (pointer: coarse) {
  button, a {
    min-height: 48px !important;
  }
}
```

---

## 🎨 Paleta de Cores

### Primárias (We Make Brand)
```
Cyan:    #5FE3D0  ← Botões, links, badges
Blue:    #4A7FDB  ← Hover, gradientes
Dark:    #0f172a  ← Background, headers
```

### Secundárias
```
White:   #ffffff  ← Texto light
Gray:    rgba(255,255,255,.5)  ← Texto disabled
Border:  rgba(255,255,255,.05) ← Linha separadora
```

---

## 📱 Breakpoints Implementados

| Breakpoint | Tipo | Características |
|-----------|------|---|
| > 768px | Desktop | Headers/footers 3-col, grids multi-col, hovers ativos |
| 768px | Tablet | Menu hamburger, footer accordion, grids reduzidos |
| 480px | Mobile | Single column, padding 1rem, fonts clamp() |
| < 320px | Extra | Font-size 12px, layout ultra-compacto |

---

## ✅ Checklist Visual

### Login Page
- [x] Header: Logo pequena (120px) + hamburger
- [x] Menu: List com border separadores
- [x] Hero: Full width, padding ~1rem
- [x] Form card: Width 100%, padding 1.5rem
- [x] Footer: Accordion com contatos, módulos, links
- [x] Botões: Min-height 44px
- [x] Inputs: Font 16px (sem zoom iOS)

### Hub Landing
- [x] Nav: Logo + hamburger + menu list
- [x] Hero: Responsive h1, 2 buttons stacked mobile
- [x] Módulos: 1 coluna mobile, 3 desktop
- [x] Cards: Padding adaptativo, gap fluido
- [x] Footer: Accordion sections
- [x] Espaçamento: Clamp() em tudo

### Formulário
- [x] Header: Logo 120px, botão voltar 44px
- [x] Seções: Accordion com chevron animado
- [x] Primeira: Sempre aberta (index={0})
- [x] Inputs: Font 16px, min-height 44px
- [x] Buttons: 100% width, 44px height
- [x] Modal: Responsive, não overflow

---

## 🚀 Performance Notes

**Size Impact:** ~8KB (MobileNav + MobileFooter)
**No JS overhead:** CSS clamp() é nativo
**Image optimization:** max-width: 100%, height: auto
**Touch optimization:** @supports (pointer: coarse)

---

## 🔍 Testing Checklist

### Chrome DevTools
- [ ] iPhone 12 (375px): 1 col, hamburger, accordion
- [ ] iPhone SE (320px): Texto legível, sem overflow
- [ ] iPad (768px): Tablet layout (footbridge)
- [ ] Landscape (667x375): Padding reduzido

### Real Device
- [ ] iOS: Nenhum zoom ao clicar input (16px font)
- [ ] Android: Touch targets 44px+ fáceis de tocar
- [ ] Slow 3G: Carrega rápido (sem lazy load)
- [ ] Offline: App sigue funcional

### Accessibility
- [ ] prefers-reduced-motion: Sem animações
- [ ] prefers-color-scheme: Dark mode funciona
- [ ] Keyboard: Tab order correto
- [ ] Screen reader: Menu items anunciados

---

## 📸 Visual Comparison

### Antes (Desktop-only)
```
- Responsivo mas otimizado para Desktop
- Header fixo clássico (200px logo)
- Footer em 3 colunas sempre visível
- Formulário: seções empilhadas (confuso)
- Mobile: cutoff, horizontal scroll
```

### Depois (Mobile Premium)
```
✨ - Layout mobile-first com componentes dedicados
✨ - Header adaptativo (120px mobile, 160px desktop)
✨ - Footer em accordion (tidy, expandível)
✨ - Formulário: accordion (organizado, clean)
✨ - Touch targets 44-48px (fácil de tocar)
✨ - Tipografia fluida (legível em tudo)
✨ - Zero breaking changes (desktop igual)
```

---

Documento atualizado: **Maio 2026**
Versão: **1.0**
