import { ProgramaFidelidadeConfig } from "@/components/marketing/ProgramaFidelidadeConfig";
import { EstatisticasFidelidade } from "@/components/marketing/EstatisticasFidelidade";
import { RecompensasList } from "@/components/marketing/RecompensasList";
import { RankingClientes } from "@/components/marketing/RankingClientes";
import { ClassesFidelidadeList } from "@/components/marketing/ClassesFidelidadeList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award } from "lucide-react";

export default function Marketing() {
  return (
    <div className="space-y-4 sm:space-y-8 p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Fidelidade</h1>
            <p className="text-xs sm:text-base text-muted-foreground">
              Programa de recompensas
            </p>
          </div>
        </div>
      </div>

      <EstatisticasFidelidade />

      <Tabs defaultValue="configuracao" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted p-1">
          <TabsTrigger value="configuracao" className="text-xs sm:text-sm">Configuração</TabsTrigger>
          <TabsTrigger value="recompensas" className="text-xs sm:text-sm">Recompensas</TabsTrigger>
          <TabsTrigger value="clientes" className="text-xs sm:text-sm">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao" className="space-y-4 sm:space-y-6">
          <ProgramaFidelidadeConfig />
          <ClassesFidelidadeList />
        </TabsContent>

        <TabsContent value="recompensas" className="space-y-4 sm:space-y-6">
          <RecompensasList />
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4 sm:space-y-6">
          <RankingClientes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
