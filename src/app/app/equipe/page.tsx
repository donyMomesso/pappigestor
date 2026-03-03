"use client";

import { useEffect, useState } from "react";
import { Button } from "@/react-app/components/ui/button";
import { UserPlus, Trash2, Shield, User, Zap, Crown } from "lucide-react";

interface Usuario {
  id: number;
  nome: string | null;
  email: string;
  funcao: "master" | "comum";
  cargo: string;
}

interface PlanoInfo {
  nome: string;
  limite: number;
  usado: number;
}

interface EquipeResponse {
  usuarios: Usuario[];
  plano: PlanoInfo;
}

function getEmpresaId(): string {
  // padrão novo
  const empresaId = localStorage.getItem("empresa_id") || "";
  if (empresaId) return empresaId;

  // fallback antigo (se você ainda tiver gravado assim)
  const pId = localStorage.getItem("pId") || "";
  return pId;
}

export default function EquipePage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [emailNovo, setEmailNovo] = useState("");
  const [cargo, setCargo] = useState("Operador");
  const [statusPlano, setStatusPlano] = useState<PlanoInfo>({
    usado: 0,
    limite: 1,
    nome: "Grátis",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEquipe() {
    const empresaId = getEmpresaId();
    if (!empresaId) {
      alert("Selecione uma empresa antes (Tela Empresas).");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/usuarios", {
        headers: {
          "x-empresa-id": empresaId,
          // fallback temporário
          "x-pizzaria-id": empresaId,
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Erro GET /api/admin/usuarios:", res.status, txt);
        setUsuarios([]);
        return;
      }

      const data = (await res.json().catch(() => null)) as EquipeResponse | null;

      setUsuarios(Array.isArray(data?.usuarios) ? data!.usuarios : []);
      setStatusPlano(data?.plano ?? { usado: 0, limite: 1, nome: "Grátis" });
    } catch (e) {
      console.error("Erro fetchEquipe:", e);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  async function associarEmail() {
    const empresaId = getEmpresaId();
    if (!empresaId) {
      alert("Selecione uma empresa antes (Tela Empresas).");
      return;
    }

    const email = emailNovo.trim().toLowerCase();
    if (!email) {
      alert("Informe um e-mail válido.");
      return;
    }

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-empresa-id": empresaId,
          // fallback temporário
          "x-pizzaria-id": empresaId,
        },
        body: JSON.stringify({ email, cargo }),
      });

      if (res.ok) {
        setEmailNovo("");
        await fetchEquipe();
        return;
      }

      const errData = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(errData?.error ?? "Erro ao associar e-mail.");
    } catch (e) {
      console.error("Erro associarEmail:", e);
      alert("Falha na comunicação com o servidor.");
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-900 p-8 rounded-[40px] border-b-4 border-orange-600 text-white shadow-2xl">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            Minha Equipe
          </h1>
          <p className="text-orange-400 font-bold italic uppercase text-[10px] tracking-widest mt-2">
            Gestão de acessos e dependentes
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-black uppercase italic opacity-60 text-white">
              Plano {statusPlano.nome}
            </span>
            {statusPlano.nome === "Pro" ? (
              <Crown size={14} className="text-orange-400" />
            ) : (
              <Zap size={14} className="text-orange-400" />
            )}
          </div>
          <p className="text-2xl font-black italic tracking-tighter">
            {statusPlano.usado} <span className="text-orange-500">/</span> {statusPlano.limite}
            <span className="text-[10px] ml-2 opacity-60">USUÁRIOS</span>
          </p>
        </div>
      </div>

      {/* INPUT DE CONVITE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50 p-6 rounded-[30px] border-2 border-orange-100">
        <input
          type="email"
          placeholder="E-mail do funcionário"
          className="p-4 rounded-2xl border-none ring-2 ring-orange-200 focus:ring-orange-500 outline-none font-bold italic text-sm"
          value={emailNovo}
          onChange={(e) => setEmailNovo(e.target.value)}
        />
        <select
          className="p-4 rounded-2xl border-none ring-2 ring-orange-200 font-bold italic text-sm bg-white outline-none"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
        >
          <option>Operador</option>
          <option>Gerente</option>
          <option>Cozinha</option>
          <option>Pizzaiolo</option>
          <option>Chapeiro</option>
          <option>Atendente</option>
        </select>
        <Button
          onClick={associarEmail}
          className="bg-orange-600 hover:bg-orange-700 text-white h-full rounded-2xl font-black italic uppercase text-xs tracking-widest flex gap-2"
        >
          <UserPlus size={16} /> Associar E-mail
        </Button>
      </div>

      {/* LISTA */}
      {loading && (
        <div className="p-6 bg-white border-2 border-zinc-100 rounded-[30px] text-sm font-bold text-zinc-500">
          Carregando equipe...
        </div>
      )}

      <div className="space-y-3">
        {usuarios.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-6 bg-white border-2 border-zinc-100 rounded-[30px] hover:border-orange-200 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 rounded-2xl text-zinc-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                {user.funcao === "master" ? <Shield size={20} /> : <User size={20} />}
              </div>
              <div>
                <p className="font-black italic uppercase text-sm text-zinc-900">
                  {user.nome || "Aguardando Login..."}
                </p>
                <p className="text-[10px] font-bold text-zinc-400 italic uppercase tracking-tighter">
                  {user.email} • {user.cargo}
                </p>
              </div>
            </div>

            {user.funcao !== "master" && (
              <button
                className="p-3 text-zinc-300 hover:text-red-500 transition-colors"
                onClick={() => alert("Remover usuário: implementar DELETE /api/admin/usuarios/:id")}
                title="Remover"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}