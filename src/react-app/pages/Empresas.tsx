
"use client";
import { useEffect,useState } from "react";

export default function EmpresasPage(){
 const [empresas,setEmpresas]=useState([]);
 const [nome,setNome]=useState("");

 async function load(){
  const r=await fetch("/api/empresas");
  const d=await r.json();
  setEmpresas(d);
 }

 async function criar(){
  await fetch("/api/empresas",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nome})});
  setNome("");
  load();
 }

 useEffect(()=>{load()},[])

 return (
  <div className="p-6 space-y-4">
   <h1 className="text-2xl font-bold">Empresas</h1>

   <div className="flex gap-2">
    <input className="border p-2 rounded" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nova empresa"/>
    <button className="bg-orange-500 text-white px-4 py-2 rounded" onClick={criar}>Criar</button>
   </div>

   <div className="grid gap-3">
    {empresas.map((e:any)=>(
     <div key={e.id} className="border p-3 rounded">
      {e.name}
     </div>
    ))}
   </div>
  </div>
 )
}
