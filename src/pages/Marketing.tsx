import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, BarChart3, LayoutDashboard, Users } from "lucide-react";
import { ProgramasFidelidade } from "@/components/marketing/ProgramasFidelidade";
import { AnaliseClientes } from "@/components/marketing/AnaliseClientes";
import { DashboardMarketing } from "@/components/marketing/DashboardMarketing";
import { SistemaReferencias } from "@/components/marketing/SistemaReferencias";

export default function Marketing() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketing & Fidelidade</h1>
        <p className="text-muted-foreground">
          Central completa para gerir programas de fidelidade, campanhas, automações e análise de clientes
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="fidelidade" className="gap-2">
            <Award className="h-4 w-4" />
            Fidelidade
          </TabsTrigger>
          <TabsTrigger value="referencias" className="gap-2">
            <Users className="h-4 w-4" />
            Indicações
          </TabsTrigger>
          <TabsTrigger value="analise" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <DashboardMarketing />
        </TabsContent>

        <TabsContent value="fidelidade" className="space-y-4">
          <ProgramasFidelidade />
        </TabsContent>

        <TabsContent value="referencias" className="space-y-4">
          <SistemaReferencias />
        </TabsContent>

        <TabsContent value="analise" className="space-y-4">
          <AnaliseClientes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
