# We Make Customization Guide

Este documento lista todas as mudanças necessárias para transformar o projeto Education em We Make.

## 1. Cores
- **De**: Orange (#d97706, #f59e0b)
- **Para**: Cyan (#5FE3D0) e Blue (#4A7FDB)

## 2. Logos
- Logo de Education: `/images/logo-education.png` (com filter invert)
- Logo de We Make: `/logo-we-make-horizontal.png` (colorido, sem filtro)
- Arkos símbolo: `/images/11_arkos-simbolo-mono-preto.png` (monochromatic)

## 3. Textos Principais
### Header/Nav
- "Formulário da Escola" → "Formulário da Escola" (mantém)

### Hero/Landing
- "Cidade Viva Education" → "We Make"
- "Gestão comercial inteligente e integrada" (mantém)
- "equipe interna da Cidade Viva Education" → "equipe interna da We Make"
- "Gerencie escolas parceiras..." (mantém)

### Escolas Parceiras Block
- "Sua escola quer ser parceira CVE?" → "Sua escola quer ser parceira da We Make?"
- "Conheça o Currículo Paideia" → "Conheça Nossas Soluções"
- Descrição do formulário (mantém conceito)

### Login Card
- "Acesso Restrito — Equipe Interna" (mantém)
- "Entre na plataforma" (mantém)
- Email placeholder: "seu@cidadeviva.org" → "seu@wemake.org"
- "Entrar na Plataforma" (mantém)

### Footer
- Logo Education → Logo We Make (original colors, grande)
- Frase institucional: Nova frase We Make
- Email comercial: "comercial.education@cidadeviva.org" → "comercial@wemake.org"
- Telefone: Atualizar número
- Instagram: "@cidadeviva.education" → "@wemakebr"
- Links úteis: Atualizar para domínios We Make
- Copyright: "© Cidade Viva Education" → "© We Make"

## 4. Videos
- Mantém estrutura: hero.mp4, bg.mp4
- Caminho: `/videos/` (não alterar)

## 5. Design System
- Dark background #0f172a (mantém)
- Text branco (mantém)
- Gradients: Orange → Cyan/Blue

## 6. Arquivos a Customizar
1. `src/app/layout.tsx` - Metadados
2. `src/app/(auth)/login/page.tsx` - Cores, textos, logo
3. `src/app/hub/` - Seções da landing
4. `src/components/hub/HubLanding.tsx` - Estrutura landing
5. `src/components/layout/Footer.tsx` - Footer com Arkos
6. `public/` - Colocar logos We Make

## 7. Estrutura Mantida
- Topbar fixo com navegação
- Hero com video background
- Módulos em grid (3 colunas)
- Login card no hero
- Footer profissional
- Responsive design

