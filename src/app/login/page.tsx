"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import {
  Mail,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [message, setMessage] = useState("");

  const LOGO_URL = "/logo.png";

  async function handleMagicLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingMagic(true);
    setMessage("");

    try {
      setMessage(
        "Login por e-mail ainda não está ativo nesta migração. Use Entrar com Google."
      );
    } catch (error) {
      console.error(error);
      setMessage("Erro ao iniciar login por e-mail.");
    } finally {
      setLoadingMagic(false);
    }
  }

  async function loginGoogle() {
    setLoadingGoogle(true);
    setMessage("");

    try {
      await signIn("google", { callbackUrl: "/app" });
    } catch (error) {
      console.error(error);
      setMessage("Erro ao conectar com Google.");
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[url('/banner.png')] bg-cover bg-center p-6">
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-[40px] border border-white bg-white shadow-2xl md:grid-cols-2">
        {/* Lado Esquerdo */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-orange-500 to-pink-600 p-12 text-white">
          <div className="relative z-10">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-lg">
              <Image
                src={LOGO_URL}
                alt="Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </div>

            <h1 className="text-4xl font-black uppercase leading-tight tracking-tighter italic">
              Pappi <br /> Gestor
            </h1>

            <p className="mt-4 font-medium uppercase tracking-tighter text-orange-100 italic">
              O cérebro estratégico do seu negócio.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <Feature icon={<Zap size={18} />} text="Processamento instantâneo de NF-e" />
            <Feature icon={<ShieldCheck size={18} />} text="Gestão multiempresa segura" />
            <Feature icon={<Sparkles size={18} />} text="Assessor IA em tempo real" />
          </div>

          <div className="pointer-events-none absolute -bottom-10 -left-10 text-[180px] font-black opacity-10 italic">
            P
          </div>
        </div>

        {/* Lado Direito */}
        <div className="flex flex-col justify-center bg-white p-12">
          <div className="mb-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-800 italic">
              Acesso ao Sistema
            </h2>
            <p className="mt-1 text-sm font-bold uppercase tracking-widest text-gray-400">
              Escolha seu método de entrada
            </p>
          </div>

          <div className="space-y-6">
            {/* Login Google */}
            <button
              onClick={() => void loginGoogle()}
              disabled={loadingGoogle || loadingMagic}
              className="flex w-full items-center justify-center gap-4 rounded-2xl border-2 border-gray-100 bg-white py-4 text-xs font-black uppercase tracking-widest text-gray-700 italic shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50/30 active:scale-95 disabled:opacity-50"
            >
              <div className="rounded-lg border border-gray-100 bg-white p-1 shadow-sm">
                <Image
                  src="https://www.google.com/favicon.ico"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                  alt="Google"
                />
              </div>

              {loadingGoogle ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Entrar com Google"
              )}
            </button>

            {/* Separador */}
            <div className="relative flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-black uppercase text-gray-300 italic">
                OU
              </span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* Magic link */}
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  E-mail Profissional
                </label>

                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="exemplo@empresa.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border-none bg-gray-50 py-4 pl-12 pr-4 font-medium outline-none transition-all focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <button
                disabled={loadingGoogle || loadingMagic}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gray-900 py-4 font-black uppercase tracking-widest text-white italic shadow-xl transition-all hover:bg-black active:scale-95 disabled:opacity-50"
              >
                {loadingMagic ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Receber Acesso <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-center text-[10px] font-black uppercase tracking-tighter italic text-rose-600">
              {message}
            </div>
          )}

          <div className="mt-12 flex items-center justify-between border-t border-gray-50 pt-8 opacity-50">
            <div className="flex items-center gap-2">
              <Building2 size={14} />
              <span className="text-[10px] font-black uppercase tracking-tighter">
                Pappi SaaS Universal
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              v2.0.26
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-tighter italic">
      <div className="rounded-lg bg-white/10 p-2">{icon}</div>
      <span>{text}</span>
    </div>
  );
}