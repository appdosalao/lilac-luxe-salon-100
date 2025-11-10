import { z } from 'zod';
import DOMPurify from 'dompurify';

// Schema for online booking form validation
export const agendamentoOnlineSchema = z.object({
  nome_completo: z.string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase(),
  
  telefone: z.string()
    .trim()
    .regex(/^\+?[1-9][0-9]{7,14}$/, 'Telefone inválido')
    .transform(val => val.replace(/\D/g, '')),
  
  servico_id: z.string().uuid('Serviço inválido'),
  
  data: z.string().refine((date) => {
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  }, 'Data deve ser hoje ou no futuro'),
  
  horario: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  
  observacoes: z.string()
    .trim()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional()
    .transform((val) => val ? DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }) : '')
});

export type AgendamentoOnlineValidated = z.infer<typeof agendamentoOnlineSchema>;
