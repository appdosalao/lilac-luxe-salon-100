import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const usePaidAccess = () => {
  const { session } = useSupabaseAuth();
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/payment/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsPaid(data.paid_access);
        }
      } catch (error) {
        console.error('Erro ao verificar acesso vitalício:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [session]);

  return { isPaid, isLoading };
};
