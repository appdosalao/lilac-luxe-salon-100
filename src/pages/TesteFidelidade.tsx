import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Resultado = {
  programaId?: string;
  clienteId?: string;
  servicoId?: string;
  agendamentoId?: string;
  pontosGanhos?: number;
  pontosDisponiveis?: number;
  rankingPosicao?: number | null;
};

const TesteFidelidade = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const executarTeste = async () => {
    if (!user) {
      toast.error("Faça login para executar o teste");
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      let programa = await supabase
        .from("programas_fidelidade")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (programa.error) throw programa.error;
      if (!programa.data) {
        const novo = await supabase
          .from("programas_fidelidade")
          .insert({
            user_id: user.id,
            nome: "Programa Teste",
            pontos_por_real: 1,
            ativo: true
          })
          .select()
          .single();
        if (novo.error) throw novo.error;
        programa = { data: novo.data, error: null, status: 201, statusText: "" } as any;
      }

      let servico = await supabase
        .from("servicos")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (servico.error) throw servico.error;
      if (!servico.data) {
        const novo = await supabase
          .from("servicos")
          .insert({
            user_id: user.id,
            nome: "Corte Teste",
            descricao: "Serviço teste",
            valor: 100,
            duracao: 60
          })
          .select()
          .single();
        if (novo.error) throw novo.error;
        servico = { data: novo.data, error: null, status: 201, statusText: "" } as any;
      }

      let cliente = await supabase
        .from("clientes")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (cliente.error) throw cliente.error;
      if (!cliente.data) {
        const novo = await supabase
          .from("clientes")
          .insert({
            user_id: user.id,
            nome: "Cliente Teste",
            telefone: "11999999999",
            email: "teste@example.com"
          })
          .select()
          .single();
        if (novo.error) throw novo.error;
        cliente = { data: novo.data, error: null, status: 201, statusText: "" } as any;
      }

      const hoje = new Date();
      const dataStr = hoje.toISOString().slice(0, 10);
      const horaStr = "10:00";
      const agendamento = await supabase
        .from("agendamentos")
        .insert({
          user_id: user.id,
          cliente_id: cliente.data!.id,
          servico_id: servico.data!.id,
          data: dataStr,
          hora: horaStr,
          duracao: 60,
          valor: 100,
          valor_devido: 0,
          status: "concluido",
          status_pagamento: "pago",
          forma_pagamento: "pix",
          observacoes: "Agendamento de teste fidelidade",
          origem: "manual",
          confirmado: true
        })
        .select()
        .single();
      if (agendamento.error) throw agendamento.error;

      await new Promise(r => setTimeout(r, 500));

      const { data: jaExiste } = await supabase
        .from("pontos_fidelidade")
        .select("id")
        .eq("user_id", user.id)
        .eq("origem", "agendamento")
        .eq("origem_id", agendamento.data!.id)
        .limit(1);
      if (!jaExiste || jaExiste.length === 0) {
        const ppr = Number((programa.data as any)?.pontos_por_real ?? 1);
        const pontosGanhosCalc = Math.floor(100 * (isNaN(ppr) ? 1 : ppr));
        if (pontosGanhosCalc > 0) {
          await supabase.from("pontos_fidelidade").insert({
            user_id: user.id,
            cliente_id: cliente.data!.id,
            pontos: pontosGanhosCalc,
            origem: "agendamento",
            origem_id: agendamento.data!.id,
            descricao: "Pontos ganhos no serviço concluído",
            data_expiracao:
              (programa.data as any)?.expiracao_pontos_dias &&
              (programa.data as any).expiracao_pontos_dias > 0
                ? new Date(
                    Date.now() +
                      (programa.data as any).expiracao_pontos_dias *
                        24 *
                        60 *
                        60 *
                        1000
                  )
                    .toISOString()
                    .slice(0, 10)
                : null,
            expirado: false,
          });
        }
      }

      const pontos = await supabase
        .from("pontos_fidelidade")
        .select("*")
        .eq("user_id", user.id)
        .eq("cliente_id", cliente.data!.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (pontos.error) throw pontos.error;

      const saldo = await supabase
        .from("saldo_pontos")
        .select("*")
        .eq("user_id", user.id)
        .eq("cliente_id", cliente.data!.id)
        .maybeSingle();
      if (saldo.error && saldo.error.code !== "PGRST116") throw saldo.error;

      const ranking = await supabase
        .from("ranking_fidelidade")
        .select("*")
        .eq("user_id", user.id)
        .eq("cliente_id", cliente.data!.id)
        .maybeSingle();
      if (ranking.error && ranking.error.code !== "PGRST116") throw ranking.error;

      setResultado({
        programaId: programa.data!.id,
        clienteId: cliente.data!.id,
        servicoId: servico.data!.id,
        agendamentoId: agendamento.data!.id,
        pontosGanhos: pontos.data && pontos.data.length > 0 ? pontos.data[0].pontos : 0,
        pontosDisponiveis: saldo.data ? (saldo.data as any).pontos_disponiveis : 0,
        rankingPosicao: ranking.data ? (ranking.data as any).ranking : null
      });
      toast.success("Teste executado com sucesso");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao executar teste");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Teste Rápido de Fidelidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={executarTeste} disabled={loading}>
            {loading ? "Executando..." : "Executar Teste"}
          </Button>
          {resultado && (
            <div className="text-sm space-y-1">
              <div>Programa: {resultado.programaId}</div>
              <div>Cliente: {resultado.clienteId}</div>
              <div>Serviço: {resultado.servicoId}</div>
              <div>Agendamento: {resultado.agendamentoId}</div>
              <div>Pontos ganhos: {resultado.pontosGanhos}</div>
              <div>Pontos disponíveis: {resultado.pontosDisponiveis}</div>
              <div>Posição no ranking: {resultado.rankingPosicao ?? "N/A"}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TesteFidelidade;
