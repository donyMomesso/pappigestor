"use client";

import React, { createContext, useContext } from "react";

type SelectCtx = {
  value: string;
  onValueChange: (v: string) => void;
};

const Ctx = createContext<SelectCtx | null>(null);

export function Select({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ value, onValueChange }}>{children}</Ctx.Provider>;
}

function useSelect() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("Select components must be used within <Select>");
  return ctx;
}

export function SelectTrigger({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  const { value, onValueChange } = useSelect();

  // We render a native <select> for simplicity.
  // The <SelectContent>/<SelectItem> will be detected via children.
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={`h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 ${className}`}
    >
      {children}
    </select>
  );
}

export function SelectValue(_: { placeholder?: string }) {
  return null;
}

export function SelectContent({ children }: { className?: string; children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}
