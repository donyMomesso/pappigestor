# PAPPI GESTOR — SYSTEM ARCHITECTURE RULES

## FINALIDADE

Este documento define as regras obrigatórias de arquitetura do **Pappi Gestor**.

Seu objetivo é impedir desorganização estrutural, proteger a escalabilidade do sistema e garantir que qualquer evolução respeite o núcleo oficial do projeto.

Estas regras devem ser seguidas por:

- desenvolvedores
- IAs
- GPTs personalizados
- copilots
- automações internas
- qualquer agente que gere, corrija ou refatore código no projeto

---

## REGRA 1 — A ARQUITETURA É LEI

A arquitetura oficial do Pappi Gestor deve ser considerada regra obrigatória.

Nenhuma solução pode ser aceita se:

- violar a separação de camadas
- criar dependências desnecessárias
- espalhar lógica fora da camada correta
- enfraquecer a legibilidade do projeto
- comprometer a escalabilidade futura

Se houver conflito entre velocidade e arquitetura, a arquitetura vence.

---

## REGRA 2 — É PROIBIDO TRATAR O PROJETO COMO GENÉRICO

O Pappi Gestor não é um projeto genérico.

Toda resposta, código, refatoração ou proposta deve considerar que o sistema é:

- um ERP inteligente de food service
- um sistema operacional de restaurante
- uma plataforma com foco em compras, estoque, financeiro e inteligência operacional

Soluções genéricas que ignorem esse contexto devem ser rejeitadas.

---

## REGRA 3 — ESTRUTURA OFICIAL OBRIGATÓRIA

Toda implementação deve respeitar a estrutura oficial abaixo:

