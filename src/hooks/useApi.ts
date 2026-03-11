// src/hooks/useApi.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export function useApi<T = unknown>(
  path: string,
  opts?: Parameters<typeof api>[1]
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const serializedOpts = useMemo(() => JSON.stringify(opts ?? {}), [opts]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api<T>(path, opts ?? {});
      setData(res);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [path, serializedOpts]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        const res = await api<T>(path, opts ?? {});
        if (!active) return;
        setData(res);
        setError(null);
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Erro ao carregar dados";
        setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [path, serializedOpts]);

  return {
    data,
    error,
    loading,
    refresh: fetchData,
  };
}