import { MapPin, Phone, Mail, Instagram, Facebook, Clock } from 'lucide-react';
import { useConfigAgendamentoOnline } from '@/hooks/useConfigAgendamentoOnline';

export function SalonFooter() {
  const { config } = useConfigAgendamentoOnline();

  return (
    <footer className="w-full bg-card border-t border-border mt-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações de Contato */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-foreground mb-4">Contato</h3>
            
            {config.endereco && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{config.endereco}</span>
              </div>
            )}

            {config.telefone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{config.telefone}</span>
              </div>
            )}

            {config.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{config.email}</span>
              </div>
            )}

            <div className="flex items-start gap-3 text-sm">
              <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">
                Segunda a Sexta: 9h às 18h<br />
                Sábado: 9h às 14h
              </span>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-foreground mb-4">Redes Sociais</h3>
            
            <div className="space-y-3">
              {config.instagram && (
                <a
                  href={config.instagram.startsWith('http') ? config.instagram : `https://instagram.com/${config.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Instagram className="w-4 h-4 text-primary" />
                  </div>
                  <span>{config.instagram}</span>
                </a>
              )}

              {config.facebook && (
                <a
                  href={config.facebook.startsWith('http') ? config.facebook : `https://facebook.com/${config.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Facebook className="w-4 h-4 text-primary" />
                  </div>
                  <span>{config.facebook}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {config.nome_salao}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
