import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Esto le dice a Vite que la app no está en la raíz, sino en /mercadeo/
  base: '/mercadeo/',
})