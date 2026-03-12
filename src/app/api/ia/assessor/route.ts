import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DashboardStats = {
  produtosBaixoEstoque: number;
  itensComprar: number;
  valorCotacaoPendentes: number;
  produtosTotal: number;
};

type Body = {
  stats: DashboardStats;
  user?: { firstName?: string };
  context?: { nowISO?: string };
};

function basicAssessor(stats: DashboardStats, firstName?: string) {
  const nome = firstName ? `, ${firstName}` : "";
  const tags: string[] = [];
  const actions: Array<{ title: string; href: string; variant?: "default" | "outline"; intent?: "urgent" | "normal" }> = [];

  // Neuro gatilhos: urgência / clareza / próximo passo
  if (stats.produtosBaixoEstoque >= 6) {
    tags.push("urgência", "rutura", "operação");
    actions.push({ title: "Abrir Lista de Compras", href: "/app/lista-compras", variant: "default", intent: "urgent" });
    actions.push({ title: "Ver Estoque", href: "/app/estoque", variant: "outline", intent: "normal" });

    return {
      message:
        `Bom dia${nome}. Hoje é dia de execução: você tem ${stats.produtosBaixoEstoque} itens em rutura/alerta. ` +
        `Se você resolver isso agora, você protege a operação da noite. ` +
        `Próximo passo: abra a Lista de Compras e gere as urgências.`,
      actions,
      tags,
    };
  }

  if (stats.itensComprar > 0) {
    tags.push("compras", "cotação", "rotina");
    actions.push({ title: "Cotar no WhatsApp", href: "/app/lista-compras", variant: "default", intent: "urgent" });
    actions.push({ title: "Compra Rápida", href: "/app/compra-mercado", variant: "outline", intent: "normal" });

    return {
      message:
        `Olá${nome}. Sua equipe já registrou ${stats.itensComprar} itens pendentes. ` +
        `Se você disparar cotação agora, você cria previsibilidade de custo e evita compra no susto. ` +
        `Quer operar no modo rápido? Abra a Lista e dispare os fornecedores.`,
      actions,
      tags,
    };
  }

  tags.push("controle", "melhoria", "estratégia");
  actions.push({ title: "Analisar Estoque", href: "/app/estoque", variant: "outline", intent: "normal" });
  actions.push({ title: "Compra Rápida", href: "/app/compra-mercado", variant: "outline", intent: "normal" });

  return {
    message:
      `Tudo sob controle${nome}. Sem urgências de rutura e sem compras pendentes. ` +
      `Hoje é dia de margem: olhe o que mais vende e o que mais dá lucro. ` +
      `Se quiser, eu gero sugestões de foco (top 3 itens) assim que você ativar o módulo de inteligência.`,
    actions,
    tags,
  };
}

/**
 * Aqui entra DISC (perfil do operador) e Neuro (gatilhos) no prompt.
 * Quando você plugar sua IA, use esse “prompt base” pra manter padrão.
 */
function buildPrompt(body: Body) {
  const firstName = body.user?.firstName || "";
  const s = body.stats;

  return `
Você é o "Assessor Operacional" do PappiGestor (pizzaria).
Objetivo: reduzir rutura, reduzir compra no susto, aumentar previsibilidade e margem.

Use Neuro:
- clareza (1 frase),
- urgência quando necessário,
- próximo passo único (call-to-action).

Use DISC para tom:
- D (direto): quando houver risco (rutura alta).
- I (motivador): quando houver tarefas pendentes.
- S (calmo): quando tudo estiver ok.
- C (preciso): inclua números curtos.

Dados:
- firstName: ${firstName}
- produtosBaixoEstoque: ${s.produtosBaixoEstoque}
- itensComprar: ${s.itensComprar}
- produtosTotal: ${s.produtosTotal}

Responda em JSON:
{
  "message": "texto curto e forte",
  "actions": [{"title":"", "href":"", "variant":"default|outline", "intent":"urgent|normal"}],
  "tags": ["..."]
}
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // ✅ validação mínima
    if (!body?.stats) {
      return NextResponse.json({ error: "stats ausente" }, { status: 400 });
    }

    // 🔌 AQUI você pluga sua IA (OpenAI/Gemini/etc).
    // Se você ainda “não tem plano / não quer gastar agora”, fica no basicAssessor.
    const IA_ENABLED = false;

    if (!IA_ENABLED) {
      const basic = basicAssessor(body.stats, body.user?.firstName);
      return NextResponse.json(basic);
    }

    // Exemplo do que você vai usar quando ligar a IA:
    // const prompt = buildPrompt(body);
    // const ai = await callYourAI(prompt);
    // return NextResponse.json(ai);

    const prompt = buildPrompt(body);
    return NextResponse.json({
      message: "IA ligada mas ainda não integrada. Prompt pronto para plugar.",
      actions: [{ title: "Configurar IA", href: "/app/configuracoes", variant: "outline", intent: "normal" }],
      tags: ["setup", "ia"],
      promptPreview: prompt.slice(0, 180) + "...",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro interno" }, { status: 500 });
  }
}
