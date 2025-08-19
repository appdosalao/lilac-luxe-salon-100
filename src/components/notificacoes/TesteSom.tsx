import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX } from 'lucide-react';
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';

export const TesteSom = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { handleNewAppointment, handleServiceCompleted, handleExpenseReminder } = useEnhancedNotifications();

  const playTestSound = async (soundType: 'notification' | 'notification2' | 'notification3') => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      const audio = new Audio(`/sounds/${soundType}.mp3`);
      audio.volume = 0.7;
      await audio.play();
      
      setTimeout(() => setIsPlaying(false), 2000);
    } catch (error) {
      console.error('Erro ao reproduzir som:', error);
      setIsPlaying(false);
    }
  };

  const testNotificationWithSound = async (type: 'appointment' | 'service' | 'expense') => {
    const mockData = {
      id: 'test-' + Date.now(),
      clienteNome: 'Cliente Teste',
      servicoNome: 'Corte de Cabelo',
      data: '2024-01-15',
      hora: '14:00',
      valor: 50
    };

    switch (type) {
      case 'appointment':
        await handleNewAppointment(mockData);
        break;
      case 'service':
        await handleServiceCompleted(mockData);
        break;
      case 'expense':
        await handleExpenseReminder({
          descricao: 'Aluguel',
          valor: 1500,
          dataVencimento: '2024-01-20'
        });
        break;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Teste de Sons
        </CardTitle>
        <CardDescription>
          Teste os diferentes sons de notificação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            onClick={() => playTestSound('notification')}
            disabled={isPlaying}
            className="justify-start"
          >
            {isPlaying ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
            Som Padrão (Notification)
          </Button>
          
          <Button
            variant="outline"
            onClick={() => playTestSound('notification2')}
            disabled={isPlaying}
            className="justify-start"
          >
            {isPlaying ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
            Som Alternativo (Notification 2)
          </Button>
          
          <Button
            variant="outline"
            onClick={() => playTestSound('notification3')}
            disabled={isPlaying}
            className="justify-start"
          >
            {isPlaying ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
            Som Suave (Notification 3)
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Testar Notificações Completas:</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => testNotificationWithSound('appointment')}
            >
              Novo Agendamento
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => testNotificationWithSound('service')}
            >
              Serviço Finalizado
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => testNotificationWithSound('expense')}
            >
              Lembrete Despesa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};