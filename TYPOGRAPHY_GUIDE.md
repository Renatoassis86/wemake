# Guia de Tipografia - We Make

## Análise do Site wemake.tec.br

### Fontes Identificadas

#### Fonte Primária (Headlines/Títulos)
- **Nome**: Inter ou Roboto (Sans-serif moderno)
- **Peso**: 700 (Bold) para títulos principais
- **Tamanho**: 
  - H1: 48-56px
  - H2: 36-42px
  - H3: 28-32px
- **Espaçamento de Linha (Line Height)**: 1.2
- **Cor**: #1a1a1a (Dark) ou #4A7FDB (Blue primário)

#### Fonte Secundária (Corpo/Body Text)
- **Nome**: Inter ou System Font (Sans-serif)
- **Peso**: 400 (Regular)
- **Tamanho**: 16px (base)
- **Espaçamento de Linha**: 1.6
- **Cor**: #333333 (Dark Gray) ou #666666 (Medium Gray)

#### Fonte para CTAs (Buttons/Links)
- **Nome**: Mesmo da primária (Inter/Roboto)
- **Peso**: 600 (Semibold)
- **Tamanho**: 14-16px
- **Transformação**: Uppercase ou normal case
- **Cor**: #FFFFFF (White) em fundo Blue

### Hierarquia Visual Recomendada

```
H1 (Página Title)
├─ Tamanho: 48-56px
├─ Peso: 700
├─ Espaçamento: 1.2
└─ Cor: #1a1a1a ou #4A7FDB

H2 (Seção Title)
├─ Tamanho: 36-42px
├─ Peso: 700
├─ Espaçamento: 1.2
└─ Cor: #1a1a1a ou #4A7FDB

H3 (Subtítulo)
├─ Tamanho: 28-32px
├─ Peso: 600
├─ Espaçamento: 1.3
└─ Cor: #1a1a1a ou #5FE3D0

Body Text
├─ Tamanho: 16px
├─ Peso: 400
├─ Espaçamento: 1.6
└─ Cor: #333333

Small Text (Caption/Helper)
├─ Tamanho: 12-14px
├─ Peso: 400
├─ Espaçamento: 1.5
└─ Cor: #666666
```

### Implementação em Next.js/Tailwind

```css
/* globals.css ou variables.css */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Typography Sizes */
  --text-h1: 3rem; /* 48px */
  --text-h2: 2.25rem; /* 36px */
  --text-h3: 1.875rem; /* 30px */
  --text-base: 1rem; /* 16px */
  --text-sm: 0.875rem; /* 14px */
  --text-xs: 0.75rem; /* 12px */
  
  /* Font Weights */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;
}

body {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--weight-regular);
  line-height: var(--leading-relaxed);
  color: #333333;
}

h1 {
  font-size: var(--text-h1);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  color: #1a1a1a;
}

h2 {
  font-size: var(--text-h2);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
}

h3 {
  font-size: var(--text-h3);
  font-weight: var(--weight-semibold);
  line-height: 1.3;
}

.text-sm {
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
}

.text-xs {
  font-size: var(--text-xs);
}
```

### Implementação com Tailwind CSS

```tsx
// tailwind.config.ts
export default {
  theme: {
    fontFamily: {
      sans: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'sans-serif'
      ],
    },
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1rem', { lineHeight: '1.5rem' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1.2' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    extend: {
      lineHeight: {
        'tight': '1.2',
        'snug': '1.375',
        'normal': '1.5',
        'relaxed': '1.625',
        'loose': '2',
      },
    },
  },
}
```

### Uso em Componentes React

```tsx
// Exemplo de componente Hero
export const HeroSection = () => {
  return (
    <section className="bg-white">
      <h1 className="text-5xl font-bold leading-tight text-gray-900">
        Transforme sua Gestão Comercial
      </h1>
      <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-2xl">
        Plataforma de gestão comercial para educadores, com tecnologia avançada
        e humanização das relações.
      </p>
      <button className="mt-8 px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
        Comece Agora
      </button>
    </section>
  )
}
```

### Paleta de Cores para Texto

```
Primário (Headlines): #1a1a1a (Charcoal/Black)
Secundário (Body): #333333 (Dark Gray)
Terciário (Supporting): #666666 (Medium Gray)
Accent Azul: #4A7FDB (Primary Blue)
Accent Cyan: #5FE3D0 (Primary Cyan)
Light Text (on dark): #FFFFFF (White)
```

### Recomendações

1. **Consistência**: Use sempre Inter como fonte primária
2. **Contrast**: Garanta contraste mínimo de 4.5:1 para acessibilidade
3. **Espaçamento**: Mantenha linha de base de 8px para padding/margins
4. **Responsividade**: Reduza tamanhos em mobile (70-80% do desktop)
5. **Performance**: Implemente `font-display: swap` para otimização

### Mobile Typography Sizes

```
H1: 32px (vs 48px desktop)
H2: 28px (vs 36px desktop)
H3: 24px (vs 30px desktop)
Body: 16px (mantém o mesmo)
Small: 14px (mantém o mesmo)
```

### Links e Recursos

- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
- [Tailwind Typography Plugin](https://tailwindcss.com/docs/typography)
- [Web Font Loading Best Practices](https://web.dev/font-best-practices/)
