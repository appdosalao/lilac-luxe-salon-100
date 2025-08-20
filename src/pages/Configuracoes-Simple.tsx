// Versão simplificada temporária da página de configurações
// Remove hooks e dependências Radix UI para evitar problemas de bundling

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfiguracaoHorarios } from '@/components/configuracoes/ConfiguracaoHorarios-Simple';
import { Clock, Bell, Download, Settings } from 'lucide-react';

export default function Configuracoes() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          <span>Configurações</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure os horários de atendimento, notificações e backup do sistema
        </p>
      </div>

      {/* Navegação Simples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="default" className="h-auto p-4 flex flex-col items-center gap-2">
          <Clock className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Horários</div>
            <div className="text-xs opacity-75">Dias e horários de trabalho</div>
          </div>
        </Button>
        
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
          <Bell className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Notificações</div>
            <div className="text-xs opacity-75">Lembretes e alertas</div>
          </div>
        </Button>
        
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
          <Download className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Backup</div>
            <div className="text-xs opacity-75">Segurança dos dados</div>
          </div>
        </Button>
      </div>

      {/* Conteúdo Principal - Horários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>Horários e Dias de Trabalho</span>
          </CardTitle>
          <CardDescription>
            Configure os dias da semana e horários em que você atenderá clientes. 
            Estas configurações serão respeitadas nos formulários de agendamento.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <ConfiguracaoHorarios />

      {/* Informações Importantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📋 Integração com Agendamentos
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Os horários configurados aqui serão automaticamente aplicados aos formulários 
              de agendamento interno e externo, bloqueando horários indisponíveis.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="p-4">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
              💡 Versão Simplificada
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Esta é uma versão temporária para evitar problemas técnicos. 
              Em breve teremos todas as funcionalidades de configuração disponíveis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}