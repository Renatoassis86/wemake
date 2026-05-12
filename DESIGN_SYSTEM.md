# Design System - We Make Plataforma Comercial

## 1. Paleta de Cores

### Cores Primárias
```
Cyan/Mint Primary:    #5FE3D0  (RGB: 95, 227, 208)
Blue Primary:         #4A7FDB  (RGB: 74, 127, 219)
White:                #FFFFFF  (RGB: 255, 255, 255)
```

### Cores Secundárias
```
Dark Text:            #1a1a1a  (RGB: 26, 26, 26)
Dark Gray:            #333333  (RGB: 51, 51, 51)
Medium Gray:          #666666  (RGB: 102, 102, 102)
Light Gray:           #f8f9fa  (RGB: 248, 249, 250)
Border Gray:          #e5e7eb  (RGB: 229, 231, 235)
```

### Cores Semânticas
```
Success:              #10b981  (Verde)
Warning:              #f59e0b  (Âmbar)
Danger/Error:         #ef4444  (Vermelho)
Info:                 #3b82f6  (Azul Info)
```

### Gradientes
```
Warm Gradient:        #5FE3D0 → #4A7FDB (left to right)
Cool Gradient:        #4A7FDB → #5FE3D0 (top to bottom)
Dark Gradient:        #1a1a1a → #333333
```

---

## 2. Tipografia

### Fonte Principal
```
Family:               Inter
Fallback:             -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Weights:              400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
Import:               https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap
```

### Escalas de Tamanho
```
H1:    48px / 56px    (font-weight: 700, line-height: 1.2)
H2:    36px / 42px    (font-weight: 700, line-height: 1.2)
H3:    28px / 32px    (font-weight: 600, line-height: 1.3)
Body:  16px           (font-weight: 400, line-height: 1.6)
Small: 14px           (font-weight: 400, line-height: 1.5)
Tiny:  12px           (font-weight: 400, line-height: 1.4)
```

---

## 3. Espaçamento (8px base)

```
xs:     4px
sm:     8px
md:     16px
lg:     24px
xl:     32px
2xl:    48px
3xl:    64px
4xl:    80px
```

---

## 4. Componentes Principais

### Botões

#### Primary Button
```
Background:           #4A7FDB (Blue)
Text Color:           #FFFFFF (White)
Padding:              12px 24px (vertical x horizontal)
Border Radius:        8px
Font Weight:          600
Font Size:            16px
Transition:           0.3s ease
Hover:                Darken 10% (#3a6fb5)
Active:               Darken 20% (#2a5f95)
Disabled:             Opacity 50%
```

#### Secondary Button
```
Background:           #5FE3D0 (Cyan)
Text Color:           #1a1a1a (Dark)
Padding:              12px 24px
Border Radius:        8px
Font Weight:          600
Hover:                Darken 10% (#4fc9b8)
```

#### Ghost Button
```
Background:           Transparent
Border:               2px solid #4A7FDB (Blue)
Text Color:           #4A7FDB (Blue)
Padding:              10px 22px (ajustado para border)
Hover:                Background #4A7FDB, Text White
```

### Cards

```
Background:           #FFFFFF (White)
Border:               1px solid #e5e7eb (Border Gray)
Border Radius:        12px
Padding:              24px
Box Shadow:           0 1px 3px rgba(0,0,0,0.1)
Hover Shadow:         0 4px 6px rgba(0,0,0,0.1)
Transition:           0.3s ease
```

### Input Fields

```
Background:           #FFFFFF (White)
Border:               1px solid #e5e7eb
Border Radius:        8px
Padding:              12px 16px
Font Size:            16px
Focus:                Border #4A7FDB, Shadow 0 0 0 3px rgba(74,127,219,0.1)
Placeholder:          #999999 (Gray)
```

### Navigation Bar

```
Background:           #FFFFFF (White)
Height:               64px
Padding:              0 32px
Shadow:               0 1px 3px rgba(0,0,0,0.1)
Logo Size:            32px (height)
Text Color:           #333333
Active Link:          #4A7FDB (Blue) with underline
```

---

## 5. Efeitos e Animações

### Transições Padrão
```
Duration:             300ms (0.3s)
Timing Function:      ease-in-out
Propriedades:         color, background-color, border-color, box-shadow, opacity
```

### Hover Effects
```
Buttons:              Scale 1.02 + Brighten/Darken cor
Cards:                Scale 1.02 + Aumentar shadow
Links:                Underline aparece / Cor muda para Primary
```

### Loading States
```
Skeleton:             Animação de pulso com fundo #e5e7eb
Spinner:              Rotação contínua em #4A7FDB
Duration:             0.8s

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 6. Breakpoints (Responsive)

```
Mobile (xs):          < 640px
Tablet (sm):          640px - 768px
Tablet (md):          768px - 1024px
Desktop (lg):         1024px - 1280px
Desktop (xl):         1280px - 1536px
Large Desktop (2xl):  > 1536px
```

---

## 7. Ícones

```
Size S:               16px (labels, badges)
Size M:               24px (button icons, list items)
Size L:               32px (section headers, hero)
Size XL:              48px (hero sections, featured)

