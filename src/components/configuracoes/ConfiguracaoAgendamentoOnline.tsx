import { useState as useStateReact } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Store, Phone, Mail, MapPin, Instagram, Facebook, MessageCircle, DollarSign, Clock, FileText, Image, Upload, X } from 'lucide-react';
import { useConfigAgendamentoOnline, ConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';

export function ConfiguracaoAgendamentoOnline() {
  const { config, loading, saving, setConfig, salvarConfig } = useConfigAgendamentoOnline();
  const [uploading, setUploading] = useStateReact(false);
  const [previewUrl, setPreviewUrl] = useStateReact<string | null>(null);

  const handleChange = (field: keyof ConfigAgendamentoOnline, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await salvarConfig(config);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Validar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      setUploading(true);

      // Obter user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Deletar logo anterior se existir
      if (config.logo_url && config.logo_url.includes('salon-logos')) {
        const oldPath = config.logo_url.split('/salon-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('salon-logos').remove([oldPath]);
        }
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError, data } = await supabase.storage
        .from('salon-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('salon-logos')
        .getPublicUrl(fileName);

      // Atualizar config com nova URL
      handleChange('logo_url', publicUrl);
      setPreviewUrl(publicUrl);
      toast.success('Logo atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      if (config.logo_url && config.logo_url.includes('salon-logos')) {
        const oldPath = config.logo_url.split('/salon-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('salon-logos').remove([oldPath]);
        }
      }
      handleChange('logo_url', '');
      setPreviewUrl(null);
      toast.success('Logo removida');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ativação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Status do Agendamento Online
          </CardTitle>
          <CardDescription>
            Ative ou desative o formulário de agendamento online público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ativo">Agendamento Online Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Quando ativo, clientes podem agendar através do link público
              </p>
            </div>
            <Switch
              id="ativo"
              checked={config.ativo}
              onCheckedChange={(checked) => handleChange('ativo', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações do Salão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Informações do Salão
          </CardTitle>
          <CardDescription>
            Dados que aparecerão no formulário de agendamento online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_salao">Nome do Salão *</Label>
            <Input
              id="nome_salao"
              value={config.nome_salao}
              onChange={(e) => handleChange('nome_salao', e.target.value)}
              placeholder="Ex: Salão Beleza Pura"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={config.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Breve descrição sobre seu salão"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Logo/Foto do Salão
            </Label>
            
            {/* Preview da imagem */}
            {(config.logo_url || previewUrl) && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border">
                <img
                  src={previewUrl || config.logo_url}
                  alt="Logo do salão"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Upload de arquivo */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Enviando...' : 'Fazer Upload'}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: JPG, PNG, WEBP (máx. 2MB)
            </p>

            {/* Opção alternativa: URL externa */}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="logo_url" className="text-xs text-muted-foreground">
                Ou cole uma URL externa:
              </Label>
              <Input
                id="logo_url"
                value={config.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
          <CardDescription>
            Dados de contato exibidos no rodapé do formulário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefone
            </Label>
            <Input
              id="telefone"
              value={config.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={config.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="contato@seusalao.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </Label>
            <Input
              id="endereco"
              value={config.endereco}
              onChange={(e) => handleChange('endereco', e.target.value)}
              placeholder="Rua Exemplo, 123 - Centro"
            />
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle>Redes Sociais</CardTitle>
          <CardDescription>
            Links para suas redes sociais (aparecerão no rodapé)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Instagram
            </Label>
            <Input
              id="instagram"
              value={config.instagram}
              onChange={(e) => handleChange('instagram', e.target.value)}
              placeholder="@seusalao"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </Label>
            <Input
              id="facebook"
              value={config.facebook}
              onChange={(e) => handleChange('facebook', e.target.value)}
              placeholder="facebook.com/seusalao"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Label>
            <Input
              id="whatsapp"
              value={config.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              placeholder="5500000000000"
            />
            <p className="text-xs text-muted-foreground">
              Apenas números (com código do país e DDD)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Regras de Agendamento
          </CardTitle>
          <CardDescription>
            Configure as regras para agendamentos online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxa_sinal" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Taxa de Sinal (%)
            </Label>
            <Input
              id="taxa_sinal"
              type="number"
              min="0"
              max="100"
              value={config.taxa_sinal_percentual}
              onChange={(e) => handleChange('taxa_sinal_percentual', Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Percentual cobrado como adiantamento (0 para não cobrar)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tempo_min">Antecedência Mínima (minutos)</Label>
            <Input
              id="tempo_min"
              type="number"
              min="0"
              value={config.tempo_minimo_antecedencia}
              onChange={(e) => handleChange('tempo_minimo_antecedencia', Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Tempo mínimo para agendar antes do horário (ex: 60 minutos)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tempo_max">Antecedência Máxima (dias)</Label>
            <Input
              id="tempo_max"
              type="number"
              min="1"
              value={Math.floor(config.tempo_maximo_antecedencia / 1440)}
              onChange={(e) => handleChange('tempo_maximo_antecedencia', Number(e.target.value) * 1440)}
            />
            <p className="text-xs text-muted-foreground">
              Quantos dias no futuro o cliente pode agendar (ex: 30 dias)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mensagens Personalizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mensagens Personalizadas
          </CardTitle>
          <CardDescription>
            Personalize as mensagens exibidas no formulário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="msg_boas_vindas">Mensagem de Boas-Vindas</Label>
            <Textarea
              id="msg_boas_vindas"
              value={config.mensagem_boas_vindas}
              onChange={(e) => handleChange('mensagem_boas_vindas', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="termos">Termos e Condições</Label>
            <Textarea
              id="termos"
              value={config.termos_condicoes}
              onChange={(e) => handleChange('termos_condicoes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="msg_confirmacao">Mensagem de Confirmação</Label>
            <Textarea
              id="msg_confirmacao"
              value={config.mensagem_confirmacao}
              onChange={(e) => handleChange('mensagem_confirmacao', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Link de Acesso */}
      {config.ativo && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Link de Agendamento Online</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Compartilhe este link com seus clientes para que eles possam agendar online:
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/agendamento-online`}
                className="bg-background"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/agendamento-online`);
                  toast.success('Link copiado!');
                }}
              >
                Copiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
