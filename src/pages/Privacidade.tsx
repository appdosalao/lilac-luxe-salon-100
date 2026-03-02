import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLogo } from '@/components/branding/AppLogo';
import { Separator } from '@/components/ui/separator';

const Privacidade = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-responsive">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="space-responsive text-center p-responsive">
          <div className="flex justify-center mb-2">
            <AppLogo size={56} rounded="xl" />
          </div>
          <CardTitle className="text-responsive-xl font-bold">Política de Privacidade</CardTitle>
          <CardDescription className="text-responsive-sm">
            Última atualização: 02/03/2026 • Conformidade com a LGPD (Lei nº 13.709/2018)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-responsive space-responsive">
          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Controlador e Contato</h2>
            <p className="text-muted-foreground">
              Este aplicativo é operado pelo responsável pelo suporte e desenvolvimento. Para exercer seus direitos e tratar questões de privacidade:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>E-mail: <span className="text-foreground font-medium">resellr7@gmail.com</span></li>
              <li>WhatsApp: <span className="text-foreground font-medium">+55 33 99854-2100</span></li>
            </ul>
          </section>

          <Separator />

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Dados Coletados</h2>
            <p className="text-muted-foreground">Coletamos e tratamos os seguintes dados pessoais, conforme as funcionalidades utilizadas:</p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Dados de conta: nome, e-mail, telefone, preferências de tema</li>
              <li>Dados operacionais: clientes, serviços, agendamentos, produtos, financeiro</li>
              <li>Dados técnicos: identificadores de sessão, logs de acesso, dispositivo e navegação</li>
              <li>Notificações: preferências de push, e-mail e sons; tokens para envio</li>
            </ul>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Finalidades e Bases Legais</h2>
            <p className="text-muted-foreground">Tratamos dados pessoais para:</p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Prestação do serviço e execução do contrato</li>
              <li>Comunicações operacionais e notificações de agendamentos</li>
              <li>Cumprimento de obrigações legais e fiscais aplicáveis</li>
              <li>Legítimo interesse na melhoria contínua e segurança do sistema</li>
            </ul>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Compartilhamento e Operadores</h2>
            <p className="text-muted-foreground">
              Dados podem ser tratados por provedores de serviços estritamente necessários (ex.: hospedagem, autenticação, processamento de pagamento) sob contratos e medidas de segurança adequadas. Não vendemos dados pessoais.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Cookies e Tecnologias</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies e armazenamento local para autenticação, preferências (tema, sons), performance e segurança. Você pode ajustar seu navegador para bloquear cookies, ciente de que certas funcionalidades podem não operar corretamente.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Retenção e Segurança</h2>
            <p className="text-muted-foreground">
              Mantemos dados pelo tempo necessário às finalidades e obrigações legais. Aplicamos medidas técnicas e organizacionais para proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Direitos do Titular</h2>
            <p className="text-muted-foreground">Nos termos da LGPD, você pode:</p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Solicitar confirmação de tratamento e acesso</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade, quando aplicável</li>
              <li>Informações sobre compartilhamentos e bases legais</li>
              <li>Revogar consentimento e opor-se a tratamentos em determinadas hipóteses</li>
            </ul>
            <p className="text-muted-foreground">
              Para exercer seus direitos, entre em contato pelos canais indicados em Controlador e Contato.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Transferências Internacionais</h2>
            <p className="text-muted-foreground">
              Caso haja transferência internacional, esta ocorrerá com garantias adequadas de proteção de dados e em conformidade com a LGPD.
            </p>
          </section>

          <section className="space-responsive-sm">
            <h2 className="text-responsive-lg font-semibold">Alterações desta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta Política para refletir melhorias ou requisitos legais. A versão vigente será sempre publicada nesta página.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacidade;
