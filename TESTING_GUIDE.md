# Testing Guide - We Make Mobile Premium

## 🧪 Guia Completo de Testes

---

## 📱 Testes de Responsividade

### 1. Chrome DevTools (Recomendado)

#### Abrir Responsive Design Mode
```bash
Windows/Linux: Ctrl + Shift + M
Mac: Cmd + Shift + M
```

#### Testar em Viewports Específicos
```
1. iPhone 12 (375x667)
   → Menu hamburger visível
   → Footer em accordion
   → Formulário com seções colapsáveis
   
2. iPhone SE (320x568)
   → Texto ainda legível
   → Buttons 44px+ de altura
   → Sem horizontal scroll
   
3. iPad (768x1024)
   → Menu hamburger ativo
   → Footer ainda accordion
   → Grids: 1-2 colunas
   
4. Samsung Galaxy S10 (360x740)
   → Compatibilidade Android
   → Touch targets funcionam
   
5. iPhone Landscape (667x375)
   → Menu compacto verticalmente
   → Padding reduzido
   
6. Desktop (1920x1080)
   → Header tradicional visível
   → Footer 3 colunas visível
   → Menu hamburger ESCONDIDO
   → Grids multi-coluna
```

---

## ✋ Testes de Touch

### 1. Buttons & Links
```
Objetivo: Min-height 44px
Teste:
□ Clique em [← Voltar] - deve ter área de toque confortável
□ Clique em [Enviar Formulário] - 44px de altura
□ Clique em [Formulário da Escola] - link no header
□ Clique em menu items no hamburger - each 40px+
```

### 2. Inputs
```
Objetivo: Font-size 16px (sem zoom iOS)
Teste (iOS):
□ Abra em Safari no iPhone
□ Clique em input[type="email"]
□ Confirme: NÃO faz zoom quando digita
□ Repita para input[type="text"], select, textarea
```

### 3. Accordion Sections
```
Objetivo: Chevron animado, expand/collapse suave
Teste:
□ Clique em "1. RESPONSÁVEL" - deve expandir
□ Clique em "2. DADOS DA ESCOLA" - deve expandir, 1 colapsa
□ Clique novamente em "1" - deve colapsar
□ Repita para todas as 5 seções
□ Chevron rotaciona 180° suavemente
```

---

## 📐 Testes de Layout

### Login Page (/login)

#### Mobile (375px)
```
✓ Header: Logo 120px (menor) + hamburger
✓ Menu: Visível após clicar hamburger
✓ Hero: Padding ~1rem, texto é h1 não visível
✓ Form: Width 100%, padding 1.5rem
✓ Footer: Accordion (contatos, módulos, links)
✓ Overlay: Escuro quando menu aberto
✓ Sem scroll horizontal
```

#### Desktop (1200px+)
```
✓ Header: Logo 160px (maior) + link "Formulário"
✓ Menu: NÃO existe (hidden)
✓ Hero: Grid 2 cols (texto esquerda, form direita)
✓ Form: 420px width, centered right
✓ Footer: Grid 3 cols (logo+contatos, módulos, links)
✓ Sem accordion
✓ Hover effects funcionam
```

### Hub Landing (/)

#### Mobile (375px)
```
✓ Nav: Logo + hamburger (não há topbar clássico)
✓ Módulos: 1 coluna, gap 1rem, cards responsive
✓ H1: Escala com vw, legível
✓ Buttons: [Conhecer] e [Entrar] stackados
✓ Footer: Accordion, contatos com ícones
```

#### Desktop (1200px+)
```
✓ Topbar: Logo + menu módulos (3-4 items) + botão Entrar
✓ Módulos: 3 colunas, gap fluido
✓ H1: Maior, com gradient
✓ Buttons: Side-by-side
✓ Footer: 3 colunas, full text
```

### Formulário (/formulario)

#### Mobile (375px)
```
✓ Header: Logo 120px, botão Voltar 44px
✓ Seções: Accordion com chevron
✓ Primeira seção (Responsável): Expandida por default
✓ Outras: Colapsadas
✓ Inputs: Font 16px, no zoom
✓ Buttons: [Salvar] e [Enviar] full width, 44px
✓ Footer text: Responsivo, legível
```

#### Desktop (1200px+)
```
✓ Seções: Todas visíveis, sem accordion
✓ Inputs: Lado a lado em Row components
✓ Cards: Padding 2.5rem, bem espaçados
✓ Buttons: Normal width, não expandido
```

---

## 🎨 Testes Visuais

### Colors (Paleta Preservada)
```
Teste: Abra DevTools → Elements
Procure:
✓ #5FE3D0 (Cyan) - botões, links, badges
✓ #4A7FDB (Blue) - hover states
✓ #0f172a (Dark) - backgrounds
✓ #ffffff (White) - texto light
✓ rgba(255,255,255,.05) - borders
```

### Typography Scale
```
Teste: F12 → Computed styles
Verifique clamp() ranges:
✓ h1: clamp(1.5rem, 5vw, 2.5rem)
✓ h2: clamp(1.25rem, 4vw, 2rem)
✓ h3: clamp(1rem, 3vw, 1.5rem)
✓ p: clamp(0.85rem, 2vw, 1rem)
```

