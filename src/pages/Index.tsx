import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
          <CardDescription>
            Escolha uma das opções abaixo:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate('/agendamento-online')} 
            className="w-full h-12 text-lg"
            size="lg"
          >
            <Clock className="w-5 h-5 mr-2" />
            Agendar Serviço
          </Button>
          
          <Button 
            onClick={() => navigate('/login')} 
            variant="outline"
            className="w-full h-12 text-lg"
            size="lg"
          >
            <User className="w-5 h-5 mr-2" />
            Área do Profissional
          </Button>
          
          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Novo aqui? <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/cadastro')}>Criar conta</Button></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}