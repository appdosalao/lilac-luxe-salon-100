import { useState, useEffect, FC, ReactNode } from "react";

// Wrapper seguro para TooltipProvider
export const SafeTooltipProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Verificar se useState está disponível antes de usar hooks
  if (typeof useState !== 'function') {
    console.warn('React hooks not available, rendering children without TooltipProvider');
    return <>{children}</>;
  }

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Garantir que o React está completamente carregado
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Se não estiver pronto, renderizar sem tooltip
  if (!isReady) {
    return <>{children}</>;
  }

  try {
    // Tentar importar e usar o TooltipProvider dinamicamente
    const { TooltipProvider } = require("@/components/ui/tooltip");
    return (
      <TooltipProvider delayDuration={100} skipDelayDuration={500}>
        {children}
      </TooltipProvider>
    );
  } catch (error) {
    console.warn('TooltipProvider failed to load, falling back to children only:', error);
    return <>{children}</>;
  }
};