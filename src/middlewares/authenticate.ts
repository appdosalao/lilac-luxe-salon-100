import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@/lib/supabaseServer';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'unauthorized', message: 'Token inválido ou expirado' });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'internal_error', message: 'Erro interno na autenticação' });
  }
};
