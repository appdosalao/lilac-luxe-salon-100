import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Database, AlertTriangle, TrendingUp } from 'lucide-react';

const consultasSQL = {
  validacaoBasica: [
    {
      titulo: 'Clientes sem nome ou telefone',
      descricao: 'Identifica clientes com dados obrigatórios faltando',
      sql: `-- Clientes sem nome ou telefone
SELECT * FROM Clientes 
WHERE nome_completo IS NULL 
   OR telefone IS NULL 
   OR telefone = '';`,
      categoria: 'critico'
    },
    {
      titulo: 'Serviços com valor zero ou duração inválida',
      descricao: 'Detecta serviços com configurações incorretas',
      sql: `-- Serviços com valor zero ou duração inválida
SELECT * FROM Servicos 
WHERE valor <= 0 
   OR duracao_min <= 0;`,
      categoria: 'critico'
    },
    {
      titulo: 'Agendamentos sem cliente ou serviço',
      descricao: 'Verifica agendamentos com referências faltando',
      sql: `-- Agendamentos sem cliente ou serviço
SELECT * FROM Agendamentos 
WHERE cliente_id IS NULL 
   OR servico_id IS NULL
   OR data IS NULL 
   OR hora IS NULL;`,
      categoria: 'critico'
    }
  ],
  conflitosAgendamento: [
    {
      titulo: 'Conflitos de horário',
      descricao: 'Detecta agendamentos com sobreposição de horários',
      sql: `-- Agendamentos com conflito de horário
SELECT a1.*, a2.* FROM Agendamentos a1
JOIN Agendamentos a2 ON a1.id_agendamento != a2.id_agendamento
AND a1.data = a2.data
AND a1.status != 'Cancelado'
AND a2.status != 'Cancelado'
AND (
  (a1.hora BETWEEN a2.hora AND DATE_ADD(a2.hora, INTERVAL a2.duracao_min MINUTE))
  OR
  (DATE_ADD(a1.hora, INTERVAL a1.duracao_min MINUTE) BETWEEN a2.hora AND DATE_ADD(a2.hora, INTERVAL a2.duracao_min MINUTE))
);`,
      categoria: 'critico'
    },
    {
      titulo: 'Agendamentos com cliente inexistente',
      descricao: 'Identifica referências para clientes que não existem',
      sql: `-- Agendamentos com cliente inexistente
SELECT a.* FROM Agendamentos a
LEFT JOIN Clientes c ON a.cliente_id = c.id_cliente
WHERE c.id_cliente IS NULL;`,
      categoria: 'alto'
    },
    {
      titulo: 'Agendamentos com serviço inexistente',
      descricao: 'Identifica referências para serviços que não existem',
      sql: `-- Agendamentos com serviço inexistente
SELECT a.* FROM Agendamentos a
LEFT JOIN Servicos s ON a.servico_id = s.id_servico
WHERE s.id_servico IS NULL;`,
      categoria: 'alto'
    }
  ],
  regrasNegocio: [
    {
      titulo: 'Pagamentos com valor maior que total',
      descricao: 'Detecta inconsistências nos valores de pagamento',
      sql: `-- Pagamentos com valor_pago maior que valor_total
SELECT * FROM Agendamentos 
WHERE valor_pago > valor_total;`,
      categoria: 'alto'
    },
    {
      titulo: 'Agendamentos concluídos sem registro financeiro',
      descricao: 'Verifica agendamentos sem lançamento correspondente',
      sql: `-- Agendamentos concluídos sem registro financeiro
SELECT a.* FROM Agendamentos a
LEFT JOIN Lancamentos l ON a.id_agendamento = l.id_agendamento_ref
WHERE a.status = 'Concluído' 
  AND l.id_lancamento IS NULL
  AND a.valor_pago > 0;`,
      categoria: 'alto'
    },
    {
      titulo: 'Status de pagamento inconsistente',
      descricao: 'Identifica status que não conferem com os valores',
      sql: `-- Status de pagamento inconsistente
SELECT * FROM Agendamentos 
WHERE (valor_pago = 0 AND status_pagamento != 'em_aberto')
   OR (valor_pago = valor_total AND status_pagamento != 'pago')
   OR (valor_pago > 0 AND valor_pago < valor_total AND status_pagamento != 'parcial');`,
      categoria: 'medio'
    }
  ],
  melhorias: [
    {
      titulo: 'Serviços nunca agendados',
      descricao: 'Lista serviços que podem ser removidos ou promovidos',
      sql: `-- Serviços que nunca foram agendados
SELECT s.* FROM Servicos s
LEFT JOIN Agendamentos a ON s.id_servico = a.servico_id
WHERE a.servico_id IS NULL;`,
      categoria: 'baixo'
    },
    {
      titulo: 'Clientes inativos',
      descricao: 'Identifica clientes sem agendamentos recentes',
      sql: `-- Clientes sem agendamento há mais de 30 dias
SELECT c.* FROM Clientes c
LEFT JOIN Agendamentos a ON c.id_cliente = a.cliente_id
  AND a.data >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
WHERE a.cliente_id IS NULL;`,
      categoria: 'baixo'
    },
    {
      titulo: 'Análise de duração média por serviço',
      descricao: 'Compara duração programada vs real',
      sql: `-- Tempo médio de atendimento por serviço
SELECT 
  s.nome_servico,
  s.duracao_programada,
  AVG(a.duracao_real) as duracao_media,
  ABS(s.duracao_programada - AVG(a.duracao_real)) as diferenca
FROM Servicos s
JOIN Agendamentos a ON s.id_servico = a.servico_id
WHERE a.status = 'Concluído'
GROUP BY s.id_servico, s.nome_servico, s.duracao_programada
HAVING diferenca > 15;`,
      categoria: 'baixo'
    },
    {
      titulo: 'Retornos em atraso',
      descricao: 'Lista retornos que passaram da data programada',
      sql: `-- Retornos pendentes em atraso
SELECT 
  r.*,
  DATEDIFF(CURDATE(), r.data_retorno) as dias_atraso
FROM Retornos r
WHERE r.status = 'Pendente'
  AND r.data_retorno < CURDATE()
ORDER BY dias_atraso DESC;`,
      categoria: 'medio'
    }
  ]
};

