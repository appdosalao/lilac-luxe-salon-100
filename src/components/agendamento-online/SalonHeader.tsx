import { Camera } from 'lucide-react';
import { useState } from 'react';
import { useConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';
import { AppLogo } from '@/components/branding/AppLogo';

export function SalonHeader() {
  const [imageError, setImageError] = useState(false);
  const { config, loading } = useConfigAgendamentoOnline();
  
  // Imagem de capa grande (banner) - Prioridade para config.banner_url ou uma imagem padrão bonita de salão
  const bannerUrl = config.banner_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&auto=format&fit=crop";
  const logoUrl = config.logo_url;

  if (loading) return <div className="h-48 sm:h-64 w-full bg-muted animate-pulse mb-12" />;

  return (
    <div className="w-full relative mb-12">
      {/* Banner Superior 3D */}
      <div className="h-48 sm:h-64 w-full relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)] group">
        <img 
          src={bannerUrl} 
          alt="Capa do Salão" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Badge do Salão */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-8 sm:bottom-6 text-white drop-shadow-lg">
          <h1 className="text-2xl sm:text-4xl font-bold mb-1">
            {config.nome_salao}
          </h1>
          <p className="text-white/90 text-xs sm:text-sm max-w-md line-clamp-2">
            {config.descricao || 'Transformando sua beleza com excelência e cuidado profissional.'}
          </p>
        </div>
      </div>

      {/* Logo Flutuante 3D */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 sm:left-12 sm:translate-x-0">
        <div className="p-1 bg-white rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.2)] transform transition-transform hover:scale-105 hover:rotate-3 duration-300">
          <div className="bg-primary/5 rounded-full p-1 border-2 border-primary/20">
            <AppLogo size={80} rounded="full" />
          </div>
        </div>
      </div>
    </div>
  );
}
