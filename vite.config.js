import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['favicon.svg', 'favicon.png', 'favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'RestroMind AI — Digital Menu & Operating System',
        short_name: 'RestroMind',
        description: 'Next-Generation Digital Menu & Smart Restaurant Management Platform',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/dashboard',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Live Orders KDS',
            short_name: 'Orders',
            description: 'Open active kitchen orders dashboard',
            url: '/orders',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Menu Management',
            short_name: 'Menu',
            description: 'Manage digital menu and categories',
            url: '/menu',
            icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        importScripts: ['/sw-custom.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /\/api\/public\/menu\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'public-menu-api-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: /\/api\/orders\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'orders-api-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 12 }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
  },
})
