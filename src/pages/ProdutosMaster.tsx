import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, Plus, Pencil, Trash2, TrendingUp, TrendingDown, History, Loader2, Search, BarChart3 } from 'lucide-react';

interface ProdutoMaster {
  id: number;
  codigo_sku: string | null;
  nome_padrao: string;
  categoria: string | null;
  unidade_medida: string;
  curva_abc: string;
}

interface HistoricoPreco {
  id: number;
  data_compra: string;
  valor_unitario: number;
  quantidade: number | null;
  fornecedor_nome: string | null;
  observacao: string | null;
}

interface Fornecedor {
  id: number;
  nome_fantasia: string;
}

const CURVAS = [
  { value: 'A', label: 'Curva A - Alto Giro', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'B', label: 'Curva B - Médio Giro', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'C', label: 'Curva C - Baixo Giro', color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

const CATEGORIAS = ['Insumos', 'Embalagens', 'Bebidas', 'Limpeza', 'Descartáveis', 'Outros'];
const UNIDADES = ['UN', 'KG', 'L', 'CX', 'PCT', 'FD'];

export default function ProdutosMasterPage() {
  const [produtos, setProdutos] = useState<ProdutoMaster[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCurva, setFilterCurva] = useState<string>('');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<ProdutoMaster | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<ProdutoMaster | null>(null);
  const [historico, setHistorico] = useState<HistoricoPreco[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  
  const [addPrecoOpen, setAddPrecoOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    codigo_sku: '',
    nome_padrao: '',
    categoria: '',
    unidade_medida: 'UN',
    curva_abc: 'C',
  });
  
  const [precoForm, setPrecoForm] = useState({
    fornecedor_id: '',
    data_compra: new Date().toISOString().split('T')[0],
    valor_unitario: '',
    quantidade: '',
    observacao: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, fornRes] = await Promise.all([
        fetch('/api/produtos-master'),
        fetch('/api/fornecedores'),
      ]);
      if (prodRes.ok) setProdutos(await prodRes.json());
      if (fornRes.ok) setFornecedores(await fornRes.json());
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorico = async (produtoId: number) => {
    setLoadingHistorico(true);
    try {
      const res = await fetch(`/api/produtos-master/${produtoId}/historico`);
      if (res.ok) setHistorico(await res.json());
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleOpenDialog = (produto?: ProdutoMaster) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({
        codigo_sku: produto.codigo_sku || '',
        nome_padrao: produto.nome_padrao,
        categoria: produto.categoria || '',
        unidade_medida: produto.unidade_medida,
        curva_abc: produto.curva_abc,
      });
    } else {
      setEditingProduto(null);
      setFormData({
        codigo_sku: '',
        nome_padrao: '',
        categoria: '',
        unidade_medida: 'UN',
        curva_abc: 'C',
      });
    }
    setDialogOpen(true);
  };

  const handleOpenHistorico = async (produto: ProdutoMaster) => {
    setSelectedProduto(produto);
    setHistoricoDialogOpen(true);
    await fetchHistorico(produto.id);
  };

  const handleSave = async () => {
    if (!formData.nome_padrao) {
      alert('Nome do produto é obrigatório');
      return;
    }
    
    setSaving(true);
    try {
      const url = editingProduto 
        ? `/api/produtos-master/${editingProduto.id}`
        : '/api/produtos-master';
      
      const res = await fetch(url, {
        method: editingProduto ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        setDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este produto?')) return;
    
    try {
      await fetch(`/api/produtos-master/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const handleAddPreco = async () => {
    if (!selectedProduto || !precoForm.valor_unitario) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/produtos-master/${selectedProduto.id}/historico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fornecedor_id: precoForm.fornecedor_id || null,
          data_compra: precoForm.data_compra,
          valor_unitario: parseFloat(precoForm.valor_unitario),
          quantidade: precoForm.quantidade ? parseFloat(precoForm.quantidade) : null,
          observacao: precoForm.observacao || null,
        }),
      });
      
      if (res.ok) {
        setAddPrecoOpen(false);
        setPrecoForm({
          fornecedor_id: '',
          data_compra: new Date().toISOString().split('T')[0],
          valor_unitario: '',
          quantidade: '',
          observacao: '',
        });
        fetchHistorico(selectedProduto.id);
      }
    } catch (error) {
      console.error('Erro ao adicionar preço:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getCurvaStyle = (curva: string) => {
    return CURVAS.find(c => c.value === curva)?.color || CURVAS[2].color;
  };

  const calcularVariacao = (): { valor: number; percentual: number } | null => {
    if (historico.length < 2) return null;
    const ultimo = historico[0].valor_unitario;
    const anterior = historico[1].valor_unitario;
    const diff = ultimo - anterior;
    const percentual = ((diff / anterior) * 100);
    return { valor: diff, percentual };
  };

  const filteredProdutos = produtos.filter(p => {
    const matchSearch = p.nome_padrao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (p.codigo_sku && p.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCurva = !filterCurva || p.curva_abc === filterCurva;
    const matchCategoria = !filterCategoria || p.categoria === filterCategoria;
    return matchSearch && matchCurva && matchCategoria;
  });

  // Estatísticas por curva
  const stats = {
    A: produtos.filter(p => p.curva_abc === 'A').length,
    B: produtos.filter(p => p.curva_abc === 'B').length,
    C: produtos.filter(p => p.curva_abc === 'C').length,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Produtos Master</h1>
          <p className="text-gray-600">Gestão inteligente com Curva ABC e histórico de preços</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-orange-500 to-red-500">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Cards de Curva ABC */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterCurva(filterCurva === 'A' ? '' : 'A')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <span className="text-xl font-bold text-green-700">A</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.A}</p>
              <p className="text-xs text-green-600">Alto Giro</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterCurva(filterCurva === 'B' ? '' : 'B')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <span className="text-xl font-bold text-yellow-700">B</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{stats.B}</p>
              <p className="text-xs text-yellow-600">Médio Giro</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterCurva(filterCurva === 'C' ? '' : 'C')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-xl font-bold text-gray-700">C</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{stats.C}</p>
              <p className="text-xs text-gray-600">Baixo Giro</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {CATEGORIAS.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterCurva || filterCategoria) && (
          <Button variant="outline" onClick={() => { setFilterCurva(''); setFilterCategoria(''); }}>
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Lista de Produtos */}
      {filteredProdutos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nenhum produto encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredProdutos.map(produto => (
            <Card key={produto.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${getCurvaStyle(produto.curva_abc)}`}>
                      {produto.curva_abc}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{produto.nome_padrao}</h3>
                        {produto.codigo_sku && (
                          <span className="text-xs text-gray-400">SKU: {produto.codigo_sku}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {produto.categoria && (
                          <Badge variant="outline" className="text-xs">{produto.categoria}</Badge>
                        )}
                        <span className="text-xs text-gray-500">{produto.unidade_medida}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenHistorico(produto)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <History className="w-4 h-4 mr-1" />
                      Preços
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(produto)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(produto.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Novo/Editar Produto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              {editingProduto ? 'Editar Produto' : 'Novo Produto Master'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Código SKU</Label>
                <Input
                  value={formData.codigo_sku}
                  onChange={(e) => setFormData({ ...formData, codigo_sku: e.target.value })}
                  placeholder="ABC123"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={formData.unidade_medida} onValueChange={(v) => setFormData({ ...formData, unidade_medida: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Nome do Produto *</Label>
              <Input
                value={formData.nome_padrao}
                onChange={(e) => setFormData({ ...formData, nome_padrao: e.target.value })}
                placeholder="Farinha de Trigo 25kg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curva ABC</Label>
                <Select value={formData.curva_abc} onValueChange={(v) => setFormData({ ...formData, curva_abc: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURVAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${c.color}`}>{c.value}</span>
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-orange-500 to-red-500">
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico de Preços */}
      <Dialog open={historicoDialogOpen} onOpenChange={setHistoricoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Histórico de Preços - {selectedProduto?.nome_padrao}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {loadingHistorico ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Variação */}
                {historico.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Último Preço</p>
                        <p className="text-2xl font-bold text-gray-800">
                          {formatCurrency(historico[0].valor_unitario)}
                        </p>
                      </div>
                      {calcularVariacao() && (
                        <div className={`flex items-center gap-2 ${calcularVariacao()!.percentual >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {calcularVariacao()!.percentual >= 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {calcularVariacao()!.percentual >= 0 ? '+' : ''}{calcularVariacao()!.percentual.toFixed(1)}%
                            </p>
                            <p className="text-xs">
                              {calcularVariacao()!.valor >= 0 ? '+' : ''}{formatCurrency(calcularVariacao()!.valor)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão Adicionar Preço */}
                {!addPrecoOpen && (
                  <Button onClick={() => setAddPrecoOpen(true)} className="w-full mb-4" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Novo Preço
                  </Button>
                )}

                {/* Form Adicionar Preço */}
                {addPrecoOpen && (
                  <Card className="mb-4 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Novo Registro de Preço</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Data</Label>
                          <Input
                            type="date"
                            value={precoForm.data_compra}
                            onChange={(e) => setPrecoForm({ ...precoForm, data_compra: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor Unitário *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={precoForm.valor_unitario}
                            onChange={(e) => setPrecoForm({ ...precoForm, valor_unitario: e.target.value })}
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Fornecedor</Label>
                          <Select value={precoForm.fornecedor_id} onValueChange={(v) => setPrecoForm({ ...precoForm, fornecedor_id: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {fornecedores.map(f => (
                                <SelectItem key={f.id} value={f.id.toString()}>{f.nome_fantasia}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Quantidade</Label>
                          <Input
                            type="number"
                            value={precoForm.quantidade}
                            onChange={(e) => setPrecoForm({ ...precoForm, quantidade: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setAddPrecoOpen(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button onClick={handleAddPreco} disabled={saving || !precoForm.valor_unitario} className="flex-1 bg-blue-600 hover:bg-blue-700">
                          {saving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lista de Histórico */}
                {historico.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum histórico de preços</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historico.map((h, index) => {
                      const anterior = historico[index + 1];
                      const variacao = anterior ? ((h.valor_unitario - anterior.valor_unitario) / anterior.valor_unitario) * 100 : 0;
                      
                      return (
                        <div key={h.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                          <div>
                            <p className="text-sm text-gray-500">{formatDate(h.data_compra)}</p>
                            {h.fornecedor_nome && (
                              <p className="text-xs text-gray-400">{h.fornecedor_nome}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(h.valor_unitario)}</p>
                            {variacao !== 0 && (
                              <p className={`text-xs ${variacao > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
