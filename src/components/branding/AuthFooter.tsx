import { Link } from 'react-router-dom';
import { Mail, MessageCircle } from 'lucide-react';

export function AuthFooter() {
  return (
    <div className="mt-4 text-center space-y-2 text-muted-foreground">
      <div className="flex items-center justify-center gap-4 text-xs">
        <a
          href="mailto:suporte@lilacluxe.app"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Mail className="h-3 w-3" />
          suporte@lilacluxe.app
        </a>
        <a
          href="https://wa.me/5599999999999?text=Olá%20suporte%2C%20preciso%20de%20ajuda"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          <MessageCircle className="h-3 w-3" />
          WhatsApp
        </a>
      </div>
      <div className="text-xs">
        <Link to="/privacidade" className="hover:underline">Privacidade</Link>
        {' • '}
        <Link to="/termos" className="hover:underline">Termos de Uso</Link>
      </div>
      <div className="text-[10px]">© {new Date().getFullYear()} Lilac Luxe Salon</div>
    </div>
  );
}
