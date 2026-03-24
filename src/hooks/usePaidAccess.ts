import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';

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
  const { session } = useSupabaseAuth();

  const token = session?.access_token ?? null;
  const userId = session?.user?.id ?? null;

  const query = useQuery({
    queryKey: ['paidAccess', userId],
    enabled: !!token && !!userId,
    initialData: userId ? readCache(userId) : undefined,
    staleTime: CACHE_TTL_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async () => {
      if (!token) return false;
      const response = await fetch('/api/payment/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { paid_access?: boolean };
      const isPaid = !!data?.paid_access;
      if (userId) {
        writeCache({ userId, isPaid, cachedAt: Date.now() });
      }
      return isPaid;
    },
  });

  if (!token || !userId) {
    return { isPaid: false, isLoading: false };
  }

  return { isPaid: !!query.data, isLoading: query.isFetching && query.data === undefined };
};
