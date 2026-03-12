Base restaurada do backup BKP08032026 via histórico Git interno.

O que foi feito:
- Recuperado o código-fonte completo do backup usando o .git que veio dentro do ZIP.
- Mantida a base antiga por ser a mais segura para voltar a funcionar.
- Copiados apenas alguns arquivos aditivos e de baixo risco do projeto pappigestordrive.
- Removidos caches e pastas pesadas para facilitar substituição limpa.

Recomendado antes de subir:
1. excluir node_modules, .next e caches locais do projeto antigo
2. colar esta pasta no lugar do projeto quebrado
3. rodar npm install
4. rodar npm run build
5. corrigir variáveis do .env.local se necessário
