import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLogo } from '@/components/branding/AppLogo';
import { Separator } from '@/components/ui/separator';

const Termos = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-responsive">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="space-responsive text-center p-responsive">
          <div className="flex justify-center mb-2">
            <AppLogo size={56} rounded="xl" />
          </div>
          <CardTitle className="text-responsive-xl font-bold">Termos de Uso</CardTitle>
          <CardDescription className="text-responsive-sm">
            Última atualização: 02/03/2026 • Leia atentamente antes de utilizar o aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-responsive space-responsive">
          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Aceitação</h2>
            <p className="text-muted-foreground">
              Ao criar uma conta ou utilizar o aplicativo, você concorda com estes Termos e com a nossa Política de Privacidade. Caso não concorde, não utilize o serviço.
            </p>
          </section>

          <Separator />

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Objeto do Serviço</h2>
            <p className="text-muted-foreground">
              O aplicativo oferece funcionalidades de gestão de salões e profissionais, incluindo agendamentos, cadastro de clientes, serviços, produtos e controle financeiro.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Cadastro e Conta</h2>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Você é responsável pela veracidade das informações fornecidas.</li>
              <li>Mantenha suas credenciais em sigilo e não as compartilhe.</li>
              <li>Informe imediatamente caso detecte acesso indevido à sua conta.</li>
            </ul>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Acesso Vitalício e Pagamentos</h2>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>O acesso ao sistema é concedido por meio de pagamento único (licença vitalícia).</li>
              <li>O pagamento é processado por provedor externo (Cakto) e está sujeito às regras do provedor.</li>
              <li>Encargos e tributos aplicáveis podem ser adicionados conforme a legislação.</li>
            </ul>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Cancelamento e Reembolsos</h2>
            <p className="text-muted-foreground">
              Reembolsos, quando aplicáveis, seguirão a política do meio de pagamento utilizado (Cakto) e a legislação vigente.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Uso Adequado</h2>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>É proibido utilizar o serviço para fins ilícitos ou violar direitos de terceiros.</li>
              <li>Não tente acessar áreas não autorizadas, explorar falhas ou interferir na operação.</li>
              <li>Não publique ou armazene conteúdos ofensivos, discriminatórios ou ilegais.</li>
            </ul>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              O aplicativo, suas marcas, elementos visuais, código e documentações são protegidos por leis de propriedade intelectual. É vedada a reprodução sem autorização.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Disponibilidade e Alterações</h2>
            <p className="text-muted-foreground">
              Poderemos realizar manutenções, melhorias ou alterações no serviço. Envidamos esforços para alta disponibilidade, sem garantia absoluta de funcionamento contínuo.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              Na medida permitida pela legislação, não nos responsabilizamos por lucros cessantes, perdas de dados ou danos indiretos decorrentes do uso ou indisponibilidade do serviço.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Conformidade Legal</h2>
            <p className="text-muted-foreground">
              Tratamos dados pessoais conforme a LGPD e demais normas aplicáveis. Detalhes constam em nossa Política de Privacidade.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Contato</h2>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>E-mail: <span className="text-foreground font-medium">resellr7@gmail.com</span></li>
              <li>WhatsApp: <span className="text-foreground font-medium">+55 33 99854-2100</span></li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Termos;
