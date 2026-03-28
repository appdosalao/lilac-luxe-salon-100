import { Link, useLocation } from "react-router-dom";
import { usePWAContext } from "@/components/pwa/PWAProvider";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  DollarSign,
  Clock,
  Shield,
  Settings,
  LogOut,
  ExternalLink,
  Megaphone,
  Package,
  Download
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { AppLogo } from "@/components/branding/AppLogo";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Minha Agenda",
    href: "/minha-agenda",
    icon: Calendar,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Serviços",
    href: "/servicos",
    icon: Scissors,
  },
  {
    title: "Cronogramas",
    href: "/cronogramas",
    icon: Clock,
  },
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: DollarSign,
  },
  {
    title: "Marketing",
    href: "/marketing",
    icon: Megaphone,
  },
  {
    title: "Produtos",
    href: "/produtos",
    icon: Package,
  },
  {
    title: "Auditoria",
    href: "/auditoria",
    icon: Shield,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state, setOpen, setOpenMobile } = useSidebar() as any;
  const isMobileDevice = useIsMobile();
  const location = useLocation();
  const { usuario, logout } = useSupabaseAuth();
  const { isInstallable, isInstalled, installApp } = usePWAContext();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleNavClick = () => {
    // Em qualquer dispositivo: retrair/fechar ao selecionar
    try {
      if (isMobileDevice) {
        // Fecha o sheet no mobile
        setOpenMobile?.(false);
      } else {
        // Colapsa para ícones no desktop
        setOpen(false);
      }
    } catch {}
  };

  const badgeFor = (href: string) => {
    if (href === "/") return "from-primary to-lilac-primary";
    if (href.startsWith("/minha-agenda") || href === "/agendamentos" || href === "/agenda") return "from-lilac-primary to-pink-accent";
    if (href === "/clientes") return "from-indigo-500 to-sky-400";
    if (href === "/servicos") return "from-rose-500 to-pink-400";
    if (href === "/cronogramas") return "from-amber-500 to-yellow-400";
    if (href === "/financeiro") return "from-emerald-500 to-green-400";
    if (href === "/marketing") return "from-fuchsia-500 to-violet-400";
    if (href === "/produtos") return "from-purple-500 to-violet-500";
    if (href === "/auditoria") return "from-slate-500 to-slate-400";
    if (href === "/assinatura") return "from-yellow-500 to-amber-400";
    if (href === "/configuracoes") return "from-stone-500 to-stone-400";
    return "from-primary to-lilac-primary";
  };

  const iconWrapClass = (active: boolean, gradient: string) => {
    const base =
      "relative h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200 before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/65 before:to-transparent before:pointer-events-none";

    if (active) {
      return `${base} bg-gradient-to-br ${gradient} text-white ring-1 ring-white/25 shadow-[0_1px_0_0_hsl(0_0%_100%/0.25),0_14px_26px_-14px_hsl(var(--primary)/0.55)] dark:ring-white/10 dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.10),0_18px_32px_-18px_hsl(0_0%_0%/0.55)]`;
    }

    return `${base} bg-white/60 text-sidebar-primary shadow-[0_1px_0_0_hsl(0_0%_100%/0.80),0_12px_24px_-16px_hsl(var(--primary)/0.20)] group-hover:bg-white/75 group-hover:-translate-y-px dark:bg-white/10 dark:text-sidebar-foreground dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06),0_18px_32px_-18px_hsl(0_0%_0%/0.55)]`;
  };

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success("O aplicativo já está instalado");
      return;
    }

    if (isInstallable) {
      await installApp();
      return;
    }

    const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);

    if (isIOS) {
      toast.message("Para instalar no iPhone/iPad: Compartilhar → Adicionar à Tela de Início");
      return;
    }

    toast.message("Para instalar: use o menu do navegador (⋮) e escolha “Instalar aplicativo”");
  };

  return (
    <Sidebar 
      className="border-r border-sidebar-border/60 bg-transparent [&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-lilac-lighter/90 [&_[data-sidebar=sidebar]]:to-sidebar [&_[data-sidebar=sidebar]]:shadow-[0_1px_0_0_hsl(0_0%_100%/0.65),0_22px_60px_-40px_hsl(var(--primary)/0.22)] dark:[&_[data-sidebar=sidebar]]:from-sidebar dark:[&_[data-sidebar=sidebar]]:to-sidebar dark:[&_[data-sidebar=sidebar]]:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06),0_30px_70px_-45px_hsl(0_0%_0%/0.60)] transition-all duration-300 ease-in-out"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border/60 bg-white/35 backdrop-blur-xl dark:bg-white/5">
        <div className="flex items-center gap-2 p-2">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent blur" />
            <div className="relative rounded-2xl bg-white/55 p-1 shadow-[0_1px_0_0_hsl(0_0%_100%/0.70),0_14px_30px_-18px_hsl(var(--primary)/0.25)] dark:bg-white/10 dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06),0_18px_36px_-20px_hsl(0_0%_0%/0.55)]">
              <AppLogo size={28} rounded="xl" />
            </div>
          </div>
          {state === "expanded" && (
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold bg-gradient-to-r from-primary to-lilac-primary bg-clip-text text-transparent truncate">
                {usuario?.nome_personalizado_app || 'Sistema'}
              </h2>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {usuario?.nome_completo}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={active}
                      className="group relative h-11 rounded-xl px-3 py-2 overflow-hidden transition-all duration-200 hover:bg-white/40 hover:-translate-y-px active:translate-y-0 data-[active=true]:bg-gradient-to-b data-[active=true]:from-white/75 data-[active=true]:to-white/45 data-[active=true]:text-sidebar-foreground data-[active=true]:ring-1 data-[active=true]:ring-primary/15 data-[active=true]:shadow-[0_1px_0_0_hsl(0_0%_100%/0.80),0_22px_44px_-30px_hsl(var(--primary)/0.40)] data-[active=true]:before:content-[''] data-[active=true]:before:absolute data-[active=true]:before:inset-0 data-[active=true]:before:bg-gradient-to-b data-[active=true]:before:from-white/55 data-[active=true]:before:to-transparent data-[active=true]:before:pointer-events-none data-[active=true]:after:content-[''] data-[active=true]:after:absolute data-[active=true]:after:left-3 data-[active=true]:after:right-3 data-[active=true]:after:top-0 data-[active=true]:after:h-px data-[active=true]:after:bg-gradient-to-r data-[active=true]:after:from-transparent data-[active=true]:after:via-white/80 data-[active=true]:after:to-transparent data-[active=true]:after:pointer-events-none dark:hover:bg-white/10 dark:data-[active=true]:bg-white/10 dark:data-[active=true]:ring-white/10 dark:data-[active=true]:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06),0_22px_44px_-30px_hsl(0_0%_0%/0.65)]"
                    >
                      <Link to={item.href} className="flex items-center gap-3" onClick={handleNavClick}>
                        <div className={iconWrapClass(active, badgeFor(item.href))}>
                          <Icon className="h-4 w-4 flex-shrink-0" />
                        </div>
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Links Externos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleInstallClick}
                  className="group h-11 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-white/40 hover:-translate-y-px active:translate-y-0 dark:hover:bg-white/10"
                >
                  <div className={iconWrapClass(false, "from-primary to-lilac-primary")}>
                    <Download className="h-4 w-4 flex-shrink-0" />
                  </div>
                  <span className="truncate">Instalar App</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="group h-11 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-white/40 hover:-translate-y-px active:translate-y-0 dark:hover:bg-white/10"
                >
                  <Link 
                    to="/agendamento-online" 
                    target="_blank"
                    className="flex items-center gap-2 text-primary"
                  >
                    <div className={iconWrapClass(false, "from-primary to-lilac-primary")}>
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                    </div>
                    <span className="truncate">Agendamento Online</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => void logout()}
              className="group h-11 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-destructive/10 hover:-translate-y-px active:translate-y-0"
            >
              <div className="relative h-8 w-8 rounded-xl flex items-center justify-center bg-white/60 text-destructive shadow-[0_1px_0_0_hsl(0_0%_100%/0.80),0_12px_24px_-16px_hsl(0_84%_55%/0.18)] before:content-[''] before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/65 before:to-transparent before:pointer-events-none group-hover:bg-white/75 group-hover:-translate-y-px dark:bg-white/10 dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06),0_18px_32px_-18px_hsl(0_0%_0%/0.55)]">
                <LogOut className="h-4 w-4 flex-shrink-0" />
              </div>
              <span className="truncate">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