Colors:
Primary:              #4A7FDB (Blue)
Secondary:            #5FE3D0 (Cyan)
Gray:                 #666666
White:                #FFFFFF (on dark backgrounds)

Library Recomendada:  Heroicons, Feather Icons, ou Material Icons
```

---

## 8. Implementação Tailwind

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    colors: {
      white: '#FFFFFF',
      cyan: {
        50: '#f0fdfc',
        100: '#ccfbf1',
        500: '#5FE3D0',
        600: '#4fc9b8',
      },
      blue: {
        50: '#f0f9ff',
        600: '#4A7FDB',
        700: '#3a6fb5',
      },
      gray: {
        900: '#1a1a1a',
        800: '#333333',
        600: '#666666',
        100: '#f8f9fa',
        200: '#e5e7eb',
      },
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    spacing: {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      6: '1.5rem',
      8: '2rem',
      12: '3rem',
      16: '4rem',
      24: '6rem',
      32: '8rem',
    },
    borderRadius: {
      sm: '4px',
      base: '8px',
      lg: '12px',
      full: '9999px',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
  },
}
```

---

## 9. Padrões de Layout

### Hero Section
```
Height:               600px - 800px
Padding:              80px (top/bottom), 32px (left/right)
Max Content Width:    1200px
Background:           Gradiente ou cor sólida
Video/Image:          Full width with overlay
Text Alignment:       Center ou Left
```

### Content Section
```
Max Width:            1200px
Padding:              80px (top/bottom), 32px (left/right)
Column Gap:           32px
Grid Columns:         12 (em desktop)
```

### Card Grid
```
Columns (Desktop):    3 colunas (384px cada)
Columns (Tablet):     2 colunas
Columns (Mobile):     1 coluna
Gap:                  24px
Padding Container:    32px
```

---

## 10. Acessibilidade

```
Contrast Mínimo:      4.5:1 (para texto normal)
Focus States:         Sempre visível (outline ou background)
ARIA Labels:          Em ícones e buttons sem texto
Keyboard Navigation:  Suportado em todos os componentes interativos
Color Não Único:      Usar ícones/padrões além de cores
```

---

## 11. Performance

```
Font Loading:         font-display: swap
Image Optimization:   WebP + Fallback JPG
Icon Format:          SVG (preferred)
CSS-in-JS:            Tailwind (pré-processado)
Animation Duration:   < 500ms para melhor percepção
Lazy Loading:         Implementar para imagens abaixo da fold
```

---

## 12. Componentes Reutilizáveis

### Lista Completa
- ✅ Button (Primary, Secondary, Ghost, Icon)
- ✅ Card (Default, Elevated, Outlined)
- ✅ Input (Text, Email, Password, Search)
- ✅ Textarea
- ✅ Select/Dropdown
- ✅ Checkbox
- ✅ Radio Button
- ✅ Badge/Tag
- ✅ Alert (Success, Warning, Error, Info)
- ✅ Modal/Dialog
- ✅ Toast Notification
- ✅ Loading Spinner
- ✅ Skeleton Loader
- ✅ Breadcrumb
- ✅ Pagination
- ✅ Table
- ✅ Navigation Bar
- ✅ Sidebar
- ✅ Footer
- ✅ Hero Section

---

## 13. Tokens CSS

```css
:root {
  /* Colors */
  --color-primary-cyan: #5FE3D0;
  --color-primary-blue: #4A7FDB;
  --color-white: #FFFFFF;
  --color-text-dark: #1a1a1a;
  --color-text-gray: #666666;
  --color-border: #e5e7eb;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-h1: 3rem;
  --font-size-h2: 2.25rem;
  --font-size-base: 1rem;
  --font-weight-bold: 700;
  --font-weight-semibold: 600;
  --font-weight-regular: 400;
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;

  /* Spacing */
  --spacing-unit: 8px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Z-index */
  --z-dropdown: 1000;
  --z-modal: 1050;
  --z-tooltip: 1100;
}
```

---

## 14. Checklist de Implementação

- [ ] Setup Next.js com Tailwind CSS
- [ ] Implementar fonte Inter via Google Fonts
- [ ] Criar arquivo de configuração de cores (tailwind.config.ts)
- [ ] Criar componentes base (Button, Card, Input, etc)
- [ ] Implementar design tokens em CSS
- [ ] Criar Layout principal (Header, Navigation, Footer)
- [ ] Implementar página inicial com Hero Section
- [ ] Integrar vídeos (3 videos Veo3)
- [ ] Criar página de Gestão de Contratos
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Testar acessibilidade (WCAG 2.1 AA)
- [ ] Otimizar performance (Lighthouse score > 90)
- [ ] Documentação de componentes (Storybook ou similar)

---

## Recursos Externos

- **Figma Kit**: [Criar um design kit baseado neste design system]
- **Componentes**: [Radix UI, Headless UI, ou Shadcn/UI como base]
- **Ícones**: [Heroicons.com ou Feathericons.dev]
- **Cores**: [Accessible Colors, WebAIM Contrast Checker]
- **Tipografia**: [Google Fonts, Inter]

