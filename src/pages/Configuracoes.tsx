import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfiguracaoHorarios } from '@/components/configuracoes/ConfiguracaoHorarios-Simple';
import { ConfiguracaoNotificacoesAvancadas } from '@/components/configuracoes/ConfiguracaoNotificacoesAvancadas';
import { ConfiguracaoBackup } from '@/components/configuracoes/ConfiguracaoBackup';
import { TesteSom } from '@/components/notificacoes/TesteSom';
import { Clock, Bell, Download, Settings } from 'lucide-react';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('horarios');

  return (
    <div className="container-responsive space-responsive-lg">
      <div className="space-responsive-sm">
        <h1 className="text-responsive-3xl font-bold flex flex-col xs:flex-row items-start xs:items-center gap-2">
          <Settings className="h-6 w-6 xs:h-8 xs:w-8 flex-shrink-0" />
          <span>Configurações</span>
        </h1>
        <p className="text-responsive-sm text-muted-foreground">
          Configure os horários de atendimento, notificações e backup do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-responsive-lg">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto gap-2 p-2">
          <TabsTrigger value="horarios" className="flex items-center gap-2 btn-touch text-responsive-sm">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Horários e Dias</span>
            <span className="xs:hidden">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2 btn-touch text-responsive-sm">
            <Bell className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Notificações</span>
            <span className="xs:hidden">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2 btn-touch text-responsive-sm">
            <Download className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Sistema de Backup</span>
            <span className="xs:hidden">Backup</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="horarios" className="space-responsive-lg">
          <Card className="card-responsive">
            <CardHeader className="p-responsive-sm">
              <CardTitle className="flex flex-col xs:flex-row items-start xs:items-center gap-2 text-responsive-lg">
                <Clock className="h-5 w-5 flex-shrink-0" />
                <span>Horários e Dias de Trabalho</span>
              </CardTitle>
              <CardDescription className="text-responsive-sm">
                Configure os dias da semana e horários em que você atenderá clientes. 
                Estas configurações serão respeitadas nos formulários de agendamento.
              </CardDescription>
            </CardHeader>
          </Card>
          <ConfiguracaoHorarios />
        </TabsContent>

        <TabsContent value="notificacoes" className="space-responsive-lg">
          <Card className="card-responsive">
            <CardHeader className="p-responsive-sm">
              <CardTitle className="flex flex-col xs:flex-row items-start xs:items-center gap-2 text-responsive-lg">
                <Bell className="h-5 w-5 flex-shrink-0" />
                <span>Sistema de Notificações</span>
              </CardTitle>
              <CardDescription className="text-responsive-sm">
                Configure notificações push, lembretes de agendamentos, despesas fixas e outras notificações importantes.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-responsive space-responsive">
            <div className="xl:col-span-2">
              <ConfiguracaoNotificacoesAvancadas />
            </div>
            <div className="w-full">
              <TesteSom />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-responsive-lg">
          <Card className="card-responsive">
            <CardHeader className="p-responsive-sm">
              <CardTitle className="flex flex-col xs:flex-row items-start xs:items-center gap-2 text-responsive-lg">
                <Download className="h-5 w-5 flex-shrink-0" />
                <span>Sistema de Backup</span>
              </CardTitle>
              <CardDescription className="text-responsive-sm">
                Mantenha seus dados seguros com backups manuais e automáticos. 
                Exporte seus dados ou configure envios automáticos por e-mail.
              </CardDescription>
            </CardHeader>
          </Card>
          <ConfiguracaoBackup />
        </TabsContent>
      </Tabs>

      {/* Informações Importantes */}
      <div className="grid-responsive-2 space-responsive">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 card-responsive">
          <CardContent className="p-responsive-sm">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-responsive-sm">
              📋 Integração com Agendamentos
            </h3>
            <p className="text-responsive-xs text-blue-700 dark:text-blue-300">
              Os horários configurados aqui serão automaticamente aplicados aos formulários 
              de agendamento interno e externo, bloqueando horários indisponíveis.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20 card-responsive">
          <CardContent className="p-responsive-sm">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-2 text-responsive-sm">
              💡 Dicas de Uso
            </h3>
            <p className="text-responsive-xs text-green-700 dark:text-green-300">
              Configure intervalos personalizados para pausas específicas e 
              ative notificações para não perder nenhum agendamento importante.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}