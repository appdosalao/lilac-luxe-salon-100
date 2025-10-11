import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Marketing() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Marketing</h1>
        <p className="text-muted-foreground mt-2">
          Seção de marketing - pronta para ser construída
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo à seção de Marketing</CardTitle>
          <CardDescription>
            Esta área está limpa e pronta para receber novos recursos de marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configure seus recursos de marketing personalizados aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
