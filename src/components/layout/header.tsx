export function TopHeader() {
  return (
    <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-zinc-100 px-3 py-1 rounded-full border">
          <span className="text-xs font-bold text-zinc-600 uppercase">Unidade:</span>
          <span className="text-xs font-bold ml-2 text-zinc-900">Pappi Pizza - Campinas</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
          DM
        </div>
      </div>
    </header>
  )
}
