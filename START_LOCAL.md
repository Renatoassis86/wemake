# 🚀 Como Rodar Localmente - We Make Platform

## ⚠️ IMPORTANTE: Limpe o Cache do Navegador!

Se você está vendo a página antiga do Cidade Viva Education, é porque o navegador tem o cache antigo em memória.

## 🔄 Passo a Passo para Rodar

### 1. **Abra o Terminal na pasta do projeto**
```bash
cd D:\app_comercial_We Make
```

### 2. **Instale as dependências** (primeira vez)
```bash
npm install
```

### 3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```
Edite `.env.local` com suas credenciais Supabase se necessário.

### 4. **Limpe o cache do Next.js**
```bash
rm -rf .next
```

### 5. **Inicie o servidor**
```bash
npm run dev
```

Você verá:
```
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

### 6. **Abra no Navegador**
Vá para: **http://localhost:3000**

### 7. **Limpe o Cache do Navegador** ⚠️
Se ainda vê a página antiga:

**Chrome/Edge:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Todo o tempo"
3. Marque "Cookies e outros dados de site"
4. Clique em "Limpar dados"
5. Recarregue a página (Ctrl + R)

**Firefox:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Tudo"
3. Marque "Cookies" e "Cache"
4. Clique em "Limpar"
5. Recarregue a página (Ctrl + R)

---

## ✅ Você Deve Ver

### **Página We Make (Landing Page)**
- Logo WM (Cyan + Blue) no topo
- Título: "Educação Tecnológica de Excelência"
- Subtítulo: "Plataforma completa de gestão comercial para escolas..."
- Botões: "Comece Agora" e "Saiba Mais"
- Seção de Features
- Seção CTA
- Rodapé com links

### **Cores**
- Cyan: #5FE3D0
- Blue: #4A7FDB
- Branco: #FFFFFF

### **Tipografia**
- Font: Inter (Google Fonts)

---

## 🔗 URLs Disponíveis

Quando o servidor está rodando:

```
http://localhost:3000/                  → Landing page (Our Custom)
http://localhost:3000/dashboard         → Dashboard (Full Inherited)
http://localhost:3000/login             → Login (Inherited)
http://localhost:3000/api/health        → API Health Check
```

---

## 🛑 Parar o Servidor

Pressione: **Ctrl + C** no terminal

---

## 🆘 Se Não Funcionar

### **Porta 3000 já está em uso:**
```bash
# Use outra porta
npm run dev -- -p 3001
# Então acesse: http://localhost:3001
```

### **Erro de dependências:**
```bash
# Delete node_modules e reinstale
rm -rf node_modules
npm install
```

### **Erro de compilação:**
```bash
# Limpe o cache do Next.js
rm -rf .next
npm run dev
```

### **Ainda vê página antiga:**
1. Feche o navegador completamente
2. Limpe cache (Ctrl + Shift + Delete)
3. Reabra o navegador
4. Acesse http://localhost:3000

---

## 📁 Estrutura que Você Tem

```
wemake/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing (We Make - NOVO!)
│   │   ├── dashboard/            ← Dashboard (Completo - Herdado)
│   │   ├── api/                  ← APIs (Herdado)
│   │   └── login/                ← Login (Herdado)
│   ├── components/
│   │   ├── ui/                   ← Componentes base
│   │   └── components/           ← Componentes herdados
│   └── lib/
├── public/
│   ├── videos/                   ← Coloque vídeos aqui quando tiver!
│   └── images/
└── package.json
```

---

## 🎬 Próximo: Adicionar Vídeos

Quando tiver os 3 vídeos do Veo3:

1. Crie pasta: `public/videos/`
2. Coloque os 3 MP4s lá
3. Vou atualizar `page.tsx` para mostrar os vídeos
4. Recarregue a página!

---

## 📊 Checklist

- [ ] Terminal aberto na pasta `D:\app_comercial_We Make`
- [ ] `npm install` executado
- [ ] `.env.local` configurado
- [ ] `npm run dev` rodando
- [ ] Navegador aberto em `http://localhost:3000`
- [ ] Vendo página **We Make** (azul/cyan, não Cidade Viva)
- [ ] Cache do navegador limpo

---

**Você deve estar vendo a página We Make com as cores corretas!** 🎉

Se ainda vê Cidade Viva Education, é **definitivamente um problema de cache**.