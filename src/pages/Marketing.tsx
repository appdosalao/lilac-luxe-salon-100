import { ProgramaFidelidadeConfig } from "@/components/marketing/ProgramaFidelidadeConfig";
import { EstatisticasFidelidade } from "@/components/marketing/EstatisticasFidelidade";
import { RecompensasList } from "@/components/marketing/RecompensasList";
import { RankingClientes } from "@/components/marketing/RankingClientes";
import { ClassesFidelidadeList } from "@/components/marketing/ClassesFidelidadeList";
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { CampanhasMarketing, AutomacoesMarketing } from "@/components/marketing/CampanhasAutomacoes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Award, Target, MessageSquare, LayoutDashboard } from "lucide-react";

export default function Marketing() {
  return (
    <div className="space-y-4 sm:space-y-8 p-3 sm:p-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Marketing</h1>
            <p className="text-xs sm:text-base text-muted-foreground">
              Impulsione seu salão com campanhas e fidelidade
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted p-1">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 hidden sm:block" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="text-xs sm:text-sm flex items-center gap-2">
            <Target className="h-4 w-4 hidden sm:block" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="text-xs sm:text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 hidden sm:block" />
            Automações
          </TabsTrigger>
          <TabsTrigger value="fidelidade" className="text-xs sm:text-sm flex items-center gap-2">
            <Award className="h-4 w-4 hidden sm:block" />
            Fidelidade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="animate-in fade-in duration-500">
          <MarketingDashboard />
        </TabsContent>

        <TabsContent value="campanhas" className="animate-in fade-in duration-500">
          <CampanhasMarketing />
        </TabsContent>

        <TabsContent value="automacoes" className="animate-in fade-in duration-500">
          <AutomacoesMarketing />
        </TabsContent>

        <TabsContent value="fidelidade" className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
          <EstatisticasFidelidade />
          
          <Tabs defaultValue="configuracao" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

