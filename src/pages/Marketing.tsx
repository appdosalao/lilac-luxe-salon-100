import { ProgramaFidelidadeConfig } from "@/components/marketing/ProgramaFidelidadeConfig";
import { EstatisticasFidelidade } from "@/components/marketing/EstatisticasFidelidade";
import { RecompensasList } from "@/components/marketing/RecompensasList";
import { RankingClientes } from "@/components/marketing/RankingClientes";
import { ClassesFidelidadeList } from "@/components/marketing/ClassesFidelidadeList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award } from "lucide-react";

export default function Marketing() {
  return (
    <div className="space-y-6 sm:space-y-10 p-4 sm:p-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 sm:p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
            <Award className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">Marketing & Fidelidade</h1>
            <p className="text-sm sm:text-lg text-muted-foreground font-medium">
              Gerencie seu programa de recompensas e engaje seus clientes
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 animate-in fade-in duration-500">
        <EstatisticasFidelidade />

        <Tabs defaultValue="configuracao" className="space-y-6 sm:space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1.5 rounded-xl border border-border/50">
            <TabsTrigger value="configuracao" className="text-xs sm:text-base font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg py-2.5">
              Configuração
            </TabsTrigger>
            <TabsTrigger value="recompensas" className="text-xs sm:text-base font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg py-2.5">
              Recompensas
            </TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs sm:text-base font-semibold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg py-2.5">
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuracao" className="space-y-6 sm:space-y-8 focus-visible:outline-none outline-none">
            <ProgramaFidelidadeConfig />
            <ClassesFidelidadeList />
          </TabsContent>

          <TabsContent value="recompensas" className="space-y-6 sm:space-y-8 focus-visible:outline-none outline-none">
            <RecompensasList />
          </TabsContent>

          <TabsContent value="clientes" className="space-y-6 sm:space-y-8 focus-visible:outline-none outline-none">
            <RankingClientes />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
