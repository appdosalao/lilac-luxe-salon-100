import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Plus, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Cliente, ClienteFormData } from "@/types/cliente";
import { toast } from "@/hooks/use-toast";

const clienteSchema = z.object({
  nomeCompleto: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^[\d\s\-\+\(\)]+$/, "Telefone deve conter apenas números e símbolos padrões"),
  servicoFrequente: z.string().min(2, "Serviço frequente é obrigatório"),
  ultimaVisita: z.date({
    message: "Data da última visita é obrigatória",
  }),
  observacoes: z.string().optional(),
});

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (data: ClienteFormData) => void;
  trigger?: React.ReactNode;
}

export default function ClienteForm({ cliente, onSubmit, trigger }: ClienteFormProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nomeCompleto: cliente?.nomeCompleto || "",
      email: cliente?.email || "",
      telefone: cliente?.telefone || "",
      servicoFrequente: cliente?.servicoFrequente || "",
      ultimaVisita: cliente?.ultimaVisita || new Date(),
      observacoes: cliente?.observacoes || "",
    },
  });

  const handleSubmit = (data: ClienteFormData) => {
    onSubmit(data);
    form.reset();
    setOpen(false);
    toast({
      title: cliente ? "Cliente atualizada" : "Cliente cadastrada",
      description: cliente 
        ? "Os dados da cliente foram atualizados com sucesso." 
        : "Nova cliente foi cadastrada com sucesso.",
    });
  };

  const defaultTrigger = (
    <Button className="bg-gradient-to-r from-primary to-lilac-primary shadow-lg hover:shadow-xl transition-all duration-300">
      <UserPlus className="mr-2 h-4 w-4" />
      Nova Cliente
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-lilac-primary bg-clip-text text-transparent">
            {cliente ? "Editar Cliente" : "Nova Cliente"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Nome Completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o nome completo"
                      className="border-border/50 focus:ring-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">E-mail</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="cliente@exemplo.com"
                      className="border-border/50 focus:ring-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(11) 99999-9999"
                      className="border-border/50 focus:ring-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="servicoFrequente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Serviço Frequente</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Corte e Escova"
                      className="border-border/50 focus:ring-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ultimaVisita"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-foreground font-medium">Última Visita</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal border-border/50",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre a cliente..."
                      className="min-h-[100px] border-border/50 focus:ring-primary resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-primary to-lilac-primary"
              >
                {cliente ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}