### Spacing (Fluido com clamp)
```
Teste: Inspecione padding/gap
Verifique:
✓ Container padding: clamp(1rem, 4vw, 2rem)
✓ Section gaps: clamp(0.75rem, 2vw, 1.5rem)
✓ Sem valores fixos em CSS
```

---

## ♿ Testes de Acessibilidade

### 1. Touch Targets
```
Teste: F12 → Elements, verifique height
Botões devem ter:
□ min-height: 44px (mobile)
□ min-height: 48px (touch devices via @supports)
□ min-width: 44px
□ Espaçamento mínimo 8px entre targets
```

### 2. Zoom Prevention
```
Teste (iOS):
□ Abra em Safari no iPhone 12
□ Navegue até /formulario
□ Clique em input[type="email"]
□ Verifique: font-size ≥ 16px
□ Confirme: NÃO faz zoom automático
□ Teste com input, select, textarea
```

### 3. Keyboard Navigation
```
Teste:
□ Abra página no desktop
□ Pressione Tab repetidamente
□ Confirme: foco visível em botões/links
□ Confirme: ordem lógica (left-to-right, top-to-bottom)
□ Teste menu hamburger: Tab → Enter abre/fecha
□ Teste accordion: Tab → Enter expande/colapsa
```

### 4. Screen Reader (NVDA/JAWS)
```
Teste (Windows + NVDA):
□ Inicie NVDA
□ Abra /formulario
□ Navegue com setas
□ Confirme: Seções anunciadas como "button"
□ Confirme: Chevron anunciado como "expandido/colapsado"
□ Confirme: Form inputs têm labels associadas
```

### 5. Color Contrast (WCAG AA)
```
Teste: Chrome DevTools → Lighthouse → Accessibility
Verifique:
✓ Foreground vs background ratio ≥ 4.5:1 (normal text)
✓ Ratio ≥ 3:1 (large text, 18pt+)
✓ Passar no Lighthouse (score ≥ 90)
```

### 6. Motion Preference
```
Teste (Windows):
1. Settings → Ease of Access → Display
2. Enable "Show animations"
3. Abra page
4. Confirme: animações funcionam

Teste (Windows):
1. Settings → Ease of Access → Display
2. Disable "Show animations"
3. Abra page
4. Confirme: NO animations, BUT accordion ainda funciona
```

---

## 🔍 Testes Funcionais

### Menu Hamburger
```
Teste:
□ Clique em ☰ icon
  → Menu abre com overlay
  → Overlay tem blur backdrop
  → Menu items visíveis
  
□ Clique em menu item (ex: "Início")
  → Navega para /
  → Menu fecha automaticamente
  
□ Clique em CTA (ex: "Formulário da Escola")
  → Navega para /formulario
  → Menu fecha
  
□ Clique no overlay (fora do menu)
  → Menu fecha
  → Overlay desaparece
  
□ Em desktop (> 768px)
  → Menu hamburger está ESCONDIDO
  → Menu header tradicional aparece
```

### Footer Accordion
```
Teste:
□ Abra /login ou / (mobile, 375px)
□ Scroll para footer
□ Clique em "Contatos" 
  → Expande
  → Mostra email, telefone, WhatsApp
  → Chevron rotaciona 180°
  
□ Clique em "Módulos"
  → Colapsa Contatos
  → Expande Módulos
  
□ Clique novamente em Contatos
  → Abre e fecha suavemente
  
□ Em desktop (> 768px)
  → Footer mostra 3 colunas
  → Nenhum accordion
  → Todos os items sempre visíveis
```

### Formulário Accordion
```
Teste:
□ Abra /formulario (mobile, 375px)
□ Confirme: "1. Responsável" está aberto
□ Confirme: "2. Dados..." estão fechados
□ Clique em "2. Dados..."
  → Abre com animação
  → "1" permanece aberto
  → (Aqui teste se é single-expand ou multi-expand)
  
□ Clique novamente em "2. Dados..."
  → Colapsa
  
□ Repita para seções 3, 4, 5
□ Em desktop (> 768px)
  → Todas as seções expandidas
  → Nenhum accordion, apenas headers como títulos
```

---

## 🚀 Performance Tests

### Lighthouse (Chrome DevTools)
```
Teste:
1. Abra Chrome DevTools (F12)
2. Clique em "Lighthouse"
3. Clique "Analyze page load"
4. Aguarde resultado

Métricas desejadas:
✓ Performance ≥ 90
✓ Accessibility ≥ 90
✓ Best Practices ≥ 90
✓ SEO ≥ 90
```

### Page Load Time
```
Teste (DevTools → Network):
1. Clique em Network tab
2. Hard refresh (Ctrl+Shift+R)
3. Aguarde carregamento

Verificar:
✓ Total size < 2 MB
✓ DOM Interactive < 2s
✓ Load time < 3s
✓ Nenhum erro 404 ou 500
```

### Responsive Image Loading
```
Teste:
□ Abra DevTools → Network
□ Filter: Img
□ Abra /login
□ Confirme: Logo é requisitado
□ Confirme: Tamanho é razoável (< 50KB)
□ Em mobile: Logo não truncado
□ Em desktop: Logo não distorcido
```

