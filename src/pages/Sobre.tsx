import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLogo } from '@/components/branding/AppLogo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Users, Scissors, DollarSign, ShieldCheck, Sparkles } from 'lucide-react';

const features = [
  { icon: Calendar, title: 'Agendamentos Inteligentes', desc: 'Organize sua agenda diária, semanal e mensal com confirmação e lembretes.' },
  { icon: Users, title: 'Clientes e Fidelidade', desc: 'Cadastre clientes, histórico de serviços, pontos e recompensas.' },
  { icon: Scissors, title: 'Serviços e Produtos', desc: 'Gerencie serviços, produtos de revenda e uso profissional.' },
  { icon: DollarSign, title: 'Financeiro Completo', desc: 'Entradas, saídas, CMV, relatórios PDF/CSV e contas fixas.' },
  { icon: ShieldCheck, title: 'Privacidade e LGPD', desc: 'Tratamento de dados conforme a Lei Geral de Proteção de Dados.' },
  { icon: Sparkles, title: 'PWA e Push', desc: 'Instale como app e receba notificações com sons personalizados.' },
];

const Sobre = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-responsive">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AppLogo size={64} rounded="xl" />
          </div>
          <CardTitle className="text-responsive-xl">Salão de Bolso</CardTitle>
          <CardDescription className="text-responsive-sm">
            Sistema de gestão para salões e profissionais — agendamentos, clientes, serviços, produtos e financeiro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-responsive">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-4 border rounded-xl bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button asChild variant="default">
              <Link to="/login">Fazer Login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/cadastro">Criar Conta</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/privacidade">Privacidade</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/termos">Termos de Uso</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sobre;