```text
src
├ app
│  ├ api
│  ├ auth
│  ├ cadastro
│  ├ login
│  ├ onboarding
│  │
│  ├ app
│  │  ├ dashboard
│  │  ├ estoque
│  │  ├ financeiro
│  │  ├ compras
│  │  ├ lista-compras
│  │  ├ recebimento
│  │  ├ fornecedores
│  │  ├ produtos
│  │  ├ configuracoes
│  │  └ assessor-ia
│  │
│  ├ layout.tsx
│  ├ providers.tsx
│  └ page.tsx
│
├ components
│  ├ ui
│  ├ layout
│  ├ dashboard
│  ├ onboarding
│  └ ia
│
├ hooks
│  ├ useAppAuth.ts
│  ├ useEstoque.ts
│  ├ useFinanceiro.ts
│  ├ useRecebimento.ts
│  └ useAssessorIA.ts
│
├ lib
│  ├ supabaseClient.ts
│  ├ supabaseServer.ts
│  ├ auth.ts
│  ├ api.ts
│  ├ engine-compras.ts
│  ├ gemini.ts
│  └ neuromarketing.ts
│
├ data
├ shared
└ worker

REGRA 4 — RESPONSABILIDADE DE CADA CAMADA
APP

Responsável por:

rotas

páginas

layout

providers

APIs

Não deve concentrar regra de domínio pesada.

COMPONENTS

Responsável por:

UI

blocos visuais

componentes reutilizáveis

composição visual

Não deve conter lógica de negócio complexa.

HOOKS

Responsável por:

consumo de dados

integração com APIs

gerenciamento de estado

abstração da lógica do frontend

Sempre usar hooks quando a lógica puder ser abstraída da página.

LIB

Responsável por:

motores centrais

integrações externas

autenticação

clientes de API

utilitários estruturais

inteligência reutilizável

Qualquer motor central deve preferencialmente nascer em lib.

DATA

Responsável por:

dados fixos

catálogos

listas padrão

configurações estáticas

SHARED

Responsável por:

tipos globais

interfaces

contratos compartilhados

WORKER

Responsável por:

automações

tarefas pesadas

processamento assíncrono

leitura e análise de documentos

jobs internos

REGRA 5 — PROIBIÇÕES ABSOLUTAS

É proibido:

colocar lógica pesada dentro de componentes

colocar regra de domínio forte dentro de páginas

duplicar lógica reutilizável

criar utilitário solto fora de lib

misturar lógica visual com lógica operacional

refatorar apenas por estética

mover arquivos de camada sem justificar

criar gambiarra temporária como solução final

quebrar padrão consolidado no projeto

REGRA 6 — COMO IMPLEMENTAR NOVA FUNCIONALIDADE

Toda nova funcionalidade deve seguir esta ordem mental:

identificar a área do sistema

identificar a camada correta

reaproveitar estrutura existente

evitar duplicação

garantir tipagem forte

manter consistência com o núcleo do projeto

entregar solução pronta para produção

Toda implementação deve informar, quando relevante:

onde o arquivo deve ser criado

por que ele pertence àquela camada

quais partes podem ser reutilizadas

como manter o padrão do sistema

REGRA 7 — COMO CORRIGIR CÓDIGO

Ao receber código para ajuste:

diagnosticar a causa real

entender a camada correta

corrigir sem destruir a arquitetura existente

evitar reescrever tudo sem necessidade

devolver solução consistente com o padrão do projeto

Correções devem priorizar:

raiz do problema

clareza

tipagem

compatibilidade com produção

REGRA 8 — COMO REFATORAR

Refatoração só é válida se melhorar:

clareza

reutilização

separação de responsabilidade

manutenção

escalabilidade

legibilidade

segurança estrutural

Não refatorar apenas para estética.

REGRA 9 — PRODUÇÃO PRIMEIRO

Todo código deve ser pensado como código de produção.

Isso significa:

tipagem forte

organização previsível

nomes claros

responsabilidades separadas

baixo acoplamento

fácil manutenção

pronto para crescer

Não entregar soluções improvisadas como finais.

REGRA 10 — O SISTEMA DEVE PENSAR COMO SaaS

O Pappi Gestor deve evoluir como produto.

Toda solução deve considerar:

multiárea operacional

crescimento modular

reaproveitamento entre restaurantes

inteligência operacional

automação

governança da arquitetura

REGRA 11 — ÁREAS DE INTELIGÊNCIA PRIORITÁRIAS

Toda evolução estratégica deve fortalecer:

leitura de NFC-e

leitura fiscal

histórico de preço

comparação de fornecedores

sugestão de compra

previsão de estoque

custo de insumos

margem de lucro

curva ABC

alertas inteligentes

automação financeira

inteligência operacional

REGRA 12 — CRITÉRIO DE ACEITAÇÃO

Uma solução só é válida se:

funciona

respeita a arquitetura

mantém consistência com o projeto

não enfraquece o núcleo existente

é legível

é reutilizável

é escalável

é adequada para produção

REGRA 13 — IDENTIDADE FINAL DO AGENTE TÉCNICO

Qualquer agente técnico neste projeto deve assumir:

que não está em um projeto genérico

que a arquitetura oficial é obrigatória

que a função principal é proteger o núcleo do sistema

que velocidade não justifica bagunça

que simplicidade com estrutura é melhor que pressa com improviso


---

# ✅ Agora ele está:

✔ Markdown válido  
✔ Estrutura correta  
✔ Compatível com GitHub  
✔ Compatível com GPT  
✔ Compatível com documentação técnica  

---

💡 Dony, um detalhe importante:

Com os três arquivos:


docs/
├ ARCHITECTURE_CORE.md
├ SYSTEM_ARCHITECTURE_RULES.md
└ PROJECT_CONTEXT.md


você já criou **o cérebro oficial do Pappi Gestor**.

Mas existe um **quarto arquivo que muda tudo** e faz qualquer GPT trabalhar perfeitamente no projeto:


AI_DEVELOPMENT_GUIDE.md


Ele define **como a IA deve escrever código dentro do seu sistema**.

Se quiser, eu te entrego ele também — e isso fecha **100% o núcleo técnico do projeto**.