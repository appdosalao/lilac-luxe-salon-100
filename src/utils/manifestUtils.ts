import { Usuario } from '@/types/usuario';

export interface CustomManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  orientation: string;
  theme_color: string;
  background_color: string;
  scope: string;
  lang: string;
  categories: string[];
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose: string;
  }>;
  shortcuts: Array<{
    name: string;
    short_name: string;
    description: string;
    url: string;
    icons: Array<{
      src: string;
      sizes: string;
    }>;
  }>;
  prefer_related_applications: boolean;
}

export const updateManifest = (usuario: Usuario | null) => {
  if (!usuario) return;

  const appName = usuario.nome_personalizado_app || 'Sistema do Salão';
  const shortName = appName.length > 12 ? 
    appName.substring(0, 12).trim() + '...' : 
    appName;

  const manifest: CustomManifest = {
    name: appName,
    short_name: shortName,
    description: `Sistema completo de gestão para ${appName}`,
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#D6B2E7",
    background_color: "#FFFFFF",
    scope: "/",
    lang: "pt-BR",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-48x48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    shortcuts: [
      {
        name: "Agendamentos",
        short_name: "Agenda",
        description: "Ver agendamentos do dia",
        url: "/agendamentos",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192"
          }
        ]
      },
      {
        name: "Clientes",
        short_name: "Clientes",
        description: "Gerenciar clientes",
        url: "/clientes",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192"
          }
        ]
      },
      {
        name: "Financeiro",
        short_name: "Financeiro",
        description: "Controle financeiro",
        url: "/financeiro",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192"
          }
        ]
      }
    ],
    prefer_related_applications: false
  };

  // Criar um blob com o manifest atualizado
  const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json'
  });
  
  // Criar URL do manifest
  const manifestURL = URL.createObjectURL(manifestBlob);
  
  // Atualizar ou criar o link do manifest no head
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  
  manifestLink.href = manifestURL;
  
  // Atualizar meta tags relacionadas
  updateMetaTags(appName);
};

const updateMetaTags = (appName: string) => {
  // Atualizar título da página
  document.title = appName;
  
  // Atualizar meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', `Sistema completo de gestão para ${appName}`);
  }
  
  // Atualizar theme-color
  let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.content = '#D6B2E7';
  
  // Atualizar apple-mobile-web-app-title
  let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement;
  if (!appleTitleMeta) {
    appleTitleMeta = document.createElement('meta');
    appleTitleMeta.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleTitleMeta);
  }
  appleTitleMeta.content = appName;
  
  // Atualizar apple-mobile-web-app-capable
  let appleCapableMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement;
  if (!appleCapableMeta) {
    appleCapableMeta = document.createElement('meta');
    appleCapableMeta.name = 'apple-mobile-web-app-capable';
    document.head.appendChild(appleCapableMeta);
  }
  appleCapableMeta.content = 'yes';
  
  // Atualizar apple-mobile-web-app-status-bar-style
  let appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
  if (!appleStatusMeta) {
    appleStatusMeta = document.createElement('meta');
    appleStatusMeta.name = 'apple-mobile-web-app-status-bar-style';
    document.head.appendChild(appleStatusMeta);
  }
  appleStatusMeta.content = 'default';
  
  // Adicionar ícones para iOS
  const iosIconSizes = ['57x57', '60x60', '72x72', '76x76', '114x114', '120x120', '144x144', '152x152', '180x180'];
  
  iosIconSizes.forEach(size => {
    let iosIconLink = document.querySelector(`link[rel="apple-touch-icon"][sizes="${size}"]`) as HTMLLinkElement;
    if (!iosIconLink) {
      iosIconLink = document.createElement('link');
      iosIconLink.rel = 'apple-touch-icon';
      iosIconLink.setAttribute('sizes', size);
      document.head.appendChild(iosIconLink);
    }
    // Usar o ícone mais próximo disponível
    if (size.includes('192') || size.includes('180') || size.includes('152')) {
      iosIconLink.href = '/icons/icon-192x192.png';
    } else {
      iosIconLink.href = '/icons/icon-144x144.png';
    }
  });
};