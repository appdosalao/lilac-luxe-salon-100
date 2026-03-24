import { Request, Response, NextFunction } from 'express';
import { supabase } from '@/integrations/supabase/client';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const requirePaidAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        error: "unauthorized", 
        message: "Usuário não autenticado" 
      });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('paid_access')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Erro ao verificar acesso vitalício:', error);
      return res.status(500).json({ 
        error: "internal_error", 
        message: "Erro ao consultar status de pagamento" 
      });
    }

    if (data.paid_access === true) {
      return next();
    }

    return res.status(402).json({
      error: "payment_required",
      message: "Acesso vitalício necessário"
    });

  } catch (error) {
    console.error('Erro no middleware requirePaidAccess:', error);
    return res.status(500).json({
      error: "internal_error",
      message: "Erro interno no servidor"
    });
  }
};
