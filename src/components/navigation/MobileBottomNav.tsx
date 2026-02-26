import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, DollarSign, MoreHorizontal, Users, Scissors, Clock, Megaphone, Package, Shield, Sparkles, Settings, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const fullNav = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Minha Agenda", href: "/minha-agenda", icon: Calendar },
  { title: "Clientes", href: "/clientes", icon: Users },
  { title: "Serviços", href: "/servicos", icon: Scissors },
  { title: "Cronogramas", href: "/cronogramas", icon: Clock },
  { title: "Financeiro", href: "/financeiro", icon: DollarSign },
  { title: "Marketing", href: "/marketing", icon: Megaphone },
  { title: "Produtos", href: "/produtos", icon: Package },
  { title: "Auditoria", href: "/auditoria", icon: Shield },
  { title: "Configurações", href: "/configuracoes", icon: Settings },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const grad = (href: string) => {
    if (href === "/") return "from-primary to-lilac-primary";
    if (href.startsWith("/minha-agenda")) return "from-lilac-primary to-pink-accent";
    if (href === "/financeiro") return "from-emerald-500 to-green-400";
    return "from-primary to-lilac-primary";
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="mx-auto grid grid-cols-4 gap-1 px-2 pt-1">
        <Link
          to="/"
          className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-accent/50 transition"
          aria-label="Início"
        >
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isActive("/") ? `bg-gradient-to-br ${grad("/")} text-white shadow-md` : "bg-muted text-muted-foreground"}`}>
            <Home className="h-4 w-4" />
          </div>
          <span className={`text-[11px] ${isActive("/") ? "text-primary font-medium" : "text-muted-foreground"}`}>Início</span>
        </Link>
        <Link
          to="/minha-agenda"
          className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-accent/50 transition"
          aria-label="Agenda"
        >
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isActive("/minha-agenda") ? `bg-gradient-to-br ${grad("/minha-agenda")} text-white shadow-md` : "bg-muted text-muted-foreground"}`}>
            <Calendar className="h-4 w-4" />
          </div>
          <span className={`text-[11px] ${isActive("/minha-agenda") ? "text-primary font-medium" : "text-muted-foreground"}`}>Agenda</span>
        </Link>
        <Link
          to="/financeiro"
          className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-accent/50 transition"
          aria-label="Financeiro"
        >
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isActive("/financeiro") ? `bg-gradient-to-br ${grad("/financeiro")} text-white shadow-md` : "bg-muted text-muted-foreground"}`}>
            <DollarSign className="h-4 w-4" />
          </div>
          <span className={`text-[11px] ${isActive("/financeiro") ? "text-primary font-medium" : "text-muted-foreground"}`}>Financeiro</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-accent/50 transition w-full"
              aria-label="Mais"
            >
              <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </div>
              <span className="text-[11px] text-muted-foreground">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl border-t border-border/60 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <SheetHeader>
              <SheetTitle>Todos os menus</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {fullNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 hover:bg-accent/40 transition"
                    aria-label={item.title}
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isActive(item.href) ? `bg-gradient-to-br ${grad(item.href)} text-white shadow-md` : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs text-foreground truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4">
              <a
                href="/agendamento-online"
                target="_blank"
                className="flex items-center justify-center gap-2 w-full"
                aria-label="Agendamento Online"
              >
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4" />
                  Agendamento Online
                </Button>
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
