import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type PaidAccessCache = {
  userId: string;
  isPaid: boolean;
  cachedAt: number;
};

const STORAGE_KEY = 'paid_access_cache_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

const readCache = (userId: string): boolean | undefined => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PaidAccessCache;
    if (parsed.userId !== userId) return undefined;
    if (!Number.isFinite(parsed.cachedAt)) return undefined;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return undefined;
    return !!parsed.isPaid;
  } catch {
    return undefined;
  }
};

const writeCache = (value: PaidAccessCache) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
  }
};

export const usePaidAccess = () => {
  const { session, usuario } = useSupabaseAuth();

  const userId = session?.user?.id ?? null;

  const paidFromProfile = typeof usuario?.paid_access === 'boolean' ? usuario.paid_access : undefined;

  const query = useQuery({
    queryKey: ['paidAccess', userId],
    enabled: !!userId && paidFromProfile === undefined,
    initialData: userId ? readCache(userId) : undefined,
    staleTime: CACHE_TTL_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('usuarios')
        .select('paid_access')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        return false;
      }

      const isPaid = !!data?.paid_access;
      if (userId) {
        writeCache({ userId, isPaid, cachedAt: Date.now() });
      }
      return isPaid;
    },
  });

  if (!userId) {
    return { isPaid: false, isLoading: false, refetch: undefined };
  }

  return {
    isPaid: paidFromProfile ?? !!query.data,
    isLoading: paidFromProfile === undefined && !query.data && query.isLoading,
    refetch: query.refetch,
  };
};
