import { useState as useStateReact } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Store, Phone, Mail, MapPin, Instagram, Facebook, MessageCircle, DollarSign, Clock, FileText, Image, Upload, X, Palette, Eye, Layout } from 'lucide-react';
import { useConfigAgendamentoOnline, ConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';
import { ScissorsLoader } from '@/components/ScissorsLoader';

export function ConfiguracaoAgendamentoOnline() {
  const { config, loading, saving, setConfig, salvarConfig } = useConfigAgendamentoOnline();
  const [uploadingLogo, setUploadingLogo] = useStateReact(false);
  const [uploadingBanner, setUploadingBanner] = useStateReact(false);
  const [previewLogoUrl, setPreviewLogoUrl] = useStateReact<string | null>(null);
  const [previewBannerUrl, setPreviewBannerUrl] = useStateReact<string | null>(null);

  const handleChange = (field: keyof ConfigAgendamentoOnline, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await salvarConfig(config);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      if (type === 'logo') setUploadingLogo(true);
      else setUploadingBanner(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const currentUrl = type === 'logo' ? config.logo_url : config.banner_url;
      if (currentUrl && currentUrl.includes('salon-logos')) {
        const oldPath = currentUrl.split('/salon-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('salon-logos').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('salon-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('salon-logos')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        handleChange('logo_url', publicUrl);
        setPreviewLogoUrl(publicUrl);
        toast.success('Logo atualizada!');
      } else {
        handleChange('banner_url', publicUrl);
        setPreviewBannerUrl(publicUrl);
        toast.success('Banner atualizado!');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleRemoveImage = async (type: 'logo' | 'banner') => {
    try {
      const currentUrl = type === 'logo' ? config.logo_url : config.banner_url;
      if (currentUrl && currentUrl.includes('salon-logos')) {
        const oldPath = currentUrl.split('/salon-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('salon-logos').remove([oldPath]);
        }
      }
      if (type === 'logo') {
        handleChange('logo_url', '');
        setPreviewLogoUrl(null);
      } else {
        handleChange('banner_url', '');
        setPreviewBannerUrl(null);
      }
      toast.success('Imagem removida');
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <ScissorsLoader />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ativação */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Status do Agendamento Online
          </CardTitle>
          <CardDescription>
            Ative ou desative o formulário de agendamento online público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="space-y-0.5">
              <Label htmlFor="ativo" className="text-base font-bold">Agendamento Online Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Quando ativo, clientes podem agendar através do link público
              </p>
            </div>
            <Switch
              id="ativo"
              checked={config.ativo}
              onCheckedChange={(checked) => handleChange('ativo', checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Visual e Personalização */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Visual e Personalização
          </CardTitle>
          <CardDescription>
            Personalize as imagens e cores do seu formulário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Logo e Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logo */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 font-bold">
                <Image className="h-4 w-4" />
                Logo/Foto Circular
              </Label>
              <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-primary/10 rounded-2xl bg-muted/30">
                {(config.logo_url || previewLogoUrl) ? (
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                      <img
                        src={previewLogoUrl || config.logo_url}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('logo')}
                      className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center border-4 border-white shadow-inner">
                    <Store className="h-10 w-10 text-primary/20" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="rounded-full px-6"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingLogo ? 'Enviando...' : 'Trocar Logo'}
                </Button>
                <input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" />
              </div>
            </div>

            {/* Banner */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2 font-bold">
                <Layout className="h-4 w-4" />
                Imagem de Capa (Banner)
              </Label>
              <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-primary/10 rounded-2xl bg-muted/30">
                {(config.banner_url || previewBannerUrl) ? (
                  <div className="relative group w-full">
                    <div className="w-full h-24 rounded-xl overflow-hidden border-4 border-white shadow-xl">
                      <img
                        src={previewBannerUrl || config.banner_url}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('banner')}
                      className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-xl bg-primary/5 flex items-center justify-center border-4 border-white shadow-inner">
                    <Image className="h-10 w-10 text-primary/20" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingBanner}
                  onClick={() => document.getElementById('banner-upload')?.click()}
                  className="rounded-full px-6"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingBanner ? 'Enviando...' : 'Trocar Capa'}
                </Button>
                <input id="banner-upload" type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} className="hidden" />
              </div>
            </div>
          </div>

          {/* Cores e Opções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3">
              <Label htmlFor="cor_primaria" className="font-bold">Cor de Destaque</Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="cor_primaria"
                  type="color"
                  value={config.cor_primaria || '#8B5CF6'}
                  onChange={(e) => handleChange('cor_primaria', e.target.value)}
                  className="w-16 h-12 p-1 rounded-lg cursor-pointer"
                />
                <Input
                  value={config.cor_primaria || '#8B5CF6'}
                  onChange={(e) => handleChange('cor_primaria', e.target.value)}
                  placeholder="#000000"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-bold">Opções de Exibição</Label>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm font-medium">Mostrar Preços</span>
                  <Switch checked={config.mostrar_precos} onCheckedChange={(v) => handleChange('mostrar_precos', v)} />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm font-medium">Mostrar Duração</span>
                  <Switch checked={config.mostrar_duracao} onCheckedChange={(v) => handleChange('mostrar_duracao', v)} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Salão */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Informações do Salão
          </CardTitle>
          <CardDescription>
            Dados que aparecerão no formulário de agendamento online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_salao" className="font-bold">Nome do Salão *</Label>
            <Input
              id="nome_salao"
              value={config.nome_salao}
              onChange={(e) => handleChange('nome_salao', e.target.value)}
              placeholder="Ex: Salão Beleza Pura"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="font-bold">Descrição Curta</Label>
            <Textarea
              id="descricao"
              value={config.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Breve descrição sobre seu salão"
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contato e Redes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-primary" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-xs font-bold uppercase text-muted-foreground">WhatsApp</Label>
              <Input id="whatsapp" value={config.whatsapp} onChange={(e) => handleChange('whatsapp', e.target.value)} placeholder="5511999999999" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco" className="text-xs font-bold uppercase text-muted-foreground">Endereço</Label>
              <Input id="endereco" value={config.endereco} onChange={(e) => handleChange('endereco', e.target.value)} placeholder="Rua..." className="h-11 rounded-xl" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Instagram className="h-4 w-4 text-primary" />
              Redes Sociais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-xs font-bold uppercase text-muted-foreground">Instagram</Label>
              <Input id="instagram" value={config.instagram} onChange={(e) => handleChange('instagram', e.target.value)} placeholder="@seuuser" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="text-xs font-bold uppercase text-muted-foreground">Facebook</Label>
              <Input id="facebook" value={config.facebook} onChange={(e) => handleChange('facebook', e.target.value)} placeholder="fb.com/user" className="h-11 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regras e Mensagens */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Regras e Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Sinal (%)</Label>
              <Input type="number" value={config.taxa_sinal_percentual} onChange={(e) => handleChange('taxa_sinal_percentual', Number(e.target.value))} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Ant. Mín (min)</Label>
              <Input type="number" value={config.tempo_minimo_antecedencia} onChange={(e) => handleChange('tempo_minimo_antecedencia', Number(e.target.value))} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Ant. Máx (dias)</Label>
              <Input type="number" value={Math.floor(config.tempo_maximo_antecedencia / 1440)} onChange={(e) => handleChange('tempo_maximo_antecedencia', Number(e.target.value) * 1440)} className="h-11 rounded-xl" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold">Boas-vindas</Label>
              <Textarea value={config.mensagem_boas_vindas} onChange={(e) => handleChange('mensagem_boas_vindas', e.target.value)} className="rounded-xl resize-none" rows={2} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Termos de Uso</Label>
              <Textarea value={config.termos_condicoes} onChange={(e) => handleChange('termos_condicoes', e.target.value)} className="rounded-xl resize-none" rows={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar Fixo/Flutuante no Mobile */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="w-full sm:w-auto h-14 sm:h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl transition-all active:scale-95"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </div>
          ) : (
            'Salvar Todas as Configurações'
          )}
        </Button>
      </div>

      {/* Link de Acesso com QR Code (Simulado) */}
      {config.ativo && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h3 className="text-lg font-bold text-primary flex items-center gap-2 justify-center sm:justify-start">
                  <Eye className="h-5 w-5" />
                  Seu Link Público Está Pronto!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Copie o link abaixo e coloque na sua Bio do Instagram ou envie para seus clientes no WhatsApp.
                </p>
                <div className="flex gap-2 pt-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/agendamento-online`}
                    className="bg-background/50 h-11 rounded-xl font-medium"
                  />
                  <Button
                    variant="default"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/agendamento-online`);
                      toast.success('Link copiado com sucesso! 🚀');
                    }}
                    className="h-11 rounded-xl px-6"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
