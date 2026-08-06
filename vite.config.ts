import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- Add this

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), // <--- And this
  tailwindcss(), cloudflare()],
})