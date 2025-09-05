import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { FiltrosRelatorio, PeriodoRelatorio } from "@/types/relatorio";

interface FiltrosRelatorioProps {
  filtros: FiltrosRelatorio;
  onFiltrosChange: (filtros: FiltrosRelatorio) => void;
}

export default function FiltrosRelatorio({ filtros, onFiltrosChange }: FiltrosRelatorioProps) {
  const handlePeriodoChange = (periodo: PeriodoRelatorio) => {
    onFiltrosChange({ ...filtros, periodo });
  };

  const handleDataInicioChange = (dataInicio: Date | undefined) => {
    onFiltrosChange({ ...filtros, dataInicio });
  };

  const handleDataFimChange = (dataFim: Date | undefined) => {
    onFiltrosChange({ ...filtros, dataFim });
  };

  const handleIncluirChange = (campo: keyof FiltrosRelatorio, valor: boolean) => {
    onFiltrosChange({ ...filtros, [campo]: valor });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros do Relatório</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Período */}
        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={filtros.periodo} onValueChange={handlePeriodoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Esta Semana</SelectItem>
              <SelectItem value="mensal">Este Mês</SelectItem>
              <SelectItem value="trimestral">Este Trimestre</SelectItem>
              <SelectItem value="semestral">Este Semestre</SelectItem>
              <SelectItem value="anual">Este Ano</SelectItem>
              <SelectItem value="personalizado">Período Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Datas personalizadas */}
        {filtros.periodo === 'personalizado' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtros.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtros.dataInicio ? (
                      format(filtros.dataInicio, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtros.dataInicio}
                    onSelect={handleDataInicioChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtros.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtros.dataFim ? (
                      format(filtros.dataFim, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtros.dataFim}
                    onSelect={handleDataFimChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Incluir dados */}
        <div className="space-y-4">
          <Label>Incluir nos Relatórios</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="incluir-lancamentos">Lançamentos Manuais</Label>
            <Switch
              id="incluir-lancamentos"
              checked={filtros.incluirLancamentos}
              onCheckedChange={(checked) => handleIncluirChange('incluirLancamentos', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="incluir-agendamentos">Agendamentos</Label>
            <Switch
              id="incluir-agendamentos"
              checked={filtros.incluirAgendamentos}
              onCheckedChange={(checked) => handleIncluirChange('incluirAgendamentos', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="incluir-contas-fixas">Contas Fixas</Label>
            <Switch
              id="incluir-contas-fixas"
              checked={filtros.incluirContasFixas}
              onCheckedChange={(checked) => handleIncluirChange('incluirContasFixas', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}