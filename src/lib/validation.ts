import { z } from 'zod';
import DOMPurify from 'dompurify';

// Schema for online booking form validation
export const agendamentoOnlineSchema = z.object({
  nome_completo: z.string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  
  email: z.string()
    .trim()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase(),
  
  telefone: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length >= 8 && val.length <= 15, 'Telefone inválido'),
  
  // Nem todas as fontes garantem UUID; aceitar qualquer string não vazia
  servico_id: z.string().trim().min(1, 'Selecione um serviço'),
  
  data: z.string().refine((date) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return date >= todayStr;
  }, 'Data deve ser hoje ou no futuro'),
  
  // Aceitar HH:MM ou HH:MM:SS e normalizar para HH:MM
  horario: z.string()
    .regex(/^([0-1]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Horário inválido')
    .transform(h => h.length >= 5 ? h.slice(0, 5) : h),
  
  observacoes: z.string()
    .trim()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional()
    .transform((val) => val ? DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }) : '')
});

export type AgendamentoOnlineValidated = z.infer<typeof agendamentoOnlineSchema>;
