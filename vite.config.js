import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Plugin Tailwind CSS v4
    VitePWA({
      registerType: 'autoUpdate',
      // File-file di folder public yang ingin di-cache secara offline
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Digital Safety Induction',
        short_name: 'SafetyInduct',
        description: 'Aplikasi edukasi dan persetujuan keselamatan kerja (K3)',
        theme_color: '#facc15', // Warna kuning UI
        background_color: '#f8fafc', // Warna background slate-50
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon.png', // Menggunakan file maskable yang dibuat dari Lucide
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})