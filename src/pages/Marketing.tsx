import { ProgramaFidelidadeConfig } from "@/components/marketing/ProgramaFidelidadeConfig";
import { EstatisticasFidelidade } from "@/components/marketing/EstatisticasFidelidade";
import { RecompensasList } from "@/components/marketing/RecompensasList";
import { RankingClientes } from "@/components/marketing/RankingClientes";
import { ClassesFidelidadeList } from "@/components/marketing/ClassesFidelidadeList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award } from "lucide-react";

export default function Marketing() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Award className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Programa de Fidelidade</h1>
          <p className="text-muted-foreground mt-1">
            Recompense seus clientes mais fiéis e aumente o engajamento
          </p>
        </div>
      </div>

      <EstatisticasFidelidade />

      <Tabs defaultValue="configuracao" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao" className="space-y-6">
          <ProgramaFidelidadeConfig />
          <ClassesFidelidadeList />
        </TabsContent>

        <TabsContent value="recompensas" className="space-y-6">
          <RecompensasList />
        </TabsContent>

        <TabsContent value="clientes" className="space-y-6">
          <RankingClientes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
