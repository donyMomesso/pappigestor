PAPPI GESTOR — DESIGN SYSTEM
Versão: 1.0
Local recomendado: /DESIGN_SYSTEM_PAPPI.txt na raiz do projeto

==================================================

1. OBJETIVO
   ==================================================

Este documento define o padrão visual oficial do Pappi Gestor.

Ele garante que todo o sistema mantenha:

* consistência visual
* identidade forte
* boa experiência mobile
* padronização entre páginas
* facilidade de manutenção

Todo desenvolvedor que trabalhar no projeto deve seguir estas regras.

==================================================
2. PRINCÍPIOS VISUAIS
=====================

O design do Pappi segue cinco princípios:

1. Simplicidade
2. Rapidez de leitura
3. Hierarquia clara
4. Ações destacadas
5. Mobile First

O sistema deve parecer:

* moderno
* rápido
* profissional
* confiável
* agradável de usar

==================================================
3. PALETA DE CORES
==================

COR PRINCIPAL

Laranja Pappi
HEX: #FF6B35

Uso:

* botões principais
* ações importantes
* indicadores positivos
* destaques do sistema

---

COR SECUNDÁRIA

Preto
HEX: #000000

Uso:

* textos principais
* menus
* header
* contraste

---

BRANCO

HEX: #FFFFFF

Uso:

* fundo principal
* cards
* áreas de leitura

---

CINZA CLARO

HEX: #F5F5F5

Uso:

* background secundário
* separação de blocos

---

CINZA MÉDIO

HEX: #9CA3AF

Uso:

* texto secundário
* labels
* descrições

---

CINZA ESCURO

HEX: #374151

Uso:

* textos fortes
* subtítulos

==================================================
4. GRADIENTE PADRÃO
===================

Gradiente principal do sistema:

linear-gradient(135deg, #FF6B35 0%, #000000 100%)

Uso recomendado:

* header do app
* telas de onboarding
* banners
* seções de destaque

==================================================
5. TIPOGRAFIA
=============

HEADLINES

Fonte: Poppins

Usada para:

* títulos
* números grandes
* dashboards
* cabeçalhos

Pesos recomendados:

600
700

---

TEXTO DO SISTEMA

Fonte: Inter

Usada para:

* textos
* tabelas
* formulários
* descrições

Pesos recomendados:

400
500
600

==================================================
6. ANIMAÇÕES
============

As animações devem ser rápidas e sutis.

Nunca exageradas.

---

BOUNCE

Uso:

* confirmação de ação
* botões de destaque

Classe exemplo:

animate-bounce

---

PULSE

Uso:

* carregamento
* indicadores
* notificações

Classe exemplo:

animate-pulse

---

HOVER

Todo botão deve ter hover.

Exemplo:

hover:scale-105
transition-all duration-200

==================================================
7. COMPONENTES PADRÃO
=====================

BOTÃO PRINCIPAL

background: #FF6B35
color: white

Hover:

#e55a2b

---

BOTÃO SECUNDÁRIO

background: white
border: 1px solid #e5e7eb

---

CARDS

background: white
border-radius: 12px
shadow: sm
padding: 16px

---

INPUTS

border-radius: 8px
border: 1px solid #e5e7eb
padding: 10px

Focus:

border-color: #FF6B35

==================================================
8. SISTEMA DE ESPAÇAMENTO
=========================

Escala padrão:

4px
8px
12px
16px
24px
32px
48px
64px

Regras:

cards → 16px
seções → 24px
blocos grandes → 32px ou mais

==================================================
9. RESPONSIVIDADE
=================

O sistema é Mobile First.

Breakpoints recomendados:

sm 640px
md 768px
lg 1024px
xl 1280px

Regras:

* botões grandes no mobile
* grids adaptáveis
* menus simplificados

==================================================
10. ÍCONES
==========

Biblioteca padrão:

lucide-react

Motivos:

* leve
* moderna
* consistente
* fácil de manter

==================================================
11. DASHBOARD

O dashboard deve:

* destacar métricas principais
* usar cores para indicar status
* evitar poluição visual
* priorizar leitura rápida

==================================================
12. REGRAS IMPORTANTES

Nunca:

* misturar paletas diferentes
* usar fontes fora do padrão
* exagerar em animações
* quebrar o spacing padrão

Sempre:

* usar a paleta definida
* usar componentes padrão
* manter consistência visual

==================================================
13. EXTENSÕES FUTURAS

Este design system já prevê suporte para:

* dark mode
* temas por empresa
* personalização por plano

==================================================
RESUMO

Cores principais:

Laranja: #FF6B35
Preto: #000000
Branco: #FFFFFF
Cinza claro: #F5F5F5
Cinza médio: #9CA3AF
Cinza escuro: #374151

Fontes:

Poppins → títulos
Inter → textos

Gradiente principal:

#FF6B35 → #000000   