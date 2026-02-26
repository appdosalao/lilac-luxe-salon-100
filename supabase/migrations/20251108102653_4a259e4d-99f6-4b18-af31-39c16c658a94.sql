-- Criar bucket para logos de salões
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-logos', 'salon-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket salon-logos
-- Permitir visualização pública
CREATE POLICY "Public can view salon logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'salon-logos');

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload their own logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'salon-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir atualização apenas do próprio logo
CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'salon-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir exclusão apenas do próprio logo
CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'salon-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);