import { Link } from 'react-router';
import { Button } from '@/react-app/components/ui/button';
import { Card, CardContent } from '@/react-app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/ui/dialog';
import { ShoppingCart, Calculator, BarChart3, PackageCheck, Users, Building2, Package, Truck, Box, ClipboardList, Gift, Copy, Check, Settings, FileText, MessageSquare, Sparkles, TrendingUp, AlertCircle, Clock, Pencil, Plus, DollarSign } from 'lucide-react';
import { useAppAuth } from '@/react-app/contexts/AppAuthContext';
import { NIVEL_LABELS } from '@/react-app/types/auth';
import { useState, useEffect, useCallback } from 'react';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
  bgLight: string;
  roles: string[];
}

const ALL_MODULES: ModuleCard[] = [
  {
    id: 'compras',
    title: 'Compras',
    description: 'Nova provisão de gasto',
    href: '/comprador',
    icon: ShoppingCart,
    gradient: 'from-orange-500 to-amber-500',
    shadowColor: 'shadow-orange-500/30',
    bgLight: 'bg-orange-50',
    roles: ['comprador', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'recebimento',
    title: 'Recebimento',
    description: 'Conferir entregas',
    href: '/recebimento',
    icon: PackageCheck,
    gradient: 'from-green-500 to-emerald-500',
    shadowColor: 'shadow-green-500/30',
    bgLight: 'bg-green-50',
    roles: ['operador', 'comprador', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'estoque',
    title: 'Estoque',
    description: 'Auditoria de produtos',
    href: '/estoque',
    icon: Package,
    gradient: 'from-teal-500 to-cyan-500',
    shadowColor: 'shadow-teal-500/30',
    bgLight: 'bg-teal-50',
    roles: ['operador', 'comprador', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'lista-compras',
    title: 'Lista Compras',
    description: 'Solicitações pendentes',
    href: '/lista-compras',
    icon: ClipboardList,
    gradient: 'from-indigo-500 to-blue-500',
    shadowColor: 'shadow-indigo-500/30',
    bgLight: 'bg-indigo-50',
    roles: ['operador', 'comprador', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    description: 'Boletos e pagamentos',
    href: '/financeiro',
    icon: Calculator,
    gradient: 'from-red-500 to-rose-500',
    shadowColor: 'shadow-red-500/30',
    bgLight: 'bg-red-50',
    roles: ['financeiro', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'cotacao',
    title: 'Cotação',
    description: 'Comparar preços',
    href: '/cotacao',
    icon: FileText,
    gradient: 'from-violet-500 to-purple-500',
    shadowColor: 'shadow-violet-500/30',
    bgLight: 'bg-violet-50',
    roles: ['comprador', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'fornecedores',
    title: 'Fornecedores',
    description: 'Cadastro e WhatsApp',
    href: '/fornecedores',
    icon: Truck,
    gradient: 'from-cyan-500 to-sky-500',
    shadowColor: 'shadow-cyan-500/30',
    bgLight: 'bg-cyan-50',
    roles: ['comprador', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'produtos',
    title: 'Produtos',
    description: 'Catálogo de itens',
    href: '/produtos',
    icon: Box,
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'shadow-pink-500/30',
    bgLight: 'bg-pink-50',
    roles: ['comprador', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Gráficos e relatórios',
    href: '/dashboard',
    icon: BarChart3,
    gradient: 'from-amber-500 to-yellow-500',
    shadowColor: 'shadow-amber-500/30',
    bgLight: 'bg-amber-50',
    roles: ['financeiro', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'assessor-ia',
    title: 'Assessor IA',
    description: 'Análises inteligentes',
    href: '/assessor-ia',
    icon: Sparkles,
    gradient: 'from-purple-500 to-fuchsia-500',
    shadowColor: 'shadow-purple-500/30',
    bgLight: 'bg-purple-50',
    roles: ['financeiro', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'caixa-entrada',
    title: 'Caixa Entrada',
    description: 'Processar arquivos',
    href: '/caixa-entrada',
    icon: MessageSquare,
    gradient: 'from-emerald-500 to-green-500',
    shadowColor: 'shadow-emerald-500/30',
    bgLight: 'bg-emerald-50',
    roles: ['comprador', 'financeiro', 'admin_empresa', 'super_admin'],
  },
  {
    id: 'usuarios',
    title: 'Usuários',
    description: 'Gerenciar equipe',
    href: '/usuarios',
    icon: Users,
    gradient: 'from-blue-500 to-indigo-500',
    shadowColor: 'shadow-blue-500/30',
    bgLight: 'bg-blue-50',
    roles: ['admin_empresa', 'super_admin'],
  },
  {
    id: 'empresas',
    title: 'Empresas',
    description: 'Administrar contas',
    href: '/empresas',
    icon: Building2,
    gradient: 'from-slate-500 to-gray-500',
    shadowColor: 'shadow-slate-500/30',
    bgLight: 'bg-slate-50',
    roles: ['super_admin'],
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    description: 'IA, DDA e assinatura',
    href: '/configuracoes',
    icon: Settings,
    gradient: 'from-gray-500 to-zinc-500',
    shadowColor: 'shadow-gray-500/30',
    bgLight: 'bg-gray-50',
    roles: ['admin_empresa', 'super_admin'],
  },
];

const DEFAULT_SHORTCUTS = ['compras', 'financeiro', 'recebimento', 'dashboard'];
const STORAGE_KEY = 'pappi_quick_access';

interface BoletosAlerta {
  vencidos: number;
  totalVencidos: number;
  vencendoHoje: number;
  totalVencendoHoje: number;
  vencendo7Dias: number;
  totalVencendo7Dias: number;
}

interface ValidadeAlerta {
  vencidos: number;
  vencendo7Dias: number;
  vencendo30Dias: number;
}

interface PrecoAlerta {
  tipo: 'acima' | 'abaixo';
  produto_nome: string;
  fornecedor_nome: string;
  variacao_percentual: number;
  preco_atual: number;
  preco_medio: number;
}

interface PrecosAlerta {
  alertas: PrecoAlerta[];
  total: number;
  acima_media: number;
  abaixo_media: number;
}

export default function HomePage() {
    // ✅ Aceita lista de roles e valida se o usuário tem QUALQUER uma
  const hasAnyRole = (roles: string[]) => {
    const role = localUser?.nivel_acesso;
    if (!role) return false;
    return roles.includes(role);
  };
  const { localUser, hasPermission } = useAppAuth();
  const [copiado, setCopiado] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedShortcuts, setSelectedShortcuts] = useState<string[]>([]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [boletosAlerta, setBoletosAlerta] = useState<BoletosAlerta | null>(null);
  const [validadeAlerta, setValidadeAlerta] = useState<ValidadeAlerta | null>(null);
  const [precosAlerta, setPrecosAlerta] = useState<PrecosAlerta | null>(null);
  const [stats, setStats] = useState({ pedidosHoje: 0, aPagar: 0, entregas: 0 });

  // Fetch boletos alerts and stats
  const fetchAlertas = useCallback(async () => {
    try {
      const [lancRes, validadeRes, precosRes] = await Promise.all([
        fetch('/api/lancamentos'),
        fetch('/api/estoque/alertas-validade'),
        fetch('/api/alertas-precos')
      ]);
      
      // Alertas de preços
      if (precosRes.ok) {
        const precosData = await precosRes.json();
        setPrecosAlerta(precosData);
      }
      
      // Validade alerts
      if (validadeRes.ok) {
        const validadeData = await validadeRes.json();
        setValidadeAlerta({
          vencidos: validadeData.vencidos?.count || 0,
          vencendo7Dias: validadeData.vencendo_7dias?.count || 0,
          vencendo30Dias: validadeData.vencendo_30dias?.count || 0,
        });
      }
      
      if (lancRes.ok) {
        const lancamentos = await lancRes.json();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const em7Dias = new Date(hoje);
        em7Dias.setDate(em7Dias.getDate() + 7);
        
        // Filter não pagos
        const naoPagos = lancamentos.filter((l: any) => !l.data_pagamento && l.is_boleto_recebido);
        
        // Vencidos
        const vencidos = naoPagos.filter((l: any) => {
          if (!l.vencimento_real) return false;
          const venc = new Date(l.vencimento_real);
          venc.setHours(0, 0, 0, 0);
          return venc < hoje;
        });
        
        // Vencendo hoje
        const vencendoHoje = naoPagos.filter((l: any) => {
          if (!l.vencimento_real) return false;
          const venc = new Date(l.vencimento_real);
          venc.setHours(0, 0, 0, 0);
          return venc.getTime() === hoje.getTime();
        });
        
        // Vencendo em 7 dias
        const vencendo7Dias = naoPagos.filter((l: any) => {
          if (!l.vencimento_real) return false;
          const venc = new Date(l.vencimento_real);
          venc.setHours(0, 0, 0, 0);
          return venc > hoje && venc <= em7Dias;
        });
        
        setBoletosAlerta({
          vencidos: vencidos.length,
          totalVencidos: vencidos.reduce((acc: number, l: any) => acc + (l.valor_real || l.valor_previsto), 0),
          vencendoHoje: vencendoHoje.length,
          totalVencendoHoje: vencendoHoje.reduce((acc: number, l: any) => acc + (l.valor_real || l.valor_previsto), 0),
          vencendo7Dias: vencendo7Dias.length,
          totalVencendo7Dias: vencendo7Dias.reduce((acc: number, l: any) => acc + (l.valor_real || l.valor_previsto), 0),
        });
        
        // Stats
        const hojeStr = hoje.toISOString().split('T')[0];
        const pedidosHoje = lancamentos.filter((l: any) => l.data_pedido === hojeStr).length;
        const aPagar = naoPagos.length;
        const entregas = lancamentos.filter((l: any) => !l.data_recebimento && l.is_boleto_recebido).length;
        
        setStats({ pedidosHoje, aPagar, entregas });
      }
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  // Load shortcuts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          setSelectedShortcuts(parsed);
          return;
        }
      } catch {}
    }
    // Set default shortcuts based on available modules
// roles do módulo (ex: ["dono","admin"])
// retorna true se o usuário tiver QUALQUER uma delas
const hasAnyRole = (roles: string[]) => {
  const role = localUser?.nivel_acesso;
  if (!role) return false;
  return roles.includes(role);
};
    const defaults = DEFAULT_SHORTCUTS.filter(id => 
      availableModules.some(m => m.id === id)
    );
    while (defaults.length < 4 && availableModules.length > defaults.length) {
      const next = availableModules.find(m => !defaults.includes(m.id));
      if (next) defaults.push(next.id);
    }
    setSelectedShortcuts(defaults.slice(0, 4));
  }, [hasPermission]);

  // Save shortcuts to localStorage
  const saveShortcuts = (shortcuts: string[]) => {
    setSelectedShortcuts(shortcuts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  };

  const availableModules = ALL_MODULES.filter(m => hasAnyRole(m.roles));
  const shortcutModules = selectedShortcuts
    .map(id => ALL_MODULES.find(m => m.id === id))
    .filter((m): m is ModuleCard => m !== undefined && hasAnyRole(m.roles));

  // Fill with placeholders if less than 4
  while (shortcutModules.length < 4) {
    shortcutModules.push(undefined as unknown as ModuleCard);
  }

  const linkIndicacao = `https://dqifkajp3lsn2.mocha.app/cadastro?ref=${localUser?.id || ''}`;
  
  const copiarLink = () => {
    navigator.clipboard.writeText(linkIndicacao);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSelectModule = (moduleId: string) => {
    if (editingSlot === null) return;
    
    const newShortcuts = [...selectedShortcuts];
    // Remove if already exists in another slot
    const existingIndex = newShortcuts.indexOf(moduleId);
    if (existingIndex !== -1 && existingIndex !== editingSlot) {
      newShortcuts[existingIndex] = newShortcuts[editingSlot] || '';
    }
    newShortcuts[editingSlot] = moduleId;
    
    saveShortcuts(newShortcuts.filter(Boolean).slice(0, 4));
    setEditingSlot(null);
    setShowEditor(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-3xl p-5 text-white shadow-xl shadow-orange-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Olá, {localUser?.nome?.split(' ')[0]}! 👋
            </h1>
            <p className="text-white/80 text-sm mt-0.5">
            {localUser?.nivel_acesso ? NIVEL_LABELS[localUser.nivel_acesso] : ""}
{(localUser as any)?.empresa_nome ? ` • ${(localUser as any).empresa_nome}` : ""}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
            {localUser?.nome?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Stats in Hero */}
        <div className="relative grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-lg font-bold">{stats.pedidosHoje}</span>
            </div>
            <p className="text-[10px] text-white/70">Pedidos Hoje</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-lg font-bold">{stats.aPagar}</span>
            </div>
            <p className="text-[10px] text-white/70">A Pagar</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-lg font-bold">{stats.entregas}</span>
            </div>
            <p className="text-[10px] text-white/70">Entregas</p>
          </div>
        </div>
      </div>

      {/* Alertas de Boletos */}
      {boletosAlerta && (boletosAlerta.vencidos > 0 || boletosAlerta.vencendoHoje > 0 || boletosAlerta.vencendo7Dias > 0) && (
        <Card className="border-0 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* Vencidos - Vermelho */}
            {boletosAlerta.vencidos > 0 && (
              <Link 
                to="/financeiro" 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    🚨 {boletosAlerta.vencidos} boleto{boletosAlerta.vencidos > 1 ? 's' : ''} vencido{boletosAlerta.vencidos > 1 ? 's' : ''}!
                  </p>
                  <p className="text-red-100 text-xs">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boletosAlerta.totalVencidos)}
                  </p>
                </div>
                <span className="text-white/80 text-xs">Ver →</span>
              </Link>
            )}
            
            {/* Vencendo Hoje - Laranja */}
            {boletosAlerta.vencendoHoje > 0 && (
              <Link 
                to="/financeiro" 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    ⚠️ {boletosAlerta.vencendoHoje} boleto{boletosAlerta.vencendoHoje > 1 ? 's' : ''} vence{boletosAlerta.vencendoHoje > 1 ? 'm' : ''} HOJE!
                  </p>
                  <p className="text-orange-100 text-xs">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boletosAlerta.totalVencendoHoje)}
                  </p>
                </div>
                <span className="text-white/80 text-xs">Ver →</span>
              </Link>
            )}
            
            {/* Vencendo em 7 dias - Amarelo */}
            {boletosAlerta.vencendo7Dias > 0 && (
              <Link 
                to="/financeiro" 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500 to-amber-400 text-yellow-900 hover:from-yellow-400 hover:to-amber-300 transition-all"
              >
                <div className="w-10 h-10 bg-yellow-900/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    📅 {boletosAlerta.vencendo7Dias} boleto{boletosAlerta.vencendo7Dias > 1 ? 's' : ''} nos próximos 7 dias
                  </p>
                  <p className="text-yellow-800 text-xs">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(boletosAlerta.totalVencendo7Dias)}
                  </p>
                </div>
                <span className="text-yellow-800/80 text-xs">Ver →</span>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alertas de Validade do Estoque */}
      {validadeAlerta && (validadeAlerta.vencidos > 0 || validadeAlerta.vencendo7Dias > 0 || validadeAlerta.vencendo30Dias > 0) && (
        <Card className="border-0 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* Vencidos - Vermelho */}
            {validadeAlerta.vencidos > 0 && (
              <Link 
                to="/estoque" 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    🚨 {validadeAlerta.vencidos} produto{validadeAlerta.vencidos > 1 ? 's' : ''} com validade vencida!
                  </p>
                  <p className="text-red-100 text-xs">Verificar estoque urgente</p>
                </div>
                <span className="text-white/80 text-xs">Ver →</span>
              </Link>
            )}
            
            {/* Vencendo em 7 dias - Laranja */}
            {validadeAlerta.vencendo7Dias > 0 && (
              <Link 
                to="/estoque" 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-600 to-red-500 text-white hover:from-orange-700 hover:to-red-600 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    ⚠️ {validadeAlerta.vencendo7Dias} produto{validadeAlerta.vencendo7Dias > 1 ? 's' : ''} vence{validadeAlerta.vencendo7Dias > 1 ? 'm' : ''} em 7 dias
                  </p>
                  <p className="text-orange-100 text-xs">Priorizar consumo</p>
                </div>
                <span className="text-white/80 text-xs">Ver →</span>
              </Link>
            )}
            
            {/* Vencendo em 30 dias - Amarelo */}
            {validadeAlerta.vencendo30Dias > 0 && (
              <Link 
                to="/estoque" 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-900 hover:from-amber-400 hover:to-yellow-300 transition-all"
              >
                <div className="w-10 h-10 bg-amber-900/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    📦 {validadeAlerta.vencendo30Dias} produto{validadeAlerta.vencendo30Dias > 1 ? 's' : ''} vence{validadeAlerta.vencendo30Dias > 1 ? 'm' : ''} em 30 dias
                  </p>
                  <p className="text-amber-800 text-xs">Atenção ao estoque</p>
                </div>
                <span className="text-amber-800/80 text-xs">Ver →</span>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alertas de Preços */}
      {precosAlerta && precosAlerta.total > 0 && (
        <Card className="border-0 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* Preços acima da média - Vermelho */}
            {precosAlerta.acima_media > 0 && (
              <Link 
                to="/ranking-fornecedores" 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    📈 {precosAlerta.acima_media} produto{precosAlerta.acima_media > 1 ? 's' : ''} acima da média!
                  </p>
                  <p className="text-red-100 text-xs">
                    {precosAlerta.alertas.find(a => a.tipo === 'acima')?.produto_nome}: +{precosAlerta.alertas.find(a => a.tipo === 'acima')?.variacao_percentual}%
                  </p>
                </div>
                <span className="text-white/80 text-xs">Ver →</span>
              </Link>
            )}
            
            {/* Preços abaixo da média - Verde */}
            {precosAlerta.abaixo_media > 0 && (
              <Link 
                to="/ranking-fornecedores" 
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">
                    💰 {precosAlerta.abaixo_media} oportunidade{precosAlerta.abaixo_media > 1 ? 's' : ''} de economia!
                  </p>
                  <p className="text-green-100 text-xs">
                    {precosAlerta.alertas.find(a => a.tipo === 'abaixo')?.produto_nome}: {precosAlerta.alertas.find(a => a.tipo === 'abaixo')?.variacao_percentual}%
                  </p>
                </div>
                <span className="text-white/80 text-xs">Ver →</span>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Access - 4 Customizable Slots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 dark:text-white">Acesso Rápido</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowEditor(true); setEditingSlot(null); }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 gap-1.5 h-8"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {shortcutModules.slice(0, 4).map((card, index) => {
            if (!card) {
              return (
                <button
                  key={`empty-${index}`}
                  onClick={() => { setShowEditor(true); setEditingSlot(index); }}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[120px] hover:border-gray-300 hover:bg-gray-50 dark:hover:border-gray-600 dark:hover:bg-gray-800 transition-all"
                >
                  <Plus className="w-8 h-8 text-gray-300" />
                  <span className="text-xs text-gray-400 mt-2">Adicionar</span>
                </button>
              );
            }
            
            const Icon = card.icon;
            return (
              <Link 
                key={card.id} 
                to={card.href} 
                className={`${card.bgLight} dark:bg-gray-800 group relative overflow-hidden rounded-2xl p-4 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] min-h-[120px]`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg ${card.shadowColor} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white">{card.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.description}</p>
                
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* All Modules Link */}
      <Link 
        to="#" 
        onClick={(e) => { e.preventDefault(); setShowEditor(true); setEditingSlot(null); }}
        className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-2"
      >
        Ver todos os {availableModules.length} módulos →
      </Link>

      {/* Indique e Ganhe */}
      <Card className="border-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold">Indique e Ganhe R$ 20!</h3>
              <p className="text-emerald-100 text-xs">
                Convide comerciantes e ganhe crédito
              </p>
            </div>
            <Button 
              onClick={copiarLink}
              size="sm"
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-3 flex-shrink-0"
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dica do dia */}
      <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">💡 Dica: Use o Assessor IA</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Tire fotos de notas fiscais e a IA extrai os dados automaticamente!
              </p>
              <Link 
                to="/assessor-ia" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mt-1"
              >
                Experimentar →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Selector Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {editingSlot !== null ? 'Escolher Módulo' : 'Todos os Módulos'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Current Shortcuts Preview */}
          {editingSlot === null && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Seus atalhos atuais:</p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((index) => {
                  const moduleId = selectedShortcuts[index];
                  const module = ALL_MODULES.find(m => m.id === moduleId);
                  return (
                    <button
                      key={index}
                      onClick={() => setEditingSlot(index)}
                      className={`relative p-2 rounded-xl border-2 ${editingSlot === index ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'} transition-all`}
                    >
                      {module ? (
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 bg-gradient-to-br ${module.gradient} rounded-lg flex items-center justify-center`}>
                            <module.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] text-gray-600 dark:text-gray-300 mt-1 truncate w-full text-center">{module.title}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-1">
                          <Plus className="w-6 h-6 text-gray-300" />
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Vazio</span>
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <Pencil className="w-2 h-2 text-white" />
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">Clique em um atalho para trocar</p>
            </div>
          )}

          {/* Module List */}
          <div className="space-y-2">
            {editingSlot !== null && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Escolha o módulo para a posição {editingSlot + 1}:
              </p>
            )}
            {availableModules.map((module) => {
              const Icon = module.icon;
              const isSelected = selectedShortcuts.includes(module.id);
              const slotIndex = selectedShortcuts.indexOf(module.id);
              
              return (
                <button
                  key={module.id}
                  onClick={() => {
                    if (editingSlot !== null) {
                      handleSelectModule(module.id);
                    } else {
                      if (!isSelected && selectedShortcuts.length < 4) {
                        saveShortcuts([...selectedShortcuts, module.id].slice(0, 4));
                      } else if (isSelected) {
                        saveShortcuts(selectedShortcuts.filter(id => id !== module.id));
                      }
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-800' 
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${module.gradient} rounded-lg flex items-center justify-center shadow ${module.shadowColor}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-800 dark:text-white text-sm">{module.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{module.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {slotIndex + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {editingSlot !== null && (
            <Button 
              variant="outline" 
              onClick={() => setEditingSlot(null)}
              className="w-full mt-2"
            >
              Cancelar
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
