import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TesteSom } from '@/components/notificacoes/TesteSom';
import { AppLogo } from '@/components/branding/AppLogo';

const TesteSomPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-responsive">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <AppLogo size={56} rounded="xl" />
          </div>
          <CardTitle>Teste de Sons</CardTitle>
          <CardDescription>Clique para reproduzir os sons configurados</CardDescription>
        </CardHeader>
        <CardContent>
          <TesteSom />
        </CardContent>
      </Card>
    </div>
  );
};

export default TesteSomPage;
