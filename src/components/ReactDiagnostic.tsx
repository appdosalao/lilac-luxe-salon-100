// Componente de diagnóstico temporário para verificar instâncias do React
import { useEffect } from 'react';

export const ReactDiagnostic = () => {
  useEffect(() => {
    console.log('✅ React está funcionando corretamente!');
    console.log('React version:', (window as any).React?.version || 'Not available');
  }, []);

  return null;
};
