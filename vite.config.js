import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Thay 'afes_FE' bằng đúng tên repository của bạn trên GitHub
  base: '/afes_FE/',
  plugins: [react()],
})