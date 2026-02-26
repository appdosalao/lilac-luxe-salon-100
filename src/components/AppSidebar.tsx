import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  Sparkles,
  ExternalLink,
  Megaphone,
  Package
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
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const { state, setOpen, open, setOpenMobile, isMobile } = useSidebar() as any;
  const isMobileDevice = useIsMobile();
  const location = useLocation();
  const { usuario, signOut } = useSupabaseAuth();
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

  return (
    <Sidebar 
      className="border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300 ease-in-out"
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="border-b border-border/50">
        <div className="flex items-center gap-2 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-lilac-light flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {state === "expanded" && (
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold bg-gradient-to-r from-primary to-lilac-primary bg-clip-text text-transparent truncate">
                {usuario?.nome_personalizado_app || 'Sistema'}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
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
                      className="data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary data-[active=true]:to-lilac-primary data-[active=true]:text-primary-foreground group"
                    >
                      <Link to={item.href} className="flex items-center gap-3" onClick={handleNavClick}>
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${active ? `bg-gradient-to-br ${badgeFor(item.href)} text-white shadow-md` : "bg-muted text-muted-foreground group-hover:bg-accent/50"}`}>
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
                <SidebarMenuButton asChild>
                  <Link 
                    to="/agendamento-online" 
                    target="_blank"
                    className="flex items-center gap-2 text-primary"
                  >
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
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
              onClick={signOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
