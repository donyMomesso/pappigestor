PATCH V4 - COMPRA MERCADO + RECEBIMENTO + FINANCEIRO + IA

Este patch adiciona:
- rota /api/compra-mercado para registrar compras escaneadas no módulo Compra Mercado
- rota /api/financeiro/conciliacao para sugerir vínculo entre nota fiscal, boleto e lançamento
- helpers financeiros ampliados
- migration SQL com colunas de origem/conciliação e tabela recebimentos

Como aplicar:
1. Copie os arquivos do patch para o projeto.
2. Rode a migration:
   supabase/migrations/20260313_financeiro_recebimento.sql
   supabase/migrations/20260313_financeiro_compra_ia_v4.sql
3. Garanta as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
4. Reinicie o app.

Observação:
- A tela CompraMercado.tsx já chamava /api/compra-mercado, então essa rota fecha um buraco funcional do projeto atual.
- A conciliação usa regras determinísticas e não depende de IA externa.
