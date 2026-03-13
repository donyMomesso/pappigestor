import { useMemo } from 'react';
import { api, apiPublic } from '@/lib/api';

export function useApi() {
  return useMemo(() => ({ api, apiPublic }), []);
}