const categoriaCores = {
  critico: 'destructive',
  alto: 'secondary',
  medio: 'outline',
  baixo: 'default'
} as const;

interface ConsultaSQLProps {
  consulta: {
    titulo: string;
    descricao: string;
    sql: string;
    categoria: string;
  };
}

function ConsultaSQL({ consulta }: ConsultaSQLProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{consulta.titulo}</CardTitle>
          <Badge variant={categoriaCores[consulta.categoria as keyof typeof categoriaCores]}>
            {consulta.categoria.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>{consulta.descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
            <code>{consulta.sql}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConsultasSQL() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Consultas SQL de Auditoria</h2>
          <p className="text-muted-foreground">
            Exemplos de consultas para implementação em banco de dados real
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validações Básicas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasSQL.validacaoBasica.length}</div>
            <p className="text-xs text-muted-foreground">Consultas de dados obrigatórios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflitos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasSQL.conflitosAgendamento.length}</div>
            <p className="text-xs text-muted-foreground">Detecção de conflitos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regras de Negócio</CardTitle>
            <Code className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasSQL.regrasNegocio.length}</div>
            <p className="text-xs text-muted-foreground">Validações complexas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Melhorias</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultasSQL.melhorias.length}</div>
            <p className="text-xs text-muted-foreground">Análises e otimizações</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="validacao" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="validacao">Validações Básicas</TabsTrigger>
          <TabsTrigger value="conflitos">Conflitos</TabsTrigger>
          <TabsTrigger value="regras">Regras de Negócio</TabsTrigger>
          <TabsTrigger value="melhorias">Melhorias</TabsTrigger>
        </TabsList>

        <TabsContent value="validacao" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {consultasSQL.validacaoBasica.map((consulta, index) => (
                <ConsultaSQL key={index} consulta={consulta} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="conflitos" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {consultasSQL.conflitosAgendamento.map((consulta, index) => (
                <ConsultaSQL key={index} consulta={consulta} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="regras" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {consultasSQL.regrasNegocio.map((consulta, index) => (
                <ConsultaSQL key={index} consulta={consulta} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="melhorias" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {consultasSQL.melhorias.map((consulta, index) => (
                <ConsultaSQL key={index} consulta={consulta} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}