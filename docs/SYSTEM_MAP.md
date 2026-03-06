# PAPPI GESTOR — SYSTEM MAP

## FINALIDADE

Este documento descreve o **mapa estrutural do Pappi Gestor**.

Seu objetivo é permitir que qualquer desenvolvedor ou IA compreenda rapidamente:

- os módulos do sistema
- o fluxo de dados
- os motores centrais
- as áreas de inteligência operacional

Este documento funciona como **o mapa do cérebro do sistema**.

---

# VISÃO GERAL DO SISTEMA

O Pappi Gestor é um **sistema operacional inteligente para food service**.

Ele transforma dados operacionais em decisões estratégicas.

O sistema se divide em quatro grandes camadas funcionais:

1. Interface operacional
2. Motores de negócio
3. Inteligência operacional
4. Infraestrutura de dados

---

# MÓDULOS PRINCIPAIS DO SISTEMA

## DASHBOARD

Função:

Centralizar visão geral da operação.

Dados exibidos:

- vendas do dia
- compras recentes
- alertas de estoque
- custos operacionais
- indicadores financeiros

Origem dos dados:

- financeiro
- estoque
- compras
- recebimento

---

## ESTOQUE

Responsável por:

- controle de insumos
- movimentação de estoque
- histórico de consumo
- análise de giro
- curva ABC

Integrações:

- compras
- produtos
- recebimento

---

## COMPRAS

Responsável por:

- gestão de pedidos de compra
- cotação de fornecedores
- comparação de preços
- histórico de valores

Motor central:

engine-compras

---

## LISTA DE COMPRAS

Responsável por:

- geração automática de listas
- sugestões baseadas em consumo
- reposição inteligente

Integrações:

- estoque
- histórico de compras

---

## RECEBIMENTO

Responsável por:

- registro de entrada de mercadorias
- leitura de notas fiscais
- atualização automática de estoque
- registro financeiro de compras

Integrações:

- fornecedores
- estoque
- financeiro

---

## FORNECEDORES

Responsável por:

- cadastro de fornecedores
- histórico de compras
- comparação de preços
- análise de confiabilidade

---

## PRODUTOS

Responsável por:

- cadastro de insumos
- unidade de medida
- categoria
- custo médio

Integrações:

- estoque
- compras
- financeiro

---

## FINANCEIRO

Responsável por:

- contas a pagar
- contas a receber
- fluxo de caixa
- análise de lucro

Integrações:

- compras
- recebimento
- vendas

---

## ASSESSOR IA

Responsável por:

- análise operacional
- sugestões inteligentes
- alertas automáticos
- interpretação de dados

Integrações:

- estoque
- compras
- financeiro
- fornecedores

---

# MOTORES CENTRAIS DO SISTEMA

Os motores centrais ficam na camada:
src/lib

Principais motores:

engine-compras  
gemini  
neuromarketing  
auth  
api

Esses motores concentram a lógica reutilizável do sistema.

---

# FLUXO OPERACIONAL DO SISTEMA

Fluxo típico da operação:
Fornecedores
↓
Compras
↓
Recebimento
↓
Estoque
↓
Produção / Vendas
↓
Financeiro
↓
Dashboard
↓
Inteligência (IA)

A IA interpreta esses dados e gera:

- alertas
- previsões
- sugestões de compra
- análise de custos

---

# INTELIGÊNCIA OPERACIONAL

O sistema deve evoluir para gerar inteligência em:

- previsão de estoque
- sugestão de compra
- análise de custo de insumos
- histórico de preços
- curva ABC
- alertas automáticos
- análise de margem

---

# CAMADAS DO SISTEMA

Arquitetura base:

src
├ app
├ components
├ hooks
├ lib
├ data
├ shared
└ worker

Cada camada possui responsabilidade específica definida nos documentos de arquitetura.

---

# PRINCÍPIO DO SISTEMA

O Pappi Gestor deve sempre:

- reduzir erro humano
- automatizar tarefas
- transformar dados em decisões
- gerar inteligência operacional

---

# VISÃO FINAL

O Pappi Gestor não é apenas um software.

Ele é um **sistema operacional para gestão inteligente de restaurantes**.