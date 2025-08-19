import * as React from "react";

// Wrapper seguro para TooltipProvider
export const SafeTooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Garantir que o React está completamente carregado
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Se não estiver pronto ou se o React não estiver disponível, renderizar sem tooltip
  if (!isReady || typeof React.useState !== 'function') {
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