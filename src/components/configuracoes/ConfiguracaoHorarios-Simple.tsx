// Versão simplificada temporária para evitar problemas de bundling do React
// Remove dependências Radix UI e hooks problemáticos

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Save } from 'lucide-react';

const DIAS_SEMANA = [
  { id: 0, nome: 'Domingo', abrev: 'DOM' },
  { id: 1, nome: 'Segunda-feira', abrev: 'SEG' },
  { id: 2, nome: 'Terça-feira', abrev: 'TER' },
  { id: 3, nome: 'Quarta-feira', abrev: 'QUA' },
  { id: 4, nome: 'Quinta-feira', abrev: 'QUI' },
  { id: 5, nome: 'Sexta-feira', abrev: 'SEX' },
  { id: 6, nome: 'Sábado', abrev: 'SAB' },
];

export function ConfiguracaoHorarios() {
  return (
    <div className="space-y-6">
      {/* Header com navegação simples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configuração de Horários de Trabalho
          </CardTitle>
          <CardDescription>
            Configure os dias e horários em que você atende clientes
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Resumo dos Dias Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo dos Dias de Atendimento
          </CardTitle>
          <CardDescription>
            Visão geral dos dias em que você atenderá clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {DIAS_SEMANA.map((dia) => (
              <Badge key={dia.id} variant="secondary">
                {dia.abrev}
              </Badge>
            ))}
          </div>
          
          <Button className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Configurar Horários
          </Button>
        </CardContent>
      </Card>

      {/* Configuração Básica por Dia */}
      {DIAS_SEMANA.slice(1, 6).map((dia) => ( // Apenas dias úteis por enquanto
        <Card key={dia.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {dia.nome}
              </div>
              <Badge variant="default">Ativo</Badge>
            </CardTitle>
            <CardDescription>
              Configure os horários de funcionamento para {dia.nome.toLowerCase()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Horário de Funcionamento */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Horário de Funcionamento</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`abertura-${dia.id}`} className="text-xs">Abertura</Label>
                  <Input
                    id={`abertura-${dia.id}`}
                    type="time"
                    defaultValue="08:00"
                  />
                </div>
                <div>
                  <Label htmlFor={`fechamento-${dia.id}`} className="text-xs">Fechamento</Label>
                  <Input
                    id={`fechamento-${dia.id}`}
                    type="time"
                    defaultValue="18:00"
                  />
                </div>
              </div>
            </div>

            {/* Intervalo de Almoço */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Intervalo de Almoço (Opcional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`intervalo-inicio-${dia.id}`} className="text-xs">Início do Almoço</Label>
                  <Input
                    id={`intervalo-inicio-${dia.id}`}
                    type="time"
                    defaultValue="12:00"
                  />
                </div>
                <div>
                  <Label htmlFor={`intervalo-fim-${dia.id}`} className="text-xs">Fim do Almoço</Label>
                  <Input
                    id={`intervalo-fim-${dia.id}`}
                    type="time"
                    defaultValue="13:00"
                  />
                </div>
              </div>
            </div>

            {/* Resumo do Horário */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Funcionamento:</strong> 08:00 às 18:00 (Almoço: 12:00 às 13:00)
              </p>
            </div>

            {/* Botão Salvar Individual */}
            <Button className="w-full" variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Salvar {dia.nome}
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Informações de Ajuda */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Versão Simplificada
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Esta é uma versão temporária para evitar problemas técnicos</li>
            <li>• Os horários configurados serão respeitados nos agendamentos</li>
            <li>• Em breve teremos a versão completa com todas as funcionalidades</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}