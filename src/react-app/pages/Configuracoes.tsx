
"use client";
import { useEffect,useState } from "react";

export default function Configuracoes(){
 const [empresa,setEmpresa]=useState<any>(null);

 async function load(){
  const r=await fetch("/api/app/session",{cache:"no-store"});
  const s=await r.json();

  const empresaId=s?.empresaAtual?.id;

  const res=await fetch("/api/empresa-config",{
   headers:{
    "x-empresa-id":empresaId
   }
  });

  const data=await res.json();
  setEmpresa(data);
 }

 useEffect(()=>{load()},[])

 if(!empresa) return <div className="p-6">Carregando...</div>

 return(
  <div className="p-6">
   <h1 className="text-2xl font-bold mb-4">Minha Empresa</h1>

   <div className="border rounded p-4">
    <div><b>Nome:</b> {empresa.name}</div>
    <div><b>Plano:</b> {empresa.plano}</div>
    <div><b>Status:</b> {empresa.status}</div>
   </div>
  </div>
 )
}
