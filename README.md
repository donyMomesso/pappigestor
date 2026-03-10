# 📊 PappiGestor

Um sistema de gestão desenvolvido em **Next.js 16**, com **Tailwind CSS 4**, **Supabase** e diversos componentes da **Radix UI**.  
O objetivo é oferecer uma plataforma moderna, responsiva e escalável para gerenciamento de dados e processos internos.

---

## 🚀 Tecnologias

- Next.js 16 com suporte a Turbopack
- React 19
- Tailwind CSS 4 + tailwindcss-animate
- Supabase para autenticação e banco de dados
- Radix UI para componentes acessíveis
- Lucide Icons para ícones
- Recharts para gráficos
- XLSX e jsPDF para exportação de dados

---

## 📦 Instalação

Clone o repositório:

git clone https://github.com/donyMomesso/pappigestor.git
cd pappigestor

Instale as dependências:

npm install

---

## ▶️ Rodando o projeto

Ambiente de desenvolvimento:

npm run dev

Build de produção:

npm run build
npm run start

---

## ⚙️ Configuração

Crie um arquivo `.env.local` com suas variáveis de ambiente:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

---

## 📂 Estrutura de pastas

src/
 ├─ app/           # Páginas e layouts
 ├─ components/    # Componentes reutilizáveis
 ├─ contexts/      # Contextos globais
 ├─ hooks/         # Hooks customizados
 ├─ lib/           # Funções utilitárias
 ├─ data/          # Dados estáticos
 └─ styles/        # Arquivos CSS globais

---

## 🛠 Scripts disponíveis

- npm run dev → inicia o servidor de desenvolvimento
- npm run build → gera o build de produção
- npm run start → roda o servidor em produção
- npm run lint → executa o linter

---

## 📌 Status

Projeto em desenvolvimento.  
Funcionalidades principais: autenticação, dashboards, exportação de relatórios e integração com Supabase.

---

## 📝 Começando

Este é um projeto Next.js inicializado com create-next-app.

Primeiro, execute o servidor de desenvolvimento:

npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev

Abra http://localhost:3000 no navegador para ver o resultado.

Você pode começar a editar a página modificando o arquivo app/page.tsx.  
A página é atualizada automaticamente conforme você edita o arquivo.

Este projeto utiliza next/font para otimização e o carregamento automático da Geist, uma nova família de fontes criada pela Vercel.

---

## 📚 Saber mais

- Documentação do Next.js — saiba mais sobre os recursos e a API do Next.js.  
- Aprenda Next.js — um tutorial interativo de Next.js.  
- Repositório do Next.js no GitHub — contribuições e feedback são bem-vindos!

---

## ☁️ Implantação no Vercel

A maneira mais fácil de implantar seu aplicativo Next.js é usar a plataforma Vercel, dos criadores do Next.js.  

Confira a documentação de implantação do Next.js para obter mais detalhes.
