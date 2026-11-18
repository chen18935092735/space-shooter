import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 相对路径，方便挂到 GitHub Pages 子路径
  base: './',
})
