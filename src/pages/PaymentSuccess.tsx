import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-6">
      <Card className="max-w-md w-full shadow-2xl border-green-200 text-center animate-in fade-in zoom-in duration-500">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-green-800">
            Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-green-700 font-medium">
            Seu acesso vitalício foi liberado com sucesso. Aproveite todas as funcionalidades do Salão de Bolso!
          </p>
          <div className="flex flex-col items-center gap-2 text-muted-foreground pt-4">
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            <span className="text-sm font-medium">Redirecionando para o seu dashboard...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
