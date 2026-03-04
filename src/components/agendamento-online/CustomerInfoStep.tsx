import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone } from 'lucide-react';
import { AgendamentoOnlineData, FormErrors } from '@/types/agendamento-online';

interface CustomerInfoStepProps {
  formData: AgendamentoOnlineData;
  errors: FormErrors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CustomerInfoStep({ formData, errors, handleInputChange }: CustomerInfoStepProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <User className="w-5 h-5 text-primary" />
        Seus Dados
      </h3>

      <div className="space-y-2">
        <Label htmlFor="nome_completo">Nome Completo *</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="nome_completo"
            name="nome_completo"
            value={formData.nome_completo}
            onChange={handleInputChange}
            placeholder="Digite seu nome completo"
            className={`pl-10 ${errors.nome_completo ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.nome_completo && (
          <p className="text-sm text-destructive">{errors.nome_completo}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="seu@email.com"
            className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone (WhatsApp) *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="telefone"
            name="telefone"
            type="tel"
            value={formData.telefone}
            onChange={handleInputChange}
            placeholder="(11) 99999-9999"
            className={`pl-10 ${errors.telefone ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.telefone && (
          <p className="text-sm text-destructive">{errors.telefone}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Usaremos este número para enviar a confirmação
        </p>
      </div>
    </div>
  );
}
