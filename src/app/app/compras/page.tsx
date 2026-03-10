"use client";
export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Camera,
  X,
  Check,
  Trash2,
  Package,
  Pencil,
  FileText,
  Loader2,
  Sparkles,
  ClipboardPaste,
  Upload,
  Link as LinkIcon,
  QrCode,
  BrainCircuit,
  ArrowLeft,
  ShoppingCart,
  TrendingDown,
  Building2,
  Search,
  Truck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useAppAuth } from "@/contexts/AppAuthContext";

interface ProdutoFoodService {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  embalagem: string;
  pesoAprox: string;
  unidadeMedida: string;
}

const PRODUTOS_FOOD_SERVICE: ProdutoFoodService[] = [
  { id: "prot-001", nome: "Peito de Frango sem Osso", descricao: "Filé de peito interfolhado", categoria: "Proteínas (Aves e Carnes)", embalagem: "Caixa", pesoAprox: "18kg a 20kg", unidadeMedida: "CX" },
  { id: "prot-002", nome: "Filé de Frango (Sassami)", descricao: "Pequeno filé interno do peito", categoria: "Proteínas (Aves e Carnes)", embalagem: "Caixa 1kg/2kg", pesoAprox: "12kg a 15kg", unidadeMedida: "CX" },
  { id: "prot-003", nome: "Coxa e Sobrecoxa", descricao: "Cortes de frango com osso e pele", categoria: "Proteínas (Aves e Carnes)", embalagem: "Caixa", pesoAprox: "15kg a 18kg", unidadeMedida: "CX" },
  { id: "prot-004", nome: "Frango Inteiro", descricao: "Frango inteiro com miúdos", categoria: "Proteínas (Aves e Carnes)", embalagem: "Caixa", pesoAprox: "16kg a 20kg", unidadeMedida: "CX" },
  { id: "prot-005", nome: "Coração de Frango", descricao: "Coração de frango limpo", categoria: "Proteínas (Aves e Carnes)", embalagem: "Caixa 1kg", pesoAprox: "10kg", unidadeMedida: "CX" },
  { id: "prot-006", nome: "Carne Bovina (Cortes)", descricao: "Contra-filé, Alcatra, Coxão Mole", categoria: "Proteínas (Aves e Carnes)", embalagem: "Caixa", pesoAprox: "20kg a 25kg", unidadeMedida: "CX" },
  { id: "prot-007", nome: "Carne Moída Bovina", descricao: "Carne moída (patinho ou acém)", categoria: "Proteínas (Aves e Carnes)", embalagem: "Caixa 500g/1kg", pesoAprox: "10kg", unidadeMedida: "CX" },
  { id: "emb-001", nome: "Linguiça Calabresa Reta", descricao: "Linguiça tipo calabresa defumada", categoria: "Embutidos e Suínos", embalagem: "Caixa", pesoAprox: "15kg", unidadeMedida: "CX" },
  { id: "emb-002", nome: "Linguiça de Frango", descricao: "Linguiça de frango fresca", categoria: "Embutidos e Suínos", embalagem: "Caixa 5kg", pesoAprox: "15kg", unidadeMedida: "CX" },
  { id: "emb-003", nome: "Salsicha Hot Dog", descricao: "Salsicha para hot dog", categoria: "Embutidos e Suínos", embalagem: "Caixa 3kg/5kg", pesoAprox: "15kg a 18kg", unidadeMedida: "CX" },
  { id: "emb-004", nome: "Bacon em Manta", descricao: "Peça inteira de bacon defumado", categoria: "Embutidos e Suínos", embalagem: "Peça a vácuo", pesoAprox: "3kg a 5kg", unidadeMedida: "PC" },
  { id: "emb-005", nome: "Bacon Fatiado", descricao: "Fatias padronizadas de bacon defumado", categoria: "Embutidos e Suínos", embalagem: "Caixa 1kg", pesoAprox: "10kg", unidadeMedida: "CX" },
  { id: "emb-006", nome: "Bacon em Cubos", descricao: "Cubos de bacon defumado", categoria: "Embutidos e Suínos", embalagem: "Caixa 1kg", pesoAprox: "10kg", unidadeMedida: "CX" },
  { id: "emb-007", nome: "Presunto Cozido", descricao: "Peça inteira de presunto cozido", categoria: "Embutidos e Suínos", embalagem: "Peça a vácuo", pesoAprox: "3,5kg a 4kg", unidadeMedida: "PC" },
  { id: "lat-001", nome: "Queijo Mussarela", descricao: "Peça inteira de queijo mussarela", categoria: "Laticínios e Frios", embalagem: "Peça a vácuo", pesoAprox: "3,5kg a 4kg", unidadeMedida: "PC" },
  { id: "lat-002", nome: "Queijo Mussarela Fatiada", descricao: "Fatias de mussarela interfolhadas", categoria: "Laticínios e Frios", embalagem: "Caixa 1kg", pesoAprox: "5kg a 10kg", unidadeMedida: "CX" },
  { id: "lat-003", nome: "Queijo Prato", descricao: "Peça inteira de queijo prato", categoria: "Laticínios e Frios", embalagem: "Peça a vácuo", pesoAprox: "3kg a 3,5kg", unidadeMedida: "PC" },
  { id: "lat-004", nome: "Queijo Parmesão", descricao: "Peça inteira ou fracionada", categoria: "Laticínios e Frios", embalagem: "Peça", pesoAprox: "5kg a 7kg", unidadeMedida: "PC" },
  { id: "lat-005", nome: "Requeijão Cremoso", descricao: "Requeijão culinário", categoria: "Laticínios e Frios", embalagem: "Balde ou Bisnaga", pesoAprox: "1,5kg a 4kg", unidadeMedida: "UN" },
  { id: "lat-006", nome: "Manteiga com Sal", descricao: "Manteiga de primeira qualidade", categoria: "Laticínios e Frios", embalagem: "Pote ou Barra", pesoAprox: "500g a 5kg", unidadeMedida: "UN" },
  { id: "cong-001", nome: "Batata Congelada", descricao: "Batata pré-frita corte palito", categoria: "Congelados e Vegetais", embalagem: "Caixa 2kg/2,5kg", pesoAprox: "10kg a 12kg", unidadeMedida: "CX" },
  { id: "cong-002", nome: "Hambúrguer Bovino", descricao: "Disco de carne bovina temperada", categoria: "Congelados e Vegetais", embalagem: "Caixa 60/80 un", pesoAprox: "6kg a 8kg", unidadeMedida: "CX" },
  { id: "cong-003", nome: "Brócolis Congelado", descricao: "Flores de brócolis congeladas", categoria: "Congelados e Vegetais", embalagem: "Saco plástico", pesoAprox: "1kg a 2kg", unidadeMedida: "PCT" },
  { id: "cong-004", nome: "Ervilha Congelada", descricao: "Ervilhas frescas congeladas", categoria: "Congelados e Vegetais", embalagem: "Saco plástico", pesoAprox: "1kg a 2kg", unidadeMedida: "PCT" },
  { id: "cong-005", nome: "Polpa de Fruta", descricao: "Polpas de frutas diversas", categoria: "Congelados e Vegetais", embalagem: "Caixa 100g", pesoAprox: "10kg", unidadeMedida: "CX" },
  { id: "merc-001", nome: "Farinha de Trigo", descricao: "Farinha de trigo especial", categoria: "Mercearia e Condimentos", embalagem: "Saco", pesoAprox: "25kg a 50kg", unidadeMedida: "SC" },
  { id: "merc-002", nome: "Óleo de Soja", descricao: "Óleo de soja refinado", categoria: "Mercearia e Condimentos", embalagem: "Caixa 900ml", pesoAprox: "18L", unidadeMedida: "CX" },
  { id: "merc-003", nome: "Arroz Agulhinha", descricao: "Arroz branco tipo 1", categoria: "Mercearia e Condimentos", embalagem: "Fardo 5kg", pesoAprox: "30kg", unidadeMedida: "FD" },
  { id: "merc-004", nome: "Feijão Carioca", descricao: "Feijão carioca tipo 1", categoria: "Mercearia e Condimentos", embalagem: "Fardo 1kg", pesoAprox: "10kg", unidadeMedida: "FD" },
  { id: "merc-005", nome: "Açúcar Refinado", descricao: "Açúcar branco refinado", categoria: "Mercearia e Condimentos", embalagem: "Fardo 1kg", pesoAprox: "10kg", unidadeMedida: "FD" },
  { id: "merc-006", nome: "Sal Refinado", descricao: "Sal de cozinha refinado", categoria: "Mercearia e Condimentos", embalagem: "Fardo 1kg", pesoAprox: "10kg", unidadeMedida: "FD" },
  { id: "merc-007", nome: "Extrato de Tomate", descricao: "Extrato de tomate concentrado", categoria: "Mercearia e Condimentos", embalagem: "Balde/Lata", pesoAprox: "3kg a 4kg", unidadeMedida: "UN" },
  { id: "merc-008", nome: "Maionese", descricao: "Maionese cremosa food service", categoria: "Mercearia e Condimentos", embalagem: "Balde", pesoAprox: "3kg a 7kg", unidadeMedida: "UN" },
  { id: "merc-009", nome: "Ketchup", descricao: "Molho ketchup", categoria: "Mercearia e Condimentos", embalagem: "Galão/Bisnaga", pesoAprox: "3kg a 5kg", unidadeMedida: "UN" },
  { id: "merc-010", nome: "Mostarda", descricao: "Molho mostarda", categoria: "Mercearia e Condimentos", embalagem: "Galão/Bisnaga", pesoAprox: "3kg a 5kg", unidadeMedida: "UN" },
  { id: "merc-011", nome: "Alho Frito", descricao: "Alho granulado frito", categoria: "Mercearia e Condimentos", embalagem: "Saco plástico", pesoAprox: "500g a 1kg", unidadeMedida: "PCT" },
  { id: "merc-012", nome: "Orégano", descricao: "Orégano seco em folhas", categoria: "Mercearia e Condimentos", embalagem: "Saco plástico", pesoAprox: "500g a 1kg", unidadeMedida: "PCT" },
];