---

## 🐛 Bug Hunting Checklist

### Layout Issues
```
□ Horizontal scroll em 375px? (NÃO deve ter)
□ Text cutoff em 320px? (NÃO deve ter)
□ Images distorted? (NÃO deve ter)
□ Buttons hidden under nav? (NÃO deve ter)
□ Form inputs with overlapped labels? (NÃO deve ter)
```

### Color/Contrast Issues
```
□ White text on white background?
□ Yellow button on yellow input?
□ Blue text on blue background?
□ Links visible vs. regular text?
□ Hover states distinguishable?
```

### Touch/Mobile Issues
```
□ Buttons too small to click?
□ Inputs require zoom to type?
□ Dropdown hidden behind keyboard?
□ Form overflow on landscape?
□ Menu overlays content?
```

### Animation Issues
```
□ Chevron animação travada?
□ Menu abre/fecha com delay?
□ Accordion transition choppy?
□ Overlay blur lag?
□ Buttons hover delay?
```

---

## 📋 Pre-Deploy Checklist

```
RESPONSIVIDADE
□ Testado em 320px, 375px, 480px, 768px, 1200px, 1920px
□ Nenhum horizontal scroll em nenhum breakpoint
□ Tipografia legível em todos os tamanhos
□ Imagens escalam sem distorção

TOUCH & MOBILE
□ Touch targets 44px+ em mobile
□ Inputs com font-size 16px+ (sem zoom iOS)
□ Menu hamburger funciona em touch
□ Accordion sections funcionam em touch

ACESSIBILIDADE
□ Lighthouse Accessibility ≥ 90
□ Contraste WCAG AA (4.5:1+)
□ Keyboard navigation completa
□ Screen reader funciona (se testou)
□ prefers-reduced-motion respeitado

DESKTOP COMPATIBILITY
□ Header tradicional visível em desktop
□ Footer em 3 colunas em desktop
□ Menu hamburger ESCONDIDO em desktop
□ Hover effects funcionam em desktop
□ Nenhum breaking changes

PERFORMANCE
□ Lighthouse Performance ≥ 90
□ Load time < 3s
□ Nenhum console errors
□ Nenhum 404s/500s
□ Bundle size reasonable

CODE QUALITY
□ Nenhum console.log debug
□ Props bem tipadas
□ Componentes reutilizáveis
□ CSS organizado em globals.css
□ Documentação completa
```

---

## 🎯 Expected Results

### Login Page (/login)

**Mobile (375px):**
- Logo pequena (120px)
- Hamburger menu funciona
- Form responsivo, legível
- Sem overflow horizontal
- Footer em accordion

**Desktop (1200px+):**
- Logo grande (160px)
- Link "Formulário" no header
- Hero grid 2 cols
- Form 420px à direita
- Footer em 3 colunas

### Hub Landing (/)

**Mobile:**
- Nav com hamburger
- Módulos em 1 coluna
- Buttons stackados
- Footer accordion

**Desktop:**
- Topbar com menu
- Módulos em 3 colunas
- Buttons lado a lado
- Footer 3 colunas

### Formulário (/formulario)

**Mobile:**
- Seções em accordion
- Primeira expandida
- Inputs 16px font
- Buttons full width

**Desktop:**
- Seções expandidas
- Inputs em grid
- Buttons normal width

---

## 🔗 Test URLs

```
Local Development:
http://localhost:3000           → Hub Landing
http://localhost:3000/login     → Login Page
http://localhost:3000/formulario → Formulário

Mobile DevTools:
http://localhost:3000?device=iphone12
http://localhost:3000?device=iphone-se
http://localhost:3000?device=ipad
```

---

## 📞 Test Results Template

```markdown
## Test Result [DATE]

### Device: [iPhone 12 / iPad / Desktop]
### Viewport: [375x667 / 768x1024 / 1920x1080]
### Browser: [Safari / Chrome / Firefox]

### Results:
- [ ] Responsiveness: PASS / FAIL
- [ ] Touch targets: PASS / FAIL
- [ ] Colors: PASS / FAIL
- [ ] Typography: PASS / FAIL
- [ ] Accessibility: PASS / FAIL
- [ ] Performance: PASS / FAIL

### Issues Found:
1. [Issue #1]
2. [Issue #2]

### Notes:
[Any additional observations]
```

---

## 🚀 Go/No-Go Criteria

**GO to Production IF:**
- ✅ All responsivity tests pass
- ✅ All touch/mobile tests pass
- ✅ Lighthouse Accessibility ≥ 90
- ✅ No console errors
- ✅ No horizontal scroll on any device
- ✅ Buttons/inputs 44px+ in size

**NO-GO IF:**
- ❌ Horizontal scroll detected
- ❌ Text cutoff or unreadable
- ❌ Touch targets < 40px
- ❌ iOS inputs trigger unwanted zoom
- ❌ Accessibility score < 80
- ❌ Breaking changes on desktop

---

**Test Guide:** Complete
**Last Updated:** Maio 2026
**Status:** Ready for Testing
