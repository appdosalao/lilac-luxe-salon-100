import { useState } from 'react';
import { useConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';
import { Sparkles } from 'lucide-react';

interface AppLogoProps {
  size?: number; // px for square container
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const roundedMap: Record<NonNullable<AppLogoProps['rounded']>, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export function AppLogo({ size = 32, rounded = 'xl', className = '' }: AppLogoProps) {
  const { config } = useConfigAgendamentoOnline();
  const [imageError, setImageError] = useState(false);
  const containerStyle = { width: size, height: size };
  const borderClass = roundedMap[rounded];

  const logoUrl =
    config.logo_url && config.logo_url.trim().length > 0
      ? config.logo_url
      : '/icons/icon-192x192.png';

  return (
    <div
      className={`overflow-hidden ${borderClass} border-2 border-primary/40 bg-muted ${className}`}
      style={containerStyle}
      aria-label="Logo do aplicativo"
    >
      {!imageError ? (
        <img
          src={logoUrl}
          alt={config.nome_salao || 'Salão de Bolso'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-lilac-primary flex items-center justify-center">
          <Sparkles className="h-1/2 w-1/2 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
