import { Camera } from 'lucide-react';
import { useState } from 'react';
import { useConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';
import { AppLogo } from '@/components/branding/AppLogo';

export function SalonHeader() {
  const [imageError, setImageError] = useState(false);
  const { config } = useConfigAgendamentoOnline();
  
  const salonImageUrl = config.logo_url || "/icons/icon-192x192.png";

  return (
    <div className="w-full bg-gradient-to-br from-primary/10 via-primary/5 to-background py-8 px-4 mb-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo/Foto do Salão */}
        <div className="mb-4 flex justify-center">
          <AppLogo size={96} rounded="full" />
        </div>

        {/* Nome do Salão */}
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          {config.nome_salao}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {config.descricao || 'Agende seu horário de forma rápida e prática'}
        </p>
      </div>
    </div>
  );
}
