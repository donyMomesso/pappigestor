# PAPPI GESTOR — ARCHITECTURE DECISIONS

## FINALIDADE

Este documento registra as decisões arquiteturais importantes do projeto **Pappi Gestor**.

O objetivo é:

- preservar o raciocínio técnico do sistema
- evitar decisões contraditórias no futuro
- registrar o motivo das escolhas arquiteturais
- garantir consistência de evolução do projeto

Cada decisão importante deve ser registrada neste documento.

---

# COMO REGISTRAR UMA DECISÃO

Cada decisão deve seguir o formato abaixo:

DECISION ID  
DATA  
STATUS  
CONTEXTO  
DECISÃO  
CONSEQUÊNCIAS

---

# DECISION 001 — ARQUITETURA BASE DO SISTEMA

DATA  
2026

STATUS  
Ativa

CONTEXTO

O Pappi Gestor precisa ser um sistema escalável capaz de evoluir de uma ferramenta operacional para um ERP inteligente de food service.

Sem uma arquitetura clara, o projeto poderia sofrer com:

- código espalhado
- duplicação de lógica
- dependências desorganizadas
- dificuldade de manutenção

DECISÃO

O sistema adotará uma arquitetura modular baseada em camadas:

- app
- components
- hooks
- lib
- data
- shared
- worker

Cada camada terá responsabilidade clara e separação obrigatória.

CONSEQUÊNCIAS

Benefícios:

- organização previsível
- facilidade de manutenção
- escalabilidade estrutural
- melhor colaboração entre desenvolvedores

Custos:

- maior disciplina arquitetural
- necessidade de respeitar regras do sistema

---

# DECISION 002 — HOOKS COMO CAMADA DE LÓGICA DO FRONTEND

DATA  
2026

STATUS  
Ativa

CONTEXTO

Em aplicações React é comum encontrar lógica pesada diretamente dentro das páginas.

Isso gera:

- componentes grandes
- código difícil de testar
- baixa reutilização

DECISÃO

Toda lógica de consumo de dados deve ser abstraída para **hooks dedicados**.

Exemplos:

useEstoque  
useFinanceiro  
useRecebimento  
useAssessorIA

Páginas devem focar apenas em:

- layout
- composição de componentes
- interação de interface

CONSEQUÊNCIAS

Benefícios:

- melhor separação de responsabilidades
- reutilização de lógica
- código mais legível

---

# DECISION 003 — LIB COMO MOTOR CENTRAL DO SISTEMA

DATA  
2026

STATUS  
Ativa

CONTEXTO

O Pappi Gestor possui motores reutilizáveis como:

- engine de compras
- leitura fiscal
- integração com IA
- autenticação
- utilidades estruturais

Sem uma camada dedicada, esses motores ficariam espalhados.

DECISÃO

Todo motor reutilizável deve nascer em **src/lib**.

Exemplos:

engine-compras.ts  
gemini.ts  
auth.ts  
api.ts

CONSEQUÊNCIAS

Benefícios:

- centralização de inteligência
- reutilização entre módulos
- melhor organização estrutural

---

# DECISION 004 — WORKER PARA PROCESSAMENTO PESADO

DATA  
2026

STATUS  
Ativa

CONTEXTO

Algumas operações do sistema exigem processamento mais pesado:

- leitura de documentos fiscais
- análise de notas
- processamento de dados
- automações

Executar isso diretamente no frontend ou API pode prejudicar desempenho.

DECISÃO

Criar uma camada dedicada chamada **worker** para tarefas assíncronas.

CONSEQUÊNCIAS

Benefícios:

- melhor desempenho
- separação de responsabilidades
- processamento escalável

---

# DECISION 005 — O SISTEMA É UM ERP DE FOOD SERVICE

DATA  
2026

STATUS  
Ativa

CONTEXTO

O projeto poderia facilmente cair no erro de virar apenas:

- um controle de estoque
- um sistema de pedidos
- um painel administrativo simples

Isso limitaria o potencial do produto.

DECISÃO

O Pappi Gestor deve evoluir como:

- ERP de food service
- sistema operacional de restaurante
- plataforma de inteligência operacional

CONSEQUÊNCIAS

Toda evolução deve fortalecer:

- compras
- estoque
- fornecedores
- financeiro
- análise de custos
- inteligência operacional

---

# DECISION 006 — IA COMO CAMADA DE INTELIGÊNCIA

DATA  
2026

STATUS  
Ativa

CONTEXTO

O diferencial do Pappi Gestor será a inteligência operacional baseada em dados.

DECISÃO

O sistema deve integrar IA para:

- leitura de notas fiscais
- sugestão de compra
- análise de custos
- previsão de estoque
- alertas operacionais

CONSEQUÊNCIAS

O sistema evolui de ferramenta operacional para **sistema inteligente de decisão**.

---

# REGRA FINAL

Se uma decisão futura entrar em conflito com decisões registradas neste documento:

A decisão deve ser **avaliada e registrada antes de ser implementada**.