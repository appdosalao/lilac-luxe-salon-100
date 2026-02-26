import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // PWA temporariamente desativado para limpar cache - 2025-01-11-v9
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: false
    //   },
    //   workbox: {
    //     cleanupOutdatedCaches: true,
    //     globPatterns: ['**/*.{html,ico,png,svg,webmanifest}'],
    //     maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'supabase-api',
    //           expiration: {
    //             maxEntries: 50,
    //             maxAgeSeconds: 60 * 60 * 24
    //           }
    //         }
    //       }
    //     ]
    //   },
    //   manifest: {
    //     name: 'Gerenciamento de Salão',
    //     short_name: 'GS',
    //     description: 'Sistema de Gerenciamento de Salão de Beleza',
    //     theme_color: '#ffffff',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: '/icons/icon-72x72.png',
    //         sizes: '72x72',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/icons/icon-96x96.png',
    //         sizes: '96x96',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/icons/icon-144x144.png',
    //         sizes: '144x144',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/icons/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/icons/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ]
    //   }
    // }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
        },
      },
    },
  },
}));
