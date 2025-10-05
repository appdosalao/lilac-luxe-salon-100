import { useState } from 'react';
import { 
  Scissors, 
  DollarSign, 
  Clock, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Servico, ServicoFiltros } from '@/types/servico';

interface ServicosListProps {
  servicos: Servico[];
  filtros: ServicoFiltros;
  onFiltrosChange: (filtros: ServicoFiltros) => void;
  onEdit: (servico: Servico) => void;
  onDelete: (id: string) => void;
}

export default function ServicosList({
  servicos,
  filtros,
  onFiltrosChange,
  onEdit,
  onDelete,
}: ServicosListProps) {
  const [servicoParaExcluir, setServicoParaExcluir] = useState<Servico | null>(null);

  const formatarValor = (valor: number) => {
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  const formatarDuracao = (duracao: number) => {
    const horas = Math.floor(duracao / 60);
    const minutos = duracao % 60;
    
    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  };

  const handleOrdenacaoChange = (campo: 'nome' | 'valor' | 'duracao') => {
    const novasDirecao = filtros.ordenacao === campo && filtros.direcao === 'asc' ? 'desc' : 'asc';
    onFiltrosChange({
      ...filtros,
      ordenacao: campo,
      direcao: novasDirecao
    });
  };

  const getIconeOrdenacao = (campo: 'nome' | 'valor' | 'duracao') => {
    if (filtros.ordenacao !== campo) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return filtros.direcao === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-primary" /> : 
      <ArrowDown className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros e Ordenação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviço..."
                value={filtros.busca || ''}
                onChange={(e) => onFiltrosChange({ ...filtros, busca: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select
              value={`${filtros.ordenacao}-${filtros.direcao}`}
              onValueChange={(value) => {
                const [ordenacao, direcao] = value.split('-') as ['nome' | 'valor' | 'duracao', 'asc' | 'desc'];
                onFiltrosChange({ ...filtros, ordenacao, direcao });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
                <SelectItem value="valor-asc">Valor (Menor primeiro)</SelectItem>
                <SelectItem value="valor-desc">Valor (Maior primeiro)</SelectItem>
                <SelectItem value="duracao-asc">Duração (Menor primeiro)</SelectItem>
                <SelectItem value="duracao-desc">Duração (Maior primeiro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {filtros.busca && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltrosChange({ ...filtros, busca: '' })}
              >
                Limpar busca
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Serviços */}
      <div className="space-y-4">
        {servicos.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground">
                {filtros.busca ? 
                  'Tente ajustar os filtros ou criar um novo serviço.' :
                  'Comece criando seu primeiro serviço.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Cabeçalho da lista para desktop */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hidden md:block">
              <CardContent className="p-4">
                <div className="grid grid-cols-5 gap-4 items-center font-semibold text-sm text-muted-foreground">
                  <button 
                    className="flex items-center gap-2 hover:text-foreground transition-colors text-left"
                    onClick={() => handleOrdenacaoChange('nome')}
                  >
                    Serviço
                    {getIconeOrdenacao('nome')}
                  </button>
                  <button 
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                    onClick={() => handleOrdenacaoChange('valor')}
                  >
                    Valor
                    {getIconeOrdenacao('valor')}
                  </button>
                  <button 
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                    onClick={() => handleOrdenacaoChange('duracao')}
                  >
                    Duração
                    {getIconeOrdenacao('duracao')}
                  </button>
                  <div>Descrição</div>
                  <div className="text-right">Ações</div>
                </div>
              </CardContent>
            </Card>

            {/* Items da lista */}
            {servicos.map((servico) => (
              <Card 
                key={servico.id} 
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-200"
              >
                <CardContent className="p-6">
                  {/* Layout mobile */}
                  <div className="md:hidden space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-lilac-light/10">
                            <Scissors className="h-4 w-4 text-primary" />
                          </div>
                          {servico.nome}
                        </h3>
                        {servico.descricao && (
                          <p className="text-sm text-muted-foreground">{servico.descricao}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(servico)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setServicoParaExcluir(servico)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-primary">{formatarValor(servico.valor)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{formatarDuracao(servico.duracao)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Layout desktop */}
                  <div className="hidden md:grid md:grid-cols-5 md:gap-4 md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-lilac-light/10">
                        <Scissors className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{servico.nome}</h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-primary">{formatarValor(servico.valor)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{formatarDuracao(servico.duracao)}</span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {servico.descricao || '-'}
                      </p>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(servico)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setServicoParaExcluir(servico)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={!!servicoParaExcluir} onOpenChange={() => setServicoParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{servicoParaExcluir?.nome}"? 
              Esta ação não pode ser desfeita e pode afetar agendamentos existentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (servicoParaExcluir) {
                  onDelete(servicoParaExcluir.id);
                  setServicoParaExcluir(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}