function buscarProdutosFoodService(termo: string): ProdutoFoodService[] {
  if (!termo || termo.trim().length < 2) return [];
  const termoLower = termo.toLowerCase();

  return PRODUTOS_FOOD_SERVICE.filter(
    (p) =>
      p.nome.toLowerCase().includes(termoLower) ||
      p.descricao.toLowerCase().includes(termoLower) ||
      p.categoria.toLowerCase().includes(termoLower)
  );
}

const CATEGORIAS = [
  "Alimentos",
  "Bebidas",
  "Embalagens",
  "Limpeza",
  "Equipamentos",
  "Outros",
];

const UNIDADES = ["un", "kg", "g", "L", "ml", "cx", "pct", "fd", "sc", "pc"];

interface ItemCompra {
  id: string;
  produto: string;
  quantidade: string;
  unidade: string;
  valor_unitario: string;
}

interface Fornecedor {
  id: number;
  nome_fantasia: string;
  razao_social: string;
}

interface CompraHistorico {
  id: string;
  data_pedido: string;
  valor_total: number;
  status: string;
  fornecedor_nome?: string;
}

interface ItemListaCompras {
  id: string;
  status_solicitacao: string;
}

const STATUS_COMPRA_LABELS: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pendente: {
    label: "Aguarda Aprovação",
    color: "bg-yellow-100 text-yellow-700",
    icon: <Clock className="w-3 h-3" />,
  },
  aprovado: {
    label: "Aprovado (A Aguardar)",
    color: "bg-blue-100 text-blue-700",
    icon: <Truck className="w-3 h-3" />,
  },
  recebido: {
    label: "Recebido no Stock",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

type IAResponseLike = {
  error?: string;
  dados?: any;
  data?: any;
  itens?: any[];
  fornecedor?: string;
  categoria?: string;
  cnpj?: string;
};

export default function ComprasPage() {
  const { localUser } = useAppAuth();

  const [mounted, setMounted] = useState(false);

  const [comprasHistorico, setComprasHistorico] = useState<CompraHistorico[]>([]);
  const [itensEmCotacao, setItensEmCotacao] = useState<ItemListaCompras[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkNfe, setLinkNfe] = useState("");

  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorOutro, setFornecedorOutro] = useState(false);
  const [fornecedorCustom, setFornecedorCustom] = useState("");

  const [formData, setFormData] = useState({
    data_pedido: new Date().toISOString().split("T")[0],
    fornecedor: "",
    cnpj: "",
    categoria: "",
  });

  const [novoItem, setNovoItem] = useState<ItemCompra>({
    id: "",
    produto: "",
    quantidade: "",
    unidade: "un",
    valor_unitario: "",
  });

  const [editandoItem, setEditandoItem] = useState<string | null>(null);
  const [extraindo, setExtraindo] = useState(false);
  const [erroExtracao, setErroExtracao] = useState<string | null>(null);

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [textoLista, setTextoLista] = useState("");
  const [importando, setImportando] = useState(false);
  const [erroImportacao, setErroImportacao] = useState<string | null>(null);

  const [showQrDialog, setShowQrDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrLoopRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const getHeaders = useCallback(() => {
    const empresaId =
      localUser?.empresa_id ||
      localStorage.getItem("empresaId") ||
      localStorage.getItem("companyId") ||
      localStorage.getItem("empresa_id") ||
      "";

    const email = localUser?.email || localStorage.getItem("userEmail") || "";

    const headers: Record<string, string> = {
      "x-user-email": email,
    };

    if (empresaId) {
      headers["x-empresa-id"] = empresaId;
    }

    return headers;
  }, [localUser]);

  const normalizarLinkNfe = useCallback((valor: string): string => {
    let url = valor.trim();
    url = url.replace(/\s+/g, "");

    const match = url.match(/https?:\/\/[^\s]+/i);
    if (match?.[0]) {
      url = match[0];
    }

    if (url && !/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    return url;
  }, []);

  const resetFormulario = useCallback(() => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setItens([]);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFornecedorOutro(false);
    setFornecedorCustom("");
    setTextoLista("");
    setErroExtracao(null);
    setErroImportacao(null);
    setLinkNfe("");
    setShowLinkInput(false);
    setEditandoItem(null);
    setNovoItem({
      id: "",
      produto: "",
      quantidade: "",
      unidade: "un",
      valor_unitario: "",
    });
    setFormData({
      data_pedido: new Date().toISOString().split("T")[0],
      fornecedor: "",
      cnpj: "",
      categoria: "",
    });
  }, [previewUrl]);

  const fetchAllData = useCallback(async () => {
    const headers = getHeaders();

    if (!headers["x-empresa-id"]) {
      setDashboardLoading(false);
      console.warn("Empresa não identificada para carregar compras.");
      return;
    }

    try {
      setDashboardLoading(true);

      const [resForn, resCompras, resItens] = await Promise.all([
        fetch("/api/fornecedores", { headers }).catch(() => null),
        fetch("/api/compras", { headers }).catch(() => null),
        fetch("/api/lista-compras", { headers }).catch(() => null),
      ]);

      if (resForn?.ok) {
        setFornecedores((await resForn.json()) as Fornecedor[]);
      } else {
        setFornecedores([
          { id: 1, nome_fantasia: "Atacadão", razao_social: "Atacadão S.A" },
          { id: 2, nome_fantasia: "Friboi", razao_social: "JBS S.A" },
        ]);
      }

      if (resCompras?.status === 401) {
        console.error("401 Unauthorized em /api/compras");
        setComprasHistorico([]);
      } else if (resCompras?.ok) {
        const data = (await resCompras.json()) as CompraHistorico[];
        data.sort(
          (a, b) =>
            new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime()
        );
        setComprasHistorico(data);
      } else {
        setComprasHistorico([]);
      }

      if (resItens?.ok) {
        const data = (await resItens.json()) as ItemListaCompras[];
        setItensEmCotacao(data.filter((i) => i.status_solicitacao === "em_cotacao"));
      } else {
        setItensEmCotacao([]);
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setDashboardLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!localUser) return;

    void fetchAllData();
  }, [mounted, localUser, fetchAllData]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const calcularTotal = () =>
    itens.reduce((total, item) => {
      const qtd = Number.parseFloat(item.quantidade) || 0;
      const unit = Number.parseFloat(item.valor_unitario) || 0;
      return total + qtd * unit;
    }, 0);

  const aplicarDadosDaIA = useCallback(
    (payload: IAResponseLike) => {
      const responseIA = payload?.dados || payload?.data || payload;

      if (payload?.error || responseIA?.error) {
        setErroExtracao(
          payload?.error || responseIA?.error || "Erro ao interpretar documento."
        );
        return;
      }

      if (responseIA?.fornecedor) {
        const fornecedorTexto = String(responseIA.fornecedor).trim();

        const nomeEncontrado = fornecedores.find(
          (f) =>
            f.nome_fantasia?.toLowerCase() === fornecedorTexto.toLowerCase() ||
            f.razao_social?.toLowerCase() === fornecedorTexto.toLowerCase()
        );

        if (nomeEncontrado) {
          setFormData((prev) => ({
            ...prev,
            fornecedor: nomeEncontrado.nome_fantasia || nomeEncontrado.razao_social,
            cnpj: responseIA.cnpj || prev.cnpj,
          }));
          setFornecedorOutro(false);
          setFornecedorCustom("");
        } else {
          setFornecedorOutro(true);
          setFornecedorCustom(fornecedorTexto);
          setFormData((prev) => ({
            ...prev,
            fornecedor: fornecedorTexto,
            cnpj: responseIA.cnpj || prev.cnpj,
          }));
        }
      }

      if (responseIA?.categoria) {
        const categoria = String(responseIA.categoria).trim();
        if (categoria) {
          setFormData((prev) => ({ ...prev, categoria }));
        }
      }

      if (Array.isArray(responseIA?.itens)) {
        const novosItens: ItemCompra[] = responseIA.itens
          .map((item: any, index: number) => ({
            id: `ia-${Date.now()}-${index}`,
            produto: String(item.produto || item.nome || "").trim(),
            quantidade: String(item.qtd ?? item.quantidade ?? 1),
            unidade: String(item.unidade || "un").toLowerCase(),
            valor_unitario: String(
              item.preco_un ?? item.preco ?? item.valor_unitario ?? 0
            ),
          }))
          .filter((item: ItemCompra) => item.produto);

        if (novosItens.length > 0) {
          setItens((prev) => [...prev, ...novosItens]);
        } else {
          setErroExtracao("A IA leu o documento, mas não encontrou itens válidos.");
        }
      } else {
        setErroExtracao("A IA não retornou itens da nota.");
      }
    },
    [fornecedores]
  );

  const uploadArquivo = useCallback(
    async (file: File, type: "nota_fiscal" | "boleto" | "barcode_scan" = "nota_fiscal") => {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("type", type);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: getHeaders(),
        body: uploadForm,
      });

      const uploadJson = await uploadRes.json().catch(() => null);

      if (!uploadRes.ok || !uploadJson?.url) {
        throw new Error(uploadJson?.error || "Falha ao enviar arquivo.");
      }

      return uploadJson.url as string;
    },
    [getHeaders]
  );

  const extrairDadosIA = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        setErroExtracao("Extração automática disponível apenas para imagens e PDF.");
        return;
      }

      setExtraindo(true);
      setErroExtracao(null);

      try {
        const fileUrl = await uploadArquivo(file, "nota_fiscal");

        const leituraRes = await fetch("/api/ia/ler-nota", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getHeaders(),
          },
          body: JSON.stringify({ image_url: fileUrl }),
        });

        const leituraJson = await leituraRes.json().catch(() => null);

        if (!leituraRes.ok) {
          throw new Error(
            leituraJson?.error ||
              "Falha ao ler documento. Verifique a API /api/ia/ler-nota."
          );
        }

        aplicarDadosDaIA(leituraJson);
      } catch (err: any) {
        setErroExtracao(
          err?.message || "Erro ao processar documento. Adicione os itens manualmente."
        );
      } finally {
        setExtraindo(false);
      }
    },
    [aplicarDadosDaIA, getHeaders, uploadArquivo]
  );

  const extrairDadosPorLink = useCallback(async () => {
    const linkNormalizado = normalizarLinkNfe(linkNfe);

    if (!linkNormalizado) {
      setErroExtracao("Cole um link válido da NFC-e.");
      return;
    }

    setExtraindo(true);
    setErroExtracao(null);

    try {
      const response = await fetch("/api/ia/ler-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getHeaders(),
        },
        body: JSON.stringify({
          url: linkNormalizado,
        }),
      });

      const dados = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          dados?.error || dados?.details || "Falha ao ler link da NFC-e."
        );
      }

      aplicarDadosDaIA(dados);
      setLinkNfe(linkNormalizado);
      setShowLinkInput(false);
    } catch (err: any) {
      setErroExtracao(
        err?.message ||
          "Não foi possível ler a nota a partir deste link. Verifique se é um link válido da Sefaz."
      );
    } finally {
      setExtraindo(false);
    }
  }, [aplicarDadosDaIA, getHeaders, linkNfe, normalizarLinkNfe]);

  const importarListaTexto = useCallback(async () => {
    if (!textoLista.trim()) return;

    setImportando(true);
    setErroImportacao(null);

    try {
      const response = await fetch("/api/ia/interpretar-lista", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getHeaders(),
        },
        body: JSON.stringify({ texto: textoLista }),
      });

      const raw = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(raw?.error || "Falha ao interpretar lista.");
      }

      const dados = raw?.dados || raw?.data || raw;
      const itensInterpretados = Array.isArray(dados?.itens) ? dados.itens : [];

      if (itensInterpretados.length === 0) {
        throw new Error("Não foi possível identificar itens no texto.");
      }

      const novosItens: ItemCompra[] = itensInterpretados
        .map((item: any, index: number) => ({
          id: `import-${Date.now()}-${index}`,
          produto: String(item.produto || item.nome || "").trim(),
          quantidade: String(item.quantidade ?? item.qtd ?? 1),
          unidade: String(item.unidade || "un").toLowerCase(),
          valor_unitario: String(item.valor_unitario ?? item.preco ?? 0),
        }))
        .filter((item: ItemCompra) => item.produto);

      setItens((prev) => [...prev, ...novosItens]);
      setShowImportDialog(false);
      setTextoLista("");
    } catch (err: any) {
      setErroImportacao(
        err?.message || "Não foi possível identificar itens no texto."
      );
    } finally {
      setImportando(false);
    }
  }, [getHeaders, textoLista]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(file);
      setErroExtracao(null);

      if (file.type.startsWith("image/")) {
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
      } else {
        setPreviewUrl(null);
      }

      void extrairDadosIA(file);
    },
    [extrairDadosIA, previewUrl]
  );

  const adicionarItem = () => {
    if (!novoItem.produto || !novoItem.quantidade || !novoItem.valor_unitario) return;

    setItens((prev) => [
      ...prev,
      {
        ...novoItem,
        id: Date.now().toString(),
      },
    ]);

    setNovoItem({
      id: "",
      produto: "",
      quantidade: "",
      unidade: "un",
      valor_unitario: "",
    });
  };

  const removerItem = (id: string) => {
    setItens((prev) => prev.filter((item) => item.id !== id));
  };

  const editarItem = (item: ItemCompra) => {
    setEditandoItem(item.id);
    setNovoItem(item);
  };

  const salvarEdicao = () => {
    if (!editandoItem) return;

    setItens((prev) =>
      prev.map((item) =>
        item.id === editandoItem
          ? {
              ...item,
              produto: novoItem.produto,
              quantidade: novoItem.quantidade,
              unidade: novoItem.unidade,
              valor_unitario: novoItem.valor_unitario,
            }
          : item
      )
    );

    setEditandoItem(null);
    setNovoItem({
      id: "",
      produto: "",
      quantidade: "",
      unidade: "un",
      valor_unitario: "",
    });
  };

  const stopQr = useCallback(() => {
    if (qrLoopRef.current) {
      cancelAnimationFrame(qrLoopRef.current);
      qrLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startQr = useCallback(async () => {
    setQrError(null);

    try {
      if (!("mediaDevices" in navigator)) {
        throw new Error("Seu navegador não suporta câmera.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Vídeo não inicializado.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const hasDetector = "BarcodeDetector" in window;
      if (!hasDetector) {
        setQrError(
          "Leitor QR não disponível neste navegador. Cole o link da NFC-e manualmente."
        );
        return;
      }

      // @ts-ignore
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      const scan = async () => {
        if (!videoRef.current) return;

        try {
          // @ts-ignore
          const barcodes = await detector.detect(videoRef.current);

          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0]?.rawValue || "";

            if (raw) {
              stopQr();
              setShowQrDialog(false);
              setShowLinkInput(true);
              setLinkNfe(normalizarLinkNfe(raw));
              return;
            }
          }
        } catch {
          // ignora
        }

        qrLoopRef.current = requestAnimationFrame(scan);
      };

      qrLoopRef.current = requestAnimationFrame(scan);
    } catch (err: any) {
      setQrError(err?.message || "Não foi possível abrir a câmera.");
    }
  }, [normalizarLinkNfe, stopQr]);

  useEffect(() => {
    if (!showQrDialog) stopQr();
  }, [showQrDialog, stopQr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itens.length === 0) {
      alert("Adicione pelo menos um item à compra");
      return;
    }

    const fornecedorFinal = fornecedorOutro
      ? fornecedorCustom.trim()
      : formData.fornecedor.trim();

    if (!fornecedorFinal) {
      alert("Informe o fornecedor.");
      return;
    }

    if (!formData.categoria) {
      alert("Informe a categoria.");
      return;
    }

    setLoading(true);

    try {
      let anexoUrl: string | null = null;

      if (selectedFile) {
        anexoUrl = await uploadArquivo(selectedFile, "nota_fiscal");
      }

      const lancamentoRes = await fetch("/api/lancamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getHeaders(),
        },
        body: JSON.stringify({
          data_pedido: formData.data_pedido,
          fornecedor: fornecedorFinal,
          categoria: formData.categoria,
          valor_previsto: calcularTotal(),
          anexo_url: anexoUrl,
          observacao: `Lançamento criado via Compras com ${itens.length} item(ns).`,
          is_manual: false,
        }),
      });

      const lancamentoJson = await lancamentoRes.json().catch(() => null);

      if (!lancamentoRes.ok) {
        throw new Error(lancamentoJson?.error || "Erro ao salvar lançamento.");
      }

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
        resetFormulario();
        void fetchAllData();
      }, 1800);
    } catch (err: any) {
      alert(err?.message || "Erro ao salvar a provisão");
    } finally {
      setLoading(false);
    }
  };

  const comprasFiltradas = comprasHistorico.filter((compra) => {
    const searchLower = searchQuery.toLowerCase();
    const fornecedor = compra.fornecedor_nome?.toLowerCase() || "";
    const id = String(compra.id).toLowerCase();

    return fornecedor.includes(searchLower) || id.includes(searchLower);
  });

  const totalGeral = comprasFiltradas.reduce(
    (acc, c) => acc + Number(c.valor_total || 0),
    0
  );

  const sugestoesProduto = buscarProdutosFoodService(novoItem.produto);

  if (!mounted) return null;

  if (success) {
    return (
      <div className="flex h-[70vh] items-center justify-center animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="text-center bg-white p-16 rounded-[45px] shadow-2xl border border-gray-100">
          <div className="w-24 h-24 bg-green-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black italic uppercase text-gray-900 tracking-tight">
            Provisão Registrada!
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">
            O financeiro já foi notificado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[80vh] pb-12">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
        <div className="flex flex-col items-center justify-center opacity-[0.03] select-none scale-150">
          <BrainCircuit className="w-64 h-64 text-orange-900" />
          <span className="text-[120px] font-black italic uppercase tracking-tighter mt-4 text-orange-900 leading-none">
            PAPPI.IA
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {!showForm ? (
          <div className="animate-in fade-in duration-700 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/app"
                  className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-all shadow-sm"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                    Gestão de <span className="text-orange-500">Compras</span>
                  </h1>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic mt-1">
                    Lançamento de Despesas e NFe
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowForm(true)}
                  className="h-12 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-pink-600 hover:scale-105 transition-transform shadow-lg shadow-orange-200 text-white font-black italic uppercase text-xs tracking-widest"
                >
                  <Plus size={18} className="mr-2" /> Importar NFe / Novo
                </Button>
              </div>
            </div>

            {dashboardLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="rounded-[30px] border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                      <FileText className="w-24 h-24" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">
                        Pedidos Registrados
                      </p>
                      <p className="text-4xl font-black italic">
                        {comprasHistorico.length}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[30px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Total Investido (Período)
                          </p>
                          <p className="text-3xl font-black text-gray-900">
                            R${" "}
                            {totalGeral.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-[20px] bg-red-50 flex items-center justify-center">
                          <TrendingDown className="w-6 h-6 text-red-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[30px] border border-orange-100 bg-orange-50 shadow-sm relative overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">
                            Itens Aguardando Compra
                          </p>
                          <p className="text-3xl font-black text-orange-900">
                            {itensEmCotacao.length}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-[20px] bg-white flex items-center justify-center shadow-sm">
                          <ShoppingCart className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-2 rounded-[30px] border border-gray-100 shadow-sm">
                  <div className="flex-1 relative w-full">
                    <Search
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <Input
                      className="pl-14 h-14 rounded-[24px] border-0 bg-transparent font-bold text-gray-600 w-full focus-visible:ring-0"
                      placeholder="Procurar por fornecedor ou ID do pedido..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  {comprasFiltradas.length === 0 ? (
                    <div className="text-center bg-white rounded-[45px] p-12 border border-gray-100 shadow-sm">
                      <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-sm font-black italic uppercase text-gray-400 tracking-widest">
                        Nenhum pedido registrado ainda.
                      </p>
                      <Button
                        onClick={() => setShowForm(true)}
                        variant="link"
                        className="text-orange-500 font-bold mt-2"
                      >
                        Fazer o primeiro lançamento
                      </Button>
                    </div>
                  ) : (
                    comprasFiltradas.map((compra) => {
                      const statusInfo =
                        STATUS_COMPRA_LABELS[compra.status] ||
                        STATUS_COMPRA_LABELS.recebido;

                      return (
                        <Card
                          key={compra.id}
                          className="border-gray-100 rounded-[30px] transition-all hover:shadow-lg bg-white overflow-hidden group"
                        >
                          <CardContent className="p-0 flex flex-col sm:flex-row items-center">
                            <div className="p-6 flex items-center justify-center border-r border-gray-50 bg-gray-50/50 group-hover:bg-orange-50 transition-colors w-full sm:w-auto">
                              <div className="w-14 h-14 rounded-[20px] bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                <Building2 className="w-6 h-6 text-gray-400 group-hover:text-orange-600 transition-colors" />
                              </div>
                            </div>

                            <div className="flex-1 p-6 w-full">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-black italic uppercase text-gray-900 tracking-tight text-xl leading-none">
                                  {compra.fornecedor_nome || "Fornecedor não identificado"}
                                </h3>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  ID: #{compra.id}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 mt-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${statusInfo.color}`}
                                >
                                  {statusInfo.icon}
                                  {statusInfo.label}
                                </span>
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                                  {new Date(compra.data_pedido).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>

                            <div className="p-6 bg-gray-50 flex items-center gap-6 border-l border-gray-100 w-full sm:w-auto justify-between sm:justify-end rounded-b-[30px] sm:rounded-none sm:rounded-r-[30px]">
                              <div className="text-left sm:text-right min-w-[120px]">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                  Valor Total
                                </p>
                                <p className="font-black italic text-2xl text-gray-900">
                                  R${" "}
                                  {Number(compra.valor_total).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-[45px] p-10 border border-gray-100 shadow-xl animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
            <div className="mb-10 border-b border-gray-50 pb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
                  Nova <span className="text-orange-500">Provisão</span>
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Importe a NFC-e ou insira os dados do pedido
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetFormulario();
                }}
                className="w-12 h-12 bg-gray-50 text-gray-400 hover:text-red-500 rounded-[18px] flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 italic">
                      Data do Pedido
                    </Label>
                    <Input
                      type="date"
                      value={formData.data_pedido}
                      onChange={(e) =>
                        setFormData({ ...formData, data_pedido: e.target.value })
                      }
                      required
                      className="h-12 rounded-2xl font-bold bg-gray-50/50 border-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 italic">
                      Fornecedor
                    </Label>

                    {!fornecedorOutro ? (
                      <Select
                        value={formData.fornecedor}
                        onValueChange={(v) =>
                          v === "__outro__"
                            ? (setFornecedorOutro(true),
                              setFormData({ ...formData, fornecedor: "" }))
                            : setFormData({ ...formData, fornecedor: v })
                        }
                      >
                        <SelectTrigger className="h-12 rounded-2xl font-bold bg-gray-50/50 border-gray-100">
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[24px] bg-white border border-gray-100 shadow-xl z-50">
                          {fornecedores.map((f) => (
                            <SelectItem
                              key={f.id}
                              value={f.nome_fantasia || f.razao_social}
                            >
                              {f.nome_fantasia || f.razao_social}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="__outro__"
                            className="text-orange-600 font-black italic rounded-xl cursor-pointer hover:bg-orange-50"
                          >
                            + Digitar Outro
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="grid grid-cols-12 gap-2 animate-in fade-in slide-in-from-top-2">
                        <Input
                          placeholder="Nome da Empresa..."
                          value={fornecedorCustom}
                          onChange={(e) => {
                            setFornecedorCustom(e.target.value);
                            setFormData({ ...formData, fornecedor: e.target.value });
                          }}
                          className="col-span-12 sm:col-span-7 h-12 rounded-2xl font-bold bg-gray-50/50 border-orange-200 uppercase"
                          autoFocus
                        />
                        <Input
                          placeholder="CNPJ (opcional)"
                          value={formData.cnpj}
                          onChange={(e) =>
                            setFormData({ ...formData, cnpj: e.target.value })
                          }
                          className="col-span-8 sm:col-span-5 h-12 rounded-2xl font-bold bg-gray-50/50 border-orange-200"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setFornecedorOutro(false);
                            setFornecedorCustom("");
                            setFormData({ ...formData, cnpj: "" });
                          }}
                          className="col-span-4 sm:col-span-12 h-10 rounded-xl text-gray-400 hover:bg-gray-100 text-[10px] font-black uppercase"
                        >
                          Cancelar Novo
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-400 italic">
                      Categoria
                    </Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl font-bold bg-gray-50/50 border-gray-100">
                        <SelectValue placeholder="Categoria da despesa" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[24px] bg-white border border-gray-100 shadow-xl z-50">
                        {CATEGORIAS.map((cat) => (
                          <SelectItem
                            key={cat}
                            value={cat}
                            className="rounded-xl cursor-pointer hover:bg-orange-50"
                          >
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-orange-500 flex items-center gap-1 italic">
                      <Sparkles size={12} /> Importar c/ Pappi.IA
                    </Label>
                    {extraindo && (
                      <span className="text-[9px] font-bold text-orange-500 animate-pulse flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Lendo Documento...
                      </span>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="relative group rounded-[24px] overflow-hidden border border-gray-100 shadow-sm h-full min-h-[160px]">
                      {selectedFile.type === "application/pdf" ? (
                        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-3 p-6">
                          <FileText className="w-12 h-12 text-red-500" />
                          <span className="text-xs font-bold text-gray-600 text-center truncate w-full">
                            {selectedFile.name}
                          </span>
                          <span className="text-[10px] text-gray-400 text-center">
                            O PDF foi enviado. A leitura depende da API /api/ia/ler-nota suportar PDF.
                          </span>
                        </div>
                      ) : (
                        <img
                          src={previewUrl || ""}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (previewUrl?.startsWith("blob:")) {
                              URL.revokeObjectURL(previewUrl);
                            }
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="w-12 h-12 bg-red-500 text-white rounded-[18px] flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 h-full min-h-[160px]">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="rounded-[24px] border-2 border-dashed border-orange-200 bg-orange-50/80 flex flex-col items-center justify-center gap-3 hover:bg-orange-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-orange-500">
                          <Camera size={20} />
                        </div>
                        <span className="text-[10px] font-black italic uppercase text-orange-900">
                          Tirar Foto
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-[24px] border-2 border-dashed border-gray-200 bg-gray-50/80 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-gray-500">
                          <Upload size={20} />
                        </div>
                        <span className="text-[10px] font-black italic uppercase text-gray-600">
                          Galeria / PDF
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowQrDialog(true)}
                        className="col-span-2 h-12 rounded-[18px] border-2 border-dashed border-blue-200 bg-blue-50/80 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors text-blue-600"
                      >
                        <QrCode size={16} />
                        <span className="text-[10px] font-black italic uppercase tracking-wider">
                          Ler QR Code (NFC-e)
                        </span>
                      </button>

                      {!showLinkInput ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowLinkInput(true);
                            setErroExtracao(null);
                          }}
                          className="col-span-2 h-12 rounded-[18px] border border-gray-200 bg-white flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-gray-600"
                        >
                          <LinkIcon size={16} />
                          <span className="text-[10px] font-black italic uppercase tracking-wider">
                            Colar Link Sefaz
                          </span>
                        </button>
                      ) : (
                        <div className="col-span-2 flex gap-2 animate-in fade-in slide-in-from-top-2">
                          <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Cole o link da NFC-e..."
                              value={linkNfe}
                              onChange={(e) => setLinkNfe(e.target.value)}
                              className="h-12 pl-10 rounded-2xl font-medium bg-white border-blue-200 focus:border-blue-500 text-xs"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => void extrairDadosPorLink()}
                            disabled={!normalizarLinkNfe(linkNfe) || extraindo}
                            className="h-12 px-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 font-bold"
                          >
                            {extraindo ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Check size={16} />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowLinkInput(false);
                              setLinkNfe("");
                            }}
                            className="h-12 px-3 rounded-2xl text-gray-400 hover:bg-gray-100"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {erroExtracao && (
                    <p className="text-[10px] text-red-500 font-bold mt-2 bg-red-50 p-2 rounded-xl">
                      {erroExtracao}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50/80 rounded-[35px] p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <Label className="flex items-center gap-2 text-sm font-black italic uppercase text-gray-900">
                    <Package className="text-orange-500" /> Itens da Provisão
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowImportDialog(true)}
                    className="h-10 rounded-xl bg-white text-[10px] uppercase font-bold italic tracking-widest text-purple-600 border-purple-100 hover:bg-purple-50"
                  >
                    <ClipboardPaste size={14} className="mr-2" /> Importar Texto
                  </Button>
                </div>

                {itens.length > 0 && (
                  <div className="space-y-3 mb-8">
                    {itens.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 shadow-sm group"
                      >
                        <div>
                          <span className="font-black italic uppercase text-gray-900 text-sm block">
                            {item.produto}
                          </span>
                          <span className="text-xs font-bold text-gray-400">
                            {item.quantidade} {item.unidade} ×{" "}
                            {formatCurrency(Number.parseFloat(item.valor_unitario) || 0)}
                          </span>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className="font-black text-orange-600">
                            {formatCurrency(
                              (Number.parseFloat(item.quantidade) || 0) *
                                (Number.parseFloat(item.valor_unitario) || 0)
                            )}
                          </span>

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => editarItem(item)}
                              className="w-8 h-8 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removerItem(item.id)}
                              className="w-8 h-8 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-12 gap-3 items-end bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
                  <div className="col-span-12 lg:col-span-4 space-y-1">
                    <span className="text-[9px] font-bold uppercase text-gray-400 ml-2">
                      Produto
                    </span>
                    <Input
                      placeholder="Ex: Queijo Mussarela"
                      value={novoItem.produto}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, produto: e.target.value })
                      }
                      className="h-12 rounded-2xl font-bold bg-gray-50 border-0"
                    />

                    {novoItem.produto.trim().length >= 2 && sugestoesProduto.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                        {sugestoesProduto.slice(0, 6).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              setNovoItem((prev) => ({
                                ...prev,
                                produto: s.nome,
                                unidade: s.unidadeMedida.toLowerCase(),
                              }))
                            }
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b last:border-b-0 border-gray-50"
                          >
                            <div className="font-bold text-sm text-gray-800">{s.nome}</div>
                            <div className="text-xs text-gray-500">
                              {s.categoria} • {s.unidadeMedida}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-6 lg:col-span-2 space-y-1">
                    <span className="text-[9px] font-bold uppercase text-gray-400 ml-2">
                      Quantidade
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={novoItem.quantidade}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, quantidade: e.target.value })
                      }
                      className="h-12 rounded-2xl font-black bg-gray-50 border-0"
                    />
                  </div>

                  <div className="col-span-6 lg:col-span-2 space-y-1">
                    <span className="text-[9px] font-bold uppercase text-gray-400 ml-2">
                      Unidade
                    </span>
                    <Select
                      value={novoItem.unidade}
                      onValueChange={(v) => setNovoItem({ ...novoItem, unidade: v })}
                    >
                      <SelectTrigger className="h-12 rounded-2xl font-bold bg-gray-50 border-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[24px] bg-white border border-gray-100 shadow-xl z-50">
                        {UNIDADES.map((u) => (
                          <SelectItem
                            key={u}
                            value={u}
                            className="cursor-pointer hover:bg-orange-50"
                          >
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-8 lg:col-span-2 space-y-1">
                    <span className="text-[9px] font-bold uppercase text-gray-400 ml-2">
                      R$ Unitário
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={novoItem.valor_unitario}
                      onChange={(e) =>
                        setNovoItem({
                          ...novoItem,
                          valor_unitario: e.target.value,
                        })
                      }
                      className="h-12 rounded-2xl font-black bg-gray-50 border-0"
                    />
                  </div>

                  <div className="col-span-4 lg:col-span-2">
                    {editandoItem ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={salvarEdicao}
                          disabled={!novoItem.produto}
                          className="flex-1 h-12 rounded-2xl bg-green-500 hover:bg-green-600"
                        >
                          <Check size={18} />
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setEditandoItem(null);
                            setNovoItem({
                              id: "",
                              produto: "",
                              quantidade: "",
                              unidade: "un",
                              valor_unitario: "",
                            });
                          }}
                          variant="outline"
                          className="flex-1 h-12 rounded-2xl border-gray-200"
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={adicionarItem}
                        disabled={
                          !novoItem.produto ||
                          !novoItem.quantidade ||
                          !novoItem.valor_unitario
                        }
                        className="w-full h-12 rounded-2xl bg-gray-900 text-white font-black uppercase text-[10px] tracking-widest"
                      >
                        <Plus size={16} className="mr-1" /> Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-100 gap-6">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Total Previsto
                  </span>
                  <span className="text-4xl font-black italic text-gray-900 tracking-tighter">
                    {formatCurrency(calcularTotal())}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !formData.categoria || itens.length === 0}
                  className="w-full sm:w-auto h-16 px-12 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-2xl font-black uppercase italic text-sm shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-3" size={20} /> Registrando...
                    </>
                  ) : (
                    "Confirmar Lançamento"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent
            aria-describedby={undefined}
            className="max-w-xl rounded-[45px] p-10 bg-white border-none shadow-2xl"
          >
            <DialogHeader className="mb-4">
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <Sparkles size={24} />
                </div>
                Importador IA
              </DialogTitle>
              <DialogDescription className="hidden">
                Importar notas via texto e IA
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <p className="text-sm font-medium text-gray-500">
                Cole a sua lista do WhatsApp ou bloco de notas. A IA vai separar
                produtos e quantidades.
              </p>

              <Textarea
                placeholder={"Cole sua lista aqui...\n\nEx:\nFubá 2kg\nMussarela 5kg\nCalabresa 4cx"}
                value={textoLista}
                onChange={(e) => {
                  setTextoLista(e.target.value);
                  setErroImportacao(null);
                }}
                className="min-h-[200px] resize-none rounded-[24px] bg-gray-50 border-gray-100 p-6 font-medium text-gray-700 focus:border-purple-300 focus:ring-purple-200"
              />

              {erroImportacao && (
                <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl uppercase tracking-wider">
                  {erroImportacao}
                </div>
              )}
            </div>

            <DialogFooter className="mt-8 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowImportDialog(false);
                  setTextoLista("");
                }}
                className="h-14 rounded-2xl font-bold uppercase text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => void importarListaTexto()}
                disabled={importando || !textoLista.trim()}
                className="h-14 px-8 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black italic uppercase text-xs shadow-lg shadow-purple-200 transition-transform hover:scale-105"
              >
                {importando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Interpretando...
                  </>
                ) : (
                  "Importar Lista"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showQrDialog}
          onOpenChange={(open) => {
            setShowQrDialog(open);
            if (!open) stopQr();
          }}
        >
          <DialogContent
            aria-describedby={undefined}
            className="max-w-xl rounded-[45px] p-8 bg-white border-none shadow-2xl"
          >
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <QrCode size={22} />
                </div>
                Leitor de QR Code (NFC-e)
              </DialogTitle>
              <DialogDescription className="hidden">
                Câmera para QR Code
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-500">
                Aponte a câmera para o QR Code da NFC-e. Assim que detectar, eu puxo
                o link e leio automaticamente.
              </p>

              <div className="rounded-[28px] overflow-hidden border border-gray-100 bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-[320px] object-cover"
                  playsInline
                  muted
                />
              </div>

              {qrError && (
                <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl uppercase tracking-wider">
                  {qrError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => void startQr()}
                  className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black italic uppercase text-xs flex-1"
                >
                  Iniciar Câmera
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    stopQr();
                    setShowQrDialog(false);
                  }}
                  className="h-12 rounded-2xl flex-1 border-gray-200"
                >
                  Fechar
                </Button>
              </div>

              <div className="text-[11px] text-gray-500">
                Se não funcionar no seu navegador, use “Colar Link Sefaz” e cole a
                URL do QR.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
