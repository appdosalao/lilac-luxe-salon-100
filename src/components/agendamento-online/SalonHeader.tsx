import { Camera } from 'lucide-react';
import { AppLogo } from '@/components/branding/AppLogo';
import type { ConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';

export function SalonHeader({ config }: { config: ConfigAgendamentoOnline }) {
  
  // Imagem de capa grande (banner) - Prioridade para config.banner_url
  const bannerUrl = config.banner_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&auto=format&fit=crop";
  const logoUrl = config.logo_url;

  return (
    <div className="w-full relative mb-14">
      {/* Banner Superior com Efeito de Paralaxe Simples */}
      <div className="h-48 sm:h-72 w-full relative overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
        <img 
          src={bannerUrl} 
          alt="Capa do Salão" 
          className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
        />
        {/* Overlay gradiente mais rico */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent mix-blend-overlay" />
        
        {/* Informações flutuantes no banner */}
        <div className="absolute bottom-6 left-6 right-6 sm:left-12 sm:bottom-10 text-white drop-shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl sm:text-5xl font-black mb-1 tracking-tighter uppercase italic">
              {config.nome_salao}
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-primary rounded-full" />
              <p className="text-white/80 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] max-w-md line-clamp-1">
                {config.descricao || 'Beleza & Estilo Profissional'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Flutuante Centralizado no mobile, lateral no desktop */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 sm:left-12 sm:translate-x-0 z-20">
        <div className="p-1.5 bg-white rounded-[2.5rem] shadow-[0_15px_35px_rgba(0,0,0,0.25)] transform transition-all hover:scale-110 hover:-rotate-3 duration-500 border border-primary/5">
          <div className="bg-primary/5 rounded-[2.2rem] p-1 overflow-hidden w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center relative">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={config.nome_salao} 
                className="w-full h-full object-cover rounded-[2rem]"
              />
            ) : (
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-full h-full flex items-center justify-center rounded-[2rem]">
                <AppLogo size={70} rounded="full" />
              </div>
            )}
            
            {/* Overlay de brilho no logo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
