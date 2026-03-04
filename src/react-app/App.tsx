import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AppAuthProvider } from "@/react-app/contexts/AppAuthContext";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";
import AppLayout from "@/react-app/components/AppLayout";

// Pages
import LoginPage from "@/react-app/pages/Login";
import CadastroPage from "@/react-app/pages/Cadastro";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";
import HomePage from "@/react-app/pages/Home";
import CompradorPage from "@/react-app/pages/Comprador";
import RecebimentoPage from "@/react-app/pages/Recebimento";
import FinanceiroPage from "@/react-app/pages/Financeiro";
import DashboardPage from "@/react-app/pages/Dashboard";
import UsuariosPage from "@/react-app/pages/Usuarios";
import EmpresasPage from "@/react-app/pages/Empresas";
import FornecedoresPage from "@/react-app/pages/Fornecedores";
import ProdutosPage from "@/react-app/pages/Produtos";
import EstoquePage from "@/react-app/pages/Estoque";
import ListaComprasPage from "@/react-app/pages/ListaCompras";
import CotacaoPage from "@/react-app/pages/Cotacao";
import ProdutosMasterPage from "@/react-app/pages/ProdutosMaster";
import AssessorIAPage from "@/react-app/pages/AssessorIA";
import BoletosDDAPage from "@/react-app/pages/BoletosDDA";
import ConfiguracoesPage from "@/react-app/pages/Configuracoes";
import CatalogoGlobalPage from "@/react-app/pages/CatalogoGlobal";
import AceitarConvitePage from "@/react-app/pages/AceitarConvite";
import CaixaEntradaPage from "@/react-app/pages/CaixaEntrada";
import AprovacoesPage from "@/react-app/pages/Aprovacoes";
import OpenFinancePage from "@/react-app/pages/OpenFinance";
import RankingFornecedoresPage from "@/react-app/pages/RankingFornecedores";
import CompraMercadoPage from "@/react-app/pages/CompraMercado";

function ProtectedLayout({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AppAuthProvider>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/convite/:token" element={<AceitarConvitePage />} />

          {/* Assinatura - para usuários com trial expirado */}
          <Route
            path="/assinatura"
            element={
              <ProtectedRoute skipSubscriptionCheck>
                <AppLayout>
                  <ConfiguracoesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <HomePage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/comprador"
            element={
              <ProtectedLayout
                allowedRoles={["comprador", "admin_empresa", "super_admin"]}
              >
                <CompradorPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/recebimento"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "operador",
                  "comprador",
                  "admin_empresa",
                  "super_admin",
                ]}
              >
                <RecebimentoPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/financeiro"
            element={
              <ProtectedLayout
                allowedRoles={["financeiro", "admin_empresa", "super_admin"]}
              >
                <FinanceiroPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedLayout
                allowedRoles={["financeiro", "admin_empresa", "super_admin"]}
              >
                <DashboardPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedLayout allowedRoles={["admin_empresa", "super_admin"]}>
                <UsuariosPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/empresas"
            element={
              <ProtectedLayout allowedRoles={["super_admin"]}>
                <EmpresasPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/fornecedores"
            element={
              <ProtectedLayout
                allowedRoles={["comprador", "admin_empresa", "super_admin"]}
              >
                <FornecedoresPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/produtos"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "operador",
                  "comprador",
                  "admin_empresa",
                  "super_admin",
                ]}
              >
                <ProdutosPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/estoque"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "operador",
                  "comprador",
                  "admin_empresa",
                  "super_admin",
                ]}
              >
                <EstoquePage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/lista-compras"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "operador",
                  "comprador",
                  "admin_empresa",
                  "super_admin",
                ]}
              >
                <ListaComprasPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/compra-mercado"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "operador",
                  "comprador",
                  "admin_empresa",
                  "super_admin",
                ]}
              >
                <CompraMercadoPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/cotacao"
            element={
              <ProtectedLayout
                allowedRoles={["comprador", "admin_empresa", "super_admin"]}
              >
                <CotacaoPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/ranking-fornecedores"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "comprador",
                  "financeiro",
                  "admin_empresa",
                  "super_admin",
                ]}
              >
                <RankingFornecedoresPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/produtos-master"
            element={
              <ProtectedLayout
                allowedRoles={["comprador", "admin_empresa", "super_admin"]}
              >
                <ProdutosMasterPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/assessor-ia"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "financeiro",
                  "comprador",
                  "admin_empresa",
                  "super_admin",
                ]}
              >
                <AssessorIAPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/boletos-dda"
            element={
              <ProtectedLayout
                allowedRoles={["financeiro", "admin_empresa", "super_admin"]}
              >
                <BoletosDDAPage />
              </ProtectedLayout>
            }
          />

          {/* onboarding-dda redirect - agora está em Configurações */}
          <Route
            path="/onboarding-dda"
            element={<Navigate to="/configuracoes?tab=dda" replace />}
          />

          <Route
            path="/configuracoes"
            element={
              <ProtectedLayout allowedRoles={["admin_empresa", "super_admin"]}>
                <ConfiguracoesPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/catalogo-global"
            element={
              <ProtectedLayout allowedRoles={["admin_empresa", "super_admin"]}>
                <CatalogoGlobalPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/caixa-entrada"
            element={
              <ProtectedLayout
                allowedRoles={[
                  "comprador",
                  "financeiro",
                  "admin_empresa",
                  "super_admin",
                ]}
              >
                <CaixaEntradaPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/aprovacoes"
            element={
              <ProtectedLayout allowedRoles={["admin_empresa", "super_admin"]}>
                <AprovacoesPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/open-finance"
            element={
              <ProtectedLayout
                allowedRoles={["financeiro", "admin_empresa", "super_admin"]}
              >
                <OpenFinancePage />
              </ProtectedLayout>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppAuthProvider>
  );
}
