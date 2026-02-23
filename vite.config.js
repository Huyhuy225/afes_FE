import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  return {
    // Nếu đang chạy build để quăng lên GitHub thì dùng '/afes_FE/', còn chạy local thì dùng '/'
    base: command === 'dist' ? '/afes_FE/' : '/',
    plugins: [react()],
  }
})