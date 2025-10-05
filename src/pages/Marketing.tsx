import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Award, Megaphone, Zap, BarChart3, LayoutDashboard } from "lucide-react";
import { ProgramasFidelidade } from "@/components/marketing/ProgramasFidelidade";
import { CampanhasMarketing } from "@/components/marketing/CampanhasMarketing";
import { AutomacoesMarketing } from "@/components/marketing/AutomacoesMarketing";
import { AnaliseClientes } from "@/components/marketing/AnaliseClientes";
import { DashboardMarketing } from "@/components/marketing/DashboardMarketing";

export default function Marketing() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketing</h1>
        <p className="text-muted-foreground">
          Gerencie fidelidade, campanhas e automações para engajar seus clientes
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="fidelidade" className="gap-2">
            <Award className="h-4 w-4" />
            Fidelidade
          </TabsTrigger>
          <TabsTrigger value="campanhas" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="gap-2">
            <Zap className="h-4 w-4" />
            Automações
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

        <TabsContent value="campanhas" className="space-y-4">
          <CampanhasMarketing />
        </TabsContent>

        <TabsContent value="automacoes" className="space-y-4">
          <AutomacoesMarketing />
        </TabsContent>

        <TabsContent value="analise" className="space-y-4">
          <AnaliseClientes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
