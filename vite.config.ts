import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

import { cloudflare } from "@cloudflare/vite-plugin";

import { tanstackRouter } from '@tanstack/router-plugin/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  tailwindcss(),
  tanstackRouter({
    target: 'react',
    autoCodeSplitting: true,
    routesDirectory: './frontend/routes',
    generatedRouteTree: './frontend/routeTree.gen.ts',
  }),
  cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend"),
      "@worker": path.resolve(__dirname, "./worker"),
    },
  },
})