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

  const iconWrapClass = (active: boolean, gradient: string) => {
    const base =
      "relative h-9 w-9 rounded-2xl flex items-center justify-center transition-all duration-200 before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/55 before:to-transparent before:pointer-events-none";

    if (active) {
      return `${base} bg-gradient-to-br ${gradient} text-white ring-1 ring-white/25 shadow-[0_1px_0_0_hsl(0_0%_100%/0.20),0_14px_26px_-14px_hsl(var(--primary)/0.60)]`;
    }

    return `${base} bg-white/70 text-sidebar-primary shadow-[0_1px_0_0_hsl(0_0%_100%/0.90),0_12px_24px_-16px_hsl(var(--primary)/0.22)] group-hover:bg-white/85 group-hover:-translate-y-px dark:bg-white/10 dark:text-sidebar-foreground dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06),0_18px_30px_-18px_hsl(0_0%_0%/0.55)]`;
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="relative border-t border-primary/15 bg-gradient-to-b from-sidebar/90 to-background/85 backdrop-blur-xl shadow-[0_-18px_40px_-28px_hsl(var(--primary)/0.35)] before:content-[''] before:absolute before:left-3 before:right-3 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent dark:border-white/10 dark:from-sidebar dark:to-sidebar dark:before:via-white/10">
      <div className="mx-auto grid grid-cols-4 gap-1 px-2 pt-1">
        <Link
          to="/"
          className="group flex flex-col items-center gap-1 py-2 rounded-2xl hover:bg-white/35 transition"
          aria-label="Início"
        >
          <div className={iconWrapClass(isActive("/"), grad("/"))}>
            <Home className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <span className={`text-[11px] ${isActive("/") ? "text-primary font-medium" : "text-muted-foreground"}`}>Início</span>
        </Link>
        <Link
          to="/minha-agenda"
          className="group flex flex-col items-center gap-1 py-2 rounded-2xl hover:bg-white/35 transition"
          aria-label="Agenda"
        >
          <div className={iconWrapClass(isActive("/minha-agenda"), grad("/minha-agenda"))}>
            <Calendar className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <span className={`text-[11px] ${isActive("/minha-agenda") ? "text-primary font-medium" : "text-muted-foreground"}`}>Agenda</span>
        </Link>
        <Link
          to="/financeiro"
          className="group flex flex-col items-center gap-1 py-2 rounded-2xl hover:bg-white/35 transition"
          aria-label="Financeiro"
        >
          <div className={iconWrapClass(isActive("/financeiro"), grad("/financeiro"))}>
            <DollarSign className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <span className={`text-[11px] ${isActive("/financeiro") ? "text-primary font-medium" : "text-muted-foreground"}`}>Financeiro</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="group flex flex-col items-center gap-1 py-2 rounded-2xl hover:bg-white/35 transition w-full"
              aria-label="Mais"
            >
              <div className={iconWrapClass(false, "from-primary to-lilac-primary")}>
                <MoreHorizontal className="h-4 w-4" strokeWidth={2.2} />
              </div>
              <span className="text-[11px] text-muted-foreground">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-t border-primary/15 bg-gradient-to-b from-sidebar/95 to-background/95 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[0_-24px_70px_-45px_hsl(var(--primary)/0.40)]">
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
                    className="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-primary/10 bg-white/55 shadow-[0_1px_0_0_hsl(0_0%_100%/0.70),0_20px_40px_-30px_hsl(var(--primary)/0.18)] hover:bg-white/70 hover:-translate-y-px transition dark:bg-white/5 dark:border-white/10 dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06),0_22px_44px_-30px_hsl(0_0%_0%/0.65)]"
                    aria-label={item.title}
                  >
                    <div className={iconWrapClass(isActive(item.href), grad(item.href))}>
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
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
    </div>
  );
}
