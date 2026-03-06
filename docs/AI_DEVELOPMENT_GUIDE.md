# PAPPI GESTOR — AI DEVELOPMENT GUIDE

## FINALIDADE

Este documento orienta como **inteligências artificiais e assistentes de código** devem atuar dentro do projeto **Pappi Gestor**.

Seu objetivo é garantir que qualquer código gerado por IA:

- respeite a arquitetura oficial
- mantenha consistência estrutural
- seja adequado para produção
- preserve o padrão do sistema

Este guia deve ser seguido por:

- ChatGPT
- GitHub Copilot
- Cursor AI
- assistentes de código
- automações internas
- qualquer IA que escreva ou modifique código no projeto

---

# PRINCÍPIO FUNDAMENTAL

A IA não deve tratar o projeto como um código genérico.

O Pappi Gestor é:

- um ERP inteligente de food service
- um sistema operacional de restaurante
- uma plataforma de inteligência operacional

Toda implementação deve respeitar esse contexto.

---

# COMO A IA DEVE PENSAR ANTES DE ESCREVER CÓDIGO

Antes de escrever qualquer código, a IA deve responder internamente:

1. Qual módulo do sistema está sendo afetado?
2. Qual camada da arquitetura é responsável por essa lógica?
3. Já existe algo semelhante que pode ser reutilizado?
4. O código respeita a separação de responsabilidades?
5. O código é adequado para produção?

Somente depois dessas respostas o código deve ser gerado.

---

# RESPEITO À ARQUITETURA

A IA deve sempre seguir a estrutura oficial:
src
├ app
├ components
├ hooks
├ lib
├ data
├ shared
└ worker

Nunca criar novos agrupamentos sem necessidade real.

---

# COMO ESCREVER CÓDIGO PARA O PROJETO

O código deve sempre:

- possuir tipagem forte
- ter responsabilidade clara
- seguir a camada correta
- evitar duplicação
- ser reutilizável
- ser legível
- ser pronto para produção

Evitar:

- código experimental
- código incompleto
- lógica espalhada
- acoplamento desnecessário

---

# QUANDO USAR CADA CAMADA

## APP

Usar para:

- rotas
- páginas
- layout
- APIs

Nunca colocar regra pesada aqui.

---

## COMPONENTS

Usar para:

- interface visual
- elementos reutilizáveis
- composição de UI

Componentes devem ser **visuais**.

---

## HOOKS

Usar para:

- lógica de consumo de dados
- comunicação com APIs
- gerenciamento de estado

Sempre preferir hooks quando lógica puder ser abstraída.

---

## LIB

Usar para:

- motores centrais
- integrações externas
- autenticação
- clientes de API
- utilitários estruturais

Se uma função puder ser reutilizada, ela deve estar em `lib`.

---

## DATA

Usar para:

- listas fixas
- catálogos
- dados estáticos

Nunca colocar lógica dinâmica aqui.

---

## SHARED

Usar para:

- tipos globais
- interfaces
- contratos de dados

---

## WORKER

Usar para:

- automações
- tarefas pesadas
- processamento assíncrono
- leitura de documentos
- jobs do sistema

---

# COMO RESPONDER AO USUÁRIO

Quando a IA gerar código, ela deve:

1. indicar o arquivo correto
2. indicar a camada correta
3. explicar brevemente o motivo
4. devolver código pronto para uso

Exemplo de resposta esperada:

Arquivo:
src/lib/engine-compras.ts

Motivo:
motor central reutilizável da lógica de compras.

Código:
(implementação)

---

# COMO CORRIGIR CÓDIGO

Ao receber código para ajuste, a IA deve:

1. identificar a causa do problema
2. identificar a camada correta
3. corrigir sem quebrar arquitetura
4. evitar reescrever tudo sem necessidade
5. manter padrão do projeto

---

# COMO CRIAR NOVA FUNCIONALIDADE

Sempre:

1. identificar módulo do sistema
2. identificar camada correta
3. reutilizar estrutura existente
4. manter padrão do projeto
5. escrever código pronto para produção

---

# ERROS QUE A IA DEVE EVITAR

A IA não deve:

- criar pastas aleatórias
- misturar lógica de domínio com UI
- duplicar lógica existente
- criar utilitários fora de `lib`
- colocar lógica pesada em componentes
- escrever código incompleto
- ignorar tipagem
- ignorar arquitetura oficial

---

# FOCO DO SISTEMA

Toda evolução do código deve fortalecer:

- controle de compras
- inteligência de estoque
- análise de custos
- histórico de preços
- comparação de fornecedores
- automação financeira
- inteligência operacional

---

# FILOSOFIA DO PROJETO

O Pappi Gestor deve:

- reduzir erro humano
- automatizar tarefas
- gerar inteligência operacional
- transformar dados em decisões

---

# IDENTIDADE FINAL

A IA não está trabalhando em um projeto qualquer.

Ela está atuando dentro do **Pappi Gestor**, um sistema operacional inteligente para restaurantes.

Toda evolução do código deve preservar essa visão.
docs
├ ARCHITECTURE_CORE.md
├ SYSTEM_ARCHITECTURE_RULES.md
├ PROJECT_CONTEXT.md
└ AI_DEVELOPMENT_GUIDE.md