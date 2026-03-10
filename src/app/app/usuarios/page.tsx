"use client";
export const dynamic = "force-dynamic";

import { useAppAuth } from "@/contexts/AppAuthContext";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Search,
  MoreHorizontal,
  BadgeCheck,
  Lock,
} from "lucide-react";
import type { ReactNode } from "react";

export default function UsuariosPage() {
  const { localUser } = useAppAuth();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 italic uppercase flex items-center gap-3">
            <Users className="text-orange-500" size={32} />
            Usuários
          </h1>
          <p className="text-gray-500 font-medium italic text-sm">
            Controle de acessos, permissões e gestão de equipa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
            <ShieldCheck size={18} /> Permissões
          </button>
          <button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all">
            <UserPlus size={18} /> Convidar Usuário
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UserStatCard
          title="Total Ativos"
          value="1"
          sub="Utilizadores na conta"
          icon={<BadgeCheck className="text-emerald-500" />}
          color="border-emerald-100"
        />
        <UserStatCard
          title="Convites Pendentes"
          value="0"
          sub="Aguardando aceite"
          icon={<Mail className="text-blue-500" />}
          color="border-blue-100"
        />
        <UserStatCard
          title="Níveis de Acesso"
          value="3"
          sub="Perfis configurados"
          icon={<Lock className="text-purple-500" />}
          color="border-purple-100"
        />
      </div>

      <div className="bg-white p-5 rounded-4xl border border-gray-100 shadow-sm">
        <div className="relative w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Procurar por nome, email ou cargo..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-gray-400">
                  Usuário
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-gray-400">
                  Nível
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-gray-400">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-gray-400">
                  Último Acesso
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-gray-400 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-sm">
                      {localUser?.nome?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-gray-800 font-bold">
                        {localUser?.nome || "Usuário Master"}
                      </p>
                      <p className="text-xs text-gray-400 lowercase">
                        {localUser?.email || "admin@saas.com"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase rounded-lg border border-purple-100">
                    {localUser?.nivel_acesso || "ADMIN"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-tighter">
                      Ativo
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400 font-bold">
                  Hoje, às 14:30
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-300 hover:text-gray-600 transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UserStatCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div
      className={`bg-white p-6 rounded-4xl border-2 ${color} shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Global
        </span>
      </div>
      <h3 className="text-gray-500 font-black text-xs uppercase tracking-widest leading-none mb-1">
        {title}
      </h3>
      <p className="text-3xl font-black italic text-gray-800 tracking-tighter">
        {value}
      </p>
      <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase">
        {sub}
      </p>
    </div>
  );
}
