import { MapPin, Phone, Mail, Instagram, Facebook, Clock } from 'lucide-react';

export function SalonFooter() {
  return (
    <footer className="w-full bg-card border-t border-border mt-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações de Contato */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-foreground mb-4">Contato</h3>
            
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">
                Rua Exemplo, 123 - Centro<br />
                São Paulo, SP - CEP 01234-567
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">(11) 99999-9999</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">contato@meusalao.com</span>
            </div>

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
              <a
                href="https://instagram.com/meusalao"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Instagram className="w-4 h-4 text-primary" />
                </div>
                <span>@meusalao</span>
              </a>

              <a
                href="https://facebook.com/meusalao"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Facebook className="w-4 h-4 text-primary" />
                </div>
                <span>/meusalao</span>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Meu Salão. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
