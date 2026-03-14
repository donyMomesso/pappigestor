import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type StatusPagamento = "pendente" | "pago";

type ItemNfce = {
  codigo?: string;
  descricao?: string;
  quantidade?: number;
  unidade?: string;
  valor_unitario?: number;
  valor_total?: number;
};

type DadosNfce = {
  emitente?: {
    razao_social?: string;
    nome_fantasia?: string;
    cnpj?: string;
    endereco?: string;
  };
  itens?: ItemNfce[];
  totais?: {
    subtotal?: number;
    desconto?: number;
    acrescimo?: number;
    total?: number;
  };
  pagamento?: {
    forma?: string;
    valor_pago?: number;
    troco?: number;
  };
  dados_nfce?: {
    numero?: string;
    serie?: string;
    data_emissao?: string;
    chave_acesso?: string;
  };
};

interface LancamentoInsert {
  empresa_id: string;
  data_pedido: string;
  fornecedor: string;
  categoria: string;
  valor_previsto: number;
  is_boleto_recebido: boolean;
  valor_real: number | null;
  vencimento_real: string | null;
  status_pagamento: StatusPagamento;
  data_pagamento: string | null;
  anexo_url: string | null;
  comprovante_url: string | null;
  observacao: string | null;
  is_manual: boolean;
}

type FornecedorRow = {
  id: string | number;
  nome_fantasia?: string | null;
};

function getEmpresaId(req: NextRequest): string | null {
  const empresaId =
    req.headers.get("x-empresa-id") ||
    req.headers.get("x-pizzaria-id") ||
    req.nextUrl.searchParams.get("empresa_id");

  return empresaId && empresaId.trim() ? empresaId.trim() : null;
}

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado");
  }

  return createClient(url, key);
}

function onlyDate(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.includes("T") ? value.slice(0, 10) : value;
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDescricao(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findOrCreateFornecedorId(
  supabase: SupabaseClient,
  empresaId: string,
  nome: string
): Promise<{ fornecedorId: string | number | null; fornecedorCriado: boolean }> {
  const { data, error: findError } = await supabase
    .from("fornecedores")
    .select("id,nome_fantasia")
    .eq("empresa_id", empresaId)
    .limit(200);

  if (findError) {
    throw new Error(`Erro ao buscar fornecedores: ${findError.message}`);
  }

  const existentes = (Array.isArray(data) ? data : []) as FornecedorRow[];
  const normalizedNome = normalizeDescricao(nome);

  const encontrado = existentes.find((forn) => {
    const atual = normalizeDescricao(String(forn?.nome_fantasia || ""));
    if (!atual || !normalizedNome) return false;
    return (
      atual === normalizedNome ||
      atual.includes(normalizedNome) ||
      normalizedNome.includes(atual)
    );
  });

  if (encontrado && "id" in encontrado && encontrado.id != null) {
    return {
      fornecedorId: encontrado.id,
      fornecedorCriado: false,
    };
  }

  const insertPayload = {
    empresa_id: empresaId,
    nome_fantasia: nome,
    telefone_whatsapp: "",
    categoria_principal: "Mercado",
    mensagem_padrao_cotacao: "",
    is_ativo: 1,
  };

  const { data: criado, error: createError } = await supabase
    .from("fornecedores")
    .insert(insertPayload)
    .select("id")
    .single();

  if (createError) {
    throw new Error(`Erro ao criar fornecedor: ${createError.message}`);
  }

  const fornecedorCriadoRow = (criado ?? null) as { id?: string | number } | null;

  return {
    fornecedorId: fornecedorCriadoRow?.id ?? null,
    fornecedorCriado: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const empresaId = getEmpresaId(req);
    if (!empresaId) {
      return NextResponse.json(
        { error: "x-empresa-id não enviado" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as {
      dados_nfce?: DadosNfce;
      categoria?: string;
    };

    const dados = body?.dados_nfce;

    if (!dados) {
      return NextResponse.json(
        { error: "dados_nfce é obrigatório" },
        { status: 400 }
      );
    }

    const itens = Array.isArray(dados.itens) ? dados.itens : [];

    const fornecedor =
      String(
        dados.emitente?.nome_fantasia ||
          dados.emitente?.razao_social ||
          "Fornecedor não identificado"
      ).trim() || "Fornecedor não identificado";

    const categoria = String(body?.categoria || "Mercado").trim() || "Mercado";
    const dataPedido = onlyDate(dados.dados_nfce?.data_emissao);

    const totalItens = itens.reduce((acc, item) => {
      const valorLinha = toNumber(
        item.valor_total,
        toNumber(item.quantidade) * toNumber(item.valor_unitario)
      );
      return acc + valorLinha;
    }, 0);

    const valorTotal = toNumber(dados.totais?.total, totalItens);
    const formaPagamento = String(dados.pagamento?.forma || "Não identificado").trim();
    const isPagoNoAto = /(debito|débito|credito|crédito|pix|dinheiro)/i.test(
      formaPagamento
    );

    const observacao = JSON.stringify(
      {
        origem: "compra_mercado",
        dados_nfce: {
          emitente: dados.emitente || null,
          dados_nfce: dados.dados_nfce || null,
          pagamento: dados.pagamento || null,
        },
        itens,
      },
      null,
      2
    );

    const supabase = getSupabase();
    const { fornecedorId, fornecedorCriado } = await findOrCreateFornecedorId(
      supabase,
      empresaId,
      fornecedor
    );

    const payload: LancamentoInsert = {
      empresa_id: empresaId,
      data_pedido: dataPedido,
      fornecedor,
      categoria,
      valor_previsto: valorTotal,
      is_boleto_recebido: false,
      valor_real: valorTotal,
      vencimento_real: isPagoNoAto ? dataPedido : null,
      status_pagamento: isPagoNoAto ? "pago" : "pendente",
      data_pagamento: isPagoNoAto ? dataPedido : null,
      anexo_url: null,
      comprovante_url: null,
      observacao,
      is_manual: false,
    };

    const { data: lancamento, error: insertError } = await supabase
      .from("lancamentos")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const lancamentoRow = (lancamento ?? null) as { id?: string | number } | null;

    return NextResponse.json(
      {
        fornecedor_id: fornecedorId ? Number(fornecedorId) || fornecedorId : null,
        fornecedor_criado: fornecedorCriado,
        lancamento_id: lancamentoRow?.id ?? null,
        itens_registrados: itens.length,
        valor_total: valorTotal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro POST /api/compra-mercado:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao salvar compra",
      },
      { status: 500 }
    );
  }
}