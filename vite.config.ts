import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',  // Explicitly set the root directory
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'notification-badge.png'],
      manifest: {
        name: 'Persona - AI Agent Creation Platform',
        short_name: 'Persona',
        description: 'Create, customize, and manage AI agents with different personalities and skill sets',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/assets/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/vveuiuwsmndxmrmupnqj\.supabase\.co\/storage\/v1\/object\/public\/persona-avatars\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatar-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/vveuiuwsmndxmrmupnqj\.supabase\.co\/functions\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-calls',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});