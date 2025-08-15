import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import CronogramasList from "@/components/cronogramas/CronogramasList";
import RetornosList from "@/components/cronogramas/RetornosList";

export default function Cronogramas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cronogramas</h1>
        <p className="text-muted-foreground">
          Gerencie cronogramas de retorno e integre automaticamente com agendamentos
        </p>
      </div>

      <Alert className="bg-purple-50 border-purple-200">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-700">
          <strong>Nova funcionalidade:</strong> Agora você pode ativar cronogramas para gerar agendamentos automáticos! 
          Clique em "Ativar" em qualquer cronograma para criar uma série de agendamentos automaticamente.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="cronogramas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="cronogramas">Cronogramas</TabsTrigger>
          <TabsTrigger value="retornos">Retornos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cronogramas" className="space-y-6">
          <CronogramasList />
        </TabsContent>
        
        <TabsContent value="retornos" className="space-y-6">
          <RetornosList />
        </TabsContent>
      </Tabs>
    </div>
  );
}