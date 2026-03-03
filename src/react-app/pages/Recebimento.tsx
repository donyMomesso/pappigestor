import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '@/react-app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/card';
import { Input } from '@/react-app/components/ui/input';
import { Label } from '@/react-app/components/ui/label';
import { ArrowLeft, PackageCheck, Package, Check, AlertCircle, FileText, Receipt, Loader2, Sparkles, Camera, ScanBarcode, Image, X, Trash2, Shield, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/react-app/components/ui/dialog';
import { useAppAuth } from '@/react-app/contexts/AppAuthContext';
import type { Lancamento, ItemLancamento } from '@/shared/types';

const LOGO_URL = 'https://019c7b56-2054-7d0b-9c55-e7a603c40ba8.mochausercontent.com/1771799343659.png';

interface LancamentoComItens extends Lancamento {
  itens: ItemLancamento[];
}

export default function RecebimentoPage() {
  const [lancamentos, setLancamentos] = useState<LancamentoComItens[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLancamento, setSelectedLancamento] = useState<LancamentoComItens | null>(null);
  const [quantidades, setQuantidades] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  
  // Nota Fiscal e Boleto
  const [notaFiscal, setNotaFiscal] = useState({
    numero_nota: '',
    data_emissao: '',
    chave_acesso: '',
    arquivo: null as File | null,
    arquivo_url: '',
  });
  const [boleto, setBoleto] = useState({
    valor_real: '',
    vencimento_real: '',
    arquivo_url: '',
    linha_digitavel: '',
  });
  const [uploadingNF, setUploadingNF] = useState(false);
  const [uploadingBoleto, setUploadingBoleto] = useState(false);
  const [readingWithIA, setReadingWithIA] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Dialogs de feedback
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { localUser } = useAppAuth();

  useEffect(() => {
    fetchLancamentos();
  }, []);

  const fetchLancamentos = async () => {
    try {
      const res = await fetch('/api/lancamentos');
      const data = await res.json();
      
      const lancamentosComItens = await Promise.all(
        data.map(async (l: Lancamento) => {
          const detalhes = await fetch(`/api/lancamentos/${l.id}`).then(r => r.json());
          return detalhes;
        })
      );
      
      const pendentes = lancamentosComItens.filter(
        (l: LancamentoComItens) => !l.data_pagamento
      );
      
      setLancamentos(pendentes);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLancamento = (lancamento: LancamentoComItens) => {
    setSelectedLancamento(lancamento);
    const qtds: Record<number, string> = {};
    lancamento.itens?.forEach(item => {
      qtds[item.id] = item.quantidade_recebida?.toString() || '';
    });
    setQuantidades(qtds);
    
    // Reset forms
    setNotaFiscal({
      numero_nota: '',
      data_emissao: new Date().toISOString().split('T')[0],
      chave_acesso: '',
      arquivo: null,
      arquivo_url: '',
    });
    setBoleto({
      valor_real: lancamento.valor_previsto.toString(),
      vencimento_real: '',
      arquivo_url: '',
      linha_digitavel: '',
    });
  };

  const handleUploadNF = async (file: File) => {
    setUploadingNF(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'nota_fiscal');
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotaFiscal(prev => ({ ...prev, arquivo_url: data.url, arquivo: file }));
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar arquivo');
    } finally {
      setUploadingNF(false);
    }
  };

  const handleReadWithIA = async () => {
    if (!notaFiscal.arquivo_url) {
      alert('Anexe primeiro a imagem ou PDF da nota fiscal');
      return;
    }
    setReadingWithIA(true);
    try {
      const res = await fetch('/api/ia/ler-nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: notaFiscal.arquivo_url }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.dados) {
          setNotaFiscal(prev => ({
            ...prev,
            numero_nota: data.dados.numero_nota || prev.numero_nota,
            data_emissao: data.dados.data_emissao || prev.data_emissao,
            chave_acesso: data.dados.chave_acesso || prev.chave_acesso,
          }));
          if (data.dados.valor_total) {
            setBoleto(prev => ({
              ...prev,
              valor_real: data.dados.valor_total.toString(),
            }));
          }
          alert('Dados extraídos com sucesso! Confira os campos preenchidos.');
        } else {
          alert('Não foi possível extrair os dados. Preencha manualmente.');
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao ler nota com IA');
      }
    } catch (error) {
      console.error('Erro ao ler com IA:', error);
      alert('Erro ao processar nota com IA');
    } finally {
      setReadingWithIA(false);
    }
  };

  const handleUploadBoleto = async (file: File) => {
    setUploadingBoleto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'boleto');
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        setBoleto(prev => ({ ...prev, arquivo_url: data.url }));
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao enviar arquivo');
    } finally {
      setUploadingBoleto(false);
    }
  };

  const handleScanBarcode = async (file: File) => {
    setScanningBarcode(true);
    try {
      // Upload da imagem primeiro
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'barcode_scan');
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadRes.ok) {
        throw new Error('Erro ao fazer upload');
      }
      
      const uploadData = await uploadRes.json();
      
      // Usar IA para extrair código de barras
      const res = await fetch('/api/ia/ler-nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image_url: uploadData.url,
          extrair_apenas: 'chave_acesso'
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.dados?.chave_acesso) {
          setNotaFiscal(prev => ({
            ...prev,
            chave_acesso: data.dados.chave_acesso,
          }));
          alert('Chave de acesso extraída com sucesso!');
        } else {
          alert('Não foi possível ler o código. Tente novamente ou digite manualmente.');
        }
      }
    } catch (error) {
      console.error('Erro ao escanear:', error);
      alert('Erro ao processar imagem');
    } finally {
      setScanningBarcode(false);
    }
  };

  const getItemStatus = (item: ItemLancamento) => {
    const recebido = quantidades[item.id] ? parseFloat(quantidades[item.id]) : null;
    if (recebido === null || recebido === 0) return 'pendente';
    if (recebido === item.quantidade_pedida) return 'ok';
    if (recebido < item.quantidade_pedida) return 'faltando';
    return 'excesso';
  };

  const handleSaveRecebimento = async () => {
    if (!selectedLancamento) return;
    setSaving(true);
    
    const erros: string[] = [];

    try {
      // 1. Atualizar quantidades dos itens
      for (const item of selectedLancamento.itens || []) {
        const qtd = quantidades[item.id];
        if (qtd !== undefined && qtd !== '') {
          try {
            const res = await fetch(`/api/itens/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantidade_recebida: parseFloat(qtd) })
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
              erros.push(`Item ${item.produto}: ${err.error || 'Erro ao atualizar'}`);
            }
          } catch (e) {
            erros.push(`Item ${item.produto}: Erro de conexão`);
          }
        }
      }

      // 2. Registrar Nota Fiscal se preenchida
      if (notaFiscal.numero_nota) {
        try {
          const res = await fetch('/api/notas-fiscais', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lancamento_id: selectedLancamento.id,
              numero_nota: notaFiscal.numero_nota,
              data_emissao: notaFiscal.data_emissao || null,
              chave_acesso: notaFiscal.chave_acesso || null,
              arquivo_url: notaFiscal.arquivo_url || null,
            })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
            erros.push(`Nota Fiscal: ${err.error || 'Erro ao registrar'}`);
          }
        } catch (e) {
          erros.push('Nota Fiscal: Erro de conexão');
        }
      }

      // 3. Registrar Boleto se preenchido
      if (boleto.valor_real && boleto.vencimento_real) {
        try {
          const res = await fetch(`/api/lancamentos/${selectedLancamento.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              is_boleto_recebido: true,
              valor_real: parseFloat(boleto.valor_real),
              vencimento_real: boleto.vencimento_real
            })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
            erros.push(`Boleto: ${err.error || 'Erro ao registrar'}`);
          }
        } catch (e) {
          erros.push('Boleto: Erro de conexão');
        }
      }

      if (erros.length > 0) {
        setErrorMessage(`Alguns itens tiveram problemas:\n${erros.join('\n')}`);
        setShowErrorDialog(true);
      } else {
        setSuccessMessage('Recebimento registrado com sucesso!');
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setErrorMessage('Erro inesperado ao salvar recebimento. Tente novamente.');
      setShowErrorDialog(true);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isAdmin = localUser?.nivel_acesso === 'admin_empresa' || localUser?.nivel_acesso === 'super_admin';

  const handleDeleteClick = (e: React.MouseEvent, lancamentoId: number) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert('Apenas administradores podem excluir lançamentos');
      return;
    }
    setDeletingId(lancamentoId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/lancamentos/${deletingId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao excluir');
      }
      
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchLancamentos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert(error instanceof Error ? error.message : 'Erro ao excluir lançamento');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-green-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Pappi Gestor" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-800">Pappi Gestor</h1>
              <p className="text-xs text-gray-500">Conferência de Recebimento</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {selectedLancamento ? (
          <div className="space-y-6">
            {/* Card de Conferência de Itens */}
            <Card className="border-0 shadow-xl shadow-green-500/10">
              <CardHeader className="border-b bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2">
                  <PackageCheck className="w-5 h-5" />
                  Conferir Entrega - {selectedLancamento.fornecedor}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Data do Pedido:</span>
                      <p className="font-medium">{formatDate(selectedLancamento.data_pedido)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Categoria:</span>
                      <p className="font-medium">{selectedLancamento.categoria}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor Previsto:</span>
                      <p className="font-medium">{formatCurrency(selectedLancamento.valor_previsto)}</p>
                    </div>
                  </div>
                </div>

                {selectedLancamento.itens && selectedLancamento.itens.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Itens para Conferência</h3>
                      <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          <Check className="w-3 h-3" /> OK
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Faltando
                        </span>
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          Pendente
                        </span>
                      </div>
                    </div>
                    {selectedLancamento.itens.map((item) => {
                      const status = getItemStatus(item);
                      const recebido = quantidades[item.id] ? parseFloat(quantidades[item.id]) : 0;
                      const diferenca = item.quantidade_pedida - recebido;
                      
                      return (
                      <div key={item.id} className={`p-4 border rounded-lg transition-colors ${
                        status === 'ok' ? 'bg-green-50 border-green-200' :
                        status === 'faltando' ? 'bg-amber-50 border-amber-200' :
                        status === 'excesso' ? 'bg-blue-50 border-blue-200' :
                        'bg-white border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.produto}</p>
                            <div className="flex items-center gap-3 mt-1 text-sm">
                              <span className="text-gray-600">
                                Pedido: <strong>{item.quantidade_pedida}</strong> {item.unidade}
                              </span>
                              {item.valor_unitario && (
                                <span className="text-gray-500">{formatCurrency(item.valor_unitario)}/un</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {status === 'ok' && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                                <Check className="w-3 h-3" /> OK
                              </span>
                            )}
                            {status === 'faltando' && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                                <AlertCircle className="w-3 h-3" /> Falta {diferenca} {item.unidade}
                              </span>
                            )}
                            {status === 'excesso' && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                                +{Math.abs(diferenca)} {item.unidade}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <label className="text-sm text-gray-600 whitespace-nowrap">Recebido:</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0"
                              value={quantidades[item.id] || ''}
                              onChange={(e) => setQuantidades({ ...quantidades, [item.id]: e.target.value })}
                              className={`w-24 ${
                                status === 'ok' ? 'border-green-300 bg-green-50' :
                                status === 'faltando' ? 'border-amber-300 bg-amber-50' :
                                'border-gray-200'
                              } focus:border-green-500 focus:ring-green-500`}
                            />
                            <span className="text-sm text-gray-500">{item.unidade}</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantidades({ ...quantidades, [item.id]: item.quantidade_pedida.toString() })}
                            className="text-xs"
                          >
                            Qtd Correta
                          </Button>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Este pedido não tem itens detalhados</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card de Nota Fiscal */}
            <Card className="border-0 shadow-xl shadow-blue-500/10">
              <CardHeader className="border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Nota Fiscal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Número da NF</Label>
                    <Input
                      value={notaFiscal.numero_nota}
                      onChange={(e) => setNotaFiscal({ ...notaFiscal, numero_nota: e.target.value })}
                      placeholder="000.000.000"
                    />
                  </div>
                  <div>
                    <Label>Data de Emissão</Label>
                    <Input
                      type="date"
                      value={notaFiscal.data_emissao}
                      onChange={(e) => setNotaFiscal({ ...notaFiscal, data_emissao: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Chave de Acesso (44 dígitos)</Label>
                  <Input
                    value={notaFiscal.chave_acesso}
                    onChange={(e) => setNotaFiscal({ ...notaFiscal, chave_acesso: e.target.value })}
                    placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                    maxLength={54}
                  />
                </div>

                <div>
                  <Label>Foto ou PDF da Nota Fiscal</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex gap-2">
                      {/* Botão Câmera */}
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <Camera className="w-5 h-5 text-blue-500" />
                        <span className="text-blue-600 font-medium text-sm">Tirar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadNF(file);
                          }}
                        />
                      </label>
                      {/* Botão Galeria/Arquivo */}
                      <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                        {uploadingNF ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                        ) : (
                          <>
                            <Image className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-600 text-sm">Galeria/PDF</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadNF(file);
                          }}
                        />
                      </label>
                    </div>
                    
                    {notaFiscal.arquivo_url && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-green-700 flex-1">NF anexada</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setNotaFiscal(prev => ({ ...prev, arquivo_url: '', arquivo: null }))}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    {notaFiscal.arquivo_url && (
                      <Button
                        type="button"
                        onClick={handleReadWithIA}
                        disabled={readingWithIA}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      >
                        {readingWithIA ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Extraindo dados...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Extrair dados com IA
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>Escanear Chave de Acesso (44 dígitos)</Label>
                  <div className="mt-2">
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      {scanningBarcode ? (
                        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      ) : (
                        <>
                          <ScanBarcode className="w-5 h-5 text-orange-500" />
                          <span className="text-orange-600 font-medium text-sm">Escanear Código de Barras</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleScanBarcode(file);
                        }}
                      />
                    </label>
                    {notaFiscal.chave_acesso && (
                      <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Chave detectada: {notaFiscal.chave_acesso.slice(0, 20)}...
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Boleto */}
            <Card className="border-0 shadow-xl shadow-orange-500/10">
              <CardHeader className="border-b bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Boleto
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor do Boleto (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={boleto.valor_real}
                      onChange={(e) => setBoleto({ ...boleto, valor_real: e.target.value })}
                      placeholder="0,00"
                    />
                    {boleto.valor_real && parseFloat(boleto.valor_real) !== selectedLancamento.valor_previsto && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Diferença de {formatCurrency(Math.abs(parseFloat(boleto.valor_real) - selectedLancamento.valor_previsto))}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Data de Vencimento</Label>
                    <Input
                      type="date"
                      value={boleto.vencimento_real}
                      onChange={(e) => setBoleto({ ...boleto, vencimento_real: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Linha Digitável (opcional)</Label>
                  <Input
                    value={boleto.linha_digitavel}
                    onChange={(e) => setBoleto({ ...boleto, linha_digitavel: e.target.value })}
                    placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
                    maxLength={60}
                  />
                </div>
                
                <div>
                  <Label>Foto do Boleto (para conferência)</Label>
                  <div className="mt-2 flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      {uploadingBoleto ? (
                        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-orange-500" />
                          <span className="text-orange-600 font-medium text-sm">Tirar Foto</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadBoleto(file);
                        }}
                      />
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                      <Image className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-600 text-sm">Da Galeria</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadBoleto(file);
                        }}
                      />
                    </label>
                  </div>
                  {boleto.arquivo_url && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-green-700 flex-1">Boleto anexado para conferência</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBoleto(prev => ({ ...prev, arquivo_url: '' }))}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedLancamento(null)}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSaveRecebimento}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar Recebimento
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedidos para Conferir</h2>
              <p className="text-gray-600">Selecione um pedido para conferir a entrega</p>
            </div>

            {lancamentos.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="py-12 text-center">
                  <PackageCheck className="w-16 h-16 mx-auto mb-4 text-green-300" />
                  <p className="text-gray-500">Nenhum pedido pendente para conferir</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {lancamentos.map((lancamento) => (
                  <Card 
                    key={lancamento.id} 
                    className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => handleSelectLancamento(lancamento)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Package className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{lancamento.fornecedor}</h3>
                            <p className="text-sm text-gray-500">
                              {formatDate(lancamento.data_pedido)} • {lancamento.categoria}
                            </p>
                            <p className="text-xs text-gray-400">
                              {lancamento.itens?.length || 0} itens • {formatCurrency(lancamento.valor_previsto)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <Button 
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleDeleteClick(e, lancamento.id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            Conferir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Shield className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. O lançamento e todos os seus itens serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja excluir este lançamento?
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Sucesso
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">{successMessage}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                setSelectedLancamento(null);
                fetchLancamentos();
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Erro */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Atenção
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 whitespace-pre-line">{errorMessage}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowErrorDialog(false)}
            >
              Tentar Novamente
            </Button>
            <Button
              onClick={() => {
                setShowErrorDialog(false);
                setSelectedLancamento(null);
                fetchLancamentos();
              }}
            >
              Voltar para Lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
