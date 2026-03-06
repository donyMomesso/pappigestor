import React, { useState, useEffect } from 'react'; // <-- CORREÇÃO: Adicionado o 'React' aqui
import { Button } from '@/react-app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card';
import { Input } from '@/react-app/components/ui/input';
import { Label } from '@/react-app/components/ui/label';
import { Badge } from '@/react-app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/react-app/components/ui/dialog';
import { 
  Calculator, FileText, Check, Clock, AlertTriangle, CreditCard, Image, 
  MessageSquare, Send, ShieldAlert, Loader2, Building2, RefreshCw, 
  Plus, Calendar, Filter, Download, FileSpreadsheet 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/react-app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/react-app/components/ui/select';
import { Textarea } from '@/react-app/components/ui/textarea';
import { useAppAuth } from '@/contexts/AppAuthContext';

// ============================================================================
// TIPAGENS MOVIDAS PARA DENTRO DO FICHEIRO PARA EVITAR ERRO TS2307
// ============================================================================

export interface Lancamento {
  id: number;
  pizzaria_id: string;
  data_pedido: string;
  fornecedor: string;
  categoria: string;
  valor_previsto: number;
  is_boleto_recebido: boolean;
  valor_real: number | null;
  vencimento_real: string | null;
  status_pagamento: 'pendente' | 'pago';
  data_pagamento: string | null;
  anexo_url: string | null;
  comprovante_url: string | null;
  observacao: string | null;
  is_manual: boolean;
  criado_em: string;
}

export const CATEGORIAS = [
  'Insumos e Ingredientes',
  'Embalagens',
  'Bebidas',
  'Materiais de Limpeza',
  'Equipamentos',
  'Serviços Terceirizados',
  'Impostos e Taxas',
  'Marketing e Publicidade',
  'Folha de Pagamento',
  'Aluguel e Condomínio',
  'Energia Elétrica',
  'Água',
  'Internet e Telefone',
  'Manutenção',
  'Outros'
];

type StatusLancamento = 'Aguardando Boleto' | 'A Pagar' | 'Atrasado' | 'Pago';

export function calcularStatus(lancamento: Lancamento): StatusLancamento {
  if (lancamento.status_pagamento === 'pago' || lancamento.data_pagamento) return 'Pago';
  if (!lancamento.is_boleto_recebido) return 'Aguardando Boleto';
  if (lancamento.vencimento_real && new Date(lancamento.vencimento_real) < new Date(new Date().setHours(0, 0, 0, 0))) {
    return 'Atrasado';
  }
  return 'A Pagar';
}

type StatusFilter = 'todos' | StatusLancamento;

interface Fornecedor {
  id: number;
  nome_fantasia: string;
  telefone_whatsapp: string;
}

interface Empresa {
  id: number;
  limite_aprovacao_pagamento: number;
  whatsapp_admin: string;
}

interface BoletoDDA {
  id: number;
  fornecedor_nome: string;
  valor: number;
  vencimento: string;
  codigo_barras: string;
  linha_digitavel: string;
  status_pagamento: string;
  data_pagamento: string | null;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function FinanceiroPage() {
  const { localUser } = useAppAuth();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [selectedLancamento, setSelectedLancamento] = useState<Lancamento | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Dialog de pagamento
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingLancamento, setPayingLancamento] = useState<Lancamento | null>(null);
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  
  // DDA
  const [boletosDDA, setBoletosDDA] = useState<BoletoDDA[]>([]);
  const [loadingDDA, setLoadingDDA] = useState(false);
  const [ddaFilter, setDdaFilter] = useState<'pendente' | 'pago' | 'todos'>('pendente');
  
  // Filtro de período
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Lançamento Manual
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    fornecedor: '',
    categoria: '',
    valor: '',
    descricao: '',
    data_pagamento: '',
    is_pago: false
  });

  const [formData, setFormData] = useState({
    valor_real: '',
    vencimento_real: ''
  });

  useEffect(() => {
    fetchData();
    fetchBoletosDDA();
  }, []);

  useEffect(() => {
    fetchBoletosDDA();
  }, [ddaFilter]);

  const fetchData = async () => {
    try {
      const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
      const email = localUser?.email || localStorage.getItem("userEmail") || "";
      
      const [lancRes, fornRes, empRes] = await Promise.all([
        fetch('/api/lancamentos', { headers: { "x-pizzaria-id": pId, "x-empresa-id": pId, "x-user-email": email } }),
        fetch('/api/fornecedores', { headers: { "x-pizzaria-id": pId, "x-empresa-id": pId, "x-user-email": email } }),
        fetch('/api/empresa-config', { headers: { "x-pizzaria-id": pId, "x-empresa-id": pId, "x-user-email": email } }),
      ]);
      
      if (lancRes.ok) setLancamentos(await lancRes.json());
      if (fornRes.ok) setFornecedores(await fornRes.json());
      if (empRes.ok) setEmpresa(await empRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoletosDDA = async () => {
    setLoadingDDA(true);
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    const email = localUser?.email || localStorage.getItem("userEmail") || "";
    try {
      const statusParam = ddaFilter !== 'todos' ? `?status=${ddaFilter}` : '';
      const res = await fetch(`/api/boletos-dda${statusParam}`, { 
        headers: { "x-pizzaria-id": pId, "x-empresa-id": pId, "x-user-email": email } 
      });
      if (res.ok) {
        setBoletosDDA(await res.json());
      }
    } catch (error) {
      console.error('Erro ao carregar DDA:', error);
    } finally {
      setLoadingDDA(false);
    }
  };

  const handleSaveManual = async () => {
    if (!manualForm.fornecedor || !manualForm.categoria || !manualForm.valor) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setSavingManual(true);
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    const email = localUser?.email || localStorage.getItem("userEmail") || "";
    
    try {
      const response = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "x-pizzaria-id": pId,
          "x-empresa-id": pId,
          "x-user-email": email
        },
        body: JSON.stringify({
          data_pedido: new Date().toISOString().split('T')[0],
          fornecedor: manualForm.fornecedor,
          categoria: manualForm.categoria,
          valor_previsto: parseFloat(manualForm.valor),
          is_boleto_recebido: true,
          valor_real: parseFloat(manualForm.valor),
          vencimento_real: manualForm.data_pagamento || new Date().toISOString().split('T')[0],
          data_pagamento: manualForm.is_pago ? (manualForm.data_pagamento || new Date().toISOString().split('T')[0]) : null,
          observacao: manualForm.descricao,
          is_manual: true
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      alert('Lançamento manual registrado!');
      setManualDialogOpen(false);
      setManualForm({
        fornecedor: '',
        categoria: '',
        valor: '',
        descricao: '',
        data_pagamento: '',
        is_pago: false
      });
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao registrar lançamento');
    } finally {
      setSavingManual(false);
    }
  };

  const handlePagarDDA = async (boleto: BoletoDDA) => {
    if (!confirm(`Confirmar pagamento de ${formatCurrency(boleto.valor)} para ${boleto.fornecedor_nome}?`)) return;
    
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    const email = localUser?.email || localStorage.getItem("userEmail") || "";
    
    try {
      await fetch(`/api/boletos-dda/${boleto.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          "x-pizzaria-id": pId,
          "x-empresa-id": pId,
          "x-user-email": email
        },
        body: JSON.stringify({
          status_pagamento: 'pago',
          data_pagamento: new Date().toISOString().split('T')[0]
        })
      });
      alert('Pagamento registrado!');
      fetchBoletosDDA();
    } catch (error) {
      console.error('Erro ao pagar DDA:', error);
      alert('Erro ao registrar pagamento');
    }
  };

  const getFornecedorWhatsApp = (fornecedorNome: string): string => {
    const fornecedor = fornecedores.find(f => 
      f.nome_fantasia.toLowerCase() === fornecedorNome.toLowerCase()
    );
    return fornecedor?.telefone_whatsapp?.replace(/\D/g, '') || '';
  };

  const handleDarBaixa = (lancamento: Lancamento) => {
    setSelectedLancamento(lancamento);
    setFormData({
      valor_real: lancamento.valor_real?.toString() || lancamento.valor_previsto.toString(),
      vencimento_real: lancamento.vencimento_real || ''
    });
  };

  const handleSaveBoleto = async () => {
    if (!selectedLancamento) return;
    setSaving(true);
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    const email = localUser?.email || localStorage.getItem("userEmail") || "";

    try {
      await fetch(`/api/lancamentos/${selectedLancamento.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          "x-pizzaria-id": pId,
          "x-empresa-id": pId,
          "x-user-email": email
        },
        body: JSON.stringify({
          is_boleto_recebido: true,
          valor_real: parseFloat(formData.valor_real),
          vencimento_real: formData.vencimento_real
        })
      });

      alert('Boleto registrado com sucesso!');
      setSelectedLancamento(null);
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao registrar boleto');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPayDialog = (lancamento: Lancamento) => {
    setPayingLancamento(lancamento);
    setComprovanteUrl(null);
    setPayDialogOpen(true);
  };

  const handleUploadComprovante = async (file: File) => {
    setUploadingComprovante(true);
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    const email = localUser?.email || localStorage.getItem("userEmail") || "";
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'comprovante');
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 
          "x-pizzaria-id": pId,
          "x-empresa-id": pId,
          "x-user-email": email
        },
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setComprovanteUrl(data.url);
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploadingComprovante(false);
    }
  };

  const handlePagar = async () => {
    if (!payingLancamento) return;
    setSaving(true);
    const pId = localStorage.getItem("pId") || localStorage.getItem("pizzariaId") || "";
    const email = localUser?.email || localStorage.getItem("userEmail") || "";

    try {
      await fetch(`/api/lancamentos/${payingLancamento.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          "x-pizzaria-id": pId,
          "x-empresa-id": pId,
          "x-user-email": email
        },
        body: JSON.stringify({
          data_pagamento: new Date().toISOString().split('T')[0],
          comprovante_url: comprovanteUrl
        })
      });

      alert('Pagamento registrado!');
      setPayDialogOpen(false);
      setPayingLancamento(null);
      fetchData();
    } catch (error) {
      console.error('Erro ao pagar:', error);
      alert('Erro ao registrar pagamento');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // WhatsApp Messages
  const generateWhatsAppDivergencia = (lancamento: Lancamento) => {
    const phone = getFornecedorWhatsApp(lancamento.fornecedor);
    const msg = `Olá ${lancamento.fornecedor}, identificamos uma divergência. O pedido foi fechado em ${formatCurrency(lancamento.valor_previsto)}, mas o boleto chegou no valor de ${formatCurrency(lancamento.valor_real)}. Podemos corrigir?`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const generateWhatsAppComprovante = (lancamento: Lancamento) => {
    const phone = getFornecedorWhatsApp(lancamento.fornecedor);
    const msg = `Olá ${lancamento.fornecedor}, segue o comprovante de pagamento referente ao pedido de ${formatDate(lancamento.data_pedido)}. Valor: ${formatCurrency(lancamento.valor_real || lancamento.valor_previsto)}. Obrigado!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const generateWhatsAppAprovacao = (lancamento: Lancamento) => {
    const phone = empresa?.whatsapp_admin?.replace(/\D/g, '') || '';
    const msg = `Aprovação pendente: Boleto de ${lancamento.fornecedor}, valor ${formatCurrency(lancamento.valor_real || lancamento.valor_previsto)}, vencimento ${formatDate(lancamento.vencimento_real)}. Responda SIM para liberar o pagamento no sistema.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const hasDivergencia = (lancamento: Lancamento): boolean => {
    if (!lancamento.valor_real || !lancamento.valor_previsto) return false;
    const diff = Math.abs(lancamento.valor_real - lancamento.valor_previsto);
    const tolerance = lancamento.valor_previsto * 0.01; // 1% tolerance
    return diff > tolerance;
  };

  const needsApproval = (lancamento: Lancamento): boolean => {
    const valor = lancamento.valor_real || lancamento.valor_previsto;
    const limite = empresa?.limite_aprovacao_pagamento || 5000;
    return valor > limite;
  };

  const getStatusBadge = (lancamento: Lancamento) => {
    const status = calcularStatus(lancamento);
    // CORREÇÃO DO ERRO TS2503 - Trocado de JSX.Element para React.ReactNode
    const styles: Record<StatusLancamento, string> = {
      'Aguardando Boleto': 'bg-gray-100 text-gray-700 border-gray-200',
      'A Pagar': 'bg-blue-100 text-blue-700 border-blue-200',
      'Atrasado': 'bg-red-100 text-red-700 border-red-200',
      'Pago': 'bg-green-100 text-green-700 border-green-200'
    };
    
    const icons: Record<StatusLancamento, React.ReactNode> = {
      'Aguardando Boleto': <FileText className="w-3 h-3" />,
      'A Pagar': <Clock className="w-3 h-3" />,
      'Atrasado': <AlertTriangle className="w-3 h-3" />,
      'Pago': <Check className="w-3 h-3" />
    };
    
    return (
      <Badge variant="outline" className={`${styles[status]} flex items-center gap-1`}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  // Filtrar por período de data
  const lancamentosFiltradosPorData = lancamentos.filter(l => {
    if (!dataInicio && !dataFim) return true;
    const dataRef = l.vencimento_real || l.data_pedido;
    if (!dataRef) return true;
    if (dataInicio && dataRef < dataInicio) return false;
    if (dataFim && dataRef > dataFim) return false;
    return true;
  });

  const filteredLancamentos = lancamentosFiltradosPorData.filter(l => {
    if (filter === 'todos') return true;
    return calcularStatus(l) === filter;
  });

  // Contagens
  const totais = {
    aguardando: lancamentosFiltradosPorData.filter(l => calcularStatus(l) === 'Aguardando Boleto').length,
    aPagar: lancamentosFiltradosPorData.filter(l => calcularStatus(l) === 'A Pagar').length,
    atrasado: lancamentosFiltradosPorData.filter(l => calcularStatus(l) === 'Atrasado').length,
    pago: lancamentosFiltradosPorData.filter(l => calcularStatus(l) === 'Pago').length,
  };

  // Totais em valores (R$)
  const totaisValores = {
    geral: lancamentosFiltradosPorData.reduce((acc, l) => acc + (l.valor_real || l.valor_previsto), 0),
    aguardando: lancamentosFiltradosPorData.filter(l => calcularStatus(l) === 'Aguardando Boleto').reduce((acc, l) => acc + l.valor_previsto, 0),
    aPagar: lancamentosFiltradosPorData.filter(l => calcularStatus(l) === 'A Pagar').reduce((acc, l) => acc + (l.valor_real || l.valor_previsto), 0),
    atrasado: lancamentosFiltradosPorData.filter(l => calcularStatus(l) === 'Atrasado').reduce((acc, l) => acc + (l.valor_real || l.valor_previsto), 0),
    pago: lancamentosFiltradosPorData.filter(l => calcularStatus(l) === 'Pago').reduce((acc, l) => acc + (l.valor_real || l.valor_previsto), 0),
  };

  const limparFiltroData = () => {
    setDataInicio('');
    setDataFim('');
  };

  // Exportar para PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(234, 88, 12); // Orange
    doc.text('Pappi Gestor Inteligente', 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório Financeiro', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${dataAtual}`, 14, 38);
    if (dataInicio || dataFim) {
      doc.text(`Período: ${dataInicio || 'início'} a ${dataFim || 'fim'}`, 14, 44);
    }
    
    // Resumo
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumo:', 14, 55);
    
    doc.setFontSize(10);
    doc.text(`Total Geral: ${formatCurrency(totaisValores.geral)}`, 14, 62);
    doc.text(`A Pagar: ${formatCurrency(totaisValores.aPagar)} (${totais.aPagar})`, 14, 68);
    doc.text(`Atrasados: ${formatCurrency(totaisValores.atrasado)} (${totais.atrasado})`, 14, 74);
    doc.text(`Pagos: ${formatCurrency(totaisValores.pago)} (${totais.pago})`, 14, 80);
    
    // Tabela
    const tableData = filteredLancamentos.map(l => [
      formatDate(l.data_pedido),
      l.fornecedor,
      l.categoria,
      formatCurrency(l.valor_previsto),
      formatCurrency(l.valor_real),
      formatDate(l.vencimento_real),
      calcularStatus(l),
      l.data_pagamento ? formatDate(l.data_pagamento) : '-'
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Data', 'Fornecedor', 'Categoria', 'Previsto', 'Real', 'Vencimento', 'Status', 'Pago em']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [234, 88, 12], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 247, 237] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 22 },
        7: { cellWidth: 20 }
      }
    });

    doc.save(`financeiro_${dataAtual.replace(/\//g, '-')}.pdf`);
  };

  // Exportar para Excel
  const exportarExcel = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    // Preparar dados
    const dados = filteredLancamentos.map(l => ({
      'Data Pedido': formatDate(l.data_pedido),
      'Fornecedor': l.fornecedor,
      'Categoria': l.categoria,
      'Valor Previsto': l.valor_previsto,
      'Valor Real': l.valor_real || '',
      'Vencimento': formatDate(l.vencimento_real),
      'Status': calcularStatus(l),
      'Data Pagamento': l.data_pagamento ? formatDate(l.data_pagamento) : ''
    }));

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financeiro');
    
    // Adicionar aba de resumo
    const resumo = [
      { 'Métrica': 'Total Geral', 'Valor': totaisValores.geral, 'Quantidade': lancamentosFiltradosPorData.length },
      { 'Métrica': 'Aguardando Boleto', 'Valor': totaisValores.aguardando, 'Quantidade': totais.aguardando },
      { 'Métrica': 'A Pagar', 'Valor': totaisValores.aPagar, 'Quantidade': totais.aPagar },
      { 'Métrica': 'Atrasado', 'Valor': totaisValores.atrasado, 'Quantidade': totais.atrasado },
      { 'Métrica': 'Pago', 'Valor': totaisValores.pago, 'Quantidade': totais.pago },
    ];
    const wsResumo = XLSX.utils.json_to_sheet(resumo);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Download
    XLSX.writeFile(wb, `financeiro_${dataAtual.replace(/\//g, '-')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle Financeiro</h1>
        <p className="text-sm sm:text-base text-gray-600">Gerencie boletos, pagamentos e divergências</p>
      </div>

      <Tabs defaultValue="provisoes" className="mb-6">
        <TabsList className="grid w-full max-w-xs sm:max-w-md grid-cols-2">
          <TabsTrigger value="provisoes" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Provisões
          </TabsTrigger>
          <TabsTrigger value="dda" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Entrada DDA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dda" className="mt-6">
          {/* Seção DDA */}
          <Card className="mb-6">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Boletos DDA (Débito Direto Autorizado)
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={fetchBoletosDDA}
                  disabled={loadingDDA}
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingDDA ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Filtros DDA */}
              <div className="flex gap-2 mb-6">
                <Button
                  size="sm"
                  variant={ddaFilter === 'pendente' ? 'default' : 'outline'}
                  onClick={() => setDdaFilter('pendente')}
                  className={ddaFilter === 'pendente' ? 'bg-indigo-600' : ''}
                >
                  Pendentes
                </Button>
                <Button
                  size="sm"
                  variant={ddaFilter === 'pago' ? 'default' : 'outline'}
                  onClick={() => setDdaFilter('pago')}
                  className={ddaFilter === 'pago' ? 'bg-green-600' : ''}
                >
                  Pagos
                </Button>
                <Button
                  size="sm"
                  variant={ddaFilter === 'todos' ? 'default' : 'outline'}
                  onClick={() => setDdaFilter('todos')}
                >
                  Todos
                </Button>
              </div>

              {loadingDDA ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : boletosDDA.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Nenhum boleto DDA encontrado</p>
                  <p className="text-sm mt-1">
                    Os boletos do banco aparecerão aqui automaticamente quando integrados ao seu sistema bancário.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {boletosDDA.map((boleto) => (
                    <div 
                      key={boleto.id} 
                      className={`p-4 rounded-lg border ${
                        boleto.status_pagamento === 'pago' 
                          ? 'bg-green-50 border-green-200' 
                          : new Date(boleto.vencimento) < new Date() 
                            ? 'bg-red-50 border-red-200'
                            : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">{boleto.fornecedor_nome}</h4>
                          <p className="text-sm text-gray-500">
                            Vencimento: {formatDate(boleto.vencimento)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            {boleto.linha_digitavel || boleto.codigo_barras}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-800">{formatCurrency(boleto.valor)}</p>
                          {boleto.status_pagamento === 'pago' ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <Check className="w-3 h-3 mr-1" />
                              Pago {boleto.data_pagamento && `em ${formatDate(boleto.data_pagamento)}`}
                            </Badge>
                          ) : new Date(boleto.vencimento) < new Date() ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Vencido
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handlePagarDDA(boleto)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pagar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provisoes" className="mt-6">

      {/* Dialog de Lançamento Manual */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-600" />
              Lançamento Manual
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-500">
              Use para registrar pagamentos sem provisão: PIX, pagamentos avulsos, custos extras, etc.
            </p>

            <div className="space-y-2">
              <Label>Fornecedor / Descrição *</Label>
              <Input
                value={manualForm.fornecedor}
                onChange={(e) => setManualForm({ ...manualForm, fornecedor: e.target.value })}
                placeholder="Ex: Mercado Livre, Conta de Luz, PIX João..."
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={manualForm.categoria}
                onValueChange={(value) => setManualForm({ ...manualForm, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={manualForm.valor}
                onChange={(e) => setManualForm({ ...manualForm, valor: e.target.value })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea
                value={manualForm.descricao}
                onChange={(e) => setManualForm({ ...manualForm, descricao: e.target.value })}
                placeholder="Detalhes do pagamento..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is_pago"
                checked={manualForm.is_pago}
                onChange={(e) => setManualForm({ ...manualForm, is_pago: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded"
              />
              <Label htmlFor="is_pago" className="cursor-pointer">
                Já foi pago
              </Label>
            </div>

            {manualForm.is_pago && (
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={manualForm.data_pagamento}
                  onChange={(e) => setManualForm({ ...manualForm, data_pagamento: e.target.value })}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setManualDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveManual}
                disabled={savingManual || !manualForm.fornecedor || !manualForm.categoria || !manualForm.valor}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                {savingManual ? 'Salvando...' : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Boleto */}
      {selectedLancamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader className="border-b bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Registrar Boleto
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{selectedLancamento.fornecedor}</p>
                <p className="text-gray-500">{selectedLancamento.categoria} • Previsto: {formatCurrency(selectedLancamento.valor_previsto)}</p>
              </div>

              <div className="space-y-2">
                <Label>Valor Real (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_real}
                  onChange={(e) => setFormData({ ...formData, valor_real: e.target.value })}
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={formData.vencimento_real}
                  onChange={(e) => setFormData({ ...formData, vencimento_real: e.target.value })}
                  className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              {/* Alerta de divergência */}
              {formData.valor_real && parseFloat(formData.valor_real) !== selectedLancamento.valor_previsto && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium text-sm">Divergência detectada</span>
                  </div>
                  <p className="text-xs text-yellow-600">
                    Diferença de {formatCurrency(Math.abs(parseFloat(formData.valor_real) - selectedLancamento.valor_previsto))}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLancamento(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveBoleto}
                  disabled={saving || !formData.valor_real || !formData.vencimento_real}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  {saving ? 'Salvando...' : 'Confirmar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog de Pagamento com Comprovante */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Confirmar Pagamento
            </DialogTitle>
          </DialogHeader>
          
          {payingLancamento && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium">{payingLancamento.fornecedor}</p>
                <p className="text-gray-500">
                  Valor: {formatCurrency(payingLancamento.valor_real || payingLancamento.valor_previsto)}
                </p>
                <p className="text-gray-500">
                  Vencimento: {formatDate(payingLancamento.vencimento_real)}
                </p>
              </div>

              {/* Alerta de pagamento alto */}
              {needsApproval(payingLancamento) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="font-medium text-sm">Pagamento acima do limite</span>
                  </div>
                  <p className="text-xs text-red-600 mb-2">
                    Este pagamento excede o limite de {formatCurrency(empresa?.limite_aprovacao_pagamento || 5000)}. 
                    Solicite aprovação do gestor.
                  </p>
                  <a
                    href={generateWhatsAppAprovacao(payingLancamento)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">
                      <MessageSquare className="w-3 h-3 mr-2" />
                      Pedir Aprovação via WhatsApp
                    </Button>
                  </a>
                </div>
              )}

              {/* Divergência */}
              {hasDivergencia(payingLancamento) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium text-sm">Divergência de valor</span>
                  </div>
                  <p className="text-xs text-yellow-600 mb-2">
                    Previsto: {formatCurrency(payingLancamento.valor_previsto)} | 
                    Boleto: {formatCurrency(payingLancamento.valor_real)}
                  </p>
                  <a
                    href={generateWhatsAppDivergencia(payingLancamento)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50">
                      <MessageSquare className="w-3 h-3 mr-2" />
                      Notificar Fornecedor via WhatsApp
                    </Button>
                  </a>
                </div>
              )}

              {/* Upload de Comprovante */}
              <div className="space-y-2">
                <Label>Anexar Comprovante de Pagamento</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadComprovante(file);
                      }
                    }}
                    className="flex-1"
                  />
                </div>
                {uploadingComprovante && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Enviando...
                  </p>
                )}
                {comprovanteUrl && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Comprovante anexado
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPayDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePagar}
                  disabled={saving || (needsApproval(payingLancamento) && !['admin_empresa', 'super_admin'].includes(localUser?.nivel_acesso || ''))}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {saving ? 'Processando...' : 'Confirmar Pagamento'}
                </Button>
              </div>

              {/* Botão de enviar comprovante ao fornecedor */}
              {comprovanteUrl && (
                <a
                  href={generateWhatsAppComprovante(payingLancamento)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                    <Send className="w-3 h-3 mr-2" />
                    Enviar Comprovante via WhatsApp
                  </Button>
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Botões de Ação */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <Button
          onClick={() => setManualDialogOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lançamento Manual
        </Button>
        
        {/* Botões de Exportação */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportarPDF}
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportarExcel}
            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 -mt-4">
        Para pagamentos sem provisão: PIX, pagamentos avulsos, custos extras
      </p>

      {/* Filtro de Período */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="font-medium">Filtrar por período:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Data Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-500">Data Fim</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="mt-1"
                />
              </div>
              {(dataInicio || dataFim) && (
                <Button
                  variant="outline"
                  onClick={limparFiltroData}
                  className="mt-auto"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Totais em Valores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total Geral</p>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(totaisValores.geral)}</p>
            <p className="text-xs text-gray-400">{lancamentosFiltradosPorData.length} lançamentos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <p className="text-xs text-red-600 mb-1">Total Vencido</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(totaisValores.atrasado)}</p>
            <p className="text-xs text-red-400">{totais.atrasado} lançamentos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600 mb-1">Total A Pagar</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totaisValores.aPagar)}</p>
            <p className="text-xs text-blue-400">{totais.aPagar} lançamentos</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <p className="text-xs text-green-600 mb-1">Total Pago</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(totaisValores.pago)}</p>
            <p className="text-xs text-green-400">{totais.pago} lançamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <button
          onClick={() => setFilter('todos')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'todos' 
              ? 'border-gray-800 bg-gray-800 text-white' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold">{lancamentos.length}</p>
          <p className="text-xs opacity-75">Todos</p>
        </button>
        <button
          onClick={() => setFilter('Aguardando Boleto')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'Aguardando Boleto' 
              ? 'border-gray-500 bg-gray-500 text-white' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold">{totais.aguardando}</p>
          <p className="text-xs opacity-75">Aguardando</p>
        </button>
        <button
          onClick={() => setFilter('A Pagar')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'A Pagar' 
              ? 'border-blue-500 bg-blue-500 text-white' 
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <p className="text-2xl font-bold">{totais.aPagar}</p>
          <p className="text-xs opacity-75">A Pagar</p>
        </button>
        <button
          onClick={() => setFilter('Atrasado')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'Atrasado' 
              ? 'border-red-500 bg-red-500 text-white' 
              : 'border-gray-200 bg-white hover:border-red-300'
          }`}
        >
          <p className="text-2xl font-bold">{totais.atrasado}</p>
          <p className="text-xs opacity-75">Atrasado</p>
        </button>
        <button
          onClick={() => setFilter('Pago')}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === 'Pago' 
              ? 'border-green-500 bg-green-500 text-white' 
              : 'border-gray-200 bg-white hover:border-green-300'
          }`}
        >
          <p className="text-2xl font-bold">{totais.pago}</p>
          <p className="text-xs opacity-75">Pago</p>
        </button>
      </div>

      {/* Lista */}
      {filteredLancamentos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nenhum lançamento encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLancamentos.map((lancamento) => {
            const status = calcularStatus(lancamento);
            const divergencia = hasDivergencia(lancamento);
            const precisaAprovacao = needsApproval(lancamento);
            
            return (
              <Card key={lancamento.id} className={divergencia ? 'border-yellow-300' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        divergencia ? 'bg-yellow-100' : 'bg-orange-100'
                      }`}>
                        <Calculator className={`w-6 h-6 ${divergencia ? 'text-yellow-600' : 'text-orange-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">{lancamento.fornecedor}</h3>
                          {getStatusBadge(lancamento)}
                          {divergencia && status !== 'Pago' && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Divergência
                            </Badge>
                          )}
                          {precisaAprovacao && status !== 'Pago' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              Aprovação
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(lancamento.data_pedido)} • {lancamento.categoria}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-gray-600">
                            Prev: <span className="font-medium">{formatCurrency(lancamento.valor_previsto)}</span>
                          </span>
                          {lancamento.valor_real && (
                            <span className={divergencia ? "text-yellow-600" : "text-gray-600"}>
                              Real: <span className="font-medium">{formatCurrency(lancamento.valor_real)}</span>
                            </span>
                          )}
                          {lancamento.vencimento_real && (
                            <span className="text-gray-600">
                              Venc: <span className="font-medium">{formatDate(lancamento.vencimento_real)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {lancamento.anexo_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(lancamento.anexo_url!, '_blank')}
                        >
                          <Image className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {/* Botão WhatsApp para divergência */}
                      {divergencia && status !== 'Pago' && getFornecedorWhatsApp(lancamento.fornecedor) && (
                        <a
                          href={generateWhatsAppDivergencia(lancamento)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      
                      {status === 'Aguardando Boleto' && (
                        <Button
                          size="sm"
                          onClick={() => handleDarBaixa(lancamento)}
                          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Dar Baixa
                        </Button>
                      )}

                      {(status === 'A Pagar' || status === 'Atrasado') && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPayDialog(lancamento)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Pagar
                        </Button>
                      )}

                      {status === 'Pago' && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Pago em {formatDate(lancamento.data_pagamento)}
                          </Badge>
                          {getFornecedorWhatsApp(lancamento.fornecedor) && (
                            <a
                              href={generateWhatsAppComprovante(lancamento)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline" className="border-green-300 text-green-700">
                                <Send className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

        </TabsContent>
      </Tabs>
    </div>
  );